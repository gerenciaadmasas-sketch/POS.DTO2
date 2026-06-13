import styled from "styled-components";
import { Btn1, Buscador, Title } from "../../index";
import { TablaClientes } from "../organismos/tablas/TablaClientes";
import { RegistrarCliente } from "../organismos/formularios/RegistrarCliente";
import { v } from "../../styles/variables";
import { useState } from "react";
import { useClientesStore } from "../../store/ClientesStore";

export function ClientesTemplate() {
    const [openRegistro, SetopenRegistro] = useState(false);
    const { dataclientes, setBuscador } = useClientesStore();
    const [accion, setAccion] = useState("");
    const [dataSelect, setdataSelect] = useState([]);

    function nuevoRegistro() {
        SetopenRegistro(!openRegistro);
        setAccion("Nuevo");
        setdataSelect([]);
    }

    return (
        <Container>
            {openRegistro && (
                <RegistrarCliente
                    onClose={() => SetopenRegistro(false)}
                    dataSelect={dataSelect}
                    accion={accion}
                />
            )}
            <section className="area1">
                <Title>Clientes</Title>
                <Btn1
                    funcion={nuevoRegistro}
                    bgcolor="#f88533"
                    titulo="nuevo"
                    icono={<v.iconoagregar />}
                />
            </section>
            <section className="area2">
                <Buscador setBuscador={setBuscador} />
            </section>
            <section className="main">
                <TablaClientes
                    data={dataclientes}
                    SetopenRegistro={SetopenRegistro}
                    setdataSelect={setdataSelect}
                    setAccion={setAccion}
                />
            </section>
        </Container>
    );
}

const Container = styled.div`
    height: calc(100vh - 30px);
    padding: 15px;
    display: grid;
    grid-template:
        "area1" 60px
        "area2" 60px
        "main" auto;

    @media (max-width: 767px) { padding-top: 68px; }

    .area1 {
        grid-area: area1;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: end;
        gap: 15px;
    }
    .area2 {
        grid-area: area2;
        display: flex;
        justify-content: end;
        align-items: center;
    }
    .main {
        grid-area: main;
    }
`;
