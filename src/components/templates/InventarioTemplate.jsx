import { useState, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useSucursalesStore } from "../../store/SucursalesStore";
import { useAlmacenesConfigStore } from "../../store/AlmacenesConfigStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { RiEditLine, RiCheckLine, RiCloseLine, RiStore2Line } from "react-icons/ri";
import { MostrarInventarioPorAlmacen, AjustarStock } from "../../supabase/crudAlmacenes";
import { toastExito } from "../../utils/toast";

const formatCOP = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);

function getEstado(stock, min) {
    if (stock <= 0) return "agotado";
    if (stock <= min) return "bajo";
    return "normal";
}

const COLORES = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#3b82f6"];

export function InventarioTemplate() {
    const { dataempresa }    = useEmpresaStore();
    const { dataSucursales, mostrarSucursales } = useSucursalesStore();
    const { dataAlmacenes, mostrarAlmacenes }   = useAlmacenesConfigStore();
    const { datausuarios } = useUsuariosStore();
    const queryClient = useQueryClient();

    const esCajero = datausuarios?.tipo === "cajero";

    const id_empresa = dataempresa?.id;

    useQuery({
        queryKey: ["sucursales-inv", id_empresa],
        queryFn:  () => mostrarSucursales({ id_empresa }),
        enabled:  !!id_empresa,
        refetchOnWindowFocus: false,
    });

    useQuery({
        queryKey: ["almacenes-inv", id_empresa],
        queryFn:  () => mostrarAlmacenes({ id_empresa }),
        enabled:  !!id_empresa,
        refetchOnWindowFocus: false,
    });

    const [almacenActivo, setAlmacenActivo] = useState(null);
    const [busqueda,      setBusqueda]      = useState("");
    const [filtroEstado,  setFiltroEstado]  = useState("todos");
    const [editando,      setEditando]      = useState(null);
    const [editStock,     setEditStock]     = useState("");
    const [editMin,       setEditMin]       = useState("");

    // Agrupar almacenes por sucursal
    const grupos = useMemo(() => {
        return (dataSucursales ?? [])
            .map(s => ({
                ...s,
                almacenes: (dataAlmacenes ?? []).filter(a => a.id_sucursal === s.id),
            }))
            .filter(s => s.almacenes.length > 0);
    }, [dataSucursales, dataAlmacenes]);

    // Almacén seleccionado (default al primero disponible)
    const almacenId = almacenActivo ?? dataAlmacenes?.[0]?.id ?? null;
    const almacenObj = dataAlmacenes?.find(a => a.id === almacenId);
    const sucursalObj = dataSucursales?.find(s => s.id === almacenObj?.id_sucursal);
    const colorAlmacen = COLORES[(dataAlmacenes?.findIndex(a => a.id === almacenId) ?? 0) % COLORES.length];

    // Inventario del almacén activo
    const { data: inventario = [], isFetching } = useQuery({
        queryKey: ["inventario", id_empresa, almacenId],
        queryFn:  () => MostrarInventarioPorAlmacen({ id_empresa, id_almacen: almacenId, soloConInventario: false }),
        enabled:  !!id_empresa && !!almacenId,
        refetchOnWindowFocus: true,
        staleTime: 0,
    });

    const mutAjustar = useMutation({
        mutationFn: AjustarStock,
        onSuccess: () => {
            toastExito("Stock actualizado", "Inventario");
            queryClient.invalidateQueries({ queryKey: ["inventario", id_empresa, almacenId] });
            setEditando(null);
        },
    });

    // Filtrado
    const productosFiltrados = useMemo(() => {
        return inventario.filter(p => {
            const okBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
            const estado = getEstado(p.stock, p.stock_minimo);
            const okFiltro =
                filtroEstado === "todos" ||
                (filtroEstado === "bajo"    && estado === "bajo") ||
                (filtroEstado === "agotado" && estado === "agotado");
            return okBusqueda && okFiltro;
        });
    }, [inventario, busqueda, filtroEstado]);

    const totalBajo    = inventario.filter(p => getEstado(p.stock, p.stock_minimo) === "bajo").length;
    const totalAgotado = inventario.filter(p => getEstado(p.stock, p.stock_minimo) === "agotado").length;

    function iniciarEdicion(p) {
        setEditando(p.id);
        setEditStock(String(p.stock));
        setEditMin(String(p.stock_minimo));
    }

    function guardarEdicion(p) {
        mutAjustar.mutate({
            id_stock:        p.id_stock,
            id_producto:     p.id,
            id_almacen:      almacenId,
            id_sucursal:     almacenObj?.id_sucursal ?? null,
            id_empresa,
            stock:           Number(editStock) || 0,
            stock_minimo:    Number(editMin)   || 0,
            stock_anterior:  p.stock,
            nombre_producto: p.nombre,
            tipo:            "ajuste",
        });
    }

    return (
        <Layout>
            {/* ── Panel izquierdo: selector de almacén ── */}
            <PanelAlmacenes>
                <PanelTitulo>Almacenes</PanelTitulo>

                {grupos.length === 0 ? (
                    <SinAlmacenes>No hay almacenes registrados</SinAlmacenes>
                ) : grupos.map((suc, si) => (
                    <GrupoSucursal key={suc.id}>
                        <GrupoLabel>
                            <RiStore2Line style={{ fontSize: 12 }} />
                            {suc.nombre}
                        </GrupoLabel>
                        {suc.almacenes.map((alm, ai) => {
                            const idx   = dataAlmacenes?.findIndex(a => a.id === alm.id) ?? 0;
                            const color = COLORES[idx % COLORES.length];
                            const activo = almacenId === alm.id;
                            return (
                                <AlmacenItem
                                    key={alm.id}
                                    $activo={activo}
                                    $color={color}
                                    onClick={() => { setAlmacenActivo(alm.id); setEditando(null); setBusqueda(""); setFiltroEstado("todos"); }}
                                >
                                    <AlmacenDot $color={color} />
                                    <AlmacenInfo>
                                        <span className="nombre">{alm.nombre}</span>
                                        <span className="sucursal">{suc.nombre}</span>
                                    </AlmacenInfo>
                                    {activo && <ChevronActivo>›</ChevronActivo>}
                                </AlmacenItem>
                            );
                        })}
                    </GrupoSucursal>
                ))}
            </PanelAlmacenes>

            {/* ── Contenido principal ── */}
            <Contenido>
                {/* Encabezado del almacén activo */}
                <AlmacenHeader $color={colorAlmacen}>
                    <HeaderLeft>
                        <AlmacenNombreGrande>{almacenObj?.nombre ?? "Selecciona un almacén"}</AlmacenNombreGrande>
                        {sucursalObj && <AlmacenSucursalTag>Sucursal: {sucursalObj.nombre}</AlmacenSucursalTag>}
                    </HeaderLeft>
                    <ResumenBadges>
                        <Badge $color="#64748b">
                            <span className="num">{inventario.length}</span>
                            <span className="lbl">productos</span>
                        </Badge>
                        <Badge $color="#fbbf24">
                            <span className="num">{totalBajo}</span>
                            <span className="lbl">stock bajo</span>
                        </Badge>
                        <Badge $color="#f87171">
                            <span className="num">{totalAgotado}</span>
                            <span className="lbl">agotados</span>
                        </Badge>
                    </ResumenBadges>
                </AlmacenHeader>

                {/* Búsqueda y filtros */}
                <FiltrosRow>
                    <SearchInput
                        placeholder="Buscar producto..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                    <FiltrosBtns>
                        <FiltroBtn $active={filtroEstado === "todos"}    onClick={() => setFiltroEstado("todos")}>Todos</FiltroBtn>
                        <FiltroBtn $active={filtroEstado === "bajo"}     $color="#fbbf24" onClick={() => setFiltroEstado("bajo")}>Stock bajo</FiltroBtn>
                        <FiltroBtn $active={filtroEstado === "agotado"}  $color="#f87171" onClick={() => setFiltroEstado("agotado")}>Agotados</FiltroBtn>
                    </FiltrosBtns>
                </FiltrosRow>

                {/* Tabla */}
                <TablaWrapper>
                    <Tabla>
                        <thead>
                            <tr>
                                <Th>Producto</Th>
                                <Th>Precio</Th>
                                <Th $center>Stock</Th>
                                <Th $center>Mín.</Th>
                                <Th>Estado</Th>
                                {!esCajero && <Th>Acción</Th>}
                            </tr>
                        </thead>
                        <tbody>
                            {!almacenId ? (
                                <tr><TdVacio colSpan={esCajero ? 5 : 6}>Selecciona un almacén para ver su inventario</TdVacio></tr>
                            ) : isFetching ? (
                                <tr><TdVacio colSpan={esCajero ? 5 : 6}>Cargando inventario...</TdVacio></tr>
                            ) : productosFiltrados.length === 0 ? (
                                <tr><TdVacio colSpan={esCajero ? 5 : 6}>Sin productos{busqueda ? ` para "${busqueda}"` : " en este almacén"}</TdVacio></tr>
                            ) : productosFiltrados.map(p => {
                                const estado   = getEstado(p.stock, p.stock_minimo);
                                const enEdicion = editando === p.id;
                                return (
                                    <FilaTr key={p.id}>
                                        <Td><NombreProd>{p.nombre}</NombreProd></Td>
                                        <Td>{formatCOP(p.precio_venta)}</Td>
                                        <Td $center>
                                            {enEdicion
                                                ? <InputStock type="number" min="0" value={editStock} onChange={e => setEditStock(e.target.value)} autoFocus />
                                                : <StockPill $estado={estado}>{p.stock}</StockPill>
                                            }
                                        </Td>
                                        <Td $center>
                                            {enEdicion
                                                ? <InputStock type="number" min="0" value={editMin} onChange={e => setEditMin(e.target.value)} />
                                                : <span style={{ opacity: 0.7 }}>{p.stock_minimo}</span>
                                            }
                                        </Td>
                                        <Td>
                                            <EstadoBadge $estado={estado}>
                                                {estado === "normal" ? "Normal" : estado === "bajo" ? "Bajo" : "Agotado"}
                                            </EstadoBadge>
                                        </Td>
                                        {!esCajero && (
                                            <Td>
                                                {enEdicion ? (
                                                    <AccionesRow>
                                                        <BtnIco $verde onClick={() => guardarEdicion(p)} disabled={mutAjustar.isPending}><RiCheckLine /></BtnIco>
                                                        <BtnIco onClick={() => setEditando(null)}><RiCloseLine /></BtnIco>
                                                    </AccionesRow>
                                                ) : (
                                                    <BtnIco onClick={() => iniciarEdicion(p)}><RiEditLine /></BtnIco>
                                                )}
                                            </Td>
                                        )}
                                    </FilaTr>
                                );
                            })}
                        </tbody>
                    </Tabla>
                </TablaWrapper>
            </Contenido>
        </Layout>
    );
}

