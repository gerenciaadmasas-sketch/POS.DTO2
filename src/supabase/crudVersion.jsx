import { supabase } from "./supabase.config";
import { toastError } from "../utils/toast";

export async function MostrarVersion() {
    const { data, error } = await supabase
        .from("config_sistema")
        .select()
        .order("fecha", { ascending: false });
    if (error) { toastError(error.message, "Versión › Mostrar"); return []; }
    return data ?? [];
}

export async function EditarVersion({ id, version, descripcion }) {
    const { error } = await supabase
        .from("config_sistema")
        .update({ version, descripcion, fecha: new Date().toISOString() })
        .eq("id", id);
    if (error) { toastError(error.message, "Versión › Editar"); throw error; }
}

export async function NuevaVersion({ version, descripcion }) {
    const { error } = await supabase
        .from("config_sistema")
        .insert({ version, descripcion });
    if (error) { toastError(error.message, "Versión › Nueva"); throw error; }
}
