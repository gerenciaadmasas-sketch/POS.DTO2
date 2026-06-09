import { toastError } from "../utils/toast";
import { supabase } from "../index";
import { InsertarMovimientoKardex } from "./crudKardex";

export async function RegistrarVenta(p) {
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

    // Registrar kardex para ítems con inventario
    const itemsInv = (p.detalle ?? []).filter(i => i.maneja_inventarios);
    if (itemsInv.length > 0 && p.id_almacen) {
        const { data: stocks } = await supabase
            .from("almacen")
            .select("id_producto, stock")
            .eq("id_almacen", p.id_almacen)
            .in("id_producto", itemsInv.map(i => i.id_producto));

        const stockMap = {};
        (stocks ?? []).forEach(s => { stockMap[s.id_producto] = s.stock; });

        await Promise.all(itemsInv.map(item => {
            const stockNuevo    = stockMap[item.id_producto] ?? 0;
            const stockAnterior = stockNuevo + item.cantidad;
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
