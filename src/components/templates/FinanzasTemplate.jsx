import { useState, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { MostrarSuscripciones } from "../../supabase/crudSuscripciones";
import {
    RiMoneyDollarCircleLine, RiArrowUpLine, RiArrowDownLine,
    RiGroupLine, RiPercentLine, RiInformationLine,
    RiSubtractLine, RiCalculatorLine, RiStore2Line,
} from "react-icons/ri";

/* ── Constantes financieras ── */
const TRM          = 4200;          // COP por 1 USD (aprox)
const VERCEL_USD   = 20;            // Vercel Pro mensual
const DOMINIO_USD  = 1.5;           // Dominio .com prorrateado mensual
const COSTOS_USD   = VERCEL_USD + DOMINIO_USD;
const COSTOS_COP   = Math.round(COSTOS_USD * TRM);

const PLANES_REF = [
    { nombre: "Chispa ⚡", precio: 49000,  color: "#818cf8" },
    { nombre: "Fuego 🔥",  precio: 129000, color: "#f88533" },
    { nombre: "Cosmos 🌌", precio: 249000, color: "#34d399" },
];

const MIX = [0.30, 0.60, 0.10]; // 30% Chispa, 60% Fuego, 10% Cosmos

const COMPETENCIA = [
    { nombre: "Siigo POS",   basico: 79000,  medio: 159000, color: "#60a5fa" },
    { nombre: "Alegra",      basico: 45000,  medio: 99000,  color: "#a78bfa" },
    { nombre: "POS.DTO2",    basico: 49000,  medio: 129000, color: "#f88533", propio: true },
];

const fmtCOP = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);

const ingresosProyectados = (n) =>
    Math.round(
        n * (MIX[0] * PLANES_REF[0].precio +
             MIX[1] * PLANES_REF[1].precio +
             MIX[2] * PLANES_REF[2].precio)
    );

