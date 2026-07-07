import styled from "styled-components";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useEffect, useRef, useMemo } from "react";
import { useModulosStore } from "../../store/ModulosStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { useEmpresaStore } from "../../store/EmpresaStore";

const OCULTOS_SUPERVISOR = [
    "/configuracion/empresa",
    "/configuracion/ticket",
    "/configuracion/serializacion",
    "/configuracion/proveedores",
    "/configuracion/planes",
    "/configuracion/version",
];

const OCULTOS_ADMIN = [
    "/configuracion/planes",
    "/configuracion/version",
];

// Íconos locales por módulo — edita aquí para cambiar cualquier ícono
// Íconos por módulo — clave = item.link (sin tildes, siempre consistente)
const ICONOS_MODULOS = {
    "/configuracion/categorias": "https://i.ibb.co/wZVwgsGj/categorias.png",
    "/configuracion/productos":  "https://i.ibb.co/vCCVQVjC/agregar-producto.png",
    "/configuracion/clientes":   "https://i.ibb.co/4cRJYPh/usuario.png",
    "/configuracion/proveedores":"https://i.ibb.co/xSKZ9xjj/proveedor.png",
    "/configuracion/impresoras": "https://i.ibb.co/ycRn8kQ3/impresora.png",
    "/configuracion/sucursales": "https://i.ibb.co/Z18YpddL/ubicacion.png",
    "/configuracion/usuarios":   "https://i.ibb.co/wZc5bbnM/empleado.png",
    "/configuracion/empresa":    "https://i.ibb.co/q33SWtSp/lider.png",
    "/configuracion/tickets":        "https://i.ibb.co/jPFnGLdQ/factura.png",
    "/configuracion/ticket":         "https://i.ibb.co/jPFnGLdQ/factura.png",
    "/configuracion/serializacion":  "https://i.ibb.co/WNZ8wt6g/codigo-binario.png",
    "/configuracion/version":        "https://i.ibb.co/k6cNngBD/rack-de-servidores.png",
    "/configuracion/planes":         "https://i.ibb.co/vxFGWK7V/diamante.png",
    "/configuracion/comprobantes":   "https://i.ibb.co/WNZ8wt6g/codigo-binario.png",
};

const getIcono = (link) => ICONOS_MODULOS[link];

const VISIBLES_SUSCRIPCIONES = [
    "/configuracion/planes",
    "/configuracion/usuarios",
    "/configuracion/empresa",
    "/configuracion/sucursales",
    "/configuracion/ticket",
    "/configuracion/serializacion",
];

export function ConfiguracionesTemplate() {
    const { dataModulos = [] } = useModulosStore();
    const { datausuarios } = useUsuariosStore();
    const { dataempresa } = useEmpresaStore();
    const gridRef = useRef(null);
    const tipo = datausuarios?.tipo;
    const esSupervisor = tipo === "supervisor";
    const esAdmin = tipo === "administrador";
    const esSuperAdmin = tipo === "superadmin";
    const esSuscripcionesTV = dataempresa?.actividad_economica === "suscripciones_tv";
    const esInmobiliaria    = dataempresa?.actividad_economica === "construccion";

    const OCULTOS_INMOBILIARIA = [
        "/configuracion/categorias",
        "/configuracion/productos",
    ];

    const VISIBLES_SUPERADMIN = ["/configuracion/planes", "/configuracion/version"];

    const modulosFiltrados = useMemo(() => {
        if (esSuscripcionesTV) return dataModulos.filter((m) => VISIBLES_SUSCRIPCIONES.includes(m.link));
        if (esSuperAdmin) return dataModulos.filter((m) => VISIBLES_SUPERADMIN.includes(m.link));
        if (esSupervisor) return dataModulos.filter((m) => !OCULTOS_SUPERVISOR.includes(m.link));
        if (esAdmin) {
            let modulos = dataModulos.filter((m) => !OCULTOS_ADMIN.includes(m.link));
            if (esInmobiliaria) modulos = modulos.filter((m) => !OCULTOS_INMOBILIARIA.includes(m.link));
            return modulos;
        }
        return dataModulos;
    }, [dataModulos, esSupervisor, esAdmin, esSuperAdmin, esSuscripcionesTV, esInmobiliaria]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            gridRef.current?.querySelectorAll(".card").forEach((card) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
                card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
            });
        };
        const grid = gridRef.current;
        if (grid) {
            grid.addEventListener("mousemove", handleMouseMove);
            return () => grid.removeEventListener("mousemove", handleMouseMove);
        }
    }, []);

    return (
        <Container>
            <Grid id="cards" ref={gridRef}>
                {modulosFiltrados.map((item, index) => {
                    const activo = !!(item.link);
                    const nombreModulo = (esSupervisor && item.link === "/configuracion/sucursales")
                        ? "Almacenes" : item.nombre;
                    const descModulo = (esSupervisor && item.link === "/configuracion/sucursales")
                        ? "Gestiona los almacenes de tu sucursal" : item.descripcion;
                    const iconoOverride = getIcono(item.link);
                    const overrideEsUrl = iconoOverride?.startsWith("http");
                    const dbEsUrl = !iconoOverride && item.icono?.startsWith("http");
                    const srcImg = overrideEsUrl ? iconoOverride : item.icono;
                    const iconoFinal = (!overrideEsUrl && iconoOverride) ? iconoOverride : (item.icono ?? "mdi:cog-outline");
                    return (
                        <CardWrap key={index} className="card" $activo={activo}>
                            <CardInner
                                to={activo ? item.link : "#"}
                                as={activo ? Link : "div"}
                                $activo={activo}
                            >
                                <IconArea>
                                    {(overrideEsUrl || dbEsUrl) ? (
                                        <img src={srcImg} alt={item.nombre} />
                                    ) : (
                                        <Icon icon={iconoFinal} />
                                    )}
                                </IconArea>
                                <Info>
                                    <h3>{nombreModulo}</h3>
                                    <p>{descModulo}</p>
                                </Info>
                            </CardInner>
                        </CardWrap>
                    );
                })}
            </Grid>
        </Container>
    );
}

