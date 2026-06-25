import { supabase } from "../index";
import { toastError } from "../utils/toast";

export async function GetVentasStats({ id_empresa, desde, hasta, id_almacen }) {
    let query = supabase
        .from("ventas")
        .select("total, subtotal, iva")
        .eq("id_empresa", id_empresa);
    if (id_almacen) query = query.eq("id_almacen", id_almacen);
    if (desde) query = query.gte("created_at", desde);
    if (hasta) query = query.lte("created_at", hasta);
    const { data, error } = await query;
    if (error) { toastError(error.message, "Reportes"); return []; }
    return data ?? [];
}

export async function GetDetalleStats({ id_empresa, desde, hasta, id_almacen }) {
    if (id_almacen) {
        let qVentas = supabase.from("ventas").select("id").eq("id_empresa", id_empresa).eq("id_almacen", id_almacen);
        if (desde) qVentas = qVentas.gte("created_at", desde);
        if (hasta) qVentas = qVentas.lte("created_at", hasta);
        const { data: ventas } = await qVentas;
        if (!ventas?.length) return [];
        const ids = ventas.map(v => v.id);
        const { data, error } = await supabase
            .from("detalle_ventas")
            .select("cantidad, total_item, nombre, id_producto")
            .in("id_venta", ids);
        if (error) { toastError(error.message, "Reportes"); return []; }
        return data ?? [];
    }
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

export async function GetInversionInventario({ id_empresa, id_almacen }) {
    let query = supabase
        .from("almacen")
        .select("stock, id_producto, productos!almacen_id_producto_fkey(precio_compra, precio_venta)")
        .gt("stock", 0);
    if (id_almacen) query = query.eq("id_almacen", id_almacen);
    const { data, error } = await query;
    if (error) { toastError(error.message, "Reportes › Inversión"); return { costo: 0, valor: 0, productos: 0, unidades: 0 }; }
    const rows = data ?? [];
    let costo = 0, valor = 0, unidades = 0;
    rows.forEach(r => {
        const stock = Number(r.stock) || 0;
        const pc = Number(r.productos?.precio_compra) || 0;
        const pv = Number(r.productos?.precio_venta) || 0;
        costo += stock * pc;
        valor += stock * pv;
        unidades += stock;
    });
    return { costo, valor, productos: rows.length, unidades };
}

export async function GetVentasDiarias({ id_empresa, desde, hasta, id_almacen }) {
    let query = supabase
        .from("ventas")
        .select("total, created_at")
        .eq("id_empresa", id_empresa)
        .order("created_at", { ascending: true });
    if (id_almacen) query = query.eq("id_almacen", id_almacen);
    if (desde) query = query.gte("created_at", desde);
    if (hasta) query = query.lte("created_at", hasta);
    const { data, error } = await query;
    if (error) { toastError(error.message, "Reportes › Diarias"); return []; }
    const mapa = {};
    (data ?? []).forEach(v => {
        const dia = new Date(v.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
        mapa[dia] = (mapa[dia] ?? 0) + (Number(v.total) || 0);
    });
    return Object.entries(mapa).map(([dia, total]) => ({ dia, total }));
}

export async function GetMovimientosCaja({ id_empresa, desde, hasta, id_almacen, page = 0, pageSize = 10 }) {
    let query = supabase
        .from("ventas")
        .select("id, created_at, total, metodo_pago, id_sucursal, id_almacen, id_usuario", { count: "exact" })
        .eq("id_empresa", id_empresa)
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
    if (id_almacen) query = query.eq("id_almacen", id_almacen);
    if (desde) query = query.gte("created_at", desde);
    if (hasta) query = query.lte("created_at", hasta);
    const { data, count, error } = await query;
    if (error) { toastError(error.message, "Reportes"); return { data: [], count: 0 }; }
    return { data: data ?? [], count: count ?? 0 };
}
