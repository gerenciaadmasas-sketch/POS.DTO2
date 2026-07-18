import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { RiArrowLeftLine, RiShieldCheckLine } from "react-icons/ri";
import { v } from "../../styles/variables";

const SECCIONES = [
    {
        titulo: "1. Responsable del tratamiento",
        texto: `ADMA BI, con correo de contacto gerencia.adma.sas@gmail.com, con domicilio en Bogotá, Colombia, es el responsable del tratamiento de los datos personales recolectados a través de la plataforma SaaS.DTO2.`,
    },
    {
        titulo: "2. Datos que recolectamos",
        texto: `Recolectamos los siguientes datos personales con su consentimiento expreso:\n\n• Nombre y apellido\n• Número de cédula o NIT\n• Correo electrónico\n• Número de teléfono\n• Nombre del negocio\n• Actividad económica\n\nAdicionalmente, para la operación del software, se almacenan datos transaccionales del negocio (ventas, inventario, clientes, proveedores) que son de uso exclusivo del titular.`,
    },
    {
        titulo: "3. Finalidad del tratamiento",
        texto: `Los datos recolectados se utilizan exclusivamente para:\n\n• Prestar el servicio de software POS contratado\n• Gestionar la suscripción y facturación\n• Brindar soporte técnico\n• Enviar comunicaciones relacionadas con el servicio\n• Cumplir con obligaciones legales y tributarias\n\nNo vendemos, cedemos ni compartimos sus datos personales con terceros para fines comerciales.`,
    },
    {
        titulo: "4. Aislamiento de datos (Multi-tenant)",
        texto: `La plataforma SaaS.DTO2 opera bajo arquitectura multi-tenant con aislamiento total por empresa. Esto significa que los datos de ventas, clientes, inventario, proveedores y cualquier otra información de su negocio son completamente privados y no pueden ser accedidos por otros usuarios de la plataforma. Cada empresa cuenta con su propio espacio aislado y protegido.`,
    },
    {
        titulo: "5. Derechos del titular",
        texto: `De conformidad con la Ley 1581 de 2012 y el Decreto 1377 de 2013, usted tiene derecho a:\n\n• Conocer, actualizar y rectificar sus datos personales\n• Solicitar prueba de la autorización otorgada\n• Ser informado sobre el uso de sus datos\n• Revocar la autorización y/o solicitar la supresión de sus datos\n• Acceder gratuitamente a sus datos personales\n\nPara ejercer estos derechos, escríbanos a gerencia.adma.sas@gmail.com.`,
    },
    {
        titulo: "6. Seguridad de los datos",
        texto: `Implementamos medidas técnicas y administrativas para proteger sus datos contra acceso no autorizado, pérdida o alteración, incluyendo:\n\n• Cifrado en tránsito (HTTPS/TLS)\n• Row Level Security (RLS) en base de datos\n• Autenticación segura vía Supabase Auth\n• Accesos diferenciados por rol de usuario`,
    },
    {
        titulo: "7. Vigencia de la política",
        texto: `Esta política entra en vigor a partir del 1 de enero de 2025 y permanecerá vigente hasta que sea modificada. Cualquier cambio será notificado a los titulares a través del correo electrónico registrado con al menos 10 días hábiles de anticipación.`,
    },
    {
        titulo: "8. Ley aplicable",
        texto: `Esta política se rige por la Ley Estatutaria 1581 de 2012 de la República de Colombia (Protección de Datos Personales) y sus decretos reglamentarios. Para cualquier controversia, las partes se someten a la jurisdicción de los jueces de la ciudad de Bogotá, Colombia.`,
    },
];

export function PoliticaPrivacidadTemplate() {
    const navigate = useNavigate();

    return (
        <Pagina>
            <Contenedor>
                <BtnVolver onClick={() => navigate(-1)}>
                    <RiArrowLeftLine /> Volver
                </BtnVolver>

                <Header>
                    <IconoEscudo><RiShieldCheckLine /></IconoEscudo>
                    <Titulo>Política de Privacidad y Tratamiento de Datos Personales</Titulo>
                    <Meta>ADMA BI · SaaS.DTO2 · Última actualización: enero 2025</Meta>
                    <Meta>Ley 1581 de 2012 — República de Colombia 🇨🇴</Meta>
                </Header>

                <Intro>
                    En ADMA BI nos comprometemos con la protección de sus datos personales. Esta política describe cómo recolectamos, usamos y protegemos la información que nos comparte al utilizar nuestra plataforma SaaS.DTO2.
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
                    <ContactoTitulo>¿Preguntas sobre sus datos?</ContactoTitulo>
                    <ContactoTexto>
                        Escríbanos a{" "}
                        <ContactoLink href="mailto:gerencia.adma.sas@gmail.com">
                            gerencia.adma.sas@gmail.com
                        </ContactoLink>
                        {" "}y le responderemos en un plazo máximo de 10 días hábiles.
                    </ContactoTexto>
                </ContactoBox>

                <FooterLegal>
                    <LogoBtn onClick={() => navigate("/")}>
                        <img src={v.logo} alt="logo" />
                        <span>SaaS<b>.DTO2</b></span>
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

const IconoEscudo = styled.div`
    font-size: 48px;
    color: #4ade80;
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
    background: rgba(74,222,128,0.06);
    border: 1px solid rgba(74,222,128,0.15);
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
    color: #f88533;
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
    background: rgba(248,133,51,0.06);
    border: 1px solid rgba(248,133,51,0.2);
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
    color: #f88533;
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
