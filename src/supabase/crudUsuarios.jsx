import { toastError } from "../utils/toast";
import { supabase } from "../index";
const tabla = "usuarios";

export async function MostrarUsuarios(p) {
    const { data } = await supabase
        .from(tabla)
        .select()
        .eq("id_auth", p.id_auth)
        .maybeSingle();
    return data;
}

export async function ListarUsuariosEmpresa(p) {
    const { data, error } = await supabase
        .from(tabla)
        .select()
        .eq("id_empresa", p.id_empresa)
        .order("created_at", { ascending: false });
    if (error) { toastError(error.message, "Usuarios › Listar"); return []; }
    return data ?? [];
}

export async function InsertarAdmin(p) {
    const { data, error } = await supabase.from(tabla).insert(p).select().maybeSingle();
    if (error) {
        if (error.code === "23505") return null;
        toastError(error.message, "Usuarios › Insertar admin");
        return;
    }
    return data;
}

export async function CrearUsuarioEmpleado(p) {
    // Llama al Edge Function que usa service_role para crear el auth user
    const { data, error } = await supabase.functions.invoke("dynamic-worker", {
        body: {
            email:       p.email,
            password:    p.password,
            usuario:     p.usuario    ?? null,
            nombres:     p.nombres,
            nro_doc:     p.nro_doc    ?? null,
            telefono:    p.telefono   ?? null,
            id_empresa:  p.id_empresa,
            id_sucursal: p.id_sucursal ?? null,
            id_almacen:  p.id_almacen  ?? null,
            tipo:        p.tipo        ?? "cajero",
            permisos:    p.permisos    ?? {},
        },
    });
    if (error) {
        let msg = error.message;
        try {
            const body = await error.context?.json?.();
            if (body?.error) msg = body.error;
        } catch { /* ignorar */ }
        toastError(msg, "Usuarios › Crear empleado");
        throw new Error(msg);
    }
    // Guardar email en la fila de usuarios para poder buscarlo en el login
    await supabase
        .from(tabla)
        .update({ email: p.email })
        .eq("usuario", p.usuario)
        .eq("id_empresa", p.id_empresa);
    return data;
}

export async function ObtenerEmailPorUsuario(usuario) {
    const { data } = await supabase
        .from(tabla)
        .select("email, tipo")
        .eq("usuario", usuario)
        .maybeSingle();
    if (!data) return null;
    return { email: data.email ?? null, tipo: data.tipo ?? null };
}

export async function ActualizarUsuario(p) {
    const { id, id_auth, id_empresa, created_at, ...campos } = p;
    const { data, error } = await supabase
        .from(tabla)
        .update(campos)
        .eq("id", id)
        .select()
        .maybeSingle();
    if (error) { toastError(error.message, "Usuarios › Actualizar"); throw new Error(error.message); }
    return data;
}

export async function EliminarUsuarioEmpleado(p) {
    const { error } = await supabase.from(tabla).delete().eq("id", p.id);
    if (error) { toastError(error.message, "Usuarios › Eliminar"); throw new Error(error.message); }
}

export async function ObtenerIdAuthSupabase() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session != null) {
        const { user } = session;
        return user.id;
    }
}