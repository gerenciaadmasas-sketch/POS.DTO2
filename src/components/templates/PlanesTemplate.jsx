import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { v } from "../../styles/variables";
import {
    RiArrowLeftSLine, RiCheckLine, RiFlashlightLine, RiBuilding2Line,
    RiRocketLine, RiShieldCheckLine, RiCustomerService2Line, RiStore2Line,
    RiTeamLine, RiBarChartBoxLine, RiFileListLine, RiArchiveLine,
    RiPrinterLine, RiSmartphoneLine, RiStarLine, RiWhatsappLine,
} from "react-icons/ri";

const PLANES = [
    {
        id: "starter",
        nombre: "Starter",
        emoji: "⚡",
        sub: "Para negocios que están comenzando",
        precio_mes: 49000,
        precio_ano: 39000,
        color: "#6366f1",
        colorDark: "#4338ca",
        shadow: "rgba(99,102,241,0.35)",
        popular: false,
        features: [
            { icon: <RiStore2Line />,    texto: "1 almacén" },
            { icon: <RiTeamLine />,      texto: "Hasta 2 usuarios" },
            { icon: <RiFlashlightLine />,texto: "Punto de venta (POS)" },
            { icon: <RiArchiveLine />,   texto: "Inventario básico" },
            { icon: <RiBarChartBoxLine />,texto: "Reportes básicos" },
            { icon: <RiWhatsappLine />,  texto: "Soporte por WhatsApp" },
        ],
        noIncluye: ["Kardex y trazabilidad", "Arqueo de caja", "Multi-sucursal"],
    },
    {
        id: "negocio",
        nombre: "Negocio",
        emoji: "🚀",
        sub: "El favorito de nuestros clientes",
        precio_mes: 129000,
        precio_ano: 99000,
        color: "#f88533",
        colorDark: "#d4650a",
        shadow: "rgba(248,133,51,0.4)",
        popular: true,
        features: [
            { icon: <RiStore2Line />,    texto: "Hasta 3 almacenes" },
            { icon: <RiTeamLine />,      texto: "Hasta 10 usuarios" },
            { icon: <RiFlashlightLine />,texto: "POS + roles completos" },
            { icon: <RiArchiveLine />,   texto: "Inventario avanzado" },
            { icon: <RiFileListLine />,  texto: "Kardex y trazabilidad" },
            { icon: <RiBarChartBoxLine />,texto: "Reportes avanzados" },
            { icon: <RiBuilding2Line />, texto: "Multi-sucursal" },
            { icon: <RiPrinterLine />,   texto: "Ticket personalizado" },
            { icon: <RiShieldCheckLine />,texto: "Soporte prioritario" },
        ],
        noIncluye: [],
    },
    {
        id: "empresarial",
        nombre: "Empresarial",
        emoji: "👑",
        sub: "Para cadenas y grandes operaciones",
        precio_mes: 249000,
        precio_ano: 199000,
        color: "#10b981",
        colorDark: "#059669",
        shadow: "rgba(16,185,129,0.35)",
        popular: false,
        features: [
            { icon: <RiStore2Line />,    texto: "Almacenes ilimitados" },
            { icon: <RiTeamLine />,      texto: "Usuarios ilimitados" },
            { icon: <RiFlashlightLine />,texto: "Todo del plan Negocio" },
            { icon: <RiSmartphoneLine />,texto: "App móvil optimizada" },
            { icon: <RiCustomerService2Line />, texto: "Soporte dedicado 24/7" },
            { icon: <RiStarLine />,      texto: "Onboarding personalizado" },
            { icon: <RiShieldCheckLine />,texto: "SLA garantizado" },
        ],
        noIncluye: [],
    },
];

const formatCOP = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

