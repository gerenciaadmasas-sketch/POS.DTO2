import { useEmpresaStore } from "../store/EmpresaStore";
import { CocinaTemplate } from "../components/templates/CocinaTemplate";
export function Cocina() {
    const { dataempresa } = useEmpresaStore();
    return <CocinaTemplate id_empresa={dataempresa?.id} />;
}
