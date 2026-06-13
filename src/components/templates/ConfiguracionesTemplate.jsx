import styled from "styled-components";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useEffect, useRef } from "react";
import { useModulosStore } from "../../store/ModulosStore";

export function ConfiguracionesTemplate() {
    const { dataModulos = [] } = useModulosStore();
    const gridRef = useRef(null);

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
                {dataModulos.map((item, index) => {
                    // Si tiene link definido, es navegable — ignora campo activo/check/state del DB
                    const activo = !!(item.link);
                    const isUrl = item.icono?.startsWith("http");
                    return (
                        <CardWrap key={index} className="card" $activo={activo}>
                            <CardInner
                                to={activo ? item.link : "#"}
                                as={activo ? Link : "div"}
                                $activo={activo}
                            >
                                <IconArea>
                                    {isUrl ? (
                                        <img src={item.icono} alt={item.nombre} />
                                    ) : (
                                        <Icon icon={item.icono ?? "mdi:cog-outline"} />
                                    )}
                                </IconArea>
                                <Info>
                                    <h3>{item.nombre}</h3>
                                    <p>{item.descripcion}</p>
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
    padding: 24px 20px;
    box-sizing: border-box;
    overflow-y: auto;

    @media (max-width: 767px) {
        padding: 68px 12px 20px;
    }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    max-width: 860px;

    &:hover > .card::after { opacity: 1; }

    @media (max-width: 700px) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 420px) { grid-template-columns: 1fr; }
`;

const CardWrap = styled.div`
    border-radius: 20px;
    cursor: ${({ $activo }) => $activo ? "pointer" : "default"};

    /* altura necesaria para que absolute-inset funcione */
    height: 200px;

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
        font-size: 58px;
        color: ${({ theme }) => theme.text};
        opacity: 0.7;
        transition: opacity 0.3s;
    }

    ${CardWrap}:hover & {
        img { filter: grayscale(0); }
        svg, .iconify { opacity: 1; }
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
