import { useState, useMemo, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useSucursalesStore } from "../../store/SucursalesStore";
import { useAlmacenesConfigStore } from "../../store/AlmacenesConfigStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { GetVentasStats, GetDetalleStats, GetMovimientosCaja, GetInversionInventario, GetVentasDiarias } from "../../supabase/crudReportes";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from "recharts";
import { supabase } from "../../supabase/supabase.config";
import { Icon } from "@iconify/react";

/* ── Helpers ─────────────────────────────────── */

function getRango(filtro) {
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    switch (filtro) {
        case "hoy":     return { desde: hoy.toISOString(),                                    hasta: ahora.toISOString() };
        case "7dias":   return { desde: new Date(Date.now() - 7  * 864e5).toISOString(),      hasta: ahora.toISOString() };
        case "30dias":  return { desde: new Date(Date.now() - 30 * 864e5).toISOString(),      hasta: ahora.toISOString() };
        case "12meses": return { desde: new Date(Date.now() - 365 * 864e5).toISOString(),     hasta: ahora.toISOString() };
        default:        return { desde: null, hasta: null };
    }
}

function getPrevRango(filtro) {
    switch (filtro) {
        case "hoy":     return getRango("hoy");
        case "7dias":   return { desde: new Date(Date.now() - 14 * 864e5).toISOString(), hasta: new Date(Date.now() - 7 * 864e5).toISOString() };
        case "30dias":  return { desde: new Date(Date.now() - 60 * 864e5).toISOString(), hasta: new Date(Date.now() - 30 * 864e5).toISOString() };
        case "12meses": return { desde: new Date(Date.now() - 730 * 864e5).toISOString(), hasta: new Date(Date.now() - 365 * 864e5).toISOString() };
        default:        return { desde: null, hasta: null };
    }
}

function sumTotal(arr) { return (arr ?? []).reduce((s, r) => s + (Number(r.total) || 0), 0); }
function sumCant(arr)  { return (arr ?? []).reduce((s, r) => s + (Number(r.cantidad) || 0), 0); }

