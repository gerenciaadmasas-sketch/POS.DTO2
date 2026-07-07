import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import {
    MostrarProyectoPorId,
    MostrarPersonal, InsertarPersonal, EditarPersonal, EliminarPersonal,
    MostrarActividades, InsertarActividad, EditarActividad, EliminarActividad,
} from "../../supabase/crudInmobiliaria";
import { Icon } from "@iconify/react";
import { RiDeleteBin2Line, RiAddLine, RiEditLine, RiArrowLeftLine } from "react-icons/ri";

const fmt = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtCOP = (n) => n ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n) : "—";

const TIPOS = [
    { key: "remodelacion", label: "Remodelación", icon: "mdi:wrench",                         color: "#f59e0b" },
    { key: "reparacion",   label: "Reparación",   icon: "mdi:toolbox",                        color: "#60a5fa" },
    { key: "construccion", label: "Construcción", icon: "mdi:hard-hat",                       color: "#f88533" },
    { key: "administracion",label:"Administración",icon:"solar:clipboard-list-bold-duotone",  color: "#a78bfa" },
];

const ESTADOS_PROY = [
    { key: "cotizando",   label: "Cotizando",   color: "#94a3b8" },
    { key: "en_progreso", label: "En progreso", color: "#60a5fa" },
    { key: "completado",  label: "Completado",  color: "#4ade80" },
    { key: "cancelado",   label: "Cancelado",   color: "#f87171" },
];

const ROLES = ["Maestro de obra", "Oficial", "Ayudante", "Electricista", "Fontanero", "Pintor", "Arquitecto", "Ingeniero", "Administrador", "Otro"];

const ESTADOS_ACT = [
    { key: "pendiente",    label: "Pendiente",   color: "#94a3b8" },
    { key: "en_progreso",  label: "En progreso", color: "#60a5fa" },
    { key: "completado",   label: "Completado",  color: "#4ade80" },
    { key: "bloqueado",    label: "Bloqueado",   color: "#f87171" },
];

/* ── Blank forms ── */
const P_BLANK = { nombre: "", rol: "", telefono: "", fecha_inicio: "", fecha_fin: "", estado: "activo" };
const A_BLANK = { nombre: "", descripcion: "", responsable: "", fecha_inicio: "", fecha_fin: "", estado: "pendiente", orden: 0 };

