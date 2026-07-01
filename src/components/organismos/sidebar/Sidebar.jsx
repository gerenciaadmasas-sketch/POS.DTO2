import styled from "styled-components";
import { ToggleTema } from "../ToggleTema";
import { LinksArray, SecondarylinksArray } from "../../../utils/dataEstatica";
import { v } from "../../../styles/variables";
import { NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";
import { RiCloseLine } from "react-icons/ri";
import { useAuthStore } from "../../../store/AuthStore";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useUsuariosStore } from "../../../store/UsuariosStore";
import { ObtenerSesionAbierta } from "../../../supabase/crudSesionesCaja";
import { useAlmacenesConfigStore } from "../../../store/AlmacenesConfigStore";
import Swal from "sweetalert2";

const LINKS_CAJERO     = ["/", "/pos", "/inventario", "/reportes"];
const LINKS_ADMIN      = ["/", "/pos", "/inventario", "/kardex", "/reportes", "/arqueo"];
const LINKS_SUPERADMIN = ["/", "/saas", "/reportes"];

export function Sidebar({ state, setState, onNavClick }) {
    const { cerrarSesion } = useAuthStore();
    const { dataempresa } = useEmpresaStore();
    const { datausuarios } = useUsuariosStore();
    const { dataAlmacenes } = useAlmacenesConfigStore();

    async function handleCerrarSesion() {
        if (datausuarios?.permisos?.ventas && dataempresa?.id && datausuarios?.id) {
            const almacenId = datausuarios.id_almacen ?? dataAlmacenes?.[0]?.id;
            if (almacenId) {
                const sesion = await ObtenerSesionAbierta({
                    id_empresa: dataempresa.id,
                    id_almacen: almacenId,
                    id_usuario: datausuarios.id,
                });
                if (sesion) {
                    Swal.fire({
                        title: "Tienes una caja abierta",
                        text: "Debes cerrar tu turno antes de salir.",
                        icon: "warning",
                        confirmButtonText: "Entendido",
                        confirmButtonColor: "#f88533",
                        customClass: { popup: "swal-pos" },
                    });
                    return;
                }
            }
        }
        cerrarSesion();
    }

    const tipo = datausuarios?.tipo;
    const esCajero     = tipo === "cajero";
    const esSuperAdmin = tipo === "superadmin";

    const linksVisibles = esCajero
        ? LinksArray.filter(l => LINKS_CAJERO.includes(l.to))
        : esSuperAdmin
        ? LinksArray.filter(l => LINKS_SUPERADMIN.includes(l.to))
        : LinksArray.filter(l => LINKS_ADMIN.includes(l.to));

    return (
        <Wrap $isopen={state}>
            {/* Botón colapsar */}
            <BtnToggle $isopen={state} onClick={() => setState(!state)}>
                <v.iconoflechaderecha />
            </BtnToggle>

            {/* Logo */}
            <LogoArea $isopen={state}>
                <LogoImg $isopen={state}>
                    <img src={v.logo} alt="logo" />
                </LogoImg>
                {state && <LogoNombre>{dataempresa?.razon_social ?? "POS DL"}</LogoNombre>}
                <LogoNombreMobile>{dataempresa?.razon_social ?? "POS DL"}</LogoNombreMobile>
                {/* Botón cerrar — solo en móvil, se mueve con la animación del drawer */}
                <BtnCerrarMobile onClick={onNavClick}>
                    <RiCloseLine />
                </BtnCerrarMobile>
            </LogoArea>

            {/* Links primarios */}
            <Nav $isopen={state}>
                {linksVisibles.map(({ icon, label, to }) => (
                    <NavLink
                        key={label}
                        to={to}
                        onClick={onNavClick}
                        className={({ isActive }) => isActive ? "link active" : "link"}
                    >
                        <Icon icon={icon} className="icon" />
                        <span className="link-label">{label}</span>
                    </NavLink>
                ))}

                <Divider />

                {(!esCajero) && SecondarylinksArray.map(({ icon, label, to, color }) => (
                    <NavLink
                        key={label}
                        to={to}
                        onClick={onNavClick}
                        className={({ isActive }) => isActive ? "link active" : "link"}
                    >
                        <Icon icon={icon} className="icon" color={color} />
                        <span className="link-label">{label}</span>
                    </NavLink>
                ))}

                {/* Mi Perfil */}
                <NavLink
                    to="/perfil"
                    onClick={onNavClick}
                    className={({ isActive }) => isActive ? "link active" : "link"}
                >
                    <Icon icon="solar:user-bold-duotone" className="icon" color="#60a5fa" />
                    <span className="link-label">Mi Perfil</span>
                </NavLink>

                {/* Salir */}
                <BtnSalir onClick={handleCerrarSesion} $open={state}>
                    <Icon icon="solar:logout-2-bold-duotone" className="icon" color="#f87171" />
                    <span className="link-label">Salir</span>
                </BtnSalir>
            </Nav>

            <Bottom>
                <ToggleTema />
            </Bottom>
        </Wrap>
    );
}

