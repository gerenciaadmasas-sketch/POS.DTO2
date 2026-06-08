import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { useUsuariosStore, useEmpresaStore, useSucursalesStore, BuscarProductos, BuscarProductoPorCodigo, UserAuth, RegistrarVenta, Lottieanimacion } from "../../index";
import { toastExito, toastWarning } from "../../utils/toast";
import vacioanimacion from "../../assets/vacioanimacion.json";
import { RiDeleteBin2Line } from "react-icons/ri";
import { Switch1 } from "../../index";

export function POSTemplate() {
    const { datausuarios } = useUsuariosStore();
    const { dataempresa } = useEmpresaStore();
    const { dataSucursales, mostrarSucursales } = useSucursalesStore();
    const { user } = UserAuth();

    useQuery({
        queryKey: ["sucursales-pos", dataempresa?.id],
        queryFn: () => mostrarSucursales({ id_empresa: dataempresa.id }),
        enabled: !!dataempresa?.id && dataSucursales.length === 0,
        refetchOnWindowFocus: false,
    });

    const nombreMostrar = (datausuarios?.nombres && datausuarios.nombres !== "-")
        ? datausuarios.nombres
        : (user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "Usuario");

    const [hora, setHora] = useState("");
    const [fecha, setFecha] = useState("");
    const [lectora, setLectora] = useState(false);
    const [verPago, setVerPago] = useState(false);
    const [carrito, setCarrito] = useState([]);

    // Pago
    const [metodoPago, setMetodoPago] = useState(null);
    const [pagaCon, setPagaCon] = useState("");
    const [mixto, setMixto] = useState({ efectivo: "", tarjeta: "", credito: "" });
    const [cobrando, setCobrando] = useState(false);

    // Búsqueda
    const [busqueda, setBusqueda] = useState("");
    const [resultados, setResultados] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [dropdownAbierto, setDropdownAbierto] = useState(false);
    const [estadoLectora, setEstadoLectora] = useState(null); // "ok" | "error" | null
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    const sucursal = dataSucursales?.[0]?.nombre ?? "Principal";

    // Reloj
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

    // Cerrar dropdown al hacer clic afuera
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setDropdownAbierto(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Autofoco cuando se activa modo lectora
    useEffect(() => {
        if (lectora) {
            setBusqueda("");
            setResultados([]);
            setDropdownAbierto(false);
            inputRef.current?.focus();
        }
    }, [lectora]);

    // Lectora: busca por código de barras al presionar Enter
    const manejarEnterLectora = async () => {
        const codigo = busqueda.trim();
        if (!codigo || !dataempresa?.id) return;
        setBuscando(true);
        try {
            const producto = await BuscarProductoPorCodigo({ codigo_barra: codigo, id_empresa: dataempresa.id });
            if (producto) {
                agregarAlCarrito(producto);
                setEstadoLectora("ok");
            } else {
                setEstadoLectora("error");
                setBusqueda("");
            }
        } finally {
            setBuscando(false);
            setTimeout(() => setEstadoLectora(null), 1200);
            inputRef.current?.focus();
        }
    };

    // Búsqueda con debounce 400ms
    const buscar = useCallback((texto) => {
        setBusqueda(texto);
        if (!texto.trim()) {
            setResultados([]);
            setDropdownAbierto(false);
            return;
        }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            if (!dataempresa?.id) return;
            setBuscando(true);
            try {
                const data = await BuscarProductos({ id_empresa: dataempresa.id, descripcion: texto });
                setResultados(data ?? []);
                setDropdownAbierto(true);
            } finally {
                setBuscando(false);
            }
        }, 400);
    }, [dataempresa?.id]);

    // Agregar producto al carrito
    const agregarAlCarrito = (producto) => {
        setBusqueda("");
        setResultados([]);
        setDropdownAbierto(false);
        const esGranel = producto.sevende_por === "Granel";
        const paso = esGranel ? 0.5 : 1;
        setCarrito(prev => {
            const existe = prev.find(i => i.id === producto.id);
            if (existe) {
                return prev.map(i =>
                    i.id === producto.id
                        ? { ...i, cantidad: parseFloat((i.cantidad + paso).toFixed(2)) }
                        : i
                );
            }
            return [...prev, {
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio_venta,
                aplica_iva: producto.aplica_iva ?? false,
                maneja_inventarios: producto.maneja_inventarios ?? false,
                esGranel,
                cantidad: paso,
            }];
        });
    };

    const cambiarCantidad = (id, delta) => {
        setCarrito(prev =>
            prev.map(i => {
                if (i.id !== id) return i;
                const paso = i.esGranel ? 0.5 : 1;
                const minimo = i.esGranel ? 0.5 : 1;
                const nueva = parseFloat((i.cantidad + paso * delta).toFixed(2));
                return { ...i, cantidad: Math.max(minimo, nueva) };
            })
        );
    };

    const eliminarItem = (id) => setCarrito(prev => prev.filter(i => i.id !== id));
    const resetear = () => setCarrito([]);

    // Totales: IVA solo a productos que lo tienen
    const subtotalSinIva = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
    const ivaTotal = carrito
        .filter(i => i.aplica_iva)
        .reduce((acc, i) => acc + i.precio * i.cantidad * 0.19, 0);
    const total = subtotalSinIva + ivaTotal;

    const formatCOP = (val) =>
        new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(val);

    // Cálculos de pago
    const cambio = metodoPago === "efectivo"
        ? (parseFloat(pagaCon) || 0) - total
        : 0;

    const totalMixto = metodoPago === "mixto"
        ? (parseFloat(mixto.efectivo) || 0) + (parseFloat(mixto.tarjeta) || 0) + (parseFloat(mixto.credito) || 0)
        : 0;
    const faltaMixto = total - totalMixto;

    const pagoValido =
        carrito.length > 0 &&
        metodoPago !== null &&
        (metodoPago === "efectivo" ? (parseFloat(pagaCon) || 0) >= total :
         metodoPago === "mixto"    ? Math.abs(faltaMixto) < 1 :
         true);

    const seleccionarMetodo = (m) => {
        setMetodoPago(m);
        setPagaCon("");
        setMixto({ efectivo: "", tarjeta: "", credito: "" });
    };

    const cobrar = async () => {
        if (!pagoValido || cobrando) return;
        if (!datausuarios?.id)   { toastWarning("No se encontró el usuario activo.", "POS › Cobrar"); return; }
        if (!dataempresa?.id)    { toastWarning("No se encontró la empresa.",        "POS › Cobrar"); return; }
        if (!dataSucursales?.[0]?.id) { toastWarning("No se encontró la sucursal.", "POS › Cobrar"); return; }

        setCobrando(true);
        try {
            const detalle = carrito.map(i => {
                const sub  = parseFloat((i.precio * i.cantidad).toFixed(2));
                const iva  = i.aplica_iva ? parseFloat((sub * 0.19).toFixed(2)) : 0;
                return {
                    id_producto:        i.id,
                    nombre:             i.nombre,
                    precio_unitario:    i.precio,
                    cantidad:           i.cantidad,
                    es_granel:          i.esGranel,
                    aplica_iva:         i.aplica_iva,
                    maneja_inventarios: i.maneja_inventarios,
                    subtotal:           sub,
                    iva,
                    total_item:         parseFloat((sub + iva).toFixed(2)),
                };
            });

            const idVenta = await RegistrarVenta({
                id_empresa:     dataempresa.id,
                id_sucursal:    dataSucursales[0].id,
                id_usuario:     datausuarios.id,
                subtotal:       subtotalSinIva,
                iva:            ivaTotal,
                total,
                metodo_pago:    metodoPago,
                paga_con:       metodoPago === "efectivo" ? parseFloat(pagaCon) : 0,
                cambio:         metodoPago === "efectivo" ? Math.max(0, cambio)  : 0,
                mixto_efectivo: metodoPago === "mixto" ? parseFloat(mixto.efectivo) || 0 : 0,
                mixto_tarjeta:  metodoPago === "mixto" ? parseFloat(mixto.tarjeta)  || 0 : 0,
                mixto_credito:  metodoPago === "mixto" ? parseFloat(mixto.credito)  || 0 : 0,
                detalle,
            });

            toastExito(`Venta #${idVenta} registrada por ${formatCOP(total)}`, "POS › Cobrar");
            // Reiniciar todo
            setCarrito([]);
            setMetodoPago(null);
            setPagaCon("");
            setMixto({ efectivo: "", tarjeta: "", credito: "" });
            setVerPago(false);
        } finally {
            setCobrando(false);
        }
    };

    return (
        <Container>
            {/* HEADER */}
            <Header>
                <FilaSucursal>SUCURSAL: {sucursal}</FilaSucursal>
                <FilaInfo>
                    <div className="usuario">
                        <Avatar src={user?.user_metadata?.avatar_url} alt="foto">
                            {!user?.user_metadata?.avatar_url && "👤"}
                        </Avatar>
                        <div className="info">
                            <span className="nombre">{nombreMostrar}</span>
                            <span className="rol">💰 cajero</span>
                        </div>
                    </div>
                    <div className="empresa">🍬 {dataempresa?.razon_social ?? "Mi empresa"}</div>
                    <div className="reloj">
                        <span className="hora"><DotVerde /> {hora}</span>
                        <span className="fecha">{fecha}</span>
                    </div>
                </FilaInfo>
            </Header>

            {/* MAIN */}
            <Main>
                <Izquierda $oculto={verPago}>
                    {/* Búsqueda */}
                    <WrapBusqueda ref={wrapperRef}>
                        <FilaBusqueda>
                            <InputBusqueda
                                ref={inputRef}
                                $estado={estadoLectora}
                                placeholder={lectora ? "escanea o escribe el código..." : "buscar producto..."}
                                value={busqueda}
                                onChange={e => {
                                    if (lectora) {
                                        setBusqueda(e.target.value);
                                    } else {
                                        buscar(e.target.value);
                                    }
                                }}
                                onKeyDown={e => {
                                    if (lectora && e.key === "Enter") manejarEnterLectora();
                                }}
                                onFocus={() => !lectora && resultados.length > 0 && setDropdownAbierto(true)}
                                autoComplete="off"
                            />
                            {lectora && estadoLectora && (
                                <MensajeLectora $tipo={estadoLectora}>
                                    {estadoLectora === "ok" ? "✔ agregado" : "✘ no encontrado"}
                                </MensajeLectora>
                            )}
                            <ModoControl>
                                <span className={!lectora ? "label inactivo" : "label"}>Lectora</span>
                                <Switch1 state={lectora} setState={() => setLectora(!lectora)} />
                                <BtnTeclado $activo={!lectora} onClick={() => setLectora(false)}>
                                    Teclado
                                </BtnTeclado>
                            </ModoControl>
                        </FilaBusqueda>

                        {/* Dropdown resultados — solo en modo teclado */}
                        {!lectora && dropdownAbierto && (
                            <Dropdown>
                                {buscando ? (
                                    <ItemDropdown $disabled>buscando...</ItemDropdown>
                                ) : resultados.length === 0 ? (
                                    <ItemDropdown $disabled>Sin resultados para "{busqueda}"</ItemDropdown>
                                ) : (
                                    resultados.map(p => (
                                        <ItemDropdown key={p.id} onClick={() => agregarAlCarrito(p)}>
                                            <span className="nombre">{p.nombre}</span>
                                            <span className="precio">{formatCOP(p.precio_venta)}</span>
                                        </ItemDropdown>
                                    ))
                                )}
                            </Dropdown>
                        )}
                    </WrapBusqueda>

                    {/* Carrito */}
                    <Carrito>
                        {carrito.length === 0 ? (
                            <Vacio>
                                <Lottieanimacion alto={160} ancho={160} animacion={vacioanimacion} />
                                <span>busca un producto para agregarlo</span>
                            </Vacio>
                        ) : (
                            carrito.map(item => (
                                <ItemCarrito key={item.id}>
                                    <div className="info-prod">
                                        <div className="fila-nombre">
                                            <span className="cantidad-nombre">
                                                {item.esGranel
                                                    ? `${item.cantidad} kg`
                                                    : `${item.cantidad}`
                                                } {item.nombre}
                                            </span>
                                            {item.aplica_iva && <BadgeIva>IVA</BadgeIva>}
                                        </div>
                                        <span className="precio-unit">
                                            {formatCOP(item.precio)}{item.esGranel ? " / kg" : " / und"}
                                        </span>
                                    </div>
                                    <div className="acciones">
                                        <BtnCantidad onClick={() => cambiarCantidad(item.id, 1)}>+</BtnCantidad>
                                        <BtnCantidad onClick={() => cambiarCantidad(item.id, -1)}>−</BtnCantidad>
                                        <span className="precio-total">{formatCOP(item.precio * item.cantidad)}</span>
                                        <BtnTrash onClick={() => eliminarItem(item.id)}>
                                            <RiDeleteBin2Line />
                                        </BtnTrash>
                                    </div>
                                </ItemCarrito>
                            ))
                        )}
                    </Carrito>

                    <BtnVerPago onClick={() => setVerPago(true)}>
                        💳 Ver pago — {formatCOP(total)}
                    </BtnVerPago>
                </Izquierda>

                {/* Panel derecho */}
                <Derecha $visible={verPago}>
                    {/* Métodos de pago */}
                    <GridPagos>
                        <BtnPago $color="#4CAF50" $shadow="#2E7D32" $activo={metodoPago === "efectivo"}
                            onClick={() => seleccionarMetodo("efectivo")}>EFECTIVO</BtnPago>
                        <BtnPago $color="#E91E8C" $shadow="#880E4F" $activo={metodoPago === "credito"}
                            onClick={() => seleccionarMetodo("credito")}>CRÉDITO</BtnPago>
                        <BtnPago $color="#FF9800" $shadow="#E65100" $activo={metodoPago === "tarjeta"}
                            onClick={() => seleccionarMetodo("tarjeta")}>TARJETA</BtnPago>
                        <BtnPago $color="#9C27B0" $shadow="#4A148C" $activo={metodoPago === "mixto"}
                            onClick={() => seleccionarMetodo("mixto")}>MIXTO</BtnPago>
                    </GridPagos>

                    {/* Panel efectivo */}
                    {metodoPago === "efectivo" && (
                        <PanelPago>
                            <label>Paga con</label>
                            <InputPago
                                type="number"
                                min="0"
                                placeholder="$ 0"
                                value={pagaCon}
                                onChange={e => setPagaCon(e.target.value)}
                                autoFocus
                            />
                            {pagaCon !== "" && (
                                <FilaCambio $negativo={cambio < 0}>
                                    <span>{cambio >= 0 ? "Cambio:" : "Falta:"}</span>
                                    <span>{formatCOP(Math.abs(cambio))}</span>
                                </FilaCambio>
                            )}
                        </PanelPago>
                    )}

                    {/* Panel mixto */}
                    {metodoPago === "mixto" && (
                        <PanelPago>
                            {[
                                { key: "efectivo", label: "Efectivo",  color: "#4CAF50" },
                                { key: "tarjeta",  label: "Tarjeta",   color: "#FF9800" },
                                { key: "credito",  label: "Crédito",   color: "#E91E8C" },
                            ].map(({ key, label, color }) => (
                                <FilaMixto key={key}>
                                    <DotColor $color={color} />
                                    <span>{label}</span>
                                    <InputPago
                                        type="number"
                                        min="0"
                                        placeholder="$ 0"
                                        value={mixto[key]}
                                        onChange={e => setMixto(prev => ({ ...prev, [key]: e.target.value }))}
                                    />
                                </FilaMixto>
                            ))}
                            <FilaCambio $negativo={faltaMixto > 0}>
                                <span>{faltaMixto > 0 ? "Falta:" : faltaMixto < -0.9 ? "Excede:" : "✔ Completo"}</span>
                                {Math.abs(faltaMixto) >= 1 && <span>{formatCOP(Math.abs(faltaMixto))}</span>}
                            </FilaCambio>
                        </PanelPago>
                    )}

                    <Spacer />

                    <Totales>
                        <div className="fila">
                            <span>Sub total:</span>
                            <span>{formatCOP(subtotalSinIva)}</span>
                        </div>
                        <div className="fila">
                            <span>IVA (19%):</span>
                            <span>{formatCOP(ivaTotal)}</span>
                        </div>
                        <div className="fila total-row">
                            <span>Total:</span>
                            <span>{formatCOP(total)}</span>
                        </div>
                    </Totales>

                    <WrapTotal>
                        <BtnTotal $activo={pagoValido && !cobrando} onClick={cobrar}>
                            <span>{cobrando ? "⏳" : "💚"}</span>
                            <span className="monto">
                                {cobrando ? "Registrando..." : formatCOP(total)}
                            </span>
                        </BtnTotal>
                        <BtnResetear onClick={resetear}>resetear</BtnResetear>
                    </WrapTotal>

                    <BtnVolver onClick={() => setVerPago(false)}>← Volver al carrito</BtnVolver>
                </Derecha>
            </Main>

            {/* FOOTER */}
            <Footer>
                <BtnEliminar onClick={resetear}>Eliminar</BtnEliminar>
            </Footer>
        </Container>
    );
}

