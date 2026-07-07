import { useState, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useNavigate } from "react-router-dom";
import {
    MostrarPropiedades, InsertarPropiedad, EditarPropiedad, EliminarPropiedad,
    MostrarProyectos,
} from "../../supabase/crudInmobiliaria";
import { toastExito } from "../../utils/toast";
import { Icon } from "@iconify/react";
import { RiCloseLine, RiEditLine, RiDeleteBin2Line, RiMapPinLine, RiArrowRightLine } from "react-icons/ri";
import Swal from "sweetalert2";

const formatCOP = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);

/* ── catálogos propiedades ── */
export const TIPOS_PROP = [
    { key: "apartamento",    label: "Apartamento",     icon: "solar:buildings-bold-duotone",   color: "#60a5fa" },
    { key: "casa",           label: "Casa",            icon: "solar:home-2-bold-duotone",      color: "#4ade80" },
    { key: "lote",           label: "Lote",            icon: "solar:map-point-bold-duotone",   color: "#f59e0b" },
    { key: "finca",          label: "Finca",           icon: "mdi:home-group",                 color: "#34d399" },
    { key: "local_comercial",label: "Local Comercial", icon: "solar:shop-bold-duotone",        color: "#a78bfa" },
    { key: "edificio",       label: "Bodega",          icon: "mdi:warehouse",                  color: "#f88533" },
];

const ESTADOS_PROP = [
    { key: "disponible",      label: "Disponible",      color: "#4ade80", bg: "rgba(74,222,128,0.12)"   },
    { key: "reservado",       label: "Reservado",       color: "#f59e0b", bg: "rgba(245,158,11,0.12)"   },
    { key: "vendido",         label: "Vendido",         color: "#60a5fa", bg: "rgba(96,165,250,0.12)"   },
    { key: "en_construccion", label: "En construcción", color: "#f88533", bg: "rgba(248,133,51,0.12)"   },
];

