import { supabase } from "./supabase.config";
import { toastError } from "../utils/toast";

export async function MostrarCajas({ id_empresa }) {
    const { data, error } = await supabase
        .from("cajas")
        .select()
        .eq("id_empresa", id_empresa)
        .order("created_at", { ascending: true });
    if (error) { toastError(error.message, "Cajas › Mostrar"); return []; }
    return data ?? [];
}

export async function InsertarCaja({ id_sucursal, id_empresa, nombre }) {
    const { error } = await supabase
        .from("cajas")
        .insert({ id_sucursal, id_empresa, nombre });
    if (error) { toastError(error.message, "Cajas › Insertar"); throw error; }
}

export async function EditarCaja({ id, nombre }) {
    const { error } = await supabase
        .from("cajas")
        .update({ nombre })
        .eq("id", id);
    if (error) { toastError(error.message, "Cajas › Editar"); throw error; }
}

export async function EliminarCaja({ id }) {
    const { error } = await supabase
        .from("cajas")
        .delete()
        .eq("id", id);
    if (error) { toastError(error.message, "Cajas › Eliminar"); throw error; }
}
