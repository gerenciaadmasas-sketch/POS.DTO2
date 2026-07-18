import { supabase } from "./supabase.config";
import { toastError } from "../utils/toast";

// ── MESAS ────────────────────────────────────────────────────
export async function MostrarMesas({ id_empresa }) {
    const { data, error } = await supabase
        .from("mesas").select("*")
        .eq("id_empresa", id_empresa).eq("activa", true).order("numero");
    if (error) { toastError(error.message, "Mesas › Mostrar"); return []; }
    return data ?? [];
}

export async function CrearMesa(p) {
    const { data, error } = await supabase.from("mesas").insert(p).select().single();
    if (error) { toastError(error.message, "Mesas › Crear"); throw error; }
    return data;
}

export async function EditarMesa({ id, ...campos }) {
    const { error } = await supabase.from("mesas").update(campos).eq("id", id);
    if (error) { toastError(error.message, "Mesas › Editar"); throw error; }
}

export async function EliminarMesa({ id }) {
    const { error } = await supabase.from("mesas").update({ activa: false }).eq("id", id);
    if (error) { toastError(error.message, "Mesas › Eliminar"); throw error; }
}

export async function CambiarEstadoMesa({ id, estado }) {
    const { error } = await supabase.from("mesas").update({ estado }).eq("id", id);
    if (error) { toastError(error.message, "Mesas › Estado"); throw error; }
}

// ── MENÚ CATEGORÍAS ─────────────────────────────────────────
export async function MostrarMenuCategorias({ id_empresa }) {
    const { data, error } = await supabase
        .from("menu_categorias").select("*")
        .eq("id_empresa", id_empresa).order("orden").order("nombre");
    if (error) { toastError(error.message, "Menú › Categorías"); return []; }
    return data ?? [];
}

export async function CrearMenuCategoria(p) {
    const { data, error } = await supabase.from("menu_categorias").insert(p).select().single();
    if (error) { toastError(error.message, "Menú › Crear categoría"); throw error; }
    return data;
}

export async function EditarMenuCategoria({ id, ...campos }) {
    const { error } = await supabase.from("menu_categorias").update(campos).eq("id", id);
    if (error) { toastError(error.message, "Menú › Editar categoría"); throw error; }
}

export async function EliminarMenuCategoria({ id }) {
    const { error } = await supabase.from("menu_categorias").delete().eq("id", id);
    if (error) { toastError(error.message, "Menú › Eliminar categoría"); throw error; }
}

// ── MENÚ ITEMS ───────────────────────────────────────────────
export async function MostrarMenuItems({ id_empresa }) {
    const { data, error } = await supabase
        .from("menu_items")
        .select("*, menu_categorias(nombre)")
        .eq("id_empresa", id_empresa)
        .order("orden").order("nombre");
    if (error) { toastError(error.message, "Menú › Items"); return []; }
    return data ?? [];
}

export async function CrearMenuItem(p) {
    const { data, error } = await supabase.from("menu_items").insert(p).select().single();
    if (error) { toastError(error.message, "Menú › Crear ítem"); throw error; }
    return data;
}

export async function EditarMenuItem({ id, ...campos }) {
    const { error } = await supabase.from("menu_items").update(campos).eq("id", id);
    if (error) { toastError(error.message, "Menú › Editar ítem"); throw error; }
}

export async function EliminarMenuItem({ id }) {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) { toastError(error.message, "Menú › Eliminar ítem"); throw error; }
}

// ── COMANDAS ─────────────────────────────────────────────────
export async function CrearComanda({ id_empresa, id_mesa }) {
    const { data, error } = await supabase
        .from("comandas").insert({ id_empresa, id_mesa, estado: "abierta" }).select().single();
    if (error) { toastError(error.message, "Comanda › Crear"); throw error; }
    return data;
}

