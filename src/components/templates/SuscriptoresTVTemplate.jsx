import { useState, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { MostrarClientes, InsertarCliente, EditarCliente, EliminarCliente } from "../../supabase/crudClientes";
import { toastExito } from "../../utils/toast";
import {
    RiAddLine, RiCloseLine, RiEditLine, RiDeleteBin2Line,
    RiTvLine, RiWifiLine, RiCalendarLine, RiUserLine,
    RiCheckboxCircleLine, RiErrorWarningLine, RiTimeLine,
    RiPauseLine, RiArrowRightLine, RiSignalWifiLine,
    RiMapPinLine, RiFileListLine, RiAddCircleLine,
} from "react-icons/ri";
import Swal from "sweetalert2";

/* ── Helpers de estado ───────────────────────────────────── */
const hoy = () => new Date();

function calcEstado(datos) {
    if (datos?.estado_manual === "suspendido") return "suspendido";
    if (!datos?.fecha_vencimiento) return "sin_fecha";
    const vence = new Date(datos.fecha_vencimiento);
    const now   = hoy();
    if (vence < now) return "vencido";
    const diasRestantes = Math.ceil((vence - now) / 86400000);
    if (diasRestantes <= 7) return "por_vencer";
    return "activo";
}

const ESTADO_CFG = {
    activo:     { label: "Activo",      color: "#4ade80", bg: "rgba(74,222,128,0.1)"  },
    por_vencer: { label: "Por vencer",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
    vencido:    { label: "Vencido",     color: "#f87171", bg: "rgba(248,113,113,0.1)" },
    suspendido: { label: "Suspendido",  color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
    sin_fecha:  { label: "Sin venci.",  color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
};

const PLANES = [
    { key: "basico",        label: "Básico" },
    { key: "estandar",      label: "Estándar" },
    { key: "premium",       label: "Premium" },
    { key: "empresarial",   label: "Empresarial" },
];

const DECODERS = [
    { key: "hd_basic",   label: "HD Basic" },
    { key: "hd_plus",    label: "HD Plus" },
    { key: "4k_ultra",   label: "4K Ultra" },
    { key: "android_tv", label: "Android TV" },
    { key: "otro",       label: "Otro" },
];

const FILTROS = ["todos", "activo", "por_vencer", "vencido", "suspendido"];

function diasParaVencer(fecha) {
    if (!fecha) return null;
    const d = Math.ceil((new Date(fecha) - hoy()) / 86400000);
    return d;
}

function fmtFecha(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

const PERIODOS_PAGO = [
    { key: "mensual",   label: "Mensual",   meses: 1  },
    { key: "semestral", label: "Semestral", meses: 6  },
    { key: "anual",     label: "Anual",     meses: 12 },
];

function calcFechaVencimiento(fechaInstalacion, periodo) {
    if (!fechaInstalacion || !periodo) return "";
    const d = new Date(fechaInstalacion + "T12:00:00");
    const meses = PERIODOS_PAGO.find(p => p.key === periodo)?.meses ?? 1;
    d.setMonth(d.getMonth() + meses);
    return d.toISOString().split("T")[0];
}

/* ── Formulario vacío ─────────────────────────────────────── */
function formVacio() {
    const hoy = new Date().toISOString().split("T")[0];
    return {
        nombre: "", apellido: "", telefono: "", email: "", documento: "",
        direccion: "",
        decoder_tipo: "hd_basic", decoder_serial: "",
        plan_nombre: "basico",
        periodo: "mensual",
        fecha_instalacion: hoy,
        fecha_vencimiento: calcFechaVencimiento(hoy, "mensual"),
        estado_manual: "",
        notas: "",
        productos_plan: [],
    };
}

/* ── Componente principal ─────────────────────────────────── */
export function SuscriptoresTVTemplate() {
    const { dataempresa }  = useEmpresaStore();
    const id_empresa = dataempresa?.id;
    const qc = useQueryClient();

    const [filtro, setFiltro]       = useState("todos");
    const [busqueda, setBusqueda]   = useState("");
    const [modal, setModal]         = useState(false);
    const [editando, setEditando]   = useState(null);
    const [form, setForm]           = useState(formVacio());
    const [tabModal, setTabModal]   = useState("info");   // "info" | "plan" | "productos"
    const [addProd, setAddProd]     = useState("");       // texto para agregar producto al plan

    const { data: clientes = [], isFetching } = useQuery({
        queryKey: ["suscriptores-tv", id_empresa],
        queryFn:  () => MostrarClientes({ id_empresa }),
        enabled:  !!id_empresa,
        staleTime: 0,
    });

    // ── Stats ─────────────────────────────────────────────────
    const stats = useMemo(() => {
        const r = { total: clientes.length, activo: 0, por_vencer: 0, vencido: 0, suspendido: 0 };
        clientes.forEach(c => {
            const e = calcEstado(c.datos_extra ?? {});
            if (r[e] !== undefined) r[e]++;
        });
        return r;
    }, [clientes]);

    // ── Filtro + búsqueda ─────────────────────────────────────
    const suscriptores = useMemo(() => {
        return clientes.filter(c => {
            const estado = calcEstado(c.datos_extra ?? {});
            if (filtro !== "todos" && estado !== filtro) return false;
            if (!busqueda) return true;
            const q = busqueda.toLowerCase();
            const nombre = `${c.nombre ?? ""} ${c.apellido ?? ""}`.toLowerCase();
            return nombre.includes(q) || (c.telefono ?? "").includes(q) || (c.documento ?? "").includes(q);
        });
    }, [clientes, filtro, busqueda]);

    // ── Mutaciones ────────────────────────────────────────────
    const mutCrear = useMutation({
        mutationFn: () => InsertarCliente({
            id_empresa,
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim() || null,
            telefono: form.telefono || null,
            email: form.email || null,
            documento: form.documento || null,
            datos_extra: buildDatosExtra(),
        }),
        onSuccess: () => {
            toastExito("Suscriptor registrado", "Suscriptores");
            qc.invalidateQueries({ queryKey: ["suscriptores-tv", id_empresa] });
            cerrarModal();
        },
    });

    const mutEditar = useMutation({
        mutationFn: () => EditarCliente({
            id: editando.id, id_empresa,
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim() || null,
            telefono: form.telefono || null,
            email: form.email || null,
            documento: form.documento || null,
            datos_extra: buildDatosExtra(),
        }),
        onSuccess: () => {
            toastExito("Suscriptor actualizado", "Suscriptores");
            qc.invalidateQueries({ queryKey: ["suscriptores-tv", id_empresa] });
            cerrarModal();
        },
    });

    const mutEliminar = useMutation({
        mutationFn: (c) => EliminarCliente({ id: c.id, id_empresa }),
        onSuccess: () => {
            toastExito("Suscriptor eliminado", "Suscriptores");
            qc.invalidateQueries({ queryKey: ["suscriptores-tv", id_empresa] });
        },
    });

    function buildDatosExtra() {
        return {
            decoder_tipo:       form.decoder_tipo,
            decoder_serial:     form.decoder_serial,
            plan_nombre:        form.plan_nombre,
            periodo:            form.periodo,
            direccion:          form.direccion,
            fecha_instalacion:  form.fecha_instalacion,
            fecha_vencimiento:  form.fecha_vencimiento,
            estado_manual:      form.estado_manual,
            notas:              form.notas,
            productos_plan:     form.productos_plan,
        };
    }

    function handleFrecuencia(periodo) {
        const nuevaFecha = calcFechaVencimiento(form.fecha_instalacion, periodo);
        setForm(f => ({ ...f, periodo, fecha_vencimiento: nuevaFecha }));
    }

    function handleFechaInstalacion(fecha) {
        const nuevaFecha = calcFechaVencimiento(fecha, form.periodo);
        setForm(f => ({ ...f, fecha_instalacion: fecha, fecha_vencimiento: nuevaFecha }));
    }

    function abrirNuevo() {
        setEditando(null);
        setForm(formVacio());
        setTabModal("info");
        setModal(true);
    }

    function abrirEditar(c) {
        const dx = c.datos_extra ?? {};
        setEditando(c);
        setForm({
            nombre:            c.nombre ?? "",
            apellido:          c.apellido ?? "",
            telefono:          c.telefono ?? "",
            email:             c.email ?? "",
            documento:         c.documento ?? "",
            direccion:         dx.direccion ?? "",
            decoder_tipo:      dx.decoder_tipo ?? "hd_basic",
            decoder_serial:    dx.decoder_serial ?? "",
            plan_nombre:       dx.plan_nombre ?? "basico",
            periodo:           dx.periodo ?? "mensual",
            fecha_instalacion: dx.fecha_instalacion ?? "",
            fecha_vencimiento: dx.fecha_vencimiento ?? "",
            estado_manual:     dx.estado_manual ?? "",
            notas:             dx.notas ?? "",
            productos_plan:    dx.productos_plan ?? [],
        });
        setTabModal("info");
        setModal(true);
    }

    function cerrarModal() { setModal(false); setEditando(null); setAddProd(""); }

    function agregarProducto() {
        if (!addProd.trim()) return;
        setForm(f => ({
            ...f,
            productos_plan: [...(f.productos_plan ?? []), {
                nombre: addProd.trim(),
                fecha_adicion: new Date().toISOString().split("T")[0],
            }],
        }));
        setAddProd("");
    }

    function quitarProducto(idx) {
        setForm(f => ({ ...f, productos_plan: f.productos_plan.filter((_, i) => i !== idx) }));
    }

    async function confirmarPago() {
        const periodoLabel = PERIODOS_PAGO.find(p => p.key === form.periodo)?.label ?? form.periodo;
        const r = await Swal.fire({
            title: "Confirmar pago y registro",
            html: `
                <div style="text-align:left;font-size:14px;line-height:2.2">
                    <b>Cliente:</b> ${form.nombre} ${form.apellido}<br/>
                    <b>Plan:</b> ${form.plan_nombre} · ${periodoLabel}<br/>
                    <b>Fecha de corte:</b> ${fmtFecha(form.fecha_vencimiento)}<br/>
                </div>
            `,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "✓ Confirmar y registrar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#60a5fa",
            cancelButtonColor: "#374151",
            customClass: { popup: "swal-pos" },
        });
        if (r.isConfirmed) mutCrear.mutate();
    }

    async function confirmarEliminar(c) {
        const r = await Swal.fire({
            title: `¿Eliminar a ${c.nombre}?`,
            text: "Se borrarán todos sus datos de suscripción.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#f87171",
            cancelButtonColor: "#334155",
            customClass: { popup: "swal-pos" },
        });
        if (r.isConfirmed) mutEliminar.mutate(c);
    }

    const pending = mutCrear.isPending || mutEditar.isPending;

    // ── Render ────────────────────────────────────────────────
    return (
        <Page>
            {/* ── Header ── */}
            <TopBar>
                <TituloWrap>
                    <RiTvLine />
                    <div>
                        <h1>Suscriptores</h1>
                        <p>Gestión de clientes TV · {dataempresa?.razon_social}</p>
                    </div>
                </TituloWrap>
                <BtnNuevo onClick={abrirNuevo}><RiAddLine /> Nuevo suscriptor</BtnNuevo>
            </TopBar>

            {/* ── Stats ── */}
            <StatsRow>
                <StatCard onClick={() => setFiltro("todos")} $activo={filtro === "todos"}>
                    <StatNum>{stats.total}</StatNum>
                    <StatLabel>Total</StatLabel>
                </StatCard>
                <StatCard $color="#4ade80" onClick={() => setFiltro("activo")} $activo={filtro === "activo"}>
                    <StatNum $color="#4ade80">{stats.activo}</StatNum>
                    <StatLabel>Activos</StatLabel>
                </StatCard>
                <StatCard $color="#f59e0b" onClick={() => setFiltro("por_vencer")} $activo={filtro === "por_vencer"}>
                    <StatNum $color="#f59e0b">{stats.por_vencer}</StatNum>
                    <StatLabel>Por vencer</StatLabel>
                </StatCard>
                <StatCard $color="#f87171" onClick={() => setFiltro("vencido")} $activo={filtro === "vencido"}>
                    <StatNum $color="#f87171">{stats.vencido}</StatNum>
                    <StatLabel>Vencidos</StatLabel>
                </StatCard>
                <StatCard $color="#94a3b8" onClick={() => setFiltro("suspendido")} $activo={filtro === "suspendido"}>
                    <StatNum $color="#94a3b8">{stats.suspendido}</StatNum>
                    <StatLabel>Suspendidos</StatLabel>
                </StatCard>
            </StatsRow>

            {/* ── Filtros + búsqueda ── */}
            <BarraFiltros>
                <BuscadorInput
                    placeholder="Buscar por nombre, teléfono o documento..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                />
            </BarraFiltros>

            {/* ── Grid de suscriptores ── */}
            {isFetching ? (
                <MsgVacio>Cargando suscriptores...</MsgVacio>
            ) : suscriptores.length === 0 ? (
                <MsgVacio>
                    <RiTvLine size={40} style={{ opacity: 0.15 }} />
                    <span>{filtro === "todos" ? "Aún no tienes suscriptores registrados." : `No hay suscriptores en estado "${ESTADO_CFG[filtro]?.label}".`}</span>
                </MsgVacio>
            ) : (
                <Grid>
                    {suscriptores.map(c => {
                        const dx     = c.datos_extra ?? {};
                        const estado = calcEstado(dx);
                        const cfg    = ESTADO_CFG[estado];
                        const dias   = diasParaVencer(dx.fecha_vencimiento);
                        const decoder = DECODERS.find(d => d.key === dx.decoder_tipo)?.label ?? dx.decoder_tipo ?? "—";
                        const plan    = PLANES.find(p => p.key === dx.plan_nombre)?.label ?? dx.plan_nombre ?? "—";
                        const nProds  = (dx.productos_plan ?? []).length;
                        return (
                            <Card key={c.id}>
                                <CardTop>
                                    <CardAvatar $color={cfg.color}>
                                        {(c.nombre ?? "?")[0]?.toUpperCase()}
                                    </CardAvatar>
                                    <CardInfo>
                                        <CardNombre>{c.nombre} {c.apellido ?? ""}</CardNombre>
                                        <CardTel>{c.telefono ?? c.email ?? "—"}</CardTel>
                                    </CardInfo>
                                    <EstadoBadge $color={cfg.color} $bg={cfg.bg}>{cfg.label}</EstadoBadge>
                                </CardTop>

                                <CardMeta>
                                    <MetaFila><RiTvLine /><span>{decoder}</span></MetaFila>
                                    <MetaFila><RiSignalWifiLine /><span>Plan {plan}</span></MetaFila>
                                    {dx.fecha_vencimiento && (
                                        <MetaFila $alerta={estado === "vencido" || estado === "por_vencer"}>
                                            <RiCalendarLine />
                                            <span>
                                                Vence {fmtFecha(dx.fecha_vencimiento)}
                                                {dias !== null && dias >= 0 && dias <= 7 && (
                                                    <AvisoVence> · {dias === 0 ? "hoy" : `en ${dias}d`}</AvisoVence>
                                                )}
                                                {dias !== null && dias < 0 && (
                                                    <AvisoVence $rojo> · hace {Math.abs(dias)}d</AvisoVence>
                                                )}
                                            </span>
                                        </MetaFila>
                                    )}
                                    {nProds > 0 && (
                                        <MetaFila>
                                            <RiFileListLine />
                                            <span>{nProds} producto{nProds !== 1 ? "s" : ""} en plan</span>
                                        </MetaFila>
                                    )}
                                </CardMeta>

                                <CardAcciones>
                                    <BtnCard onClick={() => abrirEditar(c)}>
                                        <RiEditLine /> Editar / Plan
                                    </BtnCard>
                                    <BtnCardRojo onClick={() => confirmarEliminar(c)}>
                                        <RiDeleteBin2Line />
                                    </BtnCardRojo>
                                </CardAcciones>
                            </Card>
                        );
                    })}
                </Grid>
            )}

            {/* ── Modal ── */}
            {modal && (
                <Overlay onClick={cerrarModal}>
                    <ModalWrap onClick={e => e.stopPropagation()}>
                        <ModalHeader>
                            <span>{editando ? `${editando.nombre} ${editando.apellido ?? ""}` : "Nuevo suscriptor"}</span>
                            <BtnCerrar onClick={cerrarModal}><RiCloseLine /></BtnCerrar>
                        </ModalHeader>

                        <TabsRow>
                            {[
                                { key: "info",      label: "Datos", icon: <RiUserLine /> },
                                { key: "plan",      label: "Decoder & Plan", icon: <RiTvLine /> },
                                { key: "productos", label: "Productos del plan", icon: <RiFileListLine /> },
                            ].map(t => (
                                <Tab key={t.key} $activo={tabModal === t.key} onClick={() => setTabModal(t.key)}>
                                    {t.icon} {t.label}
                                </Tab>
                            ))}
                        </TabsRow>

                        <ModalBody>
                            {/* ── Tab: Info personal ── */}
                            {tabModal === "info" && (
                                <ColForm>
                                    <FilaDos>
                                        <Campo>
                                            <label>Nombre *</label>
                                            <Input placeholder="Ej: Carlos" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
                                        </Campo>
                                        <Campo>
                                            <label>Apellido</label>
                                            <Input placeholder="Ej: Martínez" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
                                        </Campo>
                                    </FilaDos>
                                    <FilaDos>
                                        <Campo>
                                            <label>Teléfono</label>
                                            <Input placeholder="300 000 0000" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
                                        </Campo>
                                        <Campo>
                                            <label>Email</label>
                                            <Input placeholder="correo@email.com" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                                        </Campo>
                                    </FilaDos>
                                    <Campo>
                                        <label>Nro. documento</label>
                                        <Input placeholder="CC / NIT" value={form.documento} onChange={e => setForm(f => ({ ...f, documento: e.target.value }))} />
                                    </Campo>
                                    <Campo>
                                        <label><RiMapPinLine /> Dirección de instalación</label>
                                        <Input placeholder="Calle 10 # 5-20, Apto 201" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
                                    </Campo>
                                    <Campo>
                                        <label>Notas</label>
                                        <Textarea placeholder="Observaciones, instrucciones de acceso, etc." value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={3} />
                                    </Campo>
                                </ColForm>
                            )}

                            {/* ── Tab: Decoder & Plan ── */}
                            {tabModal === "plan" && (
                                <ColForm>
                                    <SectionLabel><RiTvLine /> Decodificador</SectionLabel>
                                    <FilaDos>
                                        <Campo>
                                            <label>Tipo de decoder</label>
                                            <Select value={form.decoder_tipo} onChange={e => setForm(f => ({ ...f, decoder_tipo: e.target.value }))}>
                                                {DECODERS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                                            </Select>
                                        </Campo>
                                        <Campo>
                                            <label>Nro. de serie</label>
                                            <Input placeholder="SN-00000" value={form.decoder_serial} onChange={e => setForm(f => ({ ...f, decoder_serial: e.target.value }))} />
                                        </Campo>
                                    </FilaDos>

                                    <SectionLabel style={{ marginTop: 8 }}><RiSignalWifiLine /> Plan de suscripción</SectionLabel>
                                    <FilaDos>
                                        <Campo>
                                            <label>Plan</label>
                                            <Select value={form.plan_nombre} onChange={e => setForm(f => ({ ...f, plan_nombre: e.target.value }))}>
                                                {PLANES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                            </Select>
                                        </Campo>
                                        <Campo>
                                            <label><RiCalendarLine /> Frecuencia de pago</label>
                                            <Select value={form.periodo ?? "mensual"} onChange={e => handleFrecuencia(e.target.value)}>
                                                {PERIODOS_PAGO.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                            </Select>
                                        </Campo>
                                    </FilaDos>
                                    <FilaDos>
                                        <Campo>
                                            <label><RiCalendarLine /> Fecha instalación</label>
                                            <Input type="date" value={form.fecha_instalacion} onChange={e => handleFechaInstalacion(e.target.value)} />
                                        </Campo>
                                        <Campo>
                                            <label><RiCalendarLine /> Fecha de corte</label>
                                            <FechaCorteDisplay>
                                                {form.fecha_vencimiento
                                                    ? new Date(form.fecha_vencimiento + "T12:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })
                                                    : "Se calculará automáticamente"}
                                            </FechaCorteDisplay>
                                        </Campo>
                                    </FilaDos>

                                    <Campo>
                                        <label>Estado manual (opcional)</label>
                                        <Select value={form.estado_manual} onChange={e => setForm(f => ({ ...f, estado_manual: e.target.value }))}>
                                            <option value="">— Automático (según fecha) —</option>
                                            <option value="suspendido">Suspendido</option>
                                        </Select>
                                    </Campo>

                                    {form.fecha_vencimiento && (() => {
                                        const estado = calcEstado({ fecha_vencimiento: form.fecha_vencimiento, estado_manual: form.estado_manual });
                                        const cfg = ESTADO_CFG[estado];
                                        return (
                                            <EstadoPreview $color={cfg.color} $bg={cfg.bg}>
                                                {estado === "activo" && <RiCheckboxCircleLine />}
                                                {estado === "por_vencer" && <RiTimeLine />}
                                                {estado === "vencido" && <RiErrorWarningLine />}
                                                {estado === "suspendido" && <RiPauseLine />}
                                                <span>{cfg.label}</span>
                                            </EstadoPreview>
                                        );
                                    })()}
                                </ColForm>
                            )}

                            {/* ── Tab: Productos del plan ── */}
                            {tabModal === "productos" && (
                                <ColForm>
                                    <SectionLabel><RiFileListLine /> Productos / Upgrades</SectionLabel>
                                    <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                                        Registra aquí los equipos, paquetes y upgrades que tiene este suscriptor.
                                    </p>
                                    <AddProdRow>
                                        <Input
                                            placeholder="Ej: Decoder 4K, Paquete Deportes, Cable extensión..."
                                            value={addProd}
                                            onChange={e => setAddProd(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), agregarProducto())}
                                        />
                                        <BtnAgregarProd type="button" onClick={agregarProducto} disabled={!addProd.trim()}>
                                            <RiAddCircleLine />
                                        </BtnAgregarProd>
                                    </AddProdRow>

                                    {(form.productos_plan ?? []).length === 0 ? (
                                        <ProdEmpty>Sin productos registrados en el plan</ProdEmpty>
                                    ) : (
                                        <ListaProductos>
                                            {form.productos_plan.map((p, i) => (
                                                <ProdItem key={i}>
                                                    <ProdIcon><RiArrowRightLine /></ProdIcon>
                                                    <ProdNombre>{p.nombre}</ProdNombre>
                                                    <ProdFecha>{p.fecha_adicion}</ProdFecha>
                                                    <BtnQuitarProd type="button" onClick={() => quitarProducto(i)}>
                                                        <RiDeleteBin2Line />
                                                    </BtnQuitarProd>
                                                </ProdItem>
                                            ))}
                                        </ListaProductos>
                                    )}
                                </ColForm>
                            )}
                        </ModalBody>

                        <ModalFooter>
                            <BtnGuardar
                                onClick={editando ? () => mutEditar.mutate() : confirmarPago}
                                disabled={pending || !form.nombre.trim()}
                            >
                                {pending ? "Guardando..." : editando ? "Guardar cambios" : "Registrar suscriptor"}
                            </BtnGuardar>
                        </ModalFooter>
                    </ModalWrap>
                </Overlay>
            )}
        </Page>
    );
}

/* ══ ESTILOS ══════════════════════════════════════════════════════════════════ */
const fadeUp  = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}`;
const fadeIn  = keyframes`from{opacity:0}to{opacity:1}`;
const slideUp = keyframes`from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}`;

const Page = styled.div`
    padding: 24px 24px 40px;
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    animation: ${fadeUp} 0.3s ease;
    @media (max-width: 767px) { padding: 68px 12px 28px; }
`;

const TopBar = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
`;
const TituloWrap = styled.div`
    display: flex; align-items: center; gap: 12px;
    svg { font-size: 28px; color: #60a5fa; }
    h1 { font-size: 22px; font-weight: 900; color: ${({ theme }) => theme.text}; margin: 0 0 2px; }
    p  { font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard}; margin: 0; }
`;
const BtnNuevo = styled.button`
    display: flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 10px; border: none;
    background: #60a5fa; color: #fff;
    font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif; transition: background 0.15s;
    &:hover { background: #3b82f6; }
`;

/* Stats */
const StatsRow = styled.div`
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;
    margin-bottom: 20px;
    @media (max-width: 600px) { grid-template-columns: repeat(3, 1fr); }
`;
const StatCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1.5px solid ${({ $activo, $color, theme }) => $activo ? ($color ?? "#f88533") : theme.color2};
    border-radius: 12px; padding: 12px 14px;
    cursor: pointer; transition: all 0.15s; text-align: center;
    &:hover { border-color: ${({ $color }) => $color ?? "#f88533"}; }
`;
const StatNum   = styled.div`font-size: 22px; font-weight: 900; color: ${({ $color, theme }) => $color ?? theme.text};`;
const StatLabel = styled.div`font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard}; font-weight: 600;`;

/* Filtros / búsqueda */
const BarraFiltros = styled.div`margin-bottom: 18px;`;
const BuscadorInput = styled.input`
    width: 100%; max-width: 400px; padding: 10px 14px; border-radius: 10px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none;
    &:focus { border-color: #60a5fa; }
    &::placeholder { color: ${({ theme }) => theme.colorsubtitlecard}; }
    box-sizing: border-box;
`;

/* Grid cards */
const Grid = styled.div`
    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px;
`;
const MsgVacio = styled.div`
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; padding: 60px; text-align: center;
    font-size: 14px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const Card = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 16px; padding: 16px;
    display: flex; flex-direction: column; gap: 12px;
    transition: box-shadow 0.15s;
    animation: ${fadeUp} 0.3s ease;
    &:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
`;
const CardTop = styled.div`display: flex; align-items: center; gap: 10px;`;
const CardAvatar = styled.div`
    width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
    background: ${({ $color }) => `${$color}1a`};
    border: 1.5px solid ${({ $color }) => `${$color}44`};
    color: ${({ $color }) => $color};
    font-size: 16px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
`;
const CardInfo   = styled.div`flex: 1; min-width: 0;`;
const CardNombre = styled.div`font-size: 14px; font-weight: 800; color: ${({ theme }) => theme.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const CardTel    = styled.div`font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};`;
const EstadoBadge = styled.span`
    padding: 3px 10px; border-radius: 20px; flex-shrink: 0;
    font-size: 10px; font-weight: 800;
    color: ${({ $color }) => $color};
    background: ${({ $bg }) => $bg};
    border: 1px solid ${({ $color }) => `${$color}44`};
`;

const CardMeta = styled.div`display: flex; flex-direction: column; gap: 5px;`;
const MetaFila = styled.div`
    display: flex; align-items: center; gap: 7px;
    font-size: 12px; color: ${({ $alerta, theme }) => $alerta ? "#f59e0b" : theme.colorsubtitlecard};
    svg { font-size: 14px; flex-shrink: 0; }
`;
const AvisoVence = styled.span`
    font-weight: 700; color: ${({ $rojo }) => $rojo ? "#f87171" : "#f59e0b"};
`;

const CardAcciones = styled.div`display: flex; gap: 8px;`;
const BtnCard = styled.button`
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px; border-radius: 9px; border: 1px solid ${({ theme }) => theme.color2};
    background: none; color: ${({ theme }) => theme.text};
    font-size: 12px; font-weight: 700; cursor: pointer; font-family: "Poppins", sans-serif;
    transition: all 0.15s;
    &:hover { background: rgba(96,165,250,0.1); border-color: #60a5fa; color: #60a5fa; }
`;
const BtnCardRojo = styled.button`
    width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
    border: 1px solid rgba(248,113,113,0.25);
    background: rgba(248,113,113,0.06); color: #f87171;
    font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
    &:hover { background: rgba(248,113,113,0.15); }
`;

/* Modal */
const Overlay = styled.div`
    position: fixed; inset: 0; background: rgba(0,0,0,0.65);
    display: flex; align-items: center; justify-content: center;
    z-index: 999; padding: 20px; animation: ${fadeIn} 0.2s ease;
`;
const ModalWrap = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 20px; width: 560px; max-width: 100%;
    max-height: 90vh; display: flex; flex-direction: column;
    box-shadow: 0 28px 70px rgba(0,0,0,0.4);
    animation: ${slideUp} 0.25s cubic-bezier(0.34,1.56,0.64,1);
    overflow: hidden;
`;
const ModalHeader = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid ${({ theme }) => theme.color2};
    span { font-size: 16px; font-weight: 900; color: ${({ theme }) => theme.text}; }
    flex-shrink: 0;
`;
const BtnCerrar = styled.button`
    background: none; border: none; cursor: pointer; font-size: 22px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    display: flex; align-items: center;
    &:hover { color: #f87171; }
`;
const TabsRow = styled.div`
    display: flex; border-bottom: 1px solid ${({ theme }) => theme.color2};
    flex-shrink: 0;
`;
const Tab = styled.button`
    flex: 1; padding: 12px 8px; border: none; background: none; cursor: pointer;
    font-size: 11px; font-weight: 700; font-family: "Poppins", sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 5px;
    color: ${({ $activo, theme }) => $activo ? "#60a5fa" : theme.colorsubtitlecard};
    border-bottom: 2px solid ${({ $activo }) => $activo ? "#60a5fa" : "transparent"};
    transition: all 0.15s;
    text-transform: uppercase; letter-spacing: 0.4px;
    &:hover { color: #60a5fa; }
    svg { font-size: 14px; }
`;
const ModalBody = styled.div`
    overflow-y: auto; flex: 1;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colorScroll}; border-radius: 10px; }
`;
const ModalFooter = styled.div`
    padding: 14px 24px; border-top: 1px solid ${({ theme }) => theme.color2};
    flex-shrink: 0;
`;

const ColForm = styled.div`padding: 20px 24px; display: flex; flex-direction: column; gap: 14px;`;
const FilaDos = styled.div`
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    @media (max-width: 480px) { grid-template-columns: 1fr; }
`;
const Campo = styled.div`
    display: flex; flex-direction: column; gap: 5px;
    label { font-size: 11px; font-weight: 700; color: ${({ theme }) => theme.colorsubtitlecard}; text-transform: uppercase; letter-spacing: 0.4px; display: flex; align-items: center; gap: 4px; }
`;
const Input = styled.input`
    padding: 10px 12px; border-radius: 9px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none;
    &:focus { border-color: #60a5fa; }
    &::placeholder { color: ${({ theme }) => theme.colorsubtitlecard}; }
`;
const Textarea = styled.textarea`
    padding: 10px 12px; border-radius: 9px; resize: none;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none; line-height: 1.5;
    &:focus { border-color: #60a5fa; }
    &::placeholder { color: ${({ theme }) => theme.colorsubtitlecard}; }
`;
const Select = styled.select`
    padding: 10px 12px; border-radius: 9px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none;
    &:focus { border-color: #60a5fa; }
`;
const SectionLabel = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
    color: ${({ theme }) => theme.text};
    svg { color: #60a5fa; font-size: 16px; }
`;
const FechaCorteDisplay = styled.div`
    padding: 10px 13px; border-radius: 10px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: #60a5fa; font-size: 14px; font-weight: 700;
    opacity: 0.85;
`;

const EstadoPreview = styled.div`
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px; border-radius: 10px;
    background: ${({ $bg }) => $bg};
    border: 1px solid ${({ $color }) => `${$color}44`};
    color: ${({ $color }) => $color};
    font-size: 13px; font-weight: 700;
    svg { font-size: 16px; }
`;

/* Productos */
const AddProdRow = styled.div`display: flex; gap: 8px; align-items: center;`;
const BtnAgregarProd = styled.button`
    width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
    border: none; background: #60a5fa; color: #fff; font-size: 20px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
    &:hover:not(:disabled) { background: #3b82f6; }
    &:disabled { opacity: 0.35; cursor: not-allowed; }
`;
const ProdEmpty = styled.div`
    text-align: center; padding: 28px; font-size: 13px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    border: 1.5px dashed ${({ theme }) => theme.color2}; border-radius: 12px;
`;
const ListaProductos = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const ProdItem = styled.div`
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px;
    background: ${({ theme }) => theme.bgtotal};
    border: 1px solid ${({ theme }) => theme.color2};
`;
const ProdIcon  = styled.span`color: #60a5fa; font-size: 14px; flex-shrink: 0;`;
const ProdNombre = styled.span`flex: 1; font-size: 13px; font-weight: 600; color: ${({ theme }) => theme.text};`;
const ProdFecha  = styled.span`font-size: 10px; color: ${({ theme }) => theme.colorsubtitlecard}; flex-shrink: 0;`;
const BtnQuitarProd = styled.button`
    background: none; border: none; cursor: pointer; font-size: 16px;
    color: #f87171; display: flex; align-items: center; padding: 4px;
    border-radius: 6px; transition: background 0.12s;
    &:hover { background: rgba(248,113,113,0.1); }
`;

const BtnGuardar = styled.button`
    width: 100%; padding: 13px; border-radius: 10px;
    border: none; background: #60a5fa; color: #fff;
    font-size: 14px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif; transition: background 0.15s;
    &:hover:not(:disabled) { background: #3b82f6; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
