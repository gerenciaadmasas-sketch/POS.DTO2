import { useMemo, useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { useSucursalesStore } from "../../store/SucursalesStore";
import { useAlmacenesConfigStore } from "../../store/AlmacenesConfigStore";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import { MostrarVersion } from "../../supabase/crudVersion";
import { MostrarClientes } from "../../supabase/crudClientes";
import { MostrarSuscripciones } from "../../supabase/crudSuscripciones";
import { MostrarPropiedades, MostrarProyectos } from "../../supabase/crudInmobiliaria";
import { usePlan } from "../../hooks/usePlan";

/* ── helpers TV stats ── */
function calcEstado(c) {
    if (c?.estado_manual === "suspendido") return "suspendido";
    if (!c?.fecha_vencimiento) return "sin_fecha";
    const vence = new Date(c.fecha_vencimiento);
    const now = new Date();
    if (vence < now) return "vencido";
    if (Math.ceil((vence - now) / 86400000) <= 7) return "por_vencer";
    return "activo";
}

function AnimatedNumber({ value }) {
    const [n, setN] = useState(0);
    useEffect(() => {
        if (!value) { setN(0); return; }
        let cur = 0;
        const step = Math.max(1, Math.ceil(value / 28));
        const id = setInterval(() => {
            cur = Math.min(cur + step, value);
            setN(cur);
            if (cur >= value) clearInterval(id);
        }, 22);
        return () => clearInterval(id);
    }, [value]);
    return <>{n}</>;
}

/* ── role colors ── */
const ROL_STYLE = {
    superadmin:    { color: "#f88533", bg: "rgba(248,133,51,0.10)",  glow: "rgba(248,133,51,0.35)"  },
    administrador: { color: "#a78bfa", bg: "rgba(167,139,250,0.10)", glow: "rgba(167,139,250,0.35)" },
    supervisor:    { color: "#4ade80", bg: "rgba(74,222,128,0.10)",  glow: "rgba(74,222,128,0.35)"  },
    cajero:        { color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  glow: "rgba(96,165,250,0.35)"  },
};

/* ── accesos por rol ── */
const ACCESOS_SUPERADMIN = [
    { key: "saas",       icon: "solar:users-group-rounded-bold-duotone", label: "SaaS",        sub: "Gestión de clientes", to: "/saas",       accent: "#f88533", glow: "rgba(248,133,51,0.35)",   big: true  },
    { key: "reportes",   icon: "solar:chart-square-bold-duotone",        label: "Clientes",    sub: "Ver reportes",        to: "/reportes",   accent: "#60a5fa", glow: "rgba(96,165,250,0.35)",   big: false },
    { key: "finanzas",   icon: "solar:dollar-minimalistic-bold-duotone", label: "Finanzas",    sub: "Rentabilidad",        to: "/finanzas",   accent: "#34d399", glow: "rgba(52,211,153,0.35)",   big: false },
    { key: "prospectos", icon: "solar:user-speak-bold-duotone",          label: "Leads",       sub: "Seguimiento",         to: "/prospectos", accent: "#818cf8", glow: "rgba(129,140,248,0.35)",  big: false },
    { key: "chat",       icon: "solar:chat-round-bold-duotone",          label: "Chat",        sub: "Mensajes",            to: "/chat",       accent: "#f88533", glow: "rgba(248,133,51,0.35)",   big: false },
];

const ACCESOS_ADMIN = [
    { key: "pos",        icon: "solar:cart-large-2-bold-duotone",        label: "Vender",      sub: "Punto de venta",      to: "/pos",        accent: "#f88533", glow: "rgba(248,133,51,0.35)",   big: true  },
    { key: "inv",        icon: "solar:box-bold-duotone",                 label: "Inventario",  sub: "Gestionar stock",     to: "/inventario", accent: "#4ade80", glow: "rgba(74,222,128,0.35)",   big: false },
    { key: "reportes",   icon: "solar:chart-square-bold-duotone",        label: "Reportes",    sub: "Ver estadísticas",    to: "/reportes",   accent: "#60a5fa", glow: "rgba(96,165,250,0.35)",   big: false },
    { key: "kardex",     icon: "solar:clipboard-list-bold-duotone",      label: "Kardex",      sub: "Movimientos",         to: "/kardex",     accent: "#f59e0b", glow: "rgba(245,158,11,0.35)",   big: false },
    { key: "arqueo",     icon: "solar:wallet-money-bold-duotone",        label: "Arqueo",      sub: "Caja y turnos",       to: "/arqueo",     accent: "#ec4899", glow: "rgba(236,72,153,0.35)",   big: false },
    { key: "soporte",    icon: "solar:chat-round-dots-bold-duotone",     label: "Soporte",     sub: "Canal de ayuda",      to: "/soporte",    accent: "#34d399", glow: "rgba(52,211,153,0.35)",   big: false },
];

const ACCESOS_SUPERVISOR = [
    { key: "pos",        icon: "solar:cart-large-2-bold-duotone",        label: "Vender",      sub: "Punto de venta",      to: "/pos",        accent: "#f88533", glow: "rgba(248,133,51,0.35)",   big: true  },
    { key: "inv",        icon: "solar:box-bold-duotone",                 label: "Inventario",  sub: "Gestionar stock",     to: "/inventario", accent: "#4ade80", glow: "rgba(74,222,128,0.35)",   big: false },
    { key: "reportes",   icon: "solar:chart-square-bold-duotone",        label: "Reportes",    sub: "Ver estadísticas",    to: "/reportes",   accent: "#60a5fa", glow: "rgba(96,165,250,0.35)",   big: false },
    { key: "kardex",     icon: "solar:clipboard-list-bold-duotone",      label: "Kardex",      sub: "Movimientos",         to: "/kardex",     accent: "#f59e0b", glow: "rgba(245,158,11,0.35)",   big: false },
    { key: "arqueo",     icon: "solar:wallet-money-bold-duotone",        label: "Arqueo",      sub: "Caja y turnos",       to: "/arqueo",     accent: "#ec4899", glow: "rgba(236,72,153,0.35)",   big: false },
];

const ACCESOS_CAJERO = [
    { key: "pos",        icon: "solar:cart-large-2-bold-duotone",        label: "Vender",      sub: "Punto de venta",      to: "/pos",        accent: "#f88533", glow: "rgba(248,133,51,0.35)",   big: true  },
    { key: "inv",        icon: "solar:box-bold-duotone",                 label: "Inventario",  sub: "Ver stock",           to: "/inventario", accent: "#4ade80", glow: "rgba(74,222,128,0.35)",   big: false },
    { key: "reportes",   icon: "solar:chart-square-bold-duotone",        label: "Reportes",    sub: "Ver estadísticas",    to: "/reportes",   accent: "#60a5fa", glow: "rgba(96,165,250,0.35)",   big: false },
];

const ACCESOS_COMERCIAL = [
    { key: "prospectos", icon: "solar:user-speak-bold-duotone",          label: "Leads",       sub: "Seguimiento clientes",to: "/prospectos", accent: "#818cf8", glow: "rgba(129,140,248,0.35)",  big: true  },
];

const ACCESOS_INMOBILIARIA = [
    { key: "propiedades",    icon: "solar:home-smile-bold-duotone",        label: "Propiedades",    sub: "Aptos · Casas · Lotes · Fincas",     to: "/propiedades",    accent: "#f59e0b", glow: "rgba(245,158,11,0.35)",  big: true  },
    { key: "proyectos",      icon: "mdi:hard-hat",                         label: "Proyectos",      sub: "Obras · Remodelación · Reparación",  to: "/proyectos",      accent: "#60a5fa", glow: "rgba(96,165,250,0.35)",  big: false },
    { key: "administracion", icon: "solar:clipboard-list-bold-duotone",    label: "Administración", sub: "Gestión de propiedades",             to: "/administracion", accent: "#a78bfa", glow: "rgba(167,139,250,0.35)", big: false },
];

const STATS_INMOBILIARIA_CFG = [
    { key: "disponibles", label: "Disponibles",  accent: "#4ade80" },
    { key: "reservadas",  label: "Reservadas",   accent: "#f59e0b" },
    { key: "vendidas",    label: "Vendidas",      accent: "#60a5fa" },
    { key: "proyectos",   label: "Proyectos",     accent: "#a78bfa" },
];

const ACCESOS_SUSCRIPCIONES = [
    { key: "suscriptores", icon: "solar:users-group-rounded-bold-duotone", label: "Suscriptores",   sub: "Gestionar clientes", to: "/clientes",      accent: "#60a5fa", glow: "rgba(96,165,250,0.35)",  big: true  },
    { key: "mensajes",     icon: "solar:chat-round-bold-duotone",          label: "Mensajes",        sub: "Equipo interno",     to: "/mensajes",      accent: "#a78bfa", glow: "rgba(167,139,250,0.35)", big: false },
    { key: "soporte",      icon: "solar:headphones-round-bold-duotone",    label: "Soporte",         sub: "Canal de ayuda",     to: "/soporte",       accent: "#34d399", glow: "rgba(52,211,153,0.35)",  big: false },
    { key: "config",       icon: "solar:settings-bold-duotone",            label: "Configuración",   sub: "Mi empresa",         to: "/configuracion", accent: "#f59e0b", glow: "rgba(245,158,11,0.35)",  big: false },
];

const STATS_TV_CFG = [
    { key: "total",     label: "Total",      accent: "#60a5fa" },
    { key: "activos",   label: "Activos",    accent: "#4ade80" },
    { key: "porVencer", label: "Por vencer", accent: "#f59e0b" },
    { key: "vencidos",  label: "Vencidos",   accent: "#f87171" },
];

const STATS_SAAS_CFG = [
    { key: "total",      label: "Clientes",    accent: "#60a5fa" },
    { key: "alDia",      label: "Al día",      accent: "#4ade80" },
    { key: "porVencer",  label: "Por vencer",  accent: "#f59e0b" },
    { key: "suspendidos",label: "Suspendidos", accent: "#f87171" },
];

export function HomeTemplates() {
    const navigate = useNavigate();
    const { dataempresa }    = useEmpresaStore();
    const { datausuarios }   = useUsuariosStore();
    const { dataSucursales } = useSucursalesStore();
    const { dataAlmacenes }  = useAlmacenesConfigStore();
    const { diasMora, suspendido, esSuperadmin, suscripcion } = usePlan();

    const tipo   = datausuarios?.tipo ?? "cajero";
    const rol    = ROL_STYLE[tipo] ?? ROL_STYLE.cajero;
    const nombre = datausuarios?.nombres?.split(" ")[0] ?? "usuario";

    const hora   = new Date().getHours();
    const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

    const esSuscripcionesTV  = dataempresa?.actividad_economica === "suscripciones_tv";
    const esInmobiliaria     = dataempresa?.actividad_economica === "construccion";

    /* versión para superadmin */
    const { data: versiones = [] } = useQuery({
        queryKey: ["version-home"],
        queryFn: MostrarVersion,
        enabled: tipo === "superadmin",
    });

    /* stats suscriptores TV */
    const { data: clientes = [] } = useQuery({
        queryKey: ["clientes-home-tv", dataempresa?.id],
        queryFn: () => MostrarClientes({ id_empresa: dataempresa.id }),
        enabled: !!dataempresa?.id && esSuscripcionesTV,
        staleTime: 60000,
    });

    const statsTV = useMemo(() => {
        let activos = 0, porVencer = 0, vencidos = 0;
        clientes.forEach((c) => {
            const e = calcEstado(c);
            if (e === "activo") activos++;
            else if (e === "por_vencer") porVencer++;
            else if (e === "vencido") vencidos++;
        });
        return { total: clientes.length, activos, porVencer, vencidos };
    }, [clientes]);

    /* stats inmobiliaria */
    const { data: propiedadesHome = [] } = useQuery({
        queryKey: ["propiedades-home", dataempresa?.id],
        queryFn: () => MostrarPropiedades({ id_empresa: dataempresa.id }),
        enabled: !!dataempresa?.id && esInmobiliaria,
        staleTime: 60000,
    });
    const { data: proyectosHome = [] } = useQuery({
        queryKey: ["proyectos-home", dataempresa?.id],
        queryFn: () => MostrarProyectos({ id_empresa: dataempresa.id }),
        enabled: !!dataempresa?.id && esInmobiliaria,
        staleTime: 60000,
    });
    const statsInmobiliaria = useMemo(() => ({
        disponibles: propiedadesHome.filter(p => p.estado === "disponible").length,
        reservadas:  propiedadesHome.filter(p => p.estado === "reservado").length,
        vendidas:    propiedadesHome.filter(p => p.estado === "vendido").length,
        proyectos:   proyectosHome.filter(p => p.estado === "en_progreso").length,
    }), [propiedadesHome, proyectosHome]);

    /* stats SaaS para superadmin */
    const { data: suscripciones = [] } = useQuery({
        queryKey: ["suscripciones-home-saas"],
        queryFn: MostrarSuscripciones,
        enabled: tipo === "superadmin",
        staleTime: 60000,
    });

    const statsSaaS = useMemo(() => {
        const hoy = new Date();
        let alDia = 0, porVencer = 0, suspendidos = 0;
        suscripciones.forEach((s) => {
            if (s.estado === "suspendido") { suspendidos++; return; }
            if (!s.fecha_proximo_pago) { alDia++; return; }
            const dias = Math.ceil((new Date(s.fecha_proximo_pago) - hoy) / 86400000);
            if (dias < 0) suspendidos++;
            else if (dias <= 5) porVencer++;
            else alDia++;
        });
        return { total: suscripciones.length, alDia, porVencer, suspendidos };
    }, [suscripciones]);

    /* contexto subtítulo */
    const sucursal = dataSucursales?.find(s => s.id === datausuarios?.id_sucursal);
    const almacen  = dataAlmacenes?.find(a => a.id === datausuarios?.id_almacen);
    const contexto = tipo === "superadmin"
        ? versiones[0]?.version ?? "POS"
        : tipo === "cajero"
        ? almacen?.nombre ?? "Sin almacén"
        : tipo === "supervisor"
        ? sucursal?.razon_social ?? "Sin sucursal"
        : dataempresa?.razon_social ?? "Empresa";

    const accesos = esInmobiliaria        ? ACCESOS_INMOBILIARIA
                  : esSuscripcionesTV     ? ACCESOS_SUSCRIPCIONES
                  : tipo === "cajero"     ? ACCESOS_CAJERO
                  : tipo === "supervisor" ? ACCESOS_SUPERVISOR
                  : tipo === "superadmin" ? ACCESOS_SUPERADMIN
                  : tipo === "comercial"  ? ACCESOS_COMERCIAL
                  : ACCESOS_ADMIN;

    const fecha = new Date().toLocaleDateString("es-CO", {
        weekday: "long", day: "numeric", month: "long",
    });

    const alertaPlan = !esSuperadmin && suscripcion ? (() => {
        if (suspendido) return { nivel: "critico", msg: "Cuenta suspendida — Contacta a soporte para reactivar tu suscripción.", icono: "🔴" };
        if (diasMora > 0) return { nivel: "mora",   msg: `Tu suscripción venció hace ${diasMora} día${diasMora !== 1 ? "s" : ""}. Contacta a soporte para regularizarla.`, icono: "🟠" };
        if (diasMora === 0) return { nivel: "mora",  msg: "Tu suscripción vence hoy. Contáctanos para renovar y no perder el acceso.", icono: "🟡" };
        if (diasMora >= -5) return { nivel: "aviso", msg: `Tu suscripción vence en ${-diasMora} día${-diasMora !== 1 ? "s" : ""}. Prepárate para renovar.`, icono: "🔔" };
        return null;
    })() : null;

    return (
        <Page>
            <Orb1 $rol={rol.color} />
            <Orb2 />
            <Orb3 />

            <Inner>
                {/* ── Header ── */}
                <HeaderSection>
                    <FechaChip>{fecha}</FechaChip>
                    <Saludo>
                        {saludo}, <NombreAccent $color={rol.color}>{nombre}</NombreAccent>
                    </Saludo>
                    <RolRow>
                        <RolBadge $color={rol.color} $bg={rol.bg} $glow={rol.glow}>
                            {tipo}
                        </RolBadge>
                        <Contexto>{contexto}</Contexto>
                    </RolRow>
                </HeaderSection>

                {/* ── Banner vencimiento ── */}
                {alertaPlan && (
                    <AlertaBanner $nivel={alertaPlan.nivel}>
                        <AlertaIcono>{alertaPlan.icono}</AlertaIcono>
                        <AlertaMsg>{alertaPlan.msg}</AlertaMsg>
                    </AlertaBanner>
                )}

                {/* ── Stats según actividad ── */}
                {(esSuscripcionesTV || esInmobiliaria || tipo === "superadmin") && (
                    <StatsRow>
                        {(tipo === "superadmin"
                            ? STATS_SAAS_CFG
                            : esInmobiliaria
                            ? STATS_INMOBILIARIA_CFG
                            : STATS_TV_CFG
                        ).map(({ key, label, accent }, i) => (
                            <StatCard key={key} $accent={accent} $i={i}>
                                <StatNum $accent={accent}>
                                    <AnimatedNumber value={
                                        tipo === "superadmin" ? statsSaaS[key]
                                        : esInmobiliaria      ? statsInmobiliaria[key]
                                        : statsTV[key]
                                    } />
                                </StatNum>
                                <StatLabel>{label}</StatLabel>
                                <StatGlow $accent={accent} />
                            </StatCard>
                        ))}
                    </StatsRow>
                )}

                {/* ── Nav Cards ── */}
                <BentoGrid>
                    {accesos.map(({ key, icon, label, sub, to, accent, glow, big }, i) => (
                        <NavCard
                            key={key}
                            $accent={accent}
                            $glow={glow}
                            $big={big}
                            $i={i}
                            onClick={() => navigate(to)}
                        >
                            <NavIconCircle $accent={accent} $big={big}>
                                <Icon icon={icon} />
                            </NavIconCircle>
                            <NavInfo>
                                <NavLabel $big={big}>{label}</NavLabel>
                                <NavSub>{sub}</NavSub>
                            </NavInfo>
                            <NavArrow $accent={accent}>
                                <Icon icon="solar:arrow-right-bold" />
                            </NavArrow>
                            <CardShine />
                        </NavCard>
                    ))}
                </BentoGrid>
            </Inner>
        </Page>
    );
}

/* ───────────── animations ── */
const drift1 = keyframes`
    0%   { transform: translate(0,0) scale(1); }
    33%  { transform: translate(40px,-60px) scale(1.08); }
    66%  { transform: translate(-30px,30px) scale(0.96); }
    100% { transform: translate(0,0) scale(1); }
`;
const drift2 = keyframes`
    0%   { transform: translate(0,0) scale(1); }
    50%  { transform: translate(-50px,40px) scale(1.1); }
    100% { transform: translate(0,0) scale(1); }
`;
const drift3 = keyframes`
    0%   { transform: translate(0,0) scale(1.05); }
    40%  { transform: translate(60px,-30px) scale(1); }
    80%  { transform: translate(-20px,50px) scale(1.08); }
    100% { transform: translate(0,0) scale(1.05); }
`;
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: none; }
`;
const shineMove = keyframes`
    0%   { left: -80%; }
    100% { left: 130%; }