export async function MostrarComandasActivas({ id_empresa }) {
    const { data, error } = await supabase
        .from("comandas")
        .select("*, mesas(numero, nombre), comanda_items(*)")
        .eq("id_empresa", id_empresa)
        .neq("estado", "cobrada")
        .order("created_at");
    if (error) { toastError(error.message, "Comandas › Mostrar"); return []; }
    return data ?? [];
}

export async function MostrarComandaPorMesa({ id_empresa, id_mesa }) {
    const { data, error } = await supabase
        .from("comandas")
        .select("*, comanda_items(*)")
        .eq("id_empresa", id_empresa)
        .eq("id_mesa", id_mesa)
        .neq("estado", "cobrada")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) { toastError(error.message, "Comanda › Por mesa"); return null; }
    return data;
}

export async function AgregarItemComanda({ id_empresa, id_comanda, id_menu_item, nombre, precio_unitario, cantidad = 1, notas }) {
    const { data: existing } = await supabase
        .from("comanda_items")
        .select("id, cantidad")
        .eq("id_comanda", id_comanda)
        .eq("id_menu_item", id_menu_item)
        .eq("estado", "pendiente")
        .maybeSingle();

    let result;
    if (existing) {
        const { data, error } = await supabase
            .from("comanda_items")
            .update({ cantidad: existing.cantidad + cantidad })
            .eq("id", existing.id).select().single();
        if (error) { toastError(error.message, "Comanda › Agregar ítem"); throw error; }
        result = data;
    } else {
        const { data, error } = await supabase
            .from("comanda_items")
            .insert({ id_empresa, id_comanda, id_menu_item, nombre, precio_unitario, cantidad, notas: notas || null })
            .select().single();
        if (error) { toastError(error.message, "Comanda › Agregar ítem"); throw error; }
        result = data;
    }
    await _recalcTotal(id_comanda);
    return result;
}

export async function EliminarItemComanda({ id, id_comanda }) {
    const { error } = await supabase.from("comanda_items").delete().eq("id", id);
    if (error) { toastError(error.message, "Comanda › Eliminar ítem"); throw error; }
    await _recalcTotal(id_comanda);
}

export async function CambiarEstadoComanda({ id, estado }) {
    const { error } = await supabase.from("comandas").update({ estado }).eq("id", id);
    if (error) { toastError(error.message, "Comanda › Estado"); throw error; }
}

export async function CambiarEstadoItem({ id, estado }) {
    const { error } = await supabase.from("comanda_items").update({ estado }).eq("id", id);
    if (error) { toastError(error.message, "Comanda › Estado ítem"); throw error; }
}

export async function CerrarComanda({ id, id_mesa, metodo_pago = "efectivo", pagado_con = 0, cambio = 0 }) {
    const [r1, r2] = await Promise.all([
        supabase.from("comandas").update({ estado: "cobrada", metodo_pago, pagado_con, cambio }).eq("id", id),
        supabase.from("mesas").update({ estado: "libre" }).eq("id", id_mesa),
    ]);
    if (r1.error) toastError(r1.error.message, "Comanda › Cerrar");
    if (r2.error) toastError(r2.error.message, "Comanda › Liberar mesa");
}