/* ── Animations ── */
const fadeUp = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;

/* ── Layout ── */
const Layout = styled.div`
    display: flex;
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    animation: ${fadeUp} 0.3s ease;
`;

/* ── Panel izquierdo ── */
const PanelAlmacenes = styled.aside`
    width: 220px;
    flex-shrink: 0;
    border-right: 1px solid ${({ theme }) => theme.color2};
    padding: 24px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: ${({ theme }) => theme.bgcards};
`;

const PanelTitulo = styled.div`
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colorsubtitlecard};
    padding: 0 8px;
    margin-bottom: 12px;
`;

const SinAlmacenes = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    text-align: center;
    padding: 20px 8px;
`;

const GrupoSucursal = styled.div`
    margin-bottom: 12px;
`;

const GrupoLabel = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colorsubtitlecard};
    padding: 4px 8px;
    margin-bottom: 4px;
    opacity: 0.7;
`;

const AlmacenItem = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 10px;
    border-radius: 10px;
    border: none;
    background: ${({ $activo, $color }) => $activo ? `${$color}18` : "transparent"};
    cursor: pointer;
    transition: background 0.15s;
    text-align: left;
    &:hover { background: ${({ $color }) => `${$color}12`}; }
    outline: ${({ $activo, $color }) => $activo ? `1.5px solid ${$color}50` : "none"};
