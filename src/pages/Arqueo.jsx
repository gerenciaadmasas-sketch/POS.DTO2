import { ArqueoTemplate } from "../components/templates/ArqueoTemplate";
import { ArqueoRestauranteTemplate } from "../components/templates/ArqueoRestauranteTemplate";
import { useEmpresaStore } from "../store/EmpresaStore";

export function Arqueo() {
    const { dataempresa } = useEmpresaStore();
    if (dataempresa?.actividad_economica === "restaurante") {
        return <ArqueoRestauranteTemplate />;
    }
    return <ArqueoTemplate />;
}
