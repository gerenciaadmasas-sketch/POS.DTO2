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
    const { data, error } = await supabase
        .from(tabla)
        .select("*, categorias(nombre), almacen(id_almacen, almacenes(nombre))")
        .eq("id_empresa", p.id_empresa)
        .order("nombre");
    if (error) { console.error("Mostrar productos:", error.message); return []; }
    return (data ?? []).map(prod => ({
        ...prod,
        categoria: prod.categorias?.nombre ?? "Sin categoría",
        p_venta: `$ ${Number(prod.precio_venta).toLocaleString("es-CO")}`,
        p_compra: `$ ${Number(prod.precio_compra).toLocaleString("es-CO")}`,
        almacenes_txt: [...new Set((prod.almacen ?? []).map(a => a.almacenes?.nombre).filter(Boolean))].join(", ") || "—",
        id_almacen_actual: prod.almacen?.[0]?.id_almacen ?? null,
    }));
}

export async function BuscarProductos(p) {
    const { data, error } = await supabase
        .from(tabla)
        .select("*, categorias(nombre), almacen(id_almacen, almacenes(nombre))")
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
        almacenes_txt: [...new Set((prod.almacen ?? []).map(a => a.almacenes?.nombre).filter(Boolean))].join(", ") || "—",
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

export async function SubirImagenProducto({ id, id_empresa, file }) {
    const ruta = `producto/${id}`;
    const { error: uploadError } = await supabase.storage
        .from("imagenes")
        .upload(ruta, file, { cacheControl: "0", upsert: true });
    if (uploadError) { toastError(uploadError.message, "Productos › Imagen"); return null; }
    const { data: urlData } = await supabase.storage.from("imagenes").getPublicUrl(ruta);
    const { error } = await supabase.from("productos")
        .update({ imagen: urlData.publicUrl })
        .eq("id", id)
        .eq("id_empresa", id_empresa);
    if (error) { toastError(error.message, "Productos › Imagen URL"); return null; }
    return urlData.publicUrl;
}