/* ═══════════════════════════════════════
   COMPONENTE
═══════════════════════════════════════ */
export function FinanzasTemplate() {
    const [clientesSlider, setClientesSlider] = useState(10);

    const { data: suscripciones = [], isLoading } = useQuery({
        queryKey: ["suscripciones-finanzas"],
        queryFn: MostrarSuscripciones,
        staleTime: 60000,
        refetchOnWindowFocus: false,
    });

    /* ── Métricas reales ── */
    const activas = useMemo(
        () => suscripciones.filter(s => s.estado === "al_dia" || s.estado === "activo"),
        [suscripciones]
    );
    const totalClientes   = suscripciones.length;
    const clientesActivos = activas.length;
    const ingresosReales  = useMemo(() => activas.reduce((acc, s) => acc + (s.valor_mensual ?? 0), 0), [activas]);
    const gananciaNeta    = ingresosReales - COSTOS_COP;
    const margen          = ingresosReales > 0 ? Math.round((gananciaNeta / ingresosReales) * 100) : 0;

    /* ── Proyección con slider ── */
    const ingresosProy  = ingresosProyectados(clientesSlider);
    const gananciaProy  = ingresosProy - COSTOS_COP;
    const margenProy    = ingresosProy > 0 ? Math.round((gananciaProy / ingresosProy) * 100) : 0;

    /* ── Break even ── */
    const clientesBE = Math.ceil(COSTOS_COP / PLANES_REF[1].precio); // mínimo en plan Fuego

    return (
        <Wrap>
            {/* ── Título ── */}
            <PageHead>
                <PageTitle>
                    <RiMoneyDollarCircleLine />
                    Finanzas
                </PageTitle>
                <PageSub>Panel privado · Solo tú ves esto, Deyvid</PageSub>
            </PageHead>

            {/* ══════════════════════════════
                SECCIÓN 1 — MÉTRICAS REALES
            ══════════════════════════════ */}
            <SectionLabel>📊 Estado actual</SectionLabel>
            <MetricasGrid>
                <MetricCard $color="#f88533">
                    <MetricIcon $color="#f88533"><RiStore2Line /></MetricIcon>
                    <MetricVal>{isLoading ? "..." : clientesActivos}</MetricVal>
                    <MetricLabel>Clientes activos</MetricLabel>
                    <MetricSub>{totalClientes} total registrados</MetricSub>
                </MetricCard>

                <MetricCard $color="#34d399">
                    <MetricIcon $color="#34d399"><RiMoneyDollarCircleLine /></MetricIcon>
                    <MetricVal>{isLoading ? "..." : fmtCOP(ingresosReales)}</MetricVal>
                    <MetricLabel>Ingresos mensuales</MetricLabel>
                    <MetricSub>Suma de valores acordados activos</MetricSub>
                </MetricCard>

                <MetricCard $color="#f87171">
                    <MetricIcon $color="#f87171"><RiSubtractLine /></MetricIcon>
                    <MetricVal>{fmtCOP(COSTOS_COP)}</MetricVal>
                    <MetricLabel>Costos fijos / mes</MetricLabel>
                    <MetricSub>Vercel Pro + Dominio</MetricSub>
                </MetricCard>

                <MetricCard $color={gananciaNeta >= 0 ? "#34d399" : "#f87171"}>
                    <MetricIcon $color={gananciaNeta >= 0 ? "#34d399" : "#f87171"}>
                        {gananciaNeta >= 0 ? <RiArrowUpLine /> : <RiArrowDownLine />}
                    </MetricIcon>
                    <MetricVal $color={gananciaNeta >= 0 ? "#34d399" : "#f87171"}>
                        {isLoading ? "..." : fmtCOP(gananciaNeta)}
                    </MetricVal>
                    <MetricLabel>Ganancia neta / mes</MetricLabel>
                    <MetricSub>Margen: {margen}%</MetricSub>
                </MetricCard>
            </MetricasGrid>

            {/* ══════════════════════════════
                SECCIÓN 2 — COSTOS DETALLADOS
            ══════════════════════════════ */}
            <SectionLabel>💸 Desglose de costos fijos</SectionLabel>
            <CostosCard>
                <CostosTable>
                    <thead>
                        <tr>
                            <CostoTh>Servicio</CostoTh>
                            <CostoTh $right>USD / mes</CostoTh>
                            <CostoTh $right>COP / mes</CostoTh>
                            <CostoTh $right>COP / año</CostoTh>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { nombre: "Vercel Pro",        usd: VERCEL_USD,   cop: Math.round(VERCEL_USD * TRM),   anio: Math.round(VERCEL_USD * TRM * 12)   },
                            { nombre: "Dominio .com",      usd: DOMINIO_USD,  cop: Math.round(DOMINIO_USD * TRM),  anio: Math.round(DOMINIO_USD * TRM * 12)  },
                        ].map((c, i) => (
                            <CostoTr key={i}>
                                <CostoTd>{c.nombre}</CostoTd>
                                <CostoTd $right>${c.usd.toFixed(2)}</CostoTd>
                                <CostoTd $right>{fmtCOP(c.cop)}</CostoTd>
                                <CostoTd $right>{fmtCOP(c.anio)}</CostoTd>
                            </CostoTr>
                        ))}
                        <CostoTrTotal>
                            <CostoTd><b>TOTAL</b></CostoTd>
                            <CostoTd $right><b>${COSTOS_USD.toFixed(2)}</b></CostoTd>
                            <CostoTd $right><b>{fmtCOP(COSTOS_COP)}</b></CostoTd>
                            <CostoTd $right><b>{fmtCOP(COSTOS_COP * 12)}</b></CostoTd>
                        </CostoTrTotal>
                    </tbody>
                </CostosTable>
                <CostoNota>
                    <RiInformationLine /> TRM usada: $1 USD = ${TRM.toLocaleString("es-CO")} COP · Actualiza si cambia el dólar.
                </CostoNota>
            </CostosCard>

            {/* ══════════════════════════════
                SECCIÓN 3 — PUNTO DE EQUILIBRIO
            ══════════════════════════════ */}
            <SectionLabel>⚖️ Punto de equilibrio</SectionLabel>
            <BECard>
                <BEMain>
                    <BENum>{clientesBE}</BENum>
                    <BEDesc>
                        cliente{clientesBE !== 1 ? "s" : ""} en plan <b>Fuego 🔥</b> cubren todos tus costos<br />
                        <span>({fmtCOP(PLANES_REF[1].precio)} × {clientesBE} = {fmtCOP(PLANES_REF[1].precio * clientesBE)} ≥ {fmtCOP(COSTOS_COP)} de costos)</span>
                    </BEDesc>
                </BEMain>
                <BEMiniGrid>
                    {PLANES_REF.map((p) => {
                        const be = Math.ceil(COSTOS_COP / p.precio);
                        return (
                            <BEMini key={p.nombre} $color={p.color}>
                                <BEMiniVal $color={p.color}>{be}</BEMiniVal>
                                <BEMiniLabel>para cubrir con<br />{p.nombre}</BEMiniLabel>
                            </BEMini>
                        );
                    })}
                </BEMiniGrid>
            </BECard>

            {/* ══════════════════════════════
                SECCIÓN 4 — PROYECTOR
            ══════════════════════════════ */}
            <SectionLabel>🚀 Proyector de ingresos</SectionLabel>
            <ProyectorCard>
                <ProyHead>
                    <RiCalculatorLine />
                    <span>¿Cuánto ganarías con <b>{clientesSlider} clientes</b>?</span>
                    <ProyMix>(Mix: 30% Chispa · 60% Fuego · 10% Cosmos)</ProyMix>
                </ProyHead>

                <SliderWrap>
                    <SliderLabel>1</SliderLabel>
                    <Slider
                        type="range" min={1} max={200}
                        value={clientesSlider}
                        onChange={e => setClientesSlider(Number(e.target.value))}
                    />
                    <SliderLabel>200</SliderLabel>
                </SliderWrap>

                <ProyMetrics>
                    <ProyMetric>
                        <ProyMetricVal $color="#34d399">{fmtCOP(ingresosProy)}</ProyMetricVal>
                        <ProyMetricLabel>Ingresos brutos</ProyMetricLabel>
                    </ProyMetric>
                    <ProyMetric>
                        <ProyMetricVal $color="#f87171">− {fmtCOP(COSTOS_COP)}</ProyMetricVal>
                        <ProyMetricLabel>Costos fijos</ProyMetricLabel>
                    </ProyMetric>
                    <ProyMetric $destacado>
                        <ProyMetricVal $color={gananciaProy >= 0 ? "#f88533" : "#f87171"}>
                            {fmtCOP(gananciaProy)}
                        </ProyMetricVal>
                        <ProyMetricLabel>Ganancia neta / mes</ProyMetricLabel>
                    </ProyMetric>
                    <ProyMetric>
                        <ProyMetricVal $color="#818cf8">{margenProy}%</ProyMetricVal>
                        <ProyMetricLabel>Margen</ProyMetricLabel>
                    </ProyMetric>
                </ProyMetrics>

                {/* Tabla de escenarios */}
                <EscenariosTable>
                    <thead>
                        <tr>
                            <ETh>Clientes</ETh>
                            <ETh $right>Ingresos</ETh>
                            <ETh $right>− Costos</ETh>
                            <ETh $right>Ganancia neta</ETh>
                            <ETh $right>Margen</ETh>
                        </tr>
                    </thead>
                    <tbody>
                        {[5, 10, 20, 50, 100, 200].map(n => {
                            const ing  = ingresosProyectados(n);
                            const gan  = ing - COSTOS_COP;
                            const mg   = Math.round((gan / ing) * 100);
                            const esActual = n === clientesSlider;
                            return (
                                <ETr key={n} $active={esActual} onClick={() => setClientesSlider(n)}>
                                    <ETd><b>{n}</b></ETd>
                                    <ETd $right>{fmtCOP(ing)}</ETd>
                                    <ETd $right $red>{fmtCOP(COSTOS_COP)}</ETd>
                                    <ETd $right $green={gan > 0}>{fmtCOP(gan)}</ETd>
                                    <ETd $right>{mg}%</ETd>
                                </ETr>
                            );
                        })}
                    </tbody>
                </EscenariosTable>
            </ProyectorCard>

            {/* ══════════════════════════════
                SECCIÓN 5 — COMPETENCIA
            ══════════════════════════════ */}
            <SectionLabel>🏆 Por qué estos precios — vs competencia</SectionLabel>
            <CompCard>
                <CompTable>
                    <thead>
                        <tr>
                            <CTh>Plataforma</CTh>
                            <CTh $right>Plan básico / mes</CTh>
                            <CTh $right>Plan medio / mes</CTh>
                            <CTh>Posición</CTh>
                        </tr>
                    </thead>
                    <tbody>
                        {COMPETENCIA.map(c => (
                            <CTr key={c.nombre} $propio={c.propio}>
                                <CTd>
                                    <CompNombre $color={c.color} $propio={c.propio}>{c.nombre}</CompNombre>
                                </CTd>
                                <CTd $right>{fmtCOP(c.basico)}</CTd>
                                <CTd $right>{fmtCOP(c.medio)}</CTd>
                                <CTd>
                                    <CompTag $color={c.color}>
                                        {c.propio
                                            ? "✅ Competitivo + más features"
                                            : c.basico <= 49000
                                            ? "Similar precio, menos features"
                                            : "Más caro"}
                                    </CompTag>
                                </CTd>
                            </CTr>
                        ))}
                    </tbody>
                </CompTable>
                <CompNota>
                    POS.DTO2 entra al mercado con precios similares a Alegra pero con kardex, multi-almacén
                    y roles incluidos desde el plan Fuego — lo que Siigo cobra $159.000.
                </CompNota>
            </CompCard>

            {/* ══════════════════════════════
                SECCIÓN 6 — CLIENTES ACTUALES
            ══════════════════════════════ */}
            {!isLoading && suscripciones.length > 0 && (
                <>
                    <SectionLabel>👥 Clientes registrados</SectionLabel>
                    <ClientesCard>
                        <ClientesTable>
                            <thead>
                                <tr>
                                    <CTh>Cliente</CTh>
                                    <CTh>Plan</CTh>
                                    <CTh $right>Valor / mes</CTh>
                                    <CTh>Estado</CTh>
                                    <CTh>Próximo pago</CTh>
                                </tr>
                            </thead>
                            <tbody>
                                {suscripciones.map(s => (
                                    <CTr key={s.id}>
                                        <CTd>
                                            <b>{s.nombre_cliente} {s.apellido_cliente}</b>
                                            {s.empresa?.razon_social && (
                                                <div style={{ fontSize: "11px", color: "var(--sub)", marginTop: "2px" }}>
                                                    {s.empresa.razon_social}
                                                </div>
                                            )}
                                        </CTd>
                                        <CTd><PlanChip>{s.plan ?? "—"}</PlanChip></CTd>
                                        <CTd $right><b>{fmtCOP(s.valor_mensual)}</b></CTd>
                                        <CTd>
                                            <EstadoBadge $ok={s.estado === "al_dia" || s.estado === "activo"}>
                                                {s.estado === "al_dia" ? "Al día ✓" : s.estado ?? "—"}
                                            </EstadoBadge>
                                        </CTd>
                                        <CTd>{s.fecha_proximo_pago ?? "—"}</CTd>
                                    </CTr>
                                ))}
                            </tbody>
                        </ClientesTable>
                    </ClientesCard>
                </>
            )}

            {isLoading && (
                <LoadingMsg>Cargando datos financieros...</LoadingMsg>
            )}
        </Wrap>
    );
}

