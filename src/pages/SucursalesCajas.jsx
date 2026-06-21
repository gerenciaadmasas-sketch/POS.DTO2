import { Spinner1 } from "../index";
import { useEmpresaStore } from "../store/EmpresaStore";
import { SucursalesCajasTemplate } from "../components/templates/SucursalesCajasTemplate";

export function SucursalesCajas() {
    const { dataempresa } = useEmpresaStore();
    if (!dataempresa?.id) return <Spinner1 />;
    return <SucursalesCajasTemplate />;
}
