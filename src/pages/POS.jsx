import { POSTemplate, Spinner1 } from "../index";
import { useEmpresaStore } from "../store/EmpresaStore";

export function POS() {
    const { dataempresa } = useEmpresaStore();
    if (!dataempresa) return <Spinner1 />;
    return <POSTemplate />;
}
