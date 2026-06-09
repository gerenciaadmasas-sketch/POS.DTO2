import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useAuthStore } from "../../store/AuthStore";
import { Footer } from "../organismos/Footer";
import { v } from "../../styles/variables";
import { ObtenerEmailPorUsuario } from "../../supabase/crudUsuarios";

const modos = [
    {
        key: "superadmin",
        titulo: "Super admin",
        desc: "crea y gestiona tu empresa",
        emoji: "👑",
        bg: "#E8891A",
        shadow: "#B56B12",
        border: "#F5A14299",
    },
    {
        key: "empleado",
        titulo: "Empleado",
        desc: "vende y crece",
        emoji: "🪖",
        bg: "#1C1108",
        shadow: "#0A0603",
        border: "#5c3d1e99",
    },
];

export function LoginTemplate() {
    const { loginGoogle, loginEmail } = useAuthStore();
    const [modo, setModo] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [cargando, setCargando] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleLoginEmail = async (e) => {
        e.preventDefault();
        if (!email || !password) return;
        setCargando(true);
        setErrorMsg("");
        try {
            const realEmail = await ObtenerEmailPorUsuario(email.trim());
            if (!realEmail) {
                setErrorMsg("Usuario no encontrado. Verifica con tu administrador.");
                return;
            }
            await loginEmail({ email: realEmail, password });
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
                        <BtnVolver onClick={volverAModo}>← volver</BtnVolver>
                        <Logo>
                            <img src={v.logo} alt="logo" />
                            <span>POS DL v1</span>
                        </Logo>
                        <BadgeModoActivo $color="#C8720F">👑 Super admin</BadgeModoActivo>
                        <BtnGoogle onClick={loginGoogle}>
                            <v.iconogoogle size={22} />
                            <span>Continuar con Google</span>
                        </BtnGoogle>
                    </PanelLogin>
                ) : (
                    <PanelLogin key="empleado">
                        <BtnVolver onClick={volverAModo}>← volver</BtnVolver>
                        <Logo>
                            <img src={v.logo} alt="logo" />
                            <span>POS DL v1</span>
                        </Logo>
                        <BadgeModoActivo $color="#3a2010">🪖 Empleado</BadgeModoActivo>
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
                            <BtnIngresar type="submit" disabled={cargando || !email || !password}>
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
    background: #e8eaed;
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
        color: #222;
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
    color: #111;
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
    background: none;
    border: none;
    color: #555;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    &:hover { color: #111; }
`;

const BadgeModoActivo = styled.div`
    text-align: center;
    padding: 10px 0 2px;
    font-size: 20px;
    font-weight: 900;
    color: ${({ $color }) => $color};
    letter-spacing: 0.3px;
`;

const BtnGoogle = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 14px;
    border-radius: 14px;
    border: 2px solid #d1d5db;
    background: #fff;
    color: #222;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08), 4px 4px 0 #d1d5db;
    transition: box-shadow 0.1s, transform 0.1s;
    &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12), 4px 4px 0 #d1d5db; }
    &:active { box-shadow: 2px 2px 0 #d1d5db; transform: translate(2px, 2px); }
    span { font-family: "Poppins", sans-serif; }
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
    border: 2px solid #d1d5db;
    background: #fff;
    color: #111;
    font-size: 15px;
    font-family: "Poppins", sans-serif;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;
    &:focus { border-color: #1C1108; }
    &::placeholder { color: #9ca3af; }
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
    border: 2px solid #0A0603;
    background: ${({ disabled }) => disabled ? "#9ca3af" : "#1C1108"};
    color: #fff;
    font-size: 15px;
    font-weight: 800;
    cursor: ${({ disabled }) => disabled ? "not-allowed" : "pointer"};
    letter-spacing: 0.5px;
    box-shadow: ${({ disabled }) => disabled ? "none" : "4px 4px 0 #0A0603"};
    transition: box-shadow 0.1s, transform 0.1s;
    &:active {
        ${({ disabled }) => !disabled && "box-shadow: 2px 2px 0 #0A0603; transform: translate(2px, 2px);"}
    }
`;