`;
const pulseGlow = keyframes`
    0%,100% { opacity: 0.5; transform: scale(1); }
    50%      { opacity: 1;   transform: scale(1.15); }
`;
const glowPulse = keyframes`
    0%,100% { box-shadow: 0 0 12px var(--glow); }
    50%      { box-shadow: 0 0 24px var(--glow); }
`;

/* ───────────── layout ── */
const orbBase = css`
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
`;

const Page = styled.div`
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    overflow: hidden;

    @media (max-width: 767px) {
        padding: 78px 16px 32px;
        align-items: flex-start;
    }
`;

const Orb1 = styled.div`
    ${orbBase}
    width: 420px; height: 420px;
    top: -80px; left: -100px;
    background: radial-gradient(circle, ${({ $rol }) => $rol ?? "#60a5fa"}30 0%, transparent 70%);
    animation: ${drift1} 18s ease-in-out infinite;
`;
const Orb2 = styled.div`
    ${orbBase}
    width: 380px; height: 380px;
    bottom: -60px; right: -80px;
    background: radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%);
    animation: ${drift2} 22s ease-in-out infinite;
`;
const Orb3 = styled.div`
    ${orbBase}
    width: 280px; height: 280px;
    top: 45%; left: 55%;
    background: radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%);
    animation: ${drift3} 16s ease-in-out infinite;
