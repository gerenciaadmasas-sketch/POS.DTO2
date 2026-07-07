import { useState, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import {
    MostrarProyectoPorId,
    MostrarPersonal, InsertarPersonal, EditarPersonal, EliminarPersonal,
    MostrarActividades, InsertarActividad, EditarActividad, EliminarActividad,
    MostrarMovimientos, InsertarMovimiento, EditarMovimiento, EliminarMovimiento,
} from "../../supabase/crudInmobiliaria";
import { Icon } from "@iconify/react";
import { RiDeleteBin2Line, RiAddLine, RiEditLine, RiArrowLeftLine } from "react-icons/ri";

const fmt     = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtCOP  = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);

/* ── Catálogos ── */
const TIPOS_PROY = [
    { key: "remodelacion",  label: "Remodelación",  icon: "mdi:wrench",                          color: "#f59e0b" },
    { key: "reparacion",    label: "Reparación",    icon: "mdi:toolbox",                         color: "#60a5fa" },
    { key: "construccion",  label: "Construcción",  icon: "mdi:hard-hat",                        color: "#f88533" },
    { key: "administracion",label: "Administración",icon: "solar:clipboard-list-bold-duotone",   color: "#a78bfa" },
];
const ESTADOS_PROY = [
    { key: "cotizando",   label: "Cotizando",   color: "#94a3b8" },
    { key: "en_progreso", label: "En progreso", color: "#60a5fa" },
    { key: "completado",  label: "Completado",  color: "#4ade80" },
    { key: "cancelado",   label: "Cancelado",   color: "#f87171" },
];
const ROLES = ["Maestro de obra","Oficial","Ayudante","Electricista","Fontanero","Pintor","Arquitecto","Ingeniero","Administrador","Otro"];
const ESTADOS_ACT = [
    { key: "pendiente",   label: "Pendiente",   color: "#94a3b8" },
    { key: "en_progreso", label: "En progreso", color: "#60a5fa" },
    { key: "completado",  label: "Completado",  color: "#4ade80" },
    { key: "bloqueado",   label: "Bloqueado",   color: "#f87171" },
];

const CATEGORIAS_EGRESO = [
    { key: "materiales",   label: "Materiales",       icon: "solar:box-bold-duotone",               color: "#f59e0b" },
    { key: "mano_obra",    label: "Mano de obra",     icon: "mdi:hard-hat",                         color: "#60a5fa" },
    { key: "equipos",      label: "Equipos / Maquinaria", icon: "mdi:excavator",                    color: "#f88533" },
    { key: "transporte",   label: "Transporte",       icon: "solar:bus-bold-duotone",               color: "#a78bfa" },
    { key: "honorarios",   label: "Honorarios",       icon: "solar:diploma-bold-duotone",           color: "#34d399" },
    { key: "otros",        label: "Otros gastos",     icon: "solar:widget-bold-duotone",            color: "#94a3b8" },
];
const CATEGORIAS_INGRESO = [
    { key: "anticipo",       label: "Anticipo",         icon: "solar:hand-money-bold-duotone",      color: "#4ade80" },
    { key: "cobro_cliente",  label: "Cobro a cliente",  icon: "solar:dollar-minimalistic-bold-duotone", color: "#34d399" },
    { key: "otros_ingreso",  label: "Otros ingresos",   icon: "solar:widget-bold-duotone",          color: "#94a3b8" },
];

/* ── Blanks ── */
const P_BLANK  = { nombre: "", rol: "", telefono: "", fecha_inicio: "", fecha_fin: "", estado: "activo" };
const A_BLANK  = { nombre: "", descripcion: "", responsable_id: "", responsable: "", fecha_inicio: "", fecha_fin: "", estado: "pendiente", orden: 0 };
const M_BLANK  = { tipo: "egreso", categoria: "materiales", descripcion: "", monto: "", fecha: new Date().toISOString().slice(0,10) };

