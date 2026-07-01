import { useState, useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/AuthStore";
import { Footer } from "../organismos/Footer";
import { v } from "../../styles/variables";
import { ObtenerEmailPorUsuario } from "../../supabase/crudUsuarios";
import {
    RiShoppingCartLine, RiBarChartLine, RiStoreLine,
    RiTeamLine, RiFileListLine, RiArchiveLine,
    RiCloseLine, RiArrowLeftSLine, RiEyeLine, RiEyeOffLine,
} from "react-icons/ri";

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
    const { loginEmail } = useAuthStore();

    /* ── Estado del modal de login ── */
    const [loginOpen, setLoginOpen] = useState(false);
    const [usuario, setUsuario]     = useState("");
    const [password, setPassword]   = useState("");
    const [showPass, setShowPass]   = useState(false);
    const [cargando, setCargando]   = useState(false);
    const [errorMsg, setErrorMsg]   = useState("");

    /* Cerrar con Escape */
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") cerrarLogin(); };
        if (loginOpen) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [loginOpen]);

    /* Bloquear scroll del body cuando el modal está abierto */
    useEffect(() => {
        document.body.style.overflow = loginOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [loginOpen]);

    const abrirLogin = () => {
        setLoginOpen(true);
        setUsuario(""); setPassword(""); setErrorMsg(""); setShowPass(false);
    };

    const cerrarLogin = () => {
        setLoginOpen(false);
        setUsuario(""); setPassword(""); setErrorMsg("");
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!usuario || !password) return;
        setCargando(true);
        setErrorMsg("");
        try {
            const resultado = await ObtenerEmailPorUsuario(usuario.trim());
            if (!resultado?.email) {
                setErrorMsg("Usuario no encontrado. Verifica con tu administrador.");
                return;
            }
            await loginEmail({ email: resultado.email, password });
        } catch (err) {
            const msg = err?.message ?? "";
            if (msg.includes("Invalid login") || msg.includes("invalid_credentials") || msg.includes("Wrong")) {
                setErrorMsg("Contraseña incorrecta. Intenta de nuevo.");
            } else {
                setErrorMsg("Error al iniciar sesión. Verifica tu conexión e intenta de nuevo.");
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <>
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

            {/* ── Zona derecha ── */}
            <AccionesZona>
                {/* Marketing móvil */}
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

                    {/* ── Botón Inicia sesión → abre modal ── */}
                    <BtnNaranja onClick={abrirLogin}>
                        <BtnTexto>
                            <BtnBadge>Inicia sesión</BtnBadge>
                            <BtnDesc>Acceso exclusivo del sistema</BtnDesc>
                        </BtnTexto>
                        <BtnEmoji>👑</BtnEmoji>
                    </BtnNaranja>

                    {/* ── Botón Ver planes ── */}
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

        {/* ══════════════════════════════════════════
            MODAL DE LOGIN
        ══════════════════════════════════════════ */}
        <Overlay $open={loginOpen} onClick={cerrarLogin} />

        <LoginDrawer $open={loginOpen}>
            <DrawerHandle />

            <BtnCerrar onClick={cerrarLogin}>
                <RiCloseLine />
            </BtnCerrar>

            <DrawerLogo>
                <img src={v.logo} alt="logo" />
                <span>POS<b>.DTO2</b></span>
            </DrawerLogo>

            <DrawerTitle>Bienvenido de vuelta</DrawerTitle>
            <DrawerSub>Ingresa tus credenciales para acceder</DrawerSub>

            <LoginForm onSubmit={handleLogin}>
                <InputGroup>
                    <InputLabel>Usuario</InputLabel>
                    <InputField
                        type="text"
                        placeholder="Tu nombre de usuario"
                        value={usuario}
                        onChange={e => setUsuario(e.target.value)}
                        autoComplete="username"
                        autoFocus={loginOpen}
                        required
                    />
                </InputGroup>

                <InputGroup>
                    <InputLabel>Contraseña</InputLabel>
                    <InputWrap>
                        <InputField
                            type={showPass ? "text" : "password"}
                            placeholder="Tu contraseña"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            style={{ paddingRight: "48px" }}
                        />
                        <BtnEye type="button" onClick={() => setShowPass(!showPass)}>
                            {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                        </BtnEye>
                    </InputWrap>
                </InputGroup>

                {errorMsg && <MsgError>{errorMsg}</MsgError>}

                <BtnIngresar type="submit" disabled={cargando || !usuario || !password}>
                    {cargando ? "Ingresando..." : "Ingresar al sistema →"}
                </BtnIngresar>
            </LoginForm>

            <DrawerFootNote>
                ¿Nuevo por acá? <span onClick={() => { cerrarLogin(); navigate("/planes"); }}>Ver planes disponibles</span>
            </DrawerFootNote>
        </LoginDrawer>
        </>
    );
}

/* ═══════════════════════════════════════
   ANIMACIONES
═══════════════════════════════════════ */
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
`;

const slideUp = keyframes`
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
`;

const fadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

const slideRight = keyframes`
    from { transform: translateX(120%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
`;

/* ═══════════════════════════════════════
   LANDING STYLES
═══════════════════════════════════════ */
const Pagina = styled.div`
    min-height: 100vh;
    display: flex;
    background: ${({ theme }) => theme.bgtotal};

    @media (max-width: 768px) { flex-direction: column; }
`;

const Marketing = styled.aside`
    flex: 1;
    background: linear-gradient(145deg, #0d1117 0%, #0f1923 50%, #111827 100%);
    border-right: 1px solid rgba(248,133,51,0.15);
    display: flex; align-items: center; justify-content: center;
    padding: 48px 40px;
    position: relative; overflow: hidden;

    &::before {
        content: '';
        position: absolute; top: -120px; left: -80px;
        width: 400px; height: 400px;
        background: radial-gradient(circle, rgba(248,133,51,0.12) 0%, transparent 70%);
        pointer-events: none;
    }

    @media (max-width: 768px) { display: none; }
`;

const MktInner = styled.div`
    max-width: 420px; width: 100%;
    animation: ${fadeUp} 0.5s ease both;
`;

const MktLogo = styled.div`
    display: flex; align-items: center; gap: 10px; margin-bottom: 28px;
    img { width: 42px; height: 42px; object-fit: contain; }
`;

const MktNombre = styled.span`
    font-size: 26px; font-weight: 900; color: #fff; letter-spacing: -0.5px;
    span { color: #f88533; }
`;

const MktTagline = styled.h1`
    font-size: 28px; font-weight: 900; color: #fff;
    line-height: 1.25; margin: 0 0 12px; letter-spacing: -0.4px;
`;

const MktSub = styled.p`
    font-size: 14px; color: rgba(255,255,255,0.55);
    line-height: 1.6; margin: 0 0 32px;
`;

const MktFeatures = styled.div`
    display: flex; flex-direction: column; gap: 14px; margin-bottom: 36px;
`;

const MktFeatureRow = styled.div`
    display: flex; align-items: center; gap: 12px;
    font-size: 14px; color: rgba(255,255,255,0.82); font-weight: 500;
`;

const MktIcon = styled.span`
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 8px;
    background: rgba(248,133,51,0.15); color: #f88533; font-size: 16px; flex-shrink: 0;
`;

const MktBadge = styled.div`
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 999px;
    border: 1px solid rgba(248,133,51,0.35);
    background: rgba(248,133,51,0.08); color: #f88533;
    font-size: 12px; font-weight: 700; letter-spacing: 0.3px;
    background-size: 200% auto;
    animation: ${shimmer} 3s linear infinite;
`;

/* ── Marketing móvil ── */
const MktMobile = styled.div`
    display: none;
    @media (max-width: 768px) {
        display: flex; flex-direction: column; align-items: center; gap: 16px;
        width: 100%;
        background: linear-gradient(160deg, #0d1117 0%, #0f1923 55%, #111827 100%);
        padding: 36px 24px 28px;
        border-bottom: 1px solid rgba(248,133,51,0.18);
        position: relative; overflow: hidden;
        &::before {
            content: ''; position: absolute; top: -60px; right: -40px;
            width: 220px; height: 220px;
            background: radial-gradient(circle, rgba(248,133,51,0.13) 0%, transparent 70%);
            pointer-events: none;
        }
    }
`;

const MktMobileLogo = styled.div`
    display: flex; align-items: center; gap: 8px;
    img { width: 36px; height: 36px; object-fit: contain; }
    span { font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -0.4px; b { color: #f88533; } }
`;

const MktMobileTagline = styled.p`
    font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.88);
    text-align: center; margin: 0; line-height: 1.4;
`;

const MktMobileGrid = styled.div`
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%;
`;

const MktMobileFeature = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: rgba(255,255,255,0.78); font-weight: 500; line-height: 1.3;
`;

/* ── Zona derecha ── */
const AccionesZona = styled.div`
    width: 420px; flex-shrink: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 32px 24px 16px; gap: 16px;

    @media (max-width: 768px) {
        width: 100%; min-height: auto;
        padding: 0 0 16px;
        justify-content: flex-start; align-items: stretch; gap: 0;
    }
`;

const Card = styled.div`
    width: 100%; max-width: 380px;
    display: flex; flex-direction: column; gap: 20px;
    animation: ${fadeUp} 0.35s ease both;

    @media (max-width: 768px) { max-width: 100%; padding: 28px 20px 20px; }
`;

const CtaLogo = styled.div`
    display: flex; align-items: center; justify-content: center; gap: 8px;
    img { width: 30px; height: 30px; object-fit: contain; }
    span { font-size: 16px; font-weight: 700; color: ${({ theme }) => theme.text}; b { color: #f88533; font-weight: 900; } }
    @media (max-width: 768px) { display: none; }
`;

const CtaTexto = styled.p`
    text-align: center; font-size: 13px;
    color: ${({ theme }) => theme.colorSubtitle}; margin: 0;
    @media (max-width: 768px) { display: none; }
`;

/* ── Botones de la landing ── */
const BtnBase = styled.button`
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px; border-radius: 18px;
    cursor: pointer; width: 100%;
    transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
    &:active { transform: translate(2px,2px); }
`;

const BtnNaranja = styled(BtnBase)`
    border: 2px solid #F5A14299; background: #E8891A;
    box-shadow: 0 4px 20px rgba(232,137,26,0.25), 4px 4px 0 #B56B12;
    &:hover { transform: translateY(-2px); filter: brightness(1.08); box-shadow: 0 8px 28px rgba(232,137,26,0.4), 4px 4px 0 #B56B12; }
    &:active { box-shadow: 2px 2px 0 #B56B12; }
`;

const BtnAzul = styled(BtnBase)`
    border: 2px solid rgba(96,165,250,0.55); background: #1D4ED8;
    box-shadow: 0 4px 20px rgba(29,78,216,0.28), 4px 4px 0 #1E3A8A;
    &:hover { transform: translateY(-2px); filter: brightness(1.08); box-shadow: 0 8px 28px rgba(29,78,216,0.4), 4px 4px 0 #1E3A8A; }
    &:active { box-shadow: 2px 2px 0 #1E3A8A; }
`;

const BtnTexto = styled.div`
    display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
`;

const BtnBadge = styled.span`
    background: rgba(255,255,255,0.22); color: #fff;
    font-size: 16px; font-weight: 800; padding: 3px 14px;
    border-radius: 20px; letter-spacing: 0.2px;
`;

const BtnBadgeAzul = styled(BtnBadge)`
    background: rgba(255,255,255,0.18);
`;

const BtnDesc = styled.span`
    color: rgba(255,255,255,0.78); font-size: 13px; font-weight: 500; padding-left: 4px;
`;

const BtnEmoji = styled.span`
    font-size: 48px; line-height: 1;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
`;

/* ═══════════════════════════════════════
   MODAL DE LOGIN
═══════════════════════════════════════ */
const Overlay = styled.div`
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(6px);
    z-index: 300;
    pointer-events: ${({ $open }) => $open ? "all" : "none"};
    opacity: ${({ $open }) => $open ? 1 : 0};
    transition: opacity 0.3s ease;
`;

const LoginDrawer = styled.div`
    position: fixed;
    z-index: 301;
    background: ${({ theme }) => theme.bgcards};
    display: flex; flex-direction: column; gap: 18px;

    /* Desktop: panel lateral derecho */
    @media (min-width: 769px) {
        top: 0; right: 0; bottom: 0;
        width: 420px;
        padding: 40px 36px;
        border-left: 1px solid ${({ theme }) => theme.color2};
        box-shadow: -12px 0 48px rgba(0,0,0,0.4);
        transform: ${({ $open }) => $open ? "translateX(0)" : "translateX(100%)"};
        opacity: ${({ $open }) => $open ? 1 : 0};
        transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease;
        overflow-y: auto;
    }

    /* Móvil: drawer desde abajo */
    @media (max-width: 768px) {
        left: 0; right: 0; bottom: 0;
        border-radius: 28px 28px 0 0;
        padding: 12px 24px 40px;
        border-top: 1px solid ${({ theme }) => theme.color2};
        box-shadow: 0 -12px 48px rgba(0,0,0,0.4);
        transform: ${({ $open }) => $open ? "translateY(0)" : "translateY(100%)"};
        opacity: ${({ $open }) => $open ? 1 : 0};
        transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease;
        max-height: 92vh; overflow-y: auto;
    }
`;

const DrawerHandle = styled.div`
    width: 40px; height: 4px; border-radius: 999px;
    background: ${({ theme }) => theme.color2};
    align-self: center; margin-bottom: 4px;
    @media (min-width: 769px) { display: none; }
`;

const BtnCerrar = styled.button`
    position: absolute; top: 16px; right: 16px;
    width: 36px; height: 36px; border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text}; font-size: 20px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s;
    &:hover { border-color: #f88533; color: #f88533; }
`;

const DrawerLogo = styled.div`
    display: flex; align-items: center; gap: 8px; margin-top: 8px;
    img { width: 28px; height: 28px; object-fit: contain; }
    span { font-size: 16px; font-weight: 900; color: ${({ theme }) => theme.text}; b { color: #f88533; } }
`;

const DrawerTitle = styled.h2`
    font-size: 22px; font-weight: 900; margin: 0;
    color: ${({ theme }) => theme.text}; letter-spacing: -0.3px;
`;

const DrawerSub = styled.p`
    font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard};
    margin: -8px 0 0; line-height: 1.5;
`;

const LoginForm = styled.form`
    display: flex; flex-direction: column; gap: 14px;
`;

const InputGroup = styled.div`
    display: flex; flex-direction: column; gap: 6px;
`;

const InputLabel = styled.label`
    font-size: 12px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.4px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const InputWrap = styled.div`
    position: relative;
`;

const InputField = styled.input`
    width: 100%; padding: 14px 16px; border-radius: 12px;
    border: 2px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 16px; font-family: "Poppins", sans-serif;
    outline: none; box-sizing: border-box;
    transition: border-color 0.2s;
    min-height: 52px;
    &:focus { border-color: #f88533; }
    &::placeholder { color: ${({ theme }) => theme.colorsubtitlecard}; }
`;

const BtnEye = styled.button`
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: ${({ theme }) => theme.colorsubtitlecard}; font-size: 20px;
    display: flex; align-items: center;
    transition: color 0.15s;
    &:hover { color: #f88533; }
`;

const MsgError = styled.p`
    color: #dc2626; font-size: 13px; font-weight: 600;
    text-align: center; margin: 0;
    background: #fef2f2; padding: 10px 14px; border-radius: 10px;
    border: 1px solid #fecaca;
`;

const BtnIngresar = styled.button`
    width: 100%; padding: 16px;
    min-height: 54px; border-radius: 14px;
    border: 2px solid ${({ disabled }) => disabled ? "#9ca3af" : "#B56B12"};
    background: ${({ disabled }) => disabled ? "#9ca3af" : "#E8891A"};
    color: #fff; font-size: 16px; font-weight: 800;
    cursor: ${({ disabled }) => disabled ? "not-allowed" : "pointer"};
    font-family: "Poppins", sans-serif;
    box-shadow: ${({ disabled }) => disabled ? "none" : "4px 4px 0 #B56B12"};
    transition: box-shadow 0.1s, transform 0.1s, filter 0.1s;
    &:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
    &:active:not(:disabled) { box-shadow: 2px 2px 0 #B56B12; transform: translate(2px,2px); }
`;

const DrawerFootNote = styled.p`
    font-size: 13px; text-align: center;
    color: ${({ theme }) => theme.colorsubtitlecard}; margin: 0;
    span { color: #f88533; font-weight: 700; cursor: pointer; &:hover { text-decoration: underline; } }
`;
