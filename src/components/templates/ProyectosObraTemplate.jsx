import { useState, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useNavigate } from "react-router-dom";
import {
    MostrarProyectos, InsertarProyecto, EditarProyecto, EliminarProyecto,
} from "../../supabase/crudInmobiliaria";
import { toastExito } from "../../utils/toast";
import { Icon } from "@iconify/react";
import { RiAddLine, RiCloseLine, RiEditLine, RiDeleteBin2Line } from "react-icons/ri";
import Swal from "sweetalert2";

const formatCOP = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);

/* ── catálogos ── */
const TIPOS_PROYECTO = [
    { key: "remodelacion",  label: "Remodelación",        icon: "mdi:wrench",                             color: "#f59e0b" },
    { key: "reparacion",    label: "Reparación locativa",  icon: "mdi:toolbox",                           color: "#60a5fa" },
    { key: "construccion",  label: "Construcción",         icon: "mdi:hard-hat",                          color: "#f88533" },
    { key: "administracion",label: "Administración",       icon: "solar:clipboard-list-bold-duotone",     color: "#a78bfa" },
];

const ESTADOS_PROYECTO = [
    { key: "cotizando",    label: "Cotizando",    color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
    { key: "en_progreso",  label: "En progreso",  color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
    { key: "completado",   label: "Completado",   color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
    { key: "cancelado",    label: "Cancelado",    color: "#f87171", bg: "rgba(248,113,113,0.12)" },
];

const FORM_VACIO = {
    nombre: "", tipo: "remodelacion", cliente_nombre: "", cliente_telefono: "",
    direccion: "", presupuesto: "", estado: "cotizando",
    fecha_inicio: "", fecha_fin_estimada: "", descripcion: "", notas: "",
    es_propio: false,
};

export function ProyectosObraTemplate() {
    const { dataempresa } = useEmpresaStore();
    const qc = useQueryClient();
    const navigate = useNavigate();

    const [modal, setModal]       = useState(false);
    const [editando, setEditando] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState("todos");
    const [filtroOrigen, setFiltroOrigen] = useState("todos"); // todos | propio | cliente
    const [form, setForm]         = useState(FORM_VACIO);

    const { data: proyectos = [], isLoading } = useQuery({
        queryKey: ["proyectos-obra", dataempresa?.id],
        queryFn: () => MostrarProyectos({ id_empresa: dataempresa.id }),
        enabled: !!dataempresa?.id,
    });

    const invalidar = () => qc.invalidateQueries({ queryKey: ["proyectos-obra"] });

    const mutCrear = useMutation({
        mutationFn: () => InsertarProyecto({
            ...form,
            presupuesto: Number(form.presupuesto) || 0,
            id_empresa: dataempresa.id,
            fecha_inicio: form.fecha_inicio || null,
            fecha_fin_estimada: form.fecha_fin_estimada || null,
            es_propio: form.es_propio,
        }),
        onSuccess: () => { toastExito("Proyecto registrado"); invalidar(); cerrar(); },
    });

    const mutEditar = useMutation({
        mutationFn: () => EditarProyecto({
            ...form,
            id: editando.id,
            id_empresa: dataempresa.id,
            presupuesto: Number(form.presupuesto) || 0,
            fecha_inicio: form.fecha_inicio || null,
            fecha_fin_estimada: form.fecha_fin_estimada || null,
            es_propio: form.es_propio,
        }),
        onSuccess: () => { toastExito("Proyecto actualizado"); invalidar(); cerrar(); },
    });

    const mutEliminar = useMutation({
        mutationFn: (p) => EliminarProyecto({ id: p.id, id_empresa: dataempresa.id }),
        onSuccess: () => { toastExito("Proyecto eliminado"); invalidar(); },
    });

    function abrirNuevo() { setForm(FORM_VACIO); setEditando(null); setModal(true); }
    function abrirEditar(p) {
        setForm({
            nombre: p.nombre, tipo: p.tipo,
            cliente_nombre: p.cliente_nombre ?? "", cliente_telefono: p.cliente_telefono ?? "",
            direccion: p.direccion ?? "", presupuesto: String(p.presupuesto ?? ""),
            estado: p.estado, fecha_inicio: p.fecha_inicio ?? "",
            fecha_fin_estimada: p.fecha_fin_estimada ?? "",
            descripcion: p.descripcion ?? "", notas: p.notas ?? "",
            es_propio: p.es_propio ?? false,
        });
        setEditando(p); setModal(true);
    }
    function cerrar() { setModal(false); setEditando(null); }

    async function confirmarEliminar(p) {
        const r = await Swal.fire({
            title: "¿Eliminar proyecto?",
            text: `"${p.nombre}" se eliminará permanentemente.`,
            icon: "warning", showCancelButton: true,
            confirmButtonText: "Eliminar", cancelButtonText: "Cancelar",
            confirmButtonColor: "#f87171", cancelButtonColor: "#374151",
            customClass: { popup: "swal-pos" },
        });
        if (r.isConfirmed) mutEliminar.mutate(p);
    }

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const visibles = useMemo(() => proyectos.filter(p => {
        const okEstado  = filtroEstado  === "todos" || p.estado   === filtroEstado;
        const okOrigen  = filtroOrigen  === "todos"
                        || (filtroOrigen === "propio"  && p.es_propio)
                        || (filtroOrigen === "cliente" && !p.es_propio);
        return okEstado && okOrigen;
    }), [proyectos, filtroEstado, filtroOrigen]);

    const stats = useMemo(() => ({
        total:       proyectos.length,
        activos:     proyectos.filter(p => p.estado === "en_progreso").length,
        cotizando:   proyectos.filter(p => p.estado === "cotizando").length,
        completados: proyectos.filter(p => p.estado === "completado").length,
    }), [proyectos]);

    return (
        <Page>
            <Header>
                <HeaderLeft>
                    <PageTitle>
                        <Icon icon="solar:hammer-bold-duotone" style={{ color: "#60a5fa" }} />
                        Proyectos y Obras
                    </PageTitle>
                    <PageSub>{proyectos.length} proyectos registrados</PageSub>
                </HeaderLeft>
                <BtnNuevo onClick={abrirNuevo}><RiAddLine /> Nuevo proyecto</BtnNuevo>
            </Header>

            <MiniStats>
                <MiniStat $color="#94a3b8"><span>{stats.cotizando}</span>Cotizando</MiniStat>
                <MiniStat $color="#60a5fa"><span>{stats.activos}</span>En progreso</MiniStat>
                <MiniStat $color="#4ade80"><span>{stats.completados}</span>Completados</MiniStat>
                <MiniStat $color="#fff"><span>{stats.total}</span>Total</MiniStat>
            </MiniStats>

            <FiltrosWrap>
                <OrigenChips>
                    {[
                        { key: "todos",   label: "Todos" },
                        { key: "propio",  label: "🏗 Propios" },
                        { key: "cliente", label: "👤 Clientes" },
                    ].map(o => (
                        <OrigenChip key={o.key} $active={filtroOrigen === o.key}
                            onClick={() => setFiltroOrigen(o.key)}>{o.label}</OrigenChip>
                    ))}
                </OrigenChips>
                {["todos", ...ESTADOS_PROYECTO.map(e => e.key)].map(k => (
                    <Chip key={k} $active={filtroEstado === k}
                        $color={ESTADOS_PROYECTO.find(e => e.key === k)?.color ?? "#60a5fa"}
                        onClick={() => setFiltroEstado(k)}>
                        {k === "todos" ? "Todos estados" : ESTADOS_PROYECTO.find(e => e.key === k)?.label}
                    </Chip>
                ))}
            </FiltrosWrap>

            {isLoading ? (
                <Vacio>Cargando proyectos...</Vacio>
            ) : visibles.length === 0 ? (
                <Vacio>
                    <Icon icon="solar:hammer-bold-duotone" style={{ fontSize: 48, color: "rgba(255,255,255,0.1)", display: "block", marginBottom: 12 }} />
                    No hay proyectos{filtroEstado !== "todos" ? " con ese estado" : ". Crea el primero."}
                </Vacio>
            ) : (
                <Lista>
                    {visibles.map((p, i) => {
                        const tipo = TIPOS_PROYECTO.find(t => t.key === p.tipo) ?? TIPOS_PROYECTO[0];
                        const est  = ESTADOS_PROYECTO.find(e => e.key === p.estado) ?? ESTADOS_PROYECTO[0];
                        return (
                            <ProyCard key={p.id} $color={tipo.color} $i={i}>
                                <ProyLeft>
                                    <ProyIcono $color={tipo.color}>
                                        <Icon icon={tipo.icon} />
                                    </ProyIcono>
                                </ProyLeft>
                                <ProyBody>
                                    <ProyTop>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <ProyNombre>{p.nombre || "Sin nombre"}</ProyNombre>
                                            {p.es_propio && <PropioBadge>Propio</PropioBadge>}
                                        </div>
                                        <EstadoBadge $color={est.color} $bg={est.bg}>{est.label}</EstadoBadge>
                                    </ProyTop>
                                    <ProyMeta>
                                        <MetaItem><Icon icon={tipo.icon} />{tipo.label}</MetaItem>
                                        {!p.es_propio && p.cliente_nombre && <MetaItem><Icon icon="solar:user-bold-duotone" />{p.cliente_nombre}</MetaItem>}
                                        {p.direccion && <MetaItem><Icon icon="solar:map-point-bold-duotone" />{p.direccion}</MetaItem>}
                                        {p.fecha_inicio && <MetaItem><Icon icon="solar:calendar-bold-duotone" />Inicio: {new Date(p.fecha_inicio + "T12:00:00").toLocaleDateString("es-CO")}</MetaItem>}
                                        {p.fecha_fin_estimada && <MetaItem $warn><Icon icon="solar:flag-bold-duotone" />Entrega: {new Date(p.fecha_fin_estimada + "T12:00:00").toLocaleDateString("es-CO")}</MetaItem>}
                                    </ProyMeta>
                                    {p.presupuesto > 0 && (
                                        <ProyPresupuesto $color={tipo.color}>{formatCOP(p.presupuesto)}</ProyPresupuesto>
                                    )}
                                    {p.descripcion && <ProyDesc>{p.descripcion}</ProyDesc>}
                                </ProyBody>
                                <ProyActions>
                                    {p.es_propio && (
                                        <BtnGestionar onClick={() => navigate(`/proyectos/${p.id}`)}>
                                            <Icon icon="solar:chart-bold-duotone" />
                                            Gestionar
                                        </BtnGestionar>
                                    )}
                                    <BtnEditar onClick={() => abrirEditar(p)}><RiEditLine /></BtnEditar>
                                    <BtnEliminar onClick={() => confirmarEliminar(p)}><RiDeleteBin2Line /></BtnEliminar>
                                </ProyActions>
                            </ProyCard>
                        );
                    })}
                </Lista>
            )}

            {modal && (
                <Overlay onClick={cerrar}>
                    <Modal onClick={e => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitulo>
                                <Icon icon="solar:hammer-bold-duotone" style={{ color: "#60a5fa" }} />
                                {editando ? "Editar proyecto" : "Nuevo proyecto"}
                            </ModalTitulo>
                            <BtnClose onClick={cerrar}><RiCloseLine /></BtnClose>
                        </ModalHeader>

                        <ModalBody>
                            {/* Toggle propio / cliente */}
                            <ToggleRow>
                                <ToggleOpt $active={!form.es_propio} onClick={() => set("es_propio", false)}>
                                    <Icon icon="solar:user-bold-duotone" />
                                    Para cliente
                                </ToggleOpt>
                                <ToggleOpt $active={form.es_propio} $own onClick={() => set("es_propio", true)}>
                                    <Icon icon="mdi:hard-hat" />
                                    Proyecto propio
                                </ToggleOpt>
                            </ToggleRow>

                            <Label>Tipo de trabajo</Label>
                            <TiposGrid>
                                {TIPOS_PROYECTO.map(t => (
                                    <TipoBtn key={t.key} $active={form.tipo === t.key} $color={t.color}
                                        onClick={() => set("tipo", t.key)}>
                                        <Icon icon={t.icon} />{t.label}
                                    </TipoBtn>
                                ))}
                            </TiposGrid>

                            <Label>Nombre del proyecto</Label>
                            <Input value={form.nombre} onChange={e => set("nombre", e.target.value)}
                                placeholder="Ej: Remodelación Torre Medellín Piso 8" />

                            {/* Campos solo para cliente */}
                            {!form.es_propio && (
                                <>
                                    <Row2>
                                        <div>
                                            <Label>Cliente</Label>
                                            <Input value={form.cliente_nombre} onChange={e => set("cliente_nombre", e.target.value)} placeholder="Nombre del cliente" />
                                        </div>
                                        <div>
                                            <Label>Teléfono cliente</Label>
                                            <Input value={form.cliente_telefono} onChange={e => set("cliente_telefono", e.target.value)} placeholder="3001234567" />
                                        </div>
                                    </Row2>
                                    <Label>Dirección / Ubicación</Label>
                                    <Input value={form.direccion} onChange={e => set("direccion", e.target.value)} placeholder="Cra 43A # 1 Sur 100, Medellín" />
                                    <Label>Notas internas</Label>
                                    <Textarea value={form.notas} onChange={e => set("notas", e.target.value)}
                                        placeholder="Notas del equipo..." rows={2} />
                                </>
                            )}

                            {/* Campos comunes */}
                            <Row2>
                                <div>
                                    <Label>Presupuesto ($)</Label>
                                    <Input type="number" value={form.presupuesto} onChange={e => set("presupuesto", e.target.value)} placeholder="80000000" />
                                </div>
                                <div>
                                    <Label>Estado</Label>
                                    <Select value={form.estado} onChange={e => set("estado", e.target.value)}>
                                        {ESTADOS_PROYECTO.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                                    </Select>
                                </div>
                            </Row2>

                            <Row2>
                                <div>
                                    <Label>Fecha de inicio</Label>
                                    <Input type="date" value={form.fecha_inicio} onChange={e => set("fecha_inicio", e.target.value)} />
                                </div>
                                <div>
                                    <Label>Entrega estimada</Label>
                                    <Input type="date" value={form.fecha_fin_estimada} onChange={e => set("fecha_fin_estimada", e.target.value)} />
                                </div>
                            </Row2>

                            <Label>Descripción del trabajo</Label>
                            <Textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
                                placeholder="Descripción del proyecto..." rows={3} />

                            {form.es_propio && (
                                <PropioBanner>
                                    <Icon icon="solar:chart-bold-duotone" style={{ fontSize: 20 }} />
                                    <span>Al guardar podrás gestionar el <strong>personal contratado</strong> y el <strong>cronograma de actividades</strong> desde el panel del proyecto.</span>
                                </PropioBanner>
                            )}
                        </ModalBody>

                        <ModalFooter>
                            <BtnCancelar onClick={cerrar}>Cancelar</BtnCancelar>
                            <BtnGuardar
                                disabled={!form.nombre || mutCrear.isPending || mutEditar.isPending}
                                onClick={() => editando ? mutEditar.mutate() : mutCrear.mutate()}>
                                {editando ? "Guardar cambios" : "Registrar proyecto"}
                            </BtnGuardar>
                        </ModalFooter>
                    </Modal>
                </Overlay>
            )}
        </Page>
    );
}

/* ─── Animations ─── */
const fadeUp = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;
const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;

const Page = styled.div`padding:28px 24px 48px;max-width:900px;margin:0 auto;@media(max-width:767px){padding:80px 14px 40px;}`;
const Header = styled.div`display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:24px;flex-wrap:wrap;`;
const HeaderLeft = styled.div`display:flex;flex-direction:column;gap:4px;`;
const PageTitle = styled.h1`display:flex;align-items:center;gap:10px;font-size:22px;font-weight:900;color:#fff;margin:0;svg{font-size:26px;}`;
const PageSub = styled.p`font-size:13px;color:rgba(255,255,255,0.4);margin:0;`;
const BtnNuevo = styled.button`display:flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#60a5fa,#818cf8);border:none;color:#fff;font-weight:800;font-size:13px;cursor:pointer;font-family:"Poppins",sans-serif;transition:opacity .15s,transform .15s;&:hover{opacity:.9;transform:translateY(-1px);}`;

const MiniStats = styled.div`display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;@media(max-width:480px){grid-template-columns:repeat(2,1fr);}`;
const MiniStat = styled.div`display:flex;flex-direction:column;align-items:center;gap:2px;padding:14px 8px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);span{font-size:26px;font-weight:900;color:${({$color})=>$color};}font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:rgba(255,255,255,0.35);`;

const FiltrosWrap = styled.div`display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;align-items:center;`;
const OrigenChips = styled.div`display:flex;gap:4px;background:rgba(255,255,255,0.05);border-radius:10px;padding:3px;`;
const OrigenChip = styled.button`padding:5px 12px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:"Poppins",sans-serif;border:none;transition:all .15s;background:${p=>p.$active?"rgba(96,165,250,0.25)":"transparent"};color:${p=>p.$active?"#60a5fa":"rgba(255,255,255,0.4)"};`;
const Chip = styled.button`padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;font-family:"Poppins",sans-serif;border:1px solid;transition:all .15s;border-color:${({$active,$color})=>$active?$color:"rgba(255,255,255,0.1)"};background:${({$active,$color})=>$active?$color+"22":"rgba(255,255,255,0.04)"};color:${({$active,$color})=>$active?$color:"rgba(255,255,255,0.5)"};`;

const Vacio = styled.div`text-align:center;padding:60px 20px;color:rgba(255,255,255,0.3);font-size:14px;font-weight:600;`;
const Lista = styled.div`display:flex;flex-direction:column;gap:12px;`;

const ProyCard = styled.div`display:flex;align-items:flex-start;gap:14px;padding:18px 20px;border-radius:18px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.04);backdrop-filter:blur(8px);animation:${fadeUp} .35s ${({$i})=>$i*.04}s ease both;transition:transform .2s,border-color .2s,box-shadow .2s;&:hover{transform:translateX(3px);border-color:${({$color})=>$color}30;box-shadow:4px 0 20px ${({$color})=>$color}10;}`;
const ProyLeft = styled.div`flex-shrink:0;padding-top:2px;`;
const ProyIcono = styled.div`width:44px;height:44px;border-radius:14px;background:${({$color})=>$color}18;border:1px solid ${({$color})=>$color}30;display:flex;align-items:center;justify-content:center;font-size:22px;color:${({$color})=>$color};`;
const ProyBody = styled.div`flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;`;
const ProyTop = styled.div`display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;`;
const ProyNombre = styled.h3`font-size:14px;font-weight:800;color:#fff;margin:0;`;
const PropioBadge = styled.span`padding:2px 8px;border-radius:6px;background:rgba(251,146,60,0.15);color:#fb923c;font-size:10px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;`;
const EstadoBadge = styled.span`padding:4px 10px;border-radius:10px;background:${({$bg})=>$bg};color:${({$color})=>$color};font-size:11px;font-weight:700;white-space:nowrap;`;
const ProyMeta = styled.div`display:flex;flex-wrap:wrap;gap:10px;`;
const MetaItem = styled.span`display:flex;align-items:center;gap:4px;font-size:12px;font-weight:500;color:${({$warn})=>$warn?"#f59e0b":"rgba(255,255,255,0.45)"};svg{font-size:13px;}`;
const ProyPresupuesto = styled.div`font-size:16px;font-weight:900;color:${({$color})=>$color};`;
const ProyDesc = styled.p`font-size:12px;color:rgba(255,255,255,0.35);margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;`;

const ProyActions = styled.div`display:flex;flex-direction:column;gap:6px;flex-shrink:0;align-items:flex-end;`;
const BtnGestionar = styled.button`display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:10px;border:1px solid rgba(251,146,60,0.3);background:rgba(251,146,60,0.1);color:#fb923c;font-size:11px;font-weight:700;cursor:pointer;font-family:"Poppins",sans-serif;white-space:nowrap;transition:all .15s;&:hover{background:rgba(251,146,60,0.2);border-color:#fb923c;}svg{font-size:14px;}`;
const BtnEditar = styled.button`width:32px;height:32px;border-radius:9px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(96,165,250,0.7);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;&:hover{background:rgba(96,165,250,0.12);border-color:rgba(96,165,250,0.3);color:#60a5fa;}`;
const BtnEliminar = styled.button`width:32px;height:32px;border-radius:9px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(248,113,113,0.6);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;&:hover{background:rgba(248,113,113,0.12);border-color:rgba(248,113,113,0.3);color:#f87171;}`;

/* Modal */
const Overlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;animation:${fadeIn} .2s ease;`;
const Modal = styled.div`background:#0d1b2a;border:1px solid rgba(255,255,255,0.1);border-radius:24px;width:100%;max-width:600px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;`;
const ModalHeader = styled.div`display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;`;
const ModalTitulo = styled.h2`display:flex;align-items:center;gap:10px;font-size:16px;font-weight:800;color:#fff;margin:0;svg{font-size:20px;}`;
const BtnClose = styled.button`width:32px;height:32px;border-radius:8px;border:none;background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.6);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;&:hover{background:rgba(248,113,113,0.12);color:#f87171;}`;
const ModalBody = styled.div`padding:20px 24px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;flex:1;&::-webkit-scrollbar{width:4px;}&::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px;}`;
const ModalFooter = styled.div`display:flex;gap:10px;padding:16px 24px;border-top:1px solid rgba(255,255,255,0.08);flex-shrink:0;`;

/* Toggle propio/cliente */
const ToggleRow = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:4px;`;
const ToggleOpt = styled.button`display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:14px;border:1px solid;cursor:pointer;font-family:"Poppins",sans-serif;font-size:13px;font-weight:700;transition:all .2s;
  border-color:${p=>p.$active?(p.$own?"#fb923c":"#60a5fa"):"rgba(255,255,255,0.1)"};
  background:${p=>p.$active?(p.$own?"rgba(251,146,60,0.15)":"rgba(96,165,250,0.15)"):"rgba(255,255,255,0.03)"};
  color:${p=>p.$active?(p.$own?"#fb923c":"#60a5fa"):"rgba(255,255,255,0.35)"};
  svg{font-size:18px;}`;

const PropioBanner = styled.div`display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:12px;background:rgba(251,146,60,0.1);border:1px solid rgba(251,146,60,0.25);color:#fb923c;font-size:12px;line-height:1.5;svg{flex-shrink:0;margin-top:2px;}strong{color:#fbbf24;}`;

const Label = styled.label`font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,0.4);`;
const inputBase = css`width:100%;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;font-size:13px;font-family:"Poppins",sans-serif;outline:none;box-sizing:border-box;&:focus{border-color:#60a5fa60;}&::placeholder{color:rgba(255,255,255,0.25);}`;
const Input = styled.input`${inputBase}`;
const Select = styled.select`${inputBase}option{background:#0d1b2a;}`;
const Textarea = styled.textarea`${inputBase}resize:vertical;min-height:66px;`;
const Row2 = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:12px;`;
const TiposGrid = styled.div`display:grid;grid-template-columns:repeat(2,1fr);gap:8px;`;
const TipoBtn = styled.button`display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 8px;border-radius:12px;border:1px solid;cursor:pointer;font-family:"Poppins",sans-serif;font-size:11px;font-weight:700;transition:all .15s;border-color:${({$active,$color})=>$active?$color:"rgba(255,255,255,0.08)"};background:${({$active,$color})=>$active?$color+"20":"rgba(255,255,255,0.03)"};color:${({$active,$color})=>$active?$color:"rgba(255,255,255,0.45)"};svg{font-size:20px;}`;
const BtnCancelar = styled.button`flex:1;padding:11px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.6);font-size:13px;font-weight:700;cursor:pointer;font-family:"Poppins",sans-serif;&:hover{background:rgba(255,255,255,0.08);}`;
const BtnGuardar = styled.button`flex:2;padding:11px;border-radius:12px;border:none;background:linear-gradient(135deg,#60a5fa,#818cf8);color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:"Poppins",sans-serif;transition:opacity .15s;&:disabled{opacity:.5;cursor:not-allowed;}&:hover:not(:disabled){opacity:.9;}`;
