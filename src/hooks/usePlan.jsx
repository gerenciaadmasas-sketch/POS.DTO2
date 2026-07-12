import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase/supabase.config";
import { useEmpresaStore } from "../store/EmpresaStore";
import { useUsuariosStore } from "../store/UsuariosStore";

export const LIMITES_PLAN = {
    chispa: { max_usuarios: 2,        max_almacenes: 1,        kardex: false, label: "Chispa ⚡" },
    fuego:  { max_usuarios: 10,       max_almacenes: 3,        kardex: true,  label: "Fuego 🔥"  },
    cosmos: { max_usuarios: 12,       max_almacenes: 6,        kardex: true,  label: "Cosmos 🌌" },
};

export function usePlan() {
    const { dataempresa }  = useEmpresaStore();
    const { datausuarios } = useUsuariosStore();
    const id_empresa   = dataempresa?.id;
    const esSuperadmin = datausuarios?.tipo === "superadmin";

    const { data: suscripcion, isLoading } = useQuery({
        queryKey: ["plan-suscripcion", id_empresa],
        queryFn: async () => {
            const { data } = await supabase
                .from("suscripciones")
                .select("tipo_plan, estado, fecha_proximo_pago, valor_mensual, nombre_cliente, apellido_cliente, gracia_hasta, descuento_pct")
                .eq("id_empresa", id_empresa)
                .maybeSingle();
            return data;
        },
        enabled: !!id_empresa && !esSuperadmin,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const tipoPlan = suscripcion?.tipo_plan ?? "chispa";
    const limites  = LIMITES_PLAN[tipoPlan] ?? LIMITES_PLAN.chispa;

    // Calcular días de mora (positivo = días vencidos)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaPago = suscripcion?.fecha_proximo_pago
        ? new Date(suscripcion.fecha_proximo_pago + "T00:00:00")
        : null;
    const diasMora = fechaPago
        ? Math.floor((hoy - fechaPago) / (1000 * 60 * 60 * 24))
        : 0;

    // Si el superadmin otorgó gracia, verificar si sigue vigente
    const graciaHasta = suscripcion?.gracia_hasta
        ? new Date(suscripcion.gracia_hasta + "T00:00:00")
        : null;
    const enGracia = graciaHasta ? hoy <= graciaHasta : false;

    // Suspendido: más de 3 días de mora Y sin período de gracia activo
    const suspendido = !esSuperadmin && !!id_empresa && !isLoading && diasMora >= 3 && !enGracia;

    const descuentoPct = suscripcion?.descuento_pct ?? 0;
    const valorConDescuento = suscripcion?.valor_mensual
        ? Math.round(suscripcion.valor_mensual * (1 - descuentoPct / 100))
        : 0;

    return {
        tipoPlan,
        limites,
        suscripcion,
        diasMora,
        suspendido,
        enGracia,
        descuentoPct,
        valorConDescuento,
        cargando: isLoading,
        esSuperadmin,
    };
}