/* ── STYLED COMPONENTS ─────────────────────────────── */

const Container = styled.div`
    height: 100vh;
    display: grid;
    grid-template:
        "header" auto
        "main"   1fr
        "footer" 56px
        / 1fr;
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    overflow: hidden;
    padding-bottom: 60px;
    @media (min-width: 768px) { padding-bottom: 0; }
`;

const Header = styled.div`
    grid-area: header;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const FilaSucursal = styled.div`
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    opacity: 0.6;
    padding: 4px 20px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const FilaInfo = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 20px;
    .usuario {
        display: flex; align-items: center; gap: 10px;
        .avatar { font-size: 26px; }
        .info { display: flex; flex-direction: column; }
        .nombre { font-weight: 700; font-size: 14px; }
        .rol { font-size: 12px; opacity: 0.7; }
    }
    .empresa { font-weight: 700; font-size: 15px; }
    .reloj {
        display: flex; flex-direction: column; align-items: flex-end;
        .hora { font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 6px; }
        .fecha { font-size: 11px; opacity: 0.7; text-transform: capitalize; }
    }
`;

const Avatar = styled.div`
    width: 38px; height: 38px; border-radius: 50%;
    background: ${({ src, theme }) => src ? "transparent" : (theme.bg3 || "#333")};
    background-image: ${({ src }) => src ? `url(${src})` : "none"};
    background-size: cover; background-position: center;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; flex-shrink: 0;
    border: 2px solid ${({ theme }) => theme.color2};
