import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { RiArrowLeftLine, RiFileTextLine } from "react-icons/ri";
import { v } from "../../styles/variables";

const SECCIONES = [
    {
        titulo: "1. Descripción del servicio",
        texto: `POS.DTO2 es una plataforma de software como servicio (SaaS) desarrollada por ADMA BI, orientada a micro y pequeñas empresas colombianas. El servicio incluye punto de venta (POS), gestión de inventario, reportes, y módulos adicionales según el plan contratado.\n\nEl acceso al servicio se otorga mediante suscripción mensual o anual, y queda habilitado tras la confirmación del pago.`,
    },
    {
        titulo: "2. Planes y precios",
        texto: `El servicio se ofrece en tres planes:\n\n• Chispa ⚡ — Plan básico para negocios pequeños. Incluye 2 usuarios y 1 almacén.\n• Fuego 🔥 — Plan intermedio. Incluye hasta 10 usuarios, 3 almacenes y módulo de Kardex.\n• Cosmos 🌌 — Plan avanzado. Incluye hasta 12 usuarios y 6 almacenes.\n\nLos precios están expresados en pesos colombianos (COP) e incluyen todos los impuestos aplicables. ADMA BI se reserva el derecho de modificar los precios con un aviso previo de 30 días.`,
    },
    {
        titulo: "3. Forma de pago",
        texto: `Los pagos se procesan a través de Wompi, pasarela de pagos autorizada en Colombia. Se aceptan tarjetas débito, crédito, PSE y Nequi. El titular es responsable de mantener un método de pago válido asociado a su cuenta.\n\nLos pagos anuales tienen un descuento especial aplicado en el momento de la compra.`,
    },
    {
        titulo: "4. Período de gracia y suspensión",
        texto: `Si el pago no se realiza en la fecha de vencimiento:\n\n• Días 1-3 de mora: la cuenta permanece activa con alerta de vencimiento.\n• A partir del día 3: la cuenta puede ser suspendida temporalmente.\n• Suspensión: el acceso queda restringido hasta regularizar el pago.\n\nPara casos excepcionales (Problemas al realizar el pago), se puede contactar directamente al correo gerencia.adma.sas@gmail.com con ADMA BI, con el fin de resolver el inconveniente.`,
    },
    {
        titulo: "5. Cancelación del servicio",
        texto: `El usuario puede cancelar su suscripción en cualquier momento contactando al equipo de soporte. No se realizan reembolsos proporcionales por períodos no utilizados en el mes en curso.\n\nAl cancelar, los datos del negocio permanecerán disponibles por 5 días adicionales para descarga, tras lo cual serán eliminados de forma definitiva.`,
    },
    {
        titulo: "6. Responsabilidades del usuario",
        texto: `El usuario se compromete a:\n\n• Usar el software únicamente para fines legales y comerciales lícitos.\n• Mantener la confidencialidad de sus credenciales de acceso.\n• No compartir su acceso con personas no autorizadas.\n• No intentar vulnerar la seguridad del sistema o acceder a datos de otros clientes.\n• Proporcionar información veraz durante el registro.`,
    },
    {
        titulo: "7. Limitación de responsabilidad",
        texto: `ADMA BI no será responsable por:\n\n• Pérdidas de datos causadas por fuerza mayor, fallos de conectividad o errores del usuario.\n• Interrupciones del servicio causadas por mantenimiento programado (notificado con anticipación).\n• Decisiones comerciales tomadas con base en los reportes del sistema.\n\nEl servicio se presta "tal cual" (as-is) y ADMA BI hace su mejor esfuerzo para garantizar una disponibilidad del 99% mensual.`,
    },
    {
        titulo: "8. Propiedad intelectual",
        texto: `Todo el software, diseño, código fuente y documentación de POS.DTO2 es propiedad exclusiva de ADMA BI. Queda prohibida su reproducción, distribución, ingeniería inversa o uso fuera de los términos aquí establecidos.\n\nLos datos ingresados por el usuario (productos, clientes, ventas, etc.) son de propiedad exclusiva del usuario.`,
    },
    {
        titulo: "9. Modificaciones a los términos",
        texto: `ADMA BI puede modificar estos términos en cualquier momento. Los cambios serán notificados al correo electrónico registrado con al menos 15 días de anticipación. El uso continuado del servicio después de dicha notificación implica la aceptación de los nuevos términos.`,
    },
    {
        titulo: "10. Ley aplicable y jurisdicción",
        texto: `Estos términos se rigen por las leyes de la República de Colombia. Para cualquier controversia derivada de estos términos, las partes se someten a la jurisdicción de los jueces competentes de la ciudad de Bogotá, D.C., Colombia.`,
    },
];

