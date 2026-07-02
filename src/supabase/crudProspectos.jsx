import { supabase } from "./supabase.config";

export async function CrearProspecto({ nombre, apellido, telefono, contacto_preferido, negocio, email = "", plan = "", estado = "nuevo" }) {
    const { data, error } = await supabase
        .rpc("crear_prospecto", {
            p_nombre: nombre,
            p_apellido: apellido,
            p_telefono: telefono,
            p_contacto_preferido: contacto_preferido ?? "whatsapp",
            p_negocio: negocio,
            p_email: email,
            p_plan: plan,
            p_estado: estado,
        });
    if (error) throw error;
    return data; // retorna el UUID del prospecto
}

export async function CerrarProspectoPago(id) {
    const { error } = await supabase.rpc("cerrar_prospecto_pago", { p_id: id });
    if (error) throw error;
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
