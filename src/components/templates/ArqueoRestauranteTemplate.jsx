import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { ListarComandasCobradas } from "../../supabase/crudRestaurante";
import {
    RiRestaurantLine,
    RiFilterOffLine,
    RiCalendarLine,
    RiMoneyDollarCircleLine,
    RiBankCardLine,
    RiSmartphoneLine,
    RiBankLine,
} from "react-icons/ri";

const fmt      = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);
const fmtFecha = (s) => s ? new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtHora  = (s) => s ? new Date(s).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—";

const METODO_META = {
    efectivo:      { label: "Efectivo",      icon: RiMoneyDollarCircleLine, color: "#22c55e" },
    tarjeta:       { label: "Tarjeta",        icon: RiBankCardLine,          color: "#6366f1" },
    transferencia: { label: "Transferencia",  icon: RiBankLine,              color: "#3b82f6" },
    nequi:         { label: "Nequi",          icon: RiSmartphoneLine,        color: "#a855f7" },
};

function MetodoBadge({ metodo }) {
    const meta = METODO_META[metodo] ?? { label: metodo ?? "—", color: "#94a3b8" };
    return <MetodoChip $color={meta.color}>{meta.label}</MetodoChip>;
}

export function ArqueoRestauranteTemplate() {
    const { dataempresa } = useEmpresaStore();
    const id_empresa = dataempresa?.id;

    const [page,  setPage]  = useState(1);
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const pageSize = 25;

    const { data: res = { data: [], count: 0 }, isFetching } = useQuery({
        queryKey: ["arqueo-restaurante-tabla", id_empresa, desde, hasta, page],
        queryFn:  () => ListarComandasCobradas({ id_empresa, desde: desde || undefined, hasta: hasta || undefined, page, pageSize }),
        enabled:  !!id_empresa,
        refetchOnWindowFocus: false,
    });

    const comandas   = res.data ?? [];
    const totalPags  = Math.ceil((res.count ?? 0) / pageSize);
    const hayFiltros = desde || hasta;

    function limpiarFiltros() { setDesde(""); setHasta(""); setPage(1); }

    return (
        <Page>
            <TopBar>
                <TopLeft>
                    <h1>Arqueo de Caja</h1>
                    <p>Historial de comandas cobradas</p>
                </TopLeft>
                <RestTag>
                    <RiRestaurantLine />
                    Restaurante
                </RestTag>
            </TopBar>

            <FiltrosRow>
                <FiltroItem>
                    <RiCalendarLine />
                    <DateInput
                        type="date"
                        value={desde}
                        onChange={e => { setDesde(e.target.value); setPage(1); }}
                        title="Desde"
                    />
                </FiltroItem>
                <FiltroItem>
                    <RiCalendarLine />
                    <DateInput
                        type="date"
                        value={hasta}
                        onChange={e => { setHasta(e.target.value); setPage(1); }}
                        title="Hasta"
                    />
                </FiltroItem>
                {hayFiltros && (
                    <BtnLimpiar onClick={limpiarFiltros} title="Limpiar filtros">
                        <RiFilterOffLine />
                        Limpiar
                    </BtnLimpiar>
                )}
                <TotalInfo>
                    {res.count ?? 0} comanda{(res.count ?? 0) !== 1 ? "s" : ""}
                </TotalInfo>
            </FiltrosRow>

            <TablaWrap>
                <Tabla>
                    <thead>
                        <tr>
                            <Th>Fecha</Th>
                            <Th>Hora</Th>
                            <Th>Mesa</Th>
                            <Th>Método de pago</Th>
                            <Th $right>Pagado con</Th>
                            <Th $right>Cambio</Th>
                            <Th $right>Total</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {isFetching ? (
                            <tr><Td colSpan={7} $center>Cargando...</Td></tr>
                        ) : comandas.length === 0 ? (
                            <tr><Td colSpan={7} $center style={{ opacity: 0.5 }}>Sin comandas cobradas</Td></tr>
                        ) : comandas.map(c => {
                            const mesa = c.mesas?.nombre ?? `Mesa ${c.mesas?.numero ?? "—"}`;
                            const cambio = c.cambio ?? 0;
                            return (
                                <Tr key={c.id}>
                                    <Td>{fmtFecha(c.created_at)}</Td>
                                    <Td>{fmtHora(c.created_at)}</Td>
                                    <Td><MesaText>{mesa}</MesaText></Td>
                                    <Td><MetodoBadge metodo={c.metodo_pago} /></Td>
                                    <Td $right>{c.pagado_con > 0 ? fmt(c.pagado_con) : "—"}</Td>
                                    <Td $right>
                                        {cambio > 0
                                            ? <CambioBadge>+{fmt(cambio)}</CambioBadge>
                                            : "—"
                                        }
                                    </Td>
                                    <Td $right><TotalText>{fmt(c.total)}</TotalText></Td>
                                </Tr>
                            );
                        })}
                    </tbody>
                </Tabla>
            </TablaWrap>

            {totalPags > 1 && (
                <Paginacion>
                    <BtnPag onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</BtnPag>
                    <span>{page} de {totalPags}</span>
                    <BtnPag onClick={() => setPage(p => Math.min(totalPags, p + 1))} disabled={page === totalPags}>›</BtnPag>
                </Paginacion>
            )}
        </Page>
    );
}

