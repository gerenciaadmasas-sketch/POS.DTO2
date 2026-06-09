import { toastError } from "../utils/toast";
import { supabase } from "./supabase.config";
const tabla = "sucursales";
export async function MostrarTodasSucursales() {
    const { data, error } = await supabase.from(tabla).select();
    if (error) { toastError(error.message, "Sucursales › Mostrar todas"); return []; }
    return data ?? [];
}

export async function MostrarSucursales(p) {
    const { data, error } = await supabase
        .from(tabla)
        .select()
        .eq("id_empresa", p.id_empresa);
    if (error) {
        toastError(error.message, "Sucursales › Mostrar");
        return;
    }
    return data;
}