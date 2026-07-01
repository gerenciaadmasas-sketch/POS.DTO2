import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { RiArrowLeftSLine } from "react-icons/ri";

export function Planes() {
    const navigate = useNavigate();
    return (
        <Wrap>
            <BtnVolver onClick={() => navigate("/")}>
                <RiArrowLeftSLine size={18} /> volver
            </BtnVolver>
            <Titulo>Planes y precios</Titulo>
            <Sub>Próximamente — estamos preparando algo increíble para ti.</Sub>
        </Wrap>
    );
}

const Wrap = styled.div`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: ${({ theme }) => theme.bgtotal};
    padding: 40px 24px;
`;

const BtnVolver = styled.button`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 7px 14px 7px 10px;
    border-radius: 999px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards};
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 13px;
    font-weight: 700;
    font-family: "Poppins", sans-serif;
    cursor: pointer;
    transition: all 0.18s ease;
    &:hover { border-color: #f88533; color: #f88533; }
`;

const Titulo = styled.h1`
    font-size: 32px;
    font-weight: 900;
    color: ${({ theme }) => theme.text};
    margin: 0;
`;

const Sub = styled.p`
    font-size: 15px;
    color: ${({ theme }) => theme.colorSubtitle};
    margin: 0;
`;
