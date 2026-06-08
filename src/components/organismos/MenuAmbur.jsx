import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";
import { LinksArray, SecondarylinksArray } from "../../utils/dataEstatica";

export function MenuAmbur() {
    const todos = [...LinksArray, ...SecondarylinksArray];
    return (
        <Container>
            {todos.map(({ icon, label, to, color }) => (
                <NavLink
                    key={label}
                    to={to}
                    className={({ isActive }) => isActive ? "link active" : "link"}
                >
                    <Icon icon={icon} color={color} className="icono" />
                    <span>{label}</span>
                </NavLink>
            ))}
        </Container>
    );
}

const Container = styled.nav`
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 60px;
    background: ${({ theme }) => theme.bgtotal};
    border-top: 2px solid ${({ theme }) => theme.color2};
    display: flex;
    align-items: center;
    justify-content: space-around;
    z-index: 100;

    .link {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        text-decoration: none;
        color: ${({ theme }) => theme.text};
        opacity: 0.5;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        transition: 0.2s;

        .icono { font-size: 22px; }

        &.active {
            opacity: 1;
            color: ${({ theme }) => theme.color1};
        }
    }
`;
