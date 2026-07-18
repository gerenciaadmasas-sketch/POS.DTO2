import { DashboardTemplate } from "../components/templates/DashboardTemplate";
import { RestauranteDashboardTemplate } from "../components/templates/RestauranteDashboardTemplate";
import { useEmpresaStore } from "../store/EmpresaStore";

export function Reportes() {
    const { dataempresa } = useEmpresaStore();
    if (dataempresa?.actividad_economica === "restaurante") {
        return <RestauranteDashboardTemplate />;
    }
    return <DashboardTemplate />;
}
