import Swal from "sweetalert2";
import { supabase } from "../index";
const tabla = "productos"

export async function InsertarProducto(p) {
    const { error, data } = await supabase.rpc("insertarproducto", p);
    if (error) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: error.message,
        });
        throw new Error(error.message);
    }
    return data;
}

export async function MostrarProductos(p) {
    const { data } = await supabase
        .rpc("mostrarproductos", { _id_empresa: p.id_empresa });
    return data;
}

export async function BuscarProductos(p) {
    const { data } = await supabase
        .rpc("buscarproductos", { _id_empresa: p.id_empresa, _descripcion: p.descripcion });
    return data;
}

export async function EliminarProducto(p) {
    const { error } = await supabase.from(tabla).delete().eq("id", p.id);
    if (error) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: error.message,
        });
        throw new Error(error.message);
    }
}

export async function BuscarProductoPorCodigo(p) {
    const { data } = await supabase
        .from(tabla)
        .select()
        .eq("codigo_barra", p.codigo_barra)
        .eq("id_empresa", p.id_empresa)
        .maybeSingle();
    return data;
}

export async function EditarProducto(p) {
    const { error } = await supabase.rpc("editarproducto", p);
    if (error) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: error.message,
        });
        throw new Error(error.message);
    }
}
