import { useState, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import {
    MostrarMesas, CrearMesa, EditarMesa, EliminarMesa,
    MostrarMenuCategorias, MostrarMenuItems,
    CrearComanda, MostrarComandaPorMesa,
    AgregarItemComanda, EliminarItemComanda,
    CambiarEstadoComanda, CambiarEstadoMesa, CerrarComanda,
} from "../../supabase/crudRestaurante";
import {
    RiRestaurantLine, RiAddLine, RiEditLine, RiDeleteBinLine,
    RiCloseLine, RiCheckLine, RiSendPlane2Line, RiMoneyDollarCircleLine,
    RiTableLine, RiArrowLeftLine, RiSubtractLine, RiRefreshLine,
} from "react-icons/ri";
import Swal from "sweetalert2";

const COP = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);

const ESTADO_CFG = {
    libre:         { label: "Libre",          color: "#22c55e", bg: "rgba(34,197,94,0.12)"  },
    ocupada:       { label: "Ocupada",         color: "#ef4444", bg: "rgba(239,68,68,0.12)"  },
    cuenta_pedida: { label: "Cuenta pedida",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
};

export function MesasTemplate() {
    const { dataempresa } = useEmpresaStore();
    const id_empresa = dataempresa?.id;
    const qc = useQueryClient();

    const [panel, setPanel]           = useState(null);   // mesa seleccionada
    const [comanda, setComanda]       = useState(null);   // comanda activa
    const [catActiva, setCatActiva]   = useState(null);
    const [loading, setLoading]       = useState(false);
    const [modalMesa, setModalMesa]   = useState(null);   // null | "nueva" | mesa
    const [formMesa, setFormMesa]     = useState({ numero: "", nombre: "", capacidad: 4 });

    const refMesas = () => qc.invalidateQueries({ queryKey: ["mesas", id_empresa] });

    const { data: mesas = [] } = useQuery({
        queryKey: ["mesas", id_empresa],
        queryFn: () => MostrarMesas({ id_empresa }),
        enabled: !!id_empresa,
    });
    const { data: categorias = [] } = useQuery({
        queryKey: ["menu-cat", id_empresa],
        queryFn: () => MostrarMenuCategorias({ id_empresa }),
        enabled: !!id_empresa,
    });
    const { data: items = [] } = useQuery({
        queryKey: ["menu-items", id_empresa],
        queryFn: () => MostrarMenuItems({ id_empresa }),
        enabled: !!id_empresa,
    });

    const catVisible = catActiva ?? categorias[0]?.id;
    const itemsFiltrados = items.filter(i => i.id_categoria === catVisible && i.disponible);

    /* ── Abrir mesa / comanda ─────────────────────────────── */
    const abrirMesa = useCallback(async (mesa) => {
        setLoading(true);
        setPanel(mesa);
        let cmd = await MostrarComandaPorMesa({ id_empresa, id_mesa: mesa.id });
        if (!cmd) {
            cmd = await CrearComanda({ id_empresa, id_mesa: mesa.id });
            await CambiarEstadoMesa({ id: mesa.id, estado: "ocupada" });
            refMesas();
        }
        setComanda(cmd);
        setLoading(false);
    }, [id_empresa]);

    const cerrarPanel = () => { setPanel(null); setComanda(null); setCatActiva(null); };

    /* ── Agregar ítem ─────────────────────────────────────── */
    const agregarItem = useCallback(async (item) => {
        if (!comanda) return;
        const updated = await AgregarItemComanda({
            id_empresa, id_comanda: comanda.id,
            id_menu_item: item.id, nombre: item.nombre,
            precio_unitario: item.precio, cantidad: 1,
        });
        setComanda(prev => {
            const existe = prev.comanda_items?.find(ci => ci.id === updated.id);
            const items_ = existe
                ? prev.comanda_items.map(ci => ci.id === updated.id ? updated : ci)
                : [...(prev.comanda_items ?? []), updated];
            const total = items_.reduce((s, ci) => s + ci.precio_unitario * ci.cantidad, 0);
            return { ...prev, comanda_items: items_, total };
        });
    }, [comanda, id_empresa]);

    /* ── Eliminar ítem ────────────────────────────────────── */
    const quitarItem = useCallback(async (ci) => {
        await EliminarItemComanda({ id: ci.id, id_comanda: comanda.id });
        setComanda(prev => {
            const items_ = prev.comanda_items.filter(x => x.id !== ci.id);
            const total = items_.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);
            return { ...prev, comanda_items: items_, total };
        });
    }, [comanda]);

    /* ── Enviar a cocina ──────────────────────────────────── */
    const enviarCocina = useCallback(async () => {
        if (!comanda) return;
        await CambiarEstadoComanda({ id: comanda.id, estado: "en_cocina" });
        setComanda(prev => ({ ...prev, estado: "en_cocina" }));
        cerrarPanel();
        refMesas();
    }, [comanda]);

    /* ── Cobrar ───────────────────────────────────────────── */
    const cobrar = useCallback(async () => {
        const r = await Swal.fire({
            title: `Cobrar mesa ${panel?.nombre ?? panel?.numero}`,
            text: `Total: ${COP(comanda?.total)} — ¿Confirmar cobro?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Cobrar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#22c55e",
            customClass: { popup: "swal-pos" },
        });
        if (!r.isConfirmed) return;
        await CerrarComanda({ id: comanda.id, id_mesa: panel.id });
        cerrarPanel();
        refMesas();
    }, [comanda, panel]);

    /* ── CRUD mesas ───────────────────────────────────────── */
    const abrirModalMesa = (mesa = null) => {
        setModalMesa(mesa ?? "nueva");
        setFormMesa(mesa ? { numero: mesa.numero, nombre: mesa.nombre ?? "", capacidad: mesa.capacidad } : { numero: "", nombre: "", capacidad: 4 });
    };

    const guardarMesa = async () => {
        if (!formMesa.numero) return;
        if (modalMesa === "nueva") {
            await CrearMesa({ id_empresa, numero: Number(formMesa.numero), nombre: formMesa.nombre || null, capacidad: Number(formMesa.capacidad) });
        } else {
            await EditarMesa({ id: modalMesa.id, numero: Number(formMesa.numero), nombre: formMesa.nombre || null, capacidad: Number(formMesa.capacidad) });
        }
        setModalMesa(null);
        refMesas();
    };

    const eliminarMesa = async (mesa) => {
        const r = await Swal.fire({
            title: `Eliminar Mesa ${mesa.nombre ?? mesa.numero}`,
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#ef4444",
            customClass: { popup: "swal-pos" },
        });
        if (!r.isConfirmed) return;
        await EliminarMesa({ id: mesa.id });
        refMesas();
    };

    const libre = mesas.filter(m => m.estado === "libre").length;
    const ocupadas = mesas.filter(m => m.estado === "ocupada").length;

    return (
        <Page>
            {/* ── Header ── */}
            <Header>
                <HeaderLeft>
                    <HeaderIcon><RiRestaurantLine /></HeaderIcon>
                    <div>
                        <HeaderTitle>Mesas</HeaderTitle>
                        <HeaderSub>{mesas.length} mesas · <span style={{ color: "#22c55e" }}>{libre} libres</span> · <span style={{ color: "#ef4444" }}>{ocupadas} ocupadas</span></HeaderSub>
                    </div>
                </HeaderLeft>
                <HeaderActions>
                    <BtnSecondary onClick={() => window.open("/cocina", "_blank")}>
                        <RiRestaurantLine /> Pantalla cocina
                    </BtnSecondary>
                    <BtnPrimary onClick={() => abrirModalMesa()}>
                        <RiAddLine /> Nueva mesa
                    </BtnPrimary>
                </HeaderActions>
            </Header>

            {/* ── Grid mesas ── */}
            <GridMesas>
                <AnimatePresence>
                    {mesas.map((mesa, i) => {
                        const cfg = ESTADO_CFG[mesa.estado] ?? ESTADO_CFG.libre;
                        return (
                            <motion.div key={mesa.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.25, delay: i * 0.04 }}
                                layout
                            >
                                <MesaCard $color={cfg.color} $bg={cfg.bg} onClick={() => abrirMesa(mesa)}>
                                    <MesaNum $color={cfg.color}>
                                        {mesa.nombre ?? `Mesa ${mesa.numero}`}
                                    </MesaNum>
                                    <MesaCapacidad>👥 {mesa.capacidad} personas</MesaCapacidad>
                                    <EstadoBadge $color={cfg.color} $bg={cfg.bg}>{cfg.label}</EstadoBadge>
                                    <MesaActions onClick={e => e.stopPropagation()}>
                                        <IconBtn onClick={() => abrirModalMesa(mesa)} title="Editar">
                                            <RiEditLine />
                                        </IconBtn>
                                        <IconBtn $red onClick={() => eliminarMesa(mesa)} title="Eliminar">
                                            <RiDeleteBinLine />
                                        </IconBtn>
                                    </MesaActions>
                                </MesaCard>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {mesas.length === 0 && (
                    <EmptyState>
                        <RiTableLine size={40} style={{ opacity: 0.3 }} />
                        <p>No hay mesas configuradas. Crea la primera.</p>
                    </EmptyState>
                )}
            </GridMesas>

            {/* ── Panel de comanda (drawer) ── */}
            <AnimatePresence>
                {panel && (
                    <>
                        <Overlay onClick={cerrarPanel} />
                        <Drawer
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            {/* Header panel */}
                            <DrawerHeader>
                                <BtnBack onClick={cerrarPanel}><RiArrowLeftLine /></BtnBack>
                                <DrawerTitle>
                                    {panel.nombre ?? `Mesa ${panel.numero}`}
                                    {comanda && (
                                        <EstadoChip $color={ESTADO_CFG[comanda.estado]?.color ?? "#60a5fa"}>
                                            {comanda.estado?.replace("_", " ")}
                                        </EstadoChip>
                                    )}
                                </DrawerTitle>
                                <BtnBack onClick={() => { cerrarPanel(); qc.invalidateQueries({ queryKey: ["mesas", id_empresa] }); }}>
                                    <RiRefreshLine />
                                </BtnBack>
                            </DrawerHeader>

                            {loading ? (
                                <LoadingWrap><Spinner /></LoadingWrap>
                            ) : (
                                <DrawerBody>
                                    {/* ── Menú ── */}
                                    <MenuSection>
                                        <SectionLabel>Menú</SectionLabel>
                                        {/* Categorías */}
                                        <CatTabs>
                                            {categorias.map(cat => (
                                                <CatTab
                                                    key={cat.id}
                                                    $active={catVisible === cat.id}
                                                    onClick={() => setCatActiva(cat.id)}
                                                >
                                                    {cat.nombre}
                                                </CatTab>
                                            ))}
                                        </CatTabs>
                                        {/* Items */}
                                        <ItemsGrid>
                                            {itemsFiltrados.map(item => (
                                                <ItemCard key={item.id} onClick={() => agregarItem(item)}>
                                                    <ItemNombre>{item.nombre}</ItemNombre>
                                                    {item.descripcion && <ItemDesc>{item.descripcion}</ItemDesc>}
                                                    <ItemPrecio>{COP(item.precio)}</ItemPrecio>
                                                    <ItemAddBtn><RiAddLine /></ItemAddBtn>
                                                </ItemCard>
                                            ))}
                                            {itemsFiltrados.length === 0 && (
                                                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, gridColumn: "1/-1" }}>
                                                    No hay ítems disponibles en esta categoría.
                                                </p>
                                            )}
                                        </ItemsGrid>
                                    </MenuSection>

                                    {/* ── Orden actual ── */}
                                    <OrderSection>
                                        <SectionLabel>Orden actual</SectionLabel>
                                        <OrderList>
                                            {(comanda?.comanda_items ?? []).length === 0 ? (
                                                <EmptyOrder>Agrega ítems desde el menú</EmptyOrder>
                                            ) : (
                                                comanda.comanda_items.map(ci => (
                                                    <OrderRow key={ci.id}>
                                                        <OrderQty>{ci.cantidad}×</OrderQty>
                                                        <OrderItemName>{ci.nombre}</OrderItemName>
                                                        <OrderItemPrice>{COP(ci.precio_unitario * ci.cantidad)}</OrderItemPrice>
                                                        <OrderRemove onClick={() => quitarItem(ci)}>
                                                            <RiSubtractLine />
                                                        </OrderRemove>
                                                    </OrderRow>
                                                ))
                                            )}
                                        </OrderList>

                                        <TotalRow>
                                            <span>Total</span>
                                            <TotalNum>{COP(comanda?.total ?? 0)}</TotalNum>
                                        </TotalRow>

                                        <OrderActions>
                                            <BtnCocina
                                                onClick={enviarCocina}
                                                disabled={!comanda?.comanda_items?.length}
                                            >
                                                <RiSendPlane2Line /> Enviar a cocina
                                            </BtnCocina>
                                            <BtnCobrar
                                                onClick={cobrar}
                                                disabled={!comanda?.total}
                                            >
                                                <RiMoneyDollarCircleLine /> Cobrar
                                            </BtnCobrar>
                                        </OrderActions>
                                    </OrderSection>
                                </DrawerBody>
                            )}
                        </Drawer>
                    </>
                )}
            </AnimatePresence>

            {/* ── Modal nueva/editar mesa ── */}
            <AnimatePresence>
                {modalMesa && (
                    <>
                        <Overlay onClick={() => setModalMesa(null)} />
                        <Modal
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ModalHeader>
                                <h3>{modalMesa === "nueva" ? "Nueva mesa" : "Editar mesa"}</h3>
                                <IconBtn onClick={() => setModalMesa(null)}><RiCloseLine /></IconBtn>
                            </ModalHeader>
                            <FormGroup>
                                <FormLabel>Número de mesa *</FormLabel>
                                <FormInput
                                    type="number" min="1"
                                    value={formMesa.numero}
                                    onChange={e => setFormMesa(f => ({ ...f, numero: e.target.value }))}
                                    placeholder="1"
                                />
                            </FormGroup>
                            <FormGroup>
                                <FormLabel>Nombre (opcional)</FormLabel>
                                <FormInput
                                    type="text"
                                    value={formMesa.nombre}
                                    onChange={e => setFormMesa(f => ({ ...f, nombre: e.target.value }))}
                                    placeholder="Ej: Terraza, VIP..."
                                />
                            </FormGroup>
                            <FormGroup>
                                <FormLabel>Capacidad de personas</FormLabel>
                                <FormInput
                                    type="number" min="1"
                                    value={formMesa.capacidad}
                                    onChange={e => setFormMesa(f => ({ ...f, capacidad: e.target.value }))}
                                />
                            </FormGroup>
                            <ModalFooter>
                                <BtnSecondary onClick={() => setModalMesa(null)}>Cancelar</BtnSecondary>
                                <BtnPrimary onClick={guardarMesa} disabled={!formMesa.numero}>
                                    <RiCheckLine /> Guardar
                                </BtnPrimary>
                            </ModalFooter>
                        </Modal>
                    </>
                )}
            </AnimatePresence>
        </Page>
    );
}

/* ── Styled Components ─────────────────────────────────────── */
const Page = styled.div`
    padding: 24px;
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
`;

const Header = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px; margin-bottom: 28px;
`;

const HeaderLeft = styled.div`display: flex; align-items: center; gap: 14px;`;

const HeaderIcon = styled.div`
    width: 46px; height: 46px; border-radius: 14px;
    background: rgba(249,115,22,0.12); color: #f97316;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
`;

const HeaderTitle = styled.h1`
    font-size: 20px; font-weight: 800;
    color: ${({ theme }) => theme.text}; margin: 0;
`;

const HeaderSub = styled.p`
    font-size: 13px; color: ${({ theme }) => theme.text2}; margin: 2px 0 0;
`;

const HeaderActions = styled.div`display: flex; gap: 10px; flex-wrap: wrap;`;

const BtnPrimary = styled.button`
    display: flex; align-items: center; gap: 7px;
    padding: 9px 18px; border-radius: 10px; border: none;
    background: #f97316; color: #fff; font-size: 13px; font-weight: 700;
    font-family: "Poppins", sans-serif; cursor: pointer;
    transition: filter 0.15s;
    &:hover { filter: brightness(1.1); }
    &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const BtnSecondary = styled.button`
    display: flex; align-items: center; gap: 7px;
    padding: 9px 18px; border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-weight: 600; font-family: "Poppins", sans-serif;
    cursor: pointer; transition: border-color 0.15s;
    &:hover { border-color: #f97316; }
`;

const GridMesas = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
`;

const MesaCard = styled.div`
    border-radius: 16px;
    border: 2px solid ${({ $color }) => $color}44;
    background: ${({ $bg }) => $bg};
    padding: 18px 16px 14px;
    cursor: pointer; position: relative;
    transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
    &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px ${({ $color }) => $color}30;
        border-color: ${({ $color }) => $color}88;
    }
`;

const MesaNum = styled.div`
    font-size: 17px; font-weight: 800;
    color: ${({ $color }) => $color}; margin-bottom: 6px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const MesaCapacidad = styled.div`
    font-size: 11px; color: rgba(255,255,255,0.4); margin-bottom: 10px;
`;

const EstadoBadge = styled.span`
    display: inline-block;
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px;
    color: ${({ $color }) => $color};
    background: ${({ $bg }) => $bg};
    border: 1px solid ${({ $color }) => $color}55;
    padding: 2px 8px; border-radius: 20px;
`;

const MesaActions = styled.div`
    position: absolute; top: 8px; right: 8px;
    display: flex; gap: 4px; opacity: 0;
    transition: opacity 0.15s;
    ${MesaCard}:hover & { opacity: 1; }
`;

const IconBtn = styled.button`
    width: 26px; height: 26px; border-radius: 7px; border: none;
    background: ${({ $red }) => $red ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)"};
    color: ${({ $red }) => $red ? "#ef4444" : "rgba(255,255,255,0.6)"};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 14px;
    &:hover { background: ${({ $red }) => $red ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.15)"}; }
`;

const EmptyState = styled.div`
    grid-column: 1 / -1; display: flex; flex-direction: column;
    align-items: center; gap: 12px; padding: 60px 0;
    color: ${({ theme }) => theme.text2};
`;

/* ── Panel drawer ── */
const Overlay = styled.div`
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    z-index: 200; backdrop-filter: blur(2px);
`;

const Drawer = styled(motion.div)`
    position: fixed; top: 0; right: 0; bottom: 0;
    width: min(860px, 100vw);
    background: ${({ theme }) => theme.bgcards};
    border-left: 1px solid ${({ theme }) => theme.color2};
    z-index: 201; display: flex; flex-direction: column;
    box-shadow: -8px 0 40px rgba(0,0,0,0.3);
`;

const DrawerHeader = styled.div`
    display: flex; align-items: center; gap: 12px;
    padding: 18px 20px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    flex-shrink: 0;
`;

const BtnBack = styled.button`
    width: 34px; height: 34px; border-radius: 10px; border: none;
    background: rgba(255,255,255,0.06); color: ${({ theme }) => theme.text};
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; cursor: pointer;
    &:hover { background: rgba(255,255,255,0.12); }
`;

const DrawerTitle = styled.h2`
    flex: 1; font-size: 17px; font-weight: 800;
    color: ${({ theme }) => theme.text}; margin: 0;
    display: flex; align-items: center; gap: 10px;
`;

const EstadoChip = styled.span`
    font-size: 10px; font-weight: 700; text-transform: capitalize;
    color: ${({ $color }) => $color};
    background: ${({ $color }) => $color}20;
    border: 1px solid ${({ $color }) => $color}44;
    padding: 2px 8px; border-radius: 20px;
`;

const LoadingWrap = styled.div`
    flex: 1; display: flex; align-items: center; justify-content: center;
`;

const spin = keyframes`from{transform:rotate(0)}to{transform:rotate(360deg)}`;
const Spinner = styled.div`
    width: 36px; height: 36px; border-radius: 50%;
    border: 3px solid rgba(249,115,22,0.2);
    border-top-color: #f97316;
    animation: ${spin} 0.7s linear infinite;
`;

const DrawerBody = styled.div`
    flex: 1; display: grid;
    grid-template-columns: 1fr 320px;
    overflow: hidden;
    @media (max-width: 640px) {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
        overflow-y: auto;
    }
`;

/* ── Menú side ── */
const MenuSection = styled.div`
    padding: 18px; display: flex; flex-direction: column; gap: 14px;
    overflow-y: auto; border-right: 1px solid ${({ theme }) => theme.color2};
`;

const SectionLabel = styled.div`
    font-size: 10px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 1.2px; color: rgba(255,255,255,0.3);
`;

const CatTabs = styled.div`
    display: flex; gap: 8px; flex-wrap: wrap;
`;

const CatTab = styled.button`
    padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
    font-family: "Poppins", sans-serif; cursor: pointer;
    border: 1px solid ${({ $active }) => $active ? "#f97316" : "rgba(255,255,255,0.1)"};
    background: ${({ $active }) => $active ? "rgba(249,115,22,0.18)" : "transparent"};
    color: ${({ $active }) => $active ? "#f97316" : "rgba(255,255,255,0.5)"};
    transition: all 0.15s;
    &:hover { border-color: #f97316; color: #f97316; }
`;

const ItemsGrid = styled.div`
    display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
`;

const ItemCard = styled.div`
    border-radius: 12px; padding: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    cursor: pointer; position: relative;
    transition: border-color 0.15s, background 0.15s;
    &:hover { border-color: #f97316; background: rgba(249,115,22,0.07); }
`;

const ItemNombre = styled.div`
    font-size: 13px; font-weight: 700;
    color: ${({ theme }) => theme.text}; margin-bottom: 4px;
`;

const ItemDesc = styled.div`
    font-size: 11px; color: rgba(255,255,255,0.35); margin-bottom: 6px;
    line-height: 1.4;
`;

const ItemPrecio = styled.div`
    font-size: 13px; font-weight: 800; color: #f97316;
`;

const ItemAddBtn = styled.div`
    position: absolute; top: 8px; right: 8px;
    width: 22px; height: 22px; border-radius: 6px;
    background: rgba(249,115,22,0.18); color: #f97316;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; opacity: 0; transition: opacity 0.15s;
    ${ItemCard}:hover & { opacity: 1; }
`;

/* ── Order side ── */
const OrderSection = styled.div`
    padding: 18px; display: flex; flex-direction: column; gap: 14px;
    overflow-y: auto;
`;

const OrderList = styled.div`
    flex: 1; display: flex; flex-direction: column; gap: 8px;
    overflow-y: auto;
`;

const EmptyOrder = styled.p`
    font-size: 12px; color: rgba(255,255,255,0.25); text-align: center;
    margin: 20px 0;
`;

const OrderRow = styled.div`
    display: flex; align-items: center; gap: 8px;
    padding: 8px 10px; border-radius: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
`;

const OrderQty = styled.span`
    font-size: 12px; font-weight: 800; color: #f97316; min-width: 24px;
`;

const OrderItemName = styled.span`
    flex: 1; font-size: 12px; font-weight: 600;
    color: ${({ theme }) => theme.text};
`;

const OrderItemPrice = styled.span`
    font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.5);
`;

const OrderRemove = styled.button`
    width: 22px; height: 22px; border-radius: 6px; border: none;
    background: rgba(239,68,68,0.12); color: #ef4444;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 13px;
    &:hover { background: rgba(239,68,68,0.25); }
`;

const TotalRow = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.08);
    font-size: 13px; font-weight: 700; color: ${({ theme }) => theme.text};
`;

const TotalNum = styled.span`
    font-size: 18px; font-weight: 900; color: #f97316;
`;

const OrderActions = styled.div`
    display: flex; flex-direction: column; gap: 8px;
`;

const BtnCocina = styled.button`
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: #fff; font-size: 13px; font-weight: 800;
    font-family: "Poppins", sans-serif; cursor: pointer;
    transition: filter 0.15s;
    &:hover { filter: brightness(1.1); }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const BtnCobrar = styled.button`
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff; font-size: 13px; font-weight: 800;
    font-family: "Poppins", sans-serif; cursor: pointer;
    transition: filter 0.15s;
    &:hover { filter: brightness(1.1); }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

/* ── Modal mesa ── */
const Modal = styled(motion.div)`
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    z-index: 300; width: 360px; border-radius: 20px;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    padding: 24px; display: flex; flex-direction: column; gap: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
`;

const ModalHeader = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    h3 { font-size: 16px; font-weight: 800; color: ${({ theme }) => theme.text}; margin: 0; }
`;

const FormGroup = styled.div`display: flex; flex-direction: column; gap: 6px;`;

const FormLabel = styled.label`
    font-size: 12px; font-weight: 700; color: ${({ theme }) => theme.text2};
`;

const FormInput = styled.input`
    padding: 9px 12px; border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif;
    outline: none;
    &:focus { border-color: #f97316; }
`;

const ModalFooter = styled.div`
    display: flex; gap: 8px; justify-content: flex-end;
`;