/* ── Styled Components ─────────────────────────────────────── */
const fadeUp = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;

const Page = styled.div`
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    padding: 28px;
    display: flex; flex-direction: column; gap: 20px;
    animation: ${fadeUp} 0.3s ease;
    @media (max-width: 767px) { padding: 68px 14px 20px; gap: 14px; }
`;

const TopBar = styled.div`
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
`;

const TopLeft = styled.div`
    h1 { font-size: 22px; font-weight: 900; color: ${({ theme }) => theme.text}; margin: 0 0 3px; }
    p  { font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard}; margin: 0; }
`;

const RestTag = styled.div`
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
    color: #f97316; background: rgba(249,115,22,0.12);
    border: 1px solid rgba(249,115,22,0.35);
    font-family: "Poppins", sans-serif;
    svg { font-size: 14px; }
`;

const FiltrosRow = styled.div`
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
`;

const FiltroItem = styled.div`
    display: flex; align-items: center; gap: 6px;
    color: ${({ theme }) => theme.colorsubtitlecard}; font-size: 14px;
`;

const DateInput = styled.input`
    padding: 7px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards}; color: ${({ theme }) => theme.text};
    font-family: "Poppins", sans-serif; outline: none; cursor: pointer;
    &:focus { border-color: #f97316; }
    &::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
`;

const BtnLimpiar = styled.button`
    display: flex; align-items: center; gap: 5px;
    padding: 7px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;
    border: 1px solid #f87171; background: rgba(248,113,113,0.1); color: #f87171;
    cursor: pointer; font-family: "Poppins", sans-serif;
    &:hover { background: rgba(248,113,113,0.2); }
`;

const TotalInfo = styled.span`
    margin-left: auto; font-size: 12px; font-weight: 600;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

const TablaWrap = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px; overflow: auto;
`;

const Tabla = styled.table`width: 100%; border-collapse: collapse;`;

const Th = styled.th`
    padding: 12px 14px; text-align: ${({ $right }) => $right ? "right" : "left"};
    font-size: 11px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.5px; color: ${({ theme }) => theme.colorsubtitlecard};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    white-space: nowrap;
`;

const Tr = styled.tr`
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    transition: background 0.12s;
    &:last-child { border-bottom: none; }
    &:hover td { background: ${({ theme }) => theme.bgtotal}; }
`;

const Td = styled.td`
    padding: 11px 14px; font-size: 13px;
    color: ${({ theme }) => theme.text};
    text-align: ${({ $right, $center }) => $right ? "right" : $center ? "center" : "left"};
    white-space: nowrap;
`;

const MesaText = styled.span`font-weight: 700;`;

const MetodoChip = styled.span`
    display: inline-block; padding: 2px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 700;
    background: ${({ $color }) => $color}18;
    color: ${({ $color }) => $color};
    border: 1px solid ${({ $color }) => $color}35;
`;

const CambioBadge = styled.span`
    font-weight: 800; font-size: 13px; color: #22c55e;
`;

const TotalText = styled.span`
    font-weight: 800;
`;

const Paginacion = styled.div`
    display: flex; align-items: center; justify-content: center; gap: 14px;
    font-size: 13px; color: ${({ theme }) => theme.text};
`;

const BtnPag = styled.button`
    background: ${({ theme }) => theme.bgcards}; border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px; padding: 6px 14px; cursor: pointer; font-size: 16px;
    color: ${({ theme }) => theme.text};
    &:disabled { opacity: 0.3; cursor: not-allowed; }
`;