`;

const Inner = styled.div`
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 28px;
`;

/* ───────────── header ── */
const HeaderSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    animation: ${fadeUp} 0.45s ease both;
`;

const FechaChip = styled.span`
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    text-transform: capitalize;
    letter-spacing: 1px;
    color: rgba(255,255,255,0.35);
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    width: fit-content;
`;

const Saludo = styled.h1`
    font-size: clamp(26px, 5vw, 38px);
    font-weight: 900;
    color: #fff;
    margin: 8px 0 0;
    line-height: 1.15;
`;

const NombreAccent = styled.span`
    background: linear-gradient(135deg, ${({ $color }) => $color}, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const RolRow = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 6px;
`;

const RolBadge = styled.span`
    --glow: ${({ $glow }) => $glow};
    display: inline-block;
    padding: 5px 16px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: ${({ $color }) => $color};
    background: ${({ $bg }) => $bg};
    border: 1px solid ${({ $color }) => $color}40;
    animation: ${glowPulse} 3s ease-in-out infinite;
`;

const Contexto = styled.span`
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.4);
`;

/* ───────────── stats TV ── */
const StatsRow = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    animation: ${fadeUp} 0.45s 0.1s ease both;

    @media (max-width: 480px) {
        grid-template-columns: repeat(2, 1fr);
    }
