import { useState, useMemo, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useSucursalesStore } from "../../store/SucursalesStore";
import { useAlmacenesConfigStore } from "../../store/AlmacenesConfigStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { supabase } from "../../index";
import { MostrarKardexPorAlmacen, InsertarMovimientoKardex } from "../../supabase/crudKardex";
import { MostrarInventarioPorAlmacen, AjustarStock } from "../../supabase/crudAlmacenes";
import { MostrarTodasEmpresas } from "../../supabase/crudEmpresa";
import { MostrarTodasSucursales } from "../../supabase/crudSucursales";
import { MostrarTodosAlmacenes } from "../../supabase/crudAlmacenesConfig";
import { RiStore2Line, RiAddLine, RiCloseLine, RiArrowUpLine, RiArrowDownLine, RiEqualizerLine, RiCalendarLine, RiFilterOffLine, RiArrowDownSLine, RiLockPasswordLine, RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { FaBuilding } from "react-icons/fa";
import { toastExito, toastError } from "../../utils/toast";
import { VerificarPasswordAdmin } from "../../supabase/crudAuth";

const formatCOP = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);

function fmtFecha(iso) {
    return new Date(iso).toLocaleString("es-CO", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

const COLORES = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#3b82f6"];

const TIPOS = {
    entrada: { label: "Entrada",  color: "#4ade80", bg: "rgba(74,222,128,0.12)",  icon: RiArrowUpLine },
    salida:  { label: "Salida",   color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: RiArrowDownLine },
    ajuste:  { label: "Ajuste",   color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  icon: RiEqualizerLine },
    venta:   { label: "Venta",    color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  icon: RiArrowDownLine },
};

const PAGE_SIZE = 20;

export function KardexTemplate() {
    const { dataempresa }    = useEmpresaStore();
    const { dataSucursales, mostrarSucursales } = useSucursalesStore();
    const { dataAlmacenes, mostrarAlmacenes }   = useAlmacenesConfigStore();
    const { datausuarios }   = useUsuariosStore();
    const queryClient = useQueryClient();

    const esSuperAdmin  = datausuarios?.tipo === "superadmin";
    const esSupervisor  = datausuarios?.tipo === "supervisor";
    const esCajero      = datausuarios?.tipo === "cajero";
    const id_empresa    = dataempresa?.id;

    // Restricciones de visibilidad por rol
    const idSucursalUsuario = datausuarios?.id_sucursal ?? null;
    const idAlmacenUsuario  = datausuarios?.id_almacen  ?? null;

    /* ── Queries usuario normal ── */
    useQuery({
        queryKey: ["sucursales-kdx", id_empresa],
        queryFn:  () => mostrarSucursales({ id_empresa }),
        enabled:  !!id_empresa && !esSuperAdmin,
        refetchOnWindowFocus: false,
    });
    useQuery({
        queryKey: ["almacenes-kdx", id_empresa],
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
    const [almacenActivo,       setAlmacenActivo]       = useState(
        esCajero ? idAlmacenUsuario : null
    );
    const [empresasExpandidas,  setEmpresasExpandidas]  = useState(new Set());
    const [filtroTipo,          setFiltroTipo]          = useState("todos");
    const [desde,               setDesde]               = useState("");
    const [hasta,               setHasta]               = useState("");
    const [page,                setPage]                = useState(0);
    const [modalAbierto,        setModalAbierto]        = useState(false);
    const [modalPassword,       setModalPassword]       = useState(false);
    const [passwordInput,       setPasswordInput]       = useState("");
    const [verPassword,         setVerPassword]         = useState(false);
    const [verificando,         setVerificando]         = useState(false);
    const [formTipo,            setFormTipo]            = useState("entrada");
    const [formProducto,        setFormProducto]        = useState(null);
    const [formCantidad,        setFormCantidad]        = useState("");
    const [formDesc,            setFormDesc]            = useState("");
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

    /* ── Datos agrupados filtrados por rol ── */
    const grupos = useMemo(() => {
        let sucursales = dataSucursales ?? [];
        let almacenes  = dataAlmacenes  ?? [];

        if (esSupervisor) {
            sucursales = sucursales.filter(s => s.id === idSucursalUsuario);
            almacenes  = almacenes.filter(a => a.id_sucursal === idSucursalUsuario);
        } else if (esCajero) {
            almacenes  = almacenes.filter(a => a.id === idAlmacenUsuario);
            const sucIds = new Set(almacenes.map(a => a.id_sucursal));
            sucursales = sucursales.filter(s => sucIds.has(s.id));
        }

        return sucursales
            .map(s => ({ ...s, almacenes: almacenes.filter(a => a.id_sucursal === s.id) }))
            .filter(s => s.almacenes.length > 0);
    }, [dataSucursales, dataAlmacenes, esSupervisor, esCajero, idSucursalUsuario, idAlmacenUsuario]);

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
    const listAlmacenes  = esSuperAdmin ? todosAlmacenes  : (dataAlmacenes  ?? []);
    const listSucursales = esSuperAdmin ? todasSucursales : (dataSucursales ?? []);

    const almacenId = esCajero
        ? idAlmacenUsuario
        : (almacenActivo ?? (esSuperAdmin ? null : (grupos[0]?.almacenes[0]?.id ?? null)));
    const almacenObj  = listAlmacenes.find(a => a.id === almacenId);
    const sucursalObj = listSucursales.find(s => s.id === almacenObj?.id_sucursal);
    const empresaObj  = esSuperAdmin
        ? todasEmpresas.find(e => e.id === sucursalObj?.id_empresa)
        : dataempresa;

    const id_empresa_query = esSuperAdmin ? (sucursalObj?.id_empresa ?? null) : id_empresa;
    const colorAlmacen = COLORES[(listAlmacenes.findIndex(a => a.id === almacenId) ?? 0) % COLORES.length];

    /* ── Kardex del almacén activo ── */
    const { data: kardexData, isFetching } = useQuery({
        queryKey: ["kardex", id_empresa_query, almacenId, filtroTipo, desde, hasta, page],
        queryFn:  () => MostrarKardexPorAlmacen({ id_empresa: id_empresa_query, id_almacen: almacenId, tipo: filtroTipo, desde: desde || undefined, hasta: hasta || undefined, page, pageSize: PAGE_SIZE }),
        enabled:  !!id_empresa_query && !!almacenId,
        refetchOnWindowFocus: false,
        placeholderData: prev => prev,
    });

    /* ── Usuarios de la empresa activa ── */
    const { data: listaUsuarios = [] } = useQuery({
        queryKey: ["usuarios-kdx", id_empresa_query],
        queryFn:  async () => {
            const { data } = await supabase
                .from("usuarios")
                .select("id, usuario, nombres")
                .eq("id_empresa", id_empresa_query);
            return data ?? [];
        },
        enabled: !!id_empresa_query,
        refetchOnWindowFocus: false,
    });
    const usuariosMap = useMemo(() => {
        const map = {};
        listaUsuarios.forEach(u => {
            map[u.id] = u.nombres && u.nombres !== "-" ? u.nombres.split(" ")[0] : (u.usuario ?? "—");
        });
        return map;
    }, [listaUsuarios]);

    /* ── Productos del almacén para el modal ── */
    const { data: productos = [] } = useQuery({
        queryKey: ["inventario-kdx", id_empresa_query, almacenId],
        queryFn:  () => MostrarInventarioPorAlmacen({ id_empresa: id_empresa_query, id_almacen: almacenId, soloConInventario: false }),
        enabled:  !!id_empresa_query && !!almacenId && modalAbierto,
        refetchOnWindowFocus: false,
    });

    const movimientos = kardexData?.data ?? [];
    const totalRows   = kardexData?.count ?? 0;
    const totalPages  = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

    const mutRegistrar = useMutation({
        mutationFn: async () => {
            if (!formProducto || !formCantidad) return;
            const prod = productos.find(p => p.id === Number(formProducto));
            if (!prod) return;
            const cantidad     = Number(formCantidad) || 0;
            const stockAnterior = prod.stock ?? 0;
            const stockNuevo   = formTipo === "entrada"
                ? stockAnterior + cantidad
                : stockAnterior - cantidad;

            await AjustarStock({
                id_stock:        prod.id_stock,
                id_producto:     prod.id,
                id_almacen:      almacenId,
                id_sucursal:     almacenObj?.id_sucursal ?? null,
                id_empresa:      id_empresa_query,
                stock:           stockNuevo,
                stock_minimo:    prod.stock_minimo,
                stock_anterior:  stockAnterior,
                nombre_producto: prod.nombre,
                tipo:            formTipo,
                descripcion:     formDesc || null,
                id_usuario:      datausuarios?.id ?? null,
            });
        },
        onSuccess: () => {
            toastExito("Movimiento registrado", "Kardex");
            queryClient.invalidateQueries({ queryKey: ["kardex",         id_empresa_query, almacenId] });
            queryClient.invalidateQueries({ queryKey: ["inventario",     id_empresa_query, almacenId] });
            queryClient.invalidateQueries({ queryKey: ["inventario-kdx", id_empresa_query, almacenId] });
            setModalAbierto(false);
            setFormProducto(null);
            setFormCantidad("");
            setFormDesc("");
        },
    });

    function seleccionarAlmacen(id) {
        setAlmacenActivo(id);
        setPage(0);
    }

    return (
        <Layout>
            {/* ── Panel izquierdo ── */}
            <PanelAlmacenes>
                <PanelTitulo>
                    {esSuperAdmin ? "Clientes" : esCajero ? "Mi almacén" : "Almacenes"}
                </PanelTitulo>

                {esCajero ? (
                    <AlmacenItem $activo={true} $color={colorAlmacen} style={{ cursor: "default" }}>
                        <AlmacenDot $color={colorAlmacen} />
                        <AlmacenInfo>
                            <span className="nombre">{almacenObj?.nombre ?? "—"}</span>
                            <span className="sucursal">{sucursalObj?.nombre ?? "—"}</span>
                        </AlmacenInfo>
                        <Chevron>›</Chevron>
                    </AlmacenItem>
                ) : esSuperAdmin ? (
                    empresaGrupos.length === 0 ? (
                        <SinAlmacenes>Cargando clientes...</SinAlmacenes>
                    ) : empresaGrupos.map(emp => {
                        const expandida  = empresasExpandidas.has(emp.id);
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
                                                        const idx    = todosAlmacenes.findIndex(a => a.id === alm.id);
                                                        const color  = COLORES[idx % COLORES.length];
                                                        const activo = almacenId === alm.id;
                                                        return (
                                                            <AlmacenItem key={alm.id} $activo={activo} $color={color}
                                                                onClick={() => seleccionarAlmacen(alm.id)}>
                                                                <AlmacenDot $color={color} />
                                                                <AlmacenInfo>
                                                                    <span className="nombre">{alm.nombre}</span>
                                                                    <span className="sucursal">{suc.nombre}</span>
                                                                </AlmacenInfo>
                                                                {activo && <Chevron>›</Chevron>}
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
                    grupos.map(suc => (
                        <GrupoSucursal key={suc.id}>
                            <GrupoLabel><RiStore2Line style={{ fontSize: 12 }} />{suc.nombre}</GrupoLabel>
                            {suc.almacenes.map(alm => {
                                const idx    = dataAlmacenes?.findIndex(a => a.id === alm.id) ?? 0;
                                const color  = COLORES[idx % COLORES.length];
                                const activo = almacenId === alm.id;
                                return (
                                    <AlmacenItem key={alm.id} $activo={activo} $color={color}
                                        onClick={() => seleccionarAlmacen(alm.id)}>
                                        <AlmacenDot $color={color} />
                                        <AlmacenInfo>
                                            <span className="nombre">{alm.nombre}</span>
                                            <span className="sucursal">{suc.nombre}</span>
                                        </AlmacenInfo>
                                        {activo && <Chevron>›</Chevron>}
                                    </AlmacenItem>
                                );
                            })}
                        </GrupoSucursal>
                    ))
                )}
            </PanelAlmacenes>

            {/* ── Contenido ── */}
            <Contenido>
                <AlmacenHeader $color={colorAlmacen}>
                    <HeaderLeft>
                        {esSuperAdmin && empresaObj && (
                            <EmpresaTag>
                                <FaBuilding />
                                {empresaObj.razon_social}
                            </EmpresaTag>
                        )}
                        {esSupervisor && sucursalObj && (
                            <EmpresaTag style={{ color: "#10b981" }}>
                                <RiStore2Line />
                                {sucursalObj.nombre}
                            </EmpresaTag>
                        )}
                        {esCajero && (
                            <EmpresaTag style={{ color: "#60a5fa" }}>
                                <RiStore2Line />
                                Solo lectura · Tu almacén
                            </EmpresaTag>
                        )}
                        <AlmacenNombre>
                            {almacenObj?.nombre ?? (esSuperAdmin ? "Selecciona un cliente y almacén" : "Selecciona un almacén")}
                        </AlmacenNombre>
                    </HeaderLeft>
                    {!esCajero && (
                        <BtnNuevo
                            onClick={() => esSupervisor ? setModalPassword(true) : setModalAbierto(true)}
                            disabled={!almacenId}
                        >
                            <RiAddLine style={{ fontSize: 18 }} />
                            Nuevo movimiento
                        </BtnNuevo>
                    )}
                </AlmacenHeader>

                {/* Filtros */}
                <FiltrosRow>
                    <FiltroChip $active={filtroTipo === "todos"} onClick={() => { setFiltroTipo("todos"); setPage(0); }}>Todos</FiltroChip>
                    {Object.entries(TIPOS).map(([key, t]) => (
                        <FiltroChip key={key} $active={filtroTipo === key} $color={t.color}
                            onClick={() => { setFiltroTipo(key); setPage(0); }}>
                            {t.label}
                        </FiltroChip>
                    ))}
                    <FiltroSep />
                    <DateInput type="date" value={desde} onChange={e => { setDesde(e.target.value); setPage(0); }} title="Desde" />
                    <DateInput type="date" value={hasta} onChange={e => { setHasta(e.target.value); setPage(0); }} title="Hasta" />
                    {(desde || hasta) && (
                        <BtnLimpiar title="Limpiar fechas" onClick={() => { setDesde(""); setHasta(""); setPage(0); }}>
                            <RiFilterOffLine />
                        </BtnLimpiar>
                    )}
                </FiltrosRow>

                {almacenId && !isFetching && (
                    <TotalInfo>
                        {totalRows} movimiento{totalRows !== 1 ? "s" : ""}
                        {filtroTipo !== "todos" && ` · ${TIPOS[filtroTipo]?.label}`}
                        {desde && ` · desde ${desde}`}
                        {hasta && ` · hasta ${hasta}`}
                    </TotalInfo>
                )}

                <TablaCard>
                    <Tabla>
                        <thead>
                            <tr>
                                <Th>Fecha</Th>
                                <Th>Producto</Th>
                                <Th>Tipo</Th>
                                <Th $center>Cantidad</Th>
                                <Th $center>Stock ant.</Th>
                                <Th $center>Stock nuevo</Th>
                                <Th>Usuario</Th>
                                <Th>Descripción</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {!almacenId ? (
                                <tr><TdVacio colSpan={8}>
                                    {esSuperAdmin
                                        ? "Expande un cliente y selecciona un almacén para ver su kardex"
                                        : "Selecciona un almacén para ver su kardex"}
                                </TdVacio></tr>
                            ) : isFetching ? (
                                <tr><TdVacio colSpan={8}>Cargando movimientos...</TdVacio></tr>
                            ) : movimientos.length === 0 ? (
                                <tr><TdVacio colSpan={8}>Sin movimientos registrados en este almacén</TdVacio></tr>
                            ) : movimientos.map(m => {
                                const tipo = TIPOS[m.tipo] ?? TIPOS.ajuste;
                                const TipoIcon = tipo.icon;
                                return (
                                    <FilaTr key={m.id}>
                                        <Td style={{ fontSize: 12, opacity: 0.8 }}>{fmtFecha(m.created_at)}</Td>
                                        <Td><NombreProd>{m.nombre_producto}</NombreProd></Td>
                                        <Td>
                                            <TipoBadge $bg={tipo.bg} $color={tipo.color}>
                                                <TipoIcon />
                                                {tipo.label}
                                            </TipoBadge>
                                        </Td>
                                        <Td $center>
                                            <CantBadge $tipo={m.tipo}>
                                                {m.tipo === "salida" || m.tipo === "venta" ? "−" : "+"}{m.cantidad}
                                            </CantBadge>
                                        </Td>
                                        <Td $center style={{ opacity: 0.7 }}>{m.stock_anterior}</Td>
                                        <Td $center><b style={{ color: m.stock_nuevo <= 0 ? "#f87171" : "inherit" }}>{m.stock_nuevo}</b></Td>
                                        <Td><UsuarioBadge>{m.id_usuario ? (usuariosMap[m.id_usuario] ?? `#${m.id_usuario}`) : "—"}</UsuarioBadge></Td>
                                        <Td style={{ fontSize: 12, opacity: 0.7 }}>{m.descripcion ?? "—"}</Td>
                                    </FilaTr>
                                );
                            })}
                        </tbody>
                    </Tabla>

                    <Paginacion>
                        <BtnPag disabled={page === 0} onClick={() => setPage(0)}>«</BtnPag>
                        <BtnPag disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</BtnPag>
                        <PagInfo>{page + 1} de {totalPages}</PagInfo>
                        <BtnPag disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>›</BtnPag>
                        <BtnPag disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</BtnPag>
                    </Paginacion>
                </TablaCard>
            </Contenido>

            {/* ── Modal autorización superadmin ── */}
            {modalPassword && (
                <Overlay onClick={() => { setModalPassword(false); setPasswordInput(""); }}>
                    <Modal onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <ModalHeader>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <RiLockPasswordLine style={{ color: "#f88533" }} />
                                Autorización requerida
                            </span>
                            <BtnCerrarModal onClick={() => { setModalPassword(false); setPasswordInput(""); }}>
                                <RiCloseLine />
                            </BtnCerrarModal>
                        </ModalHeader>
                        <ModalBody>
                            <AuthInfo>
                                <RiLockPasswordLine style={{ color: "#f88533", flexShrink: 0, fontSize: 18 }} />
                                <span>
                                    Para registrar movimientos en <strong>{almacenObj?.nombre ?? "este almacén"}</strong> se requiere autorización. Ingresa la contraseña del <strong>administrador</strong>.
                                </span>
                            </AuthInfo>
                            <Campo>
                                <label>Contraseña del administrador</label>
                                <PasswordWrap>
                                    <Input
                                        type={verPassword ? "text" : "password"}
                                        placeholder="Contraseña..."
                                        value={passwordInput}
                                        onChange={e => setPasswordInput(e.target.value)}
                                        onKeyDown={async e => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                if (!passwordInput || verificando) return;
                                                setVerificando(true);
                                                const res = await VerificarPasswordAdmin({ id_empresa: empresaObj?.id, password: passwordInput });
                                                setVerificando(false);
                                                if (res.ok) {
                                                    setModalPassword(false);
                                                    setPasswordInput("");
                                                    setModalAbierto(true);
                                                } else {
                                                    toastError(res.error, "Autorización");
                                                }
                                            }
                                        }}
                                        autoFocus
                                        style={{ paddingRight: 40 }}
                                    />
                                    <BtnVerPass onClick={() => setVerPassword(v => !v)} type="button" tabIndex={-1}>
                                        {verPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                                    </BtnVerPass>
                                </PasswordWrap>
                            </Campo>
                        </ModalBody>
                        <ModalFooter>
                            <BtnCancelar onClick={() => { setModalPassword(false); setPasswordInput(""); }}>Cancelar</BtnCancelar>
                            <BtnGuardar
                                disabled={!passwordInput || verificando}
                                onClick={async () => {
                                    setVerificando(true);
                                    const res = await VerificarPasswordAdmin({ id_empresa: empresaObj?.id, password: passwordInput });
                                    setVerificando(false);
                                    if (res.ok) {
                                        setModalPassword(false);
                                        setPasswordInput("");
                                        setModalAbierto(true);
                                    } else {
                                        toastError(res.error, "Autorización");
                                    }
                                }}
                            >
                                {verificando ? "Verificando..." : "Confirmar"}
                            </BtnGuardar>
                        </ModalFooter>
                    </Modal>
                </Overlay>
            )}

            {/* ── Modal nuevo movimiento ── */}
            {modalAbierto && (
                <Overlay onClick={() => setModalAbierto(false)}>
                    <Modal onClick={e => e.stopPropagation()}>
                        <ModalHeader>
                            <span>Nuevo movimiento</span>
                            <BtnCerrarModal onClick={() => setModalAbierto(false)}><RiCloseLine /></BtnCerrarModal>
                        </ModalHeader>

                        <ModalBody>
                            <Campo>
                                <label>Tipo de movimiento</label>
                                <TiposGrid>
                                    {["entrada", "salida", "ajuste"].map(t => {
                                        const info = TIPOS[t];
                                        const TipoIcon = info.icon;
                                        return (
                                            <TipoBtn key={t} $active={formTipo === t} $color={info.color}
                                                onClick={() => setFormTipo(t)}>
                                                <TipoIcon />
                                                {info.label}
                                            </TipoBtn>
                                        );
                                    })}
                                </TiposGrid>
                            </Campo>

                            <Campo>
                                <label>Producto</label>
                                <Select value={formProducto ?? ""} onChange={e => setFormProducto(e.target.value)}>
                                    <option value="">— Seleccionar producto —</option>
                                    {productos.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre} (stock actual: {p.stock})
                                        </option>
                                    ))}
                                </Select>
                            </Campo>

                            <Campo>
                                <label>Cantidad</label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formCantidad}
                                    onChange={e => setFormCantidad(e.target.value)}
                                />
                            </Campo>

                            {formProducto && formCantidad && (
                                <PreviewStock>
                                    {(() => {
                                        const p = productos.find(x => x.id === Number(formProducto));
                                        if (!p) return null;
                                        const ant   = p.stock ?? 0;
                                        const nuevo = formTipo === "entrada"
                                            ? ant + Number(formCantidad)
                                            : ant - Number(formCantidad);
                                        return (
                                            <>
                                                <span>Stock actual: <b>{ant}</b></span>
                                                <Arrow>→</Arrow>
                                                <span>Stock nuevo: <b style={{ color: formTipo === "entrada" ? "#4ade80" : "#f87171" }}>{nuevo}</b></span>
                                            </>
                                        );
                                    })()}
                                </PreviewStock>
                            )}

                            <Campo>
                                <label>Descripción <Opcional>(opcional)</Opcional></label>
                                <Input
                                    placeholder="Motivo del movimiento..."
                                    value={formDesc}
                                    onChange={e => setFormDesc(e.target.value)}
                                />
                            </Campo>
                        </ModalBody>

                        <ModalFooter>
                            <BtnCancelar onClick={() => setModalAbierto(false)}>Cancelar</BtnCancelar>
                            <BtnGuardar
                                disabled={!formProducto || !formCantidad || mutRegistrar.isPending}
                                onClick={() => mutRegistrar.mutate()}
                            >
                                {mutRegistrar.isPending ? "Guardando..." : "Registrar movimiento"}
                            </BtnGuardar>
                        </ModalFooter>
                    </Modal>
                </Overlay>
            )}
        </Layout>
    );
}

/* ── Animations ── */
const fadeUp   = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;
const fadeIn   = keyframes`from{opacity:0}to{opacity:1}`;
const slideUp  = keyframes`from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}`;
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
    width: 230px; flex-shrink: 0;
    border-right: 1px solid ${({ theme }) => theme.color2};
    padding: 24px 10px;
    display: flex; flex-direction: column; gap: 4px;
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
        &::-webkit-scrollbar { height: 3px; }
        &::-webkit-scrollbar-thumb {
            background: ${({ theme }) => theme.colorScroll};
            border-radius: 10px;
        }
    }
`;
const PanelTitulo = styled.div`
    font-size: 11px; font-weight: 800; letter-spacing: 1.2px;
    text-transform: uppercase; color: ${({ theme }) => theme.colorsubtitlecard};
    padding: 0 8px; margin-bottom: 12px;

    @media (max-width: 767px) { display: none; }
`;
const SinAlmacenes = styled.div`
    font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard};
    text-align: center; padding: 20px 8px;
