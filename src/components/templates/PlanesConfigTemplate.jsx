import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MostrarConfigPlanes, EditarPrecioTier, EditarFeaturesTier, calcularPrecios } from "../../supabase/crudConfigPlanes";
import { toastExito } from "../../utils/toast";
import { RiEditLine, RiCheckLine, RiCloseLine } from "react-icons/ri";

const formatCOP = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);

const TIERS = {
    chispa: { emoji: "⚡", nombre: "Chispa", color: "#fbbf24", glow: "rgba(251,191,36,0.35)", bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.2)" },
    fuego:  { emoji: "🔥", nombre: "Fuego",  color: "#f88533", glow: "rgba(248,133,51,0.35)", bg: "rgba(248,133,51,0.06)", border: "rgba(248,133,51,0.2)" },
    cosmos: { emoji: "🌌", nombre: "Cosmos", color: "#818cf8", glow: "rgba(129,140,248,0.35)", bg: "rgba(129,140,248,0.06)", border: "rgba(129,140,248,0.2)" },
};

export function PlanesConfigTemplate() {
    const queryClient = useQueryClient();
    const { data: planes = [] } = useQuery({
        queryKey: ["config-planes"],
        queryFn: MostrarConfigPlanes,
    });

    const [bases, setBases]       = useState({});
    const [editando, setEditando] = useState(null);
    const [localF, setLocalF]     = useState({}); // {planId: [{label, activo}]}

    useEffect(() => {
        const mapB = {}, mapF = {};
        planes.forEach(p => {
            mapB[p.id] = String(p.precio_base ?? 0);
            mapF[p.id] = p.features ?? [];
        });
        setBases(mapB);
        setLocalF(mapF);
    }, [planes]);

    const mutEditar = useMutation({
        mutationFn: ({ id, precio_base }) => EditarPrecioTier({ id, precio_base }),
        onSuccess: () => {
            toastExito("Precio base actualizado");
            queryClient.invalidateQueries({ queryKey: ["config-planes"] });
            setEditando(null);
        },
    });

    const mutFeatures = useMutation({
        mutationFn: ({ id, features }) => EditarFeaturesTier({ id, features }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["config-planes"] }),
    });

    function toggleFeature(planId, idx) {
        const updated = (localF[planId] ?? []).map((f, i) =>
            i === idx ? { ...f, activo: !f.activo } : f
        );
        setLocalF({ ...localF, [planId]: updated });
        mutFeatures.mutate({ id: planId, features: updated });
    }

    return (
        <Page>
            <TopBar>
                <h1>Configuración de planes</h1>
                <p>Define el precio base mensual de cada tier — los precios bimestral y trimestral se calculan automáticamente</p>
            </TopBar>

            <Grid>
                {planes.map(plan => {
                    const cfg = TIERS[plan.tier] ?? TIERS.chispa;
                    const enEdicion = editando === plan.id;
                    const precios   = calcularPrecios(Number(bases[plan.id]) || plan.precio_base || 0);

                    return (
                        <TierCard key={plan.id} $color={cfg.color} $glow={cfg.glow} $bg={cfg.bg} $border={cfg.border}>
                            <TierEmoji>{cfg.emoji}</TierEmoji>
                            <TierNombre $color={cfg.color}>{cfg.nombre}</TierNombre>

                            {/* Precio base editable */}
                            <BaseLabel>Precio base mensual</BaseLabel>
                            {enEdicion ? (
                                <EditWrap>
                                    <BaseInput
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={bases[plan.id] ?? ""}
                                        onChange={e => setBases({ ...bases, [plan.id]: e.target.value })}
                                        autoFocus
                                        $color={cfg.color}
                                    />
                                    <EditBtns>
                                        <BtnOk
                                            $color={cfg.color}
                                            onClick={() => mutEditar.mutate({ id: plan.id, precio_base: bases[plan.id] })}
                                            disabled={mutEditar.isPending}
                                        >
                                            <RiCheckLine /> Guardar
                                        </BtnOk>
                                        <BtnCancel onClick={() => setEditando(null)}>
                                            <RiCloseLine />
                                        </BtnCancel>
                                    </EditBtns>
                                </EditWrap>
                            ) : (
                                <PrecioBase $color={cfg.color} onClick={() => setEditando(plan.id)}>
                                    {formatCOP(plan.precio_base)}
                                    <EditIcon $color={cfg.color}><RiEditLine /></EditIcon>
                                </PrecioBase>
                            )}

                            {/* Precios derivados */}
                            <DerivadosList>
                                <DerivadoItem>
                                    <DerivadoLabel>Mensual</DerivadoLabel>
                                    <DerivadoVal $color={cfg.color}>{formatCOP(precios.mensual)}</DerivadoVal>
                                </DerivadoItem>
                                <DerivadoItem>
                                    <DerivadoLabel>Bimestral <Descuento>−5%</Descuento></DerivadoLabel>
                                    <DerivadoVal $color={cfg.color}>{formatCOP(precios.bimestral)}</DerivadoVal>
                                </DerivadoItem>
                                <DerivadoItem>
                                    <DerivadoLabel>Trimestral <Descuento>−10%</Descuento></DerivadoLabel>
                                    <DerivadoVal $color={cfg.color}>{formatCOP(precios.trimestral)}</DerivadoVal>
                                </DerivadoItem>
                            </DerivadosList>

                            {/* Features del tier — click para activar/desactivar */}
                            <FeatureHint>Click para activar / desactivar</FeatureHint>
                            <FeaturesList>
                                {(localF[plan.id] ?? []).map((f, i) => (
                                    <FeatureItem
                                        key={i}
                                        $activo={f.activo}
                                        $color={cfg.color}
                                        onClick={() => toggleFeature(plan.id, i)}
                                        title={f.activo ? "Desactivar" : "Activar"}
                                    >
                                        <FeatureCheck $activo={f.activo} $color={cfg.color}>
                                            {f.activo ? <RiCheckLine /> : <RiCloseLine />}
                                        </FeatureCheck>
                                        <FeatureTxt $activo={f.activo}>{f.label}</FeatureTxt>
                                    </FeatureItem>
                                ))}
                            </FeaturesList>
                        </TierCard>
                    );
                })}
            </Grid>

            <Nota>
                Los cambios de precio aplican solo a nuevos clientes. Los existentes conservan su tarifa pactada.
            </Nota>
        </Page>
    );
}

