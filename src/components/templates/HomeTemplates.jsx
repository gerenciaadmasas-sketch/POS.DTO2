import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { useSucursalesStore } from "../../store/SucursalesStore";
import { useAlmacenesConfigStore } from "../../store/AlmacenesConfigStore";
import { Icon } from "@iconify/react";

const ROL_STYLE = {
    superadmin:    { color: "#f88533", bg: "rgba(248,133,51,0.10)", glow: "rgba(248,133,51,0.35)" },
    administrador: { color: "#a78bfa", bg: "rgba(167,139,250,0.10)", glow: "rgba(167,139,250,0.35)" },
    supervisor:    { color: "#4ade80", bg: "rgba(74,222,128,0.10)",  glow: "rgba(74,222,128,0.35)" },
    cajero:        { color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  glow: "rgba(96,165,250,0.35)" },
};

const ACCESOS_SUPERADMIN = [
    { key: "saas",    icon: "solar:users-group-rounded-bold-duotone", label: "Clientes",     to: "/saas",          accent: "#f88533", big: true  },
    { key: "inv",     icon: "solar:box-bold-duotone",            label: "Inventario",     to: "/inventario",    accent: "#4ade80", big: false },
    { key: "report",  icon: "solar:chart-square-bold-duotone",   label: "Reportes",       to: "/reportes",      accent: "#60a5fa", big: false },
    { key: "kardex",  icon: "solar:clipboard-list-bold-duotone", label: "Kardex",         to: "/kardex",        accent: "#f59e0b", big: false },
    { key: "arqueo",  icon: "solar:wallet-money-bold-duotone",   label: "Arqueo",         to: "/arqueo",        accent: "#ec4899", big: false },
    { key: "config",  icon: "solar:settings-bold-duotone",       label: "Configuración",  to: "/configuracion", accent: "#a78bfa", big: false },
];

const ACCESOS_ADMIN = [
    { key: "pos",     icon: "solar:cart-large-2-bold-duotone",   label: "Punto de venta", to: "/pos",           accent: "#f88533", big: true  },
    { key: "inv",     icon: "solar:box-bold-duotone",            label: "Inventario",     to: "/inventario",    accent: "#4ade80", big: false },
    { key: "report",  icon: "solar:chart-square-bold-duotone",   label: "Reportes",       to: "/reportes",      accent: "#60a5fa", big: false },
    { key: "kardex",  icon: "solar:clipboard-list-bold-duotone", label: "Kardex",         to: "/kardex",        accent: "#f59e0b", big: false },
    { key: "arqueo",  icon: "solar:wallet-money-bold-duotone",   label: "Arqueo",         to: "/arqueo",        accent: "#ec4899", big: false },
    { key: "config",  icon: "solar:settings-bold-duotone",       label: "Configuración",  to: "/configuracion", accent: "#a78bfa", big: false },
];

const ACCESOS_SUPERVISOR = [
    { key: "inv",     icon: "solar:box-bold-duotone",            label: "Inventario",     to: "/inventario",    accent: "#4ade80", big: true  },
    { key: "report",  icon: "solar:chart-square-bold-duotone",   label: "Reportes",       to: "/reportes",      accent: "#60a5fa", big: false },
    { key: "kardex",  icon: "solar:clipboard-list-bold-duotone", label: "Kardex",         to: "/kardex",        accent: "#f59e0b", big: false },
    { key: "arqueo",  icon: "solar:wallet-money-bold-duotone",   label: "Arqueo",         to: "/arqueo",        accent: "#ec4899", big: false },
    { key: "config",  icon: "solar:settings-bold-duotone",       label: "Configuración",  to: "/configuracion", accent: "#a78bfa", big: false },
];

const ACCESOS_CAJERO = [
    { key: "pos",     icon: "solar:cart-large-2-bold-duotone",   label: "Punto de venta", to: "/pos",           accent: "#f88533", big: true  },
    { key: "inv",     icon: "solar:box-bold-duotone",            label: "Inventario",     to: "/inventario",    accent: "#4ade80", big: false },
    { key: "report",  icon: "solar:chart-square-bold-duotone",   label: "Reportes",       to: "/reportes",      accent: "#60a5fa", big: false },
];

export function HomeTemplates() {
    const navigate = useNavigate();
    const { dataempresa }   = useEmpresaStore();
    const { datausuarios }  = useUsuariosStore();
    const { dataSucursales } = useSucursalesStore();
    const { dataAlmacenes }  = useAlmacenesConfigStore();

    const tipo   = datausuarios?.tipo ?? "cajero";
    const rol    = ROL_STYLE[tipo] ?? ROL_STYLE.cajero;
    const nombre = datausuarios?.nombres?.split(" ")[0] ?? "usuario";

    const hora   = new Date().getHours();
    const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";
    const iconoSaludo = hora < 6 ? "🌙" : hora < 12 ? "☀️" : hora < 18 ? "🌤️" : "🌙";

    const sucursal = dataSucursales?.find(s => s.id === datausuarios?.id_sucursal);
    const almacen  = dataAlmacenes?.find(a => a.id === datausuarios?.id_almacen);
    const contexto = tipo === "cajero"
        ? almacen?.nombre ?? "Sin almacén"
        : tipo === "supervisor"
        ? sucursal?.razon_social ?? "Sin sucursal"
        : dataempresa?.razon_social ?? "Empresa";

    const accesos = tipo === "cajero" ? ACCESOS_CAJERO
                  : tipo === "supervisor" ? ACCESOS_SUPERVISOR
                  : tipo === "superadmin" ? ACCESOS_SUPERADMIN
                  : ACCESOS_ADMIN;

    const fecha = new Date().toLocaleDateString("es-CO", {
        weekday: "short", day: "numeric", month: "short",
    });

    return (
        <Page>
            <Inner>
                {/* ── Header ── */}
                <HeaderSection>
                    <Fecha>{fecha}</Fecha>
                    <Saludo>
                        {saludo}, <NombreSpan>{nombre}</NombreSpan> {iconoSaludo}
                    </Saludo>
                    <RolRow>
                        <RolBadge $color={rol.color} $bg={rol.bg} $glow={rol.glow}>
                            {tipo}
                        </RolBadge>
                        <Contexto>{contexto}</Contexto>
                    </RolRow>
                </HeaderSection>

                {/* ── Bento Grid ── */}
                <BentoGrid $count={accesos.length}>
                    {accesos.map(({ key, icon, label, to, accent, big }, i) => (
                        <BentoCard
                            key={key}
                            $accent={accent}
                            $big={big}
                            $i={i}
                            onClick={() => navigate(to)}
                        >
                            <BentoIcon $accent={accent} $big={big}>
                                <Icon icon={icon} />
                            </BentoIcon>
                            <BentoLabel>{label}</BentoLabel>
                            {big && <BentoArrow>→</BentoArrow>}
                        </BentoCard>
                    ))}
                </BentoGrid>
            </Inner>
        </Page>
    );
}

/* ── Animations ── */
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: none; }
`;

const glowPulse = keyframes`
    0%, 100% { box-shadow: 0 0 12px var(--glow); }
    50%      { box-shadow: 0 0 24px var(--glow); }
`;

/* ── Layout ── */
const Page = styled.div`
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;

    @media (max-width: 767px) { padding: 78px 16px 24px; align-items: flex-start; }
`;

const Inner = styled.div`
    width: 100%;
    max-width: 580px;
    display: flex;
    flex-direction: column;
    gap: 36px;
`;

/* ── Header ── */
const HeaderSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    animation: ${fadeUp} 0.45s ease both;
`;

const Fecha = styled.div`
    font-size: 11px;
    font-weight: 600;
    color: ${({ theme }) => theme.colorsubtitlecard};
    text-transform: capitalize;
    letter-spacing: 0.5px;
`;

const Saludo = styled.h1`
    font-size: clamp(28px, 5vw, 40px);
    font-weight: 900;
    color: ${({ theme }) => theme.text};
    margin: 0;
    line-height: 1.15;
`;

const NombreSpan = styled.span`
    color: #f88533;
`;

const RolRow = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 6px;
`;

const RolBadge = styled.span`
    --glow: ${({ $glow }) => $glow};
    display: inline-block;
    padding: 5px 16px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: ${({ $color }) => $color};
    background: ${({ $bg }) => $bg};
    border: 1px solid ${({ $color }) => $color}40;
    animation: ${glowPulse} 3s ease-in-out infinite;
`;

const Contexto = styled.span`
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

/* ── Bento Grid ── */
const BentoGrid = styled.div`
    display: grid;
    grid-template-columns: ${({ $count }) => $count <= 3 ? "repeat(2, 1fr)" : "repeat(3, 1fr)"};
    grid-auto-rows: 120px;
    gap: 12px;

    & > :first-child {
        grid-row: span 2;
    }

    @media (max-width: 500px) {
        grid-template-columns: repeat(2, 1fr);
        grid-auto-rows: 110px;
    }
`;

const BentoCard = styled.button`
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 18px;
    border-radius: 18px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards};
    cursor: pointer;
    overflow: hidden;
    font-family: "Poppins", sans-serif;
    text-align: left;
    animation: ${fadeUp} 0.4s ease both;
    animation-delay: ${({ $i }) => $i * 0.06 + 0.15}s;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;

    &::before {
        content: "";
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 3px;
        background: ${({ $accent }) => $accent};
        opacity: 0;
        transition: opacity 0.2s;
    }

    &:hover {
        transform: translateY(-3px);
        border-color: ${({ $accent }) => $accent}50;
        box-shadow: 0 8px 28px ${({ $accent }) => $accent}18;
        &::before { opacity: 1; }
    }
`;

const BentoIcon = styled.div`
    font-size: ${({ $big }) => $big ? "38px" : "28px"};
    color: ${({ $accent }) => $accent};
    line-height: 1;
`;

const BentoLabel = styled.span`
    font-size: 13px;
    font-weight: 700;
    color: ${({ theme }) => theme.text};
`;

const BentoArrow = styled.span`
    position: absolute;
    bottom: 16px;
    right: 18px;
    font-size: 20px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity 0.2s, transform 0.2s;

    ${BentoCard}:hover & {
        opacity: 1;
        transform: none;
    }
`;
