import Swal from "sweetalert2";
import { supabase } from "./supabase.config"; // ← corregido
const tabla = "modulos";
export async function MostrarModulos() {
    const { data, error } = await supabase  // ← agregar error
        .from(tabla)
        .select()
    if (error) {
        Swal.fire({ icon: "error", title: "Oops...", text: error.message });
        return;
    }
    return data;
}