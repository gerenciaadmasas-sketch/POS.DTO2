import { createClient } from "@supabase/supabase-js";
import { supabase } from "../index";

export async function VerificarPasswordAdmin({ id_empresa, password }) {
    const { data: admin } = await supabase
        .from("usuarios")
        .select("email")
        .eq("id_empresa", id_empresa)
        .eq("tipo", "administrador")
        .limit(1)
        .maybeSingle();

    if (!admin?.email) return { ok: false, error: "No se encontró el administrador de esta empresa" };

    // Cliente temporal sin persistir sesión — no afecta la sesión activa
    const tempClient = createClient(
        import.meta.env.VITE_APP_SUPABASE_URL,
        import.meta.env.VITE_APP_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );

    const { error } = await tempClient.auth.signInWithPassword({ email: admin.email, password });
    if (error) return { ok: false, error: "Contraseña incorrecta" };
    await tempClient.auth.signOut();
    return { ok: true };
}