const ESTADOS_ADMIN = [
    { key: "activo",     label: "Activo",     color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
    { key: "inactivo",   label: "Inactivo",   color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
    { key: "suspendido", label: "Suspendido", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
];

const TODOS_ESTADOS = [...ESTADOS_PROP, ...ESTADOS_ADMIN];

/* ── catálogos proyectos ── */
const TIPOS_PROYECTO = [
    { key: "remodelacion",   label: "Remodelación",       icon: "mdi:wrench",                         color: "#f59e0b" },
    { key: "reparacion",     label: "Reparación locativa", icon: "mdi:toolbox",                        color: "#60a5fa" },
    { key: "construccion",   label: "Construcción",        icon: "mdi:hard-hat",                       color: "#f88533" },
    { key: "administracion", label: "Administración",      icon: "solar:clipboard-list-bold-duotone",  color: "#a78bfa" },
];

const ESTADOS_PROYECTO = [
    { key: "cotizando",   label: "Cotizando",   color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
    { key: "en_progreso", label: "En progreso", color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
    { key: "completado",  label: "Completado",  color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
    { key: "cancelado",   label: "Cancelado",   color: "#f87171", bg: "rgba(248,113,113,0.12)" },
];

const ESTRATOS = [1, 2, 3, 4, 5, 6];

const FORM_VACIO = {
    tipo: "apartamento", titulo: "", descripcion: "", precio: "",
    area_m2: "", habitaciones: 0, banos: 0, garajes: 0, estrato: 0,
    ciudad: "", sector: "", direccion: "", estado: "disponible",
    es_administrada: false, propietario: "", tel_propietario: "", porcentaje_admin: 10,
};

/* ── vistas del hub ── */
const VISTAS = [
    { key: "todos",         label: "Todo",                icon: "solar:widget-5-bold-duotone",          color: "#f59e0b" },
    { key: "propias",       label: "Inmuebles Propios",   icon: "solar:home-2-bold-duotone",            color: "#4ade80" },
    { key: "administradas", label: "Gestión Adm.",        icon: "solar:clipboard-list-bold-duotone",    color: "#a78bfa" },
    { key: "proyectos",     label: "Proyectos",           icon: "mdi:hard-hat",                         color: "#f88533" },
];

export function PropiedadesTemplate() {
    const { dataempresa } = useEmpresaStore();
    const qc = useQueryClient();
    const navigate = useNavigate();

    const [modal, setModal]             = useState(false);
    const [editando, setEditando]       = useState(null);
    const [vista, setVista]             = useState("todos");
    const [filtroEstado, setFiltroEstado] = useState("todos");
    const [filtroTipo, setFiltroTipo]   = useState("todos");
    const [form, setForm]               = useState(FORM_VACIO);

    function cambiarVista(v) { setVista(v); setFiltroEstado("todos"); setFiltroTipo("todos"); }

    /* ── queries ── */
    const { data: propiedades = [], isLoading } = useQuery({
        queryKey: ["propiedades", dataempresa?.id],
        queryFn:  () => MostrarPropiedades({ id_empresa: dataempresa.id }),
        enabled:  !!dataempresa?.id,
    });

    const { data: proyectos = [] } = useQuery({
        queryKey: ["proyectos-obra", dataempresa?.id],
        queryFn:  () => MostrarProyectos({ id_empresa: dataempresa.id }),
        enabled:  !!dataempresa?.id,
    });

    /* ── mutations ── */
    const invalidar = () => qc.invalidateQueries({ queryKey: ["propiedades"] });

    const mutCrear = useMutation({
        mutationFn: () => InsertarPropiedad({
            ...form,
            precio: Number(form.precio) || 0,
            area_m2: Number(form.area_m2) || 0,
            porcentaje_admin: Number(form.porcentaje_admin) || 10,
            id_empresa: dataempresa.id,
        }),
        onSuccess: () => { toastExito("Propiedad registrada"); invalidar(); cerrar(); },
    });

    const mutEditar = useMutation({
        mutationFn: () => EditarPropiedad({
            ...form,
            id: editando.id,
            id_empresa: dataempresa.id,
            precio: Number(form.precio) || 0,
            area_m2: Number(form.area_m2) || 0,
            porcentaje_admin: Number(form.porcentaje_admin) || 10,
        }),
        onSuccess: () => { toastExito("Propiedad actualizada"); invalidar(); cerrar(); },
    });

    const mutEliminar = useMutation({
        mutationFn: (p) => EliminarPropiedad({ id: p.id, id_empresa: dataempresa.id }),
        onSuccess:  () => { toastExito("Propiedad eliminada"); invalidar(); },
    });

    function abrirNuevo() { setForm(FORM_VACIO); setEditando(null); setModal(true); }
    function abrirEditar(p) {
        setForm({
            tipo: p.tipo, titulo: p.titulo, descripcion: p.descripcion ?? "",
            precio: String(p.precio ?? ""), area_m2: String(p.area_m2 ?? ""),
            habitaciones: p.habitaciones ?? 0, banos: p.banos ?? 0, garajes: p.garajes ?? 0,
            estrato: p.estrato ?? 0, ciudad: p.ciudad ?? "", sector: p.sector ?? "",
            direccion: p.direccion ?? "", estado: p.estado,
            es_administrada: p.es_administrada ?? false,
            propietario: p.propietario ?? "", tel_propietario: p.tel_propietario ?? "",
            porcentaje_admin: p.porcentaje_admin ?? 10,
        });
        setEditando(p); setModal(true);
    }
    function cerrar() { setModal(false); setEditando(null); }

    async function confirmarEliminar(p) {
        const r = await Swal.fire({
            title: "¿Eliminar propiedad?",
            text: `"${p.titulo}" se eliminará permanentemente.`,
            icon: "warning", showCancelButton: true,
            confirmButtonText: "Eliminar", cancelButtonText: "Cancelar",
            confirmButtonColor: "#f87171", cancelButtonColor: "#374151",
            customClass: { popup: "swal-pos" },
        });
        if (r.isConfirmed) mutEliminar.mutate(p);
    }

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    /* ── stats para las tarjetas superiores ── */
    const propiasCnt     = propiedades.filter(p => !p.es_administrada).length;
    const admCnt         = propiedades.filter(p => p.es_administrada).length;
    const proyActivosCnt = proyectos.filter(p => p.estado === "en_progreso" || p.estado === "cotizando").length;
    const totalCnt       = propiedades.length + proyectos.length;

    /* ── filtros contextuales ── */
    const estadoChips = useMemo(() => {
        if (vista === "proyectos") return ESTADOS_PROYECTO;
        if (vista === "administradas") return ESTADOS_ADMIN;
        if (vista === "propias") return ESTADOS_PROP;
        return [...ESTADOS_PROP, ...ESTADOS_ADMIN, ...ESTADOS_PROYECTO];
    }, [vista]);

    const tipoChips = useMemo(() => {
        if (vista === "proyectos") return TIPOS_PROYECTO;
        return TIPOS_PROP;
    }, [vista]);

    /* ── lista visible ── */
    const visibles = useMemo(() => {
        const matchEstado = (p) => filtroEstado === "todos" || p.estado === filtroEstado;
        const matchTipo   = (p) => filtroTipo   === "todos" || p.tipo   === filtroTipo;

        if (vista === "proyectos") {
            return proyectos
                .filter(p => matchEstado(p) && matchTipo(p))
                .map(p => ({ ...p, _tipo: "proyecto" }));
        }
        if (vista === "propias") {
            return propiedades
                .filter(p => !p.es_administrada && matchEstado(p) && matchTipo(p))
                .map(p => ({ ...p, _tipo: "propiedad" }));
        }
        if (vista === "administradas") {
            return propiedades
                .filter(p => p.es_administrada && matchEstado(p) && matchTipo(p))
                .map(p => ({ ...p, _tipo: "propiedad" }));
        }
        /* todos */
        const props = propiedades
            .filter(p => matchEstado(p) && (filtroTipo === "todos" || p.tipo === filtroTipo))
            .map(p => ({ ...p, _tipo: "propiedad" }));
        const provs = proyectos
            .filter(p => matchEstado(p) && (filtroTipo === "todos" || p.tipo === filtroTipo))
            .map(p => ({ ...p, _tipo: "proyecto" }));
        return [...props, ...provs];
    }, [propiedades, proyectos, vista, filtroEstado, filtroTipo]);

    /* ── mostrar chip de tipo solo cuando aplica ── */
    const mostrarTipos = vista !== "administradas";

    return (
        <Page>
            {/* ── Encabezado ── */}
            <Header>
                <HeaderInfo>
                    <PageTitle>
                        <Icon icon="solar:home-smile-bold-duotone" />
                        Gestión Inmobiliaria
                    </PageTitle>
                    <PageSub>Inmuebles propios, gestión administrativa y proyectos</PageSub>
                </HeaderInfo>
                <BtnNuevoInmueble onClick={abrirNuevo}>
                    <Icon icon="solar:add-circle-bold-duotone" />
                    Nuevo inmueble
                </BtnNuevoInmueble>
            </Header>

            {/* ── Stats cards ── */}
            <StatsRow>
                <StatCard $color="#f59e0b" onClick={() => cambiarVista("todos")} $active={vista === "todos"}>
                    <StatIcon $color="#f59e0b"><Icon icon="solar:widget-5-bold-duotone" /></StatIcon>
                    <StatNum>{totalCnt}</StatNum>
                    <StatLabel>Total registros</StatLabel>
                </StatCard>
                <StatCard $color="#4ade80" onClick={() => cambiarVista("propias")} $active={vista === "propias"}>
                    <StatIcon $color="#4ade80"><Icon icon="solar:home-2-bold-duotone" /></StatIcon>
                    <StatNum>{propiasCnt}</StatNum>
                    <StatLabel>Inmuebles propios</StatLabel>
                </StatCard>
                <StatCard $color="#a78bfa" onClick={() => cambiarVista("administradas")} $active={vista === "administradas"}>
                    <StatIcon $color="#a78bfa"><Icon icon="solar:clipboard-list-bold-duotone" /></StatIcon>
                    <StatNum>{admCnt}</StatNum>
                    <StatLabel>En gestión adm.</StatLabel>
                </StatCard>
                <StatCard $color="#f88533" onClick={() => cambiarVista("proyectos")} $active={vista === "proyectos"}>
                    <StatIcon $color="#f88533"><Icon icon="mdi:hard-hat" /></StatIcon>
                    <StatNum>{proyActivosCnt}<StatSub>/{proyectos.length}</StatSub></StatNum>
                    <StatLabel>Proyectos activos</StatLabel>
                </StatCard>
            </StatsRow>

            {/* ── Filtros ── */}
            <FiltrosWrap>
                {/* Vistas */}
                <ChipGroup>
                    {VISTAS.map(v => (
                        <Chip key={v.key} $active={vista === v.key} $color={v.color}
                            onClick={() => cambiarVista(v.key)}>
                            <Icon icon={v.icon} style={{ fontSize: 13, verticalAlign: "middle", marginRight: 4 }} />
                            {v.label}
                        </Chip>
                    ))}
                </ChipGroup>

                {/* Estados contextuales */}
                <ChipGroup>
                    <Chip $active={filtroEstado === "todos"} $color="#94a3b8"
                        onClick={() => setFiltroEstado("todos")}>Todos los estados</Chip>
                    {estadoChips.map(e => (
                        <Chip key={e.key} $active={filtroEstado === e.key} $color={e.color}
                            onClick={() => setFiltroEstado(e.key)}>{e.label}</Chip>
                    ))}
                </ChipGroup>

                {/* Tipos */}
                {mostrarTipos && (
                    <ChipGroup>
                        <Chip $active={filtroTipo === "todos"} $color="#94a3b8"
                            onClick={() => setFiltroTipo("todos")}>Todos los tipos</Chip>
                        {tipoChips.map(t => (
                            <Chip key={t.key} $active={filtroTipo === t.key} $color={t.color}
                                onClick={() => setFiltroTipo(t.key)}>{t.label}</Chip>
                        ))}
                    </ChipGroup>
                )}
            </FiltrosWrap>

            {/* ── Conteo visible ── */}
            <ResultadoRow>
                <ResultadoText>
                    {visibles.length} resultado{visibles.length !== 1 ? "s" : ""}
                    {vista !== "todos" && (
                        <span> — {VISTAS.find(v => v.key === vista)?.label}</span>
                    )}
                </ResultadoText>
            </ResultadoRow>

            {/* ── Grid ── */}
            {isLoading ? (
                <Vacio>Cargando...</Vacio>
            ) : visibles.length === 0 ? (
                <Vacio>
                    <Icon icon="solar:home-smile-bold-duotone"
                        style={{ fontSize: 52, color: "rgba(255,255,255,0.1)", display: "block", marginBottom: 12 }} />
                    {filtroEstado !== "todos" || filtroTipo !== "todos"
                        ? "Sin resultados con ese filtro"
                        : "Aún no hay registros en esta sección"}
                </Vacio>
            ) : (
                <Grid>
                    {visibles.map((item, i) =>
                        item._tipo === "proyecto"
                            ? <ProyectoCard key={"proy-" + item.id} item={item} idx={i} navigate={navigate} />
                            : <InmuebleCard key={"prop-" + item.id} item={item} idx={i}
                                onEditar={abrirEditar} onEliminar={confirmarEliminar} />
                    )}
                </Grid>
            )}

            {/* ── Modal nueva / editar propiedad ── */}
            {modal && (
                <Overlay onClick={cerrar}>
                    <Modal onClick={e => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitulo>
                                <Icon icon="solar:home-smile-bold-duotone" style={{ color: "#f59e0b" }} />
                                {editando ? "Editar inmueble" : "Nuevo inmueble"}
                            </ModalTitulo>
                            <BtnClose onClick={cerrar}><RiCloseLine /></BtnClose>
                        </ModalHeader>

                        <ModalBody>
                            {/* Gestión */}
                            <Label>Tipo de gestión</Label>
                            <GestionToggle>
                                <GestionOpt $active={!form.es_administrada} type="button"
                                    onClick={() => { set("es_administrada", false); set("estado", "disponible"); }}>
                                    <Icon icon="solar:home-smile-bold-duotone" />
                                    Propia
                                    <span>Inmueble de mi empresa</span>
                                </GestionOpt>
                                <GestionOpt $active={form.es_administrada} type="button"
                                    onClick={() => { set("es_administrada", true); set("estado", "activo"); }}>
                                    <Icon icon="solar:clipboard-list-bold-duotone" />
                                    Gestión Adm.
                                    <span>Inmueble de tercero</span>
                                </GestionOpt>
                            </GestionToggle>

                            {form.es_administrada && (
                                <>
                                    <Row2>
                                        <div>
                                            <Label>Nombre del propietario</Label>
                                            <Input value={form.propietario}
                                                onChange={e => set("propietario", e.target.value)}
                                                placeholder="Nombre completo" />
                                        </div>
                                        <div>
                                            <Label>Teléfono propietario</Label>
                                            <Input value={form.tel_propietario}
                                                onChange={e => set("tel_propietario", e.target.value)}
                                                placeholder="3001234567" />
                                        </div>
                                    </Row2>
                                    <div>
                                        <Label>% Comisión de administración</Label>
                                        <Input type="number" min={0} max={100} value={form.porcentaje_admin}
                                            onChange={e => set("porcentaje_admin", e.target.value)} placeholder="10" />
                                    </div>
                                </>
                            )}

                            <Label>Tipo de inmueble</Label>
                            <TiposGrid>
                                {TIPOS_PROP.map(t => (
                                    <TipoBtn key={t.key} $active={form.tipo === t.key} $color={t.color}
                                        onClick={() => set("tipo", t.key)}>
                                        <Icon icon={t.icon} />
                                        {t.label}
                                    </TipoBtn>
                                ))}
                            </TiposGrid>

                            <Label>Título / Nombre</Label>
                            <Input value={form.titulo} onChange={e => set("titulo", e.target.value)}
                                placeholder="Ej: Apartamento El Poblado 85m²" />

                            <Row2>
                                <div>
                                    <Label>Precio ($)</Label>
                                    <Input type="number" value={form.precio}
                                        onChange={e => set("precio", e.target.value)} placeholder="450000000" />
                                </div>
                                <div>
                                    <Label>Área (m²)</Label>
                                    <Input type="number" value={form.area_m2}
                                        onChange={e => set("area_m2", e.target.value)} placeholder="85" />
                                </div>
                            </Row2>

                            <Row4>
                                <div>
                                    <Label>Habitaciones</Label>
                                    <Input type="number" min={0} value={form.habitaciones}
                                        onChange={e => set("habitaciones", Number(e.target.value))} />
                                </div>
                                <div>
                                    <Label>Baños</Label>
                                    <Input type="number" min={0} value={form.banos}
                                        onChange={e => set("banos", Number(e.target.value))} />
                                </div>
                                <div>
                                    <Label>Garajes</Label>
                                    <Input type="number" min={0} value={form.garajes}
                                        onChange={e => set("garajes", Number(e.target.value))} />
                                </div>
                                <div>
                                    <Label>Estrato</Label>
                                    <Select value={form.estrato} onChange={e => set("estrato", Number(e.target.value))}>
                                        <option value={0}>—</option>
                                        {ESTRATOS.map(n => <option key={n} value={n}>{n}</option>)}
                                    </Select>
                                </div>
                            </Row4>

                            <Row2>
                                <div>
                                    <Label>Ciudad</Label>
                                    <Input value={form.ciudad} onChange={e => set("ciudad", e.target.value)}
                                        placeholder="Medellín" />
                                </div>
                                <div>
                                    <Label>Sector / Barrio</Label>
                                    <Input value={form.sector} onChange={e => set("sector", e.target.value)}
                                        placeholder="El Poblado" />
                                </div>
                            </Row2>

                            <Label>Dirección</Label>
                            <Input value={form.direccion} onChange={e => set("direccion", e.target.value)}
                                placeholder="Cra 43A # 1 Sur 100" />

                            <Label>Estado</Label>
                            <EstadosRow>
                                {(form.es_administrada ? ESTADOS_ADMIN : ESTADOS_PROP).map(e => (
                                    <EstadoBtn key={e.key} $active={form.estado === e.key} $color={e.color}
                                        onClick={() => set("estado", e.key)}>
                                        {e.label}
                                    </EstadoBtn>
                                ))}
                            </EstadosRow>

                            <Label>Descripción</Label>
                            <Textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
                                placeholder="Vista al mar, acabados de lujo, cocina integral..." rows={3} />
                        </ModalBody>

                        <ModalFooter>
                            <BtnCancelar onClick={cerrar}>Cancelar</BtnCancelar>
                            <BtnGuardar
                                disabled={!form.titulo || mutCrear.isPending || mutEditar.isPending}
                                onClick={() => editando ? mutEditar.mutate() : mutCrear.mutate()}>
                                {editando ? "Guardar cambios" : "Registrar inmueble"}
                            </BtnGuardar>
                        </ModalFooter>
                    </Modal>
                </Overlay>
            )}
        </Page>
    );
}

/* ── Tarjeta de inmueble ── */
function InmuebleCard({ item: p, idx, onEditar, onEliminar }) {
    const tipo = TIPOS_PROP.find(t => t.key === p.tipo) ?? TIPOS_PROP[0];
    const est  = TODOS_ESTADOS.find(e => e.key === p.estado) ?? ESTADOS_PROP[0];
    return (
        <CardWrap $color={tipo.color} $i={idx}>
            <CardTop>
                <TipoBadge $color={tipo.color}>
                    <Icon icon={tipo.icon} />
                    {tipo.label}
                </TipoBadge>
                <BadgeRow>
                    {p.es_administrada && (
                        <AdminBadge>
                            <Icon icon="solar:clipboard-list-bold-duotone" />Adm.
                        </AdminBadge>
                    )}
                    <EstadoBadge $color={est.color} $bg={est.bg}>{est.label}</EstadoBadge>
                </BadgeRow>
            </CardTop>

            <CardNombre>{p.titulo || "Sin título"}</CardNombre>

            {(p.sector || p.ciudad) && (
                <CardUbicacion>
                    <RiMapPinLine />
                    {[p.sector, p.ciudad].filter(Boolean).join(", ")}
                </CardUbicacion>
            )}

            <CardSpecs>
                {p.area_m2 > 0       && <Spec><Icon icon="solar:ruler-bold-duotone"   />{p.area_m2} m²</Spec>}
                {p.habitaciones > 0  && <Spec><Icon icon="solar:bed-bold-duotone"     />{p.habitaciones} hab</Spec>}
                {p.banos > 0         && <Spec><Icon icon="solar:bath-bold-duotone"    />{p.banos} baños</Spec>}
                {p.garajes > 0       && <Spec><Icon icon="solar:garage-bold-duotone"  />{p.garajes} garajes</Spec>}
                {p.estrato > 0       && <Spec><Icon icon="solar:star-bold-duotone"    />Estrato {p.estrato}</Spec>}
            </CardSpecs>

            {p.precio > 0 && <CardPrecio $color={tipo.color}>{formatCOP(p.precio)}</CardPrecio>}

            {p.es_administrada && p.propietario && (
                <PropietarioRow>
                    <Icon icon="solar:user-bold-duotone" />
                    {p.propietario}{p.tel_propietario ? ` · ${p.tel_propietario}` : ""}
                    {p.porcentaje_admin ? <ComisionTag>{p.porcentaje_admin}%</ComisionTag> : null}
                </PropietarioRow>
            )}

            {p.descripcion && <CardDesc>{p.descripcion}</CardDesc>}

            <CardActions>
                <BtnEditar onClick={() => onEditar(p)}>
                    <RiEditLine /> Editar
                </BtnEditar>
                <BtnEliminar onClick={() => onEliminar(p)}>
                    <RiDeleteBin2Line />
                </BtnEliminar>
            </CardActions>
        </CardWrap>
    );
}

/* ── Tarjeta de proyecto ── */
function ProyectoCard({ item: p, idx, navigate }) {
    const tipo = TIPOS_PROYECTO.find(t => t.key === p.tipo) ?? TIPOS_PROYECTO[0];
    const est  = ESTADOS_PROYECTO.find(e => e.key === p.estado) ?? ESTADOS_PROYECTO[0];
    return (
        <CardWrap $color={tipo.color} $i={idx}>
            <CardTop>
                <TipoBadge $color={tipo.color}>
                    <Icon icon={tipo.icon} />
                    {tipo.label}
                </TipoBadge>
                <EstadoBadge $color={est.color} $bg={est.bg}>{est.label}</EstadoBadge>
            </CardTop>

            <CardNombre>{p.nombre || "Sin nombre"}</CardNombre>

            {p.direccion && (
                <CardUbicacion>
                    <RiMapPinLine />
                    {p.direccion}
                </CardUbicacion>
            )}

            <CardSpecs>
                {p.es_propio
                    ? <Spec><Icon icon="solar:home-2-bold-duotone" />Obra propia</Spec>
                    : p.cliente_nombre
                        ? <Spec><Icon icon="solar:user-bold-duotone" />{p.cliente_nombre}</Spec>
                        : null
                }
                {p.cliente_telefono && (
                    <Spec><Icon icon="solar:phone-bold-duotone" />{p.cliente_telefono}</Spec>
                )}
            </CardSpecs>

            {p.presupuesto > 0 && (
                <CardPrecio $color={tipo.color}>{formatCOP(p.presupuesto)}</CardPrecio>
            )}

            {(p.fecha_inicio || p.fecha_fin_estimada) && (
                <FechasRow>
                    {p.fecha_inicio && <FechaBadge>Inicio: {p.fecha_inicio}</FechaBadge>}
                    {p.fecha_fin_estimada && <FechaBadge>Entrega: {p.fecha_fin_estimada}</FechaBadge>}
                </FechasRow>
            )}

            {p.descripcion && <CardDesc>{p.descripcion}</CardDesc>}

            <CardActions>
                <BtnEditar onClick={() => navigate(`/proyectos/${p.id}`)}>
                    <RiArrowRightLine /> Ver proyecto
                </BtnEditar>
            </CardActions>
        </CardWrap>
    );
}

/* ─── Animations ─── */
const fadeUp = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;
const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;

/* ─── Layout ─── */
const Page = styled.div`
    padding: 28px 24px 48px;
    max-width: 1280px;
    margin: 0 auto;
    @media(max-width:767px){ padding: 80px 14px 40px; }
`;

const Header = styled.div`
    display:flex;align-items:center;justify-content:space-between;gap:12px;
    margin-bottom:24px;flex-wrap:wrap;
`;
const HeaderInfo = styled.div`display:flex;flex-direction:column;gap:4px;`;
const PageTitle  = styled.h1`
    display:flex;align-items:center;gap:10px;font-size:22px;font-weight:900;color:#fff;margin:0;
    svg{font-size:26px;color:#f59e0b;}
`;
const PageSub = styled.p`font-size:13px;color:rgba(255,255,255,0.4);margin:0;`;

const BtnNuevoInmueble = styled.button`
    display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;
    background:linear-gradient(135deg,#f59e0b,#f88533);border:none;
    color:#fff;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap;
    font-family:"Poppins",sans-serif;transition:opacity .15s,transform .15s;
    svg{font-size:18px;}
    &:hover{opacity:.9;transform:translateY(-1px);}
`;

/* ─── Stats ─── */
const StatsRow = styled.div`
    display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;
    @media(max-width:700px){grid-template-columns:repeat(2,1fr);}
    @media(max-width:380px){grid-template-columns:1fr 1fr;}
`;
const StatCard = styled.div`
    padding:18px 16px;border-radius:18px;cursor:pointer;transition:all .2s;
    border:1px solid ${p => p.$active ? p.$color + "55" : "rgba(255,255,255,0.07)"};
    background:${p => p.$active ? p.$color + "14" : "rgba(255,255,255,0.03)"};
    display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;
    &:hover{border-color:${p => p.$color}44;background:${p => p.$color}10;}
`;
const StatIcon = styled.div`
    font-size:26px;color:${p => p.$color};margin-bottom:2px;
    display:flex;align-items:center;
`;
const StatNum  = styled.div`font-size:26px;font-weight:900;color:#fff;line-height:1;display:flex;align-items:baseline;gap:2px;`;
const StatSub  = styled.span`font-size:14px;color:rgba(255,255,255,0.35);font-weight:600;`;
const StatLabel= styled.div`font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);`;

/* ─── Filtros ─── */
const FiltrosWrap = styled.div`display:flex;flex-direction:column;gap:10px;margin-bottom:16px;`;
const ChipGroup   = styled.div`display:flex;flex-wrap:wrap;gap:8px;`;
const Chip = styled.button`
    display:flex;align-items:center;gap:4px;
    padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;
    font-family:"Poppins",sans-serif;border:1px solid;transition:all .15s;
    border-color:${({$active,$color})=>$active?$color:"rgba(255,255,255,0.1)"};
    background:${({$active,$color})=>$active?$color+"22":"rgba(255,255,255,0.04)"};
    color:${({$active,$color})=>$active?$color:"rgba(255,255,255,0.5)"};
    &:hover{border-color:${({$color})=>$color};color:${({$color})=>$color};}
`;

const ResultadoRow  = styled.div`display:flex;align-items:center;margin-bottom:14px;`;
const ResultadoText = styled.p`
    font-size:12px;font-weight:600;color:rgba(255,255,255,0.3);margin:0;
    span{color:rgba(255,255,255,0.5);}
`;

/* ─── Grid ─── */
const Grid = styled.div`
    display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px;
`;
const Vacio = styled.div`
    text-align:center;padding:60px 20px;color:rgba(255,255,255,0.3);font-size:14px;font-weight:600;
`;

/* ─── Card compartida ─── */
const CardWrap = styled.div`
    display:flex;flex-direction:column;gap:10px;padding:20px;
    border-radius:20px;border:1px solid rgba(255,255,255,0.07);
    background:rgba(255,255,255,0.04);backdrop-filter:blur(10px);
    animation:${fadeUp} .4s ${({$i})=>$i*.04}s ease both;
    transition:transform .2s,border-color .2s,box-shadow .2s;
    &:hover{
        transform:translateY(-3px);
        border-color:${({$color})=>$color}35;
        box-shadow:0 10px 32px ${({$color})=>$color}12;
    }
`;
const CardTop = styled.div`display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;`;
const BadgeRow= styled.div`display:flex;align-items:center;gap:6px;`;
const TipoBadge = styled.span`
    display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:10px;
    background:${({$color})=>$color}18;border:1px solid ${({$color})=>$color}30;
    color:${({$color})=>$color};font-size:11px;font-weight:700;
    svg{font-size:14px;}
`;
const EstadoBadge = styled.span`
    padding:4px 10px;border-radius:10px;
    background:${({$bg})=>$bg};color:${({$color})=>$color};font-size:11px;font-weight:700;
`;
const AdminBadge = styled.span`
    display:flex;align-items:center;gap:4px;padding:4px 8px;border-radius:8px;
    background:rgba(167,139,250,0.12);border:1px solid rgba(167,139,250,0.3);
    color:#a78bfa;font-size:10px;font-weight:700;svg{font-size:12px;}
`;
const CardNombre   = styled.h3`font-size:15px;font-weight:800;color:#fff;margin:0;line-height:1.3;`;
const CardUbicacion= styled.div`
    display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.4);font-weight:500;
    svg{font-size:14px;flex-shrink:0;}
`;
const CardSpecs = styled.div`display:flex;flex-wrap:wrap;gap:8px;`;
const Spec = styled.span`
    display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.55);
    svg{font-size:13px;color:rgba(255,255,255,0.3);}
`;
const CardPrecio = styled.div`font-size:18px;font-weight:900;color:${({$color})=>$color};margin-top:2px;`;
const CardDesc   = styled.p`
    font-size:12px;color:rgba(255,255,255,0.35);margin:0;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
`;
const CardActions = styled.div`display:flex;gap:8px;margin-top:4px;`;
const BtnEditar   = styled.button`
    flex:1;display:flex;align-items:center;justify-content:center;gap:6px;
    padding:9px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);
    background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.7);
    font-size:12px;font-weight:700;cursor:pointer;font-family:"Poppins",sans-serif;
    transition:all .15s;
    &:hover{background:rgba(96,165,250,0.12);border-color:rgba(96,165,250,0.3);color:#60a5fa;}
`;
const BtnEliminar = styled.button`
    display:flex;align-items:center;justify-content:center;
    width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);
    background:rgba(255,255,255,0.05);color:rgba(248,113,113,0.6);
    font-size:16px;cursor:pointer;transition:all .15s;
    &:hover{background:rgba(248,113,113,0.12);border-color:rgba(248,113,113,0.3);color:#f87171;}
`;
const PropietarioRow = styled.div`
    display:flex;align-items:center;gap:6px;font-size:12px;
    color:rgba(255,255,255,0.45);padding:8px 10px;border-radius:9px;
    background:rgba(167,139,250,0.07);border:1px solid rgba(167,139,250,0.15);
    svg{font-size:14px;color:#a78bfa;flex-shrink:0;}
`;
const ComisionTag  = styled.span`margin-left:auto;color:#a78bfa;font-weight:800;`;
const FechasRow    = styled.div`display:flex;gap:8px;flex-wrap:wrap;`;
const FechaBadge   = styled.span`
    font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);
    background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
    padding:3px 9px;border-radius:7px;
`;

/* ─── Modal ─── */
const Overlay = styled.div`
    position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);
    z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;
    animation:${fadeIn} .2s ease;
`;
const Modal = styled.div`
    background:#0d1b2a;border:1px solid rgba(255,255,255,0.1);border-radius:24px;
    width:100%;max-width:620px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;
`;
const ModalHeader = styled.div`
    display:flex;align-items:center;justify-content:space-between;
    padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;
`;
const ModalTitulo = styled.h2`
    display:flex;align-items:center;gap:10px;font-size:16px;font-weight:800;color:#fff;margin:0;
    svg{font-size:20px;}
`;
const BtnClose = styled.button`
    width:32px;height:32px;border-radius:8px;border:none;
    background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.6);
    font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;
    &:hover{background:rgba(248,113,113,0.12);color:#f87171;}
`;
const ModalBody = styled.div`
    padding:20px 24px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;flex:1;
    &::-webkit-scrollbar{width:4px;}
    &::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px;}
`;
const ModalFooter = styled.div`
    display:flex;gap:10px;padding:16px 24px;border-top:1px solid rgba(255,255,255,0.08);flex-shrink:0;
`;

const Label = styled.label`font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,0.4);`;
const inputBase = css`
    width:100%;padding:10px 14px;border-radius:10px;
    background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
    color:#fff;font-size:13px;font-family:"Poppins",sans-serif;
    outline:none;box-sizing:border-box;
    &:focus{border-color:#f59e0b60;}
    &::placeholder{color:rgba(255,255,255,0.25);}
`;
const Input    = styled.input`${inputBase}`;
const Select   = styled.select`${inputBase}option{background:#0d1b2a;}`;
const Textarea = styled.textarea`${inputBase}resize:vertical;min-height:72px;`;
const Row2     = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:12px;`;
const Row4     = styled.div`display:grid;grid-template-columns:repeat(4,1fr);gap:10px;@media(max-width:500px){grid-template-columns:1fr 1fr;}`;

const TiposGrid = styled.div`display:grid;grid-template-columns:repeat(3,1fr);gap:8px;@media(max-width:440px){grid-template-columns:repeat(2,1fr);}`;
const TipoBtn   = styled.button`
    display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 6px;
    border-radius:12px;border:1px solid;cursor:pointer;font-family:"Poppins",sans-serif;
    font-size:11px;font-weight:700;transition:all .15s;
    border-color:${({$active,$color})=>$active?$color:"rgba(255,255,255,0.08)"};
    background:${({$active,$color})=>$active?$color+"20":"rgba(255,255,255,0.03)"};
    color:${({$active,$color})=>$active?$color:"rgba(255,255,255,0.45)"};
    svg{font-size:20px;}
`;
const EstadosRow = styled.div`display:flex;gap:8px;flex-wrap:wrap;`;
const EstadoBtn  = styled.button`
    padding:7px 16px;border-radius:10px;border:1px solid;cursor:pointer;
    font-family:"Poppins",sans-serif;font-size:12px;font-weight:700;transition:all .15s;
    border-color:${({$active,$color})=>$active?$color:"rgba(255,255,255,0.08)"};
    background:${({$active,$color})=>$active?$color+"20":"rgba(255,255,255,0.03)"};
    color:${({$active,$color})=>$active?$color:"rgba(255,255,255,0.45)"};
`;
const GestionToggle = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:8px;`;
const GestionOpt    = styled.button`
    display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;
    border-radius:12px;cursor:pointer;font-family:"Poppins",sans-serif;font-size:13px;font-weight:700;
    border:1px solid ${p=>p.$active?"#a78bfa":"rgba(255,255,255,0.08)"};
    background:${p=>p.$active?"rgba(167,139,250,0.12)":"rgba(255,255,255,0.03)"};
    color:${p=>p.$active?"#a78bfa":"rgba(255,255,255,0.4)"};
    transition:.2s;svg{font-size:20px;}span{font-size:10px;font-weight:400;opacity:.7;}
`;
const BtnCancelar = styled.button`
    flex:1;padding:11px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);
    background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.6);
    font-size:13px;font-weight:700;cursor:pointer;font-family:"Poppins",sans-serif;
    &:hover{background:rgba(255,255,255,0.08);}
`;
const BtnGuardar = styled.button`
    flex:2;padding:11px;border-radius:12px;border:none;
    background:linear-gradient(135deg,#f59e0b,#f88533);
    color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:"Poppins",sans-serif;
    transition:opacity .15s;&:disabled{opacity:.5;cursor:not-allowed;}&:hover:not(:disabled){opacity:.9;}
`;
