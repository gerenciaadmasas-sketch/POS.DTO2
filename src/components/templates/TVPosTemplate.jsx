import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { InsertarCliente } from "../../supabase/crudClientes";
import { EditarEmpresa } from "../../supabase/crudEmpresa";
import { toastExito } from "../../utils/toast";
import {
    RiSettingsLine, RiCheckLine, RiTvLine, RiCalendarLine,
    RiMapPinLine, RiPhoneLine, RiUserLine, RiWifiLine,
    RiArrowRightLine, RiAddLine, RiDeleteBin2Line, RiAddCircleLine,
} from "react-icons/ri";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";

/* ── Constantes ─────────────────────────────────────────────── */
const PERIODOS = [
    { key: "mensual",   label: "Mensual",   meses: 1  },
    { key: "semestral", label: "Semestral", meses: 6  },
    { key: "anual",     label: "Anual",     meses: 12 },
];

const DECODERS = ["HD Basic", "HD Plus", "4K Ultra", "Android TV", "Otro"];

const COLORES_PLAN = ["#60a5fa", "#f59e0b", "#a78bfa", "#34d399", "#f87171", "#818cf8"];

const PLANES_DEFAULT = [
    { key: "plan_0", nombre: "Básico",      mensual: 0, semestral: 0, anual: 0, incluye: [] },
    { key: "plan_1", nombre: "Estándar",    mensual: 0, semestral: 0, anual: 0, incluye: [] },
    { key: "plan_2", nombre: "Premium",     mensual: 0, semestral: 0, anual: 0, incluye: [] },
];

function fmtMoney(v) {
    if (!v && v !== 0) return "—";
    return `$${Number(v).toLocaleString("es-CO")}`;
}

function calcVencimiento(periodo) {
    const d = new Date();
    const meses = PERIODOS.find(p => p.key === periodo)?.meses ?? 1;
    d.setMonth(d.getMonth() + meses);
    return d.toISOString().split("T")[0];
}

function uid() { return `plan_${Date.now()}`; }