`;

const StatCard = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 16px 8px;
    border-radius: 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    overflow: hidden;
    animation: ${fadeUp} 0.4s ${({ $i }) => $i * 0.06 + 0.15}s ease both;
    transition: border-color 0.2s, transform 0.2s;

    &:hover {
        border-color: ${({ $accent }) => $accent}40;
        transform: translateY(-2px);
    }
`;

const StatNum = styled.span`
    font-size: clamp(22px, 4vw, 30px);
    font-weight: 900;
    color: ${({ $accent }) => $accent};
    line-height: 1;
    font-variant-numeric: tabular-nums;
`;

const StatLabel = styled.span`
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: rgba(255,255,255,0.35);
`;

const StatGlow = styled.div`
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 24px;
    background: ${({ $accent }) => $accent};
    filter: blur(14px);
    opacity: 0.25;
    animation: ${pulseGlow} 3s ease-in-out infinite;
`;

/* ───────────── nav cards ── */
const BentoGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    animation: ${fadeUp} 0.45s 0.18s ease both;

    & > :first-child {
        grid-column: 1 / -1;
    }

    /* última card sola en su fila (posición par) → span full */
    & > :last-child:nth-child(even) {
        grid-column: 1 / -1;
    }

    @media (max-width: 400px) {
        grid-template-columns: 1fr;
        & > :first-child,
        & > :last-child:nth-child(even) { grid-column: 1; }
    }
