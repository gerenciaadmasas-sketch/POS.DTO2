import { useEmpresaStore } from "../store/EmpresaStore";
import { AdministracionTemplate } from "../components/templates/AdministracionTemplate";
import { Spinner1 } from "../index";

export function Administracion() {
    const { dataempresa } = useEmpresaStore();
    if (!dataempresa) return <Spinner1 />;
    return <AdministracionTemplate />;
}
