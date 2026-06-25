import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MostrarSuscripciones, InsertarSuscripcion, EditarSuscripcion, EliminarSuscripcion, RegistrarPago } from "../../supabase/crudSuscripciones";
import { MostrarConfigPlanes } from "../../supabase/crudConfigPlanes";
import { RiEditLine, RiDeleteBin2Line, RiAddLine, RiCloseLine } from "react-icons/ri";
import { Icon } from "@iconify/react";
import { toastExito, confirmar } from "../../utils/toast";

const formatCOP = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);

const ESTADOS = {
    al_dia:     { label: "Al día",     color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
    mora:       { label: "En mora",    color: "#f87171", bg: "rgba(248,113,113,0.12)" },
    suspendido: { label: "Suspendido", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    cancelado:  { label: "Cancelado",  color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
};

const PLANES = [
    { key: "mensual",    label: "Mensual",    meses: 1 },
    { key: "bimestral",  label: "Bimestral",  meses: 2 },
    { key: "trimestral", label: "Trimestral", meses: 3 },
];

const ACTIVIDADES = [
    { key: "retail_ropa",    label: "Retail — Ropa y accesorios" },
    { key: "restaurante",    label: "Restaurante" },
    { key: "cafeteria",      label: "Cafetería" },
    { key: "tienda",         label: "Tienda / Minimarket" },
    { key: "farmacia",       label: "Farmacia / Droguería" },
    { key: "ferreteria",     label: "Ferretería" },
    { key: "salon_belleza",  label: "Salón de belleza" },
    { key: "veterinaria",    label: "Veterinaria" },
];

export function SaasTemplate() {
    const queryClient = useQueryClient();
    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState(null);

    const [form, setForm] = useState({
        nombre_cliente: "", plan: "basico", valor_mensual: "",
        costo_implementacion: "", estado: "al_dia", fecha_proximo_pago: "", notas: "",
        actividad_economica: "retail_ropa",
    });

    const { data: suscripciones = [], isFetching } = useQuery({
        queryKey: ["suscripciones"],
        queryFn: MostrarSuscripciones,
    });

    const { data: preciosPlanes = [] } = useQuery({
        queryKey: ["config-planes"],
        queryFn: MostrarConfigPlanes,
    });

    function onCambioPlan(plan) {
        const precio = preciosPlanes.find(p => p.plan === plan)?.precio ?? 0;
        setForm(f => ({ ...f, plan, valor_mensual: String(precio) }));
    }

    const invalidar = () => queryClient.invalidateQueries({ queryKey: ["suscripciones"] });

    function estadoAuto(s) {
        if (s.estado === "suspendido" || s.estado === "cancelado") return s.estado;
        if (!s.fecha_proximo_pago) return "al_dia";
        return new Date(s.fecha_proximo_pago) < new Date() ? "mora" : "al_dia";
    }

    const mutPago = useMutation({
        mutationFn: (s) => RegistrarPago({
            id_suscripcion: s.id,
            monto: Number(s.valor_mensual) || 0,
            metodo: "transferencia",
            notas: "",
            plan: s.plan,
        }),
        onSuccess: () => { toastExito("Pago registrado — fecha actualizada"); invalidar(); },
    });

    const mutCrear = useMutation({
        mutationFn: () => {
            const planObj = PLANES.find(p => p.key === form.plan) ?? PLANES[0];
            const hoy = new Date();
            const proximoPago = new Date(hoy.getFullYear(), hoy.getMonth() + planObj.meses, hoy.getDate());
            return InsertarSuscripcion({
                nombre_cliente: form.nombre_cliente,
                plan: form.plan,
                valor_mensual: Number(form.valor_mensual) || 0,
                costo_implementacion: Number(form.costo_implementacion) || 0,
                estado: "al_dia",
                fecha_proximo_pago: proximoPago.toISOString().split("T")[0],
                notas: form.notas,
                actividad_economica: form.actividad_economica,
            });
        },
        onSuccess: () => { toastExito("Cliente agregado"); invalidar(); cerrar(); },
    });

    const mutEditar = useMutation({
        mutationFn: () => EditarSuscripcion({
            id: editando.id,
            nombre_cliente: form.nombre_cliente,
            plan: form.plan,
            valor_mensual: Number(form.valor_mensual) || 0,
            costo_implementacion: Number(form.costo_implementacion) || 0,
            estado: form.estado,
            fecha_proximo_pago: form.fecha_proximo_pago || null,
            notas: form.notas,
            actividad_economica: form.actividad_economica,
        }),
        onSuccess: () => { toastExito("Cliente actualizado"); invalidar(); cerrar(); },
    });

    const mutEliminar = useMutation({
        mutationFn: (id) => EliminarSuscripcion({ id }),
        onSuccess: () => { toastExito("Cliente eliminado"); invalidar(); },
    });

    function abrirNuevo() {
        const precioDefault = preciosPlanes.find(p => p.plan === "mensual")?.precio ?? 0;
        setForm({ nombre_cliente: "", plan: "mensual", valor_mensual: String(precioDefault), costo_implementacion: "", estado: "al_dia", fecha_proximo_pago: "", notas: "", actividad_economica: "retail_ropa" });
        setEditando(null);
        setModal(true);
    }

    function abrirEditar(s) {
        setForm({
            nombre_cliente: s.nombre_cliente ?? "",
            plan: s.plan ?? "basico",
            valor_mensual: String(s.valor_mensual ?? ""),
            costo_implementacion: String(s.costo_implementacion ?? ""),
            estado: s.estado ?? "al_dia",
            fecha_proximo_pago: s.fecha_proximo_pago ?? "",
            notas: s.notas ?? "",
            actividad_economica: s.actividad_economica ?? "retail_ropa",
        });
        setEditando(s);
        setModal(true);
    }

    function cerrar() { setModal(false); setEditando(null); }

    function handleGuardar(e) {
        e.preventDefault();
        editando ? mutEditar.mutate() : mutCrear.mutate();
    }

    // Stats
    const totalMensual = suscripciones.reduce((s, c) => s + (Number(c.valor_mensual) || 0), 0);
    const totalImplementacion = suscripciones.reduce((s, c) => s + (Number(c.costo_implementacion) || 0), 0);
    const alDia = suscripciones.filter(c => estadoAuto(c) === "al_dia").length;
    const enMora = suscripciones.filter(c => estadoAuto(c) === "mora").length;

    return (
        <Page>
            <TopBar>
                <div>
                    <h1>Panel SaaS</h1>
                    <p>gestiona tus clientes y suscripciones</p>
                </div>
                <BtnNuevo onClick={abrirNuevo}>
                    <RiAddLine style={{ fontSize: 18 }} /> Nuevo cliente
                </BtnNuevo>
            </TopBar>

            {/* Stats */}
            <StatsRow>
                <StatCard>
                    <Icon icon="solar:users-group-rounded-bold-duotone" style={{ fontSize: 28, color: "#60a5fa" }} />
                    <StatInfo>
                        <StatLabel>Clientes activos</StatLabel>
                        <StatVal>{suscripciones.length}</StatVal>
                    </StatInfo>
                </StatCard>
                <StatCard>
                    <Icon icon="solar:wallet-money-bold-duotone" style={{ fontSize: 28, color: "#4ade80" }} />
                    <StatInfo>
                        <StatLabel>Ingreso mensual</StatLabel>
                        <StatVal $green>{formatCOP(totalMensual)}</StatVal>
                    </StatInfo>
                </StatCard>
                <StatCard>
                    <Icon icon="solar:hand-money-bold-duotone" style={{ fontSize: 28, color: "#f59e0b" }} />
                    <StatInfo>
                        <StatLabel>Implementaciones</StatLabel>
                        <StatVal>{formatCOP(totalImplementacion)}</StatVal>
                    </StatInfo>
                </StatCard>
                <StatCard>
                    <Icon icon="solar:shield-check-bold-duotone" style={{ fontSize: 28, color: enMora > 0 ? "#f87171" : "#4ade80" }} />
                    <StatInfo>
                        <StatLabel>Estado general</StatLabel>
                        <StatVal>{alDia} al día · {enMora > 0 ? <span style={{ color: "#f87171" }}>{enMora} en mora</span> : "0 en mora"}</StatVal>
                    </StatInfo>
                </StatCard>
            </StatsRow>

            {/* Lista de clientes */}
            <Grid>
                {isFetching ? (
                    <Vacio>Cargando clientes...</Vacio>
                ) : suscripciones.length === 0 ? (
                    <Vacio>No hay clientes registrados. Agrega el primero.</Vacio>
                ) : suscripciones.map((s, i) => {
                    const estadoCalc = estadoAuto(s);
                    const est = ESTADOS[estadoCalc] ?? ESTADOS.al_dia;
                    const diasRestantes = s.fecha_proximo_pago
                        ? Math.ceil((new Date(s.fecha_proximo_pago) - new Date()) / 86400000)
                        : null;
                    return (
                        <ClienteCard key={s.id} $i={i}>
                            <CardTop>
                                <ClienteNombre>{s.nombre_cliente || "Sin nombre"}</ClienteNombre>
                                <EstadoBadge $color={est.color} $bg={est.bg}>{est.label}</EstadoBadge>
                            </CardTop>

                            <CardBody>
                                <InfoFila>
                                    <InfoLabel>Actividad</InfoLabel>
                                    <InfoVal>{ACTIVIDADES.find(a => a.key === s.actividad_economica)?.label ?? s.actividad_economica}</InfoVal>
                                </InfoFila>
                                <InfoFila>
                                    <InfoLabel>Plan</InfoLabel>
                                    <InfoVal>{PLANES.find(p => p.key === s.plan)?.label ?? s.plan}</InfoVal>
                                </InfoFila>
                                <InfoFila>
                                    <InfoLabel>Mensualidad</InfoLabel>
                                    <InfoVal $green>{formatCOP(s.valor_mensual)}</InfoVal>
                                </InfoFila>
                                <InfoFila>
                                    <InfoLabel>Implementación</InfoLabel>
                                    <InfoVal>{formatCOP(s.costo_implementacion)}</InfoVal>
                                </InfoFila>
                                {s.fecha_proximo_pago && (
                                    <InfoFila>
                                        <InfoLabel>Próximo pago</InfoLabel>
                                        <InfoVal $warn={diasRestantes !== null && diasRestantes <= 5}>
                                            {new Date(s.fecha_proximo_pago).toLocaleDateString("es-CO")}
                                            {diasRestantes !== null && (
                                                <DiasBadge $urgente={diasRestantes <= 5}>
                                                    {diasRestantes <= 0 ? "¡Vencido!" : `${diasRestantes} días`}
                                                </DiasBadge>
                                            )}
                                        </InfoVal>
                                    </InfoFila>
                                )}
                                {s.notas && <Notas>{s.notas}</Notas>}
                            </CardBody>

                            <CardActions>
                                {estadoCalc === "mora" && (
                                    <BtnPago onClick={() => confirmar({
                                        titulo: "¿Registrar pago?",
                                        texto: `Se registrará pago de ${formatCOP(s.valor_mensual)} y se actualizará la fecha del próximo corte.`,
                                        onConfirmar: () => mutPago.mutate(s),
                                    })}>
                                        <Icon icon="solar:hand-money-bold-duotone" style={{ fontSize: 16 }} /> Registrar pago
                                    </BtnPago>
                                )}
                                <BtnIco onClick={() => abrirEditar(s)}><RiEditLine /></BtnIco>
                                <BtnIco $rojo onClick={() => confirmar({
                                    titulo: "¿Eliminar cliente?",
                                    texto: `Se eliminará "${s.nombre_cliente}".`,
                                    onConfirmar: () => mutEliminar.mutate(s.id),
                                })}><RiDeleteBin2Line /></BtnIco>
                            </CardActions>
                        </ClienteCard>
                    );
                })}
            </Grid>

            {/* Modal */}
            {modal && (
                <Overlay onClick={cerrar}>
                    <Modal onClick={e => e.stopPropagation()}>
                        <ModalHeader>
                            <span>{editando ? "Editar cliente" : "Nuevo cliente"}</span>
                            <BtnCerrar onClick={cerrar}><RiCloseLine /></BtnCerrar>
                        </ModalHeader>
                        <ModalForm onSubmit={handleGuardar}>
                            <Campo>
                                <label>Nombre del cliente</label>
                                <Input value={form.nombre_cliente} onChange={e => setForm({ ...form, nombre_cliente: e.target.value })} placeholder="Nombre y apellido" required />
                            </Campo>
                            <FilaDos>
                                <Campo>
                                    <label>Actividad económica</label>
                                    <Select value={form.actividad_economica} onChange={e => setForm({ ...form, actividad_economica: e.target.value })}>
                                        {ACTIVIDADES.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
                                    </Select>
                                </Campo>
                                <Campo>
                                    <label>Plan de pago</label>
                                    <Select value={form.plan} onChange={e => onCambioPlan(e.target.value)}>
                                        {PLANES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                    </Select>
                                </Campo>
                            </FilaDos>
                            <FilaDos>
                                <Campo>
                                    <label>Valor mensual</label>
                                    <InputReadonly>{formatCOP(Number(form.valor_mensual) || 0)}</InputReadonly>
                                </Campo>
                                <Campo>
                                    <label>Costo implementación</label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        value={form.costo_implementacion ? formatCOP(Number(form.costo_implementacion)) : ""}
                                        onChange={e => setForm({ ...form, costo_implementacion: e.target.value.replace(/\D/g, "") })}
                                        placeholder="$ 0"
                                    />
                                </Campo>
                            </FilaDos>
                            {editando && (
                                <Campo>
                                    <label>Fecha próximo pago</label>
                                    <Input type="date" value={form.fecha_proximo_pago} onChange={e => setForm({ ...form, fecha_proximo_pago: e.target.value })} />
                                </Campo>
                            )}
                            <Campo>
                                <label>Notas</label>
                                <Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones del cliente..." rows={3} />
                            </Campo>
                            <BtnGuardar type="submit" disabled={mutCrear.isPending || mutEditar.isPending}>
                                {editando ? "Guardar cambios" : "Agregar cliente"}
                            </BtnGuardar>
                        </ModalForm>
                    </Modal>
                </Overlay>
            )}
        </Page>
    );
}

/* ── Animations ── */
const fadeUp = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;

/* ── Page ── */
const Page = styled.div`
    min-height: 100vh; background: ${({ theme }) => theme.bgtotal};
    padding: 28px; animation: ${fadeUp} 0.3s ease;
    @media (max-width: 767px) { padding: 68px 12px 20px; }
`;

const TopBar = styled.div`
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
    h1 { font-size: 22px; font-weight: 900; color: ${({ theme }) => theme.text}; margin: 0 0 4px; }
    p  { font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard}; margin: 0; }
`;

const BtnNuevo = styled.button`
    display: flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 10px; border: none;
    background: #f88533; color: #fff;
    font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif;
    &:hover { background: #e07020; }
`;

/* ── Stats ── */
const StatsRow = styled.div`
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px;
    @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const StatCard = styled.div`
    display: flex; align-items: center; gap: 14px;
    padding: 18px 20px;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
`;

const StatInfo = styled.div`display: flex; flex-direction: column; gap: 2px;`;
const StatLabel = styled.span`font-size: 11px; font-weight: 600; color: ${({ theme }) => theme.colorsubtitlecard};`;
const StatVal = styled.span`font-size: 18px; font-weight: 900; color: ${({ $green, theme }) => $green ? "#4ade80" : theme.text};`;

/* ── Grid ── */
const Grid = styled.div`
    display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px;
`;

const Vacio = styled.div`
    grid-column: 1/-1; text-align: center; padding: 48px;
    font-size: 14px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const ClienteCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 16px; padding: 20px;
    animation: ${fadeUp} 0.35s ease both;
    animation-delay: ${({ $i }) => $i * 0.05}s;
    transition: box-shadow 0.2s;
    &:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.12); }
    display: flex; flex-direction: column; gap: 14px;
`;

const CardTop = styled.div`
    display: flex; align-items: center; justify-content: space-between;
`;

const ClienteNombre = styled.h3`
    font-size: 16px; font-weight: 900; color: ${({ theme }) => theme.text}; margin: 0;
`;

const EstadoBadge = styled.span`
    padding: 4px 12px; border-radius: 20px;
    font-size: 11px; font-weight: 800;
    color: ${({ $color }) => $color};
    background: ${({ $bg }) => $bg};
`;

const CardBody = styled.div`display: flex; flex-direction: column; gap: 8px;`;

const InfoFila = styled.div`
    display: flex; justify-content: space-between; align-items: center;
    font-size: 13px;
`;

const InfoLabel = styled.span`color: ${({ theme }) => theme.colorsubtitlecard}; font-weight: 600;`;
const InfoVal = styled.span`
    font-weight: 700;
    color: ${({ $green, $warn, theme }) => $green ? "#4ade80" : $warn ? "#f59e0b" : theme.text};
    display: flex; align-items: center; gap: 6px;
`;

const DiasBadge = styled.span`
    font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 10px;
    background: ${({ $urgente }) => $urgente ? "rgba(248,113,113,0.15)" : "rgba(148,163,184,0.1)"};
    color: ${({ $urgente }) => $urgente ? "#f87171" : "#94a3b8"};
`;

const Notas = styled.div`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
    font-style: italic; line-height: 1.4;
    padding-top: 4px; border-top: 1px solid ${({ theme }) => theme.color2};
`;

const CardActions = styled.div`
    display: flex; gap: 6px; justify-content: flex-end;
    border-top: 1px solid ${({ theme }) => theme.color2}; padding-top: 10px;
`;

const BtnPago = styled.button`
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 8px; border: none;
    background: rgba(74,222,128,0.15); color: #4ade80;
    font-size: 11px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif;
    &:hover { background: rgba(74,222,128,0.25); }
`;

const BtnIco = styled.button`
    background: none; border: none; cursor: pointer; font-size: 16px; padding: 5px;
    border-radius: 6px; display: flex; align-items: center;
    color: ${({ $rojo, theme }) => $rojo ? "#f87171" : theme.colorsubtitlecard};
    &:hover { background: rgba(255,255,255,0.08); }
`;

/* ── Modal ── */
const Overlay = styled.div`
    position: fixed; inset: 0; background: rgba(0,0,0,0.55);
    display: flex; align-items: center; justify-content: center; z-index: 300;
`;

const Modal = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 20px; padding: 24px; width: 480px; max-width: 92vw;
    box-shadow: 0 16px 48px rgba(0,0,0,0.35); max-height: 90vh; overflow-y: auto;
`;

const ModalHeader = styled.div`
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
    span { font-size: 16px; font-weight: 900; color: ${({ theme }) => theme.text}; }
`;

const BtnCerrar = styled.button`
    background: none; border: none; cursor: pointer; font-size: 20px;
    color: ${({ theme }) => theme.text}; display: flex; align-items: center;
`;

const ModalForm = styled.form`display: flex; flex-direction: column; gap: 14px;`;
const FilaDos = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 12px;`;

const Campo = styled.div`
    display: flex; flex-direction: column; gap: 5px;
    label { font-size: 11px; font-weight: 700; color: ${({ theme }) => theme.colorsubtitlecard}; text-transform: uppercase; }
`;

const Input = styled.input`
    padding: 10px 14px; border-radius: 10px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none;
    &:focus { border-color: #f88533; }
`;

const Select = styled.select`
    padding: 10px 14px; border-radius: 10px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none; text-transform: capitalize;
    &:focus { border-color: #f88533; }
`;

const Textarea = styled.textarea`
    padding: 10px 14px; border-radius: 10px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none; resize: vertical;
    &:focus { border-color: #f88533; }
`;

const InputReadonly = styled.div`
    padding: 10px 14px; border-radius: 10px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: #4ade80;
    font-size: 14px; font-weight: 800; font-family: "Poppins", sans-serif;
    opacity: 0.85;
`;

const BtnGuardar = styled.button`
    padding: 12px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #f88533, #f56a00);
    color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif;
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
