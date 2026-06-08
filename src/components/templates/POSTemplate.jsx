import { useState, useEffect } from "react";
import { v } from "../../styles/variables";
import styled from "styled-components";
import { useUsuariosStore, useEmpresaStore } from "../../index";

export function POSTemplate() {
    const { datausuarios } = useUsuariosStore();
    const { dataempresa } = useEmpresaStore();
    const [hora, setHora] = useState("");
    const [fecha, setFecha] = useState("");
    const [modoBusqueda, setModoBusqueda] = useState("teclado");
    const [verPago, setVerPago] = useState(false);

    useEffect(() => {
        const actualizar = () => {
            const ahora = new Date();
            setHora(ahora.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
            setFecha(ahora.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
        };
        actualizar();
        const intervalo = setInterval(actualizar, 1000);
        return () => clearInterval(intervalo);
    }, []);

    return (
        <Container>
            {/* HEADER */}
            <Header>
                <div className="usuario">
                    <div className="avatar">👤</div>
                    <div className="info">
                        <span className="nombre">{datausuarios?.nombres ?? "Usuario"}</span>
                        <span className="rol">🔵 cajero</span>
                    </div>
                </div>
                <div className="empresa">
                    🍬 {dataempresa?.razon_social ?? "Mi empresa"}
                </div>
                <div className="reloj">
                    <span className="hora">{hora}</span>
                    <span className="fecha">{fecha}</span>
                </div>
            </Header>

            {/* MAIN */}
            <Main>
                <Izquierda $oculto={verPago}>
                    {/* Barra de búsqueda */}
                    <FilaBusqueda>
                        <input placeholder="buscar..." />
                        <BtnModo
                            $activo={modoBusqueda === "lectora"}
                            onClick={() => setModoBusqueda("lectora")}
                        >
                            🔫 lectora
                        </BtnModo>
                        <BtnModo
                            $activo={modoBusqueda === "teclado"}
                            onClick={() => setModoBusqueda("teclado")}
                        >
                            ⌨️ teclado
                        </BtnModo>
                    </FilaBusqueda>

                    {/* Info producto seleccionado */}
                    <InfoProducto>
                        <span className="nombre-prod">— busca un producto —</span>
                    </InfoProducto>

                    {/* Lista del carrito */}
                    <Carrito>
                    </Carrito>

                    {/* Botón móvil para ver panel de pago */}
                    <BtnVerPago onClick={() => setVerPago(true)}>
                        💳 Ver pago — $ 0.00
                    </BtnVerPago>
                </Izquierda>

                <Derecha $visible={verPago}>
                    {/* Métodos de pago */}
                    <GridPagos>
                        <BtnPago $color="#4CAF50">EFECTIVO</BtnPago>
                        <BtnPago $color="#E91E8C">CRÉDITO</BtnPago>
                        <BtnPago $color="#FF9800">TARJETA</BtnPago>
                        <BtnPago $color="#9C27B0">MIXTO</BtnPago>
                    </GridPagos>

                    <Spacer />

                    {/* Totales */}
                    <Totales>
                        <div className="fila">
                            <span>Sub total:</span>
                            <span>$ 0.00</span>
                        </div>
                        <div className="fila">
                            <span>IVA (19%):</span>
                            <span>$ 0.00</span>
                        </div>
                        <div className="fila">
                            <span>Sub total:</span>
                            <span>$ 0.00</span>
                        </div>
                    </Totales>

                    {/* Botón total */}
                    <BtnTotal>
                        <span>💚</span>
                        <span className="monto">$ 0.00</span>
                    </BtnTotal>

                    {/* Botón volver al carrito — solo móvil */}
                    <BtnVolver onClick={() => setVerPago(false)}>
                        ← Volver al carrito
                    </BtnVolver>
                </Derecha>
            </Main>

            {/* FOOTER */}
            <Footer>
                <div className="fila1">
                    <BtnFooter>INS varios</BtnFooter>
                    <BtnFooter>Productos/servicio rapido</BtnFooter>
                    <BtnFooter>Ingreso dinero</BtnFooter>
                    <BtnFooter>Salida dinero</BtnFooter>
                    <BtnFooter>Ver ingresos y salidas</BtnFooter>
                    <BtnFooter>Cerrar caja</BtnFooter>
                </div>
                <div className="fila2">
                    <BtnEliminar>🗑️ Eliminar</BtnEliminar>
                    <BtnFooter>Ver ventas del día y Devoluciones</BtnFooter>
                </div>
            </Footer>
        </Container>
    );
}

const Container = styled.div`
    height: 100vh;
    display: grid;
    grid-template:
        "header" 70px
        "main"   1fr
        "footer" 90px
        / 1fr;
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    overflow: hidden;
    /* espacio para el MenuAmbur en móvil */
    padding-bottom: 60px;
    @media (min-width: 768px) { padding-bottom: 0; }
`;

const Header = styled.div`
    grid-area: header;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    background: ${({ theme }) => theme.bg3 || "rgba(0,0,0,0.2)"};
    border-bottom: 1px solid ${({ theme }) => theme.color2};

    .usuario {
        display: flex;
        align-items: center;
        gap: 10px;
        .avatar { font-size: 28px; }
        .info { display: flex; flex-direction: column; }
        .nombre { font-weight: 700; font-size: 14px; }
        .rol { font-size: 12px; opacity: 0.7; }
    }
    .empresa {
        font-weight: 700;
        font-size: 16px;
    }
    .reloj {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        .hora { font-weight: 700; font-size: 15px; }
        .fecha { font-size: 11px; opacity: 0.7; text-transform: capitalize; }
    }
`;

const Main = styled.div`
    grid-area: main;
    display: grid;
    grid-template-columns: 1fr;
    overflow: hidden;
    @media (min-width: 768px) {
        grid-template-columns: 1fr 320px;
    }
`;

const Izquierda = styled.div`
    display: ${({ $oculto }) => ($oculto ? "none" : "flex")};
    flex-direction: column;
    padding: 12px;
    gap: 10px;
    border-right: 1px solid ${({ theme }) => theme.color2};
    overflow: hidden;
    @media (min-width: 768px) {
        display: flex;
    }
`;

const FilaBusqueda = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
    input {
        flex: 1;
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid ${({ theme }) => theme.color2};
        background: ${({ theme }) => theme.bgtotal};
        color: ${({ theme }) => theme.text};
        font-size: 15px;
        outline: none;
    }
`;

const BtnModo = styled.button`
    padding: 8px 14px;
    border-radius: 8px;
    border: 2px solid ${({ $activo }) => ($activo ? "#4f46e5" : "rgba(150,150,150,0.3)")};
    background: ${({ $activo }) => ($activo ? "#4f46e5" : "transparent")};
    color: ${({ $activo }) => ($activo ? "#fff" : "inherit")};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
`;

const InfoProducto = styled.div`
    padding: 8px 12px;
    border-radius: 8px;
    background: ${({ theme }) => theme.bg3 || "rgba(150,150,150,0.1)"};
    font-size: 14px;
    .nombre-prod { opacity: 0.5; }
`;

const Carrito = styled.div`
    flex: 1;
    overflow-y: auto;
`;

const Derecha = styled.div`
    display: ${({ $visible }) => ($visible ? "flex" : "none")};
    flex-direction: column;
    padding: 14px;
    gap: 10px;
    @media (min-width: 768px) {
        display: flex;
    }
`;

const GridPagos = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
`;

const BtnPago = styled.button`
    padding: 18px 10px;
    border-radius: 12px;
    border: none;
    background: ${({ $color }) => $color};
    color: #fff;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    transition: 0.2s;
    &:hover { opacity: 0.85; }
`;

const Spacer = styled.div`flex: 1;`;

const Totales = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    .fila {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        padding: 2px 0;
    }
`;

const BtnTotal = styled.button`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-radius: 14px;
    border: none;
    background: #4CAF50;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
    .monto { font-size: 22px; font-weight: 800; }
    transition: 0.2s;
    &:hover { background: #43a047; }
`;

const Footer = styled.div`
    grid-area: footer;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px 12px;
    border-top: 1px solid ${({ theme }) => theme.color2};
    .fila1, .fila2 {
        display: flex;
        gap: 8px;
    }
`;

const BtnFooter = styled.button`
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: 0.2s;
    &:hover { background: ${({ theme }) => theme.bg3 || "rgba(150,150,150,0.2)"}; }
`;

const BtnEliminar = styled(BtnFooter)`
    background: #f44336;
    color: #fff;
    border-color: #f44336;
    &:hover { background: #e53935; }
`;
