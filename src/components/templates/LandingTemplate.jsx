import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { Footer } from "../organismos/Footer";
import { v } from "../../styles/variables";
import { RiShoppingCartLine, RiBarChartLine, RiStoreLine, RiTeamLine, RiFileListLine, RiArchiveLine } from "react-icons/ri";

const features = [
    { icon: <RiShoppingCartLine />, texto: "Ventas rápidas desde el POS" },
    { icon: <RiArchiveLine />,      texto: "Inventario y múltiples almacenes" },
    { icon: <RiBarChartLine />,     texto: "Reportes en tiempo real" },
    { icon: <RiTeamLine />,         texto: "Cajeros, supervisores y admin" },
    { icon: <RiFileListLine />,     texto: "Kardex y trazabilidad completa" },
    { icon: <RiStoreLine />,        texto: "Multi-sucursal y multi-empresa" },
];

export function LandingTemplate() {
    const navigate = useNavigate();

    return (
        <Pagina>
            {/* ── Marketing desktop (columna izquierda) ── */}
            <Marketing>
                <MktInner>
                    <MktLogo>
                        <img src={v.logo} alt="logo" />
                        <MktNombre>POS<span>.DTO2</span></MktNombre>
                    </MktLogo>
                    <MktTagline>El sistema de punto de venta que impulsa tu negocio</MktTagline>
                    <MktSub>Gestiona ventas, inventario y reportes desde cualquier dispositivo, en tiempo real.</MktSub>
                    <MktFeatures>
                        {features.map((f, i) => (
                            <MktFeatureRow key={i}>
                                <MktIcon>{f.icon}</MktIcon>
                                <span>{f.texto}</span>
                            </MktFeatureRow>
                        ))}
                    </MktFeatures>
                    <MktBadge>✦ Publicado y en producción</MktBadge>
                </MktInner>
            </Marketing>

            {/* ── Zona de acciones (derecha) ── */}
            <AccionesZona>

                {/* ── Marketing móvil ── */}
                <MktMobile>
                    <MktMobileLogo>
                        <img src={v.logo} alt="logo" />
                        <span>POS<b>.DTO2</b></span>
                    </MktMobileLogo>
                    <MktMobileTagline>El punto de venta que impulsa tu negocio</MktMobileTagline>
                    <MktMobileGrid>
                        {features.map((f, i) => (
                            <MktMobileFeature key={i}>
                                <MktIcon>{f.icon}</MktIcon>
                                <span>{f.texto}</span>
                            </MktMobileFeature>
                        ))}
                    </MktMobileGrid>
                    <MktBadge>✦ Publicado y en producción</MktBadge>
                </MktMobile>

                <Card>
                    <CtaLogo>
                        <img src={v.logo} alt="logo" />
                        <span>POS<b>.DTO2</b></span>
                    </CtaLogo>
                    <CtaTexto>Bienvenido al sistema de gestión</CtaTexto>

                    <BtnNaranja onClick={() => navigate("/login")}>
                        <BtnTexto>
                            <BtnBadge>Inicia sesión</BtnBadge>
                            <BtnDesc>Acceso exclusivo del sistema</BtnDesc>
                        </BtnTexto>
                        <BtnEmoji>👑</BtnEmoji>
                    </BtnNaranja>

                    <BtnAzul onClick={() => navigate("/planes")}>
                        <BtnTexto>
                            <BtnBadgeAzul>Ver planes</BtnBadgeAzul>
                            <BtnDesc>Elige el plan ideal para tu negocio</BtnDesc>
                        </BtnTexto>
                        <BtnEmoji>🚀</BtnEmoji>
                    </BtnAzul>
                </Card>

                <Footer />
            </AccionesZona>
        </Pagina>
    );
}

/* ── Animaciones ── */
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
`;

/* ── Layout ── */
const Pagina = styled.div`
    min-height: 100vh;
    display: flex;
    background: ${({ theme }) => theme.bgtotal};

    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

/* ── Marketing desktop ── */
const Marketing = styled.aside`
    flex: 1;
    background: linear-gradient(145deg, #0d1117 0%, #0f1923 50%, #111827 100%);
    border-right: 1px solid rgba(248,133,51,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 40px;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: -120px; left: -80px;
        width: 400px; height: 400px;
        background: radial-gradient(circle, rgba(248,133,51,0.12) 0%, transparent 70%);
        pointer-events: none;
    }

    @media (max-width: 768px) { display: none; }
`;

const MktInner = styled.div`
    max-width: 420px;
    width: 100%;
    animation: ${fadeUp} 0.5s ease both;
`;

const MktLogo = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
    img { width: 42px; height: 42px; object-fit: contain; }
