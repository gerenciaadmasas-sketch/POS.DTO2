import { supabase } from "./supabase.config";
import { toastError } from "../utils/toast";

/* ─────────────────────── PROPIEDADES ─────────────────────── */
const TABLA_PROP = "propiedades";

export async function MostrarPropiedades({ id_empresa }) {
    const { data, error } = await supabase
        .from(TABLA_PROP)
        .select()
        .eq("id_empresa", id_empresa)
        .order("created_at", { ascending: false });
    if (error) { toastError(error.message, "Propiedades › Mostrar"); return []; }
    return data ?? [];
}

export async function InsertarPropiedad(p) {
    const { error } = await supabase.from(TABLA_PROP).insert(p);
    if (error) { toastError(error.message, "Propiedades › Insertar"); throw error; }
}

export async function EditarPropiedad({ id, id_empresa, ...campos }) {
    const { error } = await supabase
        .from(TABLA_PROP)
        .update(campos)
        .eq("id", id)
        .eq("id_empresa", id_empresa);
    if (error) { toastError(error.message, "Propiedades › Editar"); throw error; }
}

export async function EliminarPropiedad({ id, id_empresa }) {
    const { error } = await supabase
        .from(TABLA_PROP)
        .delete()
        .eq("id", id)
        .eq("id_empresa", id_empresa);
    if (error) { toastError(error.message, "Propiedades › Eliminar"); throw error; }
}

/* ─────────────────────── PROYECTOS OBRA ─────────────────────── */
const TABLA_PROY = "proyectos_obra";

export async function MostrarProyectos({ id_empresa }) {
    const { data, error } = await supabase
        .from(TABLA_PROY)
        .select()
        .eq("id_empresa", id_empresa)
        .order("created_at", { ascending: false });
    if (error) { toastError(error.message, "Proyectos › Mostrar"); return []; }
    return data ?? [];
}

export async function InsertarProyecto(p) {
    const { error } = await supabase.from(TABLA_PROY).insert(p);
    if (error) { toastError(error.message, "Proyectos › Insertar"); throw error; }
}

export async function EditarProyecto({ id, id_empresa, ...campos }) {
    const { error } = await supabase
        .from(TABLA_PROY)
        .update(campos)
        .eq("id", id)
        .eq("id_empresa", id_empresa);
    if (error) { toastError(error.message, "Proyectos › Editar"); throw error; }
}

export async function EliminarProyecto({ id, id_empresa }) {
    const { error } = await supabase
        .from(TABLA_PROY)
        .delete()
        .eq("id", id)
        .eq("id_empresa", id_empresa);
    if (error) { toastError(error.message, "Proyectos › Eliminar"); throw error; }
}
