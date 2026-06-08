import { toastError } from "../utils/toast";
import { supabase } from "./supabase.config";
const tabla = "modulos";
export async function MostrarModulos() {
    const { data, error } = await supabase
        .from(tabla)
        .select();
    if (error) {
        toastError(error.message, "Módulos › Mostrar");
        return;
    }
    return data;
}