`;

/* ── Empresa level (superadmin) ── */
const GrupoEmpresa = styled.div`
    margin-bottom: 4px;
    @media (max-width: 767px) { margin-bottom: 0; display: contents; }
`;
const EmpresaItem = styled.button`
    width: 100%; display: flex; align-items: center; gap: 7px;
    padding: 9px 10px; border-radius: 10px;
    border: 1.5px solid ${({ $activa, theme }) => $activa ? "rgba(248,133,51,0.4)" : theme.color2};
    background: ${({ $activa, theme }) => $activa ? "rgba(248,133,51,0.08)" : theme.bgtotal};
    cursor: pointer; transition: all 0.15s; text-align: left;
    &:hover { border-color: rgba(248,133,51,0.3); background: rgba(248,133,51,0.05); }
    .icono-empresa { font-size: 13px; color: #f88533; flex-shrink: 0; }
    .nombre-empresa {
        flex: 1; font-size: 12px; font-weight: 800; color: ${({ theme }) => theme.text};
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.1px;
    }
    .chevron { font-size: 16px; color: ${({ theme }) => theme.colorsubtitlecard}; flex-shrink: 0; transition: transform 0.2s; }
    .chevron.abierto { transform: rotate(180deg); }

    @media (max-width: 767px) {
        width: auto; flex-shrink: 0; padding: 7px 12px; border-radius: 20px; white-space: nowrap;
        .chevron { display: none; }
    }
`;
const ContenidoEmpresa = styled.div`
    padding-left: 10px;
    animation: ${slideDown} 0.18s ease;
    @media (max-width: 767px) { padding-left: 0; display: contents; }
`;

/* ── Sucursal level ── */
const GrupoSucursal = styled.div`
    margin-bottom: 8px;
    @media (max-width: 767px) { margin-bottom: 0; display: contents; }
`;
const GrupoLabel = styled.div`
    display: flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.8px;
    text-transform: uppercase; color: ${({ theme }) => theme.colorsubtitlecard};
    padding: 4px 8px; margin-bottom: 3px; opacity: 0.7;
    @media (max-width: 767px) { display: none; }
`;

/* ── Almacen level ── */
const AlmacenItem = styled.button`
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 10px; border: none;
    background: ${({ $activo, $color }) => $activo ? `${$color}18` : "transparent"};
    cursor: pointer; text-align: left;
    outline: ${({ $activo, $color }) => $activo ? `1.5px solid ${$color}50` : "none"};
    transition: background 0.15s;
    &:hover { background: ${({ $color }) => `${$color}12`}; }

    @media (max-width: 767px) {
        width: auto; flex-shrink: 0; padding: 7px 12px; border-radius: 20px;
        border: 1.5px solid ${({ $activo, $color, theme }) => $activo ? $color : theme.color2};
        background: ${({ $activo, $color }) => $activo ? `${$color}22` : "transparent"};
        outline: none; white-space: nowrap;
    }
`;
const AlmacenDot = styled.div`
    width: 9px; height: 9px; border-radius: 50%;
    background: ${({ $color }) => $color}; flex-shrink: 0;
`;
const AlmacenInfo = styled.div`
    flex: 1; display: flex; flex-direction: column; min-width: 0;
    .nombre { font-size: 12px; font-weight: 700; color: ${({ theme }) => theme.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sucursal { font-size: 10px; color: ${({ theme }) => theme.colorsubtitlecard}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;
const Chevron = styled.span`
    font-size: 18px; font-weight: 700; color: ${({ theme }) => theme.colorsubtitlecard};
    @media (max-width: 767px) { display: none; }
`;

/* ── Contenido ── */
const Contenido = styled.div`
    flex: 1; padding: 24px;
    display: flex; flex-direction: column; gap: 16px; min-width: 0;

    @media (max-width: 767px) { padding: 12px; }
`;
const AlmacenHeader = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-left: 4px solid ${({ $color }) => $color};
    border-radius: 12px; padding: 16px 20px;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;

    @media (max-width: 767px) { padding: 12px 14px; }
`;
const HeaderLeft = styled.div`display: flex; flex-direction: column; gap: 3px;`;
const EmpresaTag = styled.div`
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 700; color: #f88533; letter-spacing: 0.2px;
`;
const AlmacenNombre = styled.div`font-size: 18px; font-weight: 900; color: ${({ theme }) => theme.text};`;
const AlmacenSucursal = styled.div`font-size: 12px; font-weight: 600; color: ${({ theme }) => theme.colorsubtitlecard};`;

const BtnNuevo = styled.button`
    display: flex; align-items: center; gap: 8px;
    padding: 9px 18px; border-radius: 10px;
    border: none; background: #2563eb; color: #fff;
    font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif;
    transition: background 0.15s;
    &:hover { background: #1d4ed8; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

/* ── Filtros ── */
const FiltrosRow = styled.div`
    display: flex; gap: 8px; flex-wrap: wrap;
    @media (max-width: 767px) { overflow-x: auto; flex-wrap: nowrap; &::-webkit-scrollbar { height: 0; } }
`;
const FiltroChip = styled.button`
    padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
    cursor: pointer; font-family: "Poppins", sans-serif;
    border: 1px solid ${({ $active, $color, theme }) => $active ? ($color ?? "#2563eb") : theme.color2};
    background: ${({ $active, $color }) => $active ? ($color ? `${$color}22` : "rgba(37,99,235,0.12)") : "transparent"};
    color: ${({ $active, $color, theme }) => $active ? ($color ?? "#2563eb") : theme.text};
    transition: all 0.15s;
`;

/* ── Tabla ── */
const TablaCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px; overflow: auto; flex: 1;
`;
const Tabla = styled.table`width: 100%; border-collapse: collapse;`;
const Th = styled.th`
    text-align: ${({ $center }) => $center ? "center" : "left"};
    padding: 12px 16px; font-size: 12px; font-weight: 700;
    color: ${({ theme }) => theme.colorsubtitlecard};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; white-space: nowrap;
`;
const Td = styled.td`
    padding: 11px 16px; font-size: 13px; color: ${({ theme }) => theme.text};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    text-align: ${({ $center }) => $center ? "center" : "left"};
`;
const TdVacio = styled.td`
    padding: 48px 16px; text-align: center; font-size: 14px;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;
const FilaTr = styled.tr`
    transition: background 0.12s;
    &:last-child td { border-bottom: none; }
    &:hover td { background: ${({ theme }) => theme.bgtotal}; }
`;
const NombreProd = styled.span`font-weight: 700;`;
const UsuarioBadge = styled.span`
    display: inline-block; padding: 2px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 700;
    background: rgba(99,102,241,0.12); color: #818cf8; white-space: nowrap;
`;
const TipoBadge = styled.span`
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
    background: ${({ $bg }) => $bg}; color: ${({ $color }) => $color};
`;
const CantBadge = styled.span`
    font-weight: 800; font-size: 13px;
    color: ${({ $tipo }) =>
        $tipo === "entrada" ? "#4ade80" :
        $tipo === "salida"  ? "#f87171" :
        $tipo === "venta"   ? "#60a5fa" : "#fbbf24"};
`;

/* ── Paginación ── */
const Paginacion = styled.div`
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 16px; border-top: 1px solid ${({ theme }) => theme.color2};
`;
const BtnPag = styled.button`
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
    &:disabled { opacity: 0.35; cursor: default; }
    &:not(:disabled):hover { background: #2563eb; color: #fff; border-color: #2563eb; }
`;
const PagInfo = styled.span`
    font-size: 12px; font-weight: 600; color: ${({ theme }) => theme.colorsubtitlecard};
    min-width: 60px; text-align: center;
`;

/* ── Modal ── */
const Overlay = styled.div`
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 999; padding: 20px; animation: ${fadeIn} 0.2s ease;
`;
const Modal = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 18px; width: 460px; max-width: 100%;
    box-shadow: 0 24px 60px rgba(0,0,0,0.35);
    animation: ${slideUp} 0.25s cubic-bezier(0.34,1.56,0.64,1);
    overflow: hidden;
`;
const ModalHeader = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 20px; border-bottom: 1px solid ${({ theme }) => theme.color2};
    span { font-size: 15px; font-weight: 800; color: ${({ theme }) => theme.text}; }
`;
const BtnCerrarModal = styled.button`
    background: none; border: none; cursor: pointer; font-size: 20px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    display: flex; align-items: center;
    &:hover { color: #f87171; }
`;
const ModalBody = styled.div`padding: 20px; display: flex; flex-direction: column; gap: 16px;`;
const ModalFooter = styled.div`
    display: flex; gap: 10px; padding: 16px 20px;
    border-top: 1px solid ${({ theme }) => theme.color2};
`;
const Campo = styled.div`
    display: flex; flex-direction: column; gap: 6px;
    label { font-size: 12px; font-weight: 700; color: ${({ theme }) => theme.colorsubtitlecard}; text-transform: uppercase; letter-spacing: 0.5px; }
`;
const TiposGrid = styled.div`display: flex; gap: 8px;`;
const TipoBtn = styled.button`
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: "Poppins", sans-serif;
    border: 1.5px solid ${({ $active, $color, theme }) => $active ? $color : theme.color2};
    background: ${({ $active, $color }) => $active ? `${$color}18` : "transparent"};
    color: ${({ $active, $color, theme }) => $active ? $color : theme.text};
    transition: all 0.15s;
`;
const Select = styled.select`
    padding: 10px 12px; border-radius: 9px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none;
    &:focus { border-color: #2563eb; }
`;
const Input = styled.input`
    padding: 10px 12px; border-radius: 9px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none;
    &:focus { border-color: #2563eb; }
    &::placeholder { color: ${({ theme }) => theme.colorsubtitlecard}; }
`;
const PreviewStock = styled.div`
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 9px;
    background: rgba(99,102,241,0.07);
    border: 1px solid rgba(99,102,241,0.2);
    font-size: 13px; color: ${({ theme }) => theme.text};
`;
const Arrow = styled.span`font-size: 16px; opacity: 0.5;`;
const Opcional = styled.span`font-weight: 400; opacity: 0.5; text-transform: none; letter-spacing: 0;`;
const TotalInfo = styled.div`
    font-size: 12px; font-weight: 600; color: ${({ theme }) => theme.colorsubtitlecard};
    padding: 0 4px;
`;
const FiltroSep = styled.div`width: 1px; background: ${({ theme }) => theme.color2}; margin: 0 4px; align-self: stretch;`;
const DateInput = styled.input`
    padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
    border: 1px solid ${({ theme }) => theme.color2};
    background: transparent; color: ${({ theme }) => theme.text};
    font-family: "Poppins", sans-serif; outline: none; cursor: pointer;
    &:focus { border-color: #2563eb; }
    &::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; filter: ${({ theme }) => theme.text === '#fff' ? 'invert(1)' : 'none'}; }
`;
const BtnLimpiar = styled.button`
    display: flex; align-items: center; padding: 5px 10px; border-radius: 20px;
    border: 1px solid #f87171; background: rgba(248,113,113,0.1); color: #f87171;
    font-size: 14px; cursor: pointer;
    &:hover { background: rgba(248,113,113,0.2); }
`;
const BtnCancelar = styled.button`
    flex: 1; padding: 11px; border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: transparent; color: ${({ theme }) => theme.text};
    font-size: 13px; font-weight: 700; cursor: pointer; font-family: "Poppins", sans-serif;
`;

const AuthInfo = styled.div`
    display: flex; align-items: flex-start; gap: 10px;
    padding: 12px 14px; border-radius: 10px;
    background: rgba(248,133,51,0.07);
    border: 1px solid rgba(248,133,51,0.2);
    font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard};
    line-height: 1.5;
    strong { color: ${({ theme }) => theme.text}; }
    svg { font-size: 16px; margin-top: 2px; }
`;

const PasswordWrap = styled.div`
    position: relative;
    input { width: 100%; box-sizing: border-box; }
`;

const BtnVerPass = styled.button`
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; padding: 4px;
    font-size: 16px; color: ${({ theme }) => theme.colorsubtitlecard};
    display: flex; align-items: center;
    &:hover { color: ${({ theme }) => theme.text}; }
`;
const BtnGuardar = styled.button`
    flex: 2; padding: 11px; border-radius: 10px;
    border: none; background: #2563eb; color: #fff;
    font-size: 13px; font-weight: 700; cursor: pointer; font-family: "Poppins", sans-serif;
    transition: background 0.15s;
    &:hover:not(:disabled) { background: #1d4ed8; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
