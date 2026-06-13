import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { toastExito } from "../../utils/toast";

const TABS = ["Básico", "Moneda", "Impuestos"];

const MONEDAS = [
    { pais: "Colombia",       bandera: "🇨🇴", simbolo: "COP", nombre: "Peso colombiano" },
    { pais: "Estados Unidos", bandera: "🇺🇸", simbolo: "USD", nombre: "Dólar estadounidense" },
];

const RESPONSABILIDADES = [
    { codigo: "IVA_19",    nombre: "IVA — 19%",                   desc: "Tarifa general del Impuesto al Valor Agregado",          valorDefault: 19,   unidad: "%" },
    { codigo: "IVA_5",     nombre: "IVA diferencial — 5%",        desc: "Bienes y servicios gravados a tarifa reducida",           valorDefault: 5,    unidad: "%" },
    { codigo: "INC_REST",  nombre: "INC — Restaurantes",          desc: "Impuesto Nacional al Consumo en restaurantes",            valorDefault: 8,    unidad: "%" },
    { codigo: "INC_BARES", nombre: "INC — Bares y similares",     desc: "Impuesto Nacional al Consumo en bares y discotecas",      valorDefault: 8,    unidad: "%" },
    { codigo: "INC_BOLSA", nombre: "INC — Bolsas plásticas",      desc: "Por unidad de bolsa entregada al consumidor",             valorDefault: 66,   unidad: "$" },
    { codigo: "INC_JUEGOS",nombre: "INC — Juegos de azar",        desc: "Impuesto Nacional al Consumo en juegos de suerte",        valorDefault: 3,    unidad: "%" },
    { codigo: "RTEFUENTE", nombre: "Retención en la fuente",      desc: "Agente retenedor del impuesto de renta",                  valorDefault: 3.5,  unidad: "%" },
    { codigo: "RTEIVA",    nombre: "Retención de IVA",            desc: "15% del IVA facturado — agente retenedor",                valorDefault: 15,   unidad: "%" },
    { codigo: "ICA",       nombre: "ICA",                         desc: "Industria y Comercio — varía por municipio",              valorDefault: 0.7,  unidad: "%" },
    { codigo: "RTEICA",    nombre: "Retención de ICA",            desc: "Agente retenedor del ICA",                                valorDefault: 0.7,  unidad: "%" },
    { codigo: "RST",       nombre: "Régimen Simple (RST)",        desc: "Régimen Simple de Tributación — DIAN",                    valorDefault: 2,    unidad: "%" },
    { codigo: "AUTORRTE",  nombre: "Autorretenedor",              desc: "Autorretención especial en renta",                        valorDefault: 0.8,  unidad: "%" },
    { codigo: "GRAN_CONT", nombre: "Gran contribuyente",          desc: "Calificado por la DIAN como gran contribuyente",          valorDefault: 0,    unidad: "-" },
];

function buildRegimenInicial(guardado = []) {
    return RESPONSABILIDADES.map(r => {
        const existente = guardado.find(g => g.codigo === r.codigo);
        return {
            codigo:  r.codigo,
            activo:  existente?.activo  ?? false,
            valor:   existente?.valor   ?? r.valorDefault,
            unidad:  existente?.unidad  ?? r.unidad,
        };
    });
}