export function TerminosTemplate() {
    const navigate = useNavigate();

    return (
        <Pagina>
            <Contenedor>
                <BtnVolver onClick={() => navigate(-1)}>
                    <RiArrowLeftLine /> Volver
                </BtnVolver>

                <Header>
                    <IconoDoc><RiFileTextLine /></IconoDoc>
                    <Titulo>Términos y Condiciones de Uso</Titulo>
                    <Meta>ADMA BI · POS.DTO2 · Última actualización: enero 2025</Meta>
                    <Meta>República de Colombia 🇨🇴</Meta>
                </Header>

                <Intro>
                    Al registrarse y utilizar la plataforma POS.DTO2, usted acepta estos Términos y Condiciones en su totalidad. Si no está de acuerdo con alguno de ellos, le recomendamos no utilizar el servicio.
                </Intro>

                <Divider />

                {SECCIONES.map((s) => (
                    <Seccion key={s.titulo}>
                        <SeccionTitulo>{s.titulo}</SeccionTitulo>
                        <SeccionTexto>{s.texto}</SeccionTexto>
                    </Seccion>
                ))}

                <Divider />

                <ContactoBox>
                    <ContactoTitulo>¿Dudas sobre los términos?</ContactoTitulo>
                    <ContactoTexto>
                        Escríbanos a{" "}
                        <ContactoLink href="mailto:gerencia.adma.sas@gmail.com">
                            gerencia.adma.sas@gmail.com
                        </ContactoLink>
                        {" "}y le responderemos en un plazo máximo de 3 días hábiles.
                    </ContactoTexto>
                </ContactoBox>

                <FooterLegal>
                    <LogoBtn onClick={() => navigate("/")}>
                        <img src={v.logo} alt="logo" />
                        <span>POS<b>.DTO2</b></span>
                    </LogoBtn>
                    <FooterTexto>© {new Date().getFullYear()} ADMA BI · Bogotá, Colombia</FooterTexto>
                </FooterLegal>
            </Contenedor>
        </Pagina>
    );
}

/* ── Styled Components ─────────────────────────────────── */
const Pagina = styled.div`
    min-height: 100vh;
    background: #07090f;
    padding: 40px 20px 60px;
    display: flex;
    justify-content: center;
`;

const Contenedor = styled.div`
    width: 100%;
    max-width: 760px;
    display: flex;
    flex-direction: column;
    gap: 28px;
`;

const BtnVolver = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: rgba(255,255,255,0.5);
    font-size: 13px;
    font-weight: 600;
    padding: 8px 16px;
    cursor: pointer;
    width: fit-content;
    transition: all 0.15s;
    font-family: "Poppins", sans-serif;
    &:hover { border-color: #f88533; color: #f88533; }
`;

const Header = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;
    padding: 32px 0 8px;
`;

const IconoDoc = styled.div`
    font-size: 48px;
    color: #60a5fa;
    line-height: 1;
`;

const Titulo = styled.h1`
    font-size: clamp(20px, 4vw, 28px);
    font-weight: 900;
    color: #fff;
    line-height: 1.3;
    margin: 0;
`;

const Meta = styled.span`
    font-size: 12px;
    color: rgba(255,255,255,0.3);
    font-weight: 500;
`;

const Intro = styled.p`
    font-size: 14px;
    line-height: 1.8;
    color: rgba(255,255,255,0.6);
    background: rgba(96,165,250,0.06);
    border: 1px solid rgba(96,165,250,0.15);
    border-radius: 14px;
    padding: 18px 22px;
    margin: 0;
`;

const Divider = styled.div`
    height: 1px;
    background: rgba(255,255,255,0.07);
`;

const Seccion = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const SeccionTitulo = styled.h2`
    font-size: 15px;
    font-weight: 800;
    color: #60a5fa;
    margin: 0;
`;

const SeccionTexto = styled.p`
    font-size: 13px;
    line-height: 1.9;
    color: rgba(255,255,255,0.55);
    margin: 0;
    white-space: pre-line;
`;

const ContactoBox = styled.div`
    background: rgba(96,165,250,0.06);
    border: 1px solid rgba(96,165,250,0.2);
    border-radius: 14px;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const ContactoTitulo = styled.h3`
    font-size: 14px;
    font-weight: 800;
    color: #fff;
    margin: 0;
`;

const ContactoTexto = styled.p`
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    margin: 0;
    line-height: 1.7;
`;

const ContactoLink = styled.a`
    color: #60a5fa;
    text-decoration: none;
    font-weight: 600;
    &:hover { text-decoration: underline; }
`;

const FooterLegal = styled.footer`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding-top: 12px;
`;

const LogoBtn = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    cursor: pointer;
    img { width: 24px; height: 24px; object-fit: contain; }
    span {
        font-size: 16px;
        font-weight: 700;
        color: rgba(255,255,255,0.4);
        b { color: #f88533; }
    }
`;

const FooterTexto = styled.span`
    font-size: 11px;
    color: rgba(255,255,255,0.2);
`;
