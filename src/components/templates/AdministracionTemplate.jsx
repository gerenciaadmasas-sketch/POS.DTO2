import { useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { MostrarPropiedades, InsertarPropiedad, EditarPropiedad, EliminarPropiedad } from "../../supabase/crudInmobiliaria";
import { Icon } from "@iconify/react";
import { RiDeleteBin2Line } from "react-icons/ri";

/* ── animaciones ── */
const fadeUp = keyframes`from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}`;
const shimmer = keyframes`0%{background-position:-400px 0}100%{background-position:400px 0}`;

/* ── TIPOS ── */
const TIPOS = [
    { key: "apartamento",    label: "Apartamento",    icon: "solar:buildings-bold-duotone",    color: "#60a5fa" },
    { key: "casa",           label: "Casa",           icon: "solar:home-smile-bold-duotone",   color: "#34d399" },
    { key: "lote",           label: "Lote",           icon: "solar:map-point-bold-duotone",    color: "#f59e0b" },
    { key: "local_comercial",label: "Local Comercial",icon: "solar:shop-bold-duotone",         color: "#f87171" },
    { key: "edificio",       label: "Edificio",       icon: "solar:city-bold-duotone",         color: "#a78bfa" },
    { key: "conjunto",       label: "Conjunto",       icon: "solar:home-wifi-bold-duotone",    color: "#fb923c" },
];

const ESTADOS = [
    { key: "activo",    label: "Activo",    color: "#4ade80" },
    { key: "inactivo",  label: "Inactivo",  color: "#94a3b8" },
    { key: "suspendido",label: "Suspendido",color: "#f87171" },
];

const BLANK = {
    propietario: "", tel_propietario: "",
    tipo: "apartamento", titulo: "", direccion: "", ciudad: "", sector: "",
    precio: "", porcentaje_admin: "10",
    estado: "activo", descripcion: "",
    es_administrada: true,
    habitaciones: 0, banos: 0, garajes: 0, estrato: 0, area_m2: "",
};

const fmt = (n) => n ? Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }) : "—";