export function EmpresaTemplate() {
    const [tabActivo, setTabActivo] = useState("Básico");
    const { dataempresa, editarempresa } = useEmpresaStore();
    const queryClient = useQueryClient();

    /* ── Estado impuestos ── */
    const [responsable, setResponsable] = useState(false);
    const [regimenes,   setRegimenes]   = useState(buildRegimenInicial([]));

    const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

    useEffect(() => {
        if (dataempresa) {
            reset({
                razon_social:  dataempresa.razon_social ?? "",
                direccion:     dataempresa.direccion    ?? "",
                telefono:      dataempresa.telefono     ?? "",
                email:         dataempresa.email        ?? "",
            });
            const imp = dataempresa.impuestos ?? {};
            setResponsable(imp.responsable ?? false);
            setRegimenes(buildRegimenInicial(imp.regimenes ?? []));
        }
    }, [dataempresa, reset]);

    /* ── Mutaciones ── */
    const mutBasico = useMutation({
        mutationFn: (v) => editarempresa({ id: dataempresa.id, ...v }),
        onSuccess:  () => { toastExito("Empresa actualizada", "Empresa › Básico"); queryClient.invalidateQueries(["Mostrar Empresa"]); },
    });

    const mutMoneda = async (m) => {
        await editarempresa({ id: dataempresa.id, moneda: m.simbolo });
        toastExito(`Moneda cambiada a ${m.nombre}`, "Empresa › Moneda");
        queryClient.invalidateQueries(["Mostrar Empresa"]);
    };

    const mutImpuestos = useMutation({
        mutationFn: () => editarempresa({
            id: dataempresa.id,
            impuestos: {
                responsable,
                regimenes: regimenes.filter(r => r.activo).map(r => ({
                    codigo: r.codigo,
                    nombre: RESPONSABILIDADES.find(x => x.codigo === r.codigo)?.nombre ?? r.codigo,
                    activo: true,
                    valor:  r.valor,
                    unidad: r.unidad,
                })),
            },
        }),
        onSuccess: () => { toastExito("Configuración de impuestos guardada", "Empresa › Impuestos"); queryClient.invalidateQueries(["Mostrar Empresa"]); },
    });

    const toggleRegimen = (codigo) => {
        setRegimenes(prev => prev.map(r => r.codigo === codigo ? { ...r, activo: !r.activo } : r));
    };

    const cambiarValor = (codigo, valor) => {
        setRegimenes(prev => prev.map(r => r.codigo === codigo ? { ...r, valor: parseFloat(valor) || 0 } : r));
    };

    const monedaActual = MONEDAS.find(m => m.simbolo === dataempresa?.moneda) ?? MONEDAS[0];

    return (
        <Layout>
            <Main>
                {/* Banner */}
                <Banner>
                    <BannerBg />
                    <BannerNombre>{dataempresa?.razon_social ?? "Mi empresa"}</BannerNombre>
                </Banner>

                {/* ── Tab Básico ── */}
                {tabActivo === "Básico" && (
                    <Form onSubmit={handleSubmit(v => mutBasico.mutate(v))}>
                        <Grupo>
                            <label>Nombre de empresa</label>
                            <input {...register("razon_social", { required: true })} placeholder="Nombre" />
                        </Grupo>
                        <Grupo>
                            <label>Dirección</label>
                            <input {...register("direccion")} placeholder="Dirección" />
                        </Grupo>
                        <FilaDos>
                            <Grupo>
                                <label>Teléfono</label>
                                <input {...register("telefono")} placeholder="300 000 0000" />
                            </Grupo>
                            <Grupo>
                                <label>Email</label>
                                <input {...register("email")} placeholder="empresa@correo.com" />
                            </Grupo>
                        </FilaDos>
                        <BtnGuardar type="submit" disabled={mutBasico.isPending || !isDirty}>
                            {mutBasico.isPending ? "Guardando..." : "Guardar cambios"}
                        </BtnGuardar>
                    </Form>
                )}

                {/* ── Tab Moneda ── */}
                {tabActivo === "Moneda" && (
                    <PanelMoneda>
                        <MonedaActual>
                            <span className="label">Moneda actual</span>
                            <FilaMoneda $activo>
                                <span className="bandera">{monedaActual.bandera}</span>
                                <div>
                                    <span className="pais">{monedaActual.pais}</span>
                                    <span className="simbolo">{monedaActual.nombre} ({monedaActual.simbolo})</span>
                                </div>
                            </FilaMoneda>
                        </MonedaActual>
                        <ListaMonedas>
                            {MONEDAS.map(m => (
                                <FilaMoneda key={m.pais} $activo={m.simbolo === (dataempresa?.moneda ?? "COP")} onClick={() => mutMoneda(m)}>
                                    <span className="bandera">{m.bandera}</span>
                                    <div>
                                        <span className="pais">{m.pais}</span>
                                        <span className="simbolo">{m.nombre} ({m.simbolo})</span>
                                    </div>
                                </FilaMoneda>
                            ))}
                        </ListaMonedas>
                    </PanelMoneda>
                )}

                {/* ── Tab Impuestos ── */}
                {tabActivo === "Impuestos" && (
                    <PanelImpuestos>
                        {/* Switch responsable */}
                        <FilaSwitch>
                            <div>
                                <SwitchLabel>Responsable de impuestos</SwitchLabel>
                                <SwitchDesc>Activa si tu empresa declara o recauda impuestos ante la DIAN</SwitchDesc>
                            </div>
                            <Switch $activo={responsable} onClick={() => setResponsable(v => !v)}>
                                <SwitchThumb $activo={responsable} />
                            </Switch>
                        </FilaSwitch>

                        {responsable && (
                            <>
                                <Divider />
                                <ListaLabel>Selecciona las responsabilidades que aplican a tu empresa:</ListaLabel>

                                <ListaRegimenes>
                                    {RESPONSABILIDADES.map((r) => {
                                        const estado = regimenes.find(x => x.codigo === r.codigo);
                                        const activo = estado?.activo ?? false;
                                        return (
                                            <FilaRegimen key={r.codigo} $activo={activo} onClick={() => toggleRegimen(r.codigo)}>
                                                <CheckBox $activo={activo}>
                                                    {activo && <span>✓</span>}
                                                </CheckBox>
                                                <RegimenInfo>
                                                    <RegimenNombre>{r.nombre}</RegimenNombre>
                                                    <RegimenDesc>{r.desc}</RegimenDesc>
                                                </RegimenInfo>
                                                {activo && r.unidad !== "-" && (
                                                    <ValorWrap onClick={e => e.stopPropagation()}>
                                                        <ValorInput
                                                            type="number"
                                                            value={estado?.valor ?? r.valorDefault}
                                                            onChange={e => cambiarValor(r.codigo, e.target.value)}
                                                            min={0}
                                                        />
                                                        <ValorUnidad>{r.unidad}</ValorUnidad>
                                                    </ValorWrap>
                                                )}
                                            </FilaRegimen>
                                        );
                                    })}
                                </ListaRegimenes>

                                <ResumenActivos>
                                    {regimenes.filter(r => r.activo).length === 0
                                        ? <span className="ninguno">Ninguna responsabilidad seleccionada</span>
                                        : <>
                                            <span className="label">Activas:</span>
                                            {regimenes.filter(r => r.activo).map(r => (
                                                <PillActiva key={r.codigo}>
                                                    {RESPONSABILIDADES.find(x => x.codigo === r.codigo)?.nombre.split("—")[0].trim()}
                                                    {r.unidad !== "-" && <span> · {r.valor}{r.unidad}</span>}
                                                </PillActiva>
                                            ))}
                                        </>
                                    }
                                </ResumenActivos>
                            </>
                        )}

                        <BtnGuardar
                            type="button"
                            disabled={mutImpuestos.isPending}
                            onClick={() => mutImpuestos.mutate()}
                        >
                            {mutImpuestos.isPending ? "Guardando..." : "Guardar configuración"}
                        </BtnGuardar>
                    </PanelImpuestos>
                )}
            </Main>

            {/* Panel tabs lateral */}
            <PanelTabs>
                <TabTitulo>Empresa</TabTitulo>
                {TABS.map(t => (
                    <TabItem key={t} $activo={tabActivo === t} onClick={() => setTabActivo(t)}>
                        {t}
                    </TabItem>
                ))}
            </PanelTabs>
        </Layout>
    );
}

