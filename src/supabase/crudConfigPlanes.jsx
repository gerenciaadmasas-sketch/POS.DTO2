import { supabase } from "./supabase.config";
import { toastError } from "../utils/toast";

export async function MostrarConfigPlanes() {
    const { data, error } = await supabase
        .from("config_planes")
        .select()
        .order("id");
    if (error) { toastError(error.message, "Planes › Mostrar"); return []; }
    return data ?? [];
}

export async function EditarFeaturesTier({ id, features }) {
    const { error } = await supabase
        .from("config_planes")
        .update({ features })
        .eq("id", id);
    if (error) { toastError(error.message, "Planes › Features"); throw error; }
}

export async function EditarPrecioTier({ id, precio_base }) {
    const { error } = await supabase
        .from("config_planes")
        .update({ precio_base: Number(precio_base) || 0 })
        .eq("id", id);
    if (error) { toastError(error.message, "Planes › Editar"); throw error; }
}

// Fórmulas de precio según ciclo de facturación
export function calcularPrecios(precio_base) {
    const mensual    = precio_base;
    const bimestral  = Math.round((precio_base * 2 * 0.95) / 1000) * 1000;   // 5% off
    const trimestral = Math.round((precio_base * 3 * 0.90) / 1000) * 1000;   // 10% off
    return { mensual, bimestral, trimestral };
}
