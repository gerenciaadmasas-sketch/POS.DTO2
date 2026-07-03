import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Cron: todos los lunes a las 6:00 AM (Colombia = UTC-5 → 11:00 UTC)
// Schedule: "0 11 * * 1"
serve(async () => {
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Borrar todo el historial (no es null = todos los registros)
    const { error, count } = await supabase
        .from("mensajes_internos")
        .delete({ count: "exact" })
        .not("id", "is", null);

    if (error) {
        console.error("[limpiar-mensajes-internos]", error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    console.log(`[limpiar-mensajes-internos] Lunes 6am — eliminados ${count ?? 0} mensajes`);
    return new Response(JSON.stringify({ ok: true, eliminados: count ?? 0 }), { status: 200 });
});
