import { toastError } from "../utils/toast";
import { supabase } from "./supabase.config";
const tabla = "clientes";

export async function InsertarCliente(p) {
    const { error } = await supabase.from(tabla).insert(p);
    if (error) {
        toastError(error.message, "Clientes › Insertar");
        throw new Error(error.message);
    }
}

export async function MostrarClientes(p) {
    const { data, error } = await supabase
        .from(tabla)
        .select()
        .eq("id_empresa", p.id_empresa)
        .order("id", { ascending: false });
    if (error) {
        toastError(error.message, "Clientes › Mostrar");
        return [];
    }
    return data;
}

export async function BuscarClientes(p) {
    const { data } = await supabase
        .from(tabla)
        .select()
        .eq("id_empresa", p.id_empresa)
        .or(`nombre.ilike.%${p.busqueda}%,apellido.ilike.%${p.busqueda}%,telefono.ilike.%${p.busqueda}%`);
    return data;
}

export async function EditarCliente(p) {
    const { id, ...campos } = p;
    const { error } = await supabase.from(tabla).update(campos).eq("id", id);
    if (error) {
        toastError(error.message, "Clientes › Editar");
        throw new Error(error.message);
    }
}

export async function EliminarCliente(p) {
    const { error } = await supabase.from(tabla).delete().eq("id", p.id);
    if (error) {
        toastError(error.message, "Clientes › Eliminar");
    }
}