export function PlanesTemplate() {
    const navigate = useNavigate();
    const [anual, setAnual] = useState(false);

    return (
        <Pagina>
            {/* ── Fondo decorativo ── */}
            <BgGlow $pos="top-left" />
            <BgGlow $pos="bottom-right" />
            <BgGrid />

            {/* ── Navbar ── */}
            <Navbar>
                <NavLogo onClick={() => navigate("/")}>
                    <img src={v.logo} alt="logo" />
                    <span>POS<b>.DTO2</b></span>
                </NavLogo>
                <BtnVolver onClick={() => navigate("/")}>
                    <RiArrowLeftSLine size={18} /> Volver
                </BtnVolver>
            </Navbar>

            {/* ── Hero ── */}
            <Hero>
                <HeroBadge>✦ Planes y precios</HeroBadge>
                <HeroTitle>
                    Elige el plan que<br />
                    <GradientText>impulsa tu negocio</GradientText>
                </HeroTitle>
                <HeroSub>
                    Sin costos ocultos. Sin contratos. Cancela cuando quieras.<br />
                    Todos los planes incluyen actualizaciones gratuitas.
                </HeroSub>

                {/* Toggle mensual / anual */}
                <Toggle>
                    <ToggleLabel $active={!anual} onClick={() => setAnual(false)}>Mensual</ToggleLabel>
                    <ToggleSwitch onClick={() => setAnual(!anual)} $on={anual}>
                        <ToggleCircle $on={anual} />
                    </ToggleSwitch>
                    <ToggleLabel $active={anual} onClick={() => setAnual(true)}>
                        Anual <AhorroChip>Ahorra 20%</AhorroChip>
                    </ToggleLabel>
                </Toggle>
            </Hero>

            {/* ── Cards de planes ── */}
            <CardsGrid>
                {PLANES.map((plan) => (
                    <PlanCard key={plan.id} $color={plan.color} $shadow={plan.shadow} $popular={plan.popular}>
                        {plan.popular && <PopularBadge>⭐ Más popular</PopularBadge>}

                        <CardTop>
                            <PlanEmoji>{plan.emoji}</PlanEmoji>
                            <PlanNombre $color={plan.color}>{plan.nombre}</PlanNombre>
                            <PlanSub>{plan.sub}</PlanSub>
                        </CardTop>

                        <PrecioWrap>
                            <Precio>
                                <PrecioNum>{formatCOP(anual ? plan.precio_ano : plan.precio_mes)}</PrecioNum>
                                <PrecioMes>/mes</PrecioMes>
                            </Precio>
                            {anual && (
                                <PrecioAnualNote>Facturado anualmente · {formatCOP(plan.precio_ano * 12)}/año</PrecioAnualNote>
                            )}
                        </PrecioWrap>

                        <BtnPlan $color={plan.color} $colorDark={plan.colorDark} $popular={plan.popular}
                            onClick={() => navigate("/login")}>
                            Comenzar ahora
                        </BtnPlan>

                        <Divider />

                        <FeatureList>
                            {plan.features.map((f, i) => (
                                <FeatureItem key={i} $color={plan.color}>
                                    <FeatureIcon $color={plan.color}>{f.icon}</FeatureIcon>
                                    <span>{f.texto}</span>
                                </FeatureItem>
                            ))}
                            {plan.noIncluye.map((f, i) => (
                                <FeatureItem key={`no-${i}`} $disabled>
                                    <FeatureIconNo><RiCheckLine /></FeatureIconNo>
                                    <span>{f}</span>
                                </FeatureItem>
                            ))}
                        </FeatureList>
                    </PlanCard>
                ))}
            </CardsGrid>

            {/* ── Garantía / Trust ── */}
            <Trust>
                <TrustItem>
                    <TrustIcon><RiShieldCheckLine /></TrustIcon>
                    <TrustTxt><b>Sin permanencia</b><br />Cancela en cualquier momento</TrustTxt>
                </TrustItem>
                <TrustItem>
                    <TrustIcon><RiFlashlightLine /></TrustIcon>
                    <TrustTxt><b>Activación inmediata</b><br />Listo para usar en minutos</TrustTxt>
                </TrustItem>
                <TrustItem>
                    <TrustIcon><RiCustomerService2Line /></TrustIcon>
                    <TrustTxt><b>Soporte real</b><br />Humanos reales, no bots</TrustTxt>
                </TrustItem>
                <TrustItem>
                    <TrustIcon><RiRocketLine /></TrustIcon>
                    <TrustTxt><b>Actualizaciones incluidas</b><br />Siempre la última versión</TrustTxt>
                </TrustItem>
            </Trust>

            {/* ── CTA final ── */}
            <CtaFinal>
                <CtaTitle>¿Tienes dudas? Hablemos.</CtaTitle>
                <CtaSub>Escríbenos por WhatsApp y te ayudamos a elegir el plan ideal para tu negocio.</CtaSub>
                <BtnWhatsapp
                    as="a"
                    href="https://wa.me/573118303017"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <RiWhatsappLine size={22} /> Chatear por WhatsApp
                </BtnWhatsapp>
            </CtaFinal>

            {/* ── Footer ── */}
            <PageFooter>
                <span>© {new Date().getFullYear()} POS.DTO2 — ADMA BI</span>
                <span>Todos los derechos reservados</span>
            </PageFooter>
        </Pagina>
    );
}