export function ProyectoDetalleTemplate() {
    const { id }       = useParams();
    const navigate     = useNavigate();
    const qc           = useQueryClient();
    const { dataempresa } = useEmpresaStore();
    const id_empresa   = dataempresa?.id;

    const [tab, setTab]         = useState("personal");
    const [modalP, setModalP]   = useState(false);
    const [editP, setEditP]     = useState(null);
    const [formP, setFormP]     = useState(P_BLANK);
    const [modalA, setModalA]   = useState(false);
    const [editA, setEditA]     = useState(null);
    const [formA, setFormA]     = useState(A_BLANK);
    const [modalM, setModalM]   = useState(false);
    const [editM, setEditM]     = useState(null);
    const [formM, setFormM]     = useState(M_BLANK);

    /* ── Queries ── */
    const { data: proyecto }      = useQuery({ queryKey: ["proyecto-detalle", id],       queryFn: () => MostrarProyectoPorId({ id, id_empresa }),             enabled: !!id && !!id_empresa });
    const { data: personal = [] } = useQuery({ queryKey: ["proyecto-personal", id],      queryFn: () => MostrarPersonal({ proyecto_id: id, id_empresa }),      enabled: !!id && !!id_empresa });
    const { data: actividades = []} = useQuery({ queryKey: ["proyecto-actividades", id], queryFn: () => MostrarActividades({ proyecto_id: id, id_empresa }),   enabled: !!id && !!id_empresa });
    const { data: movimientos = []} = useQuery({ queryKey: ["proyecto-movimientos", id], queryFn: () => MostrarMovimientos({ proyecto_id: id, id_empresa }),   enabled: !!id && !!id_empresa });

    /* ── Mutations personal ── */
    const mutP  = useMutation({ mutationFn: (p) => editP ? EditarPersonal(p)   : InsertarPersonal(p),   onSuccess: () => { qc.invalidateQueries(["proyecto-personal", id]);      cerrarP(); } });
    const delP  = useMutation({ mutationFn: (p) => EliminarPersonal(p),                                  onSuccess: () =>   qc.invalidateQueries(["proyecto-personal", id])             });
    /* ── Mutations actividades ── */
    const mutA  = useMutation({ mutationFn: (p) => editA ? EditarActividad(p)  : InsertarActividad(p),  onSuccess: () => { qc.invalidateQueries(["proyecto-actividades", id]);   cerrarA(); } });
    const delA  = useMutation({ mutationFn: (p) => EliminarActividad(p),                                 onSuccess: () =>   qc.invalidateQueries(["proyecto-actividades", id])            });
    /* ── Mutations movimientos ── */
    const mutM  = useMutation({ mutationFn: (p) => editM ? EditarMovimiento(p) : InsertarMovimiento(p), onSuccess: () => { qc.invalidateQueries(["proyecto-movimientos", id]);   cerrarM(); } });
    const delM  = useMutation({ mutationFn: (p) => EliminarMovimiento(p),                               onSuccess: () =>   qc.invalidateQueries(["proyecto-movimientos", id])            });

    /* ── Handlers personal ── */
    const abrirP  = (item = null) => { setEditP(item); setFormP(item ? { ...item } : P_BLANK); setModalP(true); };
    const cerrarP = () => { setModalP(false); setEditP(null); setFormP(P_BLANK); };
    const submitP = (e) => { e.preventDefault(); mutP.mutate({ ...formP, id_empresa, proyecto_id: id, ...(editP ? { id: editP.id } : {}) }); };
    const setP    = (k, v) => setFormP(f => ({ ...f, [k]: v }));

    /* ── Handlers actividades ── */
    const abrirA  = (item = null) => { setEditA(item); setFormA(item ? { ...item } : { ...A_BLANK, orden: actividades.length }); setModalA(true); };
    const cerrarA = () => { setModalA(false); setEditA(null); setFormA(A_BLANK); };
    const submitA = (e) => {
        e.preventDefault();
        mutA.mutate({ ...formA, id_empresa, proyecto_id: id, orden: Number(formA.orden) || 0, ...(editA ? { id: editA.id } : {}) });
    };
    const setA = (k, v) => setFormA(f => ({ ...f, [k]: v }));

    /* ── Handlers movimientos ── */
    const abrirM  = (item = null) => { setEditM(item); setFormM(item ? { ...item, monto: String(item.monto) } : { ...M_BLANK }); setModalM(true); };
    const cerrarM = () => { setModalM(false); setEditM(null); setFormM(M_BLANK); };
    const submitM = (e) => {
        e.preventDefault();
        mutM.mutate({ ...formM, id_empresa, proyecto_id: id, monto: parseFloat(formM.monto) || 0, ...(editM ? { id: editM.id } : {}) });
    };
    const setM = (k, v) => setFormM(f => ({ ...f, [k]: v }));

    /* ── Cálculos contabilidad ── */
    const totalEgresos  = useMemo(() => movimientos.filter(m => m.tipo === "egreso").reduce((s, m)  => s + Number(m.monto), 0), [movimientos]);
    const totalIngresos = useMemo(() => movimientos.filter(m => m.tipo === "ingreso").reduce((s, m) => s + Number(m.monto), 0), [movimientos]);
    const balance       = totalIngresos - totalEgresos;
    const presupuesto   = Number(proyecto?.presupuesto ?? 0);
    const pctGastado    = presupuesto > 0 ? Math.min(100, Math.round((totalEgresos / presupuesto) * 100)) : 0;

    /* ── Progreso cronograma ── */
    const actTotal      = actividades.length;
    const actCompletas  = actividades.filter(a => a.estado === "completado").length;
    const pctCrono      = actTotal > 0 ? Math.round((actCompletas / actTotal) * 100) : 0;

    const tipo   = TIPOS_PROY.find(t => t.key === proyecto?.tipo)   ?? TIPOS_PROY[0];
    const estado = ESTADOS_PROY.find(e => e.key === proyecto?.estado) ?? ESTADOS_PROY[0];

    /* ── Agrupación egresos por categoría ── */
    const resumenCategorias = useMemo(() => {
        return CATEGORIAS_EGRESO.map(cat => ({
            ...cat,
            total: movimientos.filter(m => m.tipo === "egreso" && m.categoria === cat.key).reduce((s,m) => s + Number(m.monto), 0),
        })).filter(c => c.total > 0);
    }, [movimientos]);

    return (
        <Page>
            <TopBar>
                <BtnBack onClick={() => navigate("/proyectos")}><RiArrowLeftLine /> Proyectos</BtnBack>
            </TopBar>

            {/* ── Cabecera proyecto ── */}
            {proyecto && (
                <ProyHeader>
                    <ProyIcon $c={tipo.color}><Icon icon={tipo.icon} /></ProyIcon>
                    <ProyInfo>
                        <ProyTitulo>{proyecto.nombre}</ProyTitulo>
                        <ProyMeta>
                            <MetaTag $c={estado.color}>{estado.label}</MetaTag>
                            <MetaTag $c={tipo.color}>{tipo.label}</MetaTag>
                            {proyecto.fecha_inicio     && <MetaItem><Icon icon="solar:calendar-bold-duotone"           />{fmt(proyecto.fecha_inicio)}</MetaItem>}
                            {proyecto.fecha_fin_estimada && <MetaItem $warn><Icon icon="solar:flag-bold-duotone"       />Entrega: {fmt(proyecto.fecha_fin_estimada)}</MetaItem>}
                            {presupuesto > 0           && <MetaItem><Icon icon="solar:dollar-minimalistic-bold-duotone"/>{fmtCOP(presupuesto)}</MetaItem>}
                        </ProyMeta>
                        {proyecto.descripcion && <ProyDesc>{proyecto.descripcion}</ProyDesc>}
                    </ProyInfo>
                </ProyHeader>
            )}

            {/* ── Barras progreso ── */}
            <ProgressGrid>
                {actTotal > 0 && (
                    <ProgressCard>
                        <ProgressHead><span>Avance del cronograma</span><strong style={{color:"#4ade80"}}>{pctCrono}% — {actCompletas}/{actTotal} actividades</strong></ProgressHead>
                        <ProgressTrack><ProgressFill $pct={pctCrono} $color="#4ade80" /></ProgressTrack>
                    </ProgressCard>
                )}
                {presupuesto > 0 && (
                    <ProgressCard>
                        <ProgressHead>
                            <span>Presupuesto utilizado</span>
                            <strong style={{color: pctGastado > 90 ? "#f87171" : pctGastado > 70 ? "#f59e0b" : "#60a5fa"}}>
                                {pctGastado}% — {fmtCOP(totalEgresos)} / {fmtCOP(presupuesto)}
                            </strong>
                        </ProgressHead>
                        <ProgressTrack>
                            <ProgressFill $pct={pctGastado} $color={pctGastado > 90 ? "#f87171" : pctGastado > 70 ? "#f59e0b" : "#60a5fa"} />
                        </ProgressTrack>
                    </ProgressCard>
                )}
            </ProgressGrid>

            {/* ── Tabs ── */}
            <Tabs>
                <Tab $active={tab === "personal"} onClick={() => setTab("personal")}>
                    <Icon icon="solar:users-group-rounded-bold-duotone" />Personal
                    {personal.length > 0 && <TabBadge>{personal.length}</TabBadge>}
                </Tab>
                <Tab $active={tab === "cronograma"} onClick={() => setTab("cronograma")}>
                    <Icon icon="solar:calendar-bold-duotone" />Cronograma
                    {actTotal > 0 && <TabBadge>{actTotal}</TabBadge>}
                </Tab>
                <Tab $active={tab === "contabilidad"} onClick={() => setTab("contabilidad")}>
                    <Icon icon="solar:chart-bold-duotone" />Contabilidad
                    {movimientos.length > 0 && <TabBadge>{movimientos.length}</TabBadge>}
                </Tab>
            </Tabs>

            {/* ══════════ TAB PERSONAL ══════════ */}
            {tab === "personal" && (
                <Section>
                    <SectionHead>
                        <h3>Personal contratado</h3>
                        <BtnAdd onClick={() => abrirP()}><RiAddLine /> Agregar persona</BtnAdd>
                    </SectionHead>
                    {personal.length === 0 ? (
                        <Empty><Icon icon="solar:users-group-rounded-bold-duotone" style={{fontSize:40,opacity:.2}}/><p>Sin personal registrado</p></Empty>
                    ) : (
                        <PersonalGrid>
                            {personal.map((p, i) => (
                                <PersonCard key={p.id} $i={i}>
                                    <PersonAvatar>{p.nombre.charAt(0).toUpperCase()}</PersonAvatar>
                                    <PersonInfo>
                                        <PersonName>{p.nombre}</PersonName>
                                        <PersonRol>{p.rol || "Sin rol"}</PersonRol>
                                        {p.telefono && <PersonMeta><Icon icon="solar:phone-bold-duotone"/>{p.telefono}</PersonMeta>}
                                        {(p.fecha_inicio || p.fecha_fin) && <PersonMeta><Icon icon="solar:calendar-bold-duotone"/>{fmt(p.fecha_inicio)} → {fmt(p.fecha_fin)}</PersonMeta>}
                                    </PersonInfo>
                                    <PersonActions>
                                        <BtnIcon onClick={() => abrirP(p)}><RiEditLine /></BtnIcon>
                                        <BtnIcon $red onClick={() => { if(confirm(`¿Eliminar a ${p.nombre}?`)) delP.mutate({ id: p.id, id_empresa }); }}><RiDeleteBin2Line /></BtnIcon>
                                    </PersonActions>
                                </PersonCard>
                            ))}
                        </PersonalGrid>
                    )}
                </Section>
            )}

            {/* ══════════ TAB CRONOGRAMA ══════════ */}
            {tab === "cronograma" && (
                <Section>
                    <SectionHead>
                        <h3>Cronograma de actividades</h3>
                        <BtnAdd onClick={() => abrirA()}><RiAddLine /> Nueva actividad</BtnAdd>
                    </SectionHead>
                    {actividades.length === 0 ? (
                        <Empty><Icon icon="solar:calendar-bold-duotone" style={{fontSize:40,opacity:.2}}/><p>Sin actividades registradas</p></Empty>
                    ) : (
                        <CronoList>
                            {actividades.map((a, i) => {
                                const est  = ESTADOS_ACT.find(e => e.key === a.estado) ?? ESTADOS_ACT[0];
                                const resp = personal.find(p => p.id === a.responsable_id || p.nombre === a.responsable);
                                return (
                                    <ActCard key={a.id} $i={i} $c={est.color}>
                                        <ActNum>{String(i + 1).padStart(2,"0")}</ActNum>
                                        <ActBody>
                                            <ActTop>
                                                <ActNombre>{a.nombre}</ActNombre>
                                                <ActBadge $c={est.color}>{est.label}</ActBadge>
                                            </ActTop>
                                            {a.descripcion && <ActDesc>{a.descripcion}</ActDesc>}
                                            <ActMeta>
                                                {resp && (
                                                    <ResponsableChip>
                                                        <span>{resp.nombre.charAt(0)}</span>
                                                        {resp.nombre} · {resp.rol || "Sin rol"}
                                                    </ResponsableChip>
                                                )}
                                                {!resp && a.responsable && (
                                                    <ResponsableChip $ext>
                                                        <span>{a.responsable.charAt(0)}</span>
                                                        {a.responsable}
                                                    </ResponsableChip>
                                                )}
                                                {(a.fecha_inicio || a.fecha_fin) && (
                                                    <ActMetaItem><Icon icon="solar:calendar-bold-duotone"/>{fmt(a.fecha_inicio)} → {fmt(a.fecha_fin)}</ActMetaItem>
                                                )}
                                            </ActMeta>
                                        </ActBody>
                                        <ActActions>
                                            <EstadoSelect value={a.estado}
                                                onChange={e => mutA.mutate({ id: a.id, id_empresa, proyecto_id: id, estado: e.target.value, nombre: a.nombre, orden: a.orden })}>
                                                {ESTADOS_ACT.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                                            </EstadoSelect>
                                            <BtnIcon onClick={() => abrirA(a)}><RiEditLine /></BtnIcon>
                                            <BtnIcon $red onClick={() => { if(confirm("¿Eliminar actividad?")) delA.mutate({ id: a.id, id_empresa }); }}><RiDeleteBin2Line /></BtnIcon>
                                        </ActActions>
                                    </ActCard>
                                );
                            })}
                        </CronoList>
                    )}
                </Section>
            )}

            {/* ══════════ TAB CONTABILIDAD ══════════ */}
            {tab === "contabilidad" && (
                <Section>
                    {/* Resumen financiero */}
                    <FinGrid>
                        <FinCard $c="#4ade80">
                            <FinIcon $c="#4ade80"><Icon icon="solar:arrow-down-bold-duotone"/></FinIcon>
                            <div>
                                <FinLabel>Total ingresos</FinLabel>
                                <FinMonto $c="#4ade80">{fmtCOP(totalIngresos)}</FinMonto>
                            </div>
                        </FinCard>
                        <FinCard $c="#f87171">
                            <FinIcon $c="#f87171"><Icon icon="solar:arrow-up-bold-duotone"/></FinIcon>
                            <div>
                                <FinLabel>Total egresos</FinLabel>
                                <FinMonto $c="#f87171">{fmtCOP(totalEgresos)}</FinMonto>
                            </div>
                        </FinCard>
                        <FinCard $c={balance >= 0 ? "#60a5fa" : "#f59e0b"}>
                            <FinIcon $c={balance >= 0 ? "#60a5fa" : "#f59e0b"}><Icon icon="solar:graph-bold-duotone"/></FinIcon>
                            <div>
                                <FinLabel>Balance</FinLabel>
                                <FinMonto $c={balance >= 0 ? "#60a5fa" : "#f59e0b"}>{fmtCOP(balance)}</FinMonto>
                            </div>
                        </FinCard>
                        {presupuesto > 0 && (
                            <FinCard $c="#a78bfa">
                                <FinIcon $c="#a78bfa"><Icon icon="solar:dollar-minimalistic-bold-duotone"/></FinIcon>
                                <div>
                                    <FinLabel>Presupuesto disponible</FinLabel>
                                    <FinMonto $c="#a78bfa">{fmtCOP(presupuesto - totalEgresos)}</FinMonto>
                                </div>
                            </FinCard>
                        )}
                    </FinGrid>

                    {/* Resumen por categoría */}
                    {resumenCategorias.length > 0 && (
                        <CatSection>
                            <CatTitle>Egresos por categoría</CatTitle>
                            <CatGrid>
                                {resumenCategorias.map(c => (
                                    <CatCard key={c.key} $c={c.color}>
                                        <Icon icon={c.icon} style={{fontSize:20,color:c.color}}/>
                                        <CatInfo>
                                            <CatNombre>{c.label}</CatNombre>
                                            <CatMonto $c={c.color}>{fmtCOP(c.total)}</CatMonto>
                                        </CatInfo>
                                        <CatPct>{presupuesto > 0 ? Math.round((c.total/presupuesto)*100) : 0}%</CatPct>
                                    </CatCard>
                                ))}
                            </CatGrid>
                        </CatSection>
                    )}

                    {/* Lista movimientos */}
                    <SectionHead style={{marginTop:20}}>
                        <h3>Movimientos</h3>
                        <MovBtns>
                            <BtnIngreso onClick={() => { setFormM({...M_BLANK, tipo:"ingreso", categoria:"cobro_cliente"}); setEditM(null); setModalM(true); }}>
                                <Icon icon="solar:arrow-down-bold-duotone"/> Ingreso
                            </BtnIngreso>
                            <BtnEgreso onClick={() => { setFormM({...M_BLANK, tipo:"egreso", categoria:"materiales"}); setEditM(null); setModalM(true); }}>
                                <Icon icon="solar:arrow-up-bold-duotone"/> Egreso
                            </BtnEgreso>
                        </MovBtns>
                    </SectionHead>

                    {movimientos.length === 0 ? (
                        <Empty><Icon icon="solar:chart-bold-duotone" style={{fontSize:40,opacity:.2}}/><p>Sin movimientos registrados</p></Empty>
                    ) : (
                        <MovList>
                            {movimientos.map((m, i) => {
                                const cats = m.tipo === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
                                const cat  = cats.find(c => c.key === m.categoria) ?? cats[cats.length-1];
                                return (
                                    <MovRow key={m.id} $i={i}>
                                        <MovCatIcon $c={cat.color}><Icon icon={cat.icon}/></MovCatIcon>
                                        <MovBody>
                                            <MovDesc>{m.descripcion}</MovDesc>
                                            <MovMeta>{cat.label} · {fmt(m.fecha)}</MovMeta>
                                        </MovBody>
                                        <MovMonto $ing={m.tipo === "ingreso"}>
                                            {m.tipo === "ingreso" ? "+" : "-"}{fmtCOP(m.monto)}
                                        </MovMonto>
                                        <MovActs>
                                            <BtnIcon onClick={() => abrirM(m)}><RiEditLine /></BtnIcon>
                                            <BtnIcon $red onClick={() => { if(confirm("¿Eliminar movimiento?")) delM.mutate({ id: m.id, id_empresa }); }}><RiDeleteBin2Line /></BtnIcon>
                                        </MovActs>
                                    </MovRow>
                                );
                            })}
                        </MovList>
                    )}
                </Section>
            )}

            {/* ══════════ MODAL PERSONAL ══════════ */}
            {modalP && (
                <Overlay onClick={cerrarP}>
                    <ModalBox onClick={e => e.stopPropagation()}>
                        <MHead>
                            <Icon icon="solar:user-bold-duotone" style={{color:"#60a5fa",fontSize:20}}/>
                            <h3>{editP ? "Editar persona" : "Agregar persona"}</h3>
                            <MClose onClick={cerrarP}><Icon icon="solar:close-circle-bold-duotone"/></MClose>
                        </MHead>
                        <MBody onSubmit={submitP}>
                            <MField><label>Nombre completo *</label>
                                <input required value={formP.nombre} onChange={e => setP("nombre", e.target.value)} placeholder="Nombre completo"/></MField>
                            <MRow>
                                <MField><label>Rol / Cargo</label>
                                    <select value={formP.rol} onChange={e => setP("rol", e.target.value)}>
                                        <option value="">Seleccionar rol</option>
                                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </MField>
                                <MField><label>Teléfono</label>
                                    <input value={formP.telefono} onChange={e => setP("telefono", e.target.value)} placeholder="3001234567"/></MField>
                            </MRow>
                            <MRow>
                                <MField><label>Fecha inicio</label>
                                    <input type="date" value={formP.fecha_inicio} onChange={e => setP("fecha_inicio", e.target.value)}/></MField>
                                <MField><label>Fecha fin estimada</label>
                                    <input type="date" value={formP.fecha_fin} onChange={e => setP("fecha_fin", e.target.value)}/></MField>
                            </MRow>
                            <MSave type="submit" disabled={mutP.isPending}>
                                {mutP.isPending ? "Guardando…" : editP ? "Guardar cambios" : "Agregar persona"}
                            </MSave>
                        </MBody>
                    </ModalBox>
                </Overlay>
            )}

            {/* ══════════ MODAL ACTIVIDAD ══════════ */}
            {modalA && (
                <Overlay onClick={cerrarA}>
                    <ModalBox onClick={e => e.stopPropagation()}>
                        <MHead>
                            <Icon icon="solar:calendar-bold-duotone" style={{color:"#4ade80",fontSize:20}}/>
                            <h3>{editA ? "Editar actividad" : "Nueva actividad"}</h3>
                            <MClose onClick={cerrarA}><Icon icon="solar:close-circle-bold-duotone"/></MClose>
                        </MHead>
                        <MBody onSubmit={submitA}>
                            <MField><label>Nombre de la actividad *</label>
                                <input required value={formA.nombre} onChange={e => setA("nombre", e.target.value)} placeholder="Ej: Demolición de paredes"/></MField>
                            <MField><label>Descripción</label>
                                <textarea rows={2} value={formA.descripcion} onChange={e => setA("descripcion", e.target.value)} placeholder="Detalle de la actividad..."/></MField>

                            {/* Asignación de personal */}
                            <MField>
                                <label>Asignar responsable</label>
                                {personal.length === 0 ? (
                                    <NoPersonal>Agrega personal en la pestaña "Personal" para asignar responsables.</NoPersonal>
                                ) : (
                                    <PersonalSelector>
                                        <PersonalOpt
                                            $active={!formA.responsable_id}
                                            onClick={() => { setA("responsable_id", ""); setA("responsable", ""); }}>
                                            Sin asignar
                                        </PersonalOpt>
                                        {personal.map(p => (
                                            <PersonalOpt key={p.id}
                                                $active={formA.responsable_id === p.id || formA.responsable === p.nombre}
                                                onClick={() => { setA("responsable_id", p.id); setA("responsable", p.nombre); }}>
                                                <Avatar>{p.nombre.charAt(0)}</Avatar>
                                                <span>{p.nombre}<small>{p.rol || ""}</small></span>
                                            </PersonalOpt>
                                        ))}
                                    </PersonalSelector>
                                )}
                            </MField>

                            <MRow>
                                <MField><label>Estado</label>
                                    <select value={formA.estado} onChange={e => setA("estado", e.target.value)}>
                                        {ESTADOS_ACT.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                                    </select>
                                </MField>
                                <MField><label>Orden en cronograma</label>
                                    <input type="number" min="0" value={formA.orden} onChange={e => setA("orden", e.target.value)}/></MField>
                            </MRow>
                            <MRow>
                                <MField><label>Fecha inicio</label>
                                    <input type="date" value={formA.fecha_inicio} onChange={e => setA("fecha_inicio", e.target.value)}/></MField>
                                <MField><label>Fecha fin</label>
                                    <input type="date" value={formA.fecha_fin} onChange={e => setA("fecha_fin", e.target.value)}/></MField>
                            </MRow>
                            <MSave type="submit" disabled={mutA.isPending}>
                                {mutA.isPending ? "Guardando…" : editA ? "Guardar cambios" : "Agregar actividad"}
                            </MSave>
                        </MBody>
                    </ModalBox>
                </Overlay>
            )}

            {/* ══════════ MODAL MOVIMIENTO ══════════ */}
            {modalM && (
                <Overlay onClick={cerrarM}>
                    <ModalBox onClick={e => e.stopPropagation()}>
                        <MHead>
                            <Icon icon={formM.tipo === "ingreso" ? "solar:arrow-down-bold-duotone" : "solar:arrow-up-bold-duotone"}
                                style={{color: formM.tipo === "ingreso" ? "#4ade80" : "#f87171", fontSize:20}}/>
                            <h3>{editM ? "Editar movimiento" : formM.tipo === "ingreso" ? "Registrar ingreso" : "Registrar egreso"}</h3>
                            <MClose onClick={cerrarM}><Icon icon="solar:close-circle-bold-duotone"/></MClose>
                        </MHead>
                        <MBody onSubmit={submitM}>
                            {/* Tipo toggle */}
                            {!editM && (
                                <TipoToggle>
                                    <TipoOpt $active={formM.tipo === "egreso"} $c="#f87171"
                                        onClick={() => setM("tipo","egreso")}>
                                        <Icon icon="solar:arrow-up-bold-duotone"/> Egreso
                                    </TipoOpt>
                                    <TipoOpt $active={formM.tipo === "ingreso"} $c="#4ade80"
                                        onClick={() => setM("tipo","ingreso")}>
                                        <Icon icon="solar:arrow-down-bold-duotone"/> Ingreso
                                    </TipoOpt>
                                </TipoToggle>
                            )}

                            {/* Categorías */}
                            <MField><label>Categoría</label>
                                <CatSelector>
                                    {(formM.tipo === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO).map(c => (
                                        <CatOpt key={c.key} $active={formM.categoria === c.key} $c={c.color}
                                            onClick={() => setM("categoria", c.key)}>
                                            <Icon icon={c.icon}/>
                                            <span>{c.label}</span>
                                        </CatOpt>
                                    ))}
                                </CatSelector>
                            </MField>

                            <MField><label>Descripción *</label>
                                <input required value={formM.descripcion} onChange={e => setM("descripcion", e.target.value)}
                                    placeholder="Ej: Compra de cemento y varilla"/></MField>
                            <MRow>
                                <MField><label>Monto ($) *</label>
                                    <input required type="number" min="0" step="1000" value={formM.monto}
                                        onChange={e => setM("monto", e.target.value)} placeholder="0"/></MField>
                                <MField><label>Fecha</label>
                                    <input type="date" value={formM.fecha} onChange={e => setM("fecha", e.target.value)}/></MField>
                            </MRow>
                            <MSave type="submit" $ing={formM.tipo === "ingreso"} disabled={mutM.isPending}>
                                {mutM.isPending ? "Guardando…" : editM ? "Guardar cambios" : `Registrar ${formM.tipo}`}
                            </MSave>
                        </MBody>
                    </ModalBox>
                </Overlay>
            )}
        </Page>
    );
}

/* ══════════════════════ STYLES ══════════════════════ */
const fadeUp = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}`;
const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;

const Page       = styled.div`padding:24px;max-width:960px;margin:0 auto;@media(max-width:767px){padding:80px 14px 40px;}`;
const TopBar     = styled.div`margin-bottom:20px;`;
const BtnBack    = styled.button`display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:7px 14px;color:rgba(255,255,255,.6);font-size:13px;font-weight:600;cursor:pointer;font-family:"Poppins",sans-serif;transition:.15s;&:hover{color:#fff;background:rgba(255,255,255,.1);}`;

const ProyHeader = styled.div`display:flex;gap:16px;align-items:flex-start;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:20px;margin-bottom:14px;@media(max-width:480px){flex-direction:column;}`;
const ProyIcon   = styled.div`width:52px;height:52px;border-radius:16px;background:${p=>p.$c}18;border:1px solid ${p=>p.$c}30;display:flex;align-items:center;justify-content:center;font-size:26px;color:${p=>p.$c};flex-shrink:0;`;
const ProyInfo   = styled.div`display:flex;flex-direction:column;gap:8px;flex:1;`;
const ProyTitulo = styled.h1`font-size:20px;font-weight:900;color:#fff;margin:0;`;
const ProyMeta   = styled.div`display:flex;flex-wrap:wrap;gap:8px;align-items:center;`;
const MetaTag    = styled.span`padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${p=>p.$c}20;color:${p=>p.$c};`;
const MetaItem   = styled.span`display:flex;align-items:center;gap:4px;font-size:12px;color:${p=>p.$warn?"#f59e0b":"rgba(255,255,255,.45)"};svg{font-size:13px;}`;
const ProyDesc   = styled.p`font-size:13px;color:rgba(255,255,255,.4);margin:0;`;

const ProgressGrid  = styled.div`display:flex;flex-direction:column;gap:10px;margin-bottom:16px;`;
const ProgressCard  = styled.div`background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:14px 18px;`;
const ProgressHead  = styled.div`display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;span{color:rgba(255,255,255,.4);}`;
const ProgressTrack = styled.div`height:7px;border-radius:20px;background:rgba(255,255,255,.07);overflow:hidden;`;
const ProgressFill  = styled.div`height:100%;width:${p=>p.$pct}%;background:${p=>p.$color};border-radius:20px;transition:width .5s ease;`;

const Tabs     = styled.div`display:flex;gap:3px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:4px;margin-bottom:20px;`;
const Tab      = styled.button`display:flex;align-items:center;gap:6px;flex:1;justify-content:center;padding:10px 8px;border-radius:10px;border:none;cursor:pointer;font-family:"Poppins",sans-serif;font-size:12px;font-weight:700;transition:all .2s;background:${p=>p.$active?"rgba(96,165,250,.15)":"transparent"};color:${p=>p.$active?"#60a5fa":"rgba(255,255,255,.35)"};svg{font-size:16px;}@media(max-width:400px){font-size:11px;gap:4px;}`;
const TabBadge = styled.span`background:rgba(96,165,250,.25);color:#60a5fa;font-size:10px;font-weight:800;padding:1px 5px;border-radius:20px;`;

const Section     = styled.div``;
const SectionHead = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;h3{font-size:15px;font-weight:800;color:#fff;margin:0;}`;
const BtnAdd      = styled.button`display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;background:linear-gradient(135deg,#60a5fa,#4ade80);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:"Poppins",sans-serif;transition:.15s;&:hover{opacity:.9;}`;
const Empty       = styled.div`display:flex;flex-direction:column;align-items:center;gap:10px;padding:48px 0;color:rgba(255,255,255,.3);p{font-size:13px;}`;

/* personal */
const PersonalGrid    = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;`;
const PersonCard      = styled.div`display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);animation:${fadeUp} .3s ${p=>p.$i*.04}s both;`;
const PersonAvatar    = styled.div`width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#60a5fa,#818cf8);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#fff;flex-shrink:0;`;
const PersonInfo      = styled.div`flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;`;
const PersonName      = styled.p`font-size:13px;font-weight:700;color:#fff;margin:0;`;
const PersonRol       = styled.p`font-size:11px;color:#60a5fa;font-weight:600;margin:0;`;
const PersonMeta      = styled.p`display:flex;align-items:center;gap:4px;font-size:11px;color:rgba(255,255,255,.4);margin:0;svg{font-size:12px;}`;
const PersonActions   = styled.div`display:flex;gap:4px;`;

/* cronograma */
const CronoList       = styled.div`display:flex;flex-direction:column;gap:10px;`;
const ActCard         = styled.div`display:flex;gap:14px;align-items:flex-start;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-left:3px solid ${p=>p.$c};animation:${fadeUp} .3s ${p=>p.$i*.04}s both;`;
const ActNum          = styled.span`font-size:16px;font-weight:900;color:rgba(255,255,255,.15);flex-shrink:0;width:24px;text-align:right;`;
const ActBody         = styled.div`flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;`;
const ActTop          = styled.div`display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;`;
const ActNombre       = styled.p`font-size:13px;font-weight:700;color:#fff;margin:0;`;
const ActBadge        = styled.span`padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:${p=>p.$c}20;color:${p=>p.$c};white-space:nowrap;`;
const ActDesc         = styled.p`font-size:12px;color:rgba(255,255,255,.35);margin:0;`;
const ActMeta         = styled.div`display:flex;flex-wrap:wrap;gap:8px;align-items:center;`;
const ActMetaItem     = styled.span`display:flex;align-items:center;gap:4px;font-size:11px;color:rgba(255,255,255,.35);svg{font-size:12px;}`;
const ResponsableChip = styled.span`display:flex;align-items:center;gap:6px;padding:3px 10px 3px 4px;border-radius:20px;background:${p=>p.$ext?"rgba(255,255,255,.07)":"rgba(96,165,250,.12)"};font-size:11px;font-weight:600;color:${p=>p.$ext?"rgba(255,255,255,.5)":"#60a5fa"};span{width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#60a5fa,#818cf8);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;}`;
const ActActions      = styled.div`display:flex;flex-direction:column;gap:5px;align-items:flex-end;flex-shrink:0;`;
const EstadoSelect    = styled.select`background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:11px;font-weight:600;padding:5px 8px;font-family:"Poppins",sans-serif;cursor:pointer;outline:none;option{background:#0d1b2a;}`;

/* contabilidad */
const FinGrid    = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:16px;`;
const FinCard    = styled.div`display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid ${p=>p.$c}20;`;
const FinIcon    = styled.div`width:36px;height:36px;border-radius:10px;background:${p=>p.$c}15;display:flex;align-items:center;justify-content:center;font-size:18px;color:${p=>p.$c};flex-shrink:0;`;
const FinLabel   = styled.p`font-size:11px;color:rgba(255,255,255,.4);margin:0;`;
const FinMonto   = styled.p`font-size:14px;font-weight:800;color:${p=>p.$c};margin:0;`;

const CatSection = styled.div`margin-bottom:8px;`;
const CatTitle   = styled.p`font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.3);margin-bottom:8px;`;
const CatGrid    = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;`;
const CatCard    = styled.div`display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);`;
const CatInfo    = styled.div`flex:1;min-width:0;`;
const CatNombre  = styled.p`font-size:11px;color:rgba(255,255,255,.4);margin:0;`;
const CatMonto   = styled.p`font-size:13px;font-weight:700;color:${p=>p.$c};margin:0;`;
const CatPct     = styled.span`font-size:11px;font-weight:700;color:rgba(255,255,255,.25);flex-shrink:0;`;

const MovBtns    = styled.div`display:flex;gap:8px;`;
const BtnIngreso = styled.button`display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:10px;border:1px solid rgba(74,222,128,.3);background:rgba(74,222,128,.1);color:#4ade80;font-size:12px;font-weight:700;cursor:pointer;font-family:"Poppins",sans-serif;transition:.15s;&:hover{background:rgba(74,222,128,.2);}svg{font-size:14px;}`;
const BtnEgreso  = styled.button`display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:10px;border:1px solid rgba(248,113,113,.3);background:rgba(248,113,113,.1);color:#f87171;font-size:12px;font-weight:700;cursor:pointer;font-family:"Poppins",sans-serif;transition:.15s;&:hover{background:rgba(248,113,113,.2);}svg{font-size:14px;}`;

const MovList    = styled.div`display:flex;flex-direction:column;gap:8px;margin-top:4px;`;
const MovRow     = styled.div`display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);animation:${fadeUp} .3s ${p=>p.$i*.03}s both;`;
const MovCatIcon = styled.div`width:34px;height:34px;border-radius:10px;background:${p=>p.$c}15;display:flex;align-items:center;justify-content:center;font-size:16px;color:${p=>p.$c};flex-shrink:0;`;
const MovBody    = styled.div`flex:1;min-width:0;`;
const MovDesc    = styled.p`font-size:13px;font-weight:600;color:#fff;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const MovMeta    = styled.p`font-size:11px;color:rgba(255,255,255,.35);margin:0;`;
const MovMonto   = styled.p`font-size:14px;font-weight:800;color:${p=>p.$ing?"#4ade80":"#f87171"};margin:0;white-space:nowrap;`;
const MovActs    = styled.div`display:flex;gap:4px;flex-shrink:0;`;

const BtnIcon    = styled.button`width:28px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:${p=>p.$red?"rgba(248,113,113,.6)":"rgba(96,165,250,.7)"};font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s;&:hover{background:${p=>p.$red?"rgba(248,113,113,.12)":"rgba(96,165,250,.12)"};color:${p=>p.$red?"#f87171":"#60a5fa"};}`;

/* modal */
const Overlay    = styled.div`position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;animation:${fadeIn} .2s ease;`;
const ModalBox   = styled.div`background:#0d1b2a;border:1px solid rgba(255,255,255,.1);border-radius:20px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;`;
const MHead      = styled.div`display:flex;align-items:center;gap:10px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.07);h3{flex:1;font-size:15px;font-weight:800;color:#fff;margin:0;}`;
const MClose     = styled.button`background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;&:hover{color:#f87171;}`;
const MBody      = styled.form`padding:18px 20px;display:flex;flex-direction:column;gap:12px;`;
const MRow       = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:10px;@media(max-width:480px){grid-template-columns:1fr;}`;
const MField     = styled.div`display:flex;flex-direction:column;gap:5px;label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;}input,select,textarea{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:9px 11px;color:#fff;font-size:13px;font-family:"Poppins",sans-serif;outline:none;&:focus{border-color:#60a5fa;}textarea{resize:vertical;font-family:inherit;}select option{background:#0d1b2a;}}`;
const MSave      = styled.button`background:${p=>p.$ing?"linear-gradient(135deg,#4ade80,#059669)":"linear-gradient(135deg,#60a5fa,#4ade80)"};color:#fff;border:none;border-radius:11px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;margin-top:4px;font-family:"Poppins",sans-serif;transition:.15s;&:hover{opacity:.9;}&:disabled{opacity:.5;cursor:not-allowed;}`;

const TipoToggle = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:8px;`;
const TipoOpt    = styled.button`display:flex;align-items:center;justify-content:center;gap:7px;padding:10px;border-radius:12px;border:1px solid ${p=>p.$active?p.$c:"rgba(255,255,255,.1)"};background:${p=>p.$active?`${p.$c}18`:"transparent"};color:${p=>p.$active?p.$c:"rgba(255,255,255,.35)"};font-size:13px;font-weight:700;cursor:pointer;font-family:"Poppins",sans-serif;transition:.2s;svg{font-size:17px;}`;
const CatSelector= styled.div`display:grid;grid-template-columns:repeat(3,1fr);gap:6px;@media(max-width:400px){grid-template-columns:repeat(2,1fr);}`;
const CatOpt     = styled.button`display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 6px;border-radius:10px;border:1px solid ${p=>p.$active?p.$c:"rgba(255,255,255,.08)"};background:${p=>p.$active?`${p.$c}18`:"transparent"};color:${p=>p.$active?p.$c:"rgba(255,255,255,.35)"};font-size:10px;font-weight:700;cursor:pointer;font-family:"Poppins",sans-serif;transition:.15s;svg{font-size:18px;}text-align:center;line-height:1.2;`;

/* selector personal en actividad */
const PersonalSelector = styled.div`display:flex;flex-direction:column;gap:5px;`;
const PersonalOpt      = styled.button`display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:10px;border:1px solid ${p=>p.$active?"#60a5fa":"rgba(255,255,255,.08)"};background:${p=>p.$active?"rgba(96,165,250,.12)":"rgba(255,255,255,.03)"};color:${p=>p.$active?"#60a5fa":"rgba(255,255,255,.5)"};font-size:12px;font-weight:600;cursor:pointer;font-family:"Poppins",sans-serif;text-align:left;transition:.15s;span{display:flex;flex-direction:column;gap:1px;}small{font-size:10px;color:rgba(255,255,255,.3);display:block;}`;
const Avatar           = styled.div`width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#60a5fa,#818cf8);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;flex-shrink:0;`;
const NoPersonal       = styled.p`font-size:12px;color:rgba(255,255,255,.3);padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);margin:0;`;
