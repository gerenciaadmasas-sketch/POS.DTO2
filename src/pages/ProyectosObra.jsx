import { useEmpresaStore } from "../store/EmpresaStore";
import { ProyectosObraTemplate } from "../components/templates/ProyectosObraTemplate";
import { Spinner1 } from "../index";

export function ProyectosObra() {
    const { dataempresa } = useEmpresaStore();
    if (!dataempresa) return <Spinner1 />;
    return <ProyectosObraTemplate />;
}
