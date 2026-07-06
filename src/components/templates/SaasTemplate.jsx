import { useState, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { MostrarSuscripciones, InsertarSuscripcion, EditarSuscripcion, EliminarSuscripcion, RegistrarPago, MostrarPagosCliente, EximirPago, ReactivarCuenta } from "../../supabase/crudSuscripciones";
import { MostrarConfigPlanes } from "../../supabase/crudConfigPlanes";
import { RiEditLine, RiDeleteBin2Line, RiAddLine, RiCloseLine, RiShieldLine, RiPercentLine, RiRefreshLine, RiShieldCheckLine, RiArrowDownSLine, RiWhatsappLine } from "react-icons/ri";
import { Icon } from "@iconify/react";
import { toastExito, confirmar } from "../../utils/toast";
import ConfettiExplosion from "react-confetti-explosion";

const formatCOP = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);

const ESTADOS = {
    al_dia:     { label: "Al día",            color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
    proximo:    { label: "Próximo a vencer",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    mora:       { label: "En mora",            color: "#f87171", bg: "rgba(248,113,113,0.12)" },
    suspendido: { label: "Suspendido",         color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
    cancelado:  { label: "Cancelado",          color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
};

const PLANES = [
    { key: "mensual",    label: "Mensual",    meses: 1 },
    { key: "bimestral",  label: "Bimestral",  meses: 2 },
    { key: "trimestral", label: "Trimestral", meses: 3 },
];

const TIPOS_PLAN = [
    { key: "chispa", label: "⚡ Chispa — 1 almacén, 2 usuarios" },
    { key: "fuego",  label: "🔥 Fuego  — 3 almacenes, 10 usuarios" },
    { key: "cosmos", label: "🌌 Cosmos — Ilimitado" },
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
    { key: "construccion",       label: "Construcción / Inmobiliaria" },
    { key: "suscripciones_tv",   label: "Suscripciones" },
];

export function SaasTemplate() {
    const queryClient = useQueryClient();
    const location = useLocation();
    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState(null);
    const [historialId, setHistorialId] = useState(null);
    const [confeti, setConfeti] = useState(false);
    const [dropActividad, setDropActividad] = useState(false);
    const dropActividadRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (dropActividadRef.current && !dropActividadRef.current.contains(e.target))
                setDropActividad(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const { data: pagosHistorial = [] } = useQuery({
        queryKey: ["pagos-historial", historialId],
        queryFn: () => MostrarPagosCliente({ id_suscripcion: historialId }),
        enabled: !!historialId,
    });

    const [form, setForm] = useState({
        nombre_cliente: "", apellido_cliente: "", cedula_cliente: "",
        plan: "mensual", tipo_plan: "chispa", valor_mensual: "",
        estado: "al_dia", fecha_proximo_pago: "", notas: "",
        actividad_economica: "retail_ropa",
        gracia_hasta: "", descuento_pct: 0,
    });

    const { data: suscripciones = [], isFetching } = useQuery({
        queryKey: ["suscripciones"],
        queryFn: MostrarSuscripciones,
    });

    const { data: preciosPlanes = [] } = useQuery({
        queryKey: ["config-planes"],
        queryFn: MostrarConfigPlanes,
    });

    const invalidar = () => queryClient.invalidateQueries({ queryKey: ["suscripciones"] });

    useEffect(() => {
        const p = location.state?.prospecto;
        if (!p) return;
        setForm({
            nombre_cliente: p.nombre ?? "",
            apellido_cliente: p.apellido ?? "",
            cedula_cliente: "",
            telefono: p.telefono ?? "",
            plan: p.plan_elegido ?? "mensual",
            tipo_plan: "chispa",
            valor_mensual: String(preciosPlanes.find(x => x.tier === "chispa")?.precio_base ?? ""),
            estado: "al_dia",
            fecha_proximo_pago: "",
            notas: p.notas ?? "",
            actividad_economica: p.actividad_economica ?? "retail_ropa",
            gracia_hasta: "",
            descuento_pct: 0,
        });
        setEditando(null);
        setModal(true);
        window.history.replaceState({}, "");
    }, [location.state?.prospecto]);

    function estadoAuto(s) {
        if (s.estado === "suspendido" || s.estado === "cancelado") return s.estado;
        if (!s.fecha_proximo_pago) return "al_dia";
        const dias = Math.ceil((new Date(s.fecha_proximo_pago) - new Date()) / 86400000);
        if (dias <= 0) return "mora";
        if (dias <= 5) return "proximo";
        return "al_dia";
    }

    const mutPago = useMutation({
        mutationFn: (s) => RegistrarPago({
            id_suscripcion: s.id,
            monto: Number(s.valor_mensual) || 0,
            metodo: s.metodo_pago ?? "efectivo",
            notas: "",
            plan: s.plan,
        }),
        onSuccess: () => {
            toastExito("Pago registrado — fecha actualizada");
            invalidar();
            queryClient.invalidateQueries({ queryKey: ["pagos-historial"] });
            setConfeti(true);
            setTimeout(() => setConfeti(false), 3000);
        },
    });

    const mutCrear = useMutation({
        mutationFn: () => {
            const planObj = PLANES.find(p => p.key === form.plan) ?? PLANES[0];
            const hoy = new Date();
            const proximoPago = new Date(hoy.getFullYear(), hoy.getMonth() + planObj.meses, hoy.getDate());
            return InsertarSuscripcion({
                nombre_cliente: form.nombre_cliente,
                apellido_cliente: form.apellido_cliente,
                cedula_cliente: form.cedula_cliente,
                telefono: form.telefono,
                plan: form.plan,
                tipo_plan: form.tipo_plan,
                valor_mensual: Number(form.valor_mensual) || 0,
                costo_implementacion: 0,
                fecha_proximo_pago: proximoPago.toISOString().split("T")[0],
                notas: form.notas,
                actividad_economica: form.actividad_economica,
            });
        },
        onSuccess: (result) => {
            toastExito(`Cliente creado — Usuario: ${result.usuario} / Contraseña: ${result.password}`);
            invalidar();
            cerrar();
        },
    });

    const mutEditar = useMutation({
        mutationFn: () => {
            const base = Number(editando.valor_mensual) || 0;
            const pct  = Number(form.descuento_pct) || 0;
            const valorFinal = pct > 0 ? Math.round(base * (1 - pct / 100)) : (Number(form.valor_mensual) || 0);
            return EditarSuscripcion({
                id: editando.id,
                nombre_cliente: form.nombre_cliente,
                plan: form.plan,
                tipo_plan: form.tipo_plan,
                valor_mensual: valorFinal,
                estado: form.estado,
                fecha_proximo_pago: form.fecha_proximo_pago || null,
                notas: form.notas,
                actividad_economica: form.actividad_economica,
                descuento_pct: pct,
            });
        },
        onSuccess: () => { toastExito("Cliente actualizado"); invalidar(); cerrar(); },
    });

    const mutEliminar = useMutation({
        mutationFn: (id) => EliminarSuscripcion({ id }),
        onSuccess: () => { toastExito("Cliente eliminado"); invalidar(); },
    });

    const mutEximir = useMutation({
        mutationFn: (s) => EximirPago({ id: s.id, plan: s.plan }),
        onSuccess: () => { toastExito("Pago eximido — cuenta al día"); invalidar(); },
    });

    const mutReactivar = useMutation({
        mutationFn: (s) => ReactivarCuenta({ id: s.id, plan: s.plan }),
        onSuccess: () => { toastExito("Cuenta reactivada correctamente"); invalidar(); },
    });

    function getPrecioTier(tier) {
        return String(preciosPlanes.find(p => p.tier === tier)?.precio_base ?? 0);
    }

    function abrirNuevo() {
        setForm({ nombre_cliente: "", apellido_cliente: "", cedula_cliente: "", telefono: "", plan: "mensual", tipo_plan: "chispa", valor_mensual: getPrecioTier("chispa"), estado: "al_dia", fecha_proximo_pago: "", notas: "", actividad_economica: "retail_ropa", gracia_hasta: "", descuento_pct: 0 });
        setEditando(null);
        setModal(true);
    }

    function abrirEditar(s) {
        setForm({
            nombre_cliente: s.nombre_cliente ?? "",
            apellido_cliente: s.apellido_cliente ?? "",
            cedula_cliente: s.cedula_cliente ?? "",
            telefono: s.telefono ?? "",
            plan: s.plan ?? "mensual",
            tipo_plan: s.tipo_plan ?? "chispa",
            valor_mensual: String(s.valor_mensual ?? ""),
            estado: s.estado ?? "al_dia",
            fecha_proximo_pago: s.fecha_proximo_pago ?? "",
            notas: s.notas ?? "",
            actividad_economica: s.actividad_economica ?? "retail_ropa",
            gracia_hasta: s.gracia_hasta ?? "",
            descuento_pct: s.descuento_pct ?? 0,
        });
        setEditando(s);
        setModal(true);
    }

    function cerrar() { setModal(false); setEditando(null); }

    function handleGuardar(e) {
        e.preventDefault();
        editando ? mutEditar.mutate() : mutCrear.mutate();
    }

    function waRecordatorio(s, diasRestantes) {
        const tel = s.telefono?.replace(/\D/g, "");
        if (!tel) return null;
        const fecha = s.fecha_proximo_pago
            ? new Date(s.fecha_proximo_pago).toLocaleDateString("es-CO", { day: "2-digit", month: "long" })
            : "";
        const msg = diasRestantes <= 0
            ? `Hola ${s.nombre_cliente}, tu suscripción al *POS DL* venció el ${fecha}. Para renovarla y seguir usando el sistema, contáctanos. 🙌`
            : `Hola ${s.nombre_cliente}, te recordamos que tu suscripción al *POS DL* vence el ${fecha} (en ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}). Si tienes dudas, escríbenos. ✅`;
        return `https://wa.me/57${tel}?text=${encodeURIComponent(msg)}`;
    }

    // Stats
    const totalMensual = suscripciones.reduce((s, c) => s + (Number(c.valor_mensual) || 0), 0);
    const alDia = suscripciones.filter(c => estadoAuto(c) === "al_dia").length;
    const proximos = suscripciones.filter(c => estadoAuto(c) === "proximo").length;
    const enMora = suscripciones.filter(c => estadoAuto(c) === "mora").length;

    return (
        <Page>
            {confeti && <ConfettiExplosion force={0.6} duration={3000} particleCount={100} />}
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
                    <Icon icon="solar:graph-up-bold-duotone" style={{ fontSize: 28, color: "#f59e0b" }} />
                    <StatInfo>
                        <StatLabel>Planes activos</StatLabel>
                        <StatVal>{suscripciones.filter(s => estadoAuto(s) !== "cancelado").length}</StatVal>
                    </StatInfo>
                </StatCard>
                <StatCard>
                    <Icon icon="solar:shield-check-bold-duotone" style={{ fontSize: 28, color: enMora > 0 ? "#f87171" : "#4ade80" }} />
                    <StatInfo>
                        <StatLabel>Estado general</StatLabel>
                        <StatVal>
                            {alDia} al día
                            {proximos > 0 && <> · <span style={{ color: "#f59e0b" }}>{proximos} por vencer</span></>}
                            {enMora > 0 && <> · <span style={{ color: "#f87171" }}>{enMora} en mora</span></>}
                        </StatVal>
                    </StatInfo>
                </StatCard>
            </StatsRow>

            {/* Alertas de vencimiento */}
            {(() => {
                const alertas = suscripciones
                    .filter(s => s.fecha_proximo_pago)
                    .map(s => {
                        const dias = Math.ceil((new Date(s.fecha_proximo_pago) - new Date()) / 86400000);
                        return { ...s, dias };
                    })
                    .filter(s => s.dias <= 10)
                    .sort((a, b) => a.dias - b.dias);

                if (alertas.length === 0) return null;
                return (
                    <AlertasSection>
                        <AlertasTitulo>
                            <Icon icon="solar:bell-bold-duotone" style={{ fontSize: 20, color: "#f59e0b" }} />
                            Próximos vencimientos
                        </AlertasTitulo>
                        {alertas.map(s => {
                            const waUrl = waRecordatorio(s, s.dias);
                            return (
                                <AlertaItem key={s.id} $vencido={s.dias <= 0}>
                                    <AlertaIcono $vencido={s.dias <= 0}>
                                        {s.dias <= 0 ? "🔴" : s.dias <= 3 ? "🟠" : "🟡"}
                                    </AlertaIcono>
                                    <AlertaInfo>
                                        <AlertaNombre>{s.nombre_cliente} {s.apellido_cliente}</AlertaNombre>
                                        <AlertaDetalle>
                                            {s.dias <= 0
                                                ? `Venció hace ${Math.abs(s.dias)} día${Math.abs(s.dias) !== 1 ? "s" : ""}`
                                                : s.dias === 0
                                                ? "Vence hoy"
                                                : `Vence en ${s.dias} día${s.dias !== 1 ? "s" : ""}`
                                            } · {new Date(s.fecha_proximo_pago).toLocaleDateString("es-CO")}
                                        </AlertaDetalle>
                                    </AlertaInfo>
                                    <AlertaMonto>{formatCOP(s.valor_mensual)}</AlertaMonto>
                                    {waUrl && (
                                        <BtnWA as="a" href={waUrl} target="_blank" rel="noopener noreferrer" title="Enviar recordatorio por WhatsApp">
                                            <RiWhatsappLine />
                                        </BtnWA>
                                    )}
                                </AlertaItem>
                            );
                        })}
                    </AlertasSection>
                );
            })()}

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
                                    <InfoVal>
                                        {PLANES.find(p => p.key === s.plan)?.label ?? s.plan}
                                        {" · "}
                                        <TipoPlanPill $tipo={s.tipo_plan}>
                                            {TIPOS_PLAN.find(t => t.key === s.tipo_plan)?.label.split("—")[0].trim() ?? s.tipo_plan}
                                        </TipoPlanPill>
                                    </InfoVal>
                                </InfoFila>
                                <InfoFila>
                                    <InfoLabel>Mensualidad</InfoLabel>
                                    <InfoVal $green>{formatCOP(s.valor_mensual)}</InfoVal>
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
                                {s.usuario_admin && (
                                    <CredencialesBox>
                                        <InfoFila>
                                            <InfoLabel>Usuario</InfoLabel>
                                            <InfoVal style={{ fontFamily: "monospace" }}>{s.usuario_admin}</InfoVal>
                                        </InfoFila>
                                        <InfoFila>
                                            <InfoLabel>Contraseña</InfoLabel>
                                            <InfoVal style={{ fontFamily: "monospace" }}>
                                                {s.password_admin || <span style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic", fontFamily: "inherit" }}>No registrada</span>}
                                            </InfoVal>
                                        </InfoFila>
                                    </CredencialesBox>
                                )}
                                {s.notas && <Notas>{s.notas}</Notas>}

                                {/* Historial de pagos */}
                                <BtnHistorial onClick={() => setHistorialId(historialId === s.id ? null : s.id)}>
                                    <Icon icon="solar:clipboard-list-bold-duotone" style={{ fontSize: 14 }} />
                                    {historialId === s.id ? "Ocultar historial" : "Ver historial de pagos"}
                                </BtnHistorial>

                                {historialId === s.id && (
                                    <HistorialBox>
                                        {pagosHistorial.length === 0 ? (
                                            <HistorialVacio>Sin pagos registrados</HistorialVacio>
                                        ) : pagosHistorial.map(p => (
                                            <HistorialFila key={p.id}>
                                                <HistorialFecha>
                                                    {new Date(p.fecha_pago).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                                                    <span>{new Date(p.fecha_pago).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span>
                                                </HistorialFecha>
                                                <HistorialMetodo $metodo={p.metodo}>
                                                    {p.metodo === "efectivo" ? "💵" : p.metodo === "transferencia" ? "🏦" : "📱"} {p.metodo}
                                                </HistorialMetodo>
                                                <HistorialMonto>{formatCOP(p.monto)}</HistorialMonto>
                                            </HistorialFila>
                                        ))}
                                    </HistorialBox>
                                )}
                            </CardBody>

                            <CardActions>
                                {/* Pago manual — siempre visible para registrar pagos no reportados por Wompi */}
                                {estadoCalc !== "cancelado" && (
                                    <BtnPago onClick={async () => {
                                        const { default: Swal } = await import("sweetalert2");
                                        const { value: metodo } = await Swal.fire({
                                            title: "Registrar pago",
                                            html: `
                                                <div style="margin-bottom:18px;font-size:14px;color:#94a3b8;">Monto: <strong style="color:#4ade80;font-size:18px;">${formatCOP(s.valor_mensual)}</strong></div>
                                                <div style="display:flex;gap:10px;justify-content:center;">
                                                    <button type="button" class="swal-metodo" data-metodo="efectivo" style="flex:1;padding:16px 10px;border-radius:14px;border:2px solid #1e3347;background:#162436;color:#fff;cursor:pointer;font-family:Poppins,sans-serif;font-weight:700;font-size:13px;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all .15s;">
                                                        <span style="font-size:28px;">💵</span>Efectivo
                                                    </button>
                                                    <button type="button" class="swal-metodo" data-metodo="transferencia" style="flex:1;padding:16px 10px;border-radius:14px;border:2px solid #1e3347;background:#162436;color:#fff;cursor:pointer;font-family:Poppins,sans-serif;font-weight:700;font-size:13px;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all .15s;">
                                                        <span style="font-size:28px;">🏦</span>Transferencia
                                                    </button>
                                                    <button type="button" class="swal-metodo" data-metodo="qr" style="flex:1;padding:16px 10px;border-radius:14px;border:2px solid #1e3347;background:#162436;color:#fff;cursor:pointer;font-family:Poppins,sans-serif;font-weight:700;font-size:13px;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all .15s;">
                                                        <span style="font-size:28px;">📱</span>QR
                                                    </button>
                                                </div>
                                            `,
                                            input: "hidden",
                                            showConfirmButton: false,
                                            showCancelButton: true,
                                            cancelButtonText: "Cancelar",
                                            background: "#0E1C2A",
                                            color: "#D8E8F5",
                                            customClass: { popup: "swal-pos" },
                                            didOpen: () => {
                                                document.querySelectorAll(".swal-metodo").forEach(btn => {
                                                    btn.addEventListener("mouseenter", () => { btn.style.borderColor = "#f88533"; btn.style.background = "rgba(248,133,51,0.1)"; });
                                                    btn.addEventListener("mouseleave", () => { btn.style.borderColor = "#1e3347"; btn.style.background = "#162436"; });
                                                    btn.addEventListener("click", () => {
                                                        Swal.getInput().value = btn.dataset.metodo;
                                                        Swal.clickConfirm();
                                                    });
                                                });
                                            },
                                        });
                                        if (metodo) mutPago.mutate({ ...s, metodo_pago: metodo });
                                    }}>
                                        <Icon icon="solar:hand-money-bold-duotone" style={{ fontSize: 16 }} /> Registrar pago
                                    </BtnPago>
                                )}

                                {/* Eximir pago — resetea el reloj sin cobrar */}
                                {(estadoCalc === "mora" || estadoCalc === "proximo") && (
                                    <BtnEximir
                                        title="Eximir pago — extender fecha sin cobrar"
                                        disabled={mutEximir.isPending}
                                        onClick={() => confirmar({
                                            titulo: "¿Eximir pago?",
                                            texto: `Se extenderá la fecha de ${s.nombre_cliente} sin registrar cobro.`,
                                            onConfirmar: () => mutEximir.mutate(s),
                                        })}
                                    >
                                        <RiShieldCheckLine /> Eximir
                                    </BtnEximir>
                                )}

                                {/* Reactivar — para cuentas suspendidas o canceladas */}
                                {(estadoCalc === "suspendido" || estadoCalc === "cancelado") && (
                                    <BtnReactivar
                                        title="Reactivar cuenta"
                                        disabled={mutReactivar.isPending}
                                        onClick={() => confirmar({
                                            titulo: "¿Reactivar cuenta?",
                                            texto: `Se reactivará la cuenta de ${s.nombre_cliente} y se reiniciará el período de pago.`,
                                            onConfirmar: () => mutReactivar.mutate(s),
                                        })}
                                    >
                                        <RiRefreshLine /> Reactivar
                                    </BtnReactivar>
                                )}

                                {s.telefono && (() => {
                                    const diasRest = s.fecha_proximo_pago
                                        ? Math.ceil((new Date(s.fecha_proximo_pago) - new Date()) / 86400000)
                                        : 0;
                                    const url = waRecordatorio(s, diasRest);
                                    return url ? (
                                        <BtnWA as="a" href={url} target="_blank" rel="noopener noreferrer" title="Recordatorio WhatsApp">
                                            <RiWhatsappLine />
                                        </BtnWA>
                                    ) : null;
                                })()}
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
                            <FilaDos>
                                <Campo>
                                    <label>Nombre</label>
                                    <Input value={form.nombre_cliente} onChange={e => setForm({ ...form, nombre_cliente: e.target.value })} placeholder="Nombre" required />
                                </Campo>
                                <Campo>
                                    <label>Apellido</label>
                                    <Input value={form.apellido_cliente} onChange={e => setForm({ ...form, apellido_cliente: e.target.value })} placeholder="Apellido" required={!editando} />
                                </Campo>
                            </FilaDos>
                            {!editando && (
                                <FilaDos>
                                    <Campo>
                                        <label>Cédula (será la contraseña)</label>
                                        <Input value={form.cedula_cliente} onChange={e => setForm({ ...form, cedula_cliente: e.target.value })} placeholder="Número de cédula" required />
                                    </Campo>
                                    <Campo>
                                        <label>Teléfono / WhatsApp</label>
                                        <Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="3001234567" />
                                    </Campo>
                                </FilaDos>
                            )}
                            {editando && (
                                <Campo>
                                    <label>Teléfono / WhatsApp</label>
                                    <Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="3001234567" />
                                </Campo>
                            )}
                            <Campo>
                                <label>Actividad económica</label>
                                <DropWrap ref={dropActividadRef}>
                                    <SelectorBtn
                                        type="button"
                                        $activo={dropActividad}
                                        onClick={() => setDropActividad(v => !v)}
                                    >
                                        <span>{ACTIVIDADES.find(a => a.key === form.actividad_economica)?.label ?? "Selecciona..."}</span>
                                        <RiArrowDownSLine className={`chevron ${dropActividad ? "abierto" : ""}`} />
                                    </SelectorBtn>
                                    {dropActividad && (
                                        <DropMenu>
                                            {ACTIVIDADES.map(a => (
                                                <DropItem
                                                    key={a.key}
                                                    type="button"
                                                    $activo={form.actividad_economica === a.key}
                                                    onClick={() => { setForm({ ...form, actividad_economica: a.key }); setDropActividad(false); }}
                                                >
                                                    {a.label}
                                                </DropItem>
                                            ))}
                                        </DropMenu>
                                    )}
                                </DropWrap>
                            </Campo>

                            {/* ── Descuento de retención (solo al editar) ── */}
                            {editando && (
                                <RetencionBox>
                                    <RetencionTitulo>
                                        <RiShieldLine /> Retención de cliente
                                    </RetencionTitulo>
                                    <Campo>
                                        <label>
                                            <RiPercentLine style={{ verticalAlign: "middle" }} /> Descuento — {form.descuento_pct}%
                                        </label>
                                        <SliderWrap>
                                            <input
                                                type="range" min={0} max={50} step={5}
                                                value={form.descuento_pct}
                                                onChange={e => setForm({ ...form, descuento_pct: Number(e.target.value) })}
                                            />
                                            <SliderTrack $pct={form.descuento_pct * 2} />
                                        </SliderWrap>
                                        <DescuentoPreview>
                                            <span style={{ color: "#94a3b8" }}>Valor actual: {formatCOP(Number(editando.valor_mensual) || 0)}</span>
                                            {form.descuento_pct > 0 && (
                                                <span style={{ color: "#4ade80", fontWeight: 800 }}>
                                                    → {formatCOP(Math.round((Number(editando.valor_mensual) || 0) * (1 - form.descuento_pct / 100)))} /mes al guardar
                                                </span>
                                            )}
                                        </DescuentoPreview>
                                    </Campo>
                                </RetencionBox>
                            )}
                            <Campo>
                                <label>Etiqueta del plan</label>
                                <PlanBadgeWrap>
                                    {TIPOS_PLAN.map(t => (
                                        <PlanBadge
                                            key={t.key}
                                            type="button"
                                            data-tipo={t.key}
                                            $activo={form.tipo_plan === t.key}
                                            onClick={() => setForm({ ...form, tipo_plan: t.key, valor_mensual: getPrecioTier(t.key) })}
                                        >
                                            {t.label.split("—")[0].trim()}
                                        </PlanBadge>
                                    ))}
                                </PlanBadgeWrap>
                            </Campo>
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
    display: grid; grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr)); gap: 16px;
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

const BtnHistorial = styled.button`
    display: flex; align-items: center; gap: 6px;
    background: none; border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px; padding: 6px 12px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 11px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif;
    transition: all 0.15s;
    &:hover { border-color: #f88533; color: #f88533; }
`;

const HistorialBox = styled.div`
    background: ${({ theme }) => theme.bgtotal};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
    padding: 10px;
    display: flex; flex-direction: column; gap: 6px;
    max-height: 200px; overflow-y: auto;
`;

const HistorialVacio = styled.div`
    text-align: center; padding: 16px;
    font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const HistorialFila = styled.div`
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; border-radius: 8px;
    background: ${({ theme }) => theme.bgcards};
    font-size: 12px;
`;

const HistorialFecha = styled.div`
    flex: 1; color: ${({ theme }) => theme.text}; font-weight: 600;
    display: flex; flex-direction: column; gap: 1px;
    span { font-size: 10px; color: ${({ theme }) => theme.colorsubtitlecard}; }
`;

const HistorialMetodo = styled.span`
    font-size: 11px; font-weight: 700; text-transform: capitalize;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

const HistorialMonto = styled.span`
    font-weight: 800; color: #4ade80; font-size: 13px;
`;

const AlertasSection = styled.div`
    display: flex; flex-direction: column; gap: 8px;
    padding: 18px; border-radius: 16px;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid rgba(245,158,11,0.25);
    margin-bottom: 8px;
`;

const AlertasTitulo = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 900; color: #f59e0b;
    margin-bottom: 6px;
`;

const AlertaItem = styled.div`
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 10px;
    background: ${({ $vencido }) => $vencido ? "rgba(248,113,113,0.08)" : "rgba(245,158,11,0.06)"};
    border-left: 3px solid ${({ $vencido }) => $vencido ? "#f87171" : "#f59e0b"};
`;

const AlertaIcono = styled.span`font-size: 16px;`;

const AlertaInfo = styled.div`flex: 1; display: flex; flex-direction: column; gap: 1px;`;

const AlertaNombre = styled.span`
    font-size: 13px; font-weight: 800; color: ${({ theme }) => theme.text};
`;

const AlertaDetalle = styled.span`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const AlertaMonto = styled.span`
    font-size: 14px; font-weight: 800; color: #f59e0b;
`;

const CredencialesBox = styled.div`
    background: ${({ theme }) => theme.bgtotal};
    border: 1px dashed ${({ theme }) => theme.color2};
    border-radius: 10px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const BtnPago = styled.button`
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 8px; border: none;
    background: rgba(74,222,128,0.15); color: #4ade80;
    font-size: 11px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif;
    &:hover { background: rgba(74,222,128,0.25); }
`;

const BtnEximir = styled.button`
    display: flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: 8px; border: none;
    background: rgba(251,191,36,0.12); color: #fbbf24;
    font-size: 11px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif;
    transition: background 0.15s;
    &:hover { background: rgba(251,191,36,0.22); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const BtnReactivar = styled.button`
    display: flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: 8px; border: none;
    background: rgba(99,102,241,0.15); color: #818cf8;
    font-size: 11px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif;
    transition: background 0.15s;
    &:hover { background: rgba(99,102,241,0.25); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const BtnIco = styled.button`
    background: none; border: none; cursor: pointer; font-size: 16px; padding: 5px;
    border-radius: 6px; display: flex; align-items: center;
    color: ${({ $rojo, theme }) => $rojo ? "#f87171" : theme.colorsubtitlecard};
    &:hover { background: rgba(255,255,255,0.08); }
`;

const BtnWA = styled.button`
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 8px; border: none; flex-shrink: 0;
    background: rgba(37,211,102,0.12); color: #25d366;
    font-size: 16px; cursor: pointer; text-decoration: none;
    transition: background 0.15s;
    &:hover { background: rgba(37,211,102,0.24); }
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
const FilaDos = styled.div`
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

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

const slideDown = keyframes`from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}`;

const DropWrap = styled.div`position: relative; width: 100%;`;

const SelectorBtn = styled.button`
    width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 10px 14px; border-radius: 10px; cursor: pointer;
    border: 1.5px solid ${({ $activo, theme }) => $activo ? "#f88533" : theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-weight: 600; font-family: "Poppins", sans-serif;
    transition: border-color 0.15s;
    &:hover { border-color: #f88533; }
    .chevron { font-size: 18px; color: #f88533; transition: transform 0.2s; flex-shrink: 0; }
    .chevron.abierto { transform: rotate(180deg); }
`;

const DropMenu = styled.div`
    position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 400;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px; padding: 6px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.35);
    animation: ${slideDown} 0.16s ease;
    max-height: 240px; overflow-y: auto;
`;

const DropItem = styled.button`
    width: 100%; text-align: left; padding: 9px 12px; border-radius: 8px;
    border: none; cursor: pointer; font-size: 13px; font-weight: 600;
    font-family: "Poppins", sans-serif;
    background: ${({ $activo }) => $activo ? "rgba(248,133,51,0.12)" : "transparent"};
    color: ${({ $activo, theme }) => $activo ? "#f88533" : theme.text};
    transition: background 0.12s;
    &:hover { background: rgba(248,133,51,0.08); }
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

/* ── Retención ── */
const RetencionBox = styled.div`
    background: rgba(129,140,248,0.06);
    border: 1px solid rgba(129,140,248,0.2);
    border-radius: 14px;
    padding: 16px;
    display: flex; flex-direction: column; gap: 14px;
`;

const RetencionTitulo = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 800;
    color: #a5b4fc;
    font-family: "Poppins", sans-serif;
    svg { font-size: 16px; }
`;

const SliderWrap = styled.div`
    padding: 6px 0;
    input[type="range"] {
        width: 100%; cursor: pointer; accent-color: #f88533;
        height: 4px; border-radius: 4px;
    }
`;

const SliderTrack = styled.div`
    height: 3px;
    border-radius: 4px;
    background: linear-gradient(
        to right,
        #f88533 0%,
        #f88533 ${({ $pct }) => $pct ?? 0}%,
        rgba(255,255,255,0.12) ${({ $pct }) => $pct ?? 0}%,
        rgba(255,255,255,0.12) 100%
    );
    margin-top: -2px;
`;

const DescuentoPreview = styled.div`
    display: flex; flex-direction: column; gap: 3px;
    font-size: 12px; font-family: "Poppins", sans-serif;
    margin-top: 4px;
`;

/* ── Plan badges selector ── */
const PlanBadgeWrap = styled.div`
    display: flex; gap: 8px; flex-wrap: wrap; padding: 4px 0;
`;

const PLAN_COLORS = {
    chispa: { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.5)", text: "#fbbf24",  activeBg: "rgba(251,191,36,0.25)" },
    fuego:  { bg: "rgba(248,133,51,0.12)", border: "rgba(248,133,51,0.5)", text: "#f88533",  activeBg: "rgba(248,133,51,0.25)" },
    cosmos: { bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.5)", text: "#818cf8", activeBg: "rgba(129,140,248,0.25)" },
};

const PlanBadge = styled.button`
    padding: 8px 14px; border-radius: 20px; cursor: pointer;
    font-size: 12px; font-weight: 800; font-family: "Poppins", sans-serif;
    transition: all 0.15s;
    ${({ $activo, $tipo: _ }) => {
        /* can't use $tipo here yet, use prop directly */
        return "";
    }}
    background:    ${({ $activo, children: _ }) => $activo ? "transparent" : "transparent"};
    border: 2px solid transparent;
    color: rgba(255,255,255,0.4);

    /* Set per-plan colors via data attr on parent — simpler to apply inline styles in JSX */
    &[data-tipo="chispa"] {
        border-color: ${({ $activo }) => $activo ? "rgba(251,191,36,0.8)" : "rgba(251,191,36,0.25)"};
        background:   ${({ $activo }) => $activo ? "rgba(251,191,36,0.2)"  : "transparent"};
        color:        ${({ $activo }) => $activo ? "#fbbf24" : "rgba(251,191,36,0.5)"};
    }
    &[data-tipo="fuego"] {
        border-color: ${({ $activo }) => $activo ? "rgba(248,133,51,0.8)" : "rgba(248,133,51,0.25)"};
        background:   ${({ $activo }) => $activo ? "rgba(248,133,51,0.2)"  : "transparent"};
        color:        ${({ $activo }) => $activo ? "#f88533" : "rgba(248,133,51,0.5)"};
    }
    &[data-tipo="cosmos"] {
        border-color: ${({ $activo }) => $activo ? "rgba(129,140,248,0.8)" : "rgba(129,140,248,0.25)"};
        background:   ${({ $activo }) => $activo ? "rgba(129,140,248,0.2)"  : "transparent"};
        color:        ${({ $activo }) => $activo ? "#818cf8" : "rgba(129,140,248,0.5)"};
    }
    &:hover { filter: brightness(1.2); }
`;

/* ── Tipo plan pill en tarjeta ── */
const TIPO_COLORS = {
    chispa: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" },
    fuego:  { color: "#f88533", bg: "rgba(248,133,51,0.12)",  border: "rgba(248,133,51,0.3)"  },
    cosmos: { color: "#818cf8", bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.3)" },
};

const TipoPlanPill = styled.span`
    display: inline-flex; align-items: center;
    padding: 2px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 800;
    color:        ${({ $tipo }) => TIPO_COLORS[$tipo]?.color  ?? "#fff"};
    background:   ${({ $tipo }) => TIPO_COLORS[$tipo]?.bg     ?? "transparent"};
    border: 1px solid ${({ $tipo }) => TIPO_COLORS[$tipo]?.border ?? "transparent"};
    font-family: "Poppins", sans-serif;
`;

