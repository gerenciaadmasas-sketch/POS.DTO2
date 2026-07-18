import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/AuthStore";
import { Footer } from "../organismos/Footer";
import { v } from "../../styles/variables";
import { ObtenerEmailPorUsuario } from "../../supabase/crudUsuarios";
import { RiArrowLeftSLine } from "react-icons/ri";

export function LoginTemplate() {
    const { loginEmail } = useAuthStore();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [cargando, setCargando] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleLogin = async (e) => {
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
            await loginEmail({ email: resultado.email, password });
        } catch {
            setErrorMsg("Credenciales incorrectas. Verifica con tu administrador.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <Pagina>
            <Columna>
                <Card>
                    <BtnVolver onClick={() => navigate("/")}>
                        <RiArrowLeftSLine size={18} /> volver
                    </BtnVolver>

                    <Logo>
                        <img src={v.logo} alt="logo" />
                        <span>SaaS<b>.DTO2</b></span>
                    </Logo>

                    <Titulo>Inicia sesión</Titulo>

                    <Form onSubmit={handleLogin}>
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
                </Card>
                <Footer />
            </Columna>
        </Pagina>
    );
}

const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const Pagina = styled.div`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme }) => theme.bgtotal};
    padding: 24px 20px;
`;

const Columna = styled.div`
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const Card = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    animation: ${fadeUp} 0.35s ease both;
`;

const Logo = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    img { width: 32px; height: 32px; object-fit: contain; }
    span {
        font-size: 18px;
        font-weight: 700;
        color: ${({ theme }) => theme.text};
        b { color: #f88533; font-weight: 900; }
    }
`;

const Titulo = styled.h2`
    text-align: center;
    font-size: 22px;
    font-weight: 900;
    color: ${({ theme }) => theme.text};
    margin: 0;
    letter-spacing: -0.3px;
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
    transition: all 0.18s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    &:hover { border-color: #f88533; color: #f88533; background: rgba(248,133,51,0.08); transform: translateX(-2px); }
    &:active { transform: translateX(0); }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const InputField = styled.input`
    width: 100%;
    padding: 15px 18px;
    border-radius: 12px;
    border: 2px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards};
    color: ${({ theme }) => theme.text};
    font-size: 16px;
    font-family: "Poppins", sans-serif;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;
    min-height: 52px;
    &:focus { border-color: #f88533; }
    &::placeholder { color: ${({ theme }) => theme.colorSubtitle}; }
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
    padding: 16px;
    min-height: 54px;
    border-radius: 14px;
    border: 2px solid ${({ disabled }) => disabled ? "#9ca3af" : "#B56B12"};
    background: ${({ disabled }) => disabled ? "#9ca3af" : "#E8891A"};
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    cursor: ${({ disabled }) => disabled ? "not-allowed" : "pointer"};
    letter-spacing: 0.5px;
    font-family: "Poppins", sans-serif;
    box-shadow: ${({ disabled }) => disabled ? "none" : "4px 4px 0 #B56B12"};
    transition: box-shadow 0.1s, transform 0.1s;
    &:active {
        ${({ disabled }) => !disabled && "box-shadow: 2px 2px 0 #B56B12; transform: translate(2px,2px);"}
    }
`;
