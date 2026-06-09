import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useAuthStore } from "../../store/AuthStore";
import { Footer } from "../organismos/Footer";
import { v } from "../../styles/variables";
import { ObtenerEmailPorUsuario } from "../../supabase/crudUsuarios";
import { RiArrowLeftSLine } from "react-icons/ri";

const modos = [
    {
        key: "superadmin",
        titulo: "Super admin",
        desc: "acceso exclusivo del sistema",
        emoji: "👑",
        bg: "#E8891A",
        shadow: "#B56B12",
        border: "#F5A14299",
    },
    {
        key: "administrador",
        titulo: "Administrador",
        desc: "gestiona tu negocio",
        emoji: "😎",
        bg: "#0f3460",
        shadow: "#081f3f",
        border: "#1a5276aa",
    },
    {
        key: "supervisor",
        titulo: "Supervisor",
        desc: "supervisa y gestiona",
        emoji: "🔍",
        bg: "#2d2d2d",
        shadow: "#111111",
        border: "#55555599",
    },
    {
        key: "cajero",
        titulo: "Cajero",
        desc: "vende y cobra",
        emoji: "🧾",
        bg: "#1C1108",
        shadow: "#0A0603",
        border: "#5c3d1e99",
    },
];

export function LoginTemplate() {
    const { loginEmail } = useAuthStore();
    const [modo, setModo] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [cargando, setCargando] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const TIPO_POR_MODO = {
        cajero:        "cajero",
        supervisor:    "supervisor",
        administrador: "administrador",
        superadmin:    "superadmin",
    };

    const LABEL_POR_MODO = {
        cajero:        "cajeros",
        supervisor:    "supervisores",
        administrador: "administradores",
        superadmin:    "super admins",
    };

    const handleLoginEmail = async (e) => {
        e.preventDefault();
        if (!email || !password) return;
        setCargando(true);
        setErrorMsg("");
        try {
            const resultado = await ObtenerEmailPorUsuario(email.trim());
            if (!resultado || !resultado.email) {
                setErrorMsg("Usuario no encontrado. Verifica con tu administrador.");
                return;
            }
            const tipoEsperado = TIPO_POR_MODO[modo];
            if (resultado.tipo !== tipoEsperado) {
                setErrorMsg(`Este acceso es solo para ${LABEL_POR_MODO[modo]}.`);
                return;
            }
            await loginEmail({ email: resultado.email, password });
        } catch (err) {
            setErrorMsg("Credenciales incorrectas. Verifica con tu administrador.");
        } finally {
            setCargando(false);
        }
    };

    const volverAModo = () => {
        setModo(null);
        setEmail("");
        setPassword("");
        setErrorMsg("");
    };

    return (
        <Fondo>
            <Tarjeta>
                {modo === null ? (
                    <PanelSeleccion>
                        <Logo>
                            <img src={v.logo} alt="logo" />
                            <span>POS DL v1</span>
                        </Logo>
                        <Titulo>Ingresar Modo</Titulo>
                        {modos.map((m) => (
                            <CardModo
                                key={m.key}
                                $bg={m.bg}
                                $shadow={m.shadow}
                                $border={m.border}
                                onClick={() => setModo(m.key)}
                            >
                                <CardTexto>
                                    <CardBadge>{m.titulo}</CardBadge>
                                    <CardDesc>{m.desc}</CardDesc>
                                </CardTexto>
                                <CardEmoji>{m.emoji}</CardEmoji>
                            </CardModo>
                        ))}
                    </PanelSeleccion>
                ) : modo === "superadmin" ? (
                    <PanelLogin key="superadmin">
                        <BtnVolver onClick={volverAModo}><RiArrowLeftSLine size={18} /> volver</BtnVolver>
                        <Logo>
                            <img src={v.logo} alt="logo" />
                            <span>POS DL v1</span>
                        </Logo>
                        <BadgeModoActivo $color="#C8720F">👑 Super admin</BadgeModoActivo>
                        <Form onSubmit={handleLoginEmail}>
                            <InputField
                                type="text"
                                placeholder="Usuario"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                                required
                            />
                            <InputField
                                type="password"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {errorMsg && <MsgError>{errorMsg}</MsgError>}
                            <BtnIngresar type="submit" disabled={cargando || !email || !password} $gold>
                                {cargando ? "Ingresando..." : "Ingresar"}
                            </BtnIngresar>
                        </Form>
                    </PanelLogin>
                ) : (
                    <PanelLogin key={modo}>
                        <BtnVolver onClick={volverAModo}><RiArrowLeftSLine size={18} /> volver</BtnVolver>
                        <Logo>
                            <img src={v.logo} alt="logo" />
                            <span>POS DL v1</span>
                        </Logo>
                        <BadgeModoActivo $color={
                            modo === "supervisor"    ? "#aaa"    :
                            modo === "administrador" ? "#60a5fa" :
                            "#f88533"
                        }>
                            {modos.find(m => m.key === modo)?.emoji} {modos.find(m => m.key === modo)?.titulo}
                        </BadgeModoActivo>
                        <Form onSubmit={handleLoginEmail}>
                            <InputField
                                type="text"
                                placeholder="Usuario"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                                required
                            />
                            <InputField
                                type="password"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {errorMsg && <MsgError>{errorMsg}</MsgError>}
                            <BtnIngresar type="submit" disabled={cargando || !email || !password} $gray={modo === "supervisor"} $blue={modo === "administrador"}>
                                {cargando ? "Ingresando..." : "Ingresar"}
                            </BtnIngresar>
                        </Form>
                    </PanelLogin>
                )}
            </Tarjeta>
            <Footer />
        </Fondo>
    );
}

