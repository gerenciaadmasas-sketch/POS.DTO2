import { supabase } from "../index";
import { toastError } from "../utils/toast";

const tabla = "kardex";

export async function InsertarMovimientoKardex(p) {
    const { error } = await supabase.from(tabla).insert({
        id_empresa:       p.id_empresa,
        id_sucursal:      p.id_sucursal,
        id_almacen:       p.id_almacen,
        id_producto:      p.id_producto,
        nombre_producto:  p.nombre_producto,
        tipo:             p.tipo,
        cantidad:         p.cantidad,
        stock_anterior:   p.stock_anterior,
        stock_nuevo:      p.stock_nuevo,
        descripcion:      p.descripcion ?? null,
        id_usuario:       p.id_usuario ?? null,
        id_venta:         p.id_venta   ?? null,
    });
    if (error) { toastError(error.message, "Kardex › Insertar"); throw new Error(error.message); }
}

export async function MostrarKardexPorAlmacen({ id_empresa, id_almacen, desde, hasta, tipo, page = 0, pageSize = 20 }) {
    let query = supabase
        .from(tabla)
        .select("*", { count: "exact" })
        .eq("id_empresa", id_empresa)
        .eq("id_almacen", id_almacen)
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
    if (desde) query = query.gte("created_at", desde);
    if (hasta) query = query.lte("created_at", `${hasta}T23:59:59`);
    if (tipo && tipo !== "todos") query = query.eq("tipo", tipo);
    const { data, count, error } = await query;
    if (error) { toastError(error.message, "Kardex › Mostrar"); return { data: [], count: 0 }; }
    return { data: data ?? [], count: count ?? 0 };
}

export async function MostrarKardexPorProducto({ id_empresa, id_almacen, id_producto }) {
    const { data, error } = await supabase
        .from(tabla)
        .select("*")
        .eq("id_empresa", id_empresa)
        .eq("id_almacen", id_almacen)
        .eq("id_producto", id_producto)
        .order("created_at", { ascending: false })
        .limit(50);
    if (error) { toastError(error.message, "Kardex › Por producto"); return []; }
    return data ?? [];
}