function formatCOP(n) {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function calcPct(curr, prev) {
    if (!prev || prev === 0) return null;
    return ((curr - prev) / prev) * 100;
}

function PctBadge({ pct }) {
    if (pct === null) return <PctNeutro>— sin datos previos</PctNeutro>;
    if (pct > 0) return <PctUp>↑ {pct.toFixed(1)}% al periodo anterior</PctUp>;
    if (pct < 0) return <PctDown>↓ {Math.abs(pct).toFixed(1)}% al periodo anterior</PctDown>;
    return <PctNeutro>— 0% al periodo anterior</PctNeutro>;
}

function fmtFecha(iso) {
    return new Date(iso).toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const PAGE_SIZE = 10;
const FILTROS = [
    { key: "todo",     label: "Todo" },
    { key: "7dias",    label: "Últimos 7 días" },
    { key: "30dias",   label: "Últimos 30 días" },
    { key: "12meses",  label: "Últimos 12 meses" },
    { key: "hoy",      label: "Hoy" },
];

/* ── Component ───────────────────────────────── */

/* ── Dashboard Superadmin — Visor de clientes ───── */
import { MostrarSuscripciones } from "../../supabase/crudSuscripciones";

function DashboardSaaS() {
    const [clienteId, setClienteId] = useState("todos");
    const [filtro, setFiltro] = useState("todo");
    const [page, setPage] = useState(0);

    const { data: suscripciones = [] } = useQuery({
        queryKey: ["dash-saas-suscripciones"],
        queryFn: MostrarSuscripciones,
    });

    const empresaSeleccionada = clienteId === "todos" ? null : Number(clienteId);
    const { desde, hasta } = getRango(filtro);

    const { data: ventasData = [], isFetching: loadV } = useQuery({
        queryKey: ["dash-sa-ventas", empresaSeleccionada, filtro],
        queryFn: () => GetVentasStats({ id_empresa: empresaSeleccionada, desde, hasta }),
        enabled: !!empresaSeleccionada,
    });

    const { data: detalleData = [] } = useQuery({
        queryKey: ["dash-sa-detalle", empresaSeleccionada, filtro],
        queryFn: () => GetDetalleStats({ id_empresa: empresaSeleccionada, desde, hasta }),
        enabled: !!empresaSeleccionada,
    });

    const { data: inversion = { costo: 0, valor: 0, productos: 0, unidades: 0 } } = useQuery({
        queryKey: ["dash-sa-inversion", empresaSeleccionada],
        queryFn: () => GetInversionInventario({ id_empresa: empresaSeleccionada }),
        enabled: !!empresaSeleccionada,
    });

    const { data: ventasDiarias = [] } = useQuery({
        queryKey: ["dash-sa-diarias", empresaSeleccionada, filtro],
        queryFn: () => GetVentasDiarias({ id_empresa: empresaSeleccionada, desde, hasta }),
        enabled: !!empresaSeleccionada,
    });

    const { data: movData } = useQuery({
        queryKey: ["dash-sa-mov", empresaSeleccionada, filtro, page],
        queryFn: () => GetMovimientosCaja({ id_empresa: empresaSeleccionada, desde, hasta, page, pageSize: 10 }),
        enabled: !!empresaSeleccionada,
    });

    const totalVentas = sumTotal(ventasData);
    const cantProductos = sumCant(detalleData);
    const movimientos = movData?.data ?? [];
    const totalPages = Math.max(1, Math.ceil((movData?.count ?? 0) / 10));

    // Stats SaaS
    const totalMensual = suscripciones.reduce((s, c) => s + (Number(c.valor_mensual) || 0), 0);
    const totalAnual = totalMensual * 12;

    function estadoAuto(s) {
        if (s.estado === "suspendido" || s.estado === "cancelado") return s.estado;
        if (!s.fecha_proximo_pago) return "al_dia";
        return new Date(s.fecha_proximo_pago) < new Date() ? "mora" : "al_dia";
    }

    const clienteActivo = suscripciones.find(s => String(s.id_empresa) === String(clienteId));

    return (
        <Page>
            <TopBar>
                <TopLeft>
                    <TituloPage>Visor de clientes</TituloPage>
                    <SelectAlmacenDash
                        value={clienteId}
                        onChange={e => { setClienteId(e.target.value); setPage(0); }}
                    >
                        <option value="todos">— Selecciona un cliente —</option>
                        {suscripciones.map(s => (
                            <option key={s.id} value={s.id_empresa}>{s.nombre_cliente}</option>
                        ))}
                    </SelectAlmacenDash>
                </TopLeft>
                {empresaSeleccionada && (
                    <Filtros>
                        {FILTROS.map(f => (
                            <BtnFiltro key={f.key} $active={filtro === f.key} onClick={() => { setFiltro(f.key); setPage(0); }}>
                                {f.label}
                            </BtnFiltro>
                        ))}
                        <BtnFiltro $limpiar onClick={() => { setFiltro("todo"); setPage(0); }}>
                            Limpiar filtro
                        </BtnFiltro>
                    </Filtros>
                )}
            </TopBar>

            {!empresaSeleccionada ? (
                <>
                    {/* Vista general SaaS */}
                    <StatsRow $cols={3}>
                        <StatCard>
                            <StatTop>
                                <StatLabel>Clientes activos</StatLabel>
                                <Icon icon="solar:users-group-rounded-bold-duotone" style={{ fontSize: 22, color: "#60a5fa" }} />
                            </StatTop>
                            <StatVal>{suscripciones.length}</StatVal>
                        </StatCard>
                        <StatCard>
                            <StatTop>
                                <StatLabel>Ingreso mensual</StatLabel>
                                <Icon icon="solar:wallet-money-bold-duotone" style={{ fontSize: 22, color: "#4ade80" }} />
                            </StatTop>
                            <StatVal $green>{formatCOP(totalMensual)}</StatVal>
                        </StatCard>
                        <StatCard>
                            <StatTop>
                                <StatLabel>Proyección anual</StatLabel>
                                <Icon icon="solar:chart-square-bold-duotone" style={{ fontSize: 22, color: "#a78bfa" }} />
                            </StatTop>
                            <StatVal>{formatCOP(totalAnual)}</StatVal>
                        </StatCard>
                    </StatsRow>

                    <TableCard>
                        <TableHeader><TableTitle>Selecciona un cliente para ver sus métricas</TableTitle></TableHeader>
                        <TableWrap>
                            <table>
                                <thead><tr><th>Cliente</th><th>Actividad</th><th>Plan</th><th>Mensualidad</th><th>Estado</th></tr></thead>
                                <tbody>
                                    {suscripciones.map(s => {
                                        const est = estadoAuto(s);
                                        return (
                                            <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => setClienteId(String(s.id_empresa))}>
                                                <td style={{ fontWeight: 700 }}>{s.nombre_cliente}</td>
                                                <td style={{ textTransform: "capitalize" }}>{s.actividad_economica?.replace(/_/g, " ") ?? "—"}</td>
                                                <td style={{ textTransform: "capitalize" }}>{s.plan}</td>
                                                <td style={{ fontWeight: 700, color: "#4ade80" }}>{formatCOP(s.valor_mensual)}</td>
                                                <td><TipoBadge $tipo={est === "al_dia" ? "efectivo" : "error"}>{est === "al_dia" ? "Al día" : "En mora"}</TipoBadge></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </TableWrap>
                    </TableCard>
                </>
            ) : (
                <>
                    {/* Dashboard del cliente seleccionado */}
                    {clienteActivo && (
                        <ClienteBanner>
                            <span className="nombre">{clienteActivo.nombre_cliente}</span>
                            <span className="actividad">{clienteActivo.actividad_economica?.replace(/_/g, " ")}</span>
                        </ClienteBanner>
                    )}

                    <StatsRow $cols={4}>
                        <StatCard $loading={loadV}>
                            <StatTop>
                                <StatLabel>Ventas</StatLabel>
                                <Icon icon="solar:cart-large-2-bold-duotone" style={{ fontSize: 20, color: "#f88533" }} />
                            </StatTop>
                            <StatVal>{formatCOP(totalVentas)}</StatVal>
                        </StatCard>
                        <StatCard>
                            <StatTop>
                                <StatLabel>Productos vendidos</StatLabel>
                                <Icon icon="solar:bag-check-bold-duotone" style={{ fontSize: 20, color: "#60a5fa" }} />
                            </StatTop>
                            <StatVal>{cantProductos.toLocaleString("es-CO")}</StatVal>
                        </StatCard>
                        <StatCard>
                            <StatTop>
                                <StatLabel>Invertido</StatLabel>
                                <Icon icon="solar:box-bold-duotone" style={{ fontSize: 20, color: "#f59e0b" }} />
                            </StatTop>
                            <StatVal>{formatCOP(inversion.costo)}</StatVal>
                        </StatCard>
                        <StatCard>
                            <StatTop>
                                <StatLabel>Valor inventario</StatLabel>
                                <Icon icon="solar:tag-price-bold-duotone" style={{ fontSize: 20, color: "#4ade80" }} />
                            </StatTop>
                            <StatVal $green>{formatCOP(inversion.valor)}</StatVal>
                            <PctNeutro>{inversion.productos} productos · {inversion.unidades.toLocaleString("es-CO")} uds</PctNeutro>
                        </StatCard>
                    </StatsRow>

                    {/* Gráfica */}
                    <ChartCard>
                        <ChartHeader><TableTitle>Ventas por día</TableTitle></ChartHeader>
                        <ChartWrap>
                            {ventasDiarias.length === 0 ? (
                                <ChartVacio>Sin ventas en este periodo</ChartVacio>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={ventasDiarias}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                                        <Tooltip formatter={(v) => [formatCOP(v), "Ventas"]} contentStyle={{ background: "#1C2E42", border: "1px solid #2d4a66", borderRadius: 10, fontSize: 12 }} />
                                        <Line type="monotone" dataKey="total" stroke="#f88533" strokeWidth={3} dot={{ r: 4, fill: "#f88533" }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </ChartWrap>
                    </ChartCard>

                    {/* Movimientos */}
                    <TableCard>
                        <TableHeader><TableTitle>Últimas ventas</TableTitle></TableHeader>
                        <TableWrap>
                            <table>
                                <thead><tr><th>Fecha</th><th>Tipo</th><th>Monto</th></tr></thead>
                                <tbody>
                                    {movimientos.length === 0 ? (
                                        <tr><td colSpan={3} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>Sin ventas</td></tr>
                                    ) : movimientos.map(m => (
                                        <tr key={m.id}>
                                            <td>{fmtFecha(m.created_at)}</td>
                                            <td><TipoBadge $tipo={m.metodo_pago}>{m.metodo_pago ?? "—"}</TipoBadge></td>
                                            <td style={{ fontWeight: 700 }}>{formatCOP(m.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </TableWrap>
                        {totalPages > 1 && (
                            <Paginacion>
                                <BtnPag disabled={page === 0} onClick={() => setPage(0)}>«</BtnPag>
                                <BtnPag disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</BtnPag>
                                <PagInfo>{page + 1} de {totalPages}</PagInfo>
                                <BtnPag disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>›</BtnPag>
                                <BtnPag disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</BtnPag>
                            </Paginacion>
                        )}
                    </TableCard>
                </>
            )}
        </Page>
    );
}

const ClienteBanner = styled.div`
    display: flex; align-items: center; gap: 12px;
    padding: 14px 20px; border-radius: 14px;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    margin-bottom: 16px;
    .nombre { font-size: 18px; font-weight: 900; color: ${({ theme }) => theme.text}; }
    .actividad { font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard}; text-transform: capitalize; }
`;

/* ── Dashboard POS (admin/supervisor/cajero) ───── */

export function DashboardTemplate() {
    const { dataempresa }    = useEmpresaStore();
    const { dataSucursales } = useSucursalesStore();
    const { dataAlmacenes }  = useAlmacenesConfigStore();
    const { datausuarios }   = useUsuariosStore();
    const id_empresa = dataempresa?.id;
    const queryClient = useQueryClient();

    const tipo = datausuarios?.tipo;

    // Superadmin ve dashboard SaaS
    if (tipo === "superadmin") return <DashboardSaaS />;

    const esAdmin = tipo === "administrador";
    const esSupervisor = tipo === "supervisor";
    const esCajero = tipo === "cajero";
    const puedeVerGanancias = esAdmin;

    const almacenesDisponibles = esCajero
        ? (dataAlmacenes ?? []).filter(a => a.id === datausuarios?.id_almacen)
        : esSupervisor
        ? (dataAlmacenes ?? []).filter(a => String(a.id_sucursal) === String(datausuarios?.id_sucursal))
        : (dataAlmacenes ?? []);

    const nombreSucursal = (id) => dataSucursales?.find(s => s.id === id)?.razon_social ?? "—";
    const nombreAlmacen  = (id) => dataAlmacenes?.find(a => a.id === id)?.nombre  ?? "—";
    const nombreUsuario  = (id) => id ? `#${id}` : "—";

    const [filtro, setFiltro]     = useState("todo");
    const [filtroAlmacen, setFiltroAlmacen] = useState("todos");
    const [page, setPage]         = useState(0);
    const [rtPulse, setRtPulse]   = useState(false);

    const almacenQuery = filtroAlmacen === "todos" ? null : Number(filtroAlmacen);

    // Cajero: forzar su almacén
    const almacenEfectivo = esCajero
        ? datausuarios?.id_almacen
        : almacenQuery;

    const { desde, hasta }         = getRango(filtro);
    const { desde: dprev, hasta: hprev } = getPrevRango(filtro);

    const { data: ventasData = [], isFetching: loadV } = useQuery({
        queryKey: ["dash-ventas", id_empresa, filtro, almacenEfectivo],
        queryFn: () => GetVentasStats({ id_empresa, desde, hasta, id_almacen: almacenEfectivo }),
        enabled: !!id_empresa, refetchOnWindowFocus: false,
    });
    const { data: detalleData = [], isFetching: loadD } = useQuery({
        queryKey: ["dash-detalle", id_empresa, filtro, almacenEfectivo],
        queryFn: () => GetDetalleStats({ id_empresa, desde, hasta, id_almacen: almacenEfectivo }),
        enabled: !!id_empresa, refetchOnWindowFocus: false,
    });

    const { data: ventasPrev = [] } = useQuery({
        queryKey: ["dash-ventas-prev", id_empresa, filtro, almacenEfectivo],
        queryFn: () => GetVentasStats({ id_empresa, desde: dprev, hasta: hprev, id_almacen: almacenEfectivo }),
        enabled: !!id_empresa && filtro !== "todo", refetchOnWindowFocus: false,
    });
    const { data: detallePrev = [] } = useQuery({
        queryKey: ["dash-detalle-prev", id_empresa, filtro, almacenEfectivo],
        queryFn: () => GetDetalleStats({ id_empresa, desde: dprev, hasta: hprev, id_almacen: almacenEfectivo }),
        enabled: !!id_empresa && filtro !== "todo", refetchOnWindowFocus: false,
    });

    const { data: movData, isFetching: loadM } = useQuery({
        queryKey: ["dash-movimientos", id_empresa, filtro, page, almacenEfectivo],
        queryFn: () => GetMovimientosCaja({ id_empresa, desde, hasta, id_almacen: almacenEfectivo, page, pageSize: PAGE_SIZE }),
        enabled: !!id_empresa, refetchOnWindowFocus: false,
        placeholderData: (prev) => prev,
    });

    const movimientos = movData?.data ?? [];
    const totalMovRows = movData?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalMovRows / PAGE_SIZE));

    // Inversión en inventario (admin + supervisor, no cajero)
    const { data: inversion = { costo: 0, valor: 0, productos: 0, unidades: 0 } } = useQuery({
        queryKey: ["dash-inversion", id_empresa, almacenEfectivo],
        queryFn: () => GetInversionInventario({ id_empresa, id_almacen: almacenEfectivo }),
        enabled: !!id_empresa && !esCajero, refetchOnWindowFocus: false,
    });

    // Ventas diarias para gráfica
    const { data: ventasDiarias = [] } = useQuery({
        queryKey: ["dash-diarias", id_empresa, filtro, almacenEfectivo],
        queryFn: () => GetVentasDiarias({ id_empresa, desde, hasta, id_almacen: almacenEfectivo }),
        enabled: !!id_empresa, refetchOnWindowFocus: false,
    });

    const almacenSeleccionado = almacenesDisponibles.find(a => a.id === almacenEfectivo);
    const metaVentas = almacenSeleccionado?.meta_ventas ?? 0;

    // Calcular stats
    const totalVentas    = sumTotal(ventasData);
    const totalVentasPrev = sumTotal(ventasPrev);
    const cantProductos  = sumCant(detalleData);
    const cantPrev       = sumCant(detallePrev);

    // TOP productos
    const topProductos = useMemo(() => {
        const mapa = {};
        (detalleData ?? []).forEach(d => {
            const k = d.nombre ?? "Sin nombre";
            if (!mapa[k]) mapa[k] = { nombre: k, cantidad: 0, total: 0 };
            mapa[k].cantidad += Number(d.cantidad) || 0;
            mapa[k].total    += Number(d.total_item) || 0;
        });
        return Object.values(mapa).sort((a, b) => b.cantidad - a.cantidad);
    }, [detalleData]);

    const top5  = topProductos.slice(0, 5);
    const bottom5 = [...topProductos].sort((a, b) => a.cantidad - b.cantidad).slice(0, 5);

    const loading = loadV || loadD;

    // Suscripción real-time a nuevas ventas
    useEffect(() => {
        if (!id_empresa) return;
        const channel = supabase
            .channel(`ventas-rt-${id_empresa}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "ventas", filter: `id_empresa=eq.${id_empresa}` },
                () => {
                    // Refrescar stats y movimientos al instante
                    queryClient.invalidateQueries({ queryKey: ["dash-ventas",      id_empresa] });
                    queryClient.invalidateQueries({ queryKey: ["dash-detalle",     id_empresa] });
                    queryClient.invalidateQueries({ queryKey: ["dash-movimientos", id_empresa] });
                    // Parpadeo visual del badge realtime
                    setRtPulse(true);
                    setTimeout(() => setRtPulse(false), 1200);
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [id_empresa, queryClient]);

    return (
        <Page>
            {/* Encabezado */}
            <TopBar>
                <TopLeft>
                    <TituloPage>Dashboard</TituloPage>
                    {!esCajero && almacenesDisponibles.length > 1 && (
                        <SelectAlmacenDash
                            value={filtroAlmacen}
                            onChange={e => { setFiltroAlmacen(e.target.value); setPage(0); }}
                        >
                            <option value="todos">Todos los almacenes</option>
                            {almacenesDisponibles.map(a => (
                                <option key={a.id} value={a.id}>{a.nombre}</option>
                            ))}
                        </SelectAlmacenDash>
                    )}
                </TopLeft>
                <Filtros>
                    {FILTROS.map(f => (
                        <BtnFiltro key={f.key} $active={filtro === f.key} onClick={() => { setFiltro(f.key); setPage(0); }}>
                            {f.label}
                        </BtnFiltro>
                    ))}
                    <BtnFiltro $limpiar onClick={() => { setFiltro("todo"); setFiltroAlmacen("todos"); setPage(0); }}>
                        Limpiar filtro
                    </BtnFiltro>
                </Filtros>
            </TopBar>

            {/* Grid principal */}
            <Grid>
                {/* Columna izquierda (3/4) */}
                <ColLeft>
                    {/* Métricas principales — no cajero */}
                    {!esCajero && (
                        <>
                            <StatsRow $cols={puedeVerGanancias ? 3 : 4}>
                                <StatCard $loading={loading}>
                                    <StatTop>
                                        <StatLabel>Ventas</StatLabel>
                                        <Icon icon="solar:cart-large-2-bold-duotone" style={{ fontSize: 20, color: "#f88533" }} />
                                    </StatTop>
                                    <StatVal>{loading ? "—" : formatCOP(totalVentas)}</StatVal>
                                    <PctBadge pct={filtro === "todo" ? null : calcPct(totalVentas, totalVentasPrev)} />
                                </StatCard>

                                <StatCard $loading={loading}>
                                    <StatTop>
                                        <StatLabel>Productos vendidos</StatLabel>
                                        <Icon icon="solar:bag-check-bold-duotone" style={{ fontSize: 20, color: "#60a5fa" }} />
                                    </StatTop>
                                    <StatVal>{loading ? "—" : cantProductos.toLocaleString("es-CO")}</StatVal>
                                    <PctBadge pct={filtro === "todo" ? null : calcPct(cantProductos, cantPrev)} />
                                </StatCard>

                                <StatCard>
                                    <StatTop>
                                        <StatLabel>Valor del inventario</StatLabel>
                                        <Icon icon="solar:tag-price-bold-duotone" style={{ fontSize: 20, color: "#4ade80" }} />
                                    </StatTop>
                                    <StatVal $green>{formatCOP(inversion.valor)}</StatVal>
                                    <PctNeutro>{inversion.productos} productos · {inversion.unidades.toLocaleString("es-CO")} uds</PctNeutro>
                                </StatCard>

                                {puedeVerGanancias && (
                                    <StatCard $loading={loading}>
                                        <StatTop>
                                            <StatLabel>Ganancias</StatLabel>
                                            <Icon icon="solar:chart-square-bold-duotone" style={{ fontSize: 20, color: "#a78bfa" }} />
                                        </StatTop>
                                        <StatVal>{loading ? "—" : formatCOP(totalVentas)}</StatVal>
                                        <PctBadge pct={filtro === "todo" ? null : calcPct(totalVentas, totalVentasPrev)} />
                                    </StatCard>
                                )}
                            </StatsRow>

                            {puedeVerGanancias && (
                                <InversionRow>
                                    <InvCard>
                                        <InvIcon $color="#f59e0b"><Icon icon="solar:box-bold-duotone" /></InvIcon>
                                        <InvInfo>
                                            <InvLabel>Invertido en inventario</InvLabel>
                                            <InvVal>{formatCOP(inversion.costo)}</InvVal>
                                        </InvInfo>
                                    </InvCard>
                                    <InvCard>
                                        <InvIcon $color="#4ade80"><Icon icon="solar:chart-square-bold-duotone" /></InvIcon>
                                        <InvInfo>
                                            <InvLabel>Ganancia potencial</InvLabel>
                                            <InvVal $green>{formatCOP(inversion.valor - inversion.costo)}</InvVal>
                                        </InvInfo>
                                    </InvCard>
                                </InversionRow>
                            )}
                        </>
                    )}

                    {/* Gráfica de ventas */}
                    <ChartCard>
                        <ChartHeader>
                            <TableTitle>Ventas por día</TableTitle>
                            {metaVentas > 0 && (
                                <MetaBadge>Meta: {formatCOP(metaVentas)}</MetaBadge>
                            )}
                        </ChartHeader>
                        <ChartWrap>
                            {ventasDiarias.length === 0 ? (
                                <ChartVacio>Sin ventas en este periodo</ChartVacio>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={ventasDiarias}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                                        <Tooltip
                                            formatter={(v) => [formatCOP(v), "Ventas"]}
                                            contentStyle={{ background: "#1C2E42", border: "1px solid #2d4a66", borderRadius: 10, fontSize: 12 }}
                                            labelStyle={{ color: "#94a3b8" }}
                                        />
                                        <Line type="monotone" dataKey="total" stroke="#f88533" strokeWidth={3} dot={{ r: 4, fill: "#f88533" }} activeDot={{ r: 6 }} />
                                        {metaVentas > 0 && (
                                            <ReferenceLine y={metaVentas} stroke="#4ade80" strokeDasharray="6 4" strokeWidth={2} label={{ value: "META", position: "right", fill: "#4ade80", fontSize: 10 }} />
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </ChartWrap>
                    </ChartCard>

                    {/* Movimientos de caja — no cajero */}
                    {!esCajero && <TableCard>
                        <TableHeader>
                            <TableTitle>Movimientos de caja</TableTitle>
                            <RealtimeBadge $pulse={rtPulse}>
                                <span className="dot" /> realtime
                            </RealtimeBadge>
                        </TableHeader>
                        <TableWrap>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Fecha ↕</th>
                                        {esAdmin && <th>Sucursal ↕</th>}
                                        <th>Almacén ↕</th>
                                        <th>Tipo ↕</th>
                                        <th>Usuario ↕</th>
                                        <th>Monto ↕</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadM ? (
                                        <tr><td colSpan={esAdmin ? 6 : 5} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>cargando...</td></tr>
                                    ) : movimientos.length === 0 ? (
                                        <tr><td colSpan={esAdmin ? 6 : 5} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>sin datos...</td></tr>
                                    ) : movimientos.map(m => (
                                        <tr key={m.id}>
                                            <td>{fmtFecha(m.created_at)}</td>
                                            {esAdmin && <td>{nombreSucursal(m.id_sucursal)}</td>}
                                            <td>{m.id_almacen ? nombreAlmacen(m.id_almacen) : "—"}</td>
                                            <td><TipoBadge $tipo={m.metodo_pago}>{m.metodo_pago ?? "—"}</TipoBadge></td>
                                            <td>{nombreUsuario(m.id_usuario)}</td>
                                            <td style={{ fontWeight: 700 }}>{formatCOP(m.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </TableWrap>
                        {/* Paginación */}
                        <Paginacion>
                            <BtnPag disabled={page === 0} onClick={() => setPage(0)}>«</BtnPag>
                            <BtnPag disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</BtnPag>
                            <PagInfo>{page + 1} de {totalPages}</PagInfo>
                            <BtnPag disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>›</BtnPag>
                            <BtnPag disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</BtnPag>
                        </Paginacion>
                    </TableCard>}
                </ColLeft>

                {/* Columna derecha (TOP productos) */}
                <ColRight>
                    {/* TOP 5 cantidad */}
                    <TopCard>
                        <TopTitle>TOP 5</TopTitle>
                        <TopSubtitle>Productos por cantidad vendida</TopSubtitle>
                        {top5.length === 0 ? (
                            <EmptyTop>
                                <Icon icon="fluent-emoji:open-box" style={{ fontSize: 80, opacity: 0.4 }} />
                                <span>sin datos...</span>
                            </EmptyTop>
                        ) : (
                            <TopList>
                                {top5.map((p, i) => (
                                    <TopItem key={p.nombre}>
                                        <TopRank $pos={i}>{i + 1}</TopRank>
                                        <TopNombre>{p.nombre}</TopNombre>
                                        <TopCant>{p.cantidad.toLocaleString("es-CO")} uds</TopCant>
                                    </TopItem>
                                ))}
                            </TopList>
                        )}
                    </TopCard>

                    {/* TOP 5 menos vendidos */}
                    <TopCard>
                        <TopTitle>TOP 5</TopTitle>
                        <TopSubtitle $warn>productos menos vendidos</TopSubtitle>
                        {bottom5.length === 0 ? (
                            <EmptyTop><span style={{ color: "#64748b", fontSize: 13 }}>sin data...</span></EmptyTop>
                        ) : (
                            <TopList>
                                {bottom5.map((p, i) => (
                                    <TopItem key={p.nombre}>
                                        <TopRank $pos={-1}>{i + 1}</TopRank>
                                        <TopNombre>{p.nombre}</TopNombre>
                                        <TopCant style={{ color: "#f87171" }}>{p.cantidad.toLocaleString("es-CO")} uds</TopCant>
                                    </TopItem>
                                ))}
                            </TopList>
                        )}
                    </TopCard>
                </ColRight>
            </Grid>
        </Page>
    );
}

/* ── Animations ──────────────────────────────── */
const fadeUp = keyframes`from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; }`;

/* ── Styled ──────────────────────────────────── */

const Page = styled.div`
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    padding: 28px 24px;
    animation: ${fadeUp} 0.35s ease;

    @media (max-width: 767px) {
        padding: 68px 12px 20px;
    }
`;

const TopBar = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 24px;
`;

const TopLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
    margin-right: auto;
    flex-wrap: wrap;
`;

const TituloPage = styled.h1`
    font-size: 26px;
    font-weight: 900;
    color: ${({ theme }) => theme.text};
    margin: 0;
`;

const SelectAlmacenDash = styled.select`
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards};
    color: ${({ theme }) => theme.text};
    font-size: 12px;
    font-weight: 600;
    font-family: "Poppins", sans-serif;
    outline: none;
    cursor: pointer;
    &:focus { border-color: #f88533; }
`;

const Filtros = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
`;

const BtnFiltro = styled.button`
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid ${({ $active, $limpiar, theme }) =>
        $limpiar ? "transparent" : $active ? "#2563eb" : theme.color2};
    background: ${({ $active, $limpiar }) =>
        $limpiar ? "transparent" : $active ? "#2563eb" : "transparent"};
    color: ${({ $active, $limpiar, theme }) =>
        $limpiar ? "#f87171" : $active ? "#fff" : theme.text};
    font-size: 12px;
    font-weight: 600;
    font-family: "Poppins", sans-serif;
    cursor: pointer;
    transition: all 0.15s;
    &:hover { opacity: 0.8; }
`;

const Grid = styled.div`
    display: flex;
    gap: 20px;
    align-items: flex-start;

    @media (max-width: 767px) {
        flex-direction: column;
    }
`;

const ColLeft = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
`;

const ColRight = styled.div`
    width: 260px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;

    @media (max-width: 767px) {
        width: 100%;
    }
`;

/* ── Chart ── */
const ChartCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
    overflow: hidden;
`;

const ChartHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 8px;
`;

const MetaBadge = styled.span`
    font-size: 11px;
    font-weight: 700;
    color: #4ade80;
    background: rgba(74,222,128,0.12);
    padding: 4px 10px;
    border-radius: 20px;
`;

const ChartWrap = styled.div`
    padding: 0 10px 10px;
`;

const ChartVacio = styled.div`
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    opacity: 0.6;
`;

/* ── Stat cards ── */
const StatsRow = styled.div`
    display: grid;
    grid-template-columns: repeat(${({ $cols }) => $cols || 3}, 1fr);
    gap: 14px;

    @media (max-width: 600px) {
        grid-template-columns: 1fr 1fr;
    }
`;

const StatCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 16px;
    padding: 18px 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    opacity: ${({ $loading }) => $loading ? 0.6 : 1};
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.15s;
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.12);
    }
`;

const StatTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
`;

const StatLabel = styled.span`
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

/* ── Inversión cards ── */
const InversionRow = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const InvCard = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
    transition: transform 0.15s, box-shadow 0.15s;
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.12);
    }
`;

const InvIcon = styled.div`
    font-size: 28px;
    color: ${({ $color }) => $color};
    flex-shrink: 0;
`;

const InvInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
`;

const InvLabel = styled.span`
    font-size: 11px;
    font-weight: 600;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

const InvVal = styled.span`
    font-size: 16px;
    font-weight: 900;
    color: ${({ $green, theme }) => $green ? "#4ade80" : theme.text};
`;

const StatVal = styled.div`
    font-size: 22px;
    font-weight: 900;
    color: ${({ theme }) => theme.text};
    margin-bottom: 6px;
`;

const PctUp   = styled.span`font-size: 11px; font-weight: 600; color: #4ade80;`;
const PctDown = styled.span`font-size: 11px; font-weight: 600; color: #f87171;`;
const PctNeutro = styled.span`font-size: 11px; font-weight: 600; color: #64748b;`;

const TotalCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
    padding: 22px 24px;
    opacity: ${({ $loading }) => $loading ? 0.6 : 1};
    transition: opacity 0.2s;
`;

const TotalVal = styled.div`
    font-size: 30px;
    font-weight: 900;
    color: ${({ theme }) => theme.text};
    margin: 10px 0 8px;
`;

/* ── Table card ── */
const TableCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
    overflow: hidden;
`;

const TableHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const TableTitle = styled.span`
    font-size: 14px;
    font-weight: 800;
    color: ${({ theme }) => theme.text};
`;

const RealtimeBadge = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    color: ${({ $pulse }) => $pulse ? "#fff" : "#4ade80"};
    background: ${({ $pulse }) => $pulse ? "#16a34a" : "transparent"};
    padding: 3px 8px;
    border-radius: 20px;
    transition: background 0.3s, color 0.3s;
    .dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: ${({ $pulse }) => $pulse ? "#fff" : "#4ade80"};
        animation: pulse 1.5s infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
`;

const TableWrap = styled.div`
    overflow-x: auto;
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
    }
    thead tr {
        background: ${({ theme }) => theme.bgtotal};
    }
    th {
        padding: 10px 14px;
        text-align: left;
        font-weight: 700;
        color: ${({ theme }) => theme.colorsubtitlecard};
        white-space: nowrap;
        border-bottom: 1px solid ${({ theme }) => theme.color2};
    }
    td {
        padding: 11px 14px;
        color: ${({ theme }) => theme.text};
        border-bottom: 1px solid ${({ theme }) => theme.color2};
        white-space: nowrap;
    }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: ${({ theme }) => theme.bgtotal}; }
`;

const TipoBadge = styled.span`
    display: inline-block;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    background: ${({ $tipo }) =>
        $tipo === "efectivo" ? "rgba(74,222,128,0.12)" :
        $tipo === "qr"       ? "rgba(99,102,241,0.15)" :
        $tipo === "mixto"    ? "rgba(251,191,36,0.15)" :
        "rgba(148,163,184,0.12)"};
    color: ${({ $tipo }) =>
        $tipo === "efectivo" ? "#4ade80" :
        $tipo === "qr"       ? "#818cf8" :
        $tipo === "mixto"    ? "#fbbf24" :
        "#94a3b8"};
    text-transform: capitalize;
`;

const Paginacion = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid ${({ theme }) => theme.color2};
`;

const BtnPag = styled.button`
    width: 32px; height: 32px;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 14px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
    &:disabled { opacity: 0.35; cursor: default; }
    &:not(:disabled):hover { background: #2563eb; color: #fff; border-color: #2563eb; }
`;

const PagInfo = styled.span`
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colorsubtitlecard};
    min-width: 60px;
    text-align: center;
`;

/* ── Top cards ── */
const TopCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
    padding: 18px 16px;
`;

const TopTitle = styled.div`
    font-size: 15px;
    font-weight: 900;
    color: ${({ theme }) => theme.text};
    text-align: center;
`;

const TopSubtitle = styled.div`
    font-size: 11px;
    font-weight: 600;
    color: ${({ $warn }) => $warn ? "#f87171" : "#6366f1"};
    text-align: center;
    margin-bottom: 14px;
`;

const EmptyTop = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px 0;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 12px;
`;

const TopList = styled.div`display: flex; flex-direction: column; gap: 8px;`;

const TopItem = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border-radius: 8px;
    background: ${({ theme }) => theme.bgtotal};
`;

const TopRank = styled.div`
    width: 22px; height: 22px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
    font-weight: 800;
    flex-shrink: 0;
    background: ${({ $pos }) =>
        $pos === -1 ? "rgba(248,113,113,0.15)" :
        $pos === 0 ? "#fbbf24" :
        $pos === 1 ? "#94a3b8" :
        $pos === 2 ? "#f97316" :
        "rgba(99,102,241,0.2)"};
    color: ${({ $pos }) => $pos === -1 ? "#f87171" : $pos < 3 ? "#111" : "#6366f1"};
`;

const TopNombre = styled.span`
    flex: 1;
    font-size: 11px;
    font-weight: 700;
    color: ${({ theme }) => theme.text};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const TopCant = styled.span`
    font-size: 11px;
    font-weight: 700;
    color: ${({ theme }) => theme.colorsubtitlecard};
    white-space: nowrap;
`;
