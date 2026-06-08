import { toastError } from "../utils/toast";
import { supabase } from "../index";

export async function RegistrarVenta(p) {
    const { data, error } = await supabase.rpc("registrarventa", {
        _id_empresa:     p.id_empresa,
        _id_sucursal:    p.id_sucursal,
        _id_usuario:     p.id_usuario,
        _subtotal:       p.subtotal,
        _iva:            p.iva,
        _total:          p.total,
        _metodo_pago:    p.metodo_pago,
        _paga_con:       p.paga_con,
        _cambio:         p.cambio,
        _mixto_efectivo: p.mixto_efectivo,
        _mixto_tarjeta:  p.mixto_tarjeta,
        _mixto_credito:  p.mixto_credito,
        _detalle:        p.detalle,
    });
    if (error) {
        toastError(error.message, "Ventas › Registrar");
        throw new Error(error.message);
    }
    return data; // retorna el id de la venta
}