/* ── Animaciones ── */
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const gradientShift = keyframes`
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

const floatGlow = keyframes`
    0%, 100% { transform: scale(1);   opacity: 0.55; }
    50%       { transform: scale(1.12); opacity: 0.75; }
`;

const shimmer = keyframes`
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
`;

/* ── Layout ── */
const Pagina = styled.div`
    min-height: 100vh;
    background: #080d14;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow-x: hidden;
    padding-bottom: 60px;
    font-family: "Poppins", sans-serif;
`;

/* ── Fondo decorativo ── */
const BgGlow = styled.div`
    position: fixed;
    pointer-events: none;
    z-index: 0;

    ${({ $pos }) => $pos === "top-left" ? `
        top: -160px; left: -120px;
        width: 520px; height: 520px;
        background: radial-gradient(circle, rgba(248,133,51,0.18) 0%, transparent 70%);
        animation: ${floatGlow} 6s ease-in-out infinite;
    ` : `
        bottom: -120px; right: -100px;
        width: 440px; height: 440px;
        background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
        animation: ${floatGlow} 8s ease-in-out infinite reverse;
    `}
`;

const BgGrid = styled.div`
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image:
        linear-gradient(rgba(248,133,51,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(248,133,51,0.04) 1px, transparent 1px);
    background-size: 48px 48px;
`;

/* ── Navbar ── */
const Navbar = styled.nav`
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 1100px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 32px;

    @media (max-width: 767px) { padding: 20px 20px; }
`;

const NavLogo = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    background: none;
    border: none;
    cursor: pointer;
    img { width: 36px; height: 36px; object-fit: contain; }
    span {
        font-size: 20px;
        font-weight: 900;
        color: #fff;
        letter-spacing: -0.4px;
        b { color: #f88533; }
    }
`;

const BtnVolver = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 18px 9px 12px;
    border-radius: 999px;
    border: 1.5px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.7);
    font-size: 13px;
    font-weight: 700;
    font-family: "Poppins", sans-serif;
    cursor: pointer;
    backdrop-filter: blur(8px);
    transition: all 0.18s ease;
    &:hover { border-color: #f88533; color: #f88533; background: rgba(248,133,51,0.08); }
`;

/* ── Hero ── */
const Hero = styled.section`
    position: relative;
    z-index: 1;
    text-align: center;
    padding: 40px 24px 56px;
    max-width: 700px;
    animation: ${fadeUp} 0.5s ease both;

    @media (max-width: 767px) { padding: 24px 20px 40px; }
`;

const HeroBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    border-radius: 999px;
    border: 1px solid rgba(248,133,51,0.35);
    background: rgba(248,133,51,0.08);
    color: #f88533;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 20px;
    text-transform: uppercase;
`;

const HeroTitle = styled.h1`
    font-size: clamp(32px, 5vw, 52px);
    font-weight: 900;
    line-height: 1.15;
    margin: 0 0 16px;
    letter-spacing: -0.5px;
`;

const GradientText = styled.span`
    background: linear-gradient(90deg, #f88533, #f56a00, #fbbf24, #f88533);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: ${gradientShift} 3s ease infinite;
`;

const HeroSub = styled.p`
    font-size: 15px;
    color: rgba(255,255,255,0.5);
    line-height: 1.7;
    margin: 0 0 32px;
`;

/* ── Toggle ── */
const Toggle = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 12px;
`;

const ToggleLabel = styled.span`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    color: ${({ $active }) => $active ? "#fff" : "rgba(255,255,255,0.38)"};
    transition: color 0.2s;
`;

const ToggleSwitch = styled.div`
    width: 48px;
    height: 26px;
    border-radius: 999px;
    background: ${({ $on }) => $on ? "#f88533" : "rgba(255,255,255,0.15)"};
    position: relative;
    cursor: pointer;
    transition: background 0.25s ease;
    border: 1.5px solid ${({ $on }) => $on ? "#f56a00" : "rgba(255,255,255,0.2)"};
`;

const ToggleCircle = styled.div`
    position: absolute;
    top: 2px;
    left: ${({ $on }) => $on ? "22px" : "2px"};
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: left 0.25s cubic-bezier(0.4,0,0.2,1);
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
`;

const AhorroChip = styled.span`
    background: linear-gradient(90deg, #10b981, #059669);
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 999px;
    letter-spacing: 0.2px;
`;

/* ── Grid de cards ── */
const CardsGrid = styled.div`
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    width: 100%;
    max-width: 1060px;
    padding: 0 24px;
    animation: ${fadeUp} 0.5s 0.1s ease both;

    @media (max-width: 900px) { grid-template-columns: 1fr; max-width: 440px; }
    @media (max-width: 767px) { padding: 0 16px; gap: 16px; }
`;

const PlanCard = styled.div`
    position: relative;
    border-radius: 24px;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    background: ${({ $popular }) => $popular
        ? "linear-gradient(160deg, #1a1000 0%, #140800 100%)"
        : "rgba(255,255,255,0.03)"};
    border: ${({ $popular, $color }) => $popular
        ? `2px solid ${$color}88`
        : "1px solid rgba(255,255,255,0.08)"};
    box-shadow: ${({ $popular, $shadow }) => $popular
        ? `0 0 40px ${$shadow}, 0 20px 60px rgba(0,0,0,0.4)`
        : "0 4px 24px rgba(0,0,0,0.3)"};
    backdrop-filter: blur(16px);
    transition: transform 0.22s ease, box-shadow 0.22s ease;

    ${({ $popular, $shadow }) => $popular && `
        transform: scale(1.03);
        @media (max-width: 900px) { transform: none; }
    `}

    &:hover {
        transform: translateY(-6px) ${({ $popular }) => $popular ? "scale(1.03)" : ""};
        box-shadow: ${({ $shadow }) => `0 12px 48px ${$shadow}, 0 24px 64px rgba(0,0,0,0.45)`};
        @media (max-width: 900px) { transform: translateY(-4px); }
    }
`;

const PopularBadge = styled.div`
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(90deg, #f88533, #f56a00, #fbbf24, #f88533);
    background-size: 200% auto;
    animation: ${shimmer} 2.5s linear infinite;
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    padding: 4px 18px;
    border-radius: 999px;
    white-space: nowrap;
    letter-spacing: 0.3px;
    box-shadow: 0 4px 16px rgba(248,133,51,0.5);
`;

const CardTop = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const PlanEmoji = styled.div`
    font-size: 40px;
    line-height: 1;
    margin-bottom: 4px;
`;

const PlanNombre = styled.h3`
    font-size: 22px;
    font-weight: 900;
    margin: 0;
    color: ${({ $color }) => $color};
    letter-spacing: -0.3px;
`;

const PlanSub = styled.p`
    font-size: 13px;
    color: rgba(255,255,255,0.45);
    margin: 0;
    line-height: 1.4;
`;

const PrecioWrap = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const Precio = styled.div`
    display: flex;
    align-items: baseline;
    gap: 6px;
`;

const PrecioNum = styled.span`
    font-size: 30px;
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.5px;
`;

const PrecioMes = styled.span`
    font-size: 14px;
    color: rgba(255,255,255,0.4);
    font-weight: 600;
`;

const PrecioAnualNote = styled.p`
    font-size: 11px;
    color: rgba(255,255,255,0.35);
    margin: 0;
`;

const BtnPlan = styled.button`
    width: 100%;
    padding: 15px;
    border-radius: 14px;
    border: 2px solid ${({ $colorDark }) => $colorDark};
    background: ${({ $color }) => $color};
    color: #fff;
    font-size: 15px;
    font-weight: 800;
    font-family: "Poppins", sans-serif;
    cursor: pointer;
    letter-spacing: 0.3px;
    box-shadow: ${({ $color }) => `0 6px 20px ${$color}55, 4px 4px 0 ${$color}88`};
    transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
    &:hover  { filter: brightness(1.12); transform: translateY(-2px); }
    &:active { transform: translate(2px,2px); box-shadow: 2px 2px 0 ${({ $colorDark }) => $colorDark}; }
`;

const Divider = styled.div`
    height: 1px;
    background: rgba(255,255,255,0.08);
`;

const FeatureList = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
`;

const FeatureItem = styled.li`
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 500;
    color: ${({ $disabled }) => $disabled ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.82)"};
    text-decoration: ${({ $disabled }) => $disabled ? "line-through" : "none"};
`;

const FeatureIcon = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px; height: 26px;
    border-radius: 7px;
    background: ${({ $color }) => `${$color}22`};
    color: ${({ $color }) => $color};
    font-size: 15px;
    flex-shrink: 0;
`;

const FeatureIconNo = styled(FeatureIcon)`
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.2);
`;

/* ── Trust section ── */
const Trust = styled.section`
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    width: 100%;
    max-width: 1060px;
    padding: 56px 24px 0;
    animation: ${fadeUp} 0.5s 0.2s ease both;

    @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 767px) { padding: 40px 16px 0; gap: 12px; }
`;

const TrustItem = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 20px;
    border-radius: 16px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(8px);
`;

const TrustIcon = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px; height: 40px;
    border-radius: 10px;
    background: rgba(248,133,51,0.12);
    color: #f88533;
    font-size: 20px;
    flex-shrink: 0;
`;

const TrustTxt = styled.p`
    margin: 0;
    font-size: 13px;
    color: rgba(255,255,255,0.6);
    line-height: 1.55;
    b { color: #fff; display: block; font-size: 14px; margin-bottom: 2px; }
`;

/* ── CTA final ── */
const CtaFinal = styled.section`
    position: relative;
    z-index: 1;
    text-align: center;
    padding: 72px 24px 0;
    max-width: 600px;
    animation: ${fadeUp} 0.5s 0.3s ease both;

    @media (max-width: 767px) { padding: 56px 20px 0; }
`;

const CtaTitle = styled.h2`
    font-size: clamp(24px, 4vw, 36px);
    font-weight: 900;
    margin: 0 0 12px;
    letter-spacing: -0.4px;
`;

const CtaSub = styled.p`
    font-size: 15px;
    color: rgba(255,255,255,0.5);
    margin: 0 0 28px;
    line-height: 1.6;
`;

const BtnWhatsapp = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 16px 32px;
    border-radius: 16px;
    border: 2px solid #16a34a;
    background: #16a34a;
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    font-family: "Poppins", sans-serif;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 0 6px 24px rgba(22,163,74,0.4), 4px 4px 0 #15803d;
    transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
    &:hover  { filter: brightness(1.12); transform: translateY(-2px); }
    &:active { transform: translate(2px,2px); box-shadow: 2px 2px 0 #15803d; }
`;

/* ── Footer ── */
const PageFooter = styled.footer`
    position: relative;
    z-index: 1;
    display: flex;
    gap: 24px;
    justify-content: center;
    flex-wrap: wrap;
    padding: 56px 24px 0;
    font-size: 12px;
    color: rgba(255,255,255,0.25);
`;
