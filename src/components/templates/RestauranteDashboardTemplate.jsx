import { useState, useMemo } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { ObtenerStatsRestaurante } from "../../supabase/crudRestaurante";
import {
    RiMoneyDollarCircleLine,
    RiFileListLine,
    RiBarChartBoxLine,
    RiTableLine,
    RiBankCardLine,
    RiSmartphoneLine,
    RiBankLine,
    RiExchangeDollarLine,
    RiTimeLine,
    RiRestaurantLine,
    RiLoader4Line,
} from "react-icons/ri";

const cop = (v) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

const PERIODOS = [
    { label: "Hoy",     key: "hoy" },
    { label: "Semana",  key: "semana" },
    { label: "Mes",     key: "mes" },
];

function getRango(key) {
    const ahora  = new Date();
    const fin    = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999).toISOString();
    if (key === "hoy") {
        const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString();
        return { desde: inicio, hasta: fin };
    }
    if (key === "semana") {
        const dow   = ahora.getDay();
        const lunes = new Date(ahora); lunes.setDate(ahora.getDate() - (dow === 0 ? 6 : dow - 1));
        lunes.setHours(0, 0, 0, 0);
        return { desde: lunes.toISOString(), hasta: fin };
    }
    // mes
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
    return { desde: inicio, hasta: fin };
}

const METODO_META = {
    efectivo:     { label: "Efectivo",     icon: RiMoneyDollarCircleLine, color: "#22c55e" },
    tarjeta:      { label: "Tarjeta",      icon: RiBankCardLine,          color: "#6366f1" },
    transferencia:{ label: "Transferencia",icon: RiBankLine,              color: "#3b82f6" },
    nequi:        { label: "Nequi",        icon: RiSmartphoneLine,        color: "#a855f7" },
};

