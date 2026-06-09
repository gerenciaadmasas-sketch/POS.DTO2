import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { useAlmacenesConfigStore } from "../../store/AlmacenesConfigStore";
import { Icon } from "@iconify/react";
import { blurin } from "../../styles/keyframes";

const FEATURES = [
    { icon: "flat-color-icons:org-unit",         label: "Multi-empresa",   desc: "Gestiona varias empresas desde una sola cuenta" },
    { icon: "flat-color-icons:shop",             label: "Multi-sucursal",  desc: "Opera múltiples puntos de venta simultáneamente" },
    { icon: "flat-color-icons:factory",          label: "Multi-almacén",   desc: "Controla inventario por almacén en cada sucursal" },
    { icon: "flat-color-icons:sales-performance",label: "Ventas rápidas",  desc: "Cobro ágil con múltiples métodos de pago" },
    { icon: "flat-color-icons:bar-chart",        label: "Reportes en tiempo real", desc: "Dashboard con movimientos al instante" },
    { icon: "flat-color-icons:combo-chart",      label: "Kardex",          desc: "Historial completo de movimientos de inventario" },
];

const ACCESOS = [
    { icon: "flat-color-icons:shop",          label: "Vender",        to: "/pos",                      color: "#f88533" },
    { icon: "flat-color-icons:bar-chart",     label: "Reportes",      to: "/reportes",                 color: "#60a5fa" },
    { icon: "flat-color-icons:factory",       label: "Inventario",    to: "/inventario",               color: "#4ade80" },
    { icon: "flat-color-icons:settings",      label: "Configuración", to: "/configuracion",            color: "#a78bfa" },
];

export function HomeTemplates() {
    const navigate  = useNavigate();
    const { dataempresa }  = useEmpresaStore();
    const { datausuarios } = useUsuariosStore();
    const { dataAlmacenes } = useAlmacenesConfigStore();

    const hora = new Date().getHours();
    const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";
    const nombre = datausuarios?.nombres?.split(" ")[0] ?? "bienvenido";

    const almacenUsuario = dataAlmacenes?.find(a => a.id === datausuarios?.id_almacen);
    const etiquetaContexto = almacenUsuario?.nombre ?? dataempresa?.razon_social ?? "Tu empresa";

    return (
        <Page>
            <Contenido>
                {/* ── Columna izquierda ── */}
                <ColIzq>
                    <Tag>Sistema de punto de venta</Tag>
                    <Titulo>
                        {saludo},<br />
                        <Nombre>{nombre} 👋</Nombre>
                    </Titulo>
                    <Empresa>{etiquetaContexto}</Empresa>
                    <Desc>
                        Gestiona tus ventas, inventario y reportes desde un solo lugar.
                        Diseñado para negocios que necesitan velocidad y control.
                    </Desc>

                    {/* Accesos rápidos */}
                    <AccesosGrid>
                        {ACCESOS.map(({ icon, label, to, color }, i) => (
                            <AccesoBtn key={label} $color={color} $i={i} onClick={() => navigate(to)}>
                                <Icon icon={icon} style={{ fontSize: 26 }} />
                                <span>{label}</span>
                            </AccesoBtn>
                        ))}
                    </AccesosGrid>
                </ColIzq>

                {/* ── Columna derecha: features ── */}
                <ColDer>
                    {FEATURES.map(({ icon, label, desc }, i) => (
                        <FeatureCard key={label} $i={i}>
                            <FeatureIcon>
                                <Icon icon={icon} style={{ fontSize: 28 }} />
                            </FeatureIcon>
                            <FeatureTexto>
                                <FeatureTitulo>{label}</FeatureTitulo>
                                <FeatureDesc>{desc}</FeatureDesc>
                            </FeatureTexto>
                        </FeatureCard>
                    ))}
                </ColDer>
            </Contenido>

            {/* ── Footer tech stack ── */}
            <Footer>
                <FooterInner>
                    <FooterBloque>
                        <FooterLabel>FRONTEND</FooterLabel>
                        <FooterTags>
                            {["React 19", "Zustand", "React Query", "Styled Components", "Vite"].map(t => (
                                <FTag key={t}>{t}</FTag>
                            ))}
                        </FooterTags>
                    </FooterBloque>
                    <FooterSep />
                    <FooterBloque>
                        <FooterLabel>BACKEND</FooterLabel>
                        <FooterTags>
                            {["Supabase", "PostgreSQL", "Edge Functions", "Realtime"].map(t => (
                                <FTag key={t}>{t}</FTag>
                            ))}
                        </FooterTags>
                    </FooterBloque>
                </FooterInner>
            </Footer>
        </Page>
    );
}

