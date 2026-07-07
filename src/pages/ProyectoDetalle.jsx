import { useEmpresaStore } from "../store/EmpresaStore";
import { ProyectoDetalleTemplate } from "../components/templates/ProyectoDetalleTemplate";
import { Spinner1 } from "../index";

export function ProyectoDetalle() {
    const { dataempresa } = useEmpresaStore();
    if (!dataempresa) return <Spinner1 />;
    return <ProyectoDetalleTemplate />;
}
