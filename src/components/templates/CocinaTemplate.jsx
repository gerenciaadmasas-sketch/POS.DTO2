import { useState, useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase/supabase.config";
import { MostrarComandasActivas, CambiarEstadoItem, CambiarEstadoComanda } from "../../supabase/crudRestaurante";
import { RiRestaurantLine, RiCheckLine, RiTimeLine, RiFireLine } from "react-icons/ri";

const ESTADO_ITEM = {
    pendiente:      { label: "Pendiente",      color: "#f59e0b", next: "en_preparacion", nextLabel: "Preparando" },
    en_preparacion: { label: "En preparación", color: "#6366f1", next: "listo",          nextLabel: "Listo ✓"   },
    listo:          { label: "Listo",           color: "#22c55e", next: null,             nextLabel: null        },
};

function useIdEmpresaFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("empresa") ?? null;
}

export function CocinaTemplate({ id_empresa: propIdEmpresa }) {
    const id_empresa = propIdEmpresa ?? useIdEmpresaFromURL();
    const qc = useQueryClient();

    const { data: comandas = [], refetch } = useQuery({
        queryKey: ["comandas-cocina", id_empresa],
        queryFn: () => MostrarComandasActivas({ id_empresa }),
        enabled: !!id_empresa,
        refetchInterval: 15000,
    });

    useEffect(() => {
        if (!id_empresa) return;
        const ch = supabase
            .channel(`cocina-realtime-${id_empresa}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "comandas",      filter: `id_empresa=eq.${id_empresa}` }, () => refetch())
            .on("postgres_changes", { event: "*", schema: "public", table: "comanda_items", filter: `id_empresa=eq.${id_empresa}` }, () => refetch())
            .subscribe();
        return () => supabase.removeChannel(ch);
    }, [id_empresa, refetch]);

    const activas = comandas.filter(c => ["abierta", "en_cocina"].includes(c.estado));
    const listas  = comandas.filter(c => c.estado === "lista");

    const avanzarItem = async (item) => {
        const cfg = ESTADO_ITEM[item.estado];
        if (!cfg?.next) return;
        await CambiarEstadoItem({ id: item.id, estado: cfg.next });
        refetch();
    };

    const marcarListaComanda = async (cmd) => {
        await CambiarEstadoComanda({ id: cmd.id, estado: "lista" });
        refetch();
    };

    return (
        <Page>
            <TopBar>
                <LogoArea>
                    <RiRestaurantLine size={22} />
                    <span>Cocina · SaaS.DTO2</span>
                </LogoArea>
                <Stats>
                    <Chip $c="#f59e0b">{activas.length} en curso</Chip>
                    <Chip $c="#22c55e">{listas.length} listas</Chip>
                </Stats>
                <Clock />
            </TopBar>

            {activas.length === 0 && listas.length === 0 ? (
                <EmptyWrap>
                    <RiFireLine size={48} style={{ color: "#f97316", opacity: 0.4 }} />
                    <p>Sin comandas activas</p>
                </EmptyWrap>
            ) : (
                <BoardGrid>
                    {/* ── En cocina ── */}
                    <Column>
                        <ColHeader $c="#f59e0b">
                            <RiTimeLine /> En cocina ({activas.length})
                        </ColHeader>
                        <AnimatePresence>
                            {activas.map(cmd => (
                                <ComandaCard key={cmd.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    layout
                                >
                                    <CardHeader>
                                        <MesaLabel>{cmd.mesas?.nombre ?? `Mesa ${cmd.mesas?.numero ?? "?"}`}</MesaLabel>
                                        <TimeLabel>{new Date(cmd.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</TimeLabel>
                                    </CardHeader>
                                    <ItemsList>
                                        {(cmd.comanda_items ?? []).filter(i => i.estado !== "listo").map(item => {
                                            const cfg = ESTADO_ITEM[item.estado] ?? ESTADO_ITEM.pendiente;
                                            return (
                                                <ItemRow key={item.id} $color={cfg.color}>
                                                    <ItemQty>{item.cantidad}×</ItemQty>
                                                    <ItemName>{item.nombre}</ItemName>
                                                    {cfg.next && (
                                                        <AvanzarBtn $color={cfg.color} onClick={() => avanzarItem(item)}>
                                                            {cfg.nextLabel}
                                                        </AvanzarBtn>
                                                    )}
                                                </ItemRow>
                                            );
                                        })}
                                        {(cmd.comanda_items ?? []).filter(i => i.estado === "listo").map(item => (
                                            <ItemRow key={item.id} $color="#22c55e" style={{ opacity: 0.4 }}>
                                                <RiCheckLine style={{ color: "#22c55e", flexShrink: 0 }} />
                                                <ItemQty>{item.cantidad}×</ItemQty>
                                                <ItemName style={{ textDecoration: "line-through" }}>{item.nombre}</ItemName>
                                                <span style={{ fontSize: 11, color: "#22c55e" }}>Listo</span>
                                            </ItemRow>
                                        ))}
                                    </ItemsList>
                                    {(cmd.comanda_items ?? []).every(i => i.estado === "listo") && (
                                        <BtnListaComanda onClick={() => marcarListaComanda(cmd)}>
                                            <RiCheckLine /> Marcar lista para entrega
                                        </BtnListaComanda>
                                    )}
                                </ComandaCard>
                            ))}
                        </AnimatePresence>
                    </Column>

                    {/* ── Lista para entrega ── */}
                    <Column>
                        <ColHeader $c="#22c55e">
                            <RiCheckLine /> Lista para entrega ({listas.length})
                        </ColHeader>
                        <AnimatePresence>
                            {listas.map(cmd => (
                                <ComandaCard key={cmd.id} $lista
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    layout
                                >
                                    <CardHeader>
                                        <MesaLabel $lista>{cmd.mesas?.nombre ?? `Mesa ${cmd.mesas?.numero ?? "?"}`}</MesaLabel>
                                        <ReadyChip>Lista ✓</ReadyChip>
                                    </CardHeader>
                                    <ItemsList>
                                        {(cmd.comanda_items ?? []).map(item => (
                                            <ItemRow key={item.id} $color="#22c55e">
                                                <RiCheckLine style={{ color: "#22c55e", flexShrink: 0 }} />
                                                <ItemQty>{item.cantidad}×</ItemQty>
                                                <ItemName>{item.nombre}</ItemName>
                                            </ItemRow>
                                        ))}
                                    </ItemsList>
                                </ComandaCard>
                            ))}
                        </AnimatePresence>
                    </Column>
                </BoardGrid>
            )}
        </Page>
    );
}

function Clock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return (
        <ClockWrap>
            {time.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </ClockWrap>
    );
}

/* ── Styled Components ─────────────────────────────────────── */
const Page = styled.div`
    min-height: 100vh;
    background: #0d0f14;
    display: flex; flex-direction: column;
`;

const TopBar = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px;
    background: #161920;
    border-bottom: 1px solid rgba(255,255,255,0.07);
`;

const LogoArea = styled.div`
    display: flex; align-items: center; gap: 10px;
    font-size: 16px; font-weight: 800; color: #f97316;
    font-family: "Poppins", sans-serif;
`;

const Stats = styled.div`display: flex; gap: 10px;`;

const Chip = styled.span`
    padding: 4px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 700;
    color: ${({ $c }) => $c};
    background: ${({ $c }) => $c}18;
    border: 1px solid ${({ $c }) => $c}44;
`;

const ClockWrap = styled.div`
    font-size: 15px; font-weight: 700;
    color: rgba(255,255,255,0.4);
    font-family: "Poppins", sans-serif;
    letter-spacing: 0.5px;
`;

const EmptyWrap = styled.div`
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; color: rgba(255,255,255,0.3);
    font-size: 16px; font-family: "Poppins", sans-serif;
`;

const BoardGrid = styled.div`
    flex: 1; display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0; overflow: hidden;
    @media (max-width: 640px) {
        grid-template-columns: 1fr;
        overflow-y: auto;
    }
`;

const Column = styled.div`
    display: flex; flex-direction: column; gap: 14px;
    padding: 20px; overflow-y: auto;
    &:first-child { border-right: 1px solid rgba(255,255,255,0.07); }
`;

const ColHeader = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 1px;
    color: ${({ $c }) => $c};
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    font-family: "Poppins", sans-serif;
`;

const blink = keyframes`
    0%, 100% { box-shadow: 0 0 0 rgba(249,115,22,0); }
    50%       { box-shadow: 0 0 16px rgba(249,115,22,0.25); }
`;

const ComandaCard = styled(motion.div)`
    border-radius: 16px;
    border: 1px solid ${({ $lista }) => $lista ? "rgba(34,197,94,0.2)" : "rgba(249,115,22,0.15)"};
    background: ${({ $lista }) => $lista ? "rgba(34,197,94,0.04)" : "rgba(249,115,22,0.04)"};
    padding: 16px;
    animation: ${({ $lista }) => $lista ? "none" : css`${blink} 2s ease-in-out infinite`};
`;

const CardHeader = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px;
`;

const MesaLabel = styled.div`
    font-size: 16px; font-weight: 900;
    color: ${({ $lista }) => $lista ? "#22c55e" : "#f97316"};
    font-family: "Poppins", sans-serif;
`;

const TimeLabel = styled.div`
    font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 600;
`;

const ReadyChip = styled.span`
    font-size: 11px; font-weight: 800; color: #22c55e;
    background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.3);
    padding: 2px 8px; border-radius: 20px;
`;

const ItemsList = styled.div`
    display: flex; flex-direction: column; gap: 8px;
`;

const ItemRow = styled.div`
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 10px;
    background: rgba(255,255,255,0.03);
    border-left: 3px solid ${({ $color }) => $color};
`;

const ItemQty = styled.span`
    font-size: 14px; font-weight: 800; color: rgba(255,255,255,0.6);
    min-width: 26px; font-family: "Poppins", sans-serif;
`;

const ItemName = styled.span`
    flex: 1; font-size: 14px; font-weight: 700;
    color: rgba(255,255,255,0.85); font-family: "Poppins", sans-serif;
`;

const AvanzarBtn = styled.button`
    padding: 4px 10px; border-radius: 8px; border: none;
    background: ${({ $color }) => $color}20;
    color: ${({ $color }) => $color};
    font-size: 11px; font-weight: 800;
    font-family: "Poppins", sans-serif; cursor: pointer;
    white-space: nowrap;
    border: 1px solid ${({ $color }) => $color}44;
    transition: background 0.15s;
    &:hover { background: ${({ $color }) => $color}35; }
`;

const BtnListaComanda = styled.button`
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; margin-top: 12px; padding: 10px;
    border-radius: 10px; border: none;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff; font-size: 13px; font-weight: 800;
    font-family: "Poppins", sans-serif; cursor: pointer;
    transition: filter 0.15s;
    &:hover { filter: brightness(1.1); }
`;