`;

const DotVerde = styled.span`
    width: 8px; height: 8px; border-radius: 50%;
    background: #4CAF50; display: inline-block;
    box-shadow: 0 0 6px #4CAF50;
`;

const Main = styled.div`
    grid-area: main;
    display: grid;
    grid-template-columns: 1fr;
    overflow: hidden;
    @media (min-width: 768px) { grid-template-columns: 1fr 300px; }
`;

const Izquierda = styled.div`
    display: ${({ $oculto }) => ($oculto ? "none" : "flex")};
    flex-direction: column;
    padding: 12px;
    gap: 10px;
    border-right: 1px solid ${({ theme }) => theme.color2};
    overflow: hidden;
    @media (min-width: 768px) { display: flex; }
`;

const WrapBusqueda = styled.div`
    position: relative;
`;

const FilaBusqueda = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;
    position: relative;
`;

const InputBusqueda = styled.input`
    flex: 1;
    padding: 10px 14px;
    border-radius: 10px;
    border: 2px solid ${({ $estado, theme }) =>
        $estado === "ok" ? "#4CAF50" :
        $estado === "error" ? "#f44336" :
        theme.color2};
    background: ${({ $estado, theme }) =>
        $estado === "ok" ? "rgba(76,175,80,0.08)" :
        $estado === "error" ? "rgba(244,67,54,0.08)" :
        theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    &:focus { border-color: ${({ $estado }) => $estado ? undefined : "#4f46e5"}; }
`;

