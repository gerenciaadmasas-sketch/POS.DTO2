import { supabase } from "./supabase.config";
import { toastError } from "../utils/toast";

export async function MostrarConfigPlanes() {
    const { data, error } = await supabase
        .from("config_planes")
        .select()
        .order("id");
    if (error) { toastError(error.message, "Planes › Mostrar"); return []; }
    return data ?? [];
}

export async function EditarPrecioPlan({ id, precio }) {
    const { error } = await supabase
        .from("config_planes")
        .update({ precio })
        .eq("id", id);
    if (error) { toastError(error.message, "Planes › Editar"); throw error; }
}