/* ── Animations ── */
const fadeUp = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;

/* ── Layout ── */
const Page = styled.div`
    min-height: 100vh; background: ${({ theme }) => theme.bgtotal};
    padding: 28px; animation: ${fadeUp} 0.3s ease;
    @media (max-width: 767px) { padding: 68px 12px 20px; }
`;

const TopBar = styled.div`
    text-align: center; margin-bottom: 36px;
    h1 { font-size: 22px; font-weight: 900; color: ${({ theme }) => theme.text}; margin: 0 0 6px; }
    p  { font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard}; margin: 0; max-width: 480px; margin: 0 auto; line-height: 1.55; }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 860px;
    margin: 0 auto;
    @media (max-width: 780px) { grid-template-columns: 1fr; }
`;

/* ── Tier Card ── */
const TierCard = styled.div`
    background: ${({ $bg }) => $bg};
    border: 1.5px solid ${({ $border }) => $border};
    border-radius: 20px;
    padding: 28px 22px;
    display: flex; flex-direction: column; align-items: center; gap: 14px;
    transition: box-shadow 0.2s, transform 0.2s;
    &:hover {
        box-shadow: 0 0 40px ${({ $glow }) => $glow};
        transform: translateY(-3px);
    }
`;

const TierEmoji = styled.div`
    font-size: 44px; line-height: 1;
`;

const TierNombre = styled.div`
    font-size: 18px; font-weight: 900;
    color: ${({ $color }) => $color};
    font-family: "Poppins", sans-serif;
`;

const BaseLabel = styled.div`
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

const PrecioBase = styled.div`
    font-size: 28px; font-weight: 900;
    color: ${({ $color }) => $color};
    font-family: "Poppins", sans-serif;
    cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    transition: opacity 0.15s;
    &:hover { opacity: 0.8; }
`;

const EditIcon = styled.span`
    font-size: 16px; color: ${({ $color }) => $color}; opacity: 0.6;
`;

const EditWrap = styled.div`
    width: 100%; display: flex; flex-direction: column; align-items: center; gap: 8px;
`;

const BaseInput = styled.input`
    width: 100%; padding: 10px 14px; border-radius: 12px; text-align: center;
    border: 2px solid ${({ $color }) => $color};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 20px; font-weight: 800; font-family: "Poppins", sans-serif; outline: none;
    &:focus { box-shadow: 0 0 0 3px ${({ $color }) => $color}33; }
`;

const EditBtns = styled.div`
    display: flex; gap: 8px; width: 100%;
`;

const BtnOk = styled.button`
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 9px; border-radius: 10px; border: none;
    background: ${({ $color }) => $color}; color: #fff;
    font-size: 13px; font-weight: 800; cursor: pointer;
    font-family: "Poppins", sans-serif;
    &:disabled { opacity: 0.5; }
`;

const BtnCancel = styled.button`
    padding: 9px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
    background: transparent; color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 16px; cursor: pointer;
`;

/* ── Derived prices ── */
const DerivadosList = styled.div`
    width: 100%; display: flex; flex-direction: column; gap: 8px;
    border-top: 1px solid rgba(255,255,255,0.06);
    padding-top: 14px;
`;

const DerivadoItem = styled.div`
    display: flex; justify-content: space-between; align-items: center;
`;

const DerivadoLabel = styled.span`
    font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard};
    font-family: "Poppins", sans-serif;
    display: flex; align-items: center; gap: 6px;
`;

const Descuento = styled.span`
    font-size: 10px; background: rgba(74,222,128,0.15); color: #4ade80;
    border-radius: 6px; padding: 1px 5px; font-weight: 700;
`;

const DerivadoVal = styled.span`
    font-size: 13px; font-weight: 800; color: ${({ $color }) => $color};
    font-family: "Poppins", sans-serif;
`;

/* ── Features ── */
const FeatureHint = styled.div`
    font-size: 10px; color: rgba(255,255,255,0.22); font-style: italic;
    text-align: center; width: 100%;
`;

const FeaturesList = styled.ul`
    width: 100%; list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: 4px;
    border-top: 1px solid rgba(255,255,255,0.06);
    padding-top: 12px;
`;

const FeatureItem = styled.li`
    display: flex; align-items: center; gap: 8px;
    padding: 5px 8px; border-radius: 8px; cursor: pointer;
    transition: background 0.15s;
    opacity: ${({ $activo }) => $activo ? 1 : 0.45};
    &:hover { background: rgba(255,255,255,0.05); opacity: 1; }
`;

const FeatureCheck = styled.span`
    font-size: 14px; flex-shrink: 0;
    color: ${({ $activo, $color }) => $activo ? $color : "#f87171"};
`;

const FeatureTxt = styled.span`
    font-size: 12px; font-family: "Poppins", sans-serif;
    color: ${({ theme }) => theme.colorsubtitlecard};
    text-decoration: ${({ $activo }) => $activo ? "none" : "line-through"};
`;

const Nota = styled.div`
    text-align: center; margin-top: 32px;
    font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard};
    font-style: italic;
`;