const MensajeLectora = styled.span`
    position: absolute;
    left: 14px;
    bottom: -22px;
    font-size: 12px;
    font-weight: 700;
    color: ${({ $tipo }) => $tipo === "ok" ? "#4CAF50" : "#f44336"};
`;

const Dropdown = styled.ul`
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: ${({ theme }) => theme.bg3 || "#1e1e2e"};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 10px;
    list-style: none;
    margin: 0; padding: 6px 0;
    z-index: 200;
    max-height: 260px;
    overflow-y: auto;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
`;

const ItemDropdown = styled.li`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
    opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};
    transition: background 0.15s;
    &:hover {
        background: ${({ $disabled, theme }) =>
            $disabled ? "transparent" : (theme.color2 || "rgba(255,255,255,0.08)")};
    }
    .nombre { font-size: 14px; font-weight: 500; }
    .precio { font-size: 13px; font-weight: 700; color: #4CAF50; }
`;

const ModoControl = styled.div`
    display: flex; align-items: center; gap: 8px;
    .label { font-size: 13px; font-weight: 600; opacity: 1; }
    .label.inactivo { opacity: 0.4; }
`;

const BtnTeclado = styled.button`
    padding: 8px 18px;
    border-radius: 8px;
    border: 2px solid ${({ $activo }) => $activo ? "#3730a3" : "#555"};
    background: ${({ $activo }) => ($activo ? "#4f46e5" : "#fff")};
    color: ${({ $activo }) => ($activo ? "#fff" : "#323232")};
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: ${({ $activo }) => $activo ? "4px 4px #3730a3" : "4px 4px #555"};
    transition: box-shadow 0.1s, transform 0.1s;
    &:active { box-shadow: 2px 2px ${({ $activo }) => $activo ? "#3730a3" : "#555"}; transform: translate(2px, 2px); }
`;

