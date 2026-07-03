import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { supabase } from "../../supabase/supabase.config";
import { v } from "../../styles/variables";
import {
    RiCheckboxCircleFill, RiCloseCircleFill, RiLoader4Line,
    RiUserLine, RiLockLine, RiLoginBoxLine, RiWhatsappLine,
} from "react-icons/ri";

const MAX_ESPERA_MS  = 60_000; // 60 segundos de polling
const INTERVALO_MS   = 3_000;  // cada 3 segundos

export function PagoExitosoTemplate() {
    const [params]   = useSearchParams();
    const navigate   = useNavigate();
    const status     = params.get("status");     // APPROVED / DECLINED / ERROR / VOIDED
    const reference  = params.get("reference");  // POS-xxx-xxxx

    const aprobado   = status === "APPROVED";
    const rechazado  = status === "DECLINED" || status === "VOIDED";
    const errorPago  = status === "ERROR" || (!aprobado && !rechazado);

    const [fase, setFase]       = useState(aprobado ? "creando" : "listo"); // creando | listo | timeout
    const [credenciales, setCredenciales] = useState(null);
    const [copiado, setCopiado]   = useState(null);

    // Polling para esperar que el webhook cree la cuenta
    useEffect(() => {
        if (!aprobado || !reference) return;

        let intentos = 0;
        const maxIntentos = Math.ceil(MAX_ESPERA_MS / INTERVALO_MS);

        const interval = setInterval(async () => {
            intentos++;
            const { data } = await supabase
                .from("wompi_transacciones_pendientes")
                .select("estado, usuario_admin, password_admin")
                .eq("reference", reference)
                .maybeSingle();

            if (data?.estado === "procesado" && data.usuario_admin) {
                clearInterval(interval);
                setCredenciales({ usuario: data.usuario_admin, password: data.password_admin });
                setFase("listo");
            } else if (data?.estado === "fallido") {
                clearInterval(interval);
                setFase("fallido_webhook");
            } else if (intentos >= maxIntentos) {
                clearInterval(interval);
                setFase("timeout");
            }
        }, INTERVALO_MS);

        return () => clearInterval(interval);
    }, [aprobado, reference]);

    const copiar = async (texto, clave) => {
        await navigator.clipboard.writeText(texto);
        setCopiado(clave);
        setTimeout(() => setCopiado(null), 2000);
    };

    return (
        <Pagina>
            <BgOrb $x="-10%" $y="-5%"  $size="500px" $color="rgba(248,133,51,0.12)" $dur="9s" />
            <BgOrb $x="70%"  $y="60%"  $size="400px" $color="rgba(52,211,153,0.10)" $dur="11s" $delay="2s" />
            <BgLines />

            <Wrap>
                {/* Logo */}
                <Logo onClick={() => navigate("/")}>
                    <img src={v.logo} alt="logo" />
                    <span>POS<b>.DTO2</b></span>
                </Logo>

                {/* ── APROBADO: creando cuenta ── */}
                {aprobado && fase === "creando" && (
                    <Card>
                        <SpinIcon />
                        <Titulo>Activando tu cuenta…</Titulo>
                        <Sub>Tu pago fue aprobado. Estamos preparando tu sistema — tarda menos de un minuto.</Sub>
                        <BarWrap><BarFill /></BarWrap>
                    </Card>
                )}

                {/* ── APROBADO: cuenta lista con credenciales ── */}
                {aprobado && fase === "listo" && credenciales && (
                    <Card>
                        <CheckIcon />
                        <Titulo>¡Tu cuenta está lista! 🎉</Titulo>
                        <Sub>Guarda tus credenciales — las vas a necesitar para ingresar.</Sub>

                        <CredCard>
                            <CredRow>
                                <CredLabel><RiUserLine /> Usuario</CredLabel>
                                <CredVal>{credenciales.usuario}</CredVal>
                                <CopyBtn onClick={() => copiar(credenciales.usuario, "usuario")}>
                                    {copiado === "usuario" ? "✓ Copiado" : "Copiar"}
                                </CopyBtn>
                            </CredRow>
                            <CredDivider />
                            <CredRow>
                                <CredLabel><RiLockLine /> Contraseña</CredLabel>
                                <CredVal>{credenciales.password}</CredVal>
                                <CopyBtn onClick={() => copiar(credenciales.password, "password")}>
                                    {copiado === "password" ? "✓ Copiado" : "Copiar"}
                                </CopyBtn>
                            </CredRow>
                        </CredCard>

                        <CredNota>💡 Puedes cambiar la contraseña desde <b>Mi Perfil</b> una vez dentro.</CredNota>

                        <BtnPrimario onClick={() => navigate("/")}>
                            <RiLoginBoxLine /> Ingresar al sistema →
                        </BtnPrimario>
                    </Card>
                )}

                {/* ── APROBADO: timeout esperando webhook ── */}
                {aprobado && (fase === "timeout" || fase === "listo" && !credenciales) && (
                    <Card>
                        <CheckIcon />
                        <Titulo>¡Pago recibido! Cuenta en proceso</Titulo>
                        <Sub>
                            Tu pago fue aprobado. Tu cuenta se está configurando —
                            si no puedes ingresar en 5 minutos, escríbenos por WhatsApp.
                        </Sub>
                        <BtnWA as="a" href="https://wa.me/573118303017" target="_blank" rel="noopener noreferrer">
                            <RiWhatsappLine /> Contactar soporte
                        </BtnWA>
                        <BtnSecundario onClick={() => navigate("/")}>
                            Ir al inicio
                        </BtnSecundario>
                    </Card>
                )}

                {/* ── RECHAZADO o VOID ── */}
                {rechazado && (
                    <Card>
                        <ErrorIcon />
                        <Titulo>Pago no completado</Titulo>
                        <Sub>
                            Tu transacción fue rechazada. Puedes intentarlo de nuevo
                            con un método de pago diferente.
                        </Sub>
                        <BtnPrimario onClick={() => navigate("/")}>
                            Volver a intentarlo →
                        </BtnPrimario>
                        <BtnWA as="a" href="https://wa.me/573118303017" target="_blank" rel="noopener noreferrer">
                            <RiWhatsappLine /> Necesito ayuda
                        </BtnWA>
                    </Card>
                )}

                {/* ── ERROR ── */}
                {errorPago && !aprobado && !rechazado && (
                    <Card>
                        <ErrorIcon />
                        <Titulo>Algo salió mal</Titulo>
                        <Sub>
                            No pudimos procesar tu pago. Por favor intenta de nuevo
                            o contáctanos si el problema persiste.
                        </Sub>
                        <BtnPrimario onClick={() => navigate("/")}>
                            Volver a los planes →
                        </BtnPrimario>
                        <BtnWA as="a" href="https://wa.me/573118303017" target="_blank" rel="noopener noreferrer">
                            <RiWhatsappLine /> Hablar con soporte
                        </BtnWA>
                    </Card>
                )}
            </Wrap>
        </Pagina>
    );
}

