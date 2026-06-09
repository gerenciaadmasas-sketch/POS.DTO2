import { toastError } from "../utils/toast";
import { supabase } from "../index";
import { InsertarMovimientoKardex } from "./crudKardex";
const tabla = "almacen";

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
        .eq("id_producto", p.id_producto);
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
        .eq("id_producto", p.id_producto);
    if (error) {
        toastError(error.message, "Almacén › Eliminar stock");
        throw new Error(error.message);
    }
}

export async function MostrarInventarioPorAlmacen({ id_empresa, id_almacen, soloConInventario = true }) {
    let q = supabase
        .from("productos")
        .select("id, nombre, precio_venta, maneja_inventarios")
        .eq("id_empresa", id_empresa)
        .order("nombre", { ascending: true });
    if (soloConInventario) q = q.eq("maneja_inventarios", true);
    const { data: productos, error: errorProductos } = await q;
    if (errorProductos) {
        toastError(errorProductos.message, "Inventario › Mostrar productos");
        return [];
    }
    const { data: stockData, error: errorStock } = await supabase
        .from(tabla)
        .select()
        .eq("id_almacen", id_almacen);
    if (errorStock) {
        toastError(errorStock.message, "Inventario › Mostrar stock");
        return [];
    }
    return (productos ?? []).map(p => {
        const registro = (stockData ?? []).find(s => s.id_producto === p.id);
        return {
            ...p,
            stock: registro?.stock ?? 0,
            stock_minimo: registro?.stock_minimo ?? 0,
            id_stock: registro?.id ?? null,
        };
    });
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