/* ══════════════════════════════════════
   ESTILOS
══════════════════════════════════════ */
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const Wrap = styled.div`
    padding: 28px 28px 60px;
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    animation: ${fadeUp} 0.4s ease both;

    @media (max-width: 767px) { padding: 16px 14px 60px; }
`;

const PageHead = styled.div`
    margin-bottom: 8px;
`;

const PageTitle = styled.h1`
    display: flex; align-items: center; gap: 10px;
    font-size: 22px; font-weight: 900;
    color: ${({ theme }) => theme.text};
    margin: 0 0 4px;
    svg { color: #34d399; font-size: 26px; }
`;

const PageSub = styled.p`
    font-size: 13px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    margin: 0;
`;

const SectionLabel = styled.h2`
    font-size: 13px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.6px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    margin: 16px 0 0;
`;

/* ── Métricas ── */
const MetricasGrid = styled.div`
    display: grid; grid-template-columns: repeat(4,1fr); gap: 14px;
    @media (max-width: 900px) { grid-template-columns: repeat(2,1fr); }
    @media (max-width: 520px) { grid-template-columns: 1fr; }
`;

const MetricCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 18px;
    padding: 20px 20px 18px;
    display: flex; flex-direction: column; gap: 4px;
    position: relative; overflow: hidden;

    &::before {
        content: '';
        position: absolute; top: 0; left: 0; right: 0; height: 3px;
        background: ${({ $color }) => $color};
        border-radius: 18px 18px 0 0;
    }
