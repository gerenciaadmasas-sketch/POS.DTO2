import { supabase } from "./supabase.config";

export async function CrearProspecto({ nombre, apellido, telefono, contacto_preferido, negocio }) {
    const { data, error } = await supabase
        .from("prospectos")
        .insert([{ nombre, apellido, telefono, contacto_preferido, negocio }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function MostrarProspectos() {
    const { data, error } = await supabase
        .from("prospectos")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
}

export async function ActualizarProspecto({ id, estado, notas }) {
    const { error } = await supabase
        .from("prospectos")
        .update({ estado, notas })
        .eq("id", id);
    if (error) throw error;
}

export async function EliminarProspecto(id) {
    const { error } = await supabase
        .from("prospectos")
        .delete()
        .eq("id", id);
    if (error) throw error;
}
