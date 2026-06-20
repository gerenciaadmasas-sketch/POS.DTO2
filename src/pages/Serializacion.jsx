import { useQuery } from "@tanstack/react-query";
import { Spinner1 } from "../index";
import { useEmpresaStore } from "../store/EmpresaStore";
import { useComprobantesStore } from "../store/ComprobantesStore";
import { SerializacionTemplate } from "../components/templates/SerializacionTemplate";

export function Serializacion() {
    const { dataempresa } = useEmpresaStore();
    const { mostrarComprobantes } = useComprobantesStore();

    const { isLoading, error } = useQuery({
        queryKey: ["Mostrar comprobantes", dataempresa?.id],
        queryFn: () => mostrarComprobantes({ id_empresa: dataempresa?.id }),
        enabled: !!dataempresa?.id,
        refetchOnWindowFocus: false,
    });

    if (isLoading) return <Spinner1 />;
    if (error) return <span>error...</span>;

    return <SerializacionTemplate />;
}
