import { supabase } from "../index";
import { toastError } from "../utils/toast";

const tabla = "ticket_config";

export async function MostrarTicketConfig({ id_empresa }) {
    const { data, error } = await supabase
        .from(tabla)
        .select()
        .eq("id_empresa", id_empresa)
        .single();
    if (error && error.code !== "PGRST116") {
        toastError(error.message, "Ticket Config › Mostrar");
        return null;
    }
    return data ?? null;
}

export async function GuardarTicketConfig({ id_empresa, linea1, linea2, linea3, pie_pagina, logo_url }) {
    const existing = await MostrarTicketConfig({ id_empresa });
    if (existing?.id) {
        const { error } = await supabase
            .from(tabla)
            .update({ linea1, linea2, linea3, pie_pagina, logo_url })
            .eq("id", existing.id);
        if (error) { toastError(error.message, "Ticket Config › Actualizar"); throw error; }
    } else {
        const { error } = await supabase
            .from(tabla)
            .insert({ id_empresa, linea1, linea2, linea3, pie_pagina, logo_url });
        if (error) { toastError(error.message, "Ticket Config › Insertar"); throw error; }
    }
}

export async function SubirLogoTicket({ id_empresa, file }) {
    const ruta = `ticket/${id_empresa}/logo`;
    const { error } = await supabase.storage
        .from("imagenes")
        .upload(ruta, file, { cacheControl: "0", upsert: true });
    if (error) { toastError(error.message, "Ticket Config › Logo"); return null; }
    const { data } = await supabase.storage.from("imagenes").getPublicUrl(ruta);
    return data?.publicUrl ?? null;
}
