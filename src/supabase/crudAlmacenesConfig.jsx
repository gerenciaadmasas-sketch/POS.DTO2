import { toastError } from "../utils/toast";
import { supabase } from "../index";
const tabla = "almacenes";

export async function MostrarTodosAlmacenes() {
    const { data, error } = await supabase.from(tabla).select().order("created_at", { ascending: true });
    if (error) { toastError(error.message, "Almacenes › Mostrar todos"); return []; }
    return data ?? [];
}

export async function MostrarAlmacenesPorEmpresa(p) {
    const { data, error } = await supabase
        .from(tabla)
        .select()
        .eq("id_empresa", p.id_empresa)
        .order("created_at", { ascending: true });
    if (error) { toastError(error.message, "Almacenes › Mostrar"); return []; }
    return data;
}

export async function InsertarAlmacen(p) {
    const { data, error } = await supabase.from(tabla).insert(p).select();
    if (error) { toastError(error.message, "Almacenes › Insertar"); throw new Error(error.message); }
    return data?.[0];
}

export async function EditarAlmacen(p) {
    const { id, ...campos } = p;
    const { data, error } = await supabase.from(tabla).update(campos).eq("id", id).select();
    if (error) { toastError(error.message, "Almacenes › Editar"); throw new Error(error.message); }
    return data?.[0];
}

export async function EliminarAlmacen(p) {
    const { error } = await supabase.from(tabla).delete().eq("id", p.id);
    if (error) { toastError(error.message, "Almacenes › Eliminar"); throw new Error(error.message); }
}