const Carrito = styled.div`
    flex: 1; overflow-y: auto;
    display: flex; flex-direction: column; gap: 6px;
`;

const Vacio = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    opacity: 0.6;
    span { font-size: 13px; }
`;

const ItemCarrito = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px; border-radius: 10px;
    background: ${({ theme }) => theme.bg3 || "rgba(150,150,150,0.08)"};
    gap: 10px;
    .info-prod {
        display: flex; flex-direction: column; gap: 2px;
        .fila-nombre { display: flex; align-items: center; gap: 6px; }
        .cantidad-nombre { font-weight: 600; font-size: 14px; }
        .precio-unit { font-size: 12px; opacity: 0.6; }
    }
    .acciones {
        display: flex; align-items: center; gap: 8px;
        .precio-total { font-weight: 700; font-size: 14px; min-width: 80px; text-align: right; }
    }
`;

const BadgeIva = styled.span`
    font-size: 10px; font-weight: 700;
    padding: 1px 5px; border-radius: 4px;
    background: rgba(255,152,0,0.15);
    color: #FF9800;
    border: 1px solid rgba(255,152,0,0.4);
`;

const BtnCantidad = styled.button`
    width: 30px; height: 30px; border-radius: 8px;
    border: 2px solid #4f46e5;
    background: ${({ theme }) => theme.bgtotal};
    color: #4f46e5;
    font-size: 18px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 3px 3px #3730a3;
    transition: box-shadow 0.1s, transform 0.1s;
    &:active { box-shadow: 1px 1px #3730a3; transform: translate(2px, 2px); }
`;

