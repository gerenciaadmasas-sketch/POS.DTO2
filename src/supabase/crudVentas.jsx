import { toastError } from "../utils/toast";
import { supabase } from "../index";
import { InsertarMovimientoKardex } from "./crudKardex";

export async function RegistrarVenta(p) {
    const todosLosItems = (p.detalle ?? []).filter(i => i.id_producto);

    // Capturar stock ANTES del RPC para todos los ítems con registro en almacen
    let preStockMap = {};
    if (todosLosItems.length > 0 && p.id_almacen) {
        const { data: preStocks } = await supabase
            .from("almacen")
            .select("id_producto, stock")
            .eq("id_almacen", p.id_almacen)
            .in("id_producto", todosLosItems.map(i => i.id_producto));
        (preStocks ?? []).forEach(s => { preStockMap[s.id_producto] = s.stock; });
    }

    const { data, error } = await supabase.rpc("registrarventa", {
        _id_empresa:          p.id_empresa,
        _id_sucursal:         p.id_sucursal,
        _id_usuario:          p.id_usuario,
        _id_almacen:          p.id_almacen ?? null,
        _subtotal:            p.subtotal,
        _iva:                 p.iva,
        _total:               p.total,
        _metodo_pago:         p.metodo_pago,
        _paga_con:            p.paga_con,
        _cambio:              p.cambio,
        _mixto_efectivo:      p.mixto_efectivo,
        _mixto_qr:            p.mixto_qr,
        _mixto_transferencia: p.mixto_transferencia,
        _detalle:             p.detalle,
    });
    if (error) {
        toastError(error.message, "Ventas › Registrar");
        throw new Error(error.message);
    }
    const idVenta = data;

    if (todosLosItems.length > 0 && p.id_almacen) {
        await Promise.all(todosLosItems.map(async (item) => {
            const tieneRegistro = preStockMap[item.id_producto] !== undefined;
            const stockAnterior = tieneRegistro ? preStockMap[item.id_producto] : 0;
            const stockNuevo    = stockAnterior - item.cantidad; // permite negativos

            if (tieneRegistro) {
                // Forzar stock real (el RPC puede haberlo capado en 0)
                await supabase
                    .from("almacen")
                    .update({ stock: stockNuevo })
                    .eq("id_almacen", p.id_almacen)
                    .eq("id_producto", item.id_producto);
            } else {
                // Producto sin registro → crear fila con stock negativo
                await supabase
                    .from("almacen")
                    .insert({
                        id_producto:  item.id_producto,
                        id_almacen:   p.id_almacen,
                        id_sucursal:  p.id_sucursal ?? null,
                        stock:        stockNuevo,
                        stock_minimo: 0,
                    });
            }

            return InsertarMovimientoKardex({
                id_empresa:      p.id_empresa,
                id_sucursal:     p.id_sucursal,
                id_almacen:      p.id_almacen,
                id_producto:     item.id_producto,
                nombre_producto: item.nombre,
                tipo:            "venta",
                cantidad:        item.cantidad,
                stock_anterior:  stockAnterior,
                stock_nuevo:     stockNuevo,
                descripcion:     `Venta #${idVenta}`,
                id_usuario:      p.id_usuario,
                id_venta:        idVenta,
            });
        }));
    }

    return idVenta;
}
