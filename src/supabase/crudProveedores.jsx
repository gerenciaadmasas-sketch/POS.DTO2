import { toastError } from "../utils/toast";
import { supabase } from "./supabase.config";
const tabla = "proveedores";

export async function InsertarProveedor(p) {
    const { error } = await supabase.from(tabla).insert(p);
    if (error) {
        toastError(error.message, "Proveedores › Insertar");
        throw new Error(error.message);
    }
}

export async function MostrarProveedores(p) {
    const { data, error } = await supabase
        .from(tabla)
        .select()
        .eq("id_empresa", p.id_empresa)
        .order("id", { ascending: false });
    if (error) {
        toastError(error.message, "Proveedores › Mostrar");
        return [];
    }
    return data;
}

export async function BuscarProveedores(p) {
    const { data } = await supabase
        .from(tabla)
        .select()
        .eq("id_empresa", p.id_empresa)
        .or(`nombre.ilike.%${p.busqueda}%,nit.ilike.%${p.busqueda}%,telefono.ilike.%${p.busqueda}%`);
    return data;
}

export async function EditarProveedor(p) {
    const { id, ...campos } = p;
    const { error } = await supabase.from(tabla).update(campos).eq("id", id);
    if (error) {
        toastError(error.message, "Proveedores › Editar");
        throw new Error(error.message);
    }
}

export async function EliminarProveedor(p) {
    const { error } = await supabase.from(tabla).delete().eq("id", p.id);
    if (error) {
        toastError(error.message, "Proveedores › Eliminar");
    }
}
