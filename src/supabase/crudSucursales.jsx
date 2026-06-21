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
    if (error) { toastError(error.message, "Sucursales › Mostrar"); return []; }
    return data ?? [];
}

export async function InsertarSucursal({ id_empresa, razon_social, direccion }) {
    const { error } = await supabase
        .from(tabla)
        .insert({ id_empresa, razon_social, direccion });
    if (error) { toastError(error.message, "Sucursales › Insertar"); throw error; }
}

export async function EditarSucursal({ id, razon_social, direccion }) {
    const { error } = await supabase
        .from(tabla)
        .update({ razon_social, direccion })
        .eq("id", id);
    if (error) { toastError(error.message, "Sucursales › Editar"); throw error; }
}

export async function EliminarSucursal({ id }) {
    const { error } = await supabase
        .from(tabla)
        .delete()
        .eq("id", id);
    if (error) { toastError(error.message, "Sucursales › Eliminar"); throw error; }
}