`;

const MetricIcon = styled.span`
    font-size: 22px; color: ${({ $color }) => $color}; margin-bottom: 4px;
`;

const MetricVal = styled.div`
    font-size: 20px; font-weight: 900;
    color: ${({ $color, theme }) => $color ?? theme.text};
    letter-spacing: -0.5px;
`;

const MetricLabel = styled.div`
    font-size: 13px; font-weight: 700;
    color: ${({ theme }) => theme.text};
`;

const MetricSub = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

/* ── Costos ── */
const CostosCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 18px;
    padding: 20px;
    overflow-x: auto;
`;

const CostosTable = styled.table`
    width: 100%; border-collapse: collapse; min-width: 440px;
`;

const CostoTh = styled.th`
    text-align: ${({ $right }) => $right ? "right" : "left"};
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.4px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    padding: 0 12px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const CostoTr = styled.tr`
    &:last-child td { border-bottom: none; }
`;

const CostoTrTotal = styled.tr`
    background: ${({ theme }) => theme.bgtotal};
    td { border-top: 2px solid ${({ theme }) => theme.color2}; }
`;

const CostoTd = styled.td`
    padding: 11px 12px;
    font-size: 13px;
    text-align: ${({ $right }) => $right ? "right" : "left"};
    color: ${({ theme }) => theme.text};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const CostoNota = styled.div`
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
    margin-top: 12px; padding-top: 12px;
    border-top: 1px solid ${({ theme }) => theme.color2};
`;

