import styled, { keyframes } from "styled-components";
import { v } from "../../styles/variables";
import { usePlan } from "../../hooks/usePlan";
import { RiLockLine, RiWhatsappLine, RiShieldCheckLine } from "react-icons/ri";

const formatCOP = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);

export function SuspensionOverlay() {
    const { suspendido, diasMora, suscripcion, valorConDescuento } = usePlan();

    if (!suspendido) return null;

    const nombre = suscripcion?.nombre_cliente ?? "Cliente";
    const monto  = valorConDescuento || suscripcion?.valor_mensual || 0;

    return (
        <Fondo>
            <Orb $x="10%" $y="20%" $c="rgba(248,113,113,0.18)" $s="500px" />
            <Orb $x="70%" $y="60%" $c="rgba(248,133,51,0.12)"  $s="400px" />

            <Caja>
                <Logo>
                    <img src={v.logo} alt="logo" width={36} />
                    <span>SaaS<b>.DTO2</b></span>
                </Logo>

                <IconoLock>
                    <RiLockLine />
                </IconoLock>

                <Titulo>Cuenta suspendida temporalmente</Titulo>
                <Sub>
                    Hola <b>{nombre}</b>, tu cuenta lleva <b style={{ color: "#f87171" }}>{diasMora} {diasMora === 1 ? "día" : "días"} de atraso</b> en el pago.
                    Por eso hemos pausado el acceso de manera temporal para proteger tu información.
                </Sub>

                <AlertaBox>
                    <AlertaFila>
                        <span>Saldo pendiente</span>
                        <AlertaMonto>{formatCOP(monto)}</AlertaMonto>
                    </AlertaFila>
                    <AlertaFila>
                        <span>Días vencidos</span>
                        <AlertaDias>{diasMora} {diasMora === 1 ? "día" : "días"}</AlertaDias>
                    </AlertaFila>
                </AlertaBox>

                <Sub style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 0 }}>
                    Tus datos están 100% seguros. Una vez regularices el pago, el acceso se activa de inmediato.
                </Sub>

                <Btns>
                    <BtnWA
                        as="a"
                        href={`https://wa.me/573118303017?text=Hola!%20Soy%20${encodeURIComponent(nombre)}%20y%20quiero%20regularizar%20mi%20pago%20de%20SaaS.DTO2`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <RiWhatsappLine size={20} /> Hablar con soporte
                    </BtnWA>
                    <BtnPagar
                        as="a"
                        href={`https://wa.me/573118303017?text=Quiero%20pagar%20mi%20suscripci%C3%B3n%20de%20SaaS.DTO2`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Pagar ahora 🔒
                    </BtnPagar>
                </Btns>

                <Seguridad>
                    <RiShieldCheckLine /> Tus datos están cifrados y protegidos · Sin permanencia
                </Seguridad>
            </Caja>
        </Fondo>
    );
}

/* ── Animations ── */
const floatOrb = keyframes`
    0%,100% { transform: scale(1) translate(0,0); }
    50%      { transform: scale(1.1) translate(20px,-15px); }
`;
const popIn = keyframes`
    from { opacity: 0; transform: scale(0.92) translateY(20px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
`;
const lockPulse = keyframes`
    0%,100% { box-shadow: 0 0 30px rgba(248,113,113,0.5); transform: scale(1); }
    50%      { box-shadow: 0 0 60px rgba(248,113,113,0.8); transform: scale(1.05); }
`;

/* ── Styled ── */
const Fondo = styled.div`
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(4,6,10,0.97);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    backdrop-filter: blur(12px);
    overflow: hidden;
`;

const Orb = styled.div`
    position: absolute;
    left: ${({ $x }) => $x}; top: ${({ $y }) => $y};
    width: ${({ $s }) => $s}; height: ${({ $s }) => $s};
    border-radius: 50%; background: ${({ $c }) => $c};
    filter: blur(90px); pointer-events: none;
    animation: ${floatOrb} 8s ease-in-out infinite;
`;

const Caja = styled.div`
    position: relative; z-index: 1;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(248,113,113,0.2);
    border-radius: 28px;
    padding: 40px 36px;
    max-width: 480px; width: 100%;
    display: flex; flex-direction: column; align-items: center; gap: 18px;
    text-align: center;
    box-shadow: 0 0 80px rgba(248,113,113,0.15), 0 32px 80px rgba(0,0,0,0.6);
    animation: ${popIn} 0.5s cubic-bezier(0.34,1.2,0.64,1) both;

    @media (max-width: 500px) { padding: 28px 20px; border-radius: 24px; }
`;

const Logo = styled.div`
    display: flex; align-items: center; gap: 8px;
    span { font-size: 17px; font-weight: 900; color: #fff; b { color: #f88533; } }
`;

const IconoLock = styled.div`
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(248,113,113,0.12);
    border: 2px solid rgba(248,113,113,0.4);
    display: flex; align-items: center; justify-content: center;
    color: #f87171; font-size: 36px;
    animation: ${lockPulse} 2.5s ease-in-out infinite;
`;

const Titulo = styled.h2`
    font-size: clamp(20px,4vw,26px); font-weight: 900;
    color: #fff; margin: 0; letter-spacing: -0.3px;
    font-family: "Poppins", sans-serif;
`;

const Sub = styled.p`
    font-size: 14px; color: rgba(255,255,255,0.5);
    margin: 0; line-height: 1.65;
    font-family: "Poppins", sans-serif;
    b { color: #fff; }
`;

const AlertaBox = styled.div`
    width: 100%; border-radius: 14px; padding: 16px 18px;
    background: rgba(248,113,113,0.08);
    border: 1px solid rgba(248,113,113,0.25);
    display: flex; flex-direction: column; gap: 10px;
`;

const AlertaFila = styled.div`
    display: flex; justify-content: space-between; align-items: center;
    font-size: 14px; color: rgba(255,255,255,0.5);
    font-family: "Poppins", sans-serif;
`;

const AlertaMonto = styled.span`
    font-size: 20px; font-weight: 900; color: #f87171;
`;

const AlertaDias = styled.span`
    font-weight: 800; color: #f87171;
`;

const Btns = styled.div`
    display: flex; gap: 12px; width: 100%;
    @media (max-width: 420px) { flex-direction: column; }
`;

const BtnWA = styled.button`
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 18px; border-radius: 14px;
    border: 2px solid #16a34a88;
    background: linear-gradient(135deg, #16a34a, #15803d);
    color: #fff; font-size: 14px; font-weight: 800;
    font-family: "Poppins", sans-serif; cursor: pointer;
    text-decoration: none;
    box-shadow: 0 6px 24px rgba(22,163,74,0.35), 3px 3px 0 #14532d;
    transition: transform 0.15s, filter 0.15s;
    &:hover { filter: brightness(1.1); transform: translateY(-2px); }
`;

const BtnPagar = styled.button`
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 14px 18px; border-radius: 14px;
    border: 2px solid #B56B12;
    background: #E8891A;
    color: #fff; font-size: 14px; font-weight: 800;
    font-family: "Poppins", sans-serif; cursor: pointer;
    text-decoration: none;
    box-shadow: 0 6px 24px rgba(232,137,26,0.4), 3px 3px 0 #B56B12;
    transition: transform 0.15s, filter 0.15s;
    &:hover { filter: brightness(1.1); transform: translateY(-2px); }
`;

const Seguridad = styled.p`
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; color: rgba(255,255,255,0.22); margin: 0;
    font-family: "Poppins", sans-serif;
    svg { color: #4ade80; font-size: 13px; }
`;
