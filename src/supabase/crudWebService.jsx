import { supabase } from "./supabase.config";

/**
 * Verifica si un usuario tiene suscripción POS activa
 * y retorna el descuento que aplica para el servicio web.
 * @returns {{ encontrado, tiene_descuento, plan, porcentaje }}
 */
export async function VerificarDescuentoWeb(usuario) {
    const { data, error } = await supabase.rpc("get_descuento_web", {
        p_usuario: usuario.trim().toLowerCase(),
    });
    if (error) throw new Error(error.message);
    return data;
}

/** Precios base del servicio web */
export const PRECIOS_WEB = {
    landing:    1_200_000,
    portafolio: 2_200_000,
    tienda:     3_800_000,
};

/** Aplica el descuento y retorna los precios formateados */
export function calcularPreciosConDescuento(porcentaje = 0) {
    const fmt = (n) =>
        new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
    const factor = 1 - porcentaje / 100;
    return {
        landing:    fmt(Math.round(PRECIOS_WEB.landing    * factor)),
        portafolio: fmt(Math.round(PRECIOS_WEB.portafolio * factor)),
        tienda:     fmt(Math.round(PRECIOS_WEB.tienda     * factor)),
    };
}