/* ── Animations ── */
const fadeUp = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}`;

/* ── Layout ── */
const Layout = styled.div`
    display: flex;
    gap: 20px;
    padding: 24px 20px;
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    box-sizing: border-box;
    align-items: flex-start;
    justify-content: center;

    @media (max-width: 767px) {
        padding: 68px 12px 20px;
        flex-direction: column;
    }
`;

const Main = styled.div`
    flex: 1;
    max-width: 560px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    animation: ${fadeUp} 0.3s ease;
`;

const Banner = styled.div`
    position: relative; height: 110px; border-radius: 16px;
    overflow: hidden; display: flex; align-items: center; justify-content: center;
`;

const BannerBg = styled.div`
    position: absolute; inset: 0;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%);
    opacity: 0.9;
`;

const BannerNombre = styled.span`
    position: relative; z-index: 1; color: #fff;
    font-size: 22px; font-weight: 900; letter-spacing: 0.5px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.3);
`;

/* ── Básico ── */
const Form = styled.form`display: flex; flex-direction: column; gap: 14px;`;

const Grupo = styled.div`
    display: flex; flex-direction: column; gap: 5px;
    label {
        font-size: 12px; font-weight: 600;
        color: ${({ theme }) => theme.colorsubtitlecard};
        text-transform: uppercase; letter-spacing: 0.4px;
    }
    input {
        padding: 10px 14px; border-radius: 10px;
        border: 1px solid ${({ theme }) => theme.color2};
        background: ${({ theme }) => theme.bgcards};
        color: ${({ theme }) => theme.text};
        font-size: 14px; font-family: "Poppins", sans-serif;
        outline: none; transition: border-color 0.2s;
        &:focus { border-color: #4f46e5; }
    }
`;

const FilaDos = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 12px;`;

const BtnGuardar = styled.button`
    padding: 12px; border-radius: 12px;
    border: 2px solid ${({ disabled }) => disabled ? "#555" : "#3730a3"};
    background: ${({ disabled }) => disabled ? "rgba(150,150,150,0.2)" : "#4f46e5"};
    color: ${({ disabled }) => disabled ? "rgba(255,255,255,0.3)" : "#fff"};
    font-size: 14px; font-weight: 800; letter-spacing: 0.5px;
    cursor: ${({ disabled }) => disabled ? "not-allowed" : "pointer"};
    box-shadow: ${({ disabled }) => disabled ? "none" : "4px 4px 0 #3730a3"};
    transition: box-shadow 0.1s, transform 0.1s;
    &:active { ${({ disabled }) => !disabled && "box-shadow: 2px 2px 0 #3730a3; transform: translate(2px,2px);"} }
`;

/* ── Moneda ── */
const PanelMoneda = styled.div`display: flex; flex-direction: column; gap: 14px;`;

const MonedaActual = styled.div`
    border: 1px solid ${({ theme }) => theme.color2}; border-radius: 12px;
    padding: 12px; background: ${({ theme }) => theme.bgcards};
    .label { font-size: 11px; font-weight: 700; text-transform: uppercase;
        color: ${({ theme }) => theme.colorsubtitlecard}; letter-spacing: 0.4px;
        display: block; margin-bottom: 8px; }
`;

const ListaMonedas = styled.div`display: flex; flex-direction: column; gap: 6px;`;

const FilaMoneda = styled.div`
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 10px; cursor: pointer;
    background: ${({ $activo, theme }) => $activo ? "rgba(79,70,229,0.15)" : theme.bgcards};
    border: 1px solid ${({ $activo }) => $activo ? "#4f46e5" : "transparent"};
    transition: background 0.15s, border-color 0.15s;
    &:hover { background: ${({ theme }) => theme.bgAlpha}; }
    .bandera { font-size: 24px; }
    div { display: flex; flex-direction: column; }
    .pais { font-size: 14px; font-weight: 700; color: ${({ theme }) => theme.text}; }
    .simbolo { font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard}; }
`;

/* ── Impuestos ── */
const PanelImpuestos = styled.div`
    display: flex; flex-direction: column; gap: 16px;
    animation: ${fadeUp} 0.25s ease;
`;

const FilaSwitch = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; padding: 16px;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
`;

const SwitchLabel = styled.div`
    font-size: 14px; font-weight: 800; color: ${({ theme }) => theme.text};
    margin-bottom: 3px;
`;

const SwitchDesc = styled.div`
    font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard}; line-height: 1.4;