/* ── Animaciones ── */
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const fadeUp = keyframes`from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; }`;
const progress = keyframes`from { width: 0%; } to { width: 100%; }`;
const floatOrb = keyframes`
    0%,100% { transform:translate(0,0) scale(1); }
    33%      { transform:translate(30px,-20px) scale(1.08); }
    66%      { transform:translate(-20px,15px) scale(0.95); }
`;

/* ── Layout ── */
const Pagina = styled.div`
    min-height: 100vh;
    background: #07090f;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Poppins", sans-serif;
    position: relative;
    overflow: hidden;
    padding: 24px;
`;

const BgOrb = styled.div`
    position: fixed;
    left: ${({ $x }) => $x}; top: ${({ $y }) => $y};
    width: ${({ $size }) => $size}; height: ${({ $size }) => $size};
    border-radius: 50%;
    background: ${({ $color }) => $color};
    filter: blur(80px);
    pointer-events: none; z-index: 0;
    animation: ${floatOrb} ${({ $dur }) => $dur} ease-in-out infinite;
    animation-delay: ${({ $delay }) => $delay ?? "0s"};
`;

const BgLines = styled.div`
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
        linear-gradient(rgba(248,133,51,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(248,133,51,0.03) 1px, transparent 1px);
    background-size: 56px 56px;
`;

const Wrap = styled.div`
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: center;
    gap: 28px; width: 100%;
`;

