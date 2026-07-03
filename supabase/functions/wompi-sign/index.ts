import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANES_COP: Record<string, { mes: number; ano_total: number }> = {
  chispa: { mes: 49000,  ano_total: 42000  * 12 },
  fuego:  { mes: 129000, ano_total: 110000 * 12 },
  cosmos: { mes: 249000, ano_total: 212000 * 12 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const {
      plan, billing, nombre, apellido, email,
      empresa, telefono, cedula, actividad_economica,
    } = await req.json();

    const planData = PLANES_COP[plan];
    if (!planData) throw new Error(`Plan inválido: ${plan}`);

    // Monto en centavos
    const amountInCents = billing === "anual"
      ? planData.ano_total * 100
      : planData.mes * 100;

    // Referencia única
    const reference = `POS-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Hash de integridad: SHA256(reference + amountInCents + "COP" + integritySecret)
    const integritySecret = Deno.env.get("WOMPI_INTEGRITY_SECRET")!;
    const rawStr = `${reference}${amountInCents}COP${integritySecret}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawStr));
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Guardar transacción pendiente
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await supabase.from("wompi_transacciones_pendientes").insert({
      reference, plan, billing,
      nombre, apellido, email,
      empresa, telefono, cedula,
      actividad_economica,
      amount_in_cents: amountInCents,
      estado: "pendiente",
    });

    // URL de checkout Wompi
    const publicKey  = Deno.env.get("WOMPI_PUBLIC_KEY")!;
    const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "https://posdto2.vercel.app";
    const redirectUrl = `${frontendUrl}/pago-exitoso`;

    // Determinar tipo de documento
    const docType = cedula && cedula.replace(/\D/g, "").length >= 9 ? "NIT" : "CC";
    const cedulaLimpia = cedula ? cedula.replace(/\D/g, "") : "";

    // Construir URL manualmente — URLSearchParams codifica los ":" en "%3A" y Wompi no lo acepta
    const qs = [
      `public-key=${encodeURIComponent(publicKey)}`,
      `currency=COP`,
      `amount-in-cents=${amountInCents}`,
      `reference=${encodeURIComponent(reference)}`,
      `signature:integrity=${hash}`,
      `redirect-url=${encodeURIComponent(redirectUrl)}`,
      `customer-data:email=${encodeURIComponent(email ?? "")}`,
      `customer-data:full-name=${encodeURIComponent(`${nombre} ${apellido}`.trim())}`,
      `customer-data:phone-number=${encodeURIComponent(telefono ?? "")}`,
      `customer-data:legal-id=${encodeURIComponent(cedulaLimpia)}`,
      `customer-data:legal-id-type=${docType}`,
    ].join("&");

    const checkoutUrl = `https://checkout.wompi.co/p/?${qs}`;

    return new Response(JSON.stringify({ checkoutUrl, reference }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[wompi-sign]", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