/* ── Animations ── */
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const slideRight = keyframes`
    from { opacity: 0; transform: translateX(24px); }
    to   { opacity: 1; transform: translateX(0); }
`;

/* ── Layout ── */
const Page = styled.div`
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    display: flex;
    flex-direction: column;
    animation: ${blurin} 0.5s ease both;
`;

const Contenido = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    gap: 48px;
    padding: 48px 40px 24px;
    flex-wrap: wrap;
`;

/* ── Columna izquierda ── */
const ColIzq = styled.div`
    flex: 1;
    min-width: 280px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    animation: ${fadeUp} 0.5s ease both;
`;

const Tag = styled.div`
    display: inline-block;
    padding: 5px 14px;
    border-radius: 20px;
    background: rgba(248,133,51,0.12);
    border: 1px solid rgba(248,133,51,0.3);
    color: #f88533;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    width: fit-content;
`;

const Titulo = styled.h1`
    font-size: clamp(26px, 3vw, 38px);
    font-weight: 900;
    color: ${({ theme }) => theme.text};
    line-height: 1.2;
    margin: 0;
`;

const Nombre = styled.span`
    color: #f88533;
`;

const Empresa = styled.div`
    font-size: 15px;
    font-weight: 700;
    color: ${({ theme }) => theme.colorsubtitlecard};
    padding: 6px 14px;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 10px;
    width: fit-content;
`;

const Desc = styled.p`
    font-size: 14px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    line-height: 1.7;
    margin: 0;
    max-width: 420px;
`;

const AccesosGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 8px;
`;

const AccesoBtn = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 16px;
    border-radius: 12px;
    border: 1.5px solid ${({ $color }) => $color}30;
    background: ${({ $color }) => $color}12;
    color: ${({ theme }) => theme.text};
    font-size: 13px;
    font-weight: 700;
    font-family: "Poppins", sans-serif;
    cursor: pointer;
    transition: all 0.18s ease;
    animation: ${fadeUp} 0.5s ease both;
    animation-delay: ${({ $i }) => $i * 0.07 + 0.2}s;

    &:hover {
        background: ${({ $color }) => $color}25;
        border-color: ${({ $color }) => $color}70;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px ${({ $color }) => $color}20;
    }

    span { color: ${({ theme }) => theme.text}; }
`;

/* ── Columna derecha ── */
const ColDer = styled.div`
    flex: 0 0 340px;
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const FeatureCard = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 14px;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    animation: ${slideRight} 0.45s ease both;
    animation-delay: ${({ $i }) => $i * 0.07}s;
    transition: box-shadow 0.18s, transform 0.18s;

    &:hover {
        transform: translateX(-4px);
        box-shadow: 4px 4px 20px rgba(0,0,0,0.15);
    }
`;

const FeatureIcon = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: ${({ theme }) => theme.bgtotal};
    border: 1px solid ${({ theme }) => theme.color2};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

const FeatureTexto = styled.div`
    display: flex;
    flex-direction: column;
    gap: 3px;
`;

const FeatureTitulo = styled.div`
    font-size: 13px;
    font-weight: 800;
    color: ${({ theme }) => theme.text};
`;

const FeatureDesc = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    line-height: 1.4;
`;

/* ── Footer ── */
const Footer = styled.div`
    background: #1e40af;
    padding: 20px 40px;
    animation: ${fadeUp} 0.6s ease both;
    animation-delay: 0.4s;
`;

const FooterInner = styled.div`
    display: flex;
    align-items: center;
    gap: 32px;
    flex-wrap: wrap;
`;

const FooterBloque = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
`;

const FooterLabel = styled.div`
    font-size: 11px;
    font-weight: 900;
    color: rgba(255,255,255,0.6);
    letter-spacing: 1px;
    white-space: nowrap;
`;

const FooterSep = styled.div`
    width: 1px;
    height: 28px;
    background: rgba(255,255,255,0.2);
`;

const FooterTags = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
`;

const FTag = styled.span`
    padding: 4px 10px;
    border-radius: 20px;
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.85);
    font-size: 11px;
    font-weight: 600;
    border: 1px solid rgba(255,255,255,0.15);
`;
