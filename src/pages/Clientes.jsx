import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ClientesTemplate } from "../components/templates/ClientesTemplate";
import { Spinner1 } from "../index";
import { useEmpresaStore } from "../store/EmpresaStore";
import { useClientesStore } from "../store/ClientesStore";

export function Clientes() {
    const { mostrarClientes, buscarClientes, buscador } = useClientesStore();
    const { dataempresa } = useEmpresaStore();

    const { isLoading, error } = useQuery({
        queryKey: ["Mostrar clientes", dataempresa?.id],
        queryFn: () => mostrarClientes({ id_empresa: dataempresa?.id }),
        enabled: !!dataempresa?.id,
        refetchOnWindowFocus: false,
    });

    useQuery({
        queryKey: ["Buscar clientes", buscador],
        queryFn: () => buscarClientes({ id_empresa: dataempresa?.id, busqueda: buscador }),
        enabled: !!dataempresa?.id,
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
    });

    if (isLoading) return <Spinner1 />;
    if (error) return <span>error...</span>;

    return <ClientesTemplate />;
}
