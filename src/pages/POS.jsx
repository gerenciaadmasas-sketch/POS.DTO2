import { POSTemplate, Spinner1 } from "../index";
import { TVPosTemplate } from "../components/templates/TVPosTemplate";
import { useEmpresaStore } from "../store/EmpresaStore";

export function POS() {
    const { dataempresa } = useEmpresaStore();
    if (!dataempresa) return <Spinner1 />;
    if (dataempresa.actividad_economica === "suscripciones_tv") return <TVPosTemplate />;
    return <POSTemplate />;
}