export function RestauranteDashboardTemplate() {
    const { dataempresa } = useEmpresaStore();
    const id_empresa = dataempresa?.id;

    const [periodo, setPeriodo] = useState("hoy");
    const rango = useMemo(() => getRango(periodo), [periodo]);

    const { data: stats, isLoading } = useQuery({
        queryKey: ["stats-restaurante", id_empresa, rango.desde, rango.hasta],
        queryFn: () => ObtenerStatsRestaurante({ id_empresa, ...rango }),
        enabled: !!id_empresa,
        staleTime: 60_000,
    });

    const maxTop = stats?.topItems?.[0]?.cantidad ?? 1;

    return (
        <Page>
            <Header>
                <TitleRow>
                    <RiRestaurantLine size={22} />
                    <h1>Dashboard</h1>
                </TitleRow>
                <PeriodSelector>
                    {PERIODOS.map(p => (
                        <PeriodBtn key={p.key} $active={periodo === p.key} onClick={() => setPeriodo(p.key)}>
                            {p.label}
                        </PeriodBtn>
                    ))}
                </PeriodSelector>
            </Header>

            {isLoading ? (
                <LoadingWrap>
                    <RiLoader4Line size={32} className="spin" />
                    <span>Cargando datos…</span>
                </LoadingWrap>
            ) : (
                <>
                    {/* KPIs */}
                    <KpiGrid>
                        <KpiCard $accent="#f97316">
                            <KpiIcon $accent="#f97316"><RiMoneyDollarCircleLine size={24} /></KpiIcon>
                            <KpiBody>
                                <KpiValue>{cop(stats?.totalIngresos ?? 0)}</KpiValue>
                                <KpiLabel>Ingresos {PERIODOS.find(p => p.key === periodo)?.label.toLowerCase()}</KpiLabel>
                            </KpiBody>
                        </KpiCard>
                        <KpiCard $accent="#6366f1">
                            <KpiIcon $accent="#6366f1"><RiFileListLine size={24} /></KpiIcon>
                            <KpiBody>
                                <KpiValue>{stats?.totalComandas ?? 0}</KpiValue>
                                <KpiLabel>Comandas cobradas</KpiLabel>
                            </KpiBody>
                        </KpiCard>
                        <KpiCard $accent="#22c55e">
                            <KpiIcon $accent="#22c55e"><RiBarChartBoxLine size={24} /></KpiIcon>
                            <KpiBody>
                                <KpiValue>{cop(stats?.ticketPromedio ?? 0)}</KpiValue>
                                <KpiLabel>Ticket promedio</KpiLabel>
                            </KpiBody>
                        </KpiCard>
                        <KpiCard $accent="#f59e0b">
                            <KpiIcon $accent="#f59e0b"><RiTableLine size={24} /></KpiIcon>
                            <KpiBody>
                                <KpiValue>{stats?.mesasActivas ?? 0}</KpiValue>
                                <KpiLabel>Mesas activas ahora</KpiLabel>
                            </KpiBody>
                        </KpiCard>
                    </KpiGrid>

                    <BottomGrid>
                        {/* Top platos */}
                        <Section>
                            <SectionTitle>
                                <RiRestaurantLine size={16} />
                                Top 5 platos más pedidos
                            </SectionTitle>
                            {(stats?.topItems ?? []).length === 0 ? (
                                <EmptyTip>Sin datos para el período seleccionado</EmptyTip>
                            ) : (
                                <PlatosList>
                                    {(stats?.topItems ?? []).map((item, i) => (
                                        <PlatoRow key={item.nombre}>
                                            <PlatoRank>#{i + 1}</PlatoRank>
                                            <PlatoInfo>
                                                <PlatoNombre>{item.nombre}</PlatoNombre>
                                                <PlatoBar>
                                                    <PlatoBarFill style={{ width: `${(item.cantidad / maxTop) * 100}%` }} />
                                                </PlatoBar>
                                            </PlatoInfo>
                                            <PlatoStats>
                                                <PlatoCantidad>{item.cantidad} uds</PlatoCantidad>
                                                <PlatoTotal>{cop(item.total)}</PlatoTotal>
                                            </PlatoStats>
                                        </PlatoRow>
                                    ))}
                                </PlatosList>
                            )}
                        </Section>

                        {/* Méthodos de pago + hora pico */}
                        <SidePanel>
                            <Section>
                                <SectionTitle>
                                    <RiExchangeDollarLine size={16} />
                                    Desglose por método de pago
                                </SectionTitle>
                                {(stats?.porMetodo ?? []).length === 0 ? (
                                    <EmptyTip>Sin cobros en el período</EmptyTip>
                                ) : (
                                    <MetodosList>
                                        {(stats?.porMetodo ?? []).map(m => {
                                            const meta = METODO_META[m.metodo] ?? { label: m.metodo, icon: RiMoneyDollarCircleLine, color: "#94a3b8" };
                                            const MetodoIcon = meta.icon;
                                            return (
                                                <MetodoItem key={m.metodo} $color={meta.color}>
                                                    <MetodoIconWrap $color={meta.color}>
                                                        <MetodoIcon size={16} />
                                                    </MetodoIconWrap>
                                                    <MetodoLabel>{meta.label}</MetodoLabel>
                                                    <MetodoCount>{m.count} cmd</MetodoCount>
                                                    <MetodoTotal>{cop(m.total)}</MetodoTotal>
                                                </MetodoItem>
                                            );
                                        })}
                                    </MetodosList>
                                )}
                            </Section>

                            {stats?.horaPico && (
                                <Section style={{ marginTop: 16 }}>
                                    <SectionTitle>
                                        <RiTimeLine size={16} />
                                        Hora pico
                                    </SectionTitle>
                                    <HoraPico>
                                        <HoraPicoHora>{stats.horaPico}</HoraPicoHora>
                                        <HoraPicoLabel>más comandas en el período</HoraPicoLabel>
                                    </HoraPico>
                                </Section>
                            )}
                        </SidePanel>
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
    padding: 32px;
    box-sizing: border-box;
    overflow-y: auto;
    @media (max-width: 767px) { padding: 68px 14px 20px; }
`;

const Header = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
    margin-bottom: 28px;
`;

const TitleRow = styled.div`
    display: flex; align-items: center; gap: 10px;
    color: #f97316;
    h1 { margin: 0; font-size: 22px; font-weight: 800;
         color: ${({ theme }) => theme.text}; font-family: "Poppins", sans-serif; }
`;

const PeriodSelector = styled.div`
    display: flex; gap: 6px;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px; padding: 4px;
`;

const PeriodBtn = styled.button`
    padding: 6px 16px; border-radius: 9px; border: none; cursor: pointer;
    font-size: 13px; font-weight: 700; font-family: "Poppins", sans-serif;
    transition: background 0.15s, color 0.15s;
    background: ${({ $active }) => $active ? "#f97316" : "transparent"};
    color: ${({ $active, theme }) => $active ? "#fff" : theme.text};
`;

const KpiGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
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
    width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: ${({ $accent }) => $accent}18;
    color: ${({ $accent }) => $accent};
`;

const KpiBody = styled.div`display: flex; flex-direction: column; gap: 2px;`;

const KpiValue = styled.div`
    font-size: 22px; font-weight: 900;
    color: ${({ theme }) => theme.text};
    font-family: "Poppins", sans-serif;
`;

const KpiLabel = styled.div`
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

const BottomGrid = styled.div`
    display: grid; grid-template-columns: 1fr 360px; gap: 20px;
    @media (max-width: 1024px) { grid-template-columns: 1fr; }
`;

const Section = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 16px; padding: 20px;
`;

const SidePanel = styled.div`display: flex; flex-direction: column; gap: 0;`;

const SectionTitle = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
    color: ${({ theme }) => theme.text};
    margin-bottom: 16px;
    font-family: "Poppins", sans-serif;
    svg { color: #f97316; }
`;

const EmptyTip = styled.p`
    font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard};
    text-align: center; padding: 20px 0; margin: 0;
`;

const PlatosList = styled.div`display: flex; flex-direction: column; gap: 14px;`;

const PlatoRow = styled.div`
    display: flex; align-items: center; gap: 12px;
`;

const PlatoRank = styled.span`
    font-size: 13px; font-weight: 900; color: #f97316;
    min-width: 28px; font-family: "Poppins", sans-serif;
`;

const PlatoInfo = styled.div`flex: 1; min-width: 0;`;

const PlatoNombre = styled.div`
    font-size: 14px; font-weight: 700;
    color: ${({ theme }) => theme.text};
    font-family: "Poppins", sans-serif;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 6px;
`;

const PlatoBar = styled.div`
    height: 6px; border-radius: 3px;
    background: rgba(249,115,22,0.12);
`;

const PlatoBarFill = styled.div`
    height: 100%; border-radius: 3px;
    background: linear-gradient(90deg, #f97316, #fb923c);
    transition: width 0.6s ease;
`;

const PlatoStats = styled.div`
    display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
`;

const PlatoCantidad = styled.span`
    font-size: 13px; font-weight: 800; color: #f97316;
    font-family: "Poppins", sans-serif;
`;

const PlatoTotal = styled.span`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const MetodosList = styled.div`display: flex; flex-direction: column; gap: 10px;`;

const MetodoItem = styled.div`
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 12px;
    background: ${({ $color }) => $color}0a;
    border: 1px solid ${({ $color }) => $color}20;
`;

const MetodoIconWrap = styled.div`
    color: ${({ $color }) => $color};
    display: flex; align-items: center;
`;

const MetodoLabel = styled.span`
    flex: 1; font-size: 13px; font-weight: 700;
    color: ${({ theme }) => theme.text};
    font-family: "Poppins", sans-serif;
`;

const MetodoCount = styled.span`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const MetodoTotal = styled.span`
    font-size: 13px; font-weight: 800;
    color: ${({ theme }) => theme.text};
    font-family: "Poppins", sans-serif;
`;

const HoraPico = styled.div`
    display: flex; flex-direction: column; align-items: center;
    gap: 4px; padding: 16px;
`;

const HoraPicoHora = styled.div`
    font-size: 36px; font-weight: 900; color: #f97316;
    font-family: "Poppins", sans-serif;
`;

const HoraPicoLabel = styled.div`
    font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const LoadingWrap = styled.div`
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; height: 300px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-family: "Poppins", sans-serif;
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
