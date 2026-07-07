import { useEmpresaStore } from "../store/EmpresaStore";
import { PropiedadesTemplate } from "../components/templates/PropiedadesTemplate";
import { Spinner1 } from "../index";

export function Propiedades() {
    const { dataempresa } = useEmpresaStore();
    if (!dataempresa) return <Spinner1 />;
    return <PropiedadesTemplate />;
}
