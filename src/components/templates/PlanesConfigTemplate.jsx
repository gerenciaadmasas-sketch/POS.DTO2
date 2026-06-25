import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MostrarConfigPlanes, EditarPrecioPlan } from "../../supabase/crudConfigPlanes";
import { toastExito } from "../../utils/toast";
import { Icon } from "@iconify/react";

const formatCOP = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);

const PLAN_ICONS = {
    mensual:    { icon: "solar:calendar-bold-duotone", color: "#60a5fa" },
    bimestral:  { icon: "solar:calendar-search-bold-duotone", color: "#f59e0b" },
    trimestral: { icon: "solar:calendar-mark-bold-duotone", color: "#4ade80" },
};

export function PlanesConfigTemplate() {
    const queryClient = useQueryClient();
    const { data: planes = [] } = useQuery({
        queryKey: ["config-planes"],
        queryFn: MostrarConfigPlanes,
    });

    const [precios, setPrecios] = useState({});
    const [editando, setEditando] = useState(null);

    useEffect(() => {
        const map = {};
        planes.forEach(p => { map[p.id] = String(p.precio ?? 0); });
        setPrecios(map);
    }, [planes]);

    const mutEditar = useMutation({
        mutationFn: ({ id, precio }) => EditarPrecioPlan({ id, precio: Number(precio) || 0 }),
        onSuccess: () => {
            toastExito("Precio actualizado");
            queryClient.invalidateQueries({ queryKey: ["config-planes"] });
            setEditando(null);
        },
    });

    return (
        <Page>
            <TopBar>
                <h1>Precios de planes</h1>
                <p>configura el valor de cada plan de suscripción</p>
            </TopBar>

            <Grid>
                {planes.map(plan => {
                    const cfg = PLAN_ICONS[plan.plan] ?? PLAN_ICONS.mensual;
                    const enEdicion = editando === plan.id;
                    return (
                        <PlanCard key={plan.id}>
                            <PlanIcon $color={cfg.color}>
                                <Icon icon={cfg.icon} />
                            </PlanIcon>
                            <PlanNombre>{plan.plan}</PlanNombre>
                            {enEdicion ? (
                                <EditRow>
                                    <PlanInput
                                        type="number"
                                        min="0"
                                        value={precios[plan.id] ?? ""}
                                        onChange={e => setPrecios({ ...precios, [plan.id]: e.target.value })}
                                        autoFocus
                                    />
                                    <BtnGuardar onClick={() => mutEditar.mutate({ id: plan.id, precio: precios[plan.id] })}>
                                        Guardar
                                    </BtnGuardar>
                                    <BtnCancelar onClick={() => setEditando(null)}>
                                        Cancelar
                                    </BtnCancelar>
                                </EditRow>
                            ) : (
                                <PrecioRow onClick={() => setEditando(plan.id)}>
                                    <PlanPrecio>{formatCOP(plan.precio)}</PlanPrecio>
                                    <EditHint>clic para editar</EditHint>
                                </PrecioRow>
                            )}
                        </PlanCard>
                    );
                })}
            </Grid>

            <Nota>
                Los cambios en precios solo aplican a nuevos clientes. Los clientes existentes conservan su precio original.
            </Nota>
        </Page>
    );
}

const fadeUp = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;

const Page = styled.div`
    min-height: 100vh; background: ${({ theme }) => theme.bgtotal};
    padding: 28px; animation: ${fadeUp} 0.3s ease;
    @media (max-width: 767px) { padding: 68px 12px 20px; }
`;

const TopBar = styled.div`
    text-align: center; margin-bottom: 32px;
    h1 { font-size: 22px; font-weight: 900; color: ${({ theme }) => theme.text}; margin: 0 0 4px; }
    p { font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard}; margin: 0; }
`;

const Grid = styled.div`
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
    max-width: 720px; margin: 0 auto;
    @media (max-width: 700px) { grid-template-columns: 1fr; }
`;

const PlanCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 18px; padding: 28px 20px;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    transition: box-shadow 0.2s;
    &:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.12); }
`;

const PlanIcon = styled.div`
    font-size: 42px; color: ${({ $color }) => $color};
`;

const PlanNombre = styled.div`
    font-size: 16px; font-weight: 900; text-transform: capitalize;
    color: ${({ theme }) => theme.text};
`;

const PrecioRow = styled.div`
    cursor: pointer; text-align: center;
    &:hover span:last-child { opacity: 1; }
`;

const PlanPrecio = styled.div`
    font-size: 24px; font-weight: 900; color: #4ade80;
`;

const EditHint = styled.span`
    display: block; font-size: 10px; color: ${({ theme }) => theme.colorsubtitlecard};
    opacity: 0; transition: opacity 0.2s; margin-top: 4px;
`;

const EditRow = styled.div`
    display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%;
`;

const PlanInput = styled.input`
    width: 100%; padding: 10px; border-radius: 10px; text-align: center;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 18px; font-weight: 800; font-family: "Poppins", sans-serif; outline: none;
    &:focus { border-color: #f88533; }
`;

const BtnGuardar = styled.button`
    width: 100%; padding: 8px; border-radius: 8px; border: none;
    background: #f88533; color: #fff; font-size: 12px; font-weight: 700;
    cursor: pointer; font-family: "Poppins", sans-serif;
`;

const BtnCancelar = styled.button`
    background: none; border: none; color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 11px; cursor: pointer; font-family: "Poppins", sans-serif;
`;

const Nota = styled.div`
    text-align: center; margin-top: 28px; font-size: 12px;
    color: ${({ theme }) => theme.colorsubtitlecard}; font-style: italic;
`;
