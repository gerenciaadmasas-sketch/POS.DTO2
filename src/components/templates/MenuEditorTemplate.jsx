import { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import {
    MostrarMenuCategorias, CrearMenuCategoria, EditarMenuCategoria, EliminarMenuCategoria,
    MostrarMenuItems, CrearMenuItem, EditarMenuItem, EliminarMenuItem,
} from "../../supabase/crudRestaurante";
import {
    RiMenuLine, RiAddLine, RiEditLine, RiDeleteBinLine,
    RiCloseLine, RiCheckLine, RiToggleLine, RiToggleFill,
} from "react-icons/ri";
import Swal from "sweetalert2";

const COP = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);

const FORM_CAT_INIT  = { nombre: "" };
const FORM_ITEM_INIT = { nombre: "", descripcion: "", precio: "", id_categoria: "" };

export function MenuEditorTemplate() {
    const { dataempresa } = useEmpresaStore();
    const id_empresa = dataempresa?.id;
    const qc = useQueryClient();

    const [catSel, setCatSel]           = useState(null);
    const [modalCat, setModalCat]       = useState(null);
    const [formCat, setFormCat]         = useState(FORM_CAT_INIT);
    const [modalItem, setModalItem]     = useState(null);
    const [formItem, setFormItem]       = useState(FORM_ITEM_INIT);

    const refCats  = () => qc.invalidateQueries({ queryKey: ["menu-cat",   id_empresa] });
    const refItems = () => qc.invalidateQueries({ queryKey: ["menu-items", id_empresa] });

    const { data: categorias = [] } = useQuery({
        queryKey: ["menu-cat", id_empresa],
        queryFn:  () => MostrarMenuCategorias({ id_empresa }),
        enabled:  !!id_empresa,
    });

    const { data: items = [] } = useQuery({
        queryKey: ["menu-items", id_empresa],
        queryFn:  () => MostrarMenuItems({ id_empresa }),
        enabled:  !!id_empresa,
    });

    const catActivaId = catSel ?? categorias[0]?.id;
    const itemsCat    = items.filter(i => i.id_categoria === catActivaId);

    /* ── CRUD categorías ── */
    const abrirModalCat = (cat = null) => {
        setModalCat(cat ?? "nueva");
        setFormCat(cat ? { nombre: cat.nombre } : FORM_CAT_INIT);
    };

    const guardarCat = async () => {
        if (!formCat.nombre.trim()) return;
        if (modalCat === "nueva") {
            await CrearMenuCategoria({ id_empresa, nombre: formCat.nombre.trim() });
        } else {
            await EditarMenuCategoria({ id: modalCat.id, nombre: formCat.nombre.trim() });
        }
        setModalCat(null);
        refCats();
    };

    const eliminarCat = async (cat) => {
        const r = await Swal.fire({
            title: `Eliminar "${cat.nombre}"`,
            text: "Se eliminarán también todos sus ítems.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#ef4444",
            customClass: { popup: "swal-pos" },
        });
        if (!r.isConfirmed) return;
        await EliminarMenuCategoria({ id: cat.id });
        if (catSel === cat.id) setCatSel(null);
        refCats(); refItems();
    };

    const toggleCatActiva = async (cat) => {
        await EditarMenuCategoria({ id: cat.id, activa: !cat.activa });
        refCats();
    };

    /* ── CRUD ítems ── */
    const abrirModalItem = (item = null) => {
        setModalItem(item ?? "nuevo");
        setFormItem(item
            ? { nombre: item.nombre, descripcion: item.descripcion ?? "", precio: String(item.precio), id_categoria: item.id_categoria }
            : { ...FORM_ITEM_INIT, id_categoria: catActivaId ?? "" }
        );
    };

    const guardarItem = async () => {
        if (!formItem.nombre.trim() || !formItem.precio || !formItem.id_categoria) return;
        const payload = {
            id_empresa,
            id_categoria:  formItem.id_categoria,
            nombre:        formItem.nombre.trim(),
            descripcion:   formItem.descripcion.trim() || null,
            precio:        parseFloat(formItem.precio),
        };
        if (modalItem === "nuevo") {
            await CrearMenuItem(payload);
        } else {
            await EditarMenuItem({ id: modalItem.id, ...payload });
        }
        setModalItem(null);
        refItems();
    };

    const eliminarItem = async (item) => {
        const r = await Swal.fire({
            title: `Eliminar "${item.nombre}"`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#ef4444",
            customClass: { popup: "swal-pos" },
        });
        if (!r.isConfirmed) return;
        await EliminarMenuItem({ id: item.id });
        refItems();
    };

    const toggleDisponible = async (item) => {
        await EditarMenuItem({ id: item.id, disponible: !item.disponible });
        refItems();
    };

    return (
        <Page>
            <Header>
                <HeaderLeft>
                    <HeaderIcon><RiMenuLine /></HeaderIcon>
                    <div>
                        <HeaderTitle>Editor de Menú</HeaderTitle>
                        <HeaderSub>{categorias.length} categorías · {items.length} ítems</HeaderSub>
                    </div>
                </HeaderLeft>
            </Header>

            <Body>
                {/* ── Columna categorías ── */}
                <CatPanel>
                    <PanelHeader>
                        <PanelTitle>Categorías</PanelTitle>
                        <BtnIconSmall onClick={() => abrirModalCat()}><RiAddLine /></BtnIconSmall>
                    </PanelHeader>

                    <CatList>
                        <AnimatePresence>
                            {categorias.map((cat, i) => (
                                <motion.div key={cat.id}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <CatItem
                                        $active={catActivaId === cat.id}
                                        $inactive={!cat.activa}
                                        onClick={() => setCatSel(cat.id)}
                                    >
                                        <CatName $active={catActivaId === cat.id}>{cat.nombre}</CatName>
                                        <CatCount>{items.filter(it => it.id_categoria === cat.id).length}</CatCount>
                                        <CatActions onClick={e => e.stopPropagation()}>
                                            <MiniBtn onClick={() => toggleCatActiva(cat)} title={cat.activa ? "Desactivar" : "Activar"}>
                                                {cat.activa ? <RiToggleFill style={{ color: "#22c55e" }} /> : <RiToggleLine style={{ color: "rgba(255,255,255,0.3)" }} />}
                                            </MiniBtn>
                                            <MiniBtn onClick={() => abrirModalCat(cat)}><RiEditLine /></MiniBtn>
                                            <MiniBtn $red onClick={() => eliminarCat(cat)}><RiDeleteBinLine /></MiniBtn>
                                        </CatActions>
                                    </CatItem>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {categorias.length === 0 && (
                            <EmptyTip>Aún no hay categorías. Crea la primera.</EmptyTip>
                        )}
                    </CatList>
                </CatPanel>

                {/* ── Columna ítems ── */}
                <ItemsPanel>
                    <PanelHeader>
                        <PanelTitle>
                            {categorias.find(c => c.id === catActivaId)?.nombre ?? "Selecciona una categoría"}
                        </PanelTitle>
                        {catActivaId && (
                            <BtnPrimary onClick={() => abrirModalItem()}>
                                <RiAddLine /> Nuevo ítem
                            </BtnPrimary>
                        )}
                    </PanelHeader>

                    <ItemsGrid>
                        <AnimatePresence>
                            {itemsCat.map((item, i) => (
                                <motion.div key={item.id}
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    layout
                                >
                                    <ItemCard $unavailable={!item.disponible}>
                                        <ItemCardTop>
                                            <ItemNombre>{item.nombre}</ItemNombre>
                                            <DisponibleSwitch onClick={() => toggleDisponible(item)}>
                                                {item.disponible
                                                    ? <RiToggleFill size={22} style={{ color: "#22c55e" }} />
                                                    : <RiToggleLine size={22} style={{ color: "rgba(255,255,255,0.25)" }} />
                                                }
                                            </DisponibleSwitch>
                                        </ItemCardTop>
                                        {item.descripcion && <ItemDesc>{item.descripcion}</ItemDesc>}
                                        <ItemPrecio>{COP(item.precio)}</ItemPrecio>
                                        {!item.disponible && <AgotadoBadge>No disponible</AgotadoBadge>}
                                        <ItemCardActions>
                                            <ActionBtn onClick={() => abrirModalItem(item)}><RiEditLine /> Editar</ActionBtn>
                                            <ActionBtn $red onClick={() => eliminarItem(item)}><RiDeleteBinLine /></ActionBtn>
                                        </ItemCardActions>
                                    </ItemCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {catActivaId && itemsCat.length === 0 && (
                            <EmptyTip style={{ gridColumn: "1/-1" }}>Esta categoría no tiene ítems aún.</EmptyTip>
                        )}
                    </ItemsGrid>
                </ItemsPanel>
            </Body>

            {/* ── Modal categoría ── */}
            <AnimatePresence>
                {modalCat && (
                    <>
                        <ModalOverlay onClick={() => setModalCat(null)} />
                        <Modal initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}>
                            <ModalHeader>
                                <h3>{modalCat === "nueva" ? "Nueva categoría" : "Editar categoría"}</h3>
                                <MiniBtn onClick={() => setModalCat(null)}><RiCloseLine /></MiniBtn>
                            </ModalHeader>
                            <FormGroup>
                                <FormLabel>Nombre *</FormLabel>
                                <FormInput
                                    autoFocus
                                    value={formCat.nombre}
                                    onChange={e => setFormCat(f => ({ ...f, nombre: e.target.value }))}
                                    placeholder="Ej: Entradas, Bebidas..."
                                    onKeyDown={e => e.key === "Enter" && guardarCat()}
                                />
                            </FormGroup>
                            <ModalFooter>
                                <BtnSecondary onClick={() => setModalCat(null)}>Cancelar</BtnSecondary>
                                <BtnPrimary onClick={guardarCat}><RiCheckLine /> Guardar</BtnPrimary>
                            </ModalFooter>
                        </Modal>
                    </>
                )}
            </AnimatePresence>

            {/* ── Modal ítem ── */}
            <AnimatePresence>
                {modalItem && (
                    <>
                        <ModalOverlay onClick={() => setModalItem(null)} />
                        <Modal initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}>
                            <ModalHeader>
                                <h3>{modalItem === "nuevo" ? "Nuevo ítem" : "Editar ítem"}</h3>
                                <MiniBtn onClick={() => setModalItem(null)}><RiCloseLine /></MiniBtn>
                            </ModalHeader>

                            <FormGroup>
                                <FormLabel>Categoría *</FormLabel>
                                <FormSelect
                                    value={formItem.id_categoria}
                                    onChange={e => setFormItem(f => ({ ...f, id_categoria: e.target.value }))}
                                >
                                    <option value="">Seleccionar...</option>
                                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </FormSelect>
                            </FormGroup>
                            <FormGroup>
                                <FormLabel>Nombre del plato *</FormLabel>
                                <FormInput
                                    autoFocus
                                    value={formItem.nombre}
                                    onChange={e => setFormItem(f => ({ ...f, nombre: e.target.value }))}
                                    placeholder="Ej: Bandeja paisa..."
                                />
                            </FormGroup>
                            <FormGroup>
                                <FormLabel>Descripción (opcional)</FormLabel>
                                <FormTextarea
                                    value={formItem.descripcion}
                                    onChange={e => setFormItem(f => ({ ...f, descripcion: e.target.value }))}
                                    placeholder="Ingredientes o detalles..."
                                    rows={2}
                                />
                            </FormGroup>
                            <FormGroup>
                                <FormLabel>Precio (COP) *</FormLabel>
                                <FormInput
                                    type="number" min="0" step="100"
                                    value={formItem.precio}
                                    onChange={e => setFormItem(f => ({ ...f, precio: e.target.value }))}
                                    placeholder="15000"
                                />
                            </FormGroup>
                            <ModalFooter>
                                <BtnSecondary onClick={() => setModalItem(null)}>Cancelar</BtnSecondary>
                                <BtnPrimary onClick={guardarItem}><RiCheckLine /> Guardar</BtnPrimary>
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
    padding: 24px; min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
`;

const Header = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px;
`;

const HeaderLeft = styled.div`display: flex; align-items: center; gap: 14px;`;

const HeaderIcon = styled.div`
    width: 46px; height: 46px; border-radius: 14px;
    background: rgba(249,115,22,0.12); color: #f97316;
    display: flex; align-items: center; justify-content: center; font-size: 22px;
`;

const HeaderTitle = styled.h1`
    font-size: 20px; font-weight: 800;
    color: ${({ theme }) => theme.text}; margin: 0;
`;

const HeaderSub = styled.p`
    font-size: 13px; color: ${({ theme }) => theme.text2}; margin: 2px 0 0;
`;

const Body = styled.div`
    display: grid; grid-template-columns: 260px 1fr;
    gap: 20px; align-items: start;
    @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const CatPanel = styled.div`
    border-radius: 16px; overflow: hidden;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards};
`;

const PanelHeader = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const PanelTitle = styled.div`
    font-size: 14px; font-weight: 800; color: ${({ theme }) => theme.text};
`;

const BtnIconSmall = styled.button`
    width: 28px; height: 28px; border-radius: 8px; border: none;
    background: rgba(249,115,22,0.15); color: #f97316;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; cursor: pointer;
    &:hover { background: rgba(249,115,22,0.25); }
`;

const CatList = styled.div`display: flex; flex-direction: column;`;

const CatItem = styled.div`
    display: flex; align-items: center; gap: 8px;
    padding: 12px 16px; cursor: pointer;
    border-left: 3px solid ${({ $active }) => $active ? "#f97316" : "transparent"};
    background: ${({ $active }) => $active ? "rgba(249,115,22,0.08)" : "transparent"};
    opacity: ${({ $inactive }) => $inactive ? 0.45 : 1};
    transition: background 0.15s, border-color 0.15s;
    &:hover { background: rgba(255,255,255,0.04); }
`;

const CatName = styled.span`
    flex: 1; font-size: 13px; font-weight: 700;
    color: ${({ $active, theme }) => $active ? "#f97316" : theme.text};
`;

const CatCount = styled.span`
    font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.3);
`;

const CatActions = styled.div`
    display: flex; gap: 2px; opacity: 0;
    ${CatItem}:hover & { opacity: 1; }
`;

const MiniBtn = styled.button`
    width: 24px; height: 24px; border-radius: 6px; border: none;
    background: ${({ $red }) => $red ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.07)"};
    color: ${({ $red }) => $red ? "#ef4444" : "rgba(255,255,255,0.5)"};
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; cursor: pointer;
    &:hover { background: ${({ $red }) => $red ? "rgba(239,68,68,0.22)" : "rgba(255,255,255,0.13)"}; }
`;

const ItemsPanel = styled.div`
    border-radius: 16px; overflow: hidden;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards};
`;

const BtnPrimary = styled.button`
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 8px; border: none;
    background: #f97316; color: #fff; font-size: 12px; font-weight: 700;
    font-family: "Poppins", sans-serif; cursor: pointer;
    &:hover { filter: brightness(1.1); }
`;

const ItemsGrid = styled.div`
    padding: 16px;
    display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
`;

const ItemCard = styled.div`
    border-radius: 14px; padding: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    opacity: ${({ $unavailable }) => $unavailable ? 0.55 : 1};
    transition: border-color 0.15s;
    &:hover { border-color: rgba(249,115,22,0.3); }
`;

const ItemCardTop = styled.div`
    display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
`;

const ItemNombre = styled.div`
    font-size: 14px; font-weight: 800; color: ${({ theme }) => theme.text};
    margin-bottom: 4px; flex: 1;
`;

const DisponibleSwitch = styled.button`
    background: none; border: none; cursor: pointer;
    display: flex; align-items: center; padding: 0; flex-shrink: 0;
`;

const ItemDesc = styled.div`
    font-size: 11px; color: rgba(255,255,255,0.35);
    margin-bottom: 8px; line-height: 1.4;
`;

const ItemPrecio = styled.div`
    font-size: 15px; font-weight: 900; color: #f97316; margin-bottom: 6px;
`;

const AgotadoBadge = styled.span`
    display: inline-block; font-size: 10px; font-weight: 700;
    color: #f59e0b; background: rgba(245,158,11,0.12);
    border: 1px solid rgba(245,158,11,0.3); padding: 2px 8px;
    border-radius: 20px; margin-bottom: 8px;
`;

const ItemCardActions = styled.div`
    display: flex; gap: 6px; margin-top: 10px;
`;

const ActionBtn = styled.button`
    display: flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 7px; border: none;
    background: ${({ $red }) => $red ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)"};
    color: ${({ $red }) => $red ? "#ef4444" : "rgba(255,255,255,0.6)"};
    font-size: 11px; font-weight: 700; font-family: "Poppins", sans-serif;
    cursor: pointer;
    &:hover { background: ${({ $red }) => $red ? "rgba(239,68,68,0.22)" : "rgba(255,255,255,0.12)"}; }
`;

const EmptyTip = styled.p`
    font-size: 12px; color: rgba(255,255,255,0.25);
    padding: 16px; text-align: center;
`;

/* ── Modal shared ── */
const ModalOverlay = styled.div`
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    z-index: 300; backdrop-filter: blur(2px);
`;

const Modal = styled(motion.div)`
    position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
    z-index: 301; width: 400px; max-width: 95vw;
    border-radius: 20px;
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
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none;
    &:focus { border-color: #f97316; }
`;

const FormTextarea = styled.textarea`
    padding: 9px 12px; border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif;
    outline: none; resize: vertical;
    &:focus { border-color: #f97316; }
`;

const FormSelect = styled.select`
    padding: 9px 12px; border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none;
    &:focus { border-color: #f97316; }
`;

const ModalFooter = styled.div`
    display: flex; gap: 8px; justify-content: flex-end;
`;

const BtnSecondary = styled.button`
    padding: 8px 16px; border-radius: 9px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: transparent; color: ${({ theme }) => theme.text};
    font-size: 12px; font-weight: 600; font-family: "Poppins", sans-serif;
    cursor: pointer;
`;