const Logo = styled.button`
    display: flex; align-items: center; gap: 10px;
    background: none; border: none; cursor: pointer;
    img { width: 32px; height: 32px; object-fit: contain; }
    span { font-size: 17px; font-weight: 900; color: #fff; b { color: #f88533; } }
`;

const Card = styled.div`
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 28px;
    padding: 48px 40px;
    max-width: 460px; width: 100%;
    display: flex; flex-direction: column; align-items: center; gap: 20px;
    text-align: center;
    animation: ${fadeUp} 0.5s ease both;
    backdrop-filter: blur(16px);

    @media (max-width: 480px) { padding: 36px 24px; border-radius: 20px; }
`;

const Titulo = styled.h1`
    font-size: 26px; font-weight: 900; margin: 0; letter-spacing: -0.3px;
    @media (max-width: 480px) { font-size: 22px; }
`;

const Sub = styled.p`
    font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.7; margin: 0;
`;

/* ── Íconos de estado ── */
const SpinIcon = styled(RiLoader4Line)`
    font-size: 56px; color: #f88533;
    animation: ${spin} 1s linear infinite;
`;

const CheckIcon = styled(RiCheckboxCircleFill)`
    font-size: 64px; color: #34d399;
`;

const ErrorIcon = styled(RiCloseCircleFill)`
    font-size: 64px; color: #f87171;
`;

/* ── Barra de progreso ── */
const BarWrap = styled.div`
    width: 100%; height: 4px; border-radius: 999px;
    background: rgba(255,255,255,0.08); overflow: hidden;
`;

const BarFill = styled.div`
    height: 100%; border-radius: 999px;
    background: linear-gradient(90deg, #f88533, #fbbf24);
    animation: ${progress} 55s linear forwards;
`;

/* ── Credenciales ── */
const CredCard = styled.div`
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    overflow: hidden;
`;

const CredRow = styled.div`
    display: flex; align-items: center; gap: 10px;
    padding: 14px 18px;
`;

const CredLabel = styled.span`
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.4px; color: rgba(255,255,255,0.4);
    flex-shrink: 0; width: 100px;
`;

const CredVal = styled.span`
    font-size: 15px; font-weight: 700; color: #f88533;
    flex: 1; text-align: left; font-family: "Courier New", monospace;
    letter-spacing: 0.5px;
`;

const CopyBtn = styled.button`
    border: none; background: rgba(248,133,51,0.12);
    color: #f88533; font-size: 11px; font-weight: 700;
    padding: 5px 12px; border-radius: 8px; cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
    &:hover { background: rgba(248,133,51,0.22); }
`;

const CredDivider = styled.div`
    height: 1px; background: rgba(255,255,255,0.06); margin: 0 18px;
`;

const CredNota = styled.p`
    font-size: 12px; color: rgba(255,255,255,0.35); margin: 0; line-height: 1.6;
`;

/* ── Botones ── */
const BtnPrimario = styled.button`
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 16px; border-radius: 14px;
    border: 2px solid #B56B12; background: #E8891A;
    color: #fff; font-size: 15px; font-weight: 800;
    font-family: "Poppins", sans-serif; cursor: pointer;
    box-shadow: 4px 4px 0 #B56B12;
    transition: filter 0.15s, transform 0.1s, box-shadow 0.1s;
    &:hover  { filter: brightness(1.1); transform: translateY(-1px); }
    &:active { box-shadow: 2px 2px 0 #B56B12; transform: translate(2px,2px); }
`;

const BtnSecundario = styled.button`
    background: none; border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.5); padding: 12px 24px; border-radius: 12px;
    font-size: 14px; font-weight: 600; font-family: "Poppins", sans-serif;
    cursor: pointer; width: 100%;
    transition: border-color 0.15s, color 0.15s;
    &:hover { border-color: #f88533; color: #f88533; }
`;

const BtnWA = styled.button`
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 14px; border-radius: 14px;
    border: 2px solid #25D366; background: rgba(37,211,102,0.1);
    color: #25D366; font-size: 15px; font-weight: 700;
    font-family: "Poppins", sans-serif; cursor: pointer;
    text-decoration: none;
    transition: background 0.15s;
    &:hover { background: rgba(37,211,102,0.2); }
`;
