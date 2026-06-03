import { supabase } from "./supabase.config";
const tabla = "roles"; // Cambiado de "tipodocumento" a "roles"

export async function MostrarRolesXnombre (p){
    const {data, error} = await supabase
    .from(tabla)
    .select()
    .eq("nombre", p.nombre)
    .maybeSingle();
    if (error) {
        console.error("Error al buscar rol:", error.message);
    }
    return data;
}