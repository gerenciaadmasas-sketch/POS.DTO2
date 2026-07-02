import { supabase } from "./supabase.config";

export async function CrearProspecto({ nombre, apellido, telefono, contacto_preferido, negocio }) {
    const { data, error } = await supabase
        .rpc("crear_prospecto", {
            p_nombre: nombre,
            p_apellido: apellido,
            p_telefono: telefono,
            p_contacto_preferido: contacto_preferido ?? "whatsapp",
            p_negocio: negocio,
        });
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