`;

const AlmacenDot = styled.div`
    width: 10px; height: 10px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
    flex-shrink: 0;
`;

const AlmacenInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    .nombre {
        font-size: 13px;
        font-weight: 700;
        color: ${({ theme }) => theme.text};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .sucursal {
        font-size: 10px;
        color: ${({ theme }) => theme.colorsubtitlecard};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

const ChevronActivo = styled.span`
    font-size: 18px;
    font-weight: 700;
    color: ${({ theme }) => theme.colorsubtitlecard};
    flex-shrink: 0;
`;

/* ── Contenido ── */
const Contenido = styled.div`
    flex: 1;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
`;

const AlmacenHeader = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-left: 4px solid ${({ $color }) => $color};
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
`;

const HeaderLeft = styled.div`display: flex; flex-direction: column; gap: 4px;`;

const AlmacenNombreGrande = styled.div`
    font-size: 18px;
    font-weight: 900;
    color: ${({ theme }) => theme.text};
`;

const AlmacenSucursalTag = styled.div`
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

const ResumenBadges = styled.div`display: flex; gap: 10px;`;

const Badge = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    background: ${({ theme }) => theme.bgtotal};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 10px;
    padding: 8px 14px;
    .num {
        font-size: 20px;
        font-weight: 900;
        color: ${({ $color }) => $color};
    }
    .lbl {
        font-size: 10px;
        font-weight: 600;
        color: ${({ theme }) => theme.colorsubtitlecard};
        white-space: nowrap;
    }
`;

