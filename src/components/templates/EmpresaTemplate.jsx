import { useState, useEffect } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { toastExito } from "../../utils/toast";

const TABS = ["Básico", "Moneda"];

const MONEDAS = [
    { pais: "Colombia",       bandera: "🇨🇴", simbolo: "COP", nombre: "Peso colombiano" },
    { pais: "Estados Unidos", bandera: "🇺🇸", simbolo: "USD", nombre: "Dólar estadounidense" },
];

export function EmpresaTemplate() {
    const [tabActivo, setTabActivo] = useState("Básico");
    const { dataempresa, editarempresa } = useEmpresaStore();
    const queryClient = useQueryClient();

    const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

    useEffect(() => {
        if (dataempresa) {
            reset({
                razon_social:    dataempresa.razon_social  ?? "",
                direccion:       dataempresa.direccion      ?? "",
                tipo_impuesto:   dataempresa.tipo_impuesto  ?? "IVA",
                valor_impuesto:  dataempresa.valor_impuesto ?? 19,
                telefono:        dataempresa.telefono       ?? "",
                email:           dataempresa.email          ?? "",
            });
        }
    }, [dataempresa, reset]);

    const mutation = useMutation({
        mutationFn: (valores) => editarempresa({ id: dataempresa.id, ...valores }),
        onSuccess: () => {
            toastExito("Empresa actualizada correctamente", "Empresa › Básico");
            queryClient.invalidateQueries(["Mostrar Empresa"]);
        },
    });

    const monedaActual = MONEDAS.find(m => m.simbolo === dataempresa?.moneda) ?? MONEDAS[0];

    const seleccionarMoneda = async (m) => {
        await editarempresa({ id: dataempresa.id, moneda: m.simbolo });
        toastExito(`Moneda cambiada a ${m.nombre}`, "Empresa › Moneda");
        queryClient.invalidateQueries(["Mostrar Empresa"]);
    };

    return (
        <Layout>
            <Main>
                {/* Banner */}
                <Banner>
                    <BannerBg />
                    <BannerNombre>{dataempresa?.razon_social ?? "Mi empresa"}</BannerNombre>
                </Banner>

                {tabActivo === "Básico" && (
                    <Form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
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
                                <label>Tipo impuesto</label>
                                <input {...register("tipo_impuesto")} placeholder="IVA" />
                            </Grupo>
                            <Grupo>
                                <label>Valor impuesto (%)</label>
                                <input type="number" {...register("valor_impuesto")} placeholder="19" />
                            </Grupo>
                        </FilaDos>
                        <BtnGuardar type="submit" disabled={mutation.isPending || !isDirty}>
                            {mutation.isPending ? "Guardando..." : "GUARDAR CAMBIOS"}
                        </BtnGuardar>
                    </Form>
                )}

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
                                <FilaMoneda
                                    key={m.pais}
                                    $activo={m.simbolo === (dataempresa?.moneda ?? "COP")}
                                    onClick={() => seleccionarMoneda(m)}
                                >
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
            </Main>

            {/* Panel de tabs lateral */}
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

/* ── Styled Components ─────────────────────────────────── */

const Layout = styled.div`
    display: flex;
    gap: 20px;
    padding: 24px 20px;
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    box-sizing: border-box;
    align-items: flex-start;
`;

const Main = styled.div`
    flex: 1;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const Banner = styled.div`
    position: relative;
    height: 110px;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const BannerBg = styled.div`
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%);
    opacity: 0.9;
`;

const BannerNombre = styled.span`
    position: relative;
    z-index: 1;
    color: #fff;
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.3);
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const Grupo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;

    label {
        font-size: 12px;
        font-weight: 600;
        color: ${({ theme }) => theme.colorsubtitlecard};
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }

    input {
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid ${({ theme }) => theme.color2};
        background: ${({ theme }) => theme.bgcards};
        color: ${({ theme }) => theme.text};
        font-size: 14px;
        font-family: "Poppins", sans-serif;
        outline: none;
        transition: border-color 0.2s;
        &:focus { border-color: #4f46e5; }
    }
`;

const FilaDos = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
`;

const BtnGuardar = styled.button`
    padding: 12px;
    border-radius: 12px;
    border: 2px solid ${({ disabled }) => disabled ? "#555" : "#3730a3"};
    background: ${({ disabled }) => disabled ? "rgba(150,150,150,0.2)" : "#4f46e5"};
    color: ${({ disabled }) => disabled ? "rgba(255,255,255,0.3)" : "#fff"};
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.5px;
    cursor: ${({ disabled }) => disabled ? "not-allowed" : "pointer"};
    box-shadow: ${({ disabled }) => disabled ? "none" : "4px 4px 0 #3730a3"};
    transition: box-shadow 0.1s, transform 0.1s;
    &:active {
        ${({ disabled }) => !disabled && "box-shadow: 2px 2px 0 #3730a3; transform: translate(2px,2px);"}
    }
`;

const Aviso = styled.p`
    font-size: 12px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    padding: 10px 14px;
    border-radius: 10px;
    margin: 0;
`;

/* ── Moneda ─────────────────────────────────────────────── */

const PanelMoneda = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const InputBuscar = styled.input`
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards};
    color: ${({ theme }) => theme.text};
    font-size: 14px;
    font-family: "Poppins", sans-serif;
    outline: none;
    &:focus { border-color: #4f46e5; }
`;

const MonedaActual = styled.div`
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
    padding: 12px;
    background: ${({ theme }) => theme.bgcards};

    .label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: ${({ theme }) => theme.colorsubtitlecard};
        letter-spacing: 0.4px;
        display: block;
        margin-bottom: 8px;
    }
`;

const ListaMonedas = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const FilaMoneda = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 10px;
    cursor: pointer;
    background: ${({ $activo, theme }) => $activo ? "rgba(79,70,229,0.15)" : theme.bgcards};
    border: 1px solid ${({ $activo }) => $activo ? "#4f46e5" : "transparent"};
    transition: background 0.15s, border-color 0.15s;

    &:hover { background: ${({ theme }) => theme.bgAlpha}; }

    .bandera { font-size: 24px; }
    div { display: flex; flex-direction: column; }
    .pais { font-size: 14px; font-weight: 700; color: ${({ theme }) => theme.text}; }
    .simbolo { font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard}; }
`;

/* ── Panel tabs ─────────────────────────────────────────── */

const PanelTabs = styled.div`
    width: 180px;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
    padding: 14px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
`;

const TabTitulo = styled.span`
    font-size: 13px;
    font-weight: 800;
    color: ${({ theme }) => theme.text};
    padding: 4px 8px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    margin-bottom: 4px;
`;

const TabItem = styled.button`
    padding: 9px 12px;
    border-radius: 8px;
    border: none;
    background: ${({ $activo }) => $activo ? "rgba(96,165,250,0.15)" : "transparent"};
    color: ${({ $activo }) => $activo ? "#60a5fa" : "inherit"};
    font-size: 13px;
    font-weight: ${({ $activo }) => $activo ? "700" : "500"};
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
    &:hover { background: ${({ theme }) => theme?.bgAlpha ?? "rgba(150,150,150,0.08)"}; }
`;
