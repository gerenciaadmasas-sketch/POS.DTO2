import { toastError } from "../utils/toast";
import { supabase } from "../index";
const tabla = "productos";

export async function InsertarProducto(p) {
    const { error, data } = await supabase.rpc("insertarproducto", p);
    if (error) {
        toastError(error.message, "Productos › Insertar");
        throw new Error(error.message);
    }
    return data;
}

export async function MostrarProductos(p) {
    const { data } = await supabase
        .rpc("mostrarproductos", { _id_empresa: p.id_empresa });
    return data;
}

export async function BuscarProductos(p) {
    const { data, error } = await supabase
        .from(tabla)
        .select("*, categorias(nombre)")
        .eq("id_empresa", p.id_empresa)
        .ilike("nombre", `%${p.descripcion}%`)
        .order("nombre")
        .limit(20);
    if (error) { console.error("Buscar productos:", error.message); return []; }
    return (data ?? []).map(prod => ({
        ...prod,
        categoria: prod.categorias?.nombre ?? "Sin categoría",
        p_venta: `$ ${Number(prod.precio_venta).toLocaleString("es-CO")}`,
        p_compra: `$ ${Number(prod.precio_compra).toLocaleString("es-CO")}`,
    }));
}

export async function EliminarProducto(p) {
    const { error } = await supabase.from(tabla).delete().eq("id", p.id).eq("id_empresa", p.id_empresa);
    if (error) {
        toastError(error.message, "Productos › Eliminar");
        throw new Error(error.message);
    }
}

export async function BuscarProductoPorCodigo(p) {
    const { data } = await supabase
        .from(tabla)
        .select()
        .eq("codigo_barra", p.codigo_barra)
        .eq("id_empresa", p.id_empresa)
        .maybeSingle();
    return data;
}

export async function EditarProducto(p) {
    const { error } = await supabase.rpc("editarproducto", p);
    if (error) {
        toastError(error.message, "Productos › Editar");
        throw new Error(error.message);
    }
}
