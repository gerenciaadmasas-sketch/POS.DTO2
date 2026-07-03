import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { InsertarCliente } from "../../supabase/crudClientes";
import { EditarEmpresa } from "../../supabase/crudEmpresa";
import { toastExito } from "../../utils/toast";
import { RiAddLine, RiCloseLine, RiSettingsLine, RiCheckLine, RiTvLine, RiCalendarLine, RiMapPinLine, RiPhoneLine, RiUserLine, RiWifiLine, RiArrowRightLine } from "react-icons/ri";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";

/* ── Constantes ─────────────────────────────────────────────── */
const PLANES = [
    { key: "basico",      label: "Básico",      icon: "solar:star-bold-duotone",         color: "#94a3b8" },
    { key: "estandar",    label: "Estándar",    icon: "solar:star-shine-bold-duotone",    color: "#60a5fa" },
    { key: "premium",     label: "Premium",     icon: "solar:crown-bold-duotone",         color: "#f59e0b" },
    { key: "empresarial", label: "Empresarial", icon: "solar:buildings-bold-duotone",     color: "#a78bfa" },
];

const PERIODOS = [
    { key: "mensual",    label: "Mensual",    meses: 1  },
    { key: "semestral",  label: "Semestral",  meses: 6  },
    { key: "anual",      label: "Anual",      meses: 12 },
];

const DECODERS = ["HD Basic", "HD Plus", "4K Ultra", "Android TV", "Otro"];

const PLANES_DEFAULT = {
    basico:      { mensual: 0, semestral: 0, anual: 0 },
    estandar:    { mensual: 0, semestral: 0, anual: 0 },
    premium:     { mensual: 0, semestral: 0, anual: 0 },
    empresarial: { mensual: 0, semestral: 0, anual: 0 },
};

function fmtMoney(v) {
    if (!v && v !== 0) return "—";
    return `$${Number(v).toLocaleString("es-CO")}`;
}

function calcVencimiento(diasDesdeHoy, periodo) {
    const d = new Date();
    const meses = PERIODOS.find(p => p.key === periodo)?.meses ?? 1;
    d.setMonth(d.getMonth() + meses);
    return d.toISOString().split("T")[0];
}

