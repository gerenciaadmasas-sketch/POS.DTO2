import { useEffect, useState, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { useQuery } from "@tanstack/react-query";
import { MostrarClientes } from "../../supabase/crudClientes";
import { Icon } from "@iconify/react";

/* ── helpers ── */
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

const ACCESOS = [
    {
        key: "suscriptores",
        icon: "solar:users-group-rounded-bold-duotone",
        label: "Suscriptores",
        sub: "Gestionar clientes",
        to: "/clientes",
        accent: "#60a5fa",
        glow: "rgba(96,165,250,0.35)",
        big: true,
    },
    {
        key: "mensajes",
        icon: "solar:chat-round-bold-duotone",
        label: "Mensajes",
        sub: "Equipo interno",
        to: "/mensajes",
        accent: "#a78bfa",
        glow: "rgba(167,139,250,0.35)",
        big: false,
    },
    {
        key: "soporte",
        icon: "solar:headphones-round-bold-duotone",
        label: "Soporte",
        sub: "Canal de ayuda",
        to: "/soporte",
        accent: "#34d399",
        glow: "rgba(52,211,153,0.35)",
        big: false,
    },
    {
        key: "config",
        icon: "solar:settings-bold-duotone",
        label: "Configuración",
        sub: "Mi empresa",
        to: "/configuracion",
        accent: "#f59e0b",
        glow: "rgba(245,158,11,0.35)",
        big: false,
    },
];

const STATS_CFG = [
    { key: "total",     label: "Total",      accent: "#60a5fa" },
    { key: "activos",   label: "Activos",    accent: "#4ade80" },
    { key: "porVencer", label: "Por vencer", accent: "#f59e0b" },
    { key: "vencidos",  label: "Vencidos",   accent: "#f87171" },
];

export function HomeSuscripcionesTVTemplate() {
    const navigate = useNavigate();
    const { dataempresa } = useEmpresaStore();
    const { datausuarios } = useUsuariosStore();

    const nombre = datausuarios?.nombres?.split(" ")[0] ?? "usuario";
    const hora = new Date().getHours();
    const saludo =
        hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

    const { data: clientes = [] } = useQuery({
        queryKey: ["clientes-home-tv", dataempresa?.id],
        queryFn: () => MostrarClientes({ id_empresa: dataempresa.id }),
        enabled: !!dataempresa?.id,
        staleTime: 60000,
    });

    const stats = useMemo(() => {
        const total = clientes.length;
        let activos = 0, porVencer = 0, vencidos = 0;
        clientes.forEach((c) => {
            const e = calcEstado(c);
            if (e === "activo") activos++;
            else if (e === "por_vencer") porVencer++;
            else if (e === "vencido") vencidos++;
        });
        return { total, activos, porVencer, vencidos };
    }, [clientes]);

    const fecha = new Date().toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    return (
        <Page>
            <Orb1 />
            <Orb2 />
            <Orb3 />

            <Inner>
                {/* ── Header ── */}
                <HeaderSection>
                    <FechaChip>{fecha}</FechaChip>
                    <Saludo>
                        {saludo}, <NombreAccent>{nombre}</NombreAccent>
                    </Saludo>
                    <EmpresaNombre>{dataempresa?.razon_social}</EmpresaNombre>
                </HeaderSection>

                {/* ── Stats ── */}
                <StatsRow>
                    {STATS_CFG.map(({ key, label, accent }, i) => (
                        <StatCard key={key} $accent={accent} $i={i}>
                            <StatNum $accent={accent}>
                                <AnimatedNumber value={stats[key]} />
                            </StatNum>
                            <StatLabel>{label}</StatLabel>
                            <StatGlow $accent={accent} />
                        </StatCard>
                    ))}
                </StatsRow>

                {/* ── Nav cards bento ── */}
                <BentoGrid>
                    {ACCESOS.map(({ key, icon, label, sub, to, accent, glow, big }, i) => (
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

/* ───────────────────────────── animations ── */
const drift1 = keyframes`
    0%   { transform: translate(0, 0) scale(1); }
    33%  { transform: translate(40px, -60px) scale(1.08); }
    66%  { transform: translate(-30px, 30px) scale(0.96); }
    100% { transform: translate(0, 0) scale(1); }
`;
const drift2 = keyframes`
    0%   { transform: translate(0, 0) scale(1); }
    50%  { transform: translate(-50px, 40px) scale(1.1); }
    100% { transform: translate(0, 0) scale(1); }
`;
const drift3 = keyframes`
    0%   { transform: translate(0, 0) scale(1.05); }
    40%  { transform: translate(60px, -30px) scale(1); }
    80%  { transform: translate(-20px, 50px) scale(1.08); }
    100% { transform: translate(0, 0) scale(1.05); }
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

/* ───────────────────────────── Page ── */
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

const orbBase = css`
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
`;

const Orb1 = styled.div`
    ${orbBase}
    width: 420px; height: 420px;
    top: -80px; left: -100px;
    background: radial-gradient(circle, rgba(96,165,250,0.22) 0%, transparent 70%);
    animation: ${drift1} 18s ease-in-out infinite;
`;
const Orb2 = styled.div`
    ${orbBase}
    width: 380px; height: 380px;
    bottom: -60px; right: -80px;
    background: radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%);
    animation: ${drift2} 22s ease-in-out infinite;
`;
const Orb3 = styled.div`
    ${orbBase}
    width: 280px; height: 280px;
    top: 45%; left: 55%;
    background: radial-gradient(circle, rgba(52,211,153,0.14) 0%, transparent 70%);
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

/* ───────────────────────────── Header ── */
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
    text-transform: uppercase;
    letter-spacing: 1.2px;
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
    background: linear-gradient(135deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const EmpresaNombre = styled.p`
    font-size: 14px;
    font-weight: 600;
    color: rgba(255,255,255,0.4);
    margin: 0;
    letter-spacing: 0.3px;
`;

/* ───────────────────────────── Stats ── */
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

/* ───────────────────────────── Bento ── */
const BentoGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
    gap: 12px;
    animation: ${fadeUp} 0.45s 0.22s ease both;

    /* Primera tarjeta ocupa columna completa */
    & > :first-child {
        grid-column: 1 / -1;
    }

    @media (max-width: 400px) {
        grid-template-columns: 1fr;
        & > :first-child {
            grid-column: 1;
        }
    }
`;

const NavCard = styled.button`
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: ${({ $big }) => $big ? "24px 20px" : "18px 18px"};
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    cursor: pointer;
    font-family: "Poppins", sans-serif;
    text-align: left;
    overflow: hidden;
    animation: ${fadeUp} 0.4s ${({ $i }) => $i * 0.07 + 0.28}s ease both;
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
    width: ${({ $big }) => $big ? "54px" : "46px"};
    height: ${({ $big }) => $big ? "54px" : "46px"};
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
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${({ $accent }) => $accent}15;
    border: 1px solid ${({ $accent }) => $accent}25;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: ${({ $accent }) => $accent};
    transition: background 0.2s, transform 0.2s;
    opacity: 0;

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
