import { toastError } from "../utils/toast";
import { supabase } from "../index";
const tabla = "categorias";

export async function InsertarCategorias(p, file) {
    const { error, data } = await supabase.rpc("insertarcategorias", p);
    if (error) {
        toastError(error.message, "Categorías › Insertar");
        throw new Error(error.message);
    }
    const img = file.size;
    if (img != undefined) {
        const nuevo_id = data;
        const urlimagen = await subirImagen(nuevo_id, file);
        const piconoeditar = { icono: urlimagen.publicUrl, id: nuevo_id };
        await EditarIconoCategorias(piconoeditar);
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

export async function EditarCategoria(p, fileold, filenew) {
    const { error } = await supabase.rpc("editarcategorias", p);
    if (error) {
        toastError(error.message, "Categorías › Editar");
        throw new Error(error.message);
    }
    if (filenew != "-" && filenew.size != undefined) {
        if (fileold != "-") {
            await EditarIconoCategorias(p._id, filenew);
        } else {
            const dataImagen = await subirImagen(p._id);
            const piconoeditar = { icono: dataImagen.publicUrl, id: p._id };
            await EditarIconoCategorias(piconoeditar);
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
