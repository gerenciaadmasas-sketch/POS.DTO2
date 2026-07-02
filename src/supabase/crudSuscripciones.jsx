import { supabase } from "./supabase.config";
import { toastError } from "../utils/toast";

const tabla = "suscripciones";

export async function MostrarSuscripciones() {
    const { data, error } = await supabase
        .from(tabla)
        .select("*, empresa(razon_social)")
        .order("created_at", { ascending: false });
    if (error) { toastError(error.message, "Suscripciones › Mostrar"); return []; }
    return data ?? [];
}

export async function InsertarSuscripcion(p) {
    const nombre = (p.nombre_cliente?.split(" ")[0] ?? "").trim();
    const apellido = (p.apellido_cliente ?? "").trim();
    let usuarioBase = nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase() + apellido.charAt(0).toUpperCase() + apellido.slice(1).toLowerCase();

    // Verificar si ya existe y agregar número
    let usuario = usuarioBase;
    let intento = 1;
    while (true) {
        const { data: existe } = await supabase.from("usuarios").select("id").eq("usuario", usuario).maybeSingle();
        if (!existe) break;
        intento++;
        usuario = `${usuarioBase}${intento}`;
    }

    const password = p.cedula_cliente || "123456";
    const nombreEmpresa = `${nombre} ${apellido}`.trim();

    // 1. Crear empresa aislada (tenant)
    const { data: empresa, error: errEmp } = await supabase
        .from("empresa")
        .insert({ razon_social: nombreEmpresa })
        .select()
        .maybeSingle();
    if (errEmp) { toastError(errEmp.message, "Suscripciones › Crear empresa"); throw errEmp; }

    const email = `${usuario}@emp${empresa.id}.pos`;

    // 2. Crear usuario admin via Edge Function
    const { error: errUser } = await supabase.functions.invoke("dynamic-worker", {
        body: {
            email,
            password,
            usuario,
            nombres: nombre,
            apellidos: apellido,
            nro_doc: p.cedula_cliente ?? "",
            id_empresa: empresa.id,
            tipo: "administrador",
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
        toastError("Error al crear usuario admin", "Suscripciones");
        // Limpiar empresa huérfana
        await supabase.from("empresa").delete().eq("id", empresa.id);
        throw errUser;
    }

    // Guardar email en usuario
    await supabase.from("usuarios").update({ email }).eq("usuario", usuario).eq("id_empresa", empresa.id);

    // Vincular empresa al usuario admin
    const { data: adminUser } = await supabase.from("usuarios").select("id").eq("usuario", usuario).eq("id_empresa", empresa.id).maybeSingle();
    if (adminUser) {
        await supabase.from("empresa").update({ id_usuario: adminUser.id }).eq("id", empresa.id);
    }

    // 3. Crear suscripción con credenciales guardadas
    const { error } = await supabase.from(tabla).insert({
        nombre_cliente: p.nombre_cliente,
        apellido_cliente: apellido,
        cedula_cliente: p.cedula_cliente ?? "",
        plan: p.plan,
        tipo_plan: p.tipo_plan ?? "chispa",
        valor_mensual: p.valor_mensual,
        costo_implementacion: p.costo_implementacion,
        estado: "al_dia",
        fecha_proximo_pago: p.fecha_proximo_pago,
        notas: p.notas,
        actividad_economica: p.actividad_economica,
        id_empresa: empresa.id,
        usuario_admin: usuario,
        password_admin: password,
        email_admin: email,
    });
    if (error) { toastError(error.message, "Suscripciones › Insertar"); throw error; }

    return { empresa, usuario, password };
}

export async function EditarSuscripcion({ id, ...campos }) {
    const { error } = await supabase.from(tabla).update(campos).eq("id", id);
    if (error) { toastError(error.message, "Suscripciones › Editar"); throw error; }
}

export async function EliminarSuscripcion({ id }) {
    const { error } = await supabase.from(tabla).delete().eq("id", id);
    if (error) { toastError(error.message, "Suscripciones › Eliminar"); throw error; }
}

export async function RegistrarPago({ id_suscripcion, monto, metodo, notas, plan }) {
    const { error: errPago } = await supabase
        .from("pagos_clientes")
        .insert({ id_suscripcion, monto, metodo, notas });
    if (errPago) { toastError(errPago.message, "Pagos › Registrar"); throw errPago; }

    const meses = plan === "trimestral" ? 3 : plan === "bimestral" ? 2 : 1;
    const hoy = new Date();
    const proximoPago = new Date(hoy.getFullYear(), hoy.getMonth() + meses, hoy.getDate());

    const { error: errSus } = await supabase
        .from(tabla)
        .update({ fecha_proximo_pago: proximoPago.toISOString().split("T")[0], estado: "al_dia" })
        .eq("id", id_suscripcion);
    if (errSus) { toastError(errSus.message, "Pagos › Actualizar fecha"); }
}

export async function EximirPago({ id, plan }) {
    const meses = plan === "trimestral" ? 3 : plan === "bimestral" ? 2 : 1;
    const hoy = new Date();
    const prox = new Date(hoy.getFullYear(), hoy.getMonth() + meses, hoy.getDate());
    const { error } = await supabase
        .from(tabla)
        .update({ fecha_proximo_pago: prox.toISOString().split("T")[0], estado: "al_dia" })
        .eq("id", id);
    if (error) { toastError(error.message, "Suscripciones › Eximir"); throw error; }
}

export async function ReactivarCuenta({ id, plan }) {
    const meses = plan === "trimestral" ? 3 : plan === "bimestral" ? 2 : 1;
    const hoy = new Date();
    const prox = new Date(hoy.getFullYear(), hoy.getMonth() + meses, hoy.getDate());
    const { error } = await supabase
        .from(tabla)
        .update({ estado: "al_dia", fecha_proximo_pago: prox.toISOString().split("T")[0] })
        .eq("id", id);
    if (error) { toastError(error.message, "Suscripciones › Reactivar"); throw error; }
}

export async function MostrarPagosCliente({ id_suscripcion }) {
    const { data, error } = await supabase
        .from("pagos_clientes")
        .select()
        .eq("id_suscripcion", id_suscripcion)
        .order("fecha_pago", { ascending: false });
    if (error) { toastError(error.message, "Pagos › Mostrar"); return []; }
    return data ?? [];
}