export function AdministracionTemplate() {
    const qc = useQueryClient();
    const { dataempresa } = useEmpresaStore();
    const id_empresa = dataempresa?.id;

    const [modal, setModal]     = useState(false);
    const [form, setForm]       = useState(BLANK);
    const [editing, setEditing] = useState(null);
    const [filtro, setFiltro]   = useState("todos");
    const [busq, setBusq]       = useState("");

    const { data: todasProp = [], isLoading } = useQuery({
        queryKey: ["propiedades", id_empresa],
        queryFn:  () => MostrarPropiedades({ id_empresa }),
        enabled:  !!id_empresa,
        refetchOnWindowFocus: false,
    });

    const lista = todasProp.filter(p => p.es_administrada);

    const guardar = useMutation({
        mutationFn: (p) => editing ? EditarPropiedad(p) : InsertarPropiedad(p),
        onSuccess:  () => { qc.invalidateQueries(["propiedades", id_empresa]); cerrar(); },
    });

    const borrar = useMutation({
        mutationFn: (p) => EliminarPropiedad(p),
        onSuccess:  () => qc.invalidateQueries(["propiedades", id_empresa]),
    });

    const abrir = (item = null) => {
        if (item) { setEditing(item); setForm({ ...BLANK, ...item, porcentaje_admin: item.porcentaje_admin ?? "10", precio: String(item.precio ?? ""), area_m2: String(item.area_m2 ?? "") }); }
        else       { setEditing(null); setForm(BLANK); }
        setModal(true);
    };

    const cerrar = () => { setModal(false); setEditing(null); setForm(BLANK); };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            id_empresa,
            es_administrada:  true,
            precio:           parseFloat(form.precio)           || 0,
            area_m2:          parseFloat(form.area_m2)          || 0,
            porcentaje_admin: parseFloat(form.porcentaje_admin) || 10,
            ...(editing ? { id: editing.id } : {}),
        };
        guardar.mutate(payload);
    };

    const visible = lista.filter(a => {
        const ok = filtro === "todos" || a.estado === filtro;
        const q  = busq.toLowerCase();
        return ok && (!q || a.propietario?.toLowerCase().includes(q) || a.direccion?.toLowerCase().includes(q) || a.titulo?.toLowerCase().includes(q));
    });

    const activos    = lista.filter(a => a.estado === "disponible").length;
    const inactivos  = lista.filter(a => a.estado === "reservado").length;
    const suspendidos= lista.filter(a => a.estado === "vendido").length;
    const totalCanon = lista.reduce((s, a) => s + Number(a.precio || 0), 0);

    return (
        <Wrap>
            <Header>
                <TitleRow>
                    <Icon icon="solar:clipboard-list-bold-duotone" style={{ fontSize: 28, color: "#a78bfa" }} />
                    <h2>Administración de Inmuebles</h2>
                </TitleRow>
                <BtnAdd onClick={() => abrir()}>
                    <Icon icon="solar:add-circle-bold-duotone" />
                    Nuevo inmueble
                </BtnAdd>
            </Header>

            <StatsRow>
                <Stat $c="#4ade80"><span>{activos}</span><p>Activos</p></Stat>
                <Stat $c="#94a3b8"><span>{inactivos}</span><p>Inactivos</p></Stat>
                <Stat $c="#f87171"><span>{suspendidos}</span><p>Suspendidos</p></Stat>
                <Stat $c="#a78bfa"><span style={{fontSize:"1rem"}}>{fmt(totalCanon)}</span><p>Canon total activo</p></Stat>
            </StatsRow>

            <Controls>
                <SearchBox>
                    <Icon icon="solar:magnifer-bold-duotone" />
                    <input placeholder="Buscar propietario o dirección…" value={busq} onChange={e => setBusq(e.target.value)} />
                </SearchBox>
                <Chips>
                    {["todos", ...ESTADOS.map(e => e.key)].map(k => (
                        <Chip key={k} $active={filtro === k} onClick={() => setFiltro(k)}>
                            {k === "todos" ? "Todos" : ESTADOS.find(e => e.key === k)?.label}
                        </Chip>
                    ))}
                </Chips>
            </Controls>

            {isLoading ? (
                <SkeletonGrid>{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</SkeletonGrid>
            ) : visible.length === 0 ? (
                <Empty>
                    <Icon icon="solar:clipboard-list-bold-duotone" style={{ fontSize: 48, opacity: 0.3 }} />
                    <p>No hay inmuebles en administración{filtro !== "todos" ? ` con estado "${filtro}"` : ""}</p>
                </Empty>
            ) : (
                <Grid>
                    {visible.map((a, i) => {
                        const tipo = TIPOS.find(t => t.key === a.tipo) || TIPOS[0];
                        const est  = ESTADOS.find(e => e.key === a.estado) || ESTADOS[0];
                        const comision = (Number(a.precio || 0) * Number(a.porcentaje_admin || 10)) / 100;
                        return (
                            <Card key={a.id} $i={i} onClick={() => abrir(a)}>
                                <CardTop>
                                    <Icon icon={tipo.icon} style={{ fontSize: 24, color: tipo.color }} />
                                    <Badge $c={est.color}>{est.label}</Badge>
                                </CardTop>
                                <CardName>{a.propietario || a.titulo || "Sin propietario"}</CardName>
                                <CardAddr>
                                    <Icon icon="solar:map-point-bold-duotone" />
                                    {a.direccion || "—"}{a.ciudad ? `, ${a.ciudad}` : ""}
                                </CardAddr>
                                <CanonRow>
                                    <CanonItem>
                                        <span>Canon / Precio</span>
                                        <strong style={{ color: "#a78bfa" }}>{fmt(a.precio)}</strong>
                                    </CanonItem>
                                    <CanonItem>
                                        <span>Comisión ({a.porcentaje_admin}%)</span>
                                        <strong style={{ color: "#4ade80" }}>{fmt(comision)}</strong>
                                    </CanonItem>
                                </CanonRow>
                                <CardFooter>
                                    <span>{tipo.label}</span>
                                    <BtnDel onClick={e => { e.stopPropagation(); if (confirm("¿Eliminar inmueble?")) borrar.mutate({ id: a.id, id_empresa }); }}>
                                        <RiDeleteBin2Line />
                                    </BtnDel>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </Grid>
            )}

            {modal && (
                <Overlay onClick={cerrar}>
                    <ModalBox onClick={e => e.stopPropagation()}>
                        <ModalHead>
                            <Icon icon="solar:clipboard-list-bold-duotone" style={{ color: "#a78bfa", fontSize: 22 }} />
                            <h3>{editing ? "Editar inmueble" : "Nuevo inmueble en administración"}</h3>
                            <BtnClose onClick={cerrar}><Icon icon="solar:close-circle-bold-duotone" /></BtnClose>
                        </ModalHead>
                        <ModalBody onSubmit={submit}>
                            <Section>Tipo de inmueble</Section>
                            <TipoGrid>
                                {TIPOS.map(t => (
                                    <TipoBtn key={t.key} type="button" $active={form.tipo === t.key} $c={t.color}
                                        onClick={() => set("tipo", t.key)}>
                                        <Icon icon={t.icon} style={{ fontSize: 20 }} />
                                        <span>{t.label}</span>
                                    </TipoBtn>
                                ))}
                            </TipoGrid>

                            <Section>Propietario</Section>
                            <Row2>
                                <Field><label>Nombre del propietario *</label><input required value={form.propietario} onChange={e => set("propietario", e.target.value)} /></Field>
                                <Field><label>Teléfono propietario</label><input value={form.tel_propietario} onChange={e => set("tel_propietario", e.target.value)} /></Field>
                            </Row2>

                            <Section>Inmueble</Section>
                            <Field><label>Título / Nombre del inmueble</label><input value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Ej: Apto 402 El Poblado" /></Field>
                            <Field><label>Dirección</label><input value={form.direccion} onChange={e => set("direccion", e.target.value)} /></Field>
                            <Row2>
                                <Field><label>Ciudad</label><input value={form.ciudad} onChange={e => set("ciudad", e.target.value)} /></Field>
                                <Field><label>Sector / Barrio</label><input value={form.sector} onChange={e => set("sector", e.target.value)} /></Field>
                            </Row2>

                            <Section>Condiciones económicas</Section>
                            <Row2>
                                <Field><label>Canon / Precio mensual ($)</label><input type="number" value={form.precio} onChange={e => set("precio", e.target.value)} /></Field>
                                <Field><label>% Comisión administración</label><input type="number" step="0.5" value={form.porcentaje_admin} onChange={e => set("porcentaje_admin", e.target.value)} /></Field>
                            </Row2>

                            <Section>Estado</Section>
                            <EstadoRow>
                                {ESTADOS.map(e => (
                                    <EstadoBtn key={e.key} type="button" $active={form.estado === e.key} $c={e.color}
                                        onClick={() => set("estado", e.key)}>
                                        {e.label}
                                    </EstadoBtn>
                                ))}
                            </EstadoRow>

                            <Field><label>Descripción / Observaciones</label><textarea rows={3} value={form.descripcion} onChange={e => set("descripcion", e.target.value)} /></Field>

                            <BtnSave type="submit" disabled={guardar.isPending}>
                                {guardar.isPending ? "Guardando…" : editing ? "Guardar cambios" : "Registrar inmueble"}
                            </BtnSave>
                        </ModalBody>
                    </ModalBox>
                </Overlay>
            )}
        </Wrap>
    );
}

/* ── STYLES ── */
const Wrap = styled.div`padding:24px;max-width:1100px;margin:0 auto;`;
const Header = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;`;
const TitleRow = styled.div`display:flex;align-items:center;gap:10px;h2{font-size:1.5rem;font-weight:700;color:var(--text);margin:0;}`;
const BtnAdd = styled.button`display:flex;align-items:center;gap:6px;background:linear-gradient(135deg,#a78bfa,#7c3aed);color:#fff;border:none;border-radius:12px;padding:10px 18px;font-size:.9rem;font-weight:600;cursor:pointer;transition:.2s;&:hover{opacity:.9;}svg{font-size:18px;}`;
const StatsRow = styled.div`display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;@media(max-width:640px){grid-template-columns:repeat(2,1fr);}`;
const Stat = styled.div`background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px 16px;span{font-size:1.5rem;font-weight:700;color:${p=>p.$c};display:block;}p{font-size:.75rem;color:var(--text-soft,#94a3b8);margin-top:2px;}`;
const Controls = styled.div`display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;`;
const SearchBox = styled.div`display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:8px 14px;flex:1;min-width:220px;svg{font-size:18px;color:#94a3b8;}input{background:none;border:none;outline:none;color:var(--text);font-size:.9rem;width:100%;}`;
const Chips = styled.div`display:flex;gap:6px;flex-wrap:wrap;`;
const Chip = styled.button`padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.12);background:${p=>p.$active?"rgba(167,139,250,.2)":"transparent"};color:${p=>p.$active?"#a78bfa":"#94a3b8"};font-size:.8rem;cursor:pointer;transition:.2s;`;
const SkeletonGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;`;
const SkeletonCard = styled.div`height:200px;border-radius:16px;background:linear-gradient(90deg,rgba(255,255,255,.05) 25%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.05) 75%);background-size:800px 100%;animation:${shimmer} 1.5s infinite;`;
const Empty = styled.div`display:flex;flex-direction:column;align-items:center;gap:12px;padding:60px 0;color:#94a3b8;p{font-size:1rem;}`;
const Grid = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;`;
const Card = styled.div`${({$i})=>css`animation:${fadeUp} .4s ${$i*.05}s both;`}background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px;cursor:pointer;transition:.25s;&:hover{transform:translateY(-3px);border-color:rgba(167,139,250,.4);background:rgba(167,139,250,.06);}`;
const CardTop = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;`;
const Badge = styled.span`padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:600;background:${p=>p.$c}22;color:${p=>p.$c};`;
const CardName = styled.p`font-size:1rem;font-weight:600;color:var(--text);margin-bottom:4px;`;
const CardAddr = styled.p`display:flex;align-items:center;gap:4px;font-size:.8rem;color:#94a3b8;margin-bottom:10px;svg{font-size:14px;}`;
const CanonRow = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;`;
const CanonItem = styled.div`display:flex;flex-direction:column;gap:2px;span{font-size:.72rem;color:#64748b;}strong{font-size:.9rem;}`;
const CardFooter = styled.div`display:flex;align-items:center;justify-content:space-between;span{font-size:.75rem;color:#64748b;}`;
const BtnDel = styled.button`background:none;border:none;color:#f87171;cursor:pointer;font-size:18px;padding:4px;border-radius:8px;&:hover{background:rgba(248,113,113,.15);}`;

/* modal */
const Overlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;`;
const ModalBox = styled.div`background:var(--bg-card,#1e2235);border:1px solid rgba(255,255,255,.1);border-radius:20px;width:100%;max-width:640px;max-height:90vh;overflow-y:auto;`;
const ModalHead = styled.div`display:flex;align-items:center;gap:10px;padding:20px 24px 16px;border-bottom:1px solid rgba(255,255,255,.07);h3{font-size:1.1rem;font-weight:700;color:var(--text);flex:1;}`;
const BtnClose = styled.button`background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;&:hover{color:#f87171;}`;
const ModalBody = styled.form`padding:20px 24px;display:flex;flex-direction:column;gap:14px;`;
const Section = styled.p`font-size:.78rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-top:4px;`;
const Row2 = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:12px;@media(max-width:500px){grid-template-columns:1fr;}`;
const Field = styled.div`display:flex;flex-direction:column;gap:5px;label{font-size:.8rem;color:#94a3b8;}input,textarea{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:9px 12px;color:var(--text);font-size:.9rem;outline:none;&:focus{border-color:#a78bfa;}textarea{resize:vertical;font-family:inherit;}}`;
const TipoGrid = styled.div`display:grid;grid-template-columns:repeat(3,1fr);gap:8px;@media(max-width:400px){grid-template-columns:repeat(2,1fr);}`;
const TipoBtn = styled.button`display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 8px;border-radius:12px;border:1px solid ${p=>p.$active?p.$c:"rgba(255,255,255,.08)"};background:${p=>p.$active?`${p.$c}22`:"transparent"};color:${p=>p.$active?p.$c:"#94a3b8"};font-size:.75rem;cursor:pointer;transition:.2s;`;
const EstadoRow = styled.div`display:flex;gap:8px;flex-wrap:wrap;`;
const EstadoBtn = styled.button`padding:7px 16px;border-radius:20px;border:1px solid ${p=>p.$active?p.$c:"rgba(255,255,255,.1)"};background:${p=>p.$active?`${p.$c}22`:"transparent"};color:${p=>p.$active?p.$c:"#94a3b8"};font-size:.85rem;cursor:pointer;transition:.2s;`;
const BtnSave = styled.button`background:linear-gradient(135deg,#a78bfa,#7c3aed);color:#fff;border:none;border-radius:12px;padding:12px;font-size:.95rem;font-weight:600;cursor:pointer;margin-top:8px;transition:.2s;&:hover{opacity:.9;}&:disabled{opacity:.6;cursor:not-allowed;}`;
