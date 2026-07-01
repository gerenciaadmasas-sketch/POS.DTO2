import { toastError } from "../utils/toast";
import { supabase } from "../index";
const tabla = "categorias";

export async function InsertarCategorias(p) {
    const { error } = await supabase.rpc("insertarcategorias", p);
    if (error) {
        toastError(error.message, "Categorías › Insertar");
        throw new Error(error.message);
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
    }
}

export async function EditarCategoria(p) {
    const { error } = await supabase.rpc("editarcategorias", p);
    if (error) {
        toastError(error.message, "Categorías › Editar");
        throw new Error(error.message);
    }
}
