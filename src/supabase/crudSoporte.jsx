import { supabase } from "./supabase.config";

const tabla = "mensajes_soporte";

export async function EnviarMensaje({ id_suscripcion, remitente, texto }) {
    const { error } = await supabase.from(tabla).insert({ id_suscripcion, remitente, texto });
    if (error) throw error;
}

export async function MostrarMensajes({ id_suscripcion }) {
    const { data, error } = await supabase
        .from(tabla)
        .select("*")
        .eq("id_suscripcion", id_suscripcion)
        .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
}

export async function MarcarLeidos({ id_suscripcion, remitente }) {
    const otro = remitente === "superadmin" ? "cliente" : "superadmin";
    await supabase
        .from(tabla)
        .update({ leido: true })
        .eq("id_suscripcion", id_suscripcion)
        .eq("remitente", otro)
        .eq("leido", false);
}

export async function MostrarResumenChats() {
    const { data: suscripciones } = await supabase
        .from("suscripciones")
        .select("id, nombre_cliente, apellido_cliente")
        .order("created_at", { ascending: false });

    const { data: mensajes } = await supabase
        .from(tabla)
        .select("id_suscripcion, remitente, texto, leido, created_at")
        .order("created_at", { ascending: false });

    const msgMap = {};
    for (const m of mensajes ?? []) {
        const k = m.id_suscripcion;
        if (!msgMap[k]) {
            msgMap[k] = { ultimo: m.texto, ultimo_at: m.created_at, no_leidos: 0 };
        }
        if (!m.leido && m.remitente === "cliente") {
            msgMap[k].no_leidos++;
        }
    }

    return (suscripciones ?? []).map(s => ({
        id_suscripcion: s.id,
        nombre: `${s.nombre_cliente ?? ""} ${s.apellido_cliente ?? ""}`.trim(),
        ...msgMap[s.id],
    })).sort((a, b) => {
        if (!a.ultimo_at && !b.ultimo_at) return 0;
        if (!a.ultimo_at) return 1;
        if (!b.ultimo_at) return -1;
        return new Date(b.ultimo_at) - new Date(a.ultimo_at);
    });
}
