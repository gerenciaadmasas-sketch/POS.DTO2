import { supabase } from "./supabase.config";

const T = "mensajes_internos";

export async function EnviarMensajeInterno({ id_empresa, emisor_id, receptor_id, texto }) {
    const { error } = await supabase.from(T).insert({ id_empresa, emisor_id, receptor_id, texto });
    if (error) throw error;
}

export async function MostrarMensajesEntre({ id_empresa, emisor_id, receptor_id }) {
    const { data, error } = await supabase
        .from(T)
        .select("*")
        .eq("id_empresa", id_empresa)
        .or(`and(emisor_id.eq.${emisor_id},receptor_id.eq.${receptor_id}),and(emisor_id.eq.${receptor_id},receptor_id.eq.${emisor_id})`)
        .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
}

export async function MarcarLeidosInternos({ id_empresa, emisor_id, receptor_id }) {
    await supabase.from(T)
        .update({ leido: true })
        .eq("id_empresa", id_empresa)
        .eq("emisor_id", emisor_id)
        .eq("receptor_id", receptor_id)
        .eq("leido", false);
}

export async function ContarNoLeidosInternos({ id_empresa, receptor_id }) {
    const { count } = await supabase.from(T)
        .select("id", { count: "exact", head: true })
        .eq("id_empresa", id_empresa)
        .eq("receptor_id", receptor_id)
        .eq("leido", false);
    return count ?? 0;
}

// Devuelve { [emisor_id]: { ultimo, ultimo_at, unread } }
export async function ResumenConversaciones({ id_empresa, yo_id }) {
    const { data } = await supabase.from(T)
        .select("emisor_id, receptor_id, texto, leido, created_at")
        .eq("id_empresa", id_empresa)
        .or(`emisor_id.eq.${yo_id},receptor_id.eq.${yo_id}`)
        .order("created_at", { ascending: false });

    const mapa = {};
    for (const m of data ?? []) {
        const partner = m.emisor_id === yo_id ? m.receptor_id : m.emisor_id;
        if (!mapa[partner]) {
            mapa[partner] = { ultimo: m.texto, ultimo_at: m.created_at, unread: 0 };
        }
        if (!m.leido && m.receptor_id === yo_id) {
            mapa[partner].unread++;
        }
    }
    return mapa;
}
