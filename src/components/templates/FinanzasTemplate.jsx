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
const TRM = 4200; // COP por 1 USD (aprox)

// Costos ACTUALES (lo que pagas hoy)
const CLAUDE_USD  = 20;   // Claude Pro — desarrollo y mantenimiento IA
const DOMINIO_USD = 1.5;  // Dominio .com prorrateado mensual
const COSTOS_USD  = CLAUDE_USD + DOMINIO_USD;  // $21.50
const COSTOS_COP  = Math.round(COSTOS_USD * TRM);

// Costos A ESCALA (50+ clientes — servicios que hay que pagar)
const VERCEL_USD   = 20;  // Vercel Pro — hosting comercial
const SUPABASE_USD = 25;  // Supabase Pro — BD a escala (100 clientes)
const COSTOS_ESCALA_USD = CLAUDE_USD + DOMINIO_USD + VERCEL_USD + SUPABASE_USD; // $66.50
const COSTOS_ESCALA_COP = Math.round(COSTOS_ESCALA_USD * TRM);

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
                    <MetricSub>Claude Pro + Dominio · hoy</MetricSub>
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
                            <CostoTh>Descripción</CostoTh>
                            <CostoTh $right $green>Ahora (USD/mes)</CostoTh>
                            <CostoTh $right $yellow>A escala (USD/mes)</CostoTh>
                            <CostoTh $right>COP / mes (escala)</CostoTh>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            {
                                nombre: "Claude Pro",
                                desc:   "IA para desarrollo y mantenimiento continuo",
                                ahora:  CLAUDE_USD,
                                escala: CLAUDE_USD,
                                color:  "#f88533",
                            },
                            {
                                nombre: "Vercel",
                                desc:   "Hosting · Hobby gratis hoy → Pro al crecer",
                                ahora:  0,
                                escala: VERCEL_USD,
                                color:  "#60a5fa",
                                nota:   "Hobby → Pro",
                            },
                            {
                                nombre: "Supabase",
                                desc:   "Base de datos · Free tier hoy → Pro a 50+ clientes",
                                ahora:  0,
                                escala: SUPABASE_USD,
                                color:  "#34d399",
                                nota:   "Free → Pro",
                            },
                            {
                                nombre: "Dominio .com",
                                desc:   "Dominio web prorrateado mensual",
                                ahora:  DOMINIO_USD,
                                escala: DOMINIO_USD,
                                color:  "#a78bfa",
                            },
                        ].map((c, i) => (
                            <CostoTr key={i}>
                                <CostoTd>
                                    <CostoNombre $color={c.color}>{c.nombre}</CostoNombre>
                                    {c.nota && <CostoTag>{c.nota}</CostoTag>}
                                </CostoTd>
                                <CostoTd $sub>{c.desc}</CostoTd>
                                <CostoTd $right $green>{c.ahora === 0 ? "Gratis" : `$${c.ahora.toFixed(2)}`}</CostoTd>
                                <CostoTd $right $yellow>${c.escala.toFixed(2)}</CostoTd>
                                <CostoTd $right>{fmtCOP(Math.round(c.escala * TRM))}</CostoTd>
                            </CostoTr>
                        ))}
                        <CostoTrTotal>
                            <CostoTd><b>TOTAL</b></CostoTd>
                            <CostoTd $sub />
                            <CostoTd $right $green><b>${COSTOS_USD.toFixed(2)}</b></CostoTd>
                            <CostoTd $right $yellow><b>${COSTOS_ESCALA_USD.toFixed(2)}</b></CostoTd>
                            <CostoTd $right><b>{fmtCOP(COSTOS_ESCALA_COP)}</b></CostoTd>
                        </CostoTrTotal>
                    </tbody>
                </CostosTable>
                <CostoNota>
                    <RiInformationLine /> TRM usada: $1 USD = ${TRM.toLocaleString("es-CO")} COP · Actualiza si cambia el dólar.
                    &nbsp;|&nbsp; <span style={{ color: "#34d399" }}>Verde = hoy</span> &nbsp;·&nbsp; <span style={{ color: "#f59e0b" }}>Amarillo = a 50+ clientes</span>
                </CostoNota>
            </CostosCard>

            {/* ══════════════════════════════
                SECCIÓN 3 — FASES DE COSTO
            ══════════════════════════════ */}
            <SectionLabel>🗺️ Fases de costo — cómo evoluciona el gasto</SectionLabel>
            <FasesGrid>
                {[
                    {
                        fase: "Fase 1",
                        rango: "Hoy · 1 – 30 clientes",
                        color: "#34d399",
                        totalUsd: 20,
                        items: [
                            { nombre: "Claude Pro",     usd: 20, estado: "activo" },
                            { nombre: "Vercel Hobby",   usd: 0,  estado: "gratis" },
                            { nombre: "Supabase Free",  usd: 0,  estado: "gratis" },
                            { nombre: "Dominio .com",   usd: 0,  estado: "pendiente" },
                        ],
                        nota: "Con 1 cliente Fuego ya eres rentable ✓",
                    },
                    {
                        fase: "Fase 2",
                        rango: "30 – 50 clientes",
                        color: "#f59e0b",
                        totalUsd: 21,
                        items: [
                            { nombre: "Claude Pro",    usd: 20, estado: "activo" },
                            { nombre: "Vercel Hobby",  usd: 0,  estado: "gratis" },
                            { nombre: "Supabase Free", usd: 0,  estado: "vigilar" },
                            { nombre: "Dominio .com",  usd: 1,  estado: "activo" },
                        ],
                        nota: "Monitorear uso de BD — puede acercarse al límite",
                    },
                    {
                        fase: "Fase 3",
                        rango: "50 – 100 clientes",
                        color: "#f88533",
                        totalUsd: 66,
                        items: [
                            { nombre: "Claude Pro",    usd: 20, estado: "activo" },
                            { nombre: "Vercel Pro",    usd: 20, estado: "pagar" },
                            { nombre: "Supabase Pro",  usd: 25, estado: "pagar" },
                            { nombre: "Dominio .com",  usd: 1,  estado: "activo" },
                        ],
                        nota: "Costos = 1.8% de tus ingresos a 100 clientes",
                    },
                ].map((f) => (
                    <FaseCard key={f.fase} $color={f.color}>
                        <FaseHeader $color={f.color}>
                            <FaseTitulo $color={f.color}>{f.fase}</FaseTitulo>
                            <FaseRango>{f.rango}</FaseRango>
                        </FaseHeader>
                        <FaseItems>
                            {f.items.map((item) => (
                                <FaseItem key={item.nombre}>
                                    <FaseItemNombre>{item.nombre}</FaseItemNombre>
                                    <FaseItemVal $estado={item.estado}>
                                        {item.usd === 0 ? "Gratis" : `$${item.usd} USD`}
                                    </FaseItemVal>
                                </FaseItem>
                            ))}
                        </FaseItems>
                        <FaseTotalRow $color={f.color}>
                            <span>Total / mes</span>
                            <FaseTotalVal $color={f.color}>${f.totalUsd} USD · {fmtCOP(f.totalUsd * TRM)}</FaseTotalVal>
                        </FaseTotalRow>
                        <FaseNota>{f.nota}</FaseNota>
                    </FaseCard>
                ))}
            </FasesGrid>

            {/* ══════════════════════════════
                SECCIÓN 4 — LÍMITES GRATUITOS
            ══════════════════════════════ */}
            <SectionLabel>⚠️ Límites de los servicios gratuitos</SectionLabel>
            <LimitesGrid>
                {[
                    {
                        servicio:    "Vercel Hobby",
                        color:       "#60a5fa",
                        icon:        "🌐",
                        limites: [
                            { label: "Bandwidth",  valor: "100 GB/mes",      ok: true  },
                            { label: "Uso",        valor: "No comercial",    ok: false },
                            { label: "Builds",     valor: "6.000 min/mes",   ok: true  },
                        ],
                        clientesOk:  "~70 clientes técnicamente",
                        riesgo:      "Los términos prohíben uso comercial — Vercel puede suspender tu proyecto si detecta ingresos.",
                        accion:      "Pasa a Pro ($20/mes) cuando tengas 30+ clientes o ingresos regulares.",
                    },
                    {
                        servicio:    "Supabase Free",
                        color:       "#34d399",
                        icon:        "🗄️",
                        limites: [
                            { label: "Base de datos", valor: "500 MB",        ok: true  },
                            { label: "Bandwidth",     valor: "5 GB/mes",      ok: true  },
                            { label: "Pausa",         valor: "7 días sin uso",ok: false },
                        ],
                        clientesOk:  "~50-60 clientes (6+ meses de datos)",
                        riesgo:      "El proyecto se PAUSA si no hay actividad por 7 días — crítico en producción. A 100 clientes activos no se pausa, pero el storage sí puede llegar al límite.",
                        accion:      "Pasa a Pro ($25/mes) al llegar a 40 clientes o antes si los datos crecen rápido.",
                    },
                    {
                        servicio:    "Dominio .com",
                        color:       "#a78bfa",
                        icon:        "🔗",
                        limites: [
                            { label: "Costo",      valor: "~$12 USD/año",    ok: null  },
                            { label: "Mensual",    valor: "~$1 USD/mes",     ok: null  },
                            { label: "En COP",     valor: `~${fmtCOP(4200)}/mes`, ok: null },
                        ],
                        clientesOk:  "No aplica — es un costo fijo pequeño",
                        riesgo:      "Sin dominio propio tu URL es posdto2.vercel.app — no es profesional para clientes de pago. Proveedor recomendado: Namecheap o Porkbun (~$9-11 USD/año).",
                        accion:      "Comprarlo YA — es el menor costo del negocio y da imagen profesional.",
                    },
                ].map((s) => (
                    <LimiteCard key={s.servicio} $color={s.color}>
                        <LimiteHeader>
                            <LimiteIcono>{s.icon}</LimiteIcono>
                            <LimiteTitulo $color={s.color}>{s.servicio}</LimiteTitulo>
                        </LimiteHeader>
                        <LimitePills>
                            {s.limites.map((l) => (
                                <LimitePill key={l.label} $ok={l.ok}>
                                    <span>{l.label}</span>
                                    <b>{l.valor}</b>
                                </LimitePill>
                            ))}
                        </LimitePills>
                        <LimiteSeccion $label="Aguanta hasta">
                            <LimiteTexto $verde>{s.clientesOk}</LimiteTexto>
                        </LimiteSeccion>
                        <LimiteSeccion $label="Riesgo">
                            <LimiteTexto>{s.riesgo}</LimiteTexto>
                        </LimiteSeccion>
                        <LimiteAccion $color={s.color}>{s.accion}</LimiteAccion>
                    </LimiteCard>
                ))}
            </LimitesGrid>

            {/* ══════════════════════════════
                SECCIÓN 5 — PUNTO DE EQUILIBRIO
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

    @media (max-width: 767px) { padding: 68px 14px 60px; }
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
    color: ${({ $green, $yellow, theme }) =>
        $green ? "#34d399" : $yellow ? "#f59e0b" : theme.colorsubtitlecard};
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
    font-size: ${({ $sub }) => $sub ? "12px" : "13px"};
    text-align: ${({ $right }) => $right ? "right" : "left"};
    color: ${({ $green, $yellow, $sub, theme }) =>
        $green ? "#34d399" : $yellow ? "#f59e0b" : $sub ? theme.colorsubtitlecard : theme.text};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const CostoNombre = styled.span`
    font-weight: 700;
    color: ${({ $color }) => $color};
    display: block;
`;

const CostoTag = styled.span`
    font-size: 10px; font-weight: 600;
    padding: 2px 7px; border-radius: 999px;
    background: rgba(255,255,255,0.06);
    color: ${({ theme }) => theme.colorsubtitlecard};
    margin-top: 2px; display: inline-block;
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
    overflow-x: auto;
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

/* ── Fases de costo ── */
const FasesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    @media (max-width: 860px) { grid-template-columns: 1fr; }
`;

const FaseCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ $color }) => $color}30;
    border-radius: 18px;
    padding: 20px;
    display: flex; flex-direction: column; gap: 12px;
    position: relative; overflow: hidden;
    &::before {
        content: '';
        position: absolute; top: 0; left: 0; right: 0; height: 3px;
        background: ${({ $color }) => $color};
    }
`;

const FaseHeader = styled.div`display: flex; flex-direction: column; gap: 2px;`;

const FaseTitulo = styled.div`
    font-size: 13px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.8px; color: ${({ $color }) => $color};
`;

const FaseRango = styled.div`
    font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const FaseItems = styled.div`display: flex; flex-direction: column; gap: 0;`;

const FaseItem = styled.div`
    display: flex; justify-content: space-between; align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    font-size: 13px;
    &:last-child { border-bottom: none; }
`;

const FaseItemNombre = styled.span`color: ${({ theme }) => theme.text};`;

const ESTADO_COLORS = {
    activo:    "#34d399",
    gratis:    "#60a5fa",
    vigilar:   "#f59e0b",
    pagar:     "#f87171",
    pendiente: "#94a3b8",
};

const FaseItemVal = styled.span`
    font-weight: 700; font-size: 12px;
    color: ${({ $estado }) => ESTADO_COLORS[$estado] ?? "#94a3b8"};
`;

const FaseTotalRow = styled.div`
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 10px; margin-top: 2px;
    border-top: 2px solid ${({ $color }) => $color}40;
    font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard};
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
`;

const FaseTotalVal = styled.span`
    font-size: 13px; font-weight: 900; color: ${({ $color }) => $color};
