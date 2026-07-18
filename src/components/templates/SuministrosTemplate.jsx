import { useState, useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import {
    MostrarSuministros,
    CrearSuministro,
    EditarSuministro,
    EliminarSuministro,
    RegistrarCompra,
    MostrarComprasSuministro,
} from "../../supabase/crudRestaurante";
import {
    RiAddLine,
    RiEditLine,
    RiDeleteBin6Line,
    RiShoppingCart2Line,
    RiAlertLine,
    RiHistoryLine,
    RiCloseLine,
    RiLoader4Line,
    RiStore2Line,
    RiPriceTag3Line,
    RiSearchLine,
    RiTruckLine,
} from "react-icons/ri";
import { BuscarProveedores } from "../../supabase/crudProveedores";

const UNIDADES = ["kg", "g", "litros", "ml", "unidades", "porciones", "cajas", "bolsas", "docenas"];

const cop = (v) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

const EMPTY_FORM = { nombre: "", unidad: "unidades", stock_minimo: 0, precio_promedio: "" };
const EMPTY_COMPRA = { cantidad: "", precio_total: "", proveedor: "" };

export function SuministrosTemplate() {
    const { dataempresa } = useEmpresaStore();
    const id_empresa = dataempresa?.id;
    const qc = useQueryClient();

    const [modalSuministro, setModalSuministro] = useState(false);
    const [modalCompra, setModalCompra]         = useState(null); // suministro seleccionado
    const [modalHistorial, setModalHistorial]   = useState(null);
    const [editando, setEditando]               = useState(null);
    const [form, setForm]   = useState(EMPTY_FORM);
    const [compra, setCompra] = useState(EMPTY_COMPRA);
    const [guardando, setGuardando] = useState(false);
    const [provBusq, setProvBusq]       = useState("");
    const [provSel, setProvSel]         = useState(null);
    const [provOpts, setProvOpts]       = useState([]);
    const [provLoading, setProvLoading] = useState(false);
    const provTimer = useRef(null);

    const { data: suministros = [], isLoading } = useQuery({
        queryKey: ["suministros", id_empresa],
        queryFn: () => MostrarSuministros({ id_empresa }),
        enabled: !!id_empresa,
    });

    const { data: historial = [], isLoading: loadHist } = useQuery({
        queryKey: ["compras-sum", modalHistorial?.id],
        queryFn: () => MostrarComprasSuministro({ id_suministro: modalHistorial?.id }),
        enabled: !!modalHistorial?.id,
        staleTime: 0,
        refetchOnMount: "always",
    });

    const ref          = () => qc.invalidateQueries({ queryKey: ["suministros", id_empresa] });
    const refHistorial = (id) => qc.invalidateQueries({ queryKey: ["compras-sum", id] });

    useEffect(() => {
        if (!provBusq.trim() || provSel) { setProvOpts([]); return; }
        clearTimeout(provTimer.current);
        provTimer.current = setTimeout(async () => {
            setProvLoading(true);
            const res = await BuscarProveedores({ id_empresa, busqueda: provBusq });
            setProvOpts(res ?? []);
            setProvLoading(false);
        }, 350);
        return () => clearTimeout(provTimer.current);
    }, [provBusq, id_empresa, provSel]);

    const abrirNuevo = useCallback(() => {
        setEditando(null);
        setForm(EMPTY_FORM);
        setModalSuministro(true);
    }, []);

    const abrirEditar = useCallback((s) => {
        setEditando(s);
        setForm({ nombre: s.nombre, unidad: s.unidad, stock_minimo: s.stock_minimo, precio_promedio: s.precio_promedio || "" });
        setModalSuministro(true);
    }, []);

    const guardarSuministro = useCallback(async () => {
        if (!form.nombre.trim()) return;
        setGuardando(true);
        try {
            const payload = {
                ...form,
                stock_minimo:    Number(form.stock_minimo) || 0,
                precio_promedio: Number(form.precio_promedio) || 0,
            };
            if (editando) {
                await EditarSuministro({ id: editando.id, ...payload });
            } else {
                await CrearSuministro({ id_empresa, ...payload });
            }
            ref(); setModalSuministro(false);
        } finally { setGuardando(false); }
    }, [form, editando, id_empresa]);

    const eliminarSuministro = useCallback(async (id) => {
        if (!window.confirm("¿Eliminar este suministro?")) return;
        await EliminarSuministro({ id });
        ref();
    }, []);

    const guardarCompra = useCallback(async () => {
        if (!compra.cantidad || !compra.precio_total || !modalCompra) return;
        setGuardando(true);
        try {
            const idSum = modalCompra.id;
            await RegistrarCompra({
                id_empresa,
                id_suministro: idSum,
                cantidad:     Number(compra.cantidad),
                precio_total: Number(compra.precio_total),
                proveedor:    provSel ? provSel.nombre : (provBusq.trim() || null),
                id_proveedor: provSel?.id ?? null,
            });
            ref(); refHistorial(idSum);
            setModalCompra(null); setCompra(EMPTY_COMPRA);
            setProvSel(null); setProvBusq(""); setProvOpts([]);
        } finally { setGuardando(false); }
    }, [compra, modalCompra, id_empresa]);

    const stockBajo = suministros.filter(s => s.stock_actual <= s.stock_minimo && s.stock_minimo > 0);

    return (
        <Page>
            <Header>
                <TitleRow>
                    <RiStore2Line size={22} />
                    <h1>Suministros</h1>
                    {stockBajo.length > 0 && (
                        <AlertBadge>
                            <RiAlertLine size={14} /> {stockBajo.length} stock bajo
                        </AlertBadge>
                    )}
                </TitleRow>
                <BtnAdd onClick={abrirNuevo}>
                    <RiAddLine size={18} /> Nuevo suministro
                </BtnAdd>
            </Header>

            {isLoading ? (
                <LoadingWrap>
                    <RiLoader4Line size={32} className="spin" />
                    <span>Cargando suministros…</span>
                </LoadingWrap>
            ) : suministros.length === 0 ? (
                <Empty>
                    <RiStore2Line size={48} />
                    <p>Aún no hay suministros registrados</p>
                    <small>Agrega ingredientes e insumos para llevar control del stock</small>
                    <BtnAdd onClick={abrirNuevo} style={{ marginTop: 12 }}>
                        <RiAddLine size={16} /> Agregar primero
                    </BtnAdd>
                </Empty>
            ) : (
                <Grid>
                    {suministros.map(s => {
                        const alerta = s.stock_minimo > 0 && s.stock_actual <= s.stock_minimo;
                        return (
                            <Card key={s.id} $alerta={alerta}
                                as={motion.div}
                                layout
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <CardTop>
                                    <CardNombre>{s.nombre}</CardNombre>
                                    {alerta && <AlertChip><RiAlertLine size={12} /> Stock bajo</AlertChip>}
                                </CardTop>
                                <StockRow>
                                    <StockVal $alerta={alerta}>{s.stock_actual}</StockVal>
                                    <StockUnidad>{s.unidad}</StockUnidad>
                                    {s.stock_minimo > 0 && (
                                        <StockMin>mín. {s.stock_minimo}</StockMin>
                                    )}
                                </StockRow>
                                <PrecioRow>
                                    <RiPriceTag3Line size={13} />
                                    <PrecioLabel>Costo / {s.unidad}</PrecioLabel>
                                    <PrecioValor $vacio={!s.precio_promedio}>
                                        {s.precio_promedio > 0 ? cop(s.precio_promedio) : "Sin precio"}
                                    </PrecioValor>
                                </PrecioRow>
                                <CardActions>
                                    <ActionBtn title="Registrar compra" $color="#22c55e" onClick={() => { setModalCompra(s); setCompra(EMPTY_COMPRA); setProvSel(null); setProvBusq(""); setProvOpts([]); }}>
                                        <RiShoppingCart2Line size={15} />
                                    </ActionBtn>
                                    <ActionBtn title="Historial" $color="#6366f1" onClick={() => setModalHistorial(s)}>
                                        <RiHistoryLine size={15} />
                                    </ActionBtn>
                                    <ActionBtn title="Editar" $color="#f59e0b" onClick={() => abrirEditar(s)}>
                                        <RiEditLine size={15} />
                                    </ActionBtn>
                                    <ActionBtn title="Eliminar" $color="#ef4444" onClick={() => eliminarSuministro(s.id)}>
                                        <RiDeleteBin6Line size={15} />
                                    </ActionBtn>
                                </CardActions>
                            </Card>
                        );
                    })}
                </Grid>
            )}

            {/* Modal nuevo / editar suministro */}
            <AnimatePresence>
                {modalSuministro && (
                    <ModalCenter>
                        <Overlay onClick={() => setModalSuministro(false)} />
                        <Modal as={motion.div}
                            initial={{ opacity: 0, scale: 0.93 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.93 }}
                        >
                            <ModalHeader>
                                <ModalTitulo>{editando ? "Editar suministro" : "Nuevo suministro"}</ModalTitulo>
                                <CloseBtn onClick={() => setModalSuministro(false)}><RiCloseLine size={20} /></CloseBtn>
                            </ModalHeader>
                            <ModalBody>
                                <FormLabel>Nombre</FormLabel>
                                <FormInput
                                    placeholder="Ej: Arroz, Pollo, Aceite…"
                                    value={form.nombre}
                                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                />
                                <FormRow>
                                    <div>
                                        <FormLabel>Unidad</FormLabel>
                                        <FormSelect value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}>
                                            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                                        </FormSelect>
                                    </div>
                                    <div>
                                        <FormLabel>Stock mínimo (alerta)</FormLabel>
                                        <FormInput type="number" min={0}
                                            placeholder="0"
                                            value={form.stock_minimo}
                                            onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))}
                                        />
                                    </div>
                                </FormRow>
                                <FormLabel>Precio / costo unitario ($)</FormLabel>
                                <FormInput
                                    type="number" min={0}
                                    placeholder="Ej: 5000"
                                    value={form.precio_promedio}
                                    onChange={e => setForm(f => ({ ...f, precio_promedio: e.target.value }))}
                                />
                            </ModalBody>
                            <ModalFooter>
                                <BtnCancel onClick={() => setModalSuministro(false)}>Cancelar</BtnCancel>
                                <BtnConfirm onClick={guardarSuministro} disabled={guardando || !form.nombre.trim()}>
                                    {guardando ? <RiLoader4Line className="spin" /> : (editando ? "Guardar cambios" : "Crear suministro")}
                                </BtnConfirm>
                            </ModalFooter>
                        </Modal>
                    </ModalCenter>
                )}
            </AnimatePresence>

            {/* Modal registrar compra */}
            <AnimatePresence>
                {modalCompra && (
                    <ModalCenter>
                        <Overlay onClick={() => setModalCompra(null)} />
                        <Modal as={motion.div}
                            initial={{ opacity: 0, scale: 0.93 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.93 }}
                        >
                            <ModalHeader>
                                <ModalTitulo>Registrar compra — {modalCompra.nombre}</ModalTitulo>
                                <CloseBtn onClick={() => setModalCompra(null)}><RiCloseLine size={20} /></CloseBtn>
                            </ModalHeader>
                            <ModalBody>
                                <StockActualInfo>
                                    Stock actual: <strong>{modalCompra.stock_actual} {modalCompra.unidad}</strong>
                                </StockActualInfo>
                                <FormRow>
                                    <div>
                                        <FormLabel>Cantidad ({modalCompra.unidad})</FormLabel>
                                        <FormInput type="number" min={0.1} step={0.1}
                                            placeholder="Ej: 10"
                                            value={compra.cantidad}
                                            onChange={e => setCompra(c => ({ ...c, cantidad: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <FormLabel>Precio total ($)</FormLabel>
                                        <FormInput type="number" min={0}
                                            placeholder="Ej: 45000"
                                            value={compra.precio_total}
                                            onChange={e => setCompra(c => ({ ...c, precio_total: e.target.value }))}
                                        />
                                    </div>
                                </FormRow>
                                <FormLabel>Proveedor (opcional)</FormLabel>
                                {provSel ? (
                                    <ProvSelBox>
                                        <RiTruckLine size={15} />
                                        <ProvSelNombre>
                                            {provSel.nombre}
                                            {provSel.nit && <span>NIT: {provSel.nit}</span>}
                                        </ProvSelNombre>
                                        <ProvDeselBtn onClick={() => { setProvSel(null); setProvBusq(""); }}>
                                            <RiCloseLine size={14} />
                                        </ProvDeselBtn>
                                    </ProvSelBox>
                                ) : (
                                    <ProvBusqWrap>
                                        <ProvBusqIcon><RiSearchLine size={13} /></ProvBusqIcon>
                                        <FormInput
                                            style={{ paddingLeft: 32 }}
                                            placeholder="Buscar proveedor o escribir nombre…"
                                            value={provBusq}
                                            onChange={e => setProvBusq(e.target.value)}
                                        />
                                        {provLoading && <ProvSpinner />}
                                        {provOpts.length > 0 && (
                                            <ProvDropdown>
                                                {provOpts.map(p => (
                                                    <ProvOpcion key={p.id} onClick={() => { setProvSel(p); setProvOpts([]); }}>
                                                        <RiTruckLine size={13} />
                                                        <span>{p.nombre}</span>
                                                        {p.nit && <ProvNit>{p.nit}</ProvNit>}
                                                    </ProvOpcion>
                                                ))}
                                            </ProvDropdown>
                                        )}
                                    </ProvBusqWrap>
                                )}
                                {compra.cantidad && compra.precio_total && (
                                    <CostoUnitario>
                                        Costo unitario: {cop(Number(compra.precio_total) / Number(compra.cantidad))} / {modalCompra.unidad}
                                    </CostoUnitario>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <BtnCancel onClick={() => setModalCompra(null)}>Cancelar</BtnCancel>
                                <BtnConfirm onClick={guardarCompra}
                                    disabled={guardando || !compra.cantidad || !compra.precio_total}
                                >
                                    {guardando ? <RiLoader4Line className="spin" /> : "Registrar entrada"}
                                </BtnConfirm>
                            </ModalFooter>
                        </Modal>
                    </ModalCenter>
                )}
            </AnimatePresence>

            {/* Modal historial */}
            <AnimatePresence>
                {modalHistorial && (
                    <ModalCenter>
                        <Overlay onClick={() => setModalHistorial(null)} />
                        <Modal as={motion.div}
                            initial={{ opacity: 0, scale: 0.93 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.93 }}
                            style={{ maxWidth: 480 }}
                        >
                            <ModalHeader>
                                <ModalTitulo>Historial — {modalHistorial.nombre}</ModalTitulo>
                                <CloseBtn onClick={() => setModalHistorial(null)}><RiCloseLine size={20} /></CloseBtn>
                            </ModalHeader>
                            <ModalBody>
                                {loadHist ? (
                                    <LoadingWrap style={{ height: 120 }}>
                                        <RiLoader4Line size={24} className="spin" />
                                    </LoadingWrap>
                                ) : historial.length === 0 ? (
                                    <EmptyTip>Sin compras registradas</EmptyTip>
                                ) : (
                                    <HistorialList>
                                        {historial.map(h => (
                                            <HistorialRow key={h.id}>
                                                <HistDate>{new Date(h.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "2-digit" })}</HistDate>
                                                <HistQty>+{h.cantidad} {modalHistorial.unidad}</HistQty>
                                                <HistPrecio>{cop(h.precio_total)}</HistPrecio>
                                                {h.proveedor && <HistProv>{h.proveedor}</HistProv>}
                                            </HistorialRow>
                                        ))}
                                    </HistorialList>
                                )}
                            </ModalBody>
                        </Modal>
                    </ModalCenter>
                )}
            </AnimatePresence>
        </Page>
    );
}

/* ── Styled Components ─────────────────────────────────────── */
const Page = styled.div`
    width: 100%; min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    padding: 32px; box-sizing: border-box; overflow-y: auto;
    @media (max-width: 767px) { padding: 68px 14px 20px; }
`;

const Header = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px; margin-bottom: 28px;
`;

const TitleRow = styled.div`
    display: flex; align-items: center; gap: 10px;
    color: #f97316;
    h1 { margin: 0; font-size: 22px; font-weight: 800;
         color: ${({ theme }) => theme.text}; font-family: "Poppins", sans-serif; }
`;

const AlertBadge = styled.span`
    display: flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 800;
    color: #ef4444; background: rgba(239,68,68,0.12);
    border: 1px solid rgba(239,68,68,0.3);
    font-family: "Poppins", sans-serif;
`;

const BtnAdd = styled.button`
    display: flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer;
    background: #f97316; color: #fff;
    font-size: 14px; font-weight: 700; font-family: "Poppins", sans-serif;
    transition: filter 0.15s;
    &:hover { filter: brightness(1.1); }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
`;

const Card = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ $alerta }) => $alerta ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)"};
    border-radius: 16px; padding: 16px;
    display: flex; flex-direction: column; gap: 10px;
`;

const CardTop = styled.div`
    display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
`;

const CardNombre = styled.div`
    font-size: 15px; font-weight: 800;
    color: ${({ theme }) => theme.text}; font-family: "Poppins", sans-serif;
`;

const AlertChip = styled.span`
    display: flex; align-items: center; gap: 3px;
    padding: 2px 8px; border-radius: 20px;
    font-size: 10px; font-weight: 800; white-space: nowrap;
    color: #ef4444; background: rgba(239,68,68,0.12);
    border: 1px solid rgba(239,68,68,0.3);
`;

const StockRow = styled.div`
    display: flex; align-items: baseline; gap: 6px;
`;

const StockVal = styled.span`
    font-size: 28px; font-weight: 900;
    color: ${({ $alerta }) => $alerta ? "#ef4444" : "#f97316"};
    font-family: "Poppins", sans-serif;
`;

const StockUnidad = styled.span`
    font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const StockMin = styled.span`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
    margin-left: auto;
`;

const PrecioRow = styled.div`
    display: flex; align-items: center; gap: 6px;
    padding: 7px 10px; border-radius: 8px;
    background: rgba(20,184,166,0.07);
    border: 1px solid rgba(20,184,166,0.18);
    color: #14b8a6;
`;

const PrecioLabel = styled.span`
    flex: 1; font-size: 11px; font-weight: 600;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

const PrecioValor = styled.span`
    font-size: 13px; font-weight: 800;
    color: ${({ $vacio }) => $vacio ? "rgba(255,255,255,0.2)" : "#14b8a6"};
    font-family: "Poppins", sans-serif;
`;

const CardActions = styled.div`
    display: flex; gap: 8px; border-top: 1px solid ${({ theme }) => theme.color2};
    padding-top: 10px; margin-top: 2px;
`;

const ActionBtn = styled.button`
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 7px; border-radius: 8px; border: none; cursor: pointer;
    color: ${({ $color }) => $color};
    background: ${({ $color }) => $color}15;
    transition: background 0.15s;
    &:hover { background: ${({ $color }) => $color}28; }
`;

const LoadingWrap = styled.div`
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; height: 300px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-family: "Poppins", sans-serif;
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const Empty = styled.div`
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 8px; min-height: 300px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-family: "Poppins", sans-serif;
    svg { opacity: 0.25; }
    p { font-size: 16px; font-weight: 700; margin: 0; }
    small { font-size: 12px; text-align: center; max-width: 280px; }
`;

/* Modales */
const ModalCenter = styled.div`
    position: fixed; inset: 0;
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 16px; pointer-events: none;
`;

const Overlay = styled.div`
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.55);
    pointer-events: all;
`;

const Modal = styled.div`
    position: relative; z-index: 1;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 20px;
    width: 100%; max-width: 440px;
    pointer-events: all;
    overflow: hidden;
`;

const ModalHeader = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 20px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const ModalTitulo = styled.h2`
    margin: 0; font-size: 16px; font-weight: 800;
    color: ${({ theme }) => theme.text}; font-family: "Poppins", sans-serif;
`;

const CloseBtn = styled.button`
    background: none; border: none; cursor: pointer;
    color: ${({ theme }) => theme.colorsubtitlecard};
    display: flex; align-items: center; border-radius: 8px; padding: 4px;
    transition: color 0.15s, background 0.15s;
    &:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
`;

const ModalBody = styled.div`
    padding: 20px;
    display: flex; flex-direction: column; gap: 14px;
`;

const ModalFooter = styled.div`
    display: flex; gap: 10px; justify-content: flex-end;
    padding: 14px 20px;
    border-top: 1px solid ${({ theme }) => theme.color2};
`;

const FormLabel = styled.label`
    display: block; font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px; color: ${({ theme }) => theme.colorsubtitlecard};
    margin-bottom: 6px;
`;

const FormInput = styled.input`
    width: 100%; padding: 10px 12px; border-radius: 10px;
    background: ${({ theme }) => theme.bgtotal};
    border: 1px solid ${({ theme }) => theme.color2};
    color: ${({ theme }) => theme.text}; font-size: 14px;
    font-family: "Poppins", sans-serif; outline: none; box-sizing: border-box;
    &:focus { border-color: #f97316; }
`;

const FormSelect = styled.select`
    width: 100%; padding: 10px 12px; border-radius: 10px;
    background: ${({ theme }) => theme.bgtotal};
    border: 1px solid ${({ theme }) => theme.color2};
    color: ${({ theme }) => theme.text}; font-size: 14px;
    font-family: "Poppins", sans-serif; outline: none; cursor: pointer;
    &:focus { border-color: #f97316; }
`;

const FormRow = styled.div`
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
`;

const BtnCancel = styled.button`
    padding: 10px 18px; border-radius: 10px;
    background: transparent; border: 1px solid ${({ theme }) => theme.color2};
    color: ${({ theme }) => theme.text}; font-size: 13px; font-weight: 700;
    font-family: "Poppins", sans-serif; cursor: pointer;
`;

const BtnConfirm = styled.button`
    display: flex; align-items: center; gap: 6px;
    padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer;
    background: #f97316; color: #fff; font-size: 13px; font-weight: 700;
    font-family: "Poppins", sans-serif;
    transition: filter 0.15s;
    &:hover:not(:disabled) { filter: brightness(1.1); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const StockActualInfo = styled.div`
    font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard};
    background: ${({ theme }) => theme.bgtotal};
    border-radius: 10px; padding: 10px 14px;
    strong { color: #f97316; }
`;

const CostoUnitario = styled.div`
    font-size: 12px; font-weight: 700; color: #22c55e;
    padding: 8px 12px; border-radius: 10px;
    background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2);
`;

const EmptyTip = styled.p`
    font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard};
    text-align: center; padding: 20px 0; margin: 0;
`;

const HistorialList = styled.div`display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto;`;

const HistorialRow = styled.div`
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px;
    background: ${({ theme }) => theme.bgtotal};
    font-family: "Poppins", sans-serif;
`;

const HistDate = styled.span`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard}; min-width: 70px;
`;

const HistQty = styled.span`
    font-size: 13px; font-weight: 800; color: #22c55e; flex: 1;
`;

const HistPrecio = styled.span`
    font-size: 13px; font-weight: 700; color: ${({ theme }) => theme.text};
`;

const HistProv = styled.span`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

/* ── Buscador proveedor ── */
const ProvBusqWrap = styled.div`position: relative;`;

const ProvBusqIcon = styled.div`
    position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
    color: ${({ theme }) => theme.colorsubtitlecard}; pointer-events: none; display: flex;
`;

const ProvSpinner = styled.div`
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    width: 13px; height: 13px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.1); border-top-color: #f97316;
    animation: spinProv 0.7s linear infinite;
    @keyframes spinProv { to { transform: translateY(-50%) rotate(360deg); } }
`;

const ProvDropdown = styled.div`
    position: absolute; top: calc(100% + 5px); left: 0; right: 0; z-index: 30;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 10px; overflow: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
`;

const ProvOpcion = styled.div`
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px; cursor: pointer; font-size: 13px;
    color: ${({ theme }) => theme.text};
    transition: background 0.12s;
    &:hover { background: rgba(249,115,22,0.08); }
    svg { color: ${({ theme }) => theme.colorsubtitlecard}; flex-shrink: 0; }
    span { flex: 1; font-weight: 600; }
`;

const ProvNit = styled.span`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
    flex: 0 !important; font-weight: 400 !important;
`;

const ProvSelBox = styled.div`
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px;
    background: rgba(249,115,22,0.07);
    border: 1px solid rgba(249,115,22,0.25);
    color: #f97316;
    svg { flex-shrink: 0; }
`;

const ProvSelNombre = styled.div`
    flex: 1; font-size: 13px; font-weight: 700;
    color: ${({ theme }) => theme.text};
    span { display: block; font-size: 11px; font-weight: 400; color: ${({ theme }) => theme.colorsubtitlecard}; margin-top: 1px; }
`;

const ProvDeselBtn = styled.button`
    background: rgba(239,68,68,0.1); border: none; cursor: pointer;
    color: #ef4444; border-radius: 6px; padding: 3px;
    display: flex; align-items: center;
    &:hover { background: rgba(239,68,68,0.2); }
`;
