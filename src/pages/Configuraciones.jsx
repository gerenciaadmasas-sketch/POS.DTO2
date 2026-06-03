import { useQuery } from "@tanstack/react-query";
import { ConfiguracionesTemplate } from "../components/templates/ConfiguracionesTemplate";
import { useModulosStore } from "../store/ModulosStore";
import { Spinner1 } from "../components/moleculas/Spinner1";
export function Configuraciones () {
    const {mostrarModulos} = useModulosStore()
    const {isLoading,error} = useQuery({
        queryKey:["Mostrar modulos"],
        queryFn:mostrarModulos,
    });
    if (isLoading) {
        return <Spinner1/>;
    }
    if (error) {
        return <span>Error...</span>
    }
    return (<ConfiguracionesTemplate/>);
}