/* ════════════════════════════════════════════════════════════ */
export function TVPosTemplate() {
    const { dataempresa, setEmpresa } = useEmpresaStore();
    const qc = useQueryClient();
    const datosExtra = dataempresa?.datos_extra ?? {};

    // Planes: array con nombre, precios y lista de qué incluye
    const planesGuardados = Array.isArray(datosExtra.planes_tv) ? datosExtra.planes_tv : PLANES_DEFAULT;
    const costoInstGuard  = datosExtra.costo_instalacion ?? 0;

    /* ── Estados ────────────────────────────────────────────── */
    const [vista,      setVista]      = useState("nuevo");  // "nuevo" | "config"
    const [paso,       setPaso]       = useState(1);
    const [planes,     setPlanes]     = useState(planesGuardados);
    const [costInst,   setCostInst]   = useState(costoInstGuard);
    const [planSel,    setPlanSel]    = useState(planesGuardados[0]?.key ?? "");
    const [periodoSel, setPeriodoSel] = useState("mensual");
    const [conInstal,  setConInstal]  = useState(true);
    const [addItemIdx, setAddItemIdx] = useState(null);  // índice del plan donde se está añadiendo item
    const [newItem,    setNewItem]    = useState("");

    const [form, setForm] = useState({
        nombre: "", apellido: "", telefono: "", email: "",
        documento: "", direccion: "", decoder: "HD Basic",
        decoder_serial: "", notas: "",
    });

    /* ── Helpers planes ─────────────────────────────────────── */
    const planActual = planes.find(p => p.key === planSel) ?? planes[0];
    const precioPlan = Number(planActual?.[periodoSel] ?? 0);
    const totalPagar = precioPlan + (conInstal ? Number(costInst) : 0);

    function setPlanField(key, field, val) {
        setPlanes(prev => prev.map(p => p.key === key ? { ...p, [field]: val } : p));
    }

    function addIncluye(planKey) {
        if (!newItem.trim()) return;
        setPlanes(prev => prev.map(p =>
            p.key === planKey
                ? { ...p, incluye: [...(p.incluye ?? []), newItem.trim()] }
                : p
        ));
        setNewItem("");
        setAddItemIdx(null);
    }

    function removeIncluye(planKey, idx) {
        setPlanes(prev => prev.map(p =>
            p.key === planKey
                ? { ...p, incluye: p.incluye.filter((_, i) => i !== idx) }
                : p
        ));
    }

    function agregarPlan() {
        const nuevo = { key: uid(), nombre: "Nuevo plan", mensual: 0, semestral: 0, anual: 0, incluye: [] };
        setPlanes(prev => [...prev, nuevo]);
    }

    function eliminarPlan(key) {
        setPlanes(prev => prev.filter(p => p.key !== key));
        if (planSel === key) setPlanSel(planes[0]?.key ?? "");
    }

    /* ── Mutaciones ─────────────────────────────────────────── */
    const mutCrear = useMutation({
        mutationFn: () => InsertarCliente({
            id_empresa: dataempresa?.id,
            nombre:    form.nombre.trim(),
            apellido:  form.apellido.trim() || null,
            telefono:  form.telefono || null,
            email:     form.email    || null,
            documento: form.documento || null,
            datos_extra: {
                direccion:        form.direccion,
                decoder_tipo:     form.decoder,
                decoder_serial:   form.decoder_serial,
                plan_nombre:      planActual?.nombre ?? planSel,
                plan_key:         planSel,
                periodo:          periodoSel,
                fecha_instalacion: new Date().toISOString().split("T")[0],
                fecha_vencimiento: calcVencimiento(periodoSel),
                costo_instalacion: conInstal ? Number(costInst) : 0,
                precio_plan:      precioPlan,
                total_cobrado:    totalPagar,
                notas:            form.notas,
            },
        }),
        onSuccess: () => {
            toastExito("Suscriptor registrado y pago confirmado");
            qc.invalidateQueries({ queryKey: ["suscriptores-tv", dataempresa?.id] });
            resetForm();
        },
    });

    const mutConfig = useMutation({
        mutationFn: () => EditarEmpresa({
            id: dataempresa.id,
            datos_extra: {
                ...datosExtra,
                planes_tv:         planes,
                costo_instalacion: Number(costInst),
            },
        }),
        onSuccess: (updated) => {
            if (updated) setEmpresa(updated);
            toastExito("Planes actualizados");
            setVista("nuevo");
        },
    });

    /* ── Helpers formulario ─────────────────────────────────── */
    function handleF(e) {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
    }

    function resetForm() {
        setForm({ nombre: "", apellido: "", telefono: "", email: "", documento: "", direccion: "", decoder: "HD Basic", decoder_serial: "", notas: "" });
        setPlanSel(planes[0]?.key ?? "");
        setPeriodoSel("mensual");
        setConInstal(true);
        setPaso(1);
    }

    function avanzar() {
        if (!form.nombre.trim()) {
            Swal.fire({ title: "Falta el nombre", icon: "warning", confirmButtonColor: "#60a5fa", customClass: { popup: "swal-pos" } });
            return;
        }
        setPaso(2);
    }

    function confirmarPago() {
        const periodoLabel = PERIODOS.find(p => p.key === periodoSel)?.label ?? periodoSel;
        Swal.fire({
            title: "Confirmar pago",
            html: `
                <div style="text-align:left;font-size:14px;line-height:2">
                    <b>Cliente:</b> ${form.nombre} ${form.apellido}<br/>
                    <b>Plan:</b> ${planActual?.nombre} · ${periodoLabel}<br/>
                    ${conInstal ? `<b>Instalación:</b> ${fmtMoney(costInst)}<br/>` : ""}
                    <b>Plan:</b> ${fmtMoney(precioPlan)}<br/>
                    <hr style="margin:10px 0;opacity:0.2"/>
                    <b style="font-size:20px;color:#60a5fa">Total: ${fmtMoney(totalPagar)}</b>
                </div>
            `,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "✓ Pago recibido",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#60a5fa",
            cancelButtonColor: "#374151",
            customClass: { popup: "swal-pos" },
        }).then(r => { if (r.isConfirmed) mutCrear.mutate(); });
    }

    /* ── Render ─────────────────────────────────────────────── */
    return (
        <Wrap>
            {/* Header */}
            <Header>
                <HeaderLeft>
                    <TvIcon><Icon icon="ri:tv-2-line" /></TvIcon>
                    <HeaderTxt>
                        <h2>Nueva Suscripción</h2>
                        <span>Registra un suscriptor y confirma su pago</span>
                    </HeaderTxt>
                </HeaderLeft>
                <BtnConfig onClick={() => setVista(v => v === "config" ? "nuevo" : "config")}>
                    <RiSettingsLine />
                    {vista === "config" ? "Cancelar" : "Configurar planes"}
                </BtnConfig>
            </Header>

            {/* ══════ CONFIGURACIÓN DE PLANES ══════ */}
            {vista === "config" && (
                <ConfigWrap>
                    <ConfigTitle>
                        <Icon icon="solar:settings-bold-duotone" style={{ fontSize: 20, color: "#60a5fa" }} />
                        Planes de suscripción
                    </ConfigTitle>

                    {planes.map((plan, idx) => {
                        const color = COLORES_PLAN[idx % COLORES_PLAN.length];
                        return (
                            <PlanConfigCard key={plan.key} $color={color}>
                                <PlanConfigHeader>
                                    <PlanColorDot $color={color} />
                                    <PlanNombreInput
                                        value={plan.nombre}
                                        onChange={e => setPlanField(plan.key, "nombre", e.target.value)}
                                        placeholder="Nombre del plan"
                                    />
                                    {planes.length > 1 && (
                                        <BtnDelPlan onClick={() => eliminarPlan(plan.key)}>
                                            <RiDeleteBin2Line />
                                        </BtnDelPlan>
                                    )}
                                </PlanConfigHeader>

                                <PreciosRow>
                                    {PERIODOS.map(per => (
                                        <PrecioItem key={per.key}>
                                            <PrecioLabel>{per.label}</PrecioLabel>
                                            <PrecioInput
                                                type="number" min="0"
                                                value={plan[per.key] ?? 0}
                                                onChange={e => setPlanField(plan.key, per.key, e.target.value)}
                                                placeholder="0"
                                            />
                                        </PrecioItem>
                                    ))}
                                </PreciosRow>

                                <IncluyeSection>
                                    <IncluyeTitle>¿Qué incluye?</IncluyeTitle>
                                    <IncluyeList>
                                        {(plan.incluye ?? []).map((item, i) => (
                                            <IncluyeItem key={i}>
                                                <span>✓ {item}</span>
                                                <BtnRemoveItem onClick={() => removeIncluye(plan.key, i)}>×</BtnRemoveItem>
                                            </IncluyeItem>
                                        ))}
                                    </IncluyeList>
                                    {addItemIdx === idx ? (
                                        <AddItemRow>
                                            <AddItemInput
                                                autoFocus
                                                value={newItem}
                                                onChange={e => setNewItem(e.target.value)}
                                                onKeyDown={e => { if (e.key === "Enter") addIncluye(plan.key); if (e.key === "Escape") { setAddItemIdx(null); setNewItem(""); } }}
                                                placeholder="Ej: Canal ESPN, Netflix básico..."
                                            />
                                            <BtnAddConfirm onClick={() => addIncluye(plan.key)}>
                                                <RiCheckLine />
                                            </BtnAddConfirm>
                                        </AddItemRow>
                                    ) : (
                                        <BtnAddItem onClick={() => { setAddItemIdx(idx); setNewItem(""); }}>
                                            <RiAddLine /> Agregar ítem
                                        </BtnAddItem>
                                    )}
                                </IncluyeSection>
                            </PlanConfigCard>
                        );
                    })}

                    <BtnNuevoPlan onClick={agregarPlan}>
                        <RiAddLine /> Agregar nuevo plan
                    </BtnNuevoPlan>

                    <InstRow>
                        <label>Costo de instalación (único):</label>
                        <PrecioInput
                            type="number" min="0"
                            value={costInst}
                            onChange={e => setCostInst(e.target.value)}
                            style={{ maxWidth: 140 }}
                        />
                    </InstRow>

                    <BtnGuardar onClick={() => mutConfig.mutate()} disabled={mutConfig.isPending}>
                        <RiCheckLine />
                        {mutConfig.isPending ? "Guardando..." : "Guardar configuración"}
                    </BtnGuardar>
                </ConfigWrap>
            )}

            {/* ══════ FORMULARIO NUEVO SUSCRIPTOR ══════ */}
            {vista === "nuevo" && (
                <FormWrap>
                    {paso === 1 && (
                        <>
                            <SeccionTitulo><RiUserLine /> Datos del suscriptor</SeccionTitulo>
                            <Grid2>
                                <Campo>
                                    <label>Nombre *</label>
                                    <Input name="nombre" value={form.nombre} onChange={handleF} placeholder="Nombre" />
                                </Campo>
                                <Campo>
                                    <label>Apellido</label>
                                    <Input name="apellido" value={form.apellido} onChange={handleF} placeholder="Apellido" />
                                </Campo>
                                <Campo>
                                    <label><RiPhoneLine /> Teléfono</label>
                                    <Input name="telefono" value={form.telefono} onChange={handleF} placeholder="Número de contacto" />
                                </Campo>
                                <Campo>
                                    <label>Documento / ID</label>
                                    <Input name="documento" value={form.documento} onChange={handleF} placeholder="Cédula o pasaporte" />
                                </Campo>
                                <Campo style={{ gridColumn: "1 / -1" }}>
                                    <label><RiMapPinLine /> Dirección de instalación</label>
                                    <Input name="direccion" value={form.direccion} onChange={handleF} placeholder="Dirección completa" />
                                </Campo>
                                <Campo>
                                    <label><RiTvLine /> Tipo de decoder</label>
                                    <Select name="decoder" value={form.decoder} onChange={handleF}>
                                        {DECODERS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </Select>
                                </Campo>
                                <Campo>
                                    <label>Serial del decoder</label>
                                    <Input name="decoder_serial" value={form.decoder_serial} onChange={handleF} placeholder="Nro. serial (opcional)" />
                                </Campo>
                                <Campo style={{ gridColumn: "1 / -1" }}>
                                    <label>Notas</label>
                                    <Input name="notas" value={form.notas} onChange={handleF} placeholder="Observaciones adicionales" />
                                </Campo>
                            </Grid2>
                            <BtnSiguiente onClick={avanzar}>
                                Siguiente — Elegir plan <RiArrowRightLine />
                            </BtnSiguiente>
                        </>
                    )}

                    {paso === 2 && (
                        <>
                            <BackBtn onClick={() => setPaso(1)}>← Volver</BackBtn>
                            <SeccionTitulo><RiWifiLine /> Seleccionar plan</SeccionTitulo>

                            {planes.length === 0 ? (
                                <EmptyPlanes>
                                    No hay planes configurados. Ve a "Configurar planes" primero.
                                </EmptyPlanes>
                            ) : (
                                <PlanesGrid>
                                    {planes.map((p, idx) => {
                                        const color = COLORES_PLAN[idx % COLORES_PLAN.length];
                                        return (
                                            <PlanCard
                                                key={p.key}
                                                $activo={planSel === p.key}
                                                $color={color}
                                                onClick={() => setPlanSel(p.key)}
                                            >
                                                <PlanCardTop>
                                                    <PlanColorDot $color={color} style={{ width: 10, height: 10 }} />
                                                    <PlanCardLabel>{p.nombre}</PlanCardLabel>
                                                </PlanCardTop>
                                                {(p.incluye ?? []).length > 0 && (
                                                    <PlanIncluyePreview>
                                                        {p.incluye.slice(0, 3).map((item, i) => (
                                                            <span key={i}>✓ {item}</span>
                                                        ))}
                                                        {p.incluye.length > 3 && <span>+{p.incluye.length - 3} más</span>}
                                                    </PlanIncluyePreview>
                                                )}
                                                <PlanCardPrecios>
                                                    {PERIODOS.map(per => (
                                                        <span key={per.key}>
                                                            {per.label}: <b>{fmtMoney(p[per.key] ?? 0)}</b>
                                                        </span>
                                                    ))}
                                                </PlanCardPrecios>
                                            </PlanCard>
                                        );
                                    })}
                                </PlanesGrid>
                            )}

                            <SeccionTitulo style={{ marginTop: 24 }}><RiCalendarLine /> Período de pago</SeccionTitulo>
                            <PeriodosRow>
                                {PERIODOS.map(p => (
                                    <PeriodBtn
                                        key={p.key}
                                        $activo={periodoSel === p.key}
                                        onClick={() => setPeriodoSel(p.key)}
                                    >
                                        {p.label}
                                        <PeriodoPrecio>{fmtMoney(planActual?.[p.key] ?? 0)}</PeriodoPrecio>
                                    </PeriodBtn>
                                ))}
                            </PeriodosRow>

                            <ResumenCard>
                                <ResumenTitle>Resumen del cobro</ResumenTitle>
                                <ResumenFila>
                                    <span>{planActual?.nombre} · {PERIODOS.find(p => p.key === periodoSel)?.label}</span>
                                    <b>{fmtMoney(precioPlan)}</b>
                                </ResumenFila>
                                <ResumenFila>
                                    <InstCheck>
                                        <input type="checkbox" id="conInstal" checked={conInstal} onChange={e => setConInstal(e.target.checked)} />
                                        <label htmlFor="conInstal">Cobrar instalación</label>
                                    </InstCheck>
                                    <b style={{ color: conInstal ? "#60a5fa" : "#64748b" }}>
                                        {conInstal ? fmtMoney(costInst) : "—"}
                                    </b>
                                </ResumenFila>
                                <ResumenDivider />
                                <ResumenTotal>
                                    <span>Total a cobrar</span>
                                    <TotalMonto>{fmtMoney(totalPagar)}</TotalMonto>
                                </ResumenTotal>
                            </ResumenCard>

                            <BtnConfirmar onClick={confirmarPago} disabled={mutCrear.isPending || planes.length === 0}>
                                <Icon icon="solar:check-circle-bold-duotone" style={{ fontSize: 20 }} />
                                {mutCrear.isPending ? "Registrando..." : "Confirmar pago y registrar suscriptor"}
                            </BtnConfirmar>
                        </>
                    )}
                </FormWrap>
            )}
        </Wrap>
    );
}

/* ── Styled Components ──────────────────────────────────────── */
const fadeIn = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}`;

const Wrap = styled.div`
    max-width: 860px; margin: 0 auto;
    padding: 24px 16px 48px;
    animation: ${fadeIn} 0.3s ease;
