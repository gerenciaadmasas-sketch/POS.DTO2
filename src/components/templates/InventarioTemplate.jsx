import { useState, useMemo, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useSucursalesStore } from "../../store/SucursalesStore";
import { useAlmacenesConfigStore } from "../../store/AlmacenesConfigStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { RiEditLine, RiCheckLine, RiCloseLine, RiStore2Line, RiArrowDownSLine } from "react-icons/ri";
import { FaBuilding } from "react-icons/fa";
import { MostrarInventarioPorAlmacen, AjustarStock } from "../../supabase/crudAlmacenes";
import { MostrarTodasEmpresas } from "../../supabase/crudEmpresa";
import { MostrarTodasSucursales } from "../../supabase/crudSucursales";
import { MostrarTodosAlmacenes } from "../../supabase/crudAlmacenesConfig";
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

    const esCajero    = datausuarios?.tipo === "cajero";
    const esSuperAdmin = datausuarios?.tipo === "superadmin";

    const id_empresa = dataempresa?.id;

    /* ── Queries usuario normal ── */
    useQuery({
        queryKey: ["sucursales-inv", id_empresa],
        queryFn:  () => mostrarSucursales({ id_empresa }),
        enabled:  !!id_empresa && !esSuperAdmin,
        refetchOnWindowFocus: false,
    });
    useQuery({
        queryKey: ["almacenes-inv", id_empresa],
        queryFn:  () => mostrarAlmacenes({ id_empresa }),
        enabled:  !!id_empresa && !esSuperAdmin,
        refetchOnWindowFocus: false,
    });

    /* ── Queries superadmin (todas las empresas) ── */
    const { data: todasEmpresas = [] } = useQuery({
        queryKey: ["todas-empresas"],
        queryFn:  MostrarTodasEmpresas,
        enabled:  esSuperAdmin,
        staleTime: 60000,
        refetchOnWindowFocus: false,
    });
    const { data: todasSucursales = [] } = useQuery({
        queryKey: ["todas-sucursales"],
        queryFn:  MostrarTodasSucursales,
        enabled:  esSuperAdmin,
        staleTime: 60000,
        refetchOnWindowFocus: false,
    });
    const { data: todosAlmacenes = [] } = useQuery({
        queryKey: ["todos-almacenes"],
        queryFn:  MostrarTodosAlmacenes,
        enabled:  esSuperAdmin,
        staleTime: 60000,
        refetchOnWindowFocus: false,
    });

    /* ── Estado local ── */
    const [almacenActivo,       setAlmacenActivo]       = useState(null);
    const [empresasExpandidas,  setEmpresasExpandidas]  = useState(new Set());
    const [busqueda,            setBusqueda]            = useState("");
    const [filtroEstado,        setFiltroEstado]        = useState("todos");
    const [editando,            setEditando]            = useState(null);
    const [editStock,           setEditStock]           = useState("");
    const [editMin,             setEditMin]             = useState("");
    const autoExpandRef = useRef(false);

    /* Auto-expandir primera empresa al cargar */
    useEffect(() => {
        if (esSuperAdmin && todasEmpresas.length > 0 && !autoExpandRef.current) {
            autoExpandRef.current = true;
            setEmpresasExpandidas(new Set([todasEmpresas[0].id]));
        }
    }, [todasEmpresas, esSuperAdmin]);

    function toggleEmpresa(id) {
        setEmpresasExpandidas(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    /* ── Datos agrupados ── */
    const grupos = useMemo(() => {
        return (dataSucursales ?? [])
            .map(s => ({
                ...s,
                almacenes: (dataAlmacenes ?? []).filter(a => a.id_sucursal === s.id),
            }))
            .filter(s => s.almacenes.length > 0);
    }, [dataSucursales, dataAlmacenes]);

    const empresaGrupos = useMemo(() => {
        return todasEmpresas.map(emp => ({
            ...emp,
            sucursales: todasSucursales
                .filter(s => s.id_empresa === emp.id)
                .map(suc => ({
                    ...suc,
                    almacenes: todosAlmacenes.filter(a => a.id_sucursal === suc.id),
                })),
        }));
    }, [todasEmpresas, todasSucursales, todosAlmacenes]);

    /* ── Resolución del almacén activo ── */
    const listAlmacenes  = esSuperAdmin ? todosAlmacenes   : (dataAlmacenes  ?? []);
    const listSucursales = esSuperAdmin ? todasSucursales  : (dataSucursales ?? []);

    const almacenId   = almacenActivo ?? (esSuperAdmin ? null : (dataAlmacenes?.[0]?.id ?? null));
    const almacenObj  = listAlmacenes.find(a => a.id === almacenId);
    const sucursalObj = listSucursales.find(s => s.id === almacenObj?.id_sucursal);
    const empresaObj  = esSuperAdmin
        ? todasEmpresas.find(e => e.id === sucursalObj?.id_empresa)
        : dataempresa;

    const id_empresa_query = esSuperAdmin ? (sucursalObj?.id_empresa ?? null) : id_empresa;
    const colorAlmacen = COLORES[(listAlmacenes.findIndex(a => a.id === almacenId) ?? 0) % COLORES.length];

    /* ── Inventario del almacén activo ── */
    const { data: inventario = [], isFetching } = useQuery({
        queryKey: ["inventario", id_empresa_query, almacenId],
        queryFn:  () => MostrarInventarioPorAlmacen({ id_empresa: id_empresa_query, id_almacen: almacenId, soloConInventario: false }),
        enabled:  !!id_empresa_query && !!almacenId,
    });

    const mutAjustar = useMutation({
        mutationFn: AjustarStock,
        onSuccess: () => {
            toastExito("Stock actualizado", "Inventario");
            queryClient.invalidateQueries({ queryKey: ["inventario", id_empresa_query, almacenId] });
            setEditando(null);
        },
    });

    /* ── Filtrado ── */
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
            id_empresa:      id_empresa_query,
            stock:           Number(editStock) || 0,
            stock_minimo:    Number(editMin)   || 0,
            stock_anterior:  p.stock,
            nombre_producto: p.nombre,
            tipo:            "ajuste",
        });
    }

    function seleccionarAlmacen(id) {
        setAlmacenActivo(id);
        setEditando(null);
        setBusqueda("");
        setFiltroEstado("todos");
    }

    return (
        <Layout>
            {/* ── Panel izquierdo ── */}
            <PanelAlmacenes>
                <PanelTitulo>
                    {esSuperAdmin ? "Clientes" : "Almacenes"}
                </PanelTitulo>

                {esSuperAdmin ? (
                    empresaGrupos.length === 0 ? (
                        <SinAlmacenes>Cargando clientes...</SinAlmacenes>
                    ) : empresaGrupos.map(emp => {
                        const expandida = empresasExpandidas.has(emp.id);
                        const tieneDatos = emp.sucursales.some(s => s.almacenes.length > 0);
                        return (
                            <GrupoEmpresa key={emp.id}>
                                <EmpresaItem
                                    $expandida={expandida}
                                    $activa={empresaObj?.id === emp.id}
                                    onClick={() => toggleEmpresa(emp.id)}
                                >
                                    <FaBuilding className="icono-empresa" />
                                    <span className="nombre-empresa">{emp.razon_social}</span>
                                    <RiArrowDownSLine className={`chevron ${expandida ? "abierto" : ""}`} />
                                </EmpresaItem>

                                {expandida && (
                                    <ContenidoEmpresa>
                                        {!tieneDatos ? (
                                            <SinAlmacenes style={{ padding: "8px 12px", fontSize: 11 }}>
                                                Sin sucursales
                                            </SinAlmacenes>
                                        ) : emp.sucursales.map(suc =>
                                            suc.almacenes.length === 0 ? null : (
                                                <GrupoSucursal key={suc.id}>
                                                    <GrupoLabel>
                                                        <RiStore2Line style={{ fontSize: 12 }} />
                                                        {suc.nombre}
                                                    </GrupoLabel>
                                                    {suc.almacenes.map(alm => {
                                                        const idx   = todosAlmacenes.findIndex(a => a.id === alm.id);
                                                        const color = COLORES[idx % COLORES.length];
                                                        const activo = almacenId === alm.id;
                                                        return (
                                                            <AlmacenItem
                                                                key={alm.id}
                                                                $activo={activo}
                                                                $color={color}
                                                                onClick={() => seleccionarAlmacen(alm.id)}
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
                                            )
                                        )}
                                    </ContenidoEmpresa>
                                )}
                            </GrupoEmpresa>
                        );
                    })
                ) : (
                    grupos.length === 0 ? (
                        <SinAlmacenes>No hay almacenes registrados</SinAlmacenes>
                    ) : grupos.map((suc) => (
                        <GrupoSucursal key={suc.id}>
                            <GrupoLabel>
                                <RiStore2Line style={{ fontSize: 12 }} />
                                {suc.nombre}
                            </GrupoLabel>
                            {suc.almacenes.map((alm) => {
                                const idx   = dataAlmacenes?.findIndex(a => a.id === alm.id) ?? 0;
                                const color = COLORES[idx % COLORES.length];
                                const activo = almacenId === alm.id;
                                return (
                                    <AlmacenItem
                                        key={alm.id}
                                        $activo={activo}
                                        $color={color}
                                        onClick={() => seleccionarAlmacen(alm.id)}
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
                    ))
                )}
            </PanelAlmacenes>

            {/* ── Contenido principal ── */}
            <Contenido>
                <AlmacenHeader $color={colorAlmacen}>
                    <HeaderLeft>
                        {esSuperAdmin && empresaObj && (
                            <EmpresaTag>
                                <FaBuilding />
                                {empresaObj.razon_social}
                            </EmpresaTag>
                        )}
                        <AlmacenNombreGrande>
                            {almacenObj?.nombre ?? (esSuperAdmin ? "Selecciona un cliente y almacén" : "Selecciona un almacén")}
                        </AlmacenNombreGrande>
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

                <TablaWrapper>
                    <Tabla>
                        <thead>
                            <tr>
                                <Th>Producto</Th>
                                <Th>Precio</Th>
                                <Th $center>Stock</Th>
                                <Th>Estado</Th>
                                {!esCajero && <Th>Acción</Th>}
                            </tr>
                        </thead>
                        <tbody>
                            {!almacenId ? (
                                <tr><TdVacio colSpan={esCajero ? 4 : 5}>
                                    {esSuperAdmin
                                        ? "Expande un cliente y selecciona un almacén para ver su inventario"
                                        : "Selecciona un almacén para ver su inventario"}
                                </TdVacio></tr>
                            ) : isFetching ? (
                                <tr><TdVacio colSpan={esCajero ? 4 : 5}>Cargando inventario...</TdVacio></tr>
                            ) : productosFiltrados.length === 0 ? (
                                <tr><TdVacio colSpan={esCajero ? 4 : 5}>Sin productos{busqueda ? ` para "${busqueda}"` : " en este almacén"}</TdVacio></tr>
                            ) : productosFiltrados.map(p => {
                                const estado    = getEstado(p.stock, p.stock_minimo);
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
const fadeUp   = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;
const slideDown = keyframes`from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}`;

/* ── Layout ── */
const Layout = styled.div`
    display: flex;
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    animation: ${fadeUp} 0.3s ease;

    @media (max-width: 767px) {
        flex-direction: column;
        padding-top: 58px;
    }
`;

/* ── Panel izquierdo ── */
const PanelAlmacenes = styled.aside`
    width: 230px;
    flex-shrink: 0;
    border-right: 1px solid ${({ theme }) => theme.color2};
    padding: 24px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: ${({ theme }) => theme.bgcards};
    overflow-y: auto;

    @media (max-width: 767px) {
        width: 100%;
        flex-direction: row;
        flex-wrap: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        border-right: none;
        border-bottom: 1px solid ${({ theme }) => theme.color2};
        padding: 10px 12px;
        gap: 8px;
        max-height: 120px;

        /* Ocultar scrollbar pero mantener scroll */
        &::-webkit-scrollbar { height: 3px; }
        &::-webkit-scrollbar-thumb {
            background: ${({ theme }) => theme.colorScroll};
            border-radius: 10px;
        }
    }
`;

const PanelTitulo = styled.div`
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colorsubtitlecard};
    padding: 0 8px;
    margin-bottom: 12px;

    @media (max-width: 767px) {
        display: none;
    }
`;

const SinAlmacenes = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    text-align: center;
    padding: 20px 8px;
`;

/* ── Empresa level (superadmin) ── */
const GrupoEmpresa = styled.div`
    margin-bottom: 4px;

    @media (max-width: 767px) {
        margin-bottom: 0;
        display: contents;
    }
`;

const EmpresaItem = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 10px;
    border-radius: 10px;
    border: 1.5px solid ${({ $activa, theme }) => $activa ? "rgba(248,133,51,0.4)" : theme.color2};
    background: ${({ $activa, theme }) => $activa ? "rgba(248,133,51,0.08)" : theme.bgtotal};
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    &:hover {
        border-color: rgba(248,133,51,0.3);
        background: rgba(248,133,51,0.05);
    }
    .icono-empresa {
        font-size: 14px;
        color: #f88533;
        flex-shrink: 0;
    }
    .nombre-empresa {
        flex: 1;
        font-size: 12px;
        font-weight: 800;
        color: ${({ theme }) => theme.text};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        letter-spacing: 0.1px;
    }
    .chevron {
        font-size: 16px;
        color: ${({ theme }) => theme.colorsubtitlecard};
        flex-shrink: 0;
        transition: transform 0.2s;
    }
    .chevron.abierto {
        transform: rotate(180deg);
    }
`;

const ContenidoEmpresa = styled.div`
    padding-left: 10px;
    animation: ${slideDown} 0.18s ease;

    @media (max-width: 767px) {
        padding-left: 0;
        display: contents;
    }
`;

/* ── Sucursal level ── */
const GrupoSucursal = styled.div`
    margin-bottom: 8px;

    @media (max-width: 767px) {
        margin-bottom: 0;
        display: contents;
    }
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
    margin-bottom: 3px;
    opacity: 0.7;

    @media (max-width: 767px) {
        display: none;
    }
`;

/* ── Almacen level ── */
const AlmacenItem = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 10px;
    border: none;
    background: ${({ $activo, $color }) => $activo ? `${$color}18` : "transparent"};
    cursor: pointer;
    transition: background 0.15s;
    text-align: left;
    &:hover { background: ${({ $color }) => `${$color}12`}; }
    outline: ${({ $activo, $color }) => $activo ? `1.5px solid ${$color}50` : "none"};

    @media (max-width: 767px) {
        width: auto;
        flex-shrink: 0;
        padding: 7px 12px;
        border-radius: 20px;
        border: 1.5px solid ${({ $activo, $color, theme }) => $activo ? $color : theme.color2};
        background: ${({ $activo, $color }) => $activo ? `${$color}22` : "transparent"};
        outline: none;
        white-space: nowrap;
    }
`;

const AlmacenDot = styled.div`
    width: 9px; height: 9px;
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
        font-size: 12px;
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

    @media (max-width: 767px) {
        display: none;
    }
`;

/* ── Contenido ── */
const Contenido = styled.div`
    flex: 1;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;

    @media (max-width: 767px) {
        padding: 12px;
    }
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

    @media (max-width: 767px) {
        padding: 12px 14px;
    }
`;

const HeaderLeft = styled.div`display: flex; flex-direction: column; gap: 3px;`;

const EmpresaTag = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    color: #f88533;
    letter-spacing: 0.2px;
`;

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

const ResumenBadges = styled.div`
    display: flex;
    gap: 10px;

    @media (max-width: 767px) {
        gap: 6px;
    }
`;

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

    @media (max-width: 767px) {
        padding: 6px 10px;
        .num { font-size: 16px; }
        .lbl { font-size: 9px; }
    }
`;

/* ── Filtros ── */
const FiltrosRow = styled.div`
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;

    @media (max-width: 767px) {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
    }
`;

const SearchInput = styled.input`
    flex: 1;
    min-width: 180px;
    max-width: 320px;

    @media (max-width: 767px) {
        max-width: 100%;
        width: 100%;
    }
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

const FiltrosBtns = styled.div`
    display: flex;
    gap: 6px;

    @media (max-width: 767px) {
        overflow-x: auto;
        &::-webkit-scrollbar { height: 0; }
    }
`;

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
