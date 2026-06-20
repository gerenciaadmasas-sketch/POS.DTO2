import { useQuery } from "@tanstack/react-query";
import { Spinner1 } from "../index";
import { useEmpresaStore } from "../store/EmpresaStore";
import { useTicketConfigStore } from "../store/TicketConfigStore";
import { TicketConfigTemplate } from "../components/templates/TicketConfigTemplate";

export function TicketConfig() {
    const { dataempresa } = useEmpresaStore();
    const { mostrarTicketConfig } = useTicketConfigStore();

    const { isLoading, error } = useQuery({
        queryKey: ["Mostrar ticket config", dataempresa?.id],
        queryFn: () => mostrarTicketConfig({ id_empresa: dataempresa?.id }),
        enabled: !!dataempresa?.id,
        refetchOnWindowFocus: false,
    });

    if (isLoading) return <Spinner1 />;
    if (error) return <span>error...</span>;

    return <TicketConfigTemplate />;
}
