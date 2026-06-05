import Swal from "sweetalert2";
import { supabase } from "./supabase.config"; // ← corregido
const tabla = "sucursales";
export async function MostrarSucursales(p) {
    const { data, error } = await supabase  // ← agregar error
        .from(tabla)
        .select()
        .eq("id_empresa",p.id_empresa);
    if (error) {
        Swal.fire({ icon: "error", title: "Oops...", text: error.message });
        return;
    }
    return data;
}