const BtnTrash = styled.button`
    background: #fff; border: 2px solid #b71c1c; color: #f44336;
    font-size: 18px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 8px;
    box-shadow: 3px 3px #b71c1c;
    transition: box-shadow 0.1s, transform 0.1s;
    &:active { box-shadow: 1px 1px #b71c1c; transform: translate(2px, 2px); }
`;

const Derecha = styled.div`
    display: ${({ $visible }) => ($visible ? "flex" : "none")};
    flex-direction: column; padding: 14px; gap: 10px;
    @media (min-width: 768px) { display: flex; }
`;

const GridPagos = styled.div`
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
`;

const BtnPago = styled.button`
    padding: 20px 10px;
    border-radius: 12px;
    border: 2px solid ${({ $shadow }) => $shadow};
    background: ${({ $color }) => $color};
    color: #fff;
    font-weight: 800;
    font-size: 14px;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: box-shadow 0.1s, transform 0.1s, opacity 0.2s;
    opacity: ${({ $activo }) => $activo ? 1 : 0.55};
    box-shadow: ${({ $activo, $shadow }) => $activo ? `2px 2px ${$shadow}` : `4px 4px ${$shadow}`};
    transform: ${({ $activo }) => $activo ? "translate(2px, 2px)" : "none"};
    &:hover { opacity: 1; }
    &:active { box-shadow: 2px 2px ${({ $shadow }) => $shadow}; transform: translate(2px, 2px); }
`;

const PanelPago = styled.div`
    display: flex; flex-direction: column; gap: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    background: ${({ theme }) => theme.bg3 || "rgba(150,150,150,0.07)"};
    label { font-size: 12px; opacity: 0.6; font-weight: 600; text-transform: uppercase; }
`;

