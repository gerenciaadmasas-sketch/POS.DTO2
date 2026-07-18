import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VALORES_PLAN: Record<string, number> = {
  chispa: 49000,
  fuego:  129000,
  cosmos: 249000,
};

serve(async (req) => {
  try {
    const event = await req.json();

    // Solo procesar transaction.updated
    if (event.event !== "transaction.updated") {
      return new Response("OK", { status: 200 });
    }

    const tx = event.data.transaction;

    // Verificar firma: SHA256(tx.id + tx.status + tx.amount_in_cents + eventsSecret)
    const eventsSecret = Deno.env.get("WOMPI_EVENTS_SECRET")!;
    const rawStr = `${tx.id}${tx.status}${tx.amount_in_cents}${eventsSecret}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawStr));
    const computed = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (computed !== event.signature?.checksum) {
      console.error("[wompi-webhook] Firma inválida");
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Marcar como fallido si fue rechazado
    if (tx.status !== "APPROVED") {
      const { data: pendingFallido } = await supabase
        .from("wompi_transacciones_pendientes")
        .select()
        .eq("reference", tx.reference)
        .maybeSingle();

      await supabase.from("wompi_transacciones_pendientes")
        .update({ estado: "fallido", wompi_transaction_id: tx.id })
        .eq("reference", tx.reference);

      // Actualizar prospecto con la nota de pago fallido
      if (pendingFallido?.prospecto_id) {
        await supabase.from("prospectos")
          .update({
            notas: `Pago fallido en Wompi · ref: ${tx.reference} · estado: ${tx.status}`,
          })
          .eq("id", pendingFallido.prospecto_id);
      }

      return new Response("OK", { status: 200 });
    }

    // Obtener datos de la transacción pendiente
    const { data: pending } = await supabase
      .from("wompi_transacciones_pendientes")
      .select()
      .eq("reference", tx.reference)
      .maybeSingle();

    if (!pending) {
      console.error("[wompi-webhook] Transacción no encontrada:", tx.reference);
      return new Response("Not found", { status: 404 });
    }

    if (pending.estado === "procesado") {
      return new Response("Already processed", { status: 200 });
    }

    // ── Generar usuario único ──
    const nombre  = (pending.nombre?.trim().split(" ")[0]  ?? "").toLowerCase();
    const apellido = (pending.apellido?.trim().split(" ")[0] ?? "").toLowerCase();
    const usuarioBase =
      nombre.charAt(0).toUpperCase() +
      apellido.charAt(0).toUpperCase() + apellido.slice(1);

    let usuario = usuarioBase;
    let intento = 1;
    while (true) {
      const { data: existe } = await supabase
        .from("usuarios").select("id").eq("usuario", usuario).maybeSingle();
      if (!existe) break;
      intento++;
      usuario = `${usuarioBase}${intento}`;
    }

    const password = pending.cedula
      ? pending.cedula.replace(/\D/g, "") || "123456"
      : "123456";
    const nombreEmpresa = pending.empresa || `${pending.nombre} ${pending.apellido}`.trim();

    // 1. Crear empresa
    const { data: empresa, error: errEmp } = await supabase
      .from("empresa")
      .insert({ razon_social: nombreEmpresa })
      .select()
      .maybeSingle();
    if (errEmp) throw errEmp;

    const email = `${usuario}@emp${empresa.id}.pos`;

    // 2. Crear usuario administrador via dynamic-worker
    const { error: errUser } = await supabase.functions.invoke("dynamic-worker", {
      body: {
        email, password, usuario,
        nombres:    pending.nombre,
        apellidos:  pending.apellido,
        nro_doc:    pending.cedula ?? "",
        id_empresa: empresa.id,
        tipo:       "administrador",
        permisos: {
          ventas: true, cobrar_venta: true, configuracion: true,
          impresoras: true, empresa: true, categorias: true,
          productos: true, clientes: true, proveedores: true,
          sucursales_cajas: true, usuarios: true, almacenes: true,
          inventario: true, kardex: true, dashboard: true,
          config_ticket: true, serializacion: true,
        },
      },
    });
    if (errUser) {
      await supabase.from("empresa").delete().eq("id", empresa.id);
      throw errUser;
    }

    await supabase.from("usuarios")
      .update({ email })
      .eq("usuario", usuario)
      .eq("id_empresa", empresa.id);

    const { data: adminUser } = await supabase.from("usuarios")
      .select("id").eq("usuario", usuario).eq("id_empresa", empresa.id).maybeSingle();

    if (adminUser) {
      await supabase.from("empresa").update({ id_usuario: adminUser.id }).eq("id", empresa.id);
    }

    // 3. Crear sucursal y almacén principales
    const { data: sucursal } = await supabase
      .from("sucursales")
      .insert({ id_empresa: empresa.id, razon_social: nombreEmpresa, direccion: "" })
      .select().maybeSingle();

    if (sucursal) {
      const { data: almacen } = await supabase
        .from("almacenes")
        .insert({ id_empresa: empresa.id, id_sucursal: sucursal.id, nombre: "Principal" })
        .select().maybeSingle();

      if (adminUser && almacen) {
        await supabase.from("usuarios")
          .update({ id_sucursal: sucursal.id, id_almacen: almacen.id })
          .eq("id", adminUser.id);
      }
    }

    // 4. Crear suscripción
    const billing = pending.billing;
    const meses   = billing === "anual" ? 12 : 1;
    const hoy     = new Date();
    const proximoPago = new Date(hoy.getFullYear(), hoy.getMonth() + meses, hoy.getDate());

    // Hash SHA-256 de la contraseña antes de guardar en suscripciones
    const pwRaw  = new TextEncoder().encode(password);
    const pwBuf  = await crypto.subtle.digest("SHA-256", pwRaw);
    const pwHash = Array.from(new Uint8Array(pwBuf)).map(b => b.toString(16).padStart(2, "0")).join("");

    await supabase.from("suscripciones").insert({
      nombre_cliente:       pending.nombre,
      apellido_cliente:     pending.apellido,
      cedula_cliente:       pending.cedula ?? "",
      telefono:             pending.telefono ?? "",
      plan:                 billing === "anual" ? "anual" : "mensual",
      tipo_plan:            pending.plan,
      valor_mensual:        VALORES_PLAN[pending.plan] ?? 0,
      costo_implementacion: 0,
      estado:               "al_dia",
      fecha_proximo_pago:   proximoPago.toISOString().split("T")[0],
      notas:                `Pago automático Wompi · ref: ${tx.reference}`,
      actividad_economica:  pending.actividad_economica,
      id_empresa:           empresa.id,
      usuario_admin:        usuario,
      password_admin:       pwHash,
      email_admin:          email,
    });

    // 5. Marcar transacción como procesada y guardar credenciales para la página de éxito
    await supabase.from("wompi_transacciones_pendientes")
      .update({
        estado:              "procesado",
        wompi_transaction_id: tx.id,
        usuario_admin:       usuario,
        password_admin:      password,
      })
      .eq("reference", tx.reference);

    // 6. Cerrar prospecto (pago exitoso = cliente ganado)
    if (pending.prospecto_id) {
      await supabase.from("prospectos")
        .update({
          estado: "cerrado",
          notas:  `Pago exitoso en Wompi · ref: ${tx.reference} · usuario: ${usuario}`,
        })
        .eq("id", pending.prospecto_id);
    }

    console.log("[wompi-webhook] Cliente creado:", usuario, "empresa:", empresa.id);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[wompi-webhook] Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
