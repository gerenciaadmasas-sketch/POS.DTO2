import { supabase } from "../index";
import { toastError } from "../utils/toast";

export async function GetVentasStats({ id_empresa, desde, hasta }) {
    let query = supabase
        .from("ventas")
        .select("total, subtotal, iva")
        .eq("id_empresa", id_empresa);
    if (desde) query = query.gte("created_at", desde);
    if (hasta) query = query.lte("created_at", hasta);
    const { data, error } = await query;
    if (error) { toastError(error.message, "Reportes"); return []; }
    return data ?? [];
}

export async function GetDetalleStats({ id_empresa, desde, hasta }) {
    let query = supabase
        .from("detalle_ventas")
        .select("cantidad, total_item, nombre, id_producto")
        .eq("id_empresa", id_empresa);
    if (desde) query = query.gte("created_at", desde);
    if (hasta) query = query.lte("created_at", hasta);
    const { data, error } = await query;
    if (error) { toastError(error.message, "Reportes"); return []; }
    return data ?? [];
}

export async function GetMovimientosCaja({ id_empresa, desde, hasta, page = 0, pageSize = 10 }) {
    let query = supabase
        .from("ventas")
        .select("id, created_at, total, metodo_pago, id_sucursal, id_almacen, id_usuario", { count: "exact" })
        .eq("id_empresa", id_empresa)
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
    if (desde) query = query.gte("created_at", desde);
    if (hasta) query = query.lte("created_at", hasta);
    const { data, count, error } = await query;
    if (error) { toastError(error.message, "Reportes"); return { data: [], count: 0 }; }
    return { data: data ?? [], count: count ?? 0 };
}
