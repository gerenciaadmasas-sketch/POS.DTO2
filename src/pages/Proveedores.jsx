import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ProveedoresTemplate } from "../components/templates/ProveedoresTemplate";
import { Spinner1 } from "../index";
import { useEmpresaStore } from "../store/EmpresaStore";
import { useProveedoresStore } from "../store/ProveedoresStore";

export function Proveedores() {
    const { mostrarProveedores, buscarProveedores, buscador } = useProveedoresStore();
    const { dataempresa } = useEmpresaStore();

    const { isLoading, error } = useQuery({
        queryKey: ["Mostrar proveedores", dataempresa?.id],
        queryFn: () => mostrarProveedores({ id_empresa: dataempresa?.id }),
        enabled: !!dataempresa?.id,
        refetchOnWindowFocus: false,
    });

    useQuery({
        queryKey: ["Buscar proveedores", buscador],
        queryFn: () => buscarProveedores({ id_empresa: dataempresa?.id, busqueda: buscador }),
        enabled: !!dataempresa?.id,
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
    });

    if (isLoading) return <Spinner1 />;
    if (error) return <span>error...</span>;

    return <ProveedoresTemplate />;
}
