import { supabase } from "../index";
import { toastError } from "../utils/toast";

const tabla = "comprobantes";

const TIPOS_DEFAULT = [
    { tipo: "Factura",          serie: "F001", correlativo: 0, por_default: false },
    { tipo: "Boleta",           serie: "B001", correlativo: 0, por_default: false },
    { tipo: "Nota de credito",  serie: "NC01", correlativo: 0, por_default: false },
    { tipo: "Nota de debito",   serie: "ND01", correlativo: 0, por_default: false },
    { tipo: "Ticket",           serie: "T001", correlativo: 0, por_default: true  },
];

export async function MostrarComprobantes({ id_empresa }) {
    const { data, error } = await supabase
        .from(tabla)
        .select()
        .eq("id_empresa", id_empresa)
        .order("created_at", { ascending: true });
    if (error) {
        toastError(error.message, "Comprobantes › Mostrar");
        return [];
    }
    if (!data?.length) {
        const seed = TIPOS_DEFAULT.map((t) => ({ ...t, id_empresa }));
        const { data: inserted, error: errInsert } = await supabase
            .from(tabla)
            .insert(seed)
            .select();
        if (errInsert) { toastError(errInsert.message, "Comprobantes › Seed"); return []; }
        return inserted ?? [];
    }
    return data;
}

export async function EditarComprobante({ id, id_empresa, serie, correlativo }) {
    const { error } = await supabase
        .from(tabla)
        .update({ serie, correlativo })
        .eq("id", id)
        .eq("id_empresa", id_empresa);
    if (error) {
        toastError(error.message, "Comprobantes › Editar");
        throw new Error(error.message);
    }
}

export async function SetDefaultComprobante({ id, id_empresa }) {
    await supabase
        .from(tabla)
        .update({ por_default: false })
        .eq("id_empresa", id_empresa);
    const { error } = await supabase
        .from(tabla)
        .update({ por_default: true })
        .eq("id", id)
        .eq("id_empresa", id_empresa);
    if (error) {
        toastError(error.message, "Comprobantes › Default");
    }
}
