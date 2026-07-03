import { POSTemplate, Spinner1 } from "../index";
import { SubTemplate } from "../components/templates/SubTemplate";
import { useEmpresaStore } from "../store/EmpresaStore";

export function POS() {
    const { dataempresa } = useEmpresaStore();
    if (!dataempresa) return <Spinner1 />;
    if (dataempresa.actividad_economica === "suscripciones_tv") return <SubTemplate />;
    return <POSTemplate />;
}
