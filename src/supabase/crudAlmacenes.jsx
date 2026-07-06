import { toastError } from "../utils/toast";
import { supabase } from "../index";
import { InsertarMovimientoKardex } from "./crudKardex";
const tabla = "almacen";

export async function MoverProductoAlmacen({ id_producto, id_almacen_nuevo, id_almacen_actual, id_sucursal_nuevo }) {
    if (!id_almacen_actual) {
        const { error } = await supabase.from(tabla).insert({
            id_producto, id_almacen: id_almacen_nuevo,
            id_sucursal: id_sucursal_nuevo, stock: 0, stock_minimo: 0,
        });
        if (error) { toastError(error.message, "Almacén › Asignar"); throw new Error(error.message); }
        return;
    }
    const { error } = await supabase
        .from(tabla)
        .update({ id_almacen: id_almacen_nuevo, id_sucursal: id_sucursal_nuevo })
        .eq("id_producto", id_producto)
        .eq("id_almacen", id_almacen_actual);
    if (error) { toastError(error.message, "Almacén › Mover"); throw new Error(error.message); }
}

export async function InsertarStockAlmacen(p) {
    const { error } = await supabase.from(tabla).insert(p);
    if (error) {
        toastError(error.message, "Almacén › Insertar stock");
        throw new Error(error.message);
    }
}

export async function MostrarStockAlmacen(p) {
    const { data, error } = await supabase
        .from(tabla)
        .select()
        .eq("id_producto", p.id_producto)
        .eq("id_sucursal", p.id_sucursal);
    if (error) {
        toastError(error.message, "Almacén › Mostrar stock");
        return;
    }
    return data;
}

export async function MostrarStockAlmacenXSucursal(p) {
    const { data } = await supabase
        .from(tabla)
        .select()
        .eq("id_sucursal", p.id_sucursal)
        .eq("id_producto", p.id_producto)
        .maybeSingle();
    return data;
}

export async function EditarStockAlmacen(p) {
    const { error } = await supabase
        .from(tabla)
        .update({ stock: p.stock, stock_minimo: p.stock_minimo })
        .eq("id", p.id);
    if (error) {
        toastError(error.message, "Almacén › Editar stock");
        throw new Error(error.message);
    }
}

export async function EliminarStockAlmacen(p) {
    const { error } = await supabase
        .from(tabla)
        .delete()
        .eq("id_producto", p.id_producto)
        .eq("id_almacen", p.id_almacen);
    if (error) {
        toastError(error.message, "Almacén › Eliminar stock");
        throw new Error(error.message);
    }
}

export async function MostrarInventarioPorAlmacen({ id_empresa, id_almacen }) {
    const { data: stockData, error } = await supabase
        .from(tabla)
        .select("id, id_producto, stock, stock_minimo, productos(id, nombre, precio_venta, precio_compra, maneja_inventarios)")
        .eq("id_almacen", id_almacen);
    if (error) {
        toastError(error.message, "Inventario › Mostrar stock");
        return [];
    }
    return (stockData ?? []).map(s => ({
        id: s.productos?.id ?? s.id_producto,
        nombre: s.productos?.nombre ?? "—",
        precio_venta: s.productos?.precio_venta ?? 0,
        precio_compra: s.productos?.precio_compra ?? 0,
        maneja_inventarios: s.productos?.maneja_inventarios ?? true,
        stock: s.stock ?? 0,
        stock_minimo: s.stock_minimo ?? 0,
        id_stock: s.id,
    })).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function AjustarStock({ id_stock, id_producto, id_almacen, id_sucursal, id_empresa, stock, stock_minimo, stock_anterior = 0, nombre_producto = "", id_usuario = null, tipo = "ajuste", descripcion = null }) {
    if (id_stock) {
        const { error } = await supabase
            .from(tabla)
            .update({ stock, stock_minimo })
            .eq("id", id_stock);
        if (error) { toastError(error.message, "Inventario › Ajustar stock"); throw new Error(error.message); }
    } else {
        const { error } = await supabase
            .from(tabla)
            .insert({ id_producto, id_almacen, id_sucursal, stock, stock_minimo });
        if (error) { toastError(error.message, "Inventario › Insertar stock"); throw new Error(error.message); }
    }
    // Registrar movimiento en kardex
    await InsertarMovimientoKardex({
        id_empresa, id_sucursal, id_almacen, id_producto,
        nombre_producto, tipo,
        cantidad:       Math.abs(stock - stock_anterior),
        stock_anterior, stock_nuevo: stock,
        descripcion, id_usuario,
    });
}
