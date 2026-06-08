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