/* ── Break even ── */
const BECard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 18px;
    padding: 24px;
    display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap;
`;

const BEMain = styled.div`
    display: flex; align-items: center; gap: 20px; flex: 1; min-width: 220px;
`;

const BENum = styled.div`
    font-size: 56px; font-weight: 900; line-height: 1;
    color: #f88533;
`;

const BEDesc = styled.div`
    font-size: 14px; color: ${({ theme }) => theme.text}; line-height: 1.6;
    span { font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard}; }
    b { color: #f88533; }
`;

const BEMiniGrid = styled.div`
    display: flex; gap: 12px; flex-wrap: wrap;
`;

const BEMini = styled.div`
    text-align: center; padding: 14px 20px;
    border-radius: 14px;
    background: ${({ $color }) => `${$color}12`};
    border: 1px solid ${({ $color }) => `${$color}33`};
    min-width: 90px;
`;

const BEMiniVal = styled.div`
    font-size: 28px; font-weight: 900;
    color: ${({ $color }) => $color};
`;

const BEMiniLabel = styled.div`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
    line-height: 1.4; margin-top: 4px;
`;

/* ── Proyector ── */
const ProyectorCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 18px;
    padding: 24px;
    display: flex; flex-direction: column; gap: 20px;
`;

const ProyHead = styled.div`
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    font-size: 15px; font-weight: 700; color: ${({ theme }) => theme.text};
    svg { color: #f88533; font-size: 20px; }
`;

const ProyMix = styled.span`
    font-size: 12px; font-weight: 500;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

const SliderWrap = styled.div`
    display: flex; align-items: center; gap: 12px;
`;

const SliderLabel = styled.span`
    font-size: 12px; font-weight: 700;
    color: ${({ theme }) => theme.colorsubtitlecard};
    min-width: 30px;
`;

const Slider = styled.input`
    flex: 1;
    -webkit-appearance: none;
    height: 6px;
    border-radius: 999px;
    background: linear-gradient(to right, #f88533 0%, #f88533 ${({ value }) => ((value - 1) / 199 * 100)}%, ${({ theme }) => theme.color2} ${({ value }) => ((value - 1) / 199 * 100)}%, ${({ theme }) => theme.color2} 100%);
    outline: none; cursor: pointer;

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px; height: 20px;
        border-radius: 50%;
        background: #f88533;
        box-shadow: 0 0 10px rgba(248,133,51,0.6);
        cursor: pointer;
    }
    &::-moz-range-thumb {
        width: 20px; height: 20px;
        border-radius: 50%;
        background: #f88533; border: none;
        box-shadow: 0 0 10px rgba(248,133,51,0.6);
        cursor: pointer;
    }
`;

const ProyMetrics = styled.div`
    display: grid; grid-template-columns: repeat(4,1fr); gap: 12px;
    @media (max-width: 640px) { grid-template-columns: repeat(2,1fr); }
`;

const ProyMetric = styled.div`
    padding: 16px;
    border-radius: 14px;
    background: ${({ $destacado, theme }) => $destacado ? "rgba(248,133,51,0.07)" : theme.bgtotal};
    border: 1px solid ${({ $destacado, theme }) => $destacado ? "rgba(248,133,51,0.25)" : theme.color2};
    text-align: center;
`;

const ProyMetricVal = styled.div`
    font-size: 18px; font-weight: 900;
    color: ${({ $color }) => $color};
    letter-spacing: -0.3px;
`;

const ProyMetricLabel = styled.div`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
    margin-top: 4px; font-weight: 600;
`;

/* ── Tabla de escenarios ── */
const EscenariosTable = styled.table`
    width: 100%; border-collapse: collapse;
    @media (max-width: 600px) { font-size: 12px; }
`;

const ETh = styled.th`
    text-align: ${({ $right }) => $right ? "right" : "left"};
    padding: 8px 12px;
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const ETr = styled.tr`
    cursor: pointer;
    background: ${({ $active, theme }) => $active ? "rgba(248,133,51,0.07)" : "transparent"};
    border-left: ${({ $active }) => $active ? "3px solid #f88533" : "3px solid transparent"};
    transition: background 0.15s;
    &:hover { background: ${({ theme }) => theme.bgtotal}; }
    &:last-child td { border-bottom: none; }
`;

const ETd = styled.td`
    padding: 10px 12px;
    font-size: 13px;
    text-align: ${({ $right }) => $right ? "right" : "left"};
    color: ${({ $red, $green, theme }) =>
        $red ? "#f87171" : $green ? "#34d399" : theme.text};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

/* ── Competencia ── */
const CompCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 18px;
    padding: 20px;
    overflow-x: auto;
`;

const CompTable = styled.table`
    width: 100%; border-collapse: collapse; min-width: 440px;
`;

const CTh = styled.th`
    text-align: ${({ $right }) => $right ? "right" : "left"};
    padding: 8px 12px 12px;
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const CTr = styled.tr`
    background: ${({ $propio }) => $propio ? "rgba(248,133,51,0.05)" : "transparent"};
    &:last-child td { border-bottom: none; }
`;

const CTd = styled.td`
    padding: 11px 12px;
    font-size: 13px;
    text-align: ${({ $right }) => $right ? "right" : "left"};
    color: ${({ theme }) => theme.text};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const CompNombre = styled.span`
    font-weight: ${({ $propio }) => $propio ? "900" : "700"};
    color: ${({ $color }) => $color};
`;

const CompTag = styled.span`
    font-size: 11px; font-weight: 700;
    color: ${({ $color }) => $color};
    background: ${({ $color }) => `${$color}18`};
    padding: 3px 10px; border-radius: 999px;
`;

const CompNota = styled.p`
    font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard};
    margin: 12px 0 0; padding-top: 12px;
    border-top: 1px solid ${({ theme }) => theme.color2};
    line-height: 1.6;
`;

/* ── Clientes ── */
const ClientesCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 18px;
    padding: 20px;
    overflow-x: auto;
`;

const ClientesTable = styled(CompTable)``;

const PlanChip = styled.span`
    font-size: 11px; font-weight: 700;
    background: rgba(248,133,51,0.1);
    color: #f88533;
    padding: 3px 10px; border-radius: 999px;
    text-transform: capitalize;
`;

const EstadoBadge = styled.span`
    font-size: 11px; font-weight: 700;
    padding: 3px 10px; border-radius: 999px;
    background: ${({ $ok }) => $ok ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)"};
    color: ${({ $ok }) => $ok ? "#34d399" : "#f87171"};
`;

const LoadingMsg = styled.div`
    text-align: center; padding: 40px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 14px;
`;