`;

const Switch = styled.div`
    width: 48px; height: 26px; border-radius: 999px; flex-shrink: 0;
    background: ${({ $activo }) => $activo ? "#4f46e5" : "#374151"};
    cursor: pointer; position: relative;
    transition: background 0.2s;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
`;

const SwitchThumb = styled.div`
    position: absolute; top: 3px;
    left: ${({ $activo }) => $activo ? "25px" : "3px"};
    width: 20px; height: 20px; border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    transition: left 0.2s;
`;

const Divider = styled.div`height: 1px; background: ${({ theme }) => theme.color2};`;

const ListaLabel = styled.div`
    font-size: 12px; font-weight: 700;
    color: ${({ theme }) => theme.colorsubtitlecard};
    text-transform: uppercase; letter-spacing: 0.4px;
`;

const ListaRegimenes = styled.div`
    display: flex; flex-direction: column; gap: 6px;
    max-height: 420px; overflow-y: auto;
    padding-right: 4px;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colorScroll}; border-radius: 10px; }
`;

const FilaRegimen = styled.div`
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; border-radius: 12px; cursor: pointer;
    background: ${({ $activo, theme }) => $activo ? "rgba(79,70,229,0.1)" : theme.bgcards};
    border: 1.5px solid ${({ $activo }) => $activo ? "#4f46e5" : "transparent"};
    transition: all 0.15s;
    &:hover { border-color: ${({ $activo }) => $activo ? "#4f46e5" : "#4f46e580"}; }