/* ─── Styled Components ───────────────────────────────── */

const Wrap = styled.aside`
    position: fixed;
    top: 0; left: 0;
    height: 100%;
    width: ${({ $isopen }) => $isopen ? "240px" : "76px"};
    background: ${({ theme }) => theme.bgcards};
    border-right: 1px solid ${({ theme }) => theme.color2};
    box-shadow: 2px 0 20px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    align-items: ${({ $isopen }) => $isopen ? "stretch" : "center"};
    padding: 20px 10px 16px;
    gap: 6px;
    transition: width 0.22s cubic-bezier(0.4,0,0.2,1);
    overflow: hidden;
    z-index: 100;
    box-sizing: border-box;
    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.colorScroll};
        border-radius: 10px;
    }

    /* ── Móvil: drawer deslizante ── */
    @media (max-width: 767px) {
        width: 260px !important;
        align-items: stretch !important;
        padding: 20px 12px 20px;
        transform: ${({ $isopen }) => $isopen ? "translateX(0)" : "translateX(-100%)"};
        transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
        box-shadow: ${({ $isopen }) => $isopen ? "6px 0 32px rgba(0,0,0,0.4)" : "none"};
    }
`;

const BtnToggle = styled.button`
    position: fixed;
    top: 66px;
    left: ${({ $isopen }) => $isopen ? "222px" : "60px"};
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 20;
    transition: left 0.2s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    transform: ${({ $isopen }) => $isopen ? "rotate(180deg)" : "rotate(0deg)"};
    font-size: 14px;
    padding: 0;

    @media (max-width: 767px) {
        display: none;
    }
`;

const LogoArea = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: ${({ $isopen }) => $isopen ? "0 8px 20px" : "0 0 20px"};
    justify-content: ${({ $isopen }) => $isopen ? "flex-start" : "center"};

    @media (max-width: 767px) {
        justify-content: flex-start;
        width: 100%;
    }
`;

const BtnCerrarMobile = styled.button`
    display: none;

    @media (max-width: 767px) {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        border: 1.5px solid ${({ theme }) => theme.color2};
        background: ${({ theme }) => theme.bgtotal};
        color: ${({ theme }) => theme.text};
        font-size: 22px;
        cursor: pointer;
        flex-shrink: 0;
        transition: background 0.15s, color 0.15s;
        &:hover { background: rgba(248,113,113,0.1); color: #f87171; border-color: #f87171; }
    }
`;

const LogoImg = styled.div`
    flex-shrink: 0;
    width: ${({ $isopen }) => $isopen ? "30px" : "36px"};
    height: ${({ $isopen }) => $isopen ? "30px" : "36px"};
    transition: width 0.2s, height 0.2s;
    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        animation: flotar 1.7s ease-in-out infinite alternate;
    }
`;

const LogoNombre = styled.span`
    font-weight: 800;
    font-size: 14px;
    color: #f88533;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
    /* Ya visible en desktop cuando state=true, ocultar en móvil (usa LogoNombreMobile) */
    @media (max-width: 767px) {
        display: none;
    }
`;

const LogoNombreMobile = styled.span`
    display: none;
    font-weight: 800;
    font-size: 14px;
    color: #f88533;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
    @media (max-width: 767px) {
        display: block;
    }
`;

const Nav = styled.nav`
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;

    .link {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 12px;
        border-radius: 12px;
        text-decoration: none;
        color: ${({ theme }) => theme.text};
        font-weight: 700;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        transition: background 0.15s;
        white-space: nowrap;

        .icon {
            font-size: 24px;
            flex-shrink: 0;
        }

        /* En desktop: mostrar label solo si sidebar abierto */
        .link-label {
            display: ${({ $isopen }) => $isopen ? "inline" : "none"};
        }

        &:hover {
            background: ${({ theme }) => theme.bgAlpha};
        }

        &.active {
            background: rgba(248, 133, 51, 0.12);
            color: #f88533;
            .icon { filter: none; }
        }
    }

    /* En móvil: siempre mostrar labels */
    @media (max-width: 767px) {
        .link .link-label {
            display: inline !important;
        }
    }
`;

const Divider = styled.div`
    height: 1px;
    background: ${({ theme }) => theme.color2};
    margin: 8px 4px;
`;

const BtnSalir = styled.button`
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 12px;
    border-radius: 12px;
    border: none;
    background: none;
    color: ${({ theme }) => theme.text};
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    cursor: pointer;
    width: 100%;
    white-space: nowrap;
    transition: background 0.15s;

    .icon { font-size: 24px; flex-shrink: 0; }

    .link-label {
        display: ${({ $open }) => $open ? "inline" : "none"};
    }

    @media (max-width: 767px) {
        .link-label { display: inline !important; }
    }

    &:hover { background: rgba(248, 113, 113, 0.12); color: #f87171; }
`;

const Bottom = styled.div`
    display: flex;
    justify-content: center;
    padding-top: 10px;
    border-top: 1px solid ${({ theme }) => theme.color2};
`;
