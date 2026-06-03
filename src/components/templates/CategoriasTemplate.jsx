import styled from "styled-components";
import { Btn1, Buscador, RegistrarCategorias, TablaCategorias, Title, useCategoriasStore } from "../../index"
import { v } from "../../styles/variables"
import { useState } from "react"
import ConfettiExplosion from 'react-confetti-explosion';
export function CategoriasTemplate() {
    const [openRegistro, SetopenRegistro] = useState(false);
    const { datacategorias, setBuscador } = useCategoriasStore()
    const [accion, setAccion] = useState("");
    const [dataSelect, setdataSelect] = useState([]);
    const [isExploding, setIsExploiding] = useState(false)
    function nuevoRegistro() {
        SetopenRegistro(!openRegistro);
        setAccion("Nuevo");
        setdataSelect([]);
        setIsExploiding(false)
    }
    return (<Container>
        {openRegistro && (
            <RegistrarCategorias setIsExploding={setIsExploiding}
                onClose={() => SetopenRegistro(!openRegistro)}
                dataSelect={dataSelect}
                accion={accion}
            />
        )}
        <section className="area1">
            <Title>Categoria</Title>
            <Btn1 funcion={nuevoRegistro}
                bgcolor={v.colorPrincipal}
                titulo="nuevo"
                icono={<v.iconoagregar />} />
        </section>
        <section className="area2">
            <Buscador
                setBuscador={ setBuscador}
            />
        </section>
        <section className="main">
            {
                isExploding && <ConfettiExplosion />
            }
            <TablaCategorias
                data={datacategorias}
                SetopenRegistro={SetopenRegistro}
                setdataSelect={setdataSelect}
                setAccion={setAccion}
            />
        </section>
    </Container>);
}
const Container = styled.div`
    height:calc(100vh - 30px);
    padding: 15px;
    display: grid;
    grid-template: 
    "area1" 60px
    "area2" 60px
    "main" auto;
    .area1{
    grid-area: area1;
    //background-color: rgba(103,93,241,0.14);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: end;
        gap: 15px;
    }
    .area2{
    grid-area: area2;
    //background-color: rgba(252, 13, 13, 0.14);
    display: flex;
    justify-content: end;
    align-items: center;
    }
    .main{
    grid-area: main;
    background-color: rgba(252, 236, 13, 0.14);
    }
`