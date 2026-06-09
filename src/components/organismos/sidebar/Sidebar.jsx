import styled from "styled-components";
import { ToggleTema } from "../ToggleTema";
import { LinksArray, SecondarylinksArray } from "../../../utils/dataEstatica";
import { v } from "../../../styles/variables";
import { NavLink, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuthStore } from "../../../store/AuthStore";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useUsuariosStore } from "../../../store/UsuariosStore";

const LINKS_CAJERO = ["/", "/pos", "/inventario"];
const LINKS_ADMIN  = ["/", "/inventario", "/kardex", "/reportes", "/arqueo"]; // sin POS

export function Sidebar({ state, setState }) {
    const { cerrarSesion } = useAuthStore();
    const { dataempresa } = useEmpresaStore();
    const { datausuarios } = useUsuariosStore();

    const esCajero = datausuarios?.tipo === "cajero";
    const linksVisibles = esCajero
        ? LinksArray.filter(l => LINKS_CAJERO.includes(l.to))
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
            </LogoArea>

            {/* Links primarios */}
            <Nav>
                {linksVisibles.map(({ icon, label, to }) => (
                    <NavLink
                        key={label}
                        to={to}
                        className={({ isActive }) => isActive ? "link active" : "link"}
                    >
                        <Icon icon={icon} className="icon" />
                        {state && <span>{label}</span>}
                    </NavLink>
                ))}

                <Divider />

                {!esCajero && SecondarylinksArray.map(({ icon, label, to, color }) => (
                    <NavLink
                        key={label}
                        to={to}
                        className={({ isActive }) => isActive ? "link active" : "link"}
                    >
                        <Icon icon={icon} className="icon" color={color} />
                        {state && <span>{label}</span>}
                    </NavLink>
                ))}

                {/* Mi Perfil */}
                <NavLink
                    to="/perfil"
                    className={({ isActive }) => isActive ? "link active" : "link"}
                >
                    <Icon icon="heroicons:user-circle-solid" className="icon" color="#60a5fa" />
                    {state && <span>Mi Perfil</span>}
                </NavLink>

                {/* Salir */}
                <BtnSalir onClick={cerrarSesion} $open={state}>
                    <Icon icon="heroicons:arrow-right-on-rectangle-solid" className="icon" color="#f87171" />
                    {state && <span>Salir</span>}
                </BtnSalir>
            </Nav>

            {/* Toggle tema */}
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
    background: ${({ theme }) => theme.bgtotal};
    border-right: 1px solid ${({ theme }) => theme.color2};
    display: flex;
    flex-direction: column;
    align-items: ${({ $isopen }) => $isopen ? "stretch" : "center"};
    padding: 20px 10px 16px;
    gap: 6px;
    transition: width 0.2s ease;
    overflow: hidden;
    z-index: 10;
    box-sizing: border-box;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.colorScroll};
        border-radius: 10px;
    }
    overflow-y: auto;
    overflow-x: hidden;
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
`;

const LogoArea = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: ${({ $isopen }) => $isopen ? "0 8px 20px" : "0 0 20px"};
    justify-content: ${({ $isopen }) => $isopen ? "flex-start" : "center"};
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

        &:hover {
            background: ${({ theme }) => theme.bgAlpha};
        }

        &.active {
            background: rgba(37, 99, 235, 0.15);
            color: #60a5fa;
            .icon { filter: none; }
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

    &:hover { background: rgba(248, 113, 113, 0.12); color: #f87171; }
`;

const Bottom = styled.div`
    display: flex;
    justify-content: center;
    padding-top: 10px;
    border-top: 1px solid ${({ theme }) => theme.color2};
`;
