import { useQuery } from "@tanstack/react-query";
import { ProductoTemplate, Spinner1, useProductosStore, useCategoriasStore, useEmpresaStore } from "../index";

export function Productos() {
    const { mostrarProductos, buscarProductos, buscador } = useProductosStore();
    const { mostrarCategorias } = useCategoriasStore();
    const { dataempresa } = useEmpresaStore();

    useQuery({
        queryKey: ["Mostrar categorias", dataempresa?.id],
        queryFn: () => mostrarCategorias({ id_empresa: dataempresa?.id }),
        enabled: !!dataempresa?.id,
        refetchOnWindowFocus: false,
    });

    const { isLoading, error } = useQuery({
        queryKey: ["Mostrar productos", dataempresa?.id],
        queryFn: () => mostrarProductos({ id_empresa: dataempresa?.id }),
        enabled: !!dataempresa?.id,
        refetchOnWindowFocus: false,
    });

    useQuery({
        queryKey: ["Buscar productos", buscador],
        queryFn: () => buscarProductos({ id_empresa: dataempresa?.id, descripcion: buscador }),
        enabled: !!dataempresa?.id && !!buscador,
        refetchOnWindowFocus: false,
    });

    if (isLoading) return <Spinner1 />;
    if (error) return <span>error...</span>;

    return <ProductoTemplate />;
}