`;

const Header = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px; margin-bottom: 28px;
`;
const HeaderLeft = styled.div`display: flex; align-items: center; gap: 14px;`;
const TvIcon = styled.div`
    width: 48px; height: 48px; border-radius: 14px;
    background: rgba(96,165,250,0.12); border: 1.5px solid rgba(96,165,250,0.3);
    color: #60a5fa; font-size: 26px;
    display: flex; align-items: center; justify-content: center;
`;
const HeaderTxt = styled.div`
    h2 { font-size: 20px; font-weight: 800; color: ${({ theme }) => theme.text}; margin: 0; }
    span { font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard}; }
`;
const BtnConfig = styled.button`
    display: flex; align-items: center; gap: 7px;
    padding: 9px 16px; border-radius: 10px;
    border: 1.5px solid rgba(96,165,250,0.4);
    background: rgba(96,165,250,0.07); color: #60a5fa;
    font-weight: 700; font-size: 13px; cursor: pointer;
    transition: background 0.15s;
    &:hover { background: rgba(96,165,250,0.15); }
`;

/* ── Config ─────────────────────────────────────────────────── */
const ConfigWrap = styled.div`
    display: flex; flex-direction: column; gap: 16px;
    animation: ${fadeIn} 0.25s ease;
`;
const ConfigTitle = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 16px; font-weight: 800; color: ${({ theme }) => theme.text};
`;
const PlanConfigCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 2px solid ${({ $color }) => $color}30;
    border-left: 4px solid ${({ $color }) => $color};
    border-radius: 14px; padding: 18px 20px;
    display: flex; flex-direction: column; gap: 14px;
`;
const PlanConfigHeader = styled.div`
    display: flex; align-items: center; gap: 10px;
`;
const PlanColorDot = styled.div`
    width: 14px; height: 14px; border-radius: 50%;
    background: ${({ $color }) => $color}; flex-shrink: 0;
`;
const PlanNombreInput = styled.input`
    flex: 1; padding: 8px 12px; border-radius: 9px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 15px; font-weight: 800;
    &:focus { outline: none; border-color: #60a5fa; }
`;
const BtnDelPlan = styled.button`
    background: none; border: none; cursor: pointer;
    color: #f87171; font-size: 18px; padding: 4px;
    &:hover { color: #ef4444; }
`;
const PreciosRow = styled.div`
    display: flex; gap: 12px; flex-wrap: wrap;
`;
const PrecioItem = styled.div`
    display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 100px;
`;
const PrecioLabel = styled.label`
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;
const PrecioInput = styled.input`
    padding: 8px 10px; border-radius: 8px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 14px; font-weight: 600;
    &:focus { outline: none; border-color: #60a5fa; }
`;
const IncluyeSection = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const IncluyeTitle = styled.div`
    font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;
const IncluyeList = styled.div`display: flex; flex-direction: column; gap: 4px;`;
const IncluyeItem = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    font-size: 13px; color: ${({ theme }) => theme.text};
    background: ${({ theme }) => theme.bgtotal};
    border-radius: 7px; padding: 5px 10px;
`;
const BtnRemoveItem = styled.button`
    background: none; border: none; cursor: pointer;
    color: #f87171; font-size: 16px; font-weight: 700;
    line-height: 1; padding: 0 2px;
`;
const AddItemRow = styled.div`display: flex; gap: 8px; align-items: center;`;
const AddItemInput = styled.input`
    flex: 1; padding: 7px 11px; border-radius: 8px;
    border: 1.5px solid #60a5fa;
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text}; font-size: 13px;
    &:focus { outline: none; }
