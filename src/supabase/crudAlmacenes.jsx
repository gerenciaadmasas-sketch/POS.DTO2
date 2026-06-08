import { toastError } from "../utils/toast";
import { supabase } from "../index";
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