`;

const NavCard = styled.button`
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: ${({ $big }) => $big ? "22px 20px" : "16px 18px"};
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    cursor: pointer;
    font-family: "Poppins", sans-serif;
    text-align: left;
    overflow: hidden;
    animation: ${fadeUp} 0.4s ${({ $i }) => $i * 0.07 + 0.22}s ease both;
    transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), border-color 0.22s, box-shadow 0.22s;

    &:hover {
        transform: translateY(-4px) scale(1.01);
        border-color: ${({ $accent }) => $accent}45;
        box-shadow: 0 12px 40px ${({ $glow }) => $glow};
    }

    &:active {
        transform: scale(0.98);
    }
`;

const NavIconCircle = styled.div`
    flex-shrink: 0;
    width: ${({ $big }) => $big ? "52px" : "44px"};
    height: ${({ $big }) => $big ? "52px" : "44px"};
    border-radius: ${({ $big }) => $big ? "16px" : "14px"};
    background: ${({ $accent }) => $accent}18;
    border: 1px solid ${({ $accent }) => $accent}30;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${({ $big }) => $big ? "26px" : "22px"};
    color: ${({ $accent }) => $accent};
    transition: background 0.2s, box-shadow 0.2s;

    ${NavCard}:hover & {
        background: ${({ $accent }) => $accent}28;
        box-shadow: 0 0 16px ${({ $accent }) => $accent}40;
    }