`;

const MktNombre = styled.span`
    font-size: 26px;
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.5px;
    span { color: #f88533; }
`;

const MktTagline = styled.h1`
    font-size: 28px;
    font-weight: 900;
    color: #fff;
    line-height: 1.25;
    margin: 0 0 12px;
    letter-spacing: -0.4px;
`;

const MktSub = styled.p`
    font-size: 14px;
    color: rgba(255,255,255,0.55);
    line-height: 1.6;
    margin: 0 0 32px;
`;

const MktFeatures = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 36px;
`;

const MktFeatureRow = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: rgba(255,255,255,0.82);
    font-weight: 500;
`;

const MktIcon = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px; height: 32px;
    border-radius: 8px;
    background: rgba(248,133,51,0.15);
    color: #f88533;
    font-size: 16px;
    flex-shrink: 0;
`;

const MktBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(248,133,51,0.35);
    background: rgba(248,133,51,0.08);
    color: #f88533;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.3px;
    background-size: 200% auto;
    animation: ${shimmer} 3s linear infinite;
`;

/* ── Marketing móvil ── */
const MktMobile = styled.div`
    display: none;

    @media (max-width: 768px) {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        width: 100%;
        background: linear-gradient(160deg, #0d1117 0%, #0f1923 55%, #111827 100%);
        padding: 36px 24px 28px;
        border-bottom: 1px solid rgba(248,133,51,0.18);
        position: relative;
        overflow: hidden;

        &::before {
            content: '';
            position: absolute;
            top: -60px; right: -40px;
            width: 220px; height: 220px;
            background: radial-gradient(circle, rgba(248,133,51,0.13) 0%, transparent 70%);
            pointer-events: none;
        }
    }
`;

const MktMobileLogo = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    img { width: 36px; height: 36px; object-fit: contain; }
    span {
        font-size: 22px;
        font-weight: 900;
        color: #fff;
        letter-spacing: -0.4px;
        b { color: #f88533; }
    }
`;

const MktMobileTagline = styled.p`
    font-size: 15px;
    font-weight: 700;
    color: rgba(255,255,255,0.88);
    text-align: center;
    margin: 0;
    line-height: 1.4;
`;

const MktMobileGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
`;

const MktMobileFeature = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: rgba(255,255,255,0.78);
    font-weight: 500;
    line-height: 1.3;
`;

/* ── Zona acciones (derecha) ── */
const AccionesZona = styled.div`
    width: 420px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 24px 16px;
    gap: 16px;

    @media (max-width: 768px) {
        width: 100%;
        min-height: 100vh;
        padding: 0 0 16px;
        justify-content: flex-start;
        align-items: stretch;
        gap: 0;
    }
`;

const Card = styled.div`
    width: 100%;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    animation: ${fadeUp} 0.35s ease both;

    @media (max-width: 768px) {
        max-width: 100%;
        padding: 28px 20px 20px;
    }
`;

const CtaLogo = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    img { width: 30px; height: 30px; object-fit: contain; }
    span {
        font-size: 16px;
        font-weight: 700;
        color: ${({ theme }) => theme.text};
        b { color: #f88533; font-weight: 900; }
    }

    @media (max-width: 768px) { display: none; }
`;

const CtaTexto = styled.p`
    text-align: center;
    font-size: 13px;
    color: ${({ theme }) => theme.colorSubtitle};
    margin: 0;

    @media (max-width: 768px) { display: none; }
`;

/* ── Botones ── */
const BtnBase = styled.button`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-radius: 18px;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    width: 100%;

    &:active { transform: translate(2px, 2px); }
`;

const BtnNaranja = styled(BtnBase)`
    border: 2px solid #F5A14299;
    background: #E8891A;
    box-shadow: 0 4px 20px rgba(232,137,26,0.25), 4px 4px 0 #B56B12;

    &:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(232,137,26,0.35), 4px 4px 0 #B56B12; }
    &:active { box-shadow: 2px 2px 0 #B56B12; }
`;

const BtnAzul = styled(BtnBase)`
    border: 2px solid rgba(96,165,250,0.55);
    background: #1D4ED8;
    box-shadow: 0 4px 20px rgba(29,78,216,0.28), 4px 4px 0 #1E3A8A;

    &:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(29,78,216,0.4), 4px 4px 0 #1E3A8A; }
    &:active { box-shadow: 2px 2px 0 #1E3A8A; }
`;

const BtnTexto = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
`;

const BtnBadge = styled.span`
    background: rgba(255,255,255,0.22);
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    padding: 3px 14px;
    border-radius: 20px;
    letter-spacing: 0.2px;
`;

const BtnBadgeAzul = styled(BtnBadge)`
    background: rgba(255,255,255,0.18);
`;

const BtnDesc = styled.span`
    color: rgba(255,255,255,0.78);
    font-size: 13px;
    font-weight: 500;
    padding-left: 4px;
`;

const BtnEmoji = styled.span`
    font-size: 48px;
    line-height: 1;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
`;
