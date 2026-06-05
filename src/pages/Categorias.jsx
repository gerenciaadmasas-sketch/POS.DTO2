import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { CategoriasTemplate, Spinner1, useCategoriasStore, useEmpresaStore } from "../index";

export function Categorias() {
    const { mostrarCategorias, buscarCategorias, buscador } = useCategoriasStore();
    const { dataempresa } = useEmpresaStore();
    const { isLoading, error } = useQuery({
        queryKey: ["Mostrar categorias", dataempresa?.id],
        queryFn: () => mostrarCategorias({ id_empresa: dataempresa?.id }),
        enabled: !!dataempresa?.id, refetchOnWindowFocus: false
    })

    //Buscar categorias
    const { } = useQuery({
        queryKey: ["Buscar categorias", buscador],
        queryFn: () => buscarCategorias({ id_empresa: dataempresa?.id, descripcion: buscador }),
        enabled: !!dataempresa?.id,
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
    })

    if (isLoading) {
        return (<Spinner1 />)
    }
    if (error) {
        return (<span>error...</span>)
    }
    return (<CategoriasTemplate />);
}