const InputPago = styled.input`
    width: 100%; padding: 10px 12px; border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 16px; font-weight: 700; outline: none;
    box-sizing: border-box;
    &:focus { border-color: #4f46e5; }
`;

const FilaCambio = styled.div`
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 2px;
    font-size: 13px; font-weight: 700;
    color: ${({ $negativo }) => $negativo ? "#f87171" : "#4ade80"};
`;

const FilaMixto = styled.div`
    display: flex; align-items: center; gap: 8px;
    span:nth-child(2) { font-size: 13px; font-weight: 600; flex: 1; }
    ${InputPago} { flex: 0 0 110px; width: 110px; font-size: 14px; }
`;

const DotColor = styled.span`
    width: 10px; height: 10px; border-radius: 50%;
    background: ${({ $color }) => $color};
    flex-shrink: 0;
`;

const Spacer = styled.div`flex: 1;`;

const Totales = styled.div`
    display: flex; flex-direction: column; gap: 4px;
    .fila {
        display: flex; justify-content: space-between;
        font-size: 13px; padding: 2px 0; opacity: 0.75;
    }
    .total-row { opacity: 1; font-weight: 600; }
`;

const WrapTotal = styled.div`display: flex; flex-direction: column; gap: 4px;`;

const BtnTotal = styled.button`
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; border-radius: 14px 14px 0 0;
    border: 2px solid ${({ $activo }) => $activo ? "#2E7D32" : "#555"};
    background: ${({ $activo }) => $activo ? "#4CAF50" : "rgba(150,150,150,0.2)"};
    color: ${({ $activo }) => $activo ? "#fff" : "rgba(255,255,255,0.35)"};
    cursor: ${({ $activo }) => $activo ? "pointer" : "not-allowed"};
    font-size: 14px;
    .monto { font-size: 22px; font-weight: 800; }
    box-shadow: ${({ $activo }) => $activo ? "4px 4px #2E7D32" : "none"};
    transition: box-shadow 0.1s, transform 0.1s;
    &:active { ${({ $activo }) => $activo ? "box-shadow: 2px 2px #2E7D32; transform: translate(2px, 2px);" : ""} }
`;

const BtnResetear = styled.button`
    text-align: center; padding: 6px;
    border-radius: 0 0 14px 14px;
    border: 2px solid #1B5E20; border-top: none;
    background: #388E3C; color: rgba(255,255,255,0.8);
    font-size: 12px; cursor: pointer;
    box-shadow: 4px 4px #1B5E20;
    transition: box-shadow 0.1s, transform 0.1s;
    &:active { box-shadow: 2px 2px #1B5E20; transform: translate(2px, 2px); }
`;

const Footer = styled.div`
    grid-area: footer;
    display: flex; align-items: center; gap: 10px;
    padding: 0 12px; border-top: 1px solid ${({ theme }) => theme.color2};
`;

const BtnFooter = styled.button`
    padding: 8px 16px; border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; cursor: pointer; white-space: nowrap; transition: 0.2s;
    &:hover { background: ${({ theme }) => theme.bg3 || "rgba(150,150,150,0.2)"}; }
`;

const BtnEliminar = styled(BtnFooter)`
    border: 2px solid #b71c1c;
    color: #f44336;
    box-shadow: 4px 4px #b71c1c;
    transition: box-shadow 0.1s, transform 0.1s;
    &:active { box-shadow: 2px 2px #b71c1c; transform: translate(2px, 2px); }
`;

const BtnVerPago = styled.button`
    display: flex; align-items: center; justify-content: center;
    gap: 8px; padding: 12px; border-radius: 12px;
    border: 2px solid #2E7D32;
    background: #4CAF50; color: #fff; font-weight: 700; font-size: 15px;
    cursor: pointer;
    box-shadow: 4px 4px #2E7D32;
    transition: box-shadow 0.1s, transform 0.1s;
    &:active { box-shadow: 2px 2px #2E7D32; transform: translate(2px, 2px); }
    @media (min-width: 768px) { display: none; }
`;

const BtnVolver = styled.button`
    padding: 10px; border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: transparent; color: ${({ theme }) => theme.text};
    font-size: 13px; cursor: pointer;
    @media (min-width: 768px) { display: none; }
`;
