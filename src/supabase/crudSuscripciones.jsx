import { supabase } from "./supabase.config";
import { toastError } from "../utils/toast";

const tabla = "suscripciones";

export async function MostrarSuscripciones() {
    const { data, error } = await supabase
        .from(tabla)
        .select("*, empresa(razon_social)")
        .order("created_at", { ascending: false });
    if (error) { toastError(error.message, "Suscripciones › Mostrar"); return []; }
    return data ?? [];
}

export async function InsertarSuscripcion(p) {
    const { error } = await supabase.from(tabla).insert(p);
    if (error) { toastError(error.message, "Suscripciones › Insertar"); throw error; }
}

export async function EditarSuscripcion({ id, ...campos }) {
    const { error } = await supabase.from(tabla).update(campos).eq("id", id);
    if (error) { toastError(error.message, "Suscripciones › Editar"); throw error; }
}

export async function EliminarSuscripcion({ id }) {
    const { error } = await supabase.from(tabla).delete().eq("id", id);
    if (error) { toastError(error.message, "Suscripciones › Eliminar"); throw error; }
}

export async function RegistrarPago({ id_suscripcion, monto, metodo, notas, plan }) {
    const { error: errPago } = await supabase
        .from("pagos_clientes")
        .insert({ id_suscripcion, monto, metodo, notas });
    if (errPago) { toastError(errPago.message, "Pagos › Registrar"); throw errPago; }

    const meses = plan === "trimestral" ? 3 : plan === "bimestral" ? 2 : 1;
    const hoy = new Date();
    const proximoPago = new Date(hoy.getFullYear(), hoy.getMonth() + meses, hoy.getDate());

    const { error: errSus } = await supabase
        .from(tabla)
        .update({ fecha_proximo_pago: proximoPago.toISOString().split("T")[0], estado: "al_dia" })
        .eq("id", id_suscripcion);
    if (errSus) { toastError(errSus.message, "Pagos › Actualizar fecha"); }
}

export async function MostrarPagosCliente({ id_suscripcion }) {
    const { data, error } = await supabase
        .from("pagos_clientes")
        .select()
        .eq("id_suscripcion", id_suscripcion)
        .order("fecha_pago", { ascending: false });
    if (error) { toastError(error.message, "Pagos › Mostrar"); return []; }
    return data ?? [];
}