/* ════════════════════════════════════════════════════════════ */
export function TVPosTemplate() {
    const { dataempresa, setEmpresa } = useEmpresaStore();
    const qc = useQueryClient();
    const datosExtra  = dataempresa?.datos_extra ?? {};
    const planesGuard = datosExtra.planes_tv ?? PLANES_DEFAULT;
    const costoInst   = datosExtra.costo_instalacion ?? 0;

    /* ── Estados ────────────────────────────────────────────── */
    const [vista, setVista]         = useState("nuevo");    // "nuevo" | "config"
    const [paso, setPaso]           = useState(1);          // 1=info cliente, 2=plan+pago

    // Formulario cliente
    const [form, setForm] = useState({
        nombre: "", apellido: "", telefono: "", email: "",
        documento: "", direccion: "", decoder: "HD Basic", decoder_serial: "",
        notas: "",
    });

    // Selección plan/periodo
    const [planSel,    setPlanSel]    = useState("basico");
    const [periodoSel, setPeriodoSel] = useState("mensual");
    const [conInstal,  setConInstal]  = useState(true);

    // Config de planes
    const [planes,     setPlanes]     = useState(planesGuard);
    const [costInst,   setCostInst]   = useState(costoInst);

    /* ── Cálculos pago ──────────────────────────────────────── */
    const precioPlan  = planes[planSel]?.[periodoSel] ?? 0;
    const totalPagar  = Number(precioPlan) + (conInstal ? Number(costInst) : 0);

    /* ── Mutación crear suscriptor ──────────────────────────── */
    const mutCrear = useMutation({
        mutationFn: () => InsertarCliente({
            id_empresa: dataempresa?.id,
            nombre:     form.nombre.trim(),
            apellido:   form.apellido.trim() || null,
            telefono:   form.telefono || null,
            email:      form.email    || null,
            documento:  form.documento || null,
            datos_extra: {
                direccion:        form.direccion,
                decoder_tipo:     form.decoder,
                decoder_serial:   form.decoder_serial,
                plan_nombre:      planSel,
                periodo:          periodoSel,
                fecha_instalacion: new Date().toISOString().split("T")[0],
                fecha_vencimiento: calcVencimiento(new Date(), periodoSel),
                costo_instalacion: conInstal ? Number(costInst) : 0,
                precio_plan:      Number(precioPlan),
                total_cobrado:    totalPagar,
                notas:            form.notas,
            },
        }),
        onSuccess: () => {
            toastExito("Suscriptor registrado y pago confirmado", "TV Praceros");
            qc.invalidateQueries({ queryKey: ["suscriptores-tv", dataempresa?.id] });
            resetForm();
        },
    });

    /* ── Mutación guardar config planes ─────────────────────── */
    const mutConfig = useMutation({
        mutationFn: () => EditarEmpresa({
            id: dataempresa.id,
            datos_extra: {
                ...datosExtra,
                planes_tv:           planes,
                costo_instalacion:   Number(costInst),
            },
        }),
        onSuccess: (updated) => {
            if (updated) setEmpresa(updated);
            toastExito("Precios actualizados", "Configuración TV");
            setVista("nuevo");
        },
    });

    function resetForm() {
        setForm({ nombre: "", apellido: "", telefono: "", email: "", documento: "", direccion: "", decoder: "HD Basic", decoder_serial: "", notas: "" });
        setPlanSel("basico");
        setPeriodoSel("mensual");
        setConInstal(true);
        setPaso(1);
    }

    function handleF(e) {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
    }

    function avanzar() {
        if (!form.nombre.trim()) {
            Swal.fire({ title: "Falta el nombre", icon: "warning", confirmButtonColor: "#60a5fa", customClass: { popup: "swal-pos" } });
            return;
        }
        setPaso(2);
    }

    function confirmarPago() {
        const planLabel    = PLANES.find(p => p.key === planSel)?.label ?? planSel;
        const periodoLabel = PERIODOS.find(p => p.key === periodoSel)?.label ?? periodoSel;
        Swal.fire({
            title: "Confirmar pago",
            html: `
                <div style="text-align:left;font-size:14px;line-height:1.9">
                    <b>Cliente:</b> ${form.nombre} ${form.apellido}<br/>
                    <b>Plan:</b> ${planLabel} · ${periodoLabel}<br/>
                    ${conInstal ? `<b>Instalación:</b> ${fmtMoney(costInst)}<br/>` : ""}
                    <b>Plan:</b> ${fmtMoney(precioPlan)}<br/>
                    <hr style="margin:10px 0;opacity:0.2"/>
                    <b style="font-size:18px;color:#60a5fa">Total: ${fmtMoney(totalPagar)}</b>
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

    function setPrecio(plan, periodo, val) {
        setPlanes(p => ({ ...p, [plan]: { ...p[plan], [periodo]: val } }));
    }

    /* ── Render ─────────────────────────────────────────────── */
    return (
        <Wrap>
            {/* ── Header ───────────────────────────────────────── */}
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
                    {vista === "config" ? "Cancelar" : "Precios & Planes"}
                </BtnConfig>
            </Header>

            {/* ══════════ VISTA: CONFIGURACIÓN ══════════════════ */}
            {vista === "config" && (
                <ConfigWrap>
                    <ConfigTitle>
                        <Icon icon="solar:settings-bold-duotone" style={{ fontSize: 20, color: "#60a5fa" }} />
                        Configurar precios de planes
                    </ConfigTitle>
                    <ConfigTable>
                        <thead>
                            <tr>
                                <Th>Plan</Th>
                                <Th>Mensual</Th>
                                <Th>Semestral</Th>
                                <Th>Anual</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {PLANES.map(p => (
                                <tr key={p.key}>
                                    <Td><PlanTag style={{ color: p.color }}>● {p.label}</PlanTag></Td>
                                    {PERIODOS.map(per => (
                                        <Td key={per.key}>
                                            <PriceInput
                                                type="number" min="0"
                                                value={planes[p.key]?.[per.key] ?? 0}
                                                onChange={e => setPrecio(p.key, per.key, e.target.value)}
                                                placeholder="0"
                                            />
                                        </Td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </ConfigTable>
                    <InstRow>
                        <label>Costo de instalación (único):</label>
                        <PriceInput
                            type="number" min="0"
                            value={costInst}
                            onChange={e => setCostInst(e.target.value)}
                            style={{ maxWidth: 140 }}
                        />
                    </InstRow>
                    <BtnGuardarConfig onClick={() => mutConfig.mutate()} disabled={mutConfig.isPending}>
                        <RiCheckLine /> {mutConfig.isPending ? "Guardando..." : "Guardar precios"}
                    </BtnGuardarConfig>
                </ConfigWrap>
            )}

            {/* ══════════ VISTA: NUEVO SUSCRIPTOR ══════════════ */}
            {vista === "nuevo" && (
                <FormWrap>
                    {/* Paso 1: Datos del cliente */}
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

                    {/* Paso 2: Plan + Pago */}
                    {paso === 2 && (
                        <>
                            <BackBtn onClick={() => setPaso(1)}>← Volver</BackBtn>
                            <SeccionTitulo><RiWifiLine /> Seleccionar plan</SeccionTitulo>
                            <PlanesGrid>
                                {PLANES.map(p => (
                                    <PlanCard
                                        key={p.key}
                                        $activo={planSel === p.key}
                                        $color={p.color}
                                        onClick={() => setPlanSel(p.key)}
                                    >
                                        <Icon icon={p.icon} style={{ fontSize: 28, color: p.color }} />
                                        <PlanCardLabel>{p.label}</PlanCardLabel>
                                        <PlanCardPrecios>
                                            {PERIODOS.map(per => (
                                                <span key={per.key}>
                                                    {per.label}: <b>{fmtMoney(planes[p.key]?.[per.key] ?? 0)}</b>
                                                </span>
                                            ))}
                                        </PlanCardPrecios>
                                    </PlanCard>
                                ))}
                            </PlanesGrid>

                            <SeccionTitulo style={{ marginTop: 24 }}><RiCalendarLine /> Período de pago</SeccionTitulo>
                            <PeriodosRow>
                                {PERIODOS.map(p => (
                                    <PeriodBtn
                                        key={p.key}
                                        $activo={periodoSel === p.key}
                                        onClick={() => setPeriodoSel(p.key)}
                                    >
                                        {p.label}
                                        <PeriodoPrecio>{fmtMoney(planes[planSel]?.[p.key] ?? 0)}</PeriodoPrecio>
                                    </PeriodBtn>
                                ))}
                            </PeriodosRow>

                            {/* Resumen de pago */}
                            <ResumenCard>
                                <ResumenTitle>Resumen del cobro</ResumenTitle>
                                <ResumenFila>
                                    <span>Plan {PLANES.find(p=>p.key===planSel)?.label} · {PERIODOS.find(p=>p.key===periodoSel)?.label}</span>
                                    <b>{fmtMoney(precioPlan)}</b>
                                </ResumenFila>
                                <ResumenFila>
                                    <InstCheck>
                                        <input
                                            type="checkbox"
                                            id="conInstal"
                                            checked={conInstal}
                                            onChange={e => setConInstal(e.target.checked)}
                                        />
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

                            <BtnConfirmar onClick={confirmarPago} disabled={mutCrear.isPending}>
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
    max-width: 820px;
    margin: 0 auto;
    padding: 24px 16px 48px;
    animation: ${fadeIn} 0.3s ease;
`;

const Header = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
    margin-bottom: 28px;
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
    background: rgba(96,165,250,0.07);
    color: #60a5fa; font-weight: 700; font-size: 13px; cursor: pointer;
    transition: background 0.15s;
    &:hover { background: rgba(96,165,250,0.15); }
`;

/* Config */
const ConfigWrap = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 16px; padding: 24px;
    animation: ${fadeIn} 0.25s ease;
`;

const ConfigTitle = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 15px; font-weight: 800;
    color: ${({ theme }) => theme.text};
    margin-bottom: 20px;
`;

const ConfigTable = styled.table`
    width: 100%; border-collapse: collapse; margin-bottom: 20px;
`;

const Th = styled.th`
    text-align: left; padding: 8px 12px;
    font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const Td = styled.td`
    padding: 10px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const PlanTag = styled.span`font-weight: 700; font-size: 13px;`;

const PriceInput = styled.input`
    width: 100px; padding: 7px 10px;
    border-radius: 8px; border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 13px; font-weight: 600;
    &:focus { outline: none; border-color: #60a5fa; }
`;

const InstRow = styled.div`
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 20px;
    label { font-size: 13px; font-weight: 700; color: ${({ theme }) => theme.text}; }
`;

const BtnGuardarConfig = styled.button`
    display: flex; align-items: center; gap: 8px;
    padding: 11px 22px; border-radius: 10px; border: none;
    background: #60a5fa; color: #fff;
    font-weight: 800; font-size: 14px; cursor: pointer;
    transition: opacity 0.15s;
    &:disabled { opacity: 0.6; cursor: not-allowed; }
    &:hover:not(:disabled) { opacity: 0.88; }
`;

/* Formulario */
const FormWrap = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 16px; padding: 28px;
    animation: ${fadeIn} 0.25s ease;
`;

const SeccionTitulo = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
    color: #60a5fa; margin-bottom: 16px;
`;

const Grid2 = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
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
    width: 100%; margin-top: 24px;
    padding: 13px; border-radius: 12px; border: none;
    background: #60a5fa; color: #fff;
    font-weight: 800; font-size: 15px; cursor: pointer;
    transition: opacity 0.15s;
    &:hover { opacity: 0.88; }
`;

const BackBtn = styled.button`
    background: none; border: none; cursor: pointer;
    color: #60a5fa; font-size: 13px; font-weight: 700;
    margin-bottom: 16px; padding: 0;
    &:hover { text-decoration: underline; }
`;

/* Planes */
const PlanesGrid = styled.div`
    display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px;
`;

const PlanCard = styled.div`
    border-radius: 14px; padding: 16px 14px;
    border: 2px solid ${({ $activo, $color }) => $activo ? $color : "transparent"};
    background: ${({ $activo, $color }) => $activo ? `${$color}15` : ({ theme }) => theme.bgtotal};
    cursor: pointer; text-align: center;
    transition: border-color 0.15s, background 0.15s;
    &:hover { border-color: ${({ $color }) => $color}; }
`;

const PlanCardLabel = styled.div`
    font-size: 14px; font-weight: 800;
    color: ${({ theme }) => theme.text};
    margin: 6px 0 8px;
`;

const PlanCardPrecios = styled.div`
    display: flex; flex-direction: column; gap: 3px;
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
    b { color: ${({ theme }) => theme.text}; }
`;

/* Períodos */
const PeriodosRow = styled.div`display: flex; gap: 12px; flex-wrap: wrap;`;

const PeriodBtn = styled.button`
    flex: 1; min-width: 120px;
    padding: 14px 12px; border-radius: 12px;
    border: 2px solid ${({ $activo }) => $activo ? "#60a5fa" : ({ theme }) => theme.color2};
    background: ${({ $activo }) => $activo ? "rgba(96,165,250,0.12)" : "transparent"};
    color: ${({ theme }) => theme.text};
    cursor: pointer; font-weight: 700; font-size: 14px;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    transition: border-color 0.15s, background 0.15s;
    &:hover { border-color: #60a5fa; }
`;

const PeriodoPrecio = styled.span`
    font-size: 16px; font-weight: 900; color: #60a5fa;
`;

/* Resumen */
const ResumenCard = styled.div`
    margin-top: 24px;
    border-radius: 14px; padding: 20px;
    background: rgba(96,165,250,0.06);
    border: 1.5px solid rgba(96,165,250,0.2);
`;

const ResumenTitle = styled.div`
    font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
    color: #60a5fa; margin-bottom: 14px;
`;

const ResumenFila = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    font-size: 14px; color: ${({ theme }) => theme.text};
    padding: 6px 0;
`;

const InstCheck = styled.div`
    display: flex; align-items: center; gap: 8px;
    input { accent-color: #60a5fa; width: 16px; height: 16px; cursor: pointer; }
    label { cursor: pointer; font-size: 14px; color: ${({ theme }) => theme.text}; }
`;

const ResumenDivider = styled.div`
    height: 1px; background: rgba(96,165,250,0.2); margin: 10px 0;
`;

const ResumenTotal = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    font-size: 14px; font-weight: 700; color: ${({ theme }) => theme.text};
`;

const TotalMonto = styled.span`
    font-size: 26px; font-weight: 900; color: #60a5fa;
`;

const BtnConfirmar = styled.button`
    display: flex; align-items: center; gap: 10px; justify-content: center;
    width: 100%; margin-top: 20px;
    padding: 15px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #60a5fa, #3b82f6);
    color: #fff; font-weight: 800; font-size: 15px; cursor: pointer;
    box-shadow: 0 4px 16px rgba(96,165,250,0.35);
    transition: opacity 0.15s, transform 0.1s;
    &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    &:active { transform: translateY(0); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