/* ── Filtros ── */
const FiltrosRow = styled.div`
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
`;

const SearchInput = styled.input`
    flex: 1;
    min-width: 180px;
    max-width: 320px;
    padding: 9px 14px;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 9px;
    background: ${({ theme }) => theme.bgcards};
    color: ${({ theme }) => theme.text};
    font-size: 13px;
    font-family: "Poppins", sans-serif;
    outline: none;
    &::placeholder { color: ${({ theme }) => theme.colorsubtitlecard}; }
    &:focus { border-color: #2563eb; }
`;

const FiltrosBtns = styled.div`display: flex; gap: 6px;`;

const FiltroBtn = styled.button`
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: "Poppins", sans-serif;
    border: 1px solid ${({ $active, $color, theme }) => $active ? ($color ?? "#2563eb") : theme.color2};
    background: ${({ $active, $color }) => $active ? ($color ? `${$color}22` : "rgba(37,99,235,0.12)") : "transparent"};
    color: ${({ $active, $color, theme }) => $active ? ($color ?? "#2563eb") : theme.text};
    transition: all 0.15s;
    &:hover { opacity: 0.8; }
`;

/* ── Tabla ── */
const TablaWrapper = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
    overflow: auto;
    flex: 1;
`;

const Tabla = styled.table`
    width: 100%;
    border-collapse: collapse;
`;

const Th = styled.th`
    text-align: ${({ $center }) => $center ? "center" : "left"};
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 700;
    color: ${({ theme }) => theme.colorsubtitlecard};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    white-space: nowrap;
    background: ${({ theme }) => theme.bgtotal};
`;

const Td = styled.td`
    padding: 11px 16px;
    font-size: 13px;
    color: ${({ theme }) => theme.text};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    text-align: ${({ $center }) => $center ? "center" : "left"};
`;

const TdVacio = styled.td`
    padding: 48px 16px;
    text-align: center;
    font-size: 14px;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

const FilaTr = styled.tr`
    transition: background 0.12s;
    &:last-child td { border-bottom: none; }
    &:hover td { background: ${({ theme }) => theme.bgtotal}; }
`;

const NombreProd = styled.span`font-weight: 700;`;

const StockPill = styled.span`
    display: inline-block;
    padding: 3px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    background: ${({ $estado }) =>
        $estado === "agotado" ? "rgba(248,113,113,0.15)" :
        $estado === "bajo"    ? "rgba(251,191,36,0.15)"  :
                                "rgba(74,222,128,0.15)"};
    color: ${({ $estado }) =>
        $estado === "agotado" ? "#f87171" :
        $estado === "bajo"    ? "#fbbf24" :
                                "#4ade80"};
`;

const EstadoBadge = styled.span`
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    background: ${({ $estado }) =>
        $estado === "agotado" ? "rgba(248,113,113,0.12)" :
        $estado === "bajo"    ? "rgba(251,191,36,0.12)"  :
                                "rgba(74,222,128,0.12)"};
    color: ${({ $estado }) =>
        $estado === "agotado" ? "#f87171" :
        $estado === "bajo"    ? "#fbbf24" :
                                "#4ade80"};
`;

const AccionesRow = styled.div`display: flex; gap: 4px;`;

const BtnIco = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    color: ${({ $verde, theme }) => $verde ? "#4ade80" : theme.colorsubtitlecard};
    font-size: 16px;
    padding: 4px 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: background 0.15s;
    &:hover { background: rgba(255,255,255,0.08); }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const InputStock = styled.input`
    width: 70px;
    padding: 5px 8px;
    border: 1px solid #6366f1;
    border-radius: 7px;
    background: rgba(99,102,241,0.06);
    color: ${({ theme }) => theme.text};
    font-size: 13px;
    font-family: "Poppins", sans-serif;
    outline: none;
    text-align: center;
    &::-webkit-inner-spin-button { -webkit-appearance: none; }
`;
