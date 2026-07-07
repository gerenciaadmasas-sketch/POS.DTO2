import { useEmpresaStore } from "../store/EmpresaStore";
import { ArrendamientosTemplate } from "../components/templates/ArrendamientosTemplate";
import { Spinner1 } from "../index";

export function Arrendamientos() {
    const { dataempresa } = useEmpresaStore();
    if (!dataempresa) return <Spinner1 />;
    return <ArrendamientosTemplate />;
}
