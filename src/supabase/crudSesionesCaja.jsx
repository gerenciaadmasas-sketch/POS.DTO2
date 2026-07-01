import { supabase } from "../index";
import { toastError } from "../utils/toast";

const tabla = "sesiones_caja";

export async function AbrirSesionCaja(p) {
    const ahora = new Date();
    const { data, error } = await supabase
        .from(tabla)
        .insert({
            id_empresa:    p.id_empresa,
            id_sucursal:   p.id_sucursal  ?? null,
            id_almacen:    p.id_almacen   ?? null,
            id_usuario:    p.id_usuario   ?? null,
            saldo_inicial: p.saldo_inicial ?? 0,
            estado:        "abierta",
            hora_apertura: ahora.toISOString(),
            fecha:         ahora.toISOString().split("T")[0],
        })
        .select()
        .maybeSingle();
    if (error) { toastError(error.message, "Caja › Apertura"); return null; }
    return data;
}

export async function CerrarSesionCaja(p) {
    const diferencia = (p.saldo_contado ?? 0) - (p.saldo_esperado ?? 0);
    const { data, error } = await supabase
        .from(tabla)
        .update({
            total_ventas:   p.total_ventas   ?? 0,
            total_efectivo: p.total_efectivo ?? 0,
            saldo_esperado: p.saldo_esperado ?? 0,
            saldo_contado:  p.saldo_contado  ?? 0,
            diferencia,
            notas:          p.notas          ?? null,
            estado:         "cerrada",
            hora_cierre:    new Date().toISOString(),
        })
        .eq("id", p.id)
        .eq("id_empresa", p.id_empresa)
        .select()
        .maybeSingle();
    if (error) { toastError(error.message, "Caja › Cierre"); return null; }
    return data;
}

export async function ObtenerSesionAbierta(p) {
    const hoy = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
        .from(tabla)
        .select()
        .eq("id_empresa",  p.id_empresa)
        .eq("id_almacen",  p.id_almacen)
        .eq("id_usuario",  p.id_usuario)   // solo la sesión del propio usuario
        .eq("estado",      "abierta")
        .gte("created_at", `${hoy}T00:00:00`) // solo de hoy
        .order("created_at", { ascending: false })
        .limit(1);
    if (error) { toastError(error.message, "Caja › Consultar"); return null; }
    return data?.[0] ?? null;
}

export async function ObtenerTotalesVentasTurno({ id_empresa, id_almacen, desde }) {
    const { data, error } = await supabase
        .from("ventas")
        .select("total, metodo_pago")
        .eq("id_empresa", id_empresa)
        .eq("id_almacen", id_almacen)
        .gte("created_at", desde);
    if (error) { toastError(error.message, "Caja › Totales"); return { total: 0, efectivo: 0, cantidad: 0 }; }
    const rows = data ?? [];
    const total    = rows.reduce((s, v) => s + (v.total ?? 0), 0);
    const efectivo = rows.filter(v => v.metodo_pago === "efectivo").reduce((s, v) => s + (v.total ?? 0), 0);
    return { total, efectivo, cantidad: rows.length };
}

export async function ListarSesionesCaja({ id_empresa, id_sucursal, id_almacen, id_usuario, desde, hasta, page = 1, pageSize = 20 }) {
    let q = supabase
        .from(tabla)
        .select("*", { count: "exact" })
        .eq("id_empresa", id_empresa)
        .order("created_at", { ascending: false });
    if (id_sucursal) q = q.eq("id_sucursal", id_sucursal);
    if (id_almacen)  q = q.eq("id_almacen",  id_almacen);
    if (id_usuario)  q = q.eq("id_usuario",  id_usuario);
    if (desde) q = q.gte("created_at", `${desde}T00:00:00`);
    if (hasta) q = q.lte("created_at", `${hasta}T23:59:59`);
    q = q.range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await q;
    if (error) { toastError(error.message, "Caja › Listar"); return { data: [], count: 0 }; }
    return { data: data ?? [], count: count ?? 0 };
}
