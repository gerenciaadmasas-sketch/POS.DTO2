import styled from "styled-components";
import { useState } from "react";
import { Title } from "../../index";
import { TablaComprobantes } from "../organismos/tablas/TablaComprobantes";
import { EditarComprobanteModal } from "../organismos/formularios/EditarComprobante";

export function SerializacionTemplate() {
    const [itemEdit, setItemEdit] = useState(null);

    return (
        <Container>
            <section className="area1">
                <Title>Comprobantes</Title>
            </section>
            <section className="main">
                <TablaComprobantes onEditar={(item) => setItemEdit(item)} />
            </section>

            {itemEdit && (
                <EditarComprobanteModal
                    data={itemEdit}
                    onClose={() => setItemEdit(null)}
                />
            )}
        </Container>
    );
}

const Container = styled.div`
    height: calc(100vh - 30px);
    padding: 15px;
    display: grid;
    grid-template:
        "area1" 60px
        "main"  auto / 1fr;
    overflow-y: auto;

    @media (max-width: 767px) {
        padding-top: 68px;
    }

    .area1 {
        grid-area: area1;
        display: flex;
        align-items: center;
    }
    .main {
        grid-area: main;
    }
`;
