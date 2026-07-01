import { toastError } from "../utils/toast";
import { supabase } from "../index";
const tabla = "categorias";

export async function InsertarCategorias(p, file, iconoUrl) {
    const { error, data } = await supabase.rpc("insertarcategorias", p);
    if (error) {
        toastError(error.message, "Categorías › Insertar");
        throw new Error(error.message);
    }
    const nuevo_id = data;
    if (iconoUrl) {
        // URL de logo de almacén ya existente — guardar directo sin re-subir
        await EditarIconoCategorias({ icono: iconoUrl, id: nuevo_id });
    } else if (file?.size != null) {
        const urlimagen = await subirImagen(nuevo_id, file);
        await EditarIconoCategorias({ icono: urlimagen.publicUrl, id: nuevo_id });
    }
}

async function subirImagen(idcategoria, file) {
    const ruta = "categoria/" + idcategoria;
    const { data, error } = await supabase.storage
        .from("imagenes")
        .upload(ruta, file, { cacheControl: "0", upsert: true });
    if (error) {
        toastError(error.message, "Categorías › Subir imagen");
        return;
    }
    if (data) {
        const { data: urlimagen } = await supabase.storage
            .from("imagenes")
            .getPublicUrl(ruta);
        return urlimagen;
    }
}

async function EditarIconoCategorias(p) {
    const { error } = await supabase.from("categorias").update(p).eq("id", p.id);
    if (error) {
        toastError(error.message, "Categorías › Editar ícono");
    }
}

export async function MostrarCategorias(p) {
    const { data } = await supabase
        .from(tabla)
        .select()
        .eq("id_empresa", p.id_empresa)
        .order("id", { ascending: false });
    return data;
}

export async function BuscarCategorias(p) {
    const { data } = await supabase
        .from(tabla)
        .select()
        .eq("id_empresa", p.id_empresa)
        .ilike("nombre", "%" + p.descripcion + "%");
    return data;
}

export async function EliminarCategoria(p) {
    const { error } = await supabase.from(tabla).delete().eq("id", p.id).eq("id_empresa", p.id_empresa);
    if (error) {
        toastError(error.message, "Categorías › Eliminar");
        return;
    }
    if (p.icono != "-") {
        const ruta = "categorias/" + p.id;
        await supabase.storage.from("imagenes").remove([ruta]);
    }
}

export async function EditarCategoria(p, fileold, filenew, iconoUrl) {
    const { error } = await supabase.rpc("editarcategorias", p);
    if (error) {
        toastError(error.message, "Categorías › Editar");
        throw new Error(error.message);
    }
    if (iconoUrl) {
        await EditarIconoCategorias({ icono: iconoUrl, id: p._id });
    } else if (filenew?.size != null) {
        if (fileold != "-") {
            await EditarIconoStorage(p._id, filenew);
        } else {
            const dataImagen = await subirImagen(p._id, filenew);
            await EditarIconoCategorias({ icono: dataImagen.publicUrl, id: p._id });
        }
    }
}

export async function EditarIconoStorage(id, file) {
    const ruta = "categorias/" + id;
    await supabase.storage.from("imagenes").update(ruta, file, {
        cacheControl: "0",
        upsert: true,
    });
}