`;

const FaseNota = styled.div`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
    font-style: italic; line-height: 1.4;
`;

/* ── Límites gratuitos ── */
const LimitesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    @media (max-width: 860px) { grid-template-columns: 1fr; }
`;

const LimiteCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 18px;
    padding: 20px;
    display: flex; flex-direction: column; gap: 12px;
`;

const LimiteHeader = styled.div`display: flex; align-items: center; gap: 10px;`;

const LimiteIcono = styled.span`font-size: 22px;`;

const LimiteTitulo = styled.div`
    font-size: 15px; font-weight: 900; color: ${({ $color }) => $color};
`;

const LimitePills = styled.div`display: flex; flex-direction: column; gap: 6px;`;

const LimitePill = styled.div`
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 10px; border-radius: 8px;
    background: ${({ $ok, theme }) =>
        $ok === true  ? "rgba(52,211,153,0.08)" :
        $ok === false ? "rgba(248,113,113,0.08)" :
        theme.bgtotal};
    border: 1px solid ${({ $ok, theme }) =>
        $ok === true  ? "rgba(52,211,153,0.2)" :
        $ok === false ? "rgba(248,113,113,0.2)" :
        theme.color2};
    font-size: 12px;
    span { color: ${({ theme }) => theme.colorsubtitlecard}; }
    b { color: ${({ $ok, theme }) =>
        $ok === true  ? "#34d399" :
        $ok === false ? "#f87171" :
        theme.text}; }
`;

const LimiteSeccion = styled.div`
    display: flex; flex-direction: column; gap: 4px;
    &::before {
        content: "${({ $label }) => $label}";
        font-size: 10px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.5px; color: #94a3b8;
    }
`;

const LimiteTexto = styled.p`
    font-size: 12px; line-height: 1.5; margin: 0;
    color: ${({ $verde, theme }) => $verde ? "#34d399" : theme.colorsubtitlecard};
`;

const LimiteAccion = styled.div`
    font-size: 12px; font-weight: 700; line-height: 1.5;
    padding: 10px 12px; border-radius: 10px;
    background: ${({ $color }) => $color}12;
    border: 1px solid ${({ $color }) => $color}30;
    color: ${({ $color }) => $color};
`;