/* ── Animaciones ───────────────────────────── */
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
`;

/* ── Layout base ───────────────────────────── */
const Fondo = styled.div`
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    gap: 16px;
`;

const Tarjeta = styled.div`
    width: 100%;
    max-width: 420px;
    animation: ${fadeUp} 0.35s ease both;
`;

/* ── Logo ──────────────────────────────────── */
const Logo = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 6px;
    img {
        width: 32px;
        height: 32px;
        object-fit: contain;
    }
    span {
        font-weight: 800;
        font-size: 15px;
        color: ${({ theme }) => theme.text};
        letter-spacing: 0.3px;
    }
`;

/* ── Panel selección de modo ───────────────── */
const PanelSeleccion = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const Titulo = styled.h2`
    text-align: center;
    font-size: 26px;
    font-weight: 900;
    color: ${({ theme }) => theme.text};
    margin: 0 0 4px;
    letter-spacing: -0.3px;
`;

const CardModo = styled.button`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px;
    border-radius: 16px;
    border: 2px solid ${({ $border }) => $border};
    background: ${({ $bg }) => $bg};
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 18px rgba(0,0,0,0.18), 4px 4px 0 ${({ $shadow }) => $shadow};
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.22), 4px 4px 0 ${({ $shadow }) => $shadow};
    }
    &:active {
        transform: translate(2px, 2px);
        box-shadow: 2px 2px 0 ${({ $shadow }) => $shadow};
    }
`;

const CardTexto = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
`;

const CardBadge = styled.span`
    background: rgba(255,255,255,0.22);
    color: #fff;
    font-size: 15px;
    font-weight: 800;
    padding: 3px 12px;
    border-radius: 20px;
    letter-spacing: 0.2px;
`;

const CardDesc = styled.span`
    color: rgba(255,255,255,0.75);
    font-size: 13px;
    font-weight: 500;
    padding-left: 4px;
`;

const CardEmoji = styled.span`
    font-size: 46px;
    line-height: 1;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
`;

/* ── Panel login ───────────────────────────── */
const PanelLogin = styled.div`
    display: flex;
    flex-direction: column;
    gap: 18px;
    animation: ${fadeUp} 0.3s ease both;
`;

const BtnVolver = styled.button`
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 7px 14px 7px 10px;
    border-radius: 999px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards};
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 13px;
    font-weight: 700;
    font-family: "Poppins", sans-serif;
    cursor: pointer;
    letter-spacing: 0.2px;
    transition: all 0.18s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    &:hover {
        border-color: #f88533;
        color: #f88533;
        background: rgba(248,133,51,0.08);
        transform: translateX(-2px);
        box-shadow: 0 4px 14px rgba(248,133,51,0.15);
    }
    &:active { transform: translateX(0); }
`;

const BadgeModoActivo = styled.div`
    text-align: center;
    padding: 10px 0 2px;
    font-size: 20px;
    font-weight: 900;
    color: ${({ $color }) => $color};
    letter-spacing: 0.3px;
`;


/* ── Formulario empleado ───────────────────── */
const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const InputField = styled.input`
    width: 100%;
    padding: 13px 16px;
    border-radius: 12px;
    border: 2px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards};
    color: ${({ theme }) => theme.text};
    font-size: 15px;
    font-family: "Poppins", sans-serif;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;
    &:focus { border-color: #f88533; }
    &::placeholder { color: ${({ theme }) => theme.colorSubtitle}; }
    &::-ms-reveal { filter: invert(1); }
`;

const MsgError = styled.p`
    color: #dc2626;
    font-size: 13px;
    font-weight: 600;
    text-align: center;
    margin: 0;
    background: #fef2f2;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #fecaca;
`;

const BtnIngresar = styled.button`
    width: 100%;
    padding: 14px;
    border-radius: 14px;
    border: 2px solid ${({ disabled, $gold, $gray, $blue }) =>
        disabled ? "#9ca3af" : $gold ? "#B56B12" : $blue ? "#1e40af" : $gray ? "#111" : "#0A0603"};
    background: ${({ disabled, $gold, $gray, $blue }) =>
        disabled ? "#9ca3af" : $gold ? "#E8891A" : $blue ? "#1d4ed8" : $gray ? "#2d2d2d" : "#1C1108"};
    color: #fff;
    font-size: 15px;
    font-weight: 800;
    cursor: ${({ disabled }) => disabled ? "not-allowed" : "pointer"};
    letter-spacing: 0.5px;
    box-shadow: ${({ disabled, $gold, $gray, $blue }) =>
        disabled ? "none" : $gold ? "4px 4px 0 #B56B12" : $blue ? "4px 4px 0 #1e40af" : $gray ? "4px 4px 0 #111" : "4px 4px 0 #0A0603"};
    transition: box-shadow 0.1s, transform 0.1s;
    &:active {
        ${({ disabled, $gold, $gray, $blue }) => !disabled && (
            $gold ? "box-shadow: 2px 2px 0 #B56B12; transform: translate(2px, 2px);" :
            $blue ? "box-shadow: 2px 2px 0 #1e40af; transform: translate(2px, 2px);" :
            $gray ? "box-shadow: 2px 2px 0 #111; transform: translate(2px, 2px);" :
                    "box-shadow: 2px 2px 0 #0A0603; transform: translate(2px, 2px);"
        )}
    }
`;

