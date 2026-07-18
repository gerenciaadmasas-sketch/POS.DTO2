import { useState, useMemo } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { ObtenerStatsRestaurante } from "../../supabase/crudRestaurante";
import {
    RiRestaurantLine,
    RiMoneyDollarCircleLine,
    RiFileListLine,
    RiBarChartBoxLine,
    RiTableLine,
    RiBankCardLine,
    RiSmartphoneLine,
    RiBankLine,
    RiExchangeDollarLine,
    RiLoader4Line,
    RiCheckboxCircleLine,
    RiTrophyLine,
} from "react-icons/ri";

const cop = (v) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

function getRangoHoy() {
    const ahora  = new Date();
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const fin    = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
    return { desde: inicio.toISOString(), hasta: fin.toISOString() };
}

const METODO_META = {
    efectivo:      { label: "Efectivo",      icon: RiMoneyDollarCircleLine, color: "#22c55e" },
    tarjeta:       { label: "Tarjeta",        icon: RiBankCardLine,          color: "#6366f1" },
    transferencia: { label: "Transferencia",  icon: RiBankLine,              color: "#3b82f6" },
    nequi:         { label: "Nequi / Daviplata", icon: RiSmartphoneLine,     color: "#a855f7" },
};

export function ArqueoRestauranteTemplate() {
    const { dataempresa } = useEmpresaStore();
    const id_empresa = dataempresa?.id;
    const rango = useMemo(() => getRangoHoy(), []);

    const { data: stats, isLoading } = useQuery({
        queryKey: ["arqueo-restaurante", id_empresa, rango.desde],
        queryFn: () => ObtenerStatsRestaurante({ id_empresa, ...rango }),
        enabled: !!id_empresa,
        staleTime: 30_000,
    });

    const efectivoTotal = (stats?.porMetodo ?? []).find(m => m.metodo === "efectivo")?.total ?? 0;

    return (
        <Page>
            <Header>
                <TitleRow>
                    <RiRestaurantLine size={22} />
                    <div>
                        <h1>Arqueo del día</h1>
                        <Fecha>{new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</Fecha>
                    </div>
                </TitleRow>
            </Header>

            {isLoading ? (
                <LoadingWrap>
                    <RiLoader4Line size={32} className="spin" />
                    <span>Cargando cierre del día…</span>
                </LoadingWrap>
            ) : (
                <>
                    {/* Resumen general */}
                    <KpiGrid>
                        <KpiCard $accent="#f97316">
                            <KpiIcon $accent="#f97316"><RiMoneyDollarCircleLine size={26} /></KpiIcon>
                            <KpiBody>
                                <KpiValue>{cop(stats?.totalIngresos ?? 0)}</KpiValue>
                                <KpiLabel>Total recaudado hoy</KpiLabel>
                            </KpiBody>
                        </KpiCard>
                        <KpiCard $accent="#22c55e">
                            <KpiIcon $accent="#22c55e"><RiMoneyDollarCircleLine size={26} /></KpiIcon>
                            <KpiBody>
                                <KpiValue>{cop(efectivoTotal)}</KpiValue>
                                <KpiLabel>Efectivo en caja</KpiLabel>
                            </KpiBody>
                        </KpiCard>
                        <KpiCard $accent="#6366f1">
                            <KpiIcon $accent="#6366f1"><RiFileListLine size={26} /></KpiIcon>
                            <KpiBody>
                                <KpiValue>{stats?.totalComandas ?? 0}</KpiValue>
                                <KpiLabel>Comandas cobradas</KpiLabel>
                            </KpiBody>
                        </KpiCard>
                        <KpiCard $accent="#f59e0b">
                            <KpiIcon $accent="#f59e0b"><RiBarChartBoxLine size={26} /></KpiIcon>
                            <KpiBody>
                                <KpiValue>{cop(stats?.ticketPromedio ?? 0)}</KpiValue>
                                <KpiLabel>Ticket promedio</KpiLabel>
                            </KpiBody>
                        </KpiCard>
                    </KpiGrid>

                    <BottomGrid>
                        {/* Desglose por método de pago */}
                        <Section>
                            <SectionTitle>
                                <RiExchangeDollarLine size={16} />
                                Desglose por método de pago
                            </SectionTitle>
                            {(stats?.porMetodo ?? []).length === 0 ? (
                                <EmptyTip>Sin cobros registrados hoy</EmptyTip>
                            ) : (
                                <>
                                    <MetodosList>
                                        {(stats?.porMetodo ?? []).map(m => {
                                            const meta = METODO_META[m.metodo] ?? { label: m.metodo, icon: RiMoneyDollarCircleLine, color: "#94a3b8" };
                                            const MetodoIcon = meta.icon;
                                            const pct = stats?.totalIngresos > 0
                                                ? Math.round((m.total / stats.totalIngresos) * 100) : 0;
                                            return (
                                                <MetodoFila key={m.metodo}>
                                                    <MetodoHead>
                                                        <MetodoIconWrap $color={meta.color}>
                                                            <MetodoIcon size={16} />
                                                        </MetodoIconWrap>
                                                        <MetodoNombre>{meta.label}</MetodoNombre>
                                                        <MetodoCmds>{m.count} cmd</MetodoCmds>
                                                        <MetodoMonto>{cop(m.total)}</MetodoMonto>
                                                        <MetodoPct $color={meta.color}>{pct}%</MetodoPct>
                                                    </MetodoHead>
                                                    <BarRow>
                                                        <BarFill style={{ width: `${pct}%`, background: meta.color }} />
                                                    </BarRow>
                                                </MetodoFila>
                                            );
                                        })}
                                    </MetodosList>

                                    <TotalRow>
                                        <RiCheckboxCircleLine size={18} color="#22c55e" />
                                        <TotalLabel>Total recaudado</TotalLabel>
                                        <TotalMonto>{cop(stats?.totalIngresos ?? 0)}</TotalMonto>
                                    </TotalRow>
                                </>
                            )}
                        </Section>

                        {/* Plato más vendido */}
                        <SideSection>
                            <Section>
                                <SectionTitle>
                                    <RiTrophyLine size={16} />
                                    Platos más vendidos
                                </SectionTitle>
                                {(stats?.topItems ?? []).length === 0 ? (
                                    <EmptyTip>Sin datos hoy</EmptyTip>
                                ) : (
                                    <TopPlatosList>
                                        {(stats?.topItems ?? []).slice(0, 3).map((item, i) => (
                                            <TopPlatoRow key={item.nombre} $primero={i === 0}>
                                                <TopRank $primero={i === 0}>#{i + 1}</TopRank>
                                                <TopNombre>{item.nombre}</TopNombre>
                                                <TopQty>{item.cantidad} uds</TopQty>
                                            </TopPlatoRow>
                                        ))}
                                    </TopPlatosList>
                                )}
                            </Section>

                            <Section style={{ marginTop: 16 }}>
                                <SectionTitle>
                                    <RiTableLine size={16} />
                                    Estado actual
                                </SectionTitle>
                                <EstadoRow>
                                    <EstadoLabel>Mesas activas ahora</EstadoLabel>
                                    <EstadoVal $color="#f59e0b">{stats?.mesasActivas ?? 0}</EstadoVal>
                                </EstadoRow>
                                {stats?.horaPico && (
                                    <EstadoRow>
                                        <EstadoLabel>Hora pico</EstadoLabel>
                                        <EstadoVal $color="#f97316">{stats.horaPico}</EstadoVal>
                                    </EstadoRow>
                                )}
                            </Section>
                        </SideSection>
                    </BottomGrid>
                </>
            )}
        </Page>
    );
}

/* ── Styled Components ─────────────────────────────────────── */
const Page = styled.div`
    width: 100%; min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    padding: 32px; box-sizing: border-box; overflow-y: auto;
    @media (max-width: 767px) { padding: 68px 14px 20px; }
`;

const Header = styled.div`
    display: flex; align-items: flex-start; margin-bottom: 28px;
`;

const TitleRow = styled.div`
    display: flex; align-items: flex-start; gap: 12px;
    color: #f97316;
    h1 { margin: 0; font-size: 22px; font-weight: 800;
         color: ${({ theme }) => theme.text}; font-family: "Poppins", sans-serif; }
`;

const Fecha = styled.p`
    margin: 2px 0 0; font-size: 12px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    text-transform: capitalize;
`;

const KpiGrid = styled.div`
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 16px; margin-bottom: 24px;
    @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const KpiCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ $accent }) => $accent}30;
    border-radius: 16px; padding: 20px 18px;
    display: flex; align-items: center; gap: 14px;
`;

const KpiIcon = styled.div`
    width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: ${({ $accent }) => $accent}18; color: ${({ $accent }) => $accent};
`;

const KpiBody = styled.div`display: flex; flex-direction: column; gap: 2px;`;

const KpiValue = styled.div`
    font-size: 20px; font-weight: 900;
    color: ${({ theme }) => theme.text}; font-family: "Poppins", sans-serif;
`;

const KpiLabel = styled.div`
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

const BottomGrid = styled.div`
    display: grid; grid-template-columns: 1fr 320px; gap: 20px;
    @media (max-width: 1024px) { grid-template-columns: 1fr; }
`;

const Section = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 16px; padding: 20px;
`;

const SideSection = styled.div`display: flex; flex-direction: column;`;

const SectionTitle = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
    color: ${({ theme }) => theme.text}; margin-bottom: 16px;
    font-family: "Poppins", sans-serif;
    svg { color: #f97316; }
`;

const EmptyTip = styled.p`
    font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard};
    text-align: center; padding: 20px 0; margin: 0;
`;

const MetodosList = styled.div`display: flex; flex-direction: column; gap: 14px;`;

const MetodoFila = styled.div`display: flex; flex-direction: column; gap: 6px;`;

const MetodoHead = styled.div`
    display: flex; align-items: center; gap: 10px;
`;

const MetodoIconWrap = styled.div`
    color: ${({ $color }) => $color}; display: flex; align-items: center;
`;

const MetodoNombre = styled.span`
    flex: 1; font-size: 14px; font-weight: 700;
    color: ${({ theme }) => theme.text}; font-family: "Poppins", sans-serif;
`;

const MetodoCmds = styled.span`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const MetodoMonto = styled.span`
    font-size: 14px; font-weight: 800;
    color: ${({ theme }) => theme.text}; font-family: "Poppins", sans-serif;
`;

const MetodoPct = styled.span`
    font-size: 12px; font-weight: 800; color: ${({ $color }) => $color};
    min-width: 36px; text-align: right;
`;

const BarRow = styled.div`
    height: 5px; border-radius: 3px; background: rgba(255,255,255,0.06);
`;

const BarFill = styled.div`
    height: 100%; border-radius: 3px; transition: width 0.6s ease;
`;

const TotalRow = styled.div`
    display: flex; align-items: center; gap: 10px;
    margin-top: 20px; padding-top: 16px;
    border-top: 1px solid ${({ theme }) => theme.color2};
`;

const TotalLabel = styled.span`
    flex: 1; font-size: 14px; font-weight: 700;
    color: ${({ theme }) => theme.text}; font-family: "Poppins", sans-serif;
`;

const TotalMonto = styled.span`
    font-size: 18px; font-weight: 900; color: #22c55e;
    font-family: "Poppins", sans-serif;
`;

const TopPlatosList = styled.div`display: flex; flex-direction: column; gap: 10px;`;

const TopPlatoRow = styled.div`
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 12px;
    background: ${({ $primero }) => $primero ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.02)"};
    border: 1px solid ${({ $primero }) => $primero ? "rgba(249,115,22,0.2)" : "transparent"};
`;

const TopRank = styled.span`
    font-size: 14px; font-weight: 900;
    color: ${({ $primero }) => $primero ? "#f97316" : "#94a3b8"};
    min-width: 28px; font-family: "Poppins", sans-serif;
`;

const TopNombre = styled.span`
    flex: 1; font-size: 13px; font-weight: 700;
    color: ${({ theme }) => theme.text}; font-family: "Poppins", sans-serif;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const TopQty = styled.span`
    font-size: 12px; font-weight: 700; color: #f97316;
`;

const EstadoRow = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 0;
    &:not(:last-child) { border-bottom: 1px solid ${({ theme }) => theme.color2}; }
`;

const EstadoLabel = styled.span`
    font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const EstadoVal = styled.span`
    font-size: 18px; font-weight: 900; color: ${({ $color }) => $color};
    font-family: "Poppins", sans-serif;
`;

const LoadingWrap = styled.div`
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; height: 300px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-family: "Poppins", sans-serif;
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