// ── STATS / REPORTES ─────────────────────────────────────────
export async function ObtenerStatsRestaurante({ id_empresa, desde, hasta }) {
    const [{ data: comandas }, { data: mesasActivas }] = await Promise.all([
        supabase
            .from("comandas")
            .select("id, total, metodo_pago, created_at")
            .eq("id_empresa", id_empresa)
            .eq("estado", "cobrada")
            .gte("created_at", desde)
            .lte("created_at", hasta),
        supabase
            .from("mesas")
            .select("id")
            .eq("id_empresa", id_empresa)
            .neq("estado", "libre"),
    ]);

    const ids = (comandas ?? []).map(c => c.id);
    let topItems = [];
    if (ids.length > 0) {
        const { data: items } = await supabase
            .from("comanda_items")
            .select("nombre, cantidad, precio_unitario")
            .in("id_comanda", ids);
        const agrupado = {};
        (items ?? []).forEach(i => {
            if (!agrupado[i.nombre]) agrupado[i.nombre] = { nombre: i.nombre, cantidad: 0, total: 0 };
            agrupado[i.nombre].cantidad += Number(i.cantidad);
            agrupado[i.nombre].total += Number(i.cantidad) * Number(i.precio_unitario);
        });
        topItems = Object.values(agrupado).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
    }

    const totalIngresos  = (comandas ?? []).reduce((s, c) => s + Number(c.total ?? 0), 0);
    const totalComandas  = (comandas ?? []).length;
    const ticketPromedio = totalComandas > 0 ? totalIngresos / totalComandas : 0;

    const porMetodo = {};
    (comandas ?? []).forEach(c => {
        const m = c.metodo_pago ?? "efectivo";
        if (!porMetodo[m]) porMetodo[m] = { metodo: m, total: 0, count: 0 };
        porMetodo[m].total += Number(c.total ?? 0);
        porMetodo[m].count += 1;
    });

    const porHora = {};
    (comandas ?? []).forEach(c => {
        const h = new Date(c.created_at).getHours();
        porHora[h] = (porHora[h] ?? 0) + 1;
    });
    const horaPicoEntry = Object.entries(porHora).sort((a, b) => b[1] - a[1])[0];

    return {
        totalIngresos,
        totalComandas,
        ticketPromedio,
        mesasActivas: (mesasActivas ?? []).length,
        topItems,
        porMetodo: Object.values(porMetodo),
        horaPico: horaPicoEntry ? `${horaPicoEntry[0]}:00` : null,
    };
}

// ── SUMINISTROS ──────────────────────────────────────────────
export async function MostrarSuministros({ id_empresa }) {
    const { data, error } = await supabase
        .from("suministros").select("*").eq("id_empresa", id_empresa).order("nombre");
    if (error) { toastError(error.message, "Suministros › Mostrar"); return []; }
    return data ?? [];
}

export async function CrearSuministro(p) {
    const { data, error } = await supabase.from("suministros").insert(p).select().single();
    if (error) { toastError(error.message, "Suministros › Crear"); throw error; }
    return data;
}

export async function EditarSuministro({ id, ...campos }) {
    const { error } = await supabase.from("suministros").update(campos).eq("id", id);
    if (error) { toastError(error.message, "Suministros › Editar"); throw error; }
}

export async function EliminarSuministro({ id }) {
    const { error } = await supabase.from("suministros").delete().eq("id", id);
    if (error) { toastError(error.message, "Suministros › Eliminar"); throw error; }
}

export async function RegistrarCompra({ id_empresa, id_suministro, cantidad, precio_total, proveedor }) {
    const { data, error } = await supabase
        .from("compras_suministros")
        .insert({ id_empresa, id_suministro, cantidad, precio_total, proveedor: proveedor || null })
        .select().single();
    if (error) { toastError(error.message, "Compra › Registrar"); throw error; }
    const { data: sum } = await supabase.from("suministros").select("stock_actual").eq("id", id_suministro).single();
    await supabase.from("suministros").update({
        stock_actual:   Number(sum?.stock_actual ?? 0) + Number(cantidad),
        precio_promedio: Number(precio_total) / Number(cantidad),
    }).eq("id", id_suministro);
    return data;
}

export async function MostrarComprasSuministro({ id_suministro }) {
    const { data, error } = await supabase
        .from("compras_suministros").select("*").eq("id_suministro", id_suministro)
        .order("fecha", { ascending: false }).limit(20);
    if (error) { toastError(error.message, "Compras › Mostrar"); return []; }
    return data ?? [];
}

async function _recalcTotal(id_comanda) {
    const { data: items } = await supabase
        .from("comanda_items").select("precio_unitario, cantidad").eq("id_comanda", id_comanda);
    const total = (items ?? []).reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);
    await supabase.from("comandas").update({ total }).eq("id", id_comanda);
}