`;

const NavInfo = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const NavLabel = styled.span`
    font-size: ${({ $big }) => $big ? "16px" : "14px"};
    font-weight: 800;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const NavSub = styled.span`
    font-size: 11px;
    font-weight: 500;
    color: rgba(255,255,255,0.38);
`;

const NavArrow = styled.div`
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: ${({ $accent }) => $accent}15;
    border: 1px solid ${({ $accent }) => $accent}25;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: ${({ $accent }) => $accent};
    opacity: 0;
    transition: opacity 0.2s, transform 0.2s;

    ${NavCard}:hover & {
        opacity: 1;
        transform: translateX(2px);
    }
`;

const CardShine = styled.div`
    position: absolute;
    top: 0;
    left: -80%;
    width: 60%;
    height: 100%;
    background: linear-gradient(
        105deg,
        transparent 40%,
        rgba(255,255,255,0.04) 50%,
        transparent 60%
    );
    pointer-events: none;

    ${NavCard}:hover & {
        animation: ${shineMove} 0.55s ease forwards;
    }
`;

/* ───────────── alerta plan ── */
const COLORES_ALERTA = {
    critico: { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.35)" },
    mora:    { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.35)"  },
    aviso:   { bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.30)"  },
};

const AlertaBanner = styled.div`
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px; border-radius: 14px;
    background: ${({ $nivel }) => COLORES_ALERTA[$nivel]?.bg ?? "rgba(245,158,11,0.12)"};
    border: 1px solid ${({ $nivel }) => COLORES_ALERTA[$nivel]?.border ?? "rgba(245,158,11,0.35)"};
    animation: ${fadeUp} 0.4s ease both;
`;

const AlertaIcono = styled.span`font-size: 20px; flex-shrink: 0;`;

const AlertaMsg = styled.span`
    font-size: 13px; font-weight: 600; line-height: 1.4;
    color: rgba(255,255,255,0.85);
`;