export function ProyectoDetalleTemplate() {
    const { id } = useParams();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { dataempresa } = useEmpresaStore();
    const id_empresa = dataempresa?.id;

    const [tab, setTab] = useState("personal");

    /* personal state */
    const [modalP, setModalP]   = useState(false);
    const [editP, setEditP]     = useState(null);
    const [formP, setFormP]     = useState(P_BLANK);

    /* actividades state */
    const [modalA, setModalA]   = useState(false);
    const [editA, setEditA]     = useState(null);
    const [formA, setFormA]     = useState(A_BLANK);

    /* ── queries ── */
    const { data: proyecto } = useQuery({
        queryKey: ["proyecto-detalle", id],
        queryFn:  () => MostrarProyectoPorId({ id, id_empresa }),
        enabled:  !!id && !!id_empresa,
    });

    const { data: personal = [] } = useQuery({
        queryKey: ["proyecto-personal", id],
        queryFn:  () => MostrarPersonal({ proyecto_id: id, id_empresa }),
        enabled:  !!id && !!id_empresa,
    });

    const { data: actividades = [] } = useQuery({
        queryKey: ["proyecto-actividades", id],
        queryFn:  () => MostrarActividades({ proyecto_id: id, id_empresa }),
        enabled:  !!id && !!id_empresa,
    });

    /* ── mutations personal ── */
    const mutPersonal = useMutation({
        mutationFn: (payload) => editP ? EditarPersonal(payload) : InsertarPersonal(payload),
        onSuccess:  () => { qc.invalidateQueries(["proyecto-personal", id]); cerrarP(); },
    });
    const mutBorrarP = useMutation({
        mutationFn: (p) => EliminarPersonal(p),
        onSuccess:  () => qc.invalidateQueries(["proyecto-personal", id]),
    });

    /* ── mutations actividades ── */
    const mutActividad = useMutation({
        mutationFn: (payload) => editA ? EditarActividad(payload) : InsertarActividad(payload),
        onSuccess:  () => { qc.invalidateQueries(["proyecto-actividades", id]); cerrarA(); },
    });
    const mutBorrarA = useMutation({
        mutationFn: (p) => EliminarActividad(p),
        onSuccess:  () => qc.invalidateQueries(["proyecto-actividades", id]),
    });

    /* personal handlers */
    const abrirP = (item = null) => {
        setEditP(item);
        setFormP(item ? { ...item } : { ...P_BLANK, orden: personal.length });
        setModalP(true);
    };
    const cerrarP = () => { setModalP(false); setEditP(null); setFormP(P_BLANK); };
    const submitP = (e) => {
        e.preventDefault();
        const payload = { ...formP, id_empresa, proyecto_id: id, ...(editP ? { id: editP.id } : {}) };
        mutPersonal.mutate(payload);
    };

    /* actividad handlers */
    const abrirA = (item = null) => {
        setEditA(item);
        setFormA(item ? { ...item } : { ...A_BLANK, orden: actividades.length });
        setModalA(true);
    };
    const cerrarA = () => { setModalA(false); setEditA(null); setFormA(A_BLANK); };
    const submitA = (e) => {
        e.preventDefault();
        const payload = { ...formA, id_empresa, proyecto_id: id, orden: Number(formA.orden) || 0, ...(editA ? { id: editA.id } : {}) };
        mutActividad.mutate(payload);
    };

    const setP = (k, v) => setFormP(f => ({ ...f, [k]: v }));
    const setA = (k, v) => setFormA(f => ({ ...f, [k]: v }));

    const tipo   = TIPOS.find(t => t.key === proyecto?.tipo) ?? TIPOS[0];
    const estado = ESTADOS_PROY.find(e => e.key === proyecto?.estado) ?? ESTADOS_PROY[0];

    /* progreso cronograma */
    const total       = actividades.length;
    const completadas = actividades.filter(a => a.estado === "completado").length;
    const pct         = total > 0 ? Math.round((completadas / total) * 100) : 0;

    /* helpers */
    const personalPorNombre = personal.reduce((m, p) => { m[p.nombre] = p; return m; }, {});

    return (
        <Page>
            {/* ── Header ── */}
            <TopBar>
                <BtnBack onClick={() => navigate("/proyectos")}>
                    <RiArrowLeftLine /> Proyectos
                </BtnBack>
            </TopBar>

            {proyecto && (
                <ProyHeader>
                    <ProyIcon $c={tipo.color}>
                        <Icon icon={tipo.icon} />
                    </ProyIcon>
                    <ProyInfo>
                        <ProyTitulo>{proyecto.nombre}</ProyTitulo>
                        <ProyMeta>
                            <MetaTag $c={estado.color}>{estado.label}</MetaTag>
                            <MetaTag $c={tipo.color}>{tipo.label}</MetaTag>
                            {proyecto.fecha_inicio && <MetaItem><Icon icon="solar:calendar-bold-duotone" />{fmt(proyecto.fecha_inicio)}</MetaItem>}
                            {proyecto.fecha_fin_estimada && <MetaItem $warn><Icon icon="solar:flag-bold-duotone" />Entrega: {fmt(proyecto.fecha_fin_estimada)}</MetaItem>}
                            {proyecto.presupuesto > 0 && <MetaItem><Icon icon="solar:dollar-minimalistic-bold-duotone" />{fmtCOP(proyecto.presupuesto)}</MetaItem>}
                        </ProyMeta>
                        {proyecto.descripcion && <ProyDesc>{proyecto.descripcion}</ProyDesc>}
                    </ProyInfo>
                </ProyHeader>
            )}

            {/* Barra progreso */}
            {total > 0 && (
                <ProgressBar>
                    <ProgressHead>
                        <span>Progreso del cronograma</span>
                        <strong>{pct}% — {completadas}/{total} actividades</strong>
                    </ProgressHead>
                    <ProgressTrack>
                        <ProgressFill $pct={pct} />
                    </ProgressTrack>
                </ProgressBar>
            )}

            {/* ── Tabs ── */}
            <Tabs>
                <Tab $active={tab === "personal"} onClick={() => setTab("personal")}>
                    <Icon icon="solar:users-group-rounded-bold-duotone" />
                    Personal contratado
                    {personal.length > 0 && <TabBadge>{personal.length}</TabBadge>}
                </Tab>
                <Tab $active={tab === "cronograma"} onClick={() => setTab("cronograma")}>
                    <Icon icon="solar:calendar-bold-duotone" />
                    Cronograma
                    {actividades.length > 0 && <TabBadge>{actividades.length}</TabBadge>}
                </Tab>
            </Tabs>

            {/* ══ TAB PERSONAL ══ */}
            {tab === "personal" && (
                <Section>
                    <SectionHead>
                        <h3>Personal contratado</h3>
                        <BtnAdd onClick={() => abrirP()}>
                            <RiAddLine /> Agregar persona
                        </BtnAdd>
                    </SectionHead>
                    {personal.length === 0 ? (
                        <Empty>
                            <Icon icon="solar:users-group-rounded-bold-duotone" style={{ fontSize: 40, opacity: .2 }} />
                            <p>Sin personal registrado</p>
                        </Empty>
                    ) : (
                        <PersonalGrid>
                            {personal.map((p, i) => (
                                <PersonCard key={p.id} $i={i}>
                                    <PersonIcon>
                                        <Icon icon="solar:user-bold-duotone" />
                                    </PersonIcon>
                                    <PersonInfo>
                                        <PersonName>{p.nombre}</PersonName>
                                        <PersonRol>{p.rol || "Sin rol"}</PersonRol>
                                        {p.telefono && (
                                            <PersonMeta>
                                                <Icon icon="solar:phone-bold-duotone" />
                                                {p.telefono}
                                            </PersonMeta>
                                        )}
                                        {(p.fecha_inicio || p.fecha_fin) && (
                                            <PersonMeta>
                                                <Icon icon="solar:calendar-bold-duotone" />
                                                {fmt(p.fecha_inicio)} → {fmt(p.fecha_fin)}
                                            </PersonMeta>
                                        )}
                                    </PersonInfo>
                                    <PersonActions>
                                        <BtnEdit onClick={() => abrirP(p)}><RiEditLine /></BtnEdit>
                                        <BtnDel onClick={() => { if (confirm(`¿Eliminar a ${p.nombre}?`)) mutBorrarP.mutate({ id: p.id, id_empresa }); }}>
                                            <RiDeleteBin2Line />
                                        </BtnDel>
                                    </PersonActions>
                                </PersonCard>
                            ))}
                        </PersonalGrid>
                    )}
                </Section>
            )}

            {/* ══ TAB CRONOGRAMA ══ */}
            {tab === "cronograma" && (
                <Section>
                    <SectionHead>
                        <h3>Cronograma de actividades</h3>
                        <BtnAdd onClick={() => abrirA()}>
                            <RiAddLine /> Nueva actividad
                        </BtnAdd>
                    </SectionHead>
                    {actividades.length === 0 ? (
                        <Empty>
                            <Icon icon="solar:calendar-bold-duotone" style={{ fontSize: 40, opacity: .2 }} />
                            <p>Sin actividades en el cronograma</p>
                        </Empty>
                    ) : (
                        <CronoList>
                            {actividades.map((a, i) => {
                                const est = ESTADOS_ACT.find(e => e.key === a.estado) ?? ESTADOS_ACT[0];
                                const resp = personal.find(p => p.nombre === a.responsable);
                                return (
                                    <ActCard key={a.id} $i={i} $c={est.color}>
                                        <ActNum>{String(i + 1).padStart(2, "0")}</ActNum>
                                        <ActBody>
                                            <ActTop>
                                                <ActNombre>{a.nombre}</ActNombre>
                                                <ActBadge $c={est.color}>{est.label}</ActBadge>
                                            </ActTop>
                                            {a.descripcion && <ActDesc>{a.descripcion}</ActDesc>}
                                            <ActMeta>
                                                {a.responsable && (
                                                    <ActMetaItem $c={resp ? "#60a5fa" : "#94a3b8"}>
                                                        <Icon icon="solar:user-bold-duotone" />
                                                        {a.responsable}
                                                    </ActMetaItem>
                                                )}
                                                {(a.fecha_inicio || a.fecha_fin) && (
                                                    <ActMetaItem>
                                                        <Icon icon="solar:calendar-bold-duotone" />
                                                        {fmt(a.fecha_inicio)} → {fmt(a.fecha_fin)}
                                                    </ActMetaItem>
                                                )}
                                            </ActMeta>
                                        </ActBody>
                                        <ActActions>
                                            {/* Cambio rápido de estado */}
                                            <EstadoSelect value={a.estado}
                                                onChange={e => mutActividad.mutate({ id: a.id, id_empresa, estado: e.target.value })}>
                                                {ESTADOS_ACT.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                                            </EstadoSelect>
                                            <BtnEdit onClick={() => abrirA(a)}><RiEditLine /></BtnEdit>
                                            <BtnDel onClick={() => { if (confirm("¿Eliminar actividad?")) mutBorrarA.mutate({ id: a.id, id_empresa }); }}>
                                                <RiDeleteBin2Line />
                                            </BtnDel>
                                        </ActActions>
                                    </ActCard>
                                );
                            })}
                        </CronoList>
                    )}
                </Section>
            )}

            {/* ══ MODAL PERSONAL ══ */}
            {modalP && (
                <Overlay onClick={cerrarP}>
                    <ModalBox onClick={e => e.stopPropagation()}>
                        <MHead>
                            <Icon icon="solar:user-bold-duotone" style={{ color: "#60a5fa", fontSize: 20 }} />
                            <h3>{editP ? "Editar persona" : "Agregar persona"}</h3>
                            <MClose onClick={cerrarP}><Icon icon="solar:close-circle-bold-duotone" /></MClose>
                        </MHead>
                        <MBody onSubmit={submitP}>
                            <MField><label>Nombre completo *</label>
                                <input required value={formP.nombre} onChange={e => setP("nombre", e.target.value)} placeholder="Nombre completo" /></MField>
                            <MRow>
                                <MField><label>Rol / Cargo</label>
                                    <select value={formP.rol} onChange={e => setP("rol", e.target.value)}>
                                        <option value="">Seleccionar rol</option>
                                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </MField>
                                <MField><label>Teléfono</label>
                                    <input value={formP.telefono} onChange={e => setP("telefono", e.target.value)} placeholder="3001234567" /></MField>
                            </MRow>
                            <MRow>
                                <MField><label>Fecha inicio</label>
                                    <input type="date" value={formP.fecha_inicio} onChange={e => setP("fecha_inicio", e.target.value)} /></MField>
                                <MField><label>Fecha fin estimada</label>
                                    <input type="date" value={formP.fecha_fin} onChange={e => setP("fecha_fin", e.target.value)} /></MField>
                            </MRow>
                            <MSave type="submit" disabled={mutPersonal.isPending}>
                                {mutPersonal.isPending ? "Guardando…" : editP ? "Guardar cambios" : "Agregar persona"}
                            </MSave>
                        </MBody>
                    </ModalBox>
                </Overlay>
            )}

            {/* ══ MODAL ACTIVIDAD ══ */}
            {modalA && (
                <Overlay onClick={cerrarA}>
                    <ModalBox onClick={e => e.stopPropagation()}>
                        <MHead>
                            <Icon icon="solar:calendar-bold-duotone" style={{ color: "#4ade80", fontSize: 20 }} />
                            <h3>{editA ? "Editar actividad" : "Nueva actividad"}</h3>
                            <MClose onClick={cerrarA}><Icon icon="solar:close-circle-bold-duotone" /></MClose>
                        </MHead>
                        <MBody onSubmit={submitA}>
                            <MField><label>Nombre de la actividad *</label>
                                <input required value={formA.nombre} onChange={e => setA("nombre", e.target.value)} placeholder="Ej: Demolición de paredes" /></MField>
                            <MField><label>Descripción</label>
                                <textarea rows={2} value={formA.descripcion} onChange={e => setA("descripcion", e.target.value)} placeholder="Detalle de la actividad..." /></MField>
                            <MRow>
                                <MField><label>Responsable</label>
                                    <select value={formA.responsable} onChange={e => setA("responsable", e.target.value)}>
                                        <option value="">Sin asignar</option>
                                        {personal.map(p => <option key={p.id} value={p.nombre}>{p.nombre} — {p.rol || "Sin rol"}</option>)}
                                        <option value="__otro__">Otro (escribir abajo)</option>
                                    </select>
                                </MField>
                                {formA.responsable === "__otro__" && (
                                    <MField><label>Nombre responsable</label>
                                        <input value={formA._responsable_manual ?? ""} onChange={e => { setA("_responsable_manual", e.target.value); setA("responsable", e.target.value); }} placeholder="Nombre" /></MField>
                                )}
                                <MField><label>Estado</label>
                                    <select value={formA.estado} onChange={e => setA("estado", e.target.value)}>
                                        {ESTADOS_ACT.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                                    </select>
                                </MField>
                            </MRow>
                            <MRow>
                                <MField><label>Fecha inicio</label>
                                    <input type="date" value={formA.fecha_inicio} onChange={e => setA("fecha_inicio", e.target.value)} /></MField>
                                <MField><label>Fecha fin</label>
                                    <input type="date" value={formA.fecha_fin} onChange={e => setA("fecha_fin", e.target.value)} /></MField>
                            </MRow>
                            <MField><label>Orden (posición en cronograma)</label>
                                <input type="number" min="0" value={formA.orden} onChange={e => setA("orden", e.target.value)} /></MField>
                            <MSave type="submit" disabled={mutActividad.isPending}>
                                {mutActividad.isPending ? "Guardando…" : editA ? "Guardar cambios" : "Agregar actividad"}
                            </MSave>
                        </MBody>
                    </ModalBox>
                </Overlay>
            )}
        </Page>
    );
}

/* ── STYLES ── */
const fadeUp = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}`;
const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;

const Page = styled.div`padding:24px;max-width:960px;margin:0 auto;@media(max-width:767px){padding:80px 14px 40px;}`;
const TopBar = styled.div`margin-bottom:20px;`;
const BtnBack = styled.button`display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:7px 14px;color:rgba(255,255,255,.6);font-size:13px;font-weight:600;cursor:pointer;transition:.15s;font-family:"Poppins",sans-serif;&:hover{color:#fff;background:rgba(255,255,255,.1);}`;

const ProyHeader = styled.div`display:flex;gap:16px;align-items:flex-start;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:20px;margin-bottom:16px;`;
const ProyIcon = styled.div`width:52px;height:52px;border-radius:16px;background:${p=>p.$c}18;border:1px solid ${p=>p.$c}30;display:flex;align-items:center;justify-content:center;font-size:26px;color:${p=>p.$c};flex-shrink:0;`;
const ProyInfo = styled.div`display:flex;flex-direction:column;gap:8px;flex:1;`;
const ProyTitulo = styled.h1`font-size:20px;font-weight:900;color:#fff;margin:0;`;
const ProyMeta = styled.div`display:flex;flex-wrap:wrap;gap:8px;align-items:center;`;
const MetaTag = styled.span`padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${p=>p.$c}20;color:${p=>p.$c};`;
const MetaItem = styled.span`display:flex;align-items:center;gap:4px;font-size:12px;color:${p=>p.$warn?"#f59e0b":"rgba(255,255,255,.45)"};svg{font-size:13px;}`;
const ProyDesc = styled.p`font-size:13px;color:rgba(255,255,255,.4);margin:0;`;

const ProgressBar = styled.div`background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px 18px;margin-bottom:16px;`;
const ProgressHead = styled.div`display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;span{color:rgba(255,255,255,.4);}strong{color:#4ade80;}`;
const ProgressTrack = styled.div`height:8px;border-radius:20px;background:rgba(255,255,255,.07);overflow:hidden;`;
const ProgressFill = styled.div`height:100%;width:${p=>p.$pct}%;background:linear-gradient(90deg,#60a5fa,#4ade80);border-radius:20px;transition:width .5s ease;`;

const Tabs = styled.div`display:flex;gap:4px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:4px;margin-bottom:20px;`;
const Tab = styled.button`display:flex;align-items:center;gap:7px;flex:1;justify-content:center;padding:10px;border-radius:10px;border:none;cursor:pointer;font-family:"Poppins",sans-serif;font-size:13px;font-weight:700;transition:all .2s;background:${p=>p.$active?"rgba(96,165,250,.15)":"transparent"};color:${p=>p.$active?"#60a5fa":"rgba(255,255,255,.35)"};svg{font-size:18px;}`;
const TabBadge = styled.span`background:rgba(96,165,250,.25);color:#60a5fa;font-size:10px;font-weight:800;padding:1px 6px;border-radius:20px;`;

const Section = styled.div``;
const SectionHead = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;h3{font-size:15px;font-weight:800;color:#fff;margin:0;}`;
const BtnAdd = styled.button`display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;background:linear-gradient(135deg,#60a5fa,#4ade80);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:"Poppins",sans-serif;transition:.15s;&:hover{opacity:.9;}`;
const Empty = styled.div`display:flex;flex-direction:column;align-items:center;gap:10px;padding:48px 0;color:rgba(255,255,255,.3);p{font-size:13px;}`;

/* personal grid */
const PersonalGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;`;
const PersonCard = styled.div`display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);animation:${fadeUp} .3s ${p=>p.$i*.04}s both;`;
const PersonIcon = styled.div`width:38px;height:38px;border-radius:12px;background:rgba(96,165,250,.12);border:1px solid rgba(96,165,250,.2);display:flex;align-items:center;justify-content:center;font-size:18px;color:#60a5fa;flex-shrink:0;`;
const PersonInfo = styled.div`flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;`;
const PersonName = styled.p`font-size:13px;font-weight:700;color:#fff;margin:0;`;
const PersonRol  = styled.p`font-size:11px;color:#60a5fa;font-weight:600;margin:0;`;
const PersonMeta = styled.p`display:flex;align-items:center;gap:4px;font-size:11px;color:rgba(255,255,255,.4);margin:0;svg{font-size:12px;}`;
const PersonActions = styled.div`display:flex;flex-direction:column;gap:4px;`;

/* cronograma */
const CronoList = styled.div`display:flex;flex-direction:column;gap:10px;`;
const ActCard = styled.div`display:flex;gap:14px;align-items:flex-start;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-left:3px solid ${p=>p.$c};animation:${fadeUp} .3s ${p=>p.$i*.04}s both;`;
const ActNum = styled.span`font-size:16px;font-weight:900;color:rgba(255,255,255,.15);flex-shrink:0;width:24px;text-align:right;`;
const ActBody = styled.div`flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;`;
const ActTop = styled.div`display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;`;
const ActNombre = styled.p`font-size:13px;font-weight:700;color:#fff;margin:0;`;
const ActBadge = styled.span`padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:${p=>p.$c}20;color:${p=>p.$c};white-space:nowrap;`;
const ActDesc = styled.p`font-size:12px;color:rgba(255,255,255,.35);margin:0;`;
const ActMeta = styled.div`display:flex;flex-wrap:wrap;gap:10px;`;
const ActMetaItem = styled.span`display:flex;align-items:center;gap:4px;font-size:11px;color:${p=>p.$c||"rgba(255,255,255,.35)"};svg{font-size:12px;}`;
const ActActions = styled.div`display:flex;flex-direction:column;gap:5px;align-items:flex-end;flex-shrink:0;`;
const EstadoSelect = styled.select`background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:11px;font-weight:600;padding:5px 8px;font-family:"Poppins",sans-serif;cursor:pointer;outline:none;option{background:#0d1b2a;}`;

/* botones ícono */
const BtnEdit = styled.button`width:28px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(96,165,250,.7);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s;&:hover{background:rgba(96,165,250,.12);color:#60a5fa;}`;
const BtnDel = styled.button`width:28px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(248,113,113,.6);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s;&:hover{background:rgba(248,113,113,.12);color:#f87171;}`;

/* Overlay / Modal */
const Overlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;animation:${fadeIn} .2s ease;`;
const ModalBox = styled.div`background:#0d1b2a;border:1px solid rgba(255,255,255,.1);border-radius:20px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;`;
const MHead = styled.div`display:flex;align-items:center;gap:10px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.07);h3{flex:1;font-size:15px;font-weight:800;color:#fff;margin:0;}`;
const MClose = styled.button`background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;&:hover{color:#f87171;}`;
const MBody = styled.form`padding:18px 20px;display:flex;flex-direction:column;gap:12px;`;
const MRow = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:10px;@media(max-width:480px){grid-template-columns:1fr;}`;
const MField = styled.div`display:flex;flex-direction:column;gap:5px;label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;}input,select,textarea{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:9px 11px;color:#fff;font-size:13px;font-family:"Poppins",sans-serif;outline:none;&:focus{border-color:#60a5fa;}textarea{resize:vertical;font-family:inherit;}select option{background:#0d1b2a;}}`;
const MSave = styled.button`background:linear-gradient(135deg,#60a5fa,#4ade80);color:#fff;border:none;border-radius:11px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;margin-top:4px;font-family:"Poppins",sans-serif;transition:.15s;&:hover{opacity:.9;}&:disabled{opacity:.5;cursor:not-allowed;}`;
