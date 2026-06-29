import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ProductoTemplate, Spinner1, useProductosStore, useCategoriasStore, useEmpresaStore, useSucursalesStore } from "../index";
import { useAlmacenesConfigStore } from "../store/AlmacenesConfigStore";

export function Productos() {
    const { mostrarProductos, buscarProductos, buscador } = useProductosStore();
    const { mostrarCategorias } = useCategoriasStore();
    const { mostrarSucursales } = useSucursalesStore();
    const { mostrarAlmacenes } = useAlmacenesConfigStore();
    const { dataempresa } = useEmpresaStore();

    useQuery({
        queryKey: ["Mostrar categorias", dataempresa?.id],
        queryFn: () => mostrarCategorias({ id_empresa: dataempresa?.id }),
        enabled: !!dataempresa?.id,
        refetchOnWindowFocus: false,
    });

    useQuery({
        queryKey: ["Mostrar sucursales", dataempresa?.id],
        queryFn: () => mostrarSucursales({ id_empresa: dataempresa?.id }),
        enabled: !!dataempresa?.id,
        refetchOnWindowFocus: false,
    });

    useQuery({
        queryKey: ["Mostrar almacenes-prod", dataempresa?.id],
        queryFn: () => mostrarAlmacenes({ id_empresa: dataempresa?.id }),
        enabled: !!dataempresa?.id,
        refetchOnWindowFocus: false,
    });

    const { isLoading, error } = useQuery({
        queryKey: ["Mostrar productos", dataempresa?.id],
        queryFn: () => mostrarProductos({ id_empresa: dataempresa?.id }),
        enabled: !!dataempresa?.id,
        refetchOnWindowFocus: false,
    });

    // Buscar productos — igual que categorías: siempre activo, sin condicionar a buscador
    useQuery({
        queryKey: ["Buscar productos", buscador],
        queryFn: () => buscarProductos({ id_empresa: dataempresa?.id, descripcion: buscador }),
        enabled: !!dataempresa?.id,
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
    });

    if (isLoading) return <Spinner1 />;
    if (error) return <span>error...</span>;

    return <ProductoTemplate />;
}