`;
const BtnAddConfirm = styled.button`
    padding: 7px 12px; border-radius: 8px; border: none;
    background: #60a5fa; color: #fff; cursor: pointer; font-size: 16px;
    &:hover { opacity: 0.88; }
`;
const BtnAddItem = styled.button`
    display: flex; align-items: center; gap: 5px;
    background: none; border: 1.5px dashed ${({ theme }) => theme.color2};
    border-radius: 8px; padding: 6px 12px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 13px; cursor: pointer; width: fit-content;
    &:hover { border-color: #60a5fa; color: #60a5fa; }
`;
const BtnNuevoPlan = styled.button`
    display: flex; align-items: center; gap: 8px;
    padding: 11px 18px; border-radius: 10px;
    border: 2px dashed rgba(96,165,250,0.4);
    background: rgba(96,165,250,0.05); color: #60a5fa;
    font-weight: 700; font-size: 14px; cursor: pointer;
    transition: background 0.15s;
    &:hover { background: rgba(96,165,250,0.1); }
`;
const InstRow = styled.div`
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
    padding: 16px; border-radius: 12px;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    label { font-size: 13px; font-weight: 700; color: ${({ theme }) => theme.text}; }
`;
const BtnGuardar = styled.button`
    display: flex; align-items: center; gap: 8px;
    padding: 13px 22px; border-radius: 10px; border: none;
    background: #60a5fa; color: #fff; font-weight: 800; font-size: 14px; cursor: pointer;
    transition: opacity 0.15s; width: fit-content;
    &:disabled { opacity: 0.6; cursor: not-allowed; }
    &:hover:not(:disabled) { opacity: 0.88; }
`;

/* ── Formulario ─────────────────────────────────────────────── */
const FormWrap = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 16px; padding: 28px;
    animation: ${fadeIn} 0.25s ease;
`;
const SeccionTitulo = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
    color: #60a5fa; margin-bottom: 16px;
`;
const Grid2 = styled.div`
    display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
    @media (max-width: 600px) { grid-template-columns: 1fr; }
`;
const Campo = styled.div`
    display: flex; flex-direction: column; gap: 5px;
    label { font-size: 12px; font-weight: 700; color: ${({ theme }) => theme.colorsubtitlecard};
            display: flex; align-items: center; gap: 5px; }
`;
const Input = styled.input`
    padding: 10px 13px; border-radius: 10px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text}; font-size: 14px;
    &:focus { outline: none; border-color: #60a5fa; }
`;
const Select = styled.select`
    padding: 10px 13px; border-radius: 10px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text}; font-size: 14px;
    &:focus { outline: none; border-color: #60a5fa; }
`;
const BtnSiguiente = styled.button`
    display: flex; align-items: center; gap: 8px; justify-content: center;
    width: 100%; margin-top: 24px; padding: 13px; border-radius: 12px; border: none;
    background: #60a5fa; color: #fff; font-weight: 800; font-size: 15px; cursor: pointer;
    &:hover { opacity: 0.88; }
`;
const BackBtn = styled.button`
    background: none; border: none; cursor: pointer;
    color: #60a5fa; font-size: 13px; font-weight: 700;
    margin-bottom: 16px; padding: 0;
    &:hover { text-decoration: underline; }
`;
const EmptyPlanes = styled.div`
    text-align: center; padding: 32px; color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 14px;
`;

/* ── Planes (selección) ─────────────────────────────────────── */
const PlanesGrid = styled.div`
    display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;
`;
const PlanCard = styled.div`
    border-radius: 14px; padding: 16px 14px;
    border: 2px solid ${({ $activo, $color }) => $activo ? $color : "transparent"};
    background: ${({ $activo, $color, theme }) => $activo ? `${$color}15` : theme.bgtotal};
    cursor: pointer; text-align: left;
    transition: border-color 0.15s, background 0.15s;
    &:hover { border-color: ${({ $color }) => $color}; }
`;
const PlanCardTop = styled.div`display: flex; align-items: center; gap: 8px; margin-bottom: 8px;`;
const PlanCardLabel = styled.div`font-size: 14px; font-weight: 800; color: ${({ theme }) => theme.text};`;
const PlanIncluyePreview = styled.div`
    display: flex; flex-direction: column; gap: 2px;
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
    margin-bottom: 8px;
`;
const PlanCardPrecios = styled.div`
    display: flex; flex-direction: column; gap: 3px;
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
    b { color: ${({ theme }) => theme.text}; }
`;

/* ── Períodos ───────────────────────────────────────────────── */
const PeriodosRow = styled.div`display: flex; gap: 12px; flex-wrap: wrap;`;
const PeriodBtn = styled.button`
    flex: 1; min-width: 120px; padding: 14px 12px; border-radius: 12px;
    border: 2px solid ${({ $activo, theme }) => $activo ? "#60a5fa" : theme.color2};
    background: ${({ $activo }) => $activo ? "rgba(96,165,250,0.12)" : "transparent"};
    color: ${({ theme }) => theme.text};
    cursor: pointer; font-weight: 700; font-size: 14px;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    transition: border-color 0.15s;
    &:hover { border-color: #60a5fa; }
`;
const PeriodoPrecio = styled.span`font-size: 16px; font-weight: 900; color: #60a5fa;`;

/* ── Resumen ────────────────────────────────────────────────── */
const ResumenCard = styled.div`
    margin-top: 24px; border-radius: 14px; padding: 20px;
    background: rgba(96,165,250,0.06); border: 1.5px solid rgba(96,165,250,0.2);
`;
const ResumenTitle = styled.div`
    font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
    color: #60a5fa; margin-bottom: 14px;
`;
const ResumenFila = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    font-size: 14px; color: ${({ theme }) => theme.text}; padding: 6px 0;
`;
const InstCheck = styled.div`
    display: flex; align-items: center; gap: 8px;
    input { accent-color: #60a5fa; width: 16px; height: 16px; cursor: pointer; }
    label { cursor: pointer; font-size: 14px; color: ${({ theme }) => theme.text}; }
`;
const ResumenDivider = styled.div`height: 1px; background: rgba(96,165,250,0.2); margin: 10px 0;`;
const ResumenTotal = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    font-size: 14px; font-weight: 700; color: ${({ theme }) => theme.text};
`;
const TotalMonto = styled.span`font-size: 26px; font-weight: 900; color: #60a5fa;`;
const BtnConfirmar = styled.button`
    display: flex; align-items: center; gap: 10px; justify-content: center;
    width: 100%; margin-top: 20px; padding: 15px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #60a5fa, #3b82f6);
    color: #fff; font-weight: 800; font-size: 15px; cursor: pointer;
    box-shadow: 0 4px 16px rgba(96,165,250,0.35);
    transition: opacity 0.15s, transform 0.1s;
    &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
