import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { RiPrinterLine, RiCheckLine, RiAlertLine, RiSettings3Line, RiInformationLine, RiTestTubeLine } from "react-icons/ri";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { toastExito } from "../../utils/toast";

const STORAGE_KEY = "pos_printer_config";

const defaultConfig = {
    nombre: "",
    ancho: "80",
    margenes: "0",
    copias: "1",
};

function loadConfig() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? { ...defaultConfig, ...JSON.parse(raw) } : defaultConfig;
    } catch {
        return defaultConfig;
    }
}

export function ImpresorasTemplate() {
    const { dataempresa } = useEmpresaStore();
    const [config, setConfig]   = useState(loadConfig);
    const [guardado, setGuardado] = useState(false);

    function cambiar(campo, val) {
        setConfig(prev => ({ ...prev, [campo]: val }));
        setGuardado(false);
    }

    function guardar() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        setGuardado(true);
        toastExito("Configuración guardada", "Impresora");
    }

    function imprimirPrueba() {
        const win = window.open("", "_blank", "width=320,height=500");
        const empresa = dataempresa?.razon_social ?? "Mi Empresa";
        win.document.write(`
            <html>
            <head>
                <title>Prueba de impresión</title>
                <style>
                    @page { size: ${config.ancho}mm auto; margin: ${config.margenes}mm; }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: monospace; font-size: 11px; width: ${config.ancho}mm; padding: 4mm; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .line { border-top: 1px dashed #000; margin: 4px 0; }
                    .titulo { font-size: 14px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="center bold titulo">${empresa}</div>
                <div class="line"></div>
                <div class="center">** PRUEBA DE IMPRESIÓN **</div>
                <div class="line"></div>
                <div>Impresora: ${config.nombre || "Sin nombre"}</div>
                <div>Ancho papel: ${config.ancho}mm</div>
                <div>Fecha: ${new Date().toLocaleString("es-CO")}</div>
                <div class="line"></div>
                <div class="center">Si ves este ticket,</div>
                <div class="center">la impresora está lista ✓</div>
                <div class="line"></div>
            </body>
            </html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 300);
    }

    return (
        <Page>
            <TopBar>
                <TitleGroup>
                    <RiPrinterLine className="icono" />
                    <div>
                        <h1>Impresoras</h1>
                        <p>Configura tu impresora térmica para tickets de venta</p>
                    </div>
                </TitleGroup>
                <StatusBadge $ok={guardado}>
                    {guardado ? <><RiCheckLine /> Guardado</> : <><RiAlertLine /> Sin guardar</>}
                </StatusBadge>
            </TopBar>

            <Grid>
                {/* Columna izquierda — configuración */}
                <SeccionCard>
                    <SeccionHeader>
                        <RiSettings3Line />
                        Configuración de impresora
                    </SeccionHeader>

                    <Campo>
                        <label>Nombre o alias de la impresora</label>
                        <Input
                            type="text"
                            placeholder="Ej: Térmica POS 80mm"
                            value={config.nombre}
                            onChange={e => cambiar("nombre", e.target.value)}
                        />
                        <Hint>Este nombre es solo de referencia interna</Hint>
                    </Campo>

                    <Campo>
                        <label>Ancho del papel</label>
                        <OpcionesRow>
                            {["58", "80"].map(w => (
                                <OpcionBtn
                                    key={w}
                                    $activo={config.ancho === w}
                                    onClick={() => cambiar("ancho", w)}
                                >
                                    {w} mm
                                </OpcionBtn>
                            ))}
                        </OpcionesRow>
                        <Hint>La mayoría de impresoras térmicas POS usan 80 mm</Hint>
                    </Campo>

                    <Campo>
                        <label>Márgenes del ticket</label>
                        <OpcionesRow>
                            {[{ val: "0", label: "Sin margen" }, { val: "3", label: "3 mm" }, { val: "5", label: "5 mm" }].map(o => (
                                <OpcionBtn
                                    key={o.val}
                                    $activo={config.margenes === o.val}
                                    onClick={() => cambiar("margenes", o.val)}
                                >
                                    {o.label}
                                </OpcionBtn>
                            ))}
                        </OpcionesRow>
                    </Campo>

                    <BotonesRow>
                        <BtnGuardar onClick={guardar}>
                            <RiCheckLine />
                            Guardar configuración
                        </BtnGuardar>
                        <BtnPrueba onClick={imprimirPrueba}>
                            <RiTestTubeLine />
                            Imprimir prueba
                        </BtnPrueba>
                    </BotonesRow>
                </SeccionCard>

                {/* Columna derecha — instrucciones */}
                <SeccionCard>
                    <SeccionHeader>
                        <RiInformationLine />
                        Cómo conectar tu impresora térmica
                    </SeccionHeader>

                    <PasosList>
                        <Paso>
                            <PasoNum>1</PasoNum>
                            <PasoTexto>
                                <strong>Conecta la impresora</strong> al computador mediante USB o Bluetooth según el modelo.
                            </PasoTexto>
                        </Paso>
                        <Paso>
                            <PasoNum>2</PasoNum>
                            <PasoTexto>
                                <strong>Instala los drivers</strong> del fabricante si el sistema operativo no la reconoce automáticamente.
                            </PasoTexto>
                        </Paso>
                        <Paso>
                            <PasoNum>3</PasoNum>
                            <PasoTexto>
                                <strong>Establécela como predeterminada</strong> en Configuración → Impresoras del sistema operativo.
                            </PasoTexto>
                        </Paso>
                        <Paso>
                            <PasoNum>4</PasoNum>
                            <PasoTexto>
                                <strong>Haz clic en "Imprimir prueba"</strong> para verificar que el ticket sale correctamente. Si el navegador abre el diálogo de impresión, selecciona tu impresora térmica.
                            </PasoTexto>
                        </Paso>
                        <Paso>
                            <PasoNum>5</PasoNum>
                            <PasoTexto>
                                En el diálogo del navegador activa <strong>"Sin márgenes"</strong> y desactiva los encabezados/pies de página para un ticket limpio.
                            </PasoTexto>
                        </Paso>
                    </PasosList>

                    <TipBox>
                        <RiInformationLine style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>
                            En Chrome puedes ir a <strong>chrome://settings/printers</strong> para gestionar impresoras y marcar la térmica como predeterminada de forma permanente.
                        </span>
                    </TipBox>
                </SeccionCard>
            </Grid>
        </Page>
    );
}

const fadeUp = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;

const Page = styled.div`
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    padding: 28px;
    display: flex; flex-direction: column; gap: 24px;
    animation: ${fadeUp} 0.3s ease;

    @media (max-width: 767px) { padding: 68px 14px 20px; }
`;

const TopBar = styled.div`
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
`;
const TitleGroup = styled.div`
    display: flex; align-items: center; gap: 14px;
    .icono { font-size: 36px; color: #f88533; }
    h1 { font-size: 22px; font-weight: 900; color: ${({ theme }) => theme.text}; margin: 0 0 3px; }
    p  { font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard}; margin: 0; }
`;
const StatusBadge = styled.div`
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
    color:       ${({ $ok }) => $ok ? "#4ade80" : "#fbbf24"};
    background:  ${({ $ok }) => $ok ? "rgba(74,222,128,0.12)" : "rgba(251,191,36,0.1)"};
    border: 1px solid ${({ $ok }) => $ok ? "rgba(74,222,128,0.3)" : "rgba(251,191,36,0.3)"};
    svg { font-size: 15px; }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;

    @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const SeccionCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 16px;
    padding: 24px;
    display: flex; flex-direction: column; gap: 20px;
`;
const SeccionHeader = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 800; color: ${({ theme }) => theme.text};
    svg { font-size: 18px; color: #f88533; }
`;

const Campo = styled.div`
    display: flex; flex-direction: column; gap: 7px;
    label {
        font-size: 11px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.6px; color: ${({ theme }) => theme.colorsubtitlecard};
    }
`;
const Input = styled.input`
    padding: 10px 14px; border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none;
    &:focus { border-color: #f88533; }
    &::placeholder { color: ${({ theme }) => theme.colorsubtitlecard}; opacity: 0.6; }
`;
const Hint = styled.span`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard}; opacity: 0.7;
`;
const OpcionesRow = styled.div`display: flex; gap: 8px; flex-wrap: wrap;`;
const OpcionBtn = styled.button`
    padding: 8px 18px; border-radius: 10px; font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: "Poppins", sans-serif;
    border: 1.5px solid ${({ $activo, theme }) => $activo ? "#f88533" : theme.color2};
    background: ${({ $activo }) => $activo ? "rgba(248,133,51,0.12)" : "transparent"};
    color: ${({ $activo, theme }) => $activo ? "#f88533" : theme.text};
    transition: all 0.15s;
    &:hover { border-color: #f88533; }
`;

const BotonesRow = styled.div`display: flex; gap: 10px; margin-top: 4px; flex-wrap: wrap;`;
const BtnGuardar = styled.button`
    flex: 1; min-width: 140px; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 11px 20px; border-radius: 10px; border: none;
    background: #f88533; color: #fff;
    font-size: 13px; font-weight: 700; cursor: pointer; font-family: "Poppins", sans-serif;
    transition: background 0.15s;
    &:hover { background: #e07520; }
`;
const BtnPrueba = styled.button`
    flex: 1; min-width: 140px; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 11px 20px; border-radius: 10px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: transparent; color: ${({ theme }) => theme.text};
    font-size: 13px; font-weight: 700; cursor: pointer; font-family: "Poppins", sans-serif;
    transition: all 0.15s;
    &:hover { border-color: #f88533; color: #f88533; }
`;

/* Pasos de instrucciones */
const PasosList = styled.div`display: flex; flex-direction: column; gap: 14px;`;
const Paso = styled.div`display: flex; align-items: flex-start; gap: 12px;`;
const PasoNum = styled.div`
    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
    background: rgba(248,133,51,0.15); color: #f88533;
    font-size: 12px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
`;
const PasoTexto = styled.p`
    font-size: 13px; color: ${({ theme }) => theme.text}; margin: 0; line-height: 1.5;
    strong { color: ${({ theme }) => theme.text}; }
`;
const TipBox = styled.div`
    display: flex; align-items: flex-start; gap: 10px;
    padding: 12px 14px; border-radius: 10px;
    background: rgba(37,99,235,0.07);
    border: 1px solid rgba(37,99,235,0.2);
    font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard};
    svg { color: #60a5fa; font-size: 15px; }
    strong { color: ${({ theme }) => theme.text}; }
`;