`;

const CheckBox = styled.div`
    width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0;
    border: 2px solid ${({ $activo }) => $activo ? "#4f46e5" : "#4b5563"};
    background: ${({ $activo }) => $activo ? "#4f46e5" : "transparent"};
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 900; color: #fff;
    transition: all 0.15s;
`;

const RegimenInfo = styled.div`flex: 1; min-width: 0;`;
const RegimenNombre = styled.div`font-size: 13px; font-weight: 700; color: ${({ theme }) => theme.text};`;
const RegimenDesc   = styled.div`font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard}; margin-top: 2px;`;

const ValorWrap = styled.div`
    display: flex; align-items: center; gap: 4px; flex-shrink: 0;
`;

const ValorInput = styled.input`
    width: 64px; padding: 6px 8px; border-radius: 8px; text-align: right;
    border: 1.5px solid #4f46e5;
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 13px; font-weight: 700; font-family: "Poppins", sans-serif;
    outline: none;
    &:focus { border-color: #7c3aed; }
    /* sin flechas */
    -moz-appearance: textfield;
    &::-webkit-outer-spin-button, &::-webkit-inner-spin-button { -webkit-appearance: none; }
`;

const ValorUnidad = styled.span`
    font-size: 13px; font-weight: 700; color: #a78bfa; min-width: 16px;
`;

const ResumenActivos = styled.div`
    display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
    padding: 10px 14px; border-radius: 10px;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    min-height: 44px;
    .label { font-size: 11px; font-weight: 700; color: ${({ theme }) => theme.colorsubtitlecard}; text-transform: uppercase; }
    .ninguno { font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard}; }
`;

const PillActiva = styled.span`
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 700;
    background: rgba(79,70,229,0.15); color: #a78bfa;
    border: 1px solid rgba(79,70,229,0.3);
`;

/* ── Panel tabs ── */
const PanelTabs = styled.div`
    width: 180px; background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px; padding: 14px 12px;
    display: flex; flex-direction: column; gap: 4px; flex-shrink: 0;
`;

const TabTitulo = styled.span`
    font-size: 13px; font-weight: 800; color: ${({ theme }) => theme.text};
    padding: 4px 8px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    margin-bottom: 4px;
`;

const TabItem = styled.button`
    padding: 9px 12px; border-radius: 8px; border: none;
    background: ${({ $activo }) => $activo ? "rgba(96,165,250,0.15)" : "transparent"};
    color: ${({ $activo }) => $activo ? "#60a5fa" : "inherit"};
    font-size: 13px; font-weight: ${({ $activo }) => $activo ? "700" : "500"};
    cursor: pointer; text-align: left; transition: background 0.15s;
    &:hover { background: ${({ theme }) => theme?.bgAlpha ?? "rgba(150,150,150,0.08)"}; }
`;
