import { supabase } from "./supabase.config";
import { toastError } from "../utils/toast";

const tabla = "suscripciones";

export async function MostrarSuscripciones() {
    const { data, error } = await supabase
        .from(tabla)
        .select("*, empresa(razon_social)")
        .order("created_at", { ascending: false });
    if (error) { toastError(error.message, "Suscripciones › Mostrar"); return []; }
    return data ?? [];
}

export async function InsertarSuscripcion(p) {
    const { error } = await supabase.from(tabla).insert(p);
    if (error) { toastError(error.message, "Suscripciones › Insertar"); throw error; }
}

export async function EditarSuscripcion({ id, ...campos }) {
    const { error } = await supabase.from(tabla).update(campos).eq("id", id);
    if (error) { toastError(error.message, "Suscripciones › Editar"); throw error; }
}

export async function EliminarSuscripcion({ id }) {
    const { error } = await supabase.from(tabla).delete().eq("id", id);
    if (error) { toastError(error.message, "Suscripciones › Eliminar"); throw error; }
}
