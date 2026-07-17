import styled from "styled-components";
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
import { usePlan } from "../../../hooks/usePlan";
import { useState, useEffect } from "react";
import { supabase } from "../../../supabase/supabase.config";
import { ContarNoLeidosCliente } from "../../../supabase/crudSoporte";
import { ContarNoLeidosInternos } from "../../../supabase/crudMensajesInternos";

const LINKS_CAJERO        = ["/home", "/mensajes"];
const LINKS_ADMIN         = ["/home", "/mensajes", "/soporte"];
const LINKS_SUPERADMIN    = ["/home", "/mensajes", "/chat"];
const LINKS_COMERCIAL     = ["/home", "/mensajes"];
const LINKS_SUSCRIPCIONES = ["/home", "/mensajes", "/soporte"];
const LINKS_RESTAURANTE   = ["/home", "/mesas", "/menu-editor", "/mensajes", "/soporte"];

export function Sidebar({ state, setState, onNavClick }) {
    const { cerrarSesion } = useAuthStore();
    const { dataempresa } = useEmpresaStore();
    const { datausuarios } = useUsuariosStore();
    const { dataAlmacenes } = useAlmacenesConfigStore();
    const { limites } = usePlan();

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
    const esComercial  = tipo === "comercial";

    // Badge mensajes soporte (solo admins/supervisores)
    const [unreadSoporte, setUnreadSoporte] = useState(0);
    const id_empresa = dataempresa?.id;
    const yo_id = String(datausuarios?.id ?? "");
    const necesitaBadgeSoporte = !esSuperAdmin && !esCajero && !esComercial;

    useEffect(() => {
        if (!id_empresa || !necesitaBadgeSoporte) return;
        let channel = null;
        let idSus = null;
        const refrescar = async () => {
            if (!idSus) return;
            setUnreadSoporte(await ContarNoLeidosCliente({ id_suscripcion: idSus }));
        };
        const init = async () => {
            const { data: sus } = await supabase
                .from("suscripciones").select("id")
                .eq("id_empresa", id_empresa).maybeSingle();
            if (!sus) return;
            idSus = sus.id;
            await refrescar();
            channel = supabase
                .channel(`sidebar-badge-soporte-${idSus}`)
                .on("postgres_changes", { event: "*", schema: "public", table: "mensajes_soporte", filter: `id_suscripcion=eq.${idSus}` }, refrescar)
                .subscribe();
        };
        init();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, [id_empresa, necesitaBadgeSoporte]);

    // Badge mensajes internos (todos los roles excepto superadmin y comercial)
    const [unreadInternos, setUnreadInternos] = useState(0);
    const necesitaBadgeInternos = !esComercial && !!yo_id;

    useEffect(() => {
        if (!id_empresa || !necesitaBadgeInternos || !yo_id) return;
        let channel = null;
        const refrescar = async () => {
            const c = await ContarNoLeidosInternos({ id_empresa, receptor_id: yo_id });
            setUnreadInternos(c);
        };
        refrescar();
        channel = supabase
            .channel(`sidebar-badge-internos-${id_empresa}-${yo_id}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "mensajes_internos", filter: `id_empresa=eq.${id_empresa}` }, refrescar)
            .subscribe();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, [id_empresa, yo_id, necesitaBadgeInternos]);

    const esSuscripcionesTV = dataempresa?.actividad_economica === "suscripciones_tv";
    const esInmobiliaria    = dataempresa?.actividad_economica === "construccion";
    const esRestaurante     = dataempresa?.actividad_economica === "restaurante";

    const linksBase = esRestaurante
        ? LinksArray.filter(l => LINKS_RESTAURANTE.includes(l.to))
        : (esSuscripcionesTV || esInmobiliaria)
        ? LinksArray.filter(l => LINKS_SUSCRIPCIONES.includes(l.to))
        : esCajero
        ? LinksArray.filter(l => LINKS_CAJERO.includes(l.to))
        : esSuperAdmin
        ? LinksArray.filter(l => LINKS_SUPERADMIN.includes(l.to))
        : esComercial
        ? LinksArray.filter(l => LINKS_COMERCIAL.includes(l.to))
        : LinksArray.filter(l => LINKS_ADMIN.includes(l.to));

    const linksVisibles = !limites.kardex
        ? linksBase.filter(l => l.to !== "/kardex")
        : linksBase;

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
                {linksVisibles.map(({ icon, label, to, color }) => (
                    <NavLink
                        key={label}
                        to={to}
                        onClick={onNavClick}
                        className={({ isActive }) => isActive ? "link active" : "link"}
                    >
                        <IconWrap>
                            <Icon icon={icon} className="icon" color={color} />
                            {to === "/soporte" && unreadSoporte > 0 && (
                                <BadgeDot>{unreadSoporte > 9 ? "9+" : unreadSoporte}</BadgeDot>
                            )}
                            {to === "/mensajes" && unreadInternos > 0 && (
                                <BadgeDot>{unreadInternos > 9 ? "9+" : unreadInternos}</BadgeDot>
                            )}
                        </IconWrap>
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
        border: 1px solid rgba(248, 133, 51, 0.3);
        background: rgba(255, 255, 255, 0.06);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: #f88533;
        font-size: 20px;
        cursor: pointer;
        flex-shrink: 0;
        transition: transform 0.15s, background 0.15s, border-color 0.15s;
        &:hover  { background: rgba(248, 133, 51, 0.12); border-color: rgba(248, 133, 51, 0.55); }
        &:active { transform: scale(0.9); }
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

const IconWrap = styled.span`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

const BadgeDot = styled.span`
    position: absolute;
    top: -5px; right: -7px;
    min-width: 16px; height: 16px;
    padding: 0 3px;
    border-radius: 10px;
    background: #f87171;
    color: #fff;
    font-size: 9px;
    font-weight: 900;
    font-family: "Poppins", sans-serif;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid ${({ theme }) => theme.bgcards};
    line-height: 1;
    pointer-events: none;
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

