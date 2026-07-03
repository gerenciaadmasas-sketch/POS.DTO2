import { toastError } from "../utils/toast";
import { supabase } from "../index";
const tabla = "empresa";
export async function InsertarEmpresa(p) {
    const { data, error } = await supabase.from(tabla).insert(p).select();
    if (error) {
        toastError(error.message, "Empresa › Insertar");
        return;
    }
    return data?.[0];
}
export async function MostrarEmpresaXidusuario(p) {
    const { data } = await supabase
        .rpc("mostrarempresaxiduser", p)
        .maybeSingle();
    return data;
}
export async function MostrarEmpresaPorId(id) {
    const { data } = await supabase
        .from(tabla)
        .select("*, suscripciones(actividad_economica)")
        .eq("id", id)
        .maybeSingle();
    if (!data) return null;
    const { suscripciones: sus, ...empresa } = data;
    return { ...empresa, actividad_economica: sus?.[0]?.actividad_economica ?? null };
}

export async function MostrarTodasEmpresas() {
    const { data } = await supabase.from(tabla).select().order("razon_social");
    return data ?? [];
}

export async function EditarEmpresa(p) {
    const { id, ...campos } = p;
    const { data, error } = await supabase.from(tabla).update(campos).eq("id", id).select();
    if (error) {
        toastError(error.message, "Empresa › Editar");
        return;
    }
    return data?.[0];
}