const Container = styled.div`
    width: 100%;
    min-height: 100vh;
    background-color: ${({ theme }) => theme.bgtotal};
    padding: 36px 32px;
    box-sizing: border-box;
    overflow-y: auto;
    display: flex;
    justify-content: center;
    align-items: flex-start;

    @media (max-width: 767px) {
        padding: 68px 14px 20px;
    }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 18px;
    width: 100%;
    max-width: 1100px;

    &:hover > .card::after { opacity: 1; }

    @media (max-width: 420px) { grid-template-columns: 1fr 1fr; }
`;

const CardWrap = styled.div`
    border-radius: 20px;
    cursor: ${({ $activo }) => $activo ? "pointer" : "default"};

    height: 180px;

    position: relative;

    &::before, &::after {
        border-radius: inherit;
        content: "";
        height: 100%;
        left: 0;
        opacity: 0;
        position: absolute;
        top: 0;
        transition: opacity 500ms;
        width: 100%;
        pointer-events: none;
        z-index: 3;
    }

    &:hover::before { opacity: 1; }

    &::before {
        background: radial-gradient(
            800px circle at var(--mouse-x) var(--mouse-y),
            rgba(255,255,255,0.06),
            transparent 40%
        );
    }

    &::after {
        background: radial-gradient(
            600px circle at var(--mouse-x) var(--mouse-y),
            rgba(255,255,255,0.4),
            transparent 40%
        );
        z-index: 1;
    }

    @media (max-width: 500px) { height: 170px; }
`;

const CardInner = styled(Link)`
    display: flex;
    flex-direction: column;
    padding: 16px 14px 14px;
    text-decoration: none;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 20px;
    position: absolute;
    inset: 1px;
    z-index: 2;
    transition: border-color 0.2s;

    &:hover {
        ${({ $activo }) => $activo && "border-color: rgba(255,255,255,0.15);"}
    }
`;

const IconArea = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
        width: 64px;
        height: 64px;
        object-fit: contain;
        filter: grayscale(100%);
        transition: filter 0.3s;
    }

    svg, .iconify {
        font-size: 64px;
        opacity: 0.75;
        transition: opacity 0.3s, transform 0.25s;
    }

    ${CardWrap}:hover & {
        img { filter: grayscale(0); }
        svg, .iconify {
            opacity: 1;
            transform: scale(1.08);
        }
    }
`;

const Info = styled.div`
    h3 {
        font-size: 13px;
        font-weight: 700;
        color: ${({ theme }) => theme.text};
        margin: 0 0 3px;
    }
    p {
        font-size: 11px;
        color: ${({ theme }) => theme.colorsubtitlecard};
        margin: 0;
        line-height: 1.4;
    }
`;
