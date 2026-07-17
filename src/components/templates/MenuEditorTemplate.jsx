import { useState } from "react";
import styled, { css } from "styled-components";
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
    RiPriceTag3Line,
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

    const [catSel, setCatSel]       = useState(null);
    const [modalCat, setModalCat]   = useState(null);
    const [formCat, setFormCat]     = useState(FORM_CAT_INIT);
    const [modalItem, setModalItem] = useState(null);
    const [formItem, setFormItem]   = useState(FORM_ITEM_INIT);

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
    const catNombre   = categorias.find(c => c.id === catActivaId)?.nombre;

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
            id_categoria: formItem.id_categoria,
            nombre:       formItem.nombre.trim(),
            descripcion:  formItem.descripcion.trim() || null,
            precio:       parseFloat(formItem.precio),
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
            {/* ── Header ── */}
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
                {/* ── Panel categorías ── */}
                <CatPanel>
                    <PanelHeader>
                        <PanelTitle>Categorías</PanelTitle>
                        <AddBtn onClick={() => abrirModalCat()}>
                            <RiAddLine /> Nueva
                        </AddBtn>
                    </PanelHeader>

                    <CatList>
                        <AnimatePresence>
                            {categorias.map((cat, i) => (
                                <motion.div key={cat.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <CatItem
                                        $active={catActivaId === cat.id}
                                        $inactive={!cat.activa}
                                        onClick={() => setCatSel(cat.id)}
                                    >
                                        <CatName $active={catActivaId === cat.id}>{cat.nombre}</CatName>
                                        <CatBadge $active={catActivaId === cat.id}>
                                            {items.filter(it => it.id_categoria === cat.id).length}
                                        </CatBadge>
                                        <CatActions onClick={e => e.stopPropagation()}>
                                            <MiniBtn onClick={() => toggleCatActiva(cat)} title={cat.activa ? "Desactivar" : "Activar"}>
                                                {cat.activa
                                                    ? <RiToggleFill style={{ color: "#22c55e" }} />
                                                    : <RiToggleLine style={{ color: "rgba(255,255,255,0.2)" }} />
                                                }
                                            </MiniBtn>
                                            <MiniBtn onClick={() => abrirModalCat(cat)}><RiEditLine /></MiniBtn>
                                            <MiniBtn $red onClick={() => eliminarCat(cat)}><RiDeleteBinLine /></MiniBtn>
                                        </CatActions>
                                    </CatItem>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {categorias.length === 0 && (
                            <EmptyTip>
                                <span>Sin categorías aún</span>
                                <small>Ej: Entradas, Bebidas, Postres…</small>
                            </EmptyTip>
                        )}
                    </CatList>
                </CatPanel>

                {/* ── Panel ítems ── */}
                <ItemsPanel>
                    <PanelHeader>
                        <PanelTitle>{catNombre ?? "Selecciona una categoría"}</PanelTitle>
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
                                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    layout
                                >
                                    <ItemCard $unavailable={!item.disponible}>
                                        <ItemCardTop>
                                            <ItemNombre>{item.nombre}</ItemNombre>
                                            <DisponibleSwitch
                                                onClick={() => toggleDisponible(item)}
                                                title={item.disponible ? "Marcar no disponible" : "Marcar disponible"}
                                            >
                                                {item.disponible
                                                    ? <RiToggleFill size={24} style={{ color: "#22c55e" }} />
                                                    : <RiToggleLine size={24} style={{ color: "rgba(255,255,255,0.2)" }} />
                                                }
                                            </DisponibleSwitch>
                                        </ItemCardTop>
                                        {item.descripcion && <ItemDesc>{item.descripcion}</ItemDesc>}
                                        <ItemFooter>
                                            <ItemPrecio>
                                                <RiPriceTag3Line size={13} />
                                                {COP(item.precio)}
                                            </ItemPrecio>
                                            {!item.disponible && <AgotadoBadge>No disponible</AgotadoBadge>}
                                        </ItemFooter>
                                        <ItemCardActions>
                                            <ActionBtn onClick={() => abrirModalItem(item)}>
                                                <RiEditLine /> Editar
                                            </ActionBtn>
                                            <ActionBtn $red onClick={() => eliminarItem(item)}>
                                                <RiDeleteBinLine />
                                            </ActionBtn>
                                        </ItemCardActions>
                                    </ItemCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {catActivaId && itemsCat.length === 0 && (
                            <EmptyTip style={{ gridColumn: "1/-1" }}>
                                <span>Esta categoría no tiene ítems</span>
                                <small>Agrega platos, bebidas o lo que ofrezcas</small>
                            </EmptyTip>
                        )}
                        {!catActivaId && categorias.length > 0 && (
                            <EmptyTip style={{ gridColumn: "1/-1" }}>
                                <span>Selecciona una categoría</span>
                                <small>para ver y editar sus ítems</small>
                            </EmptyTip>
                        )}
                    </ItemsGrid>
                </ItemsPanel>
            </Body>

            {/* ── Modal categoría ── */}
            <AnimatePresence>
                {modalCat && (
                    <>
                        <ModalOverlay onClick={() => setModalCat(null)} />
                        <ModalCenter>
                            <Modal
                                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                                animate={{ opacity: 1, scale: 1,    y: 0  }}
                                exit={{   opacity: 0, scale: 0.88,  y: 10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                <ModalHeader>
                                    <ModalTitle>{modalCat === "nueva" ? "Nueva categoría" : "Editar categoría"}</ModalTitle>
                                    <CloseBtn onClick={() => setModalCat(null)}><RiCloseLine /></CloseBtn>
                                </ModalHeader>
                                <ModalBody>
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
                                </ModalBody>
                                <ModalFooter>
                                    <BtnSecondary onClick={() => setModalCat(null)}>Cancelar</BtnSecondary>
                                    <BtnPrimary onClick={guardarCat}><RiCheckLine /> Guardar</BtnPrimary>
                                </ModalFooter>
                            </Modal>
                        </ModalCenter>
                    </>
                )}
            </AnimatePresence>

            {/* ── Modal ítem ── */}
            <AnimatePresence>
                {modalItem && (
                    <>
                        <ModalOverlay onClick={() => setModalItem(null)} />
                        <ModalCenter>
                            <Modal
                                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                                animate={{ opacity: 1, scale: 1,    y: 0  }}
                                exit={{   opacity: 0, scale: 0.88,  y: 10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                <ModalHeader>
                                    <ModalTitle>{modalItem === "nuevo" ? "Nuevo ítem" : "Editar ítem"}</ModalTitle>
                                    <CloseBtn onClick={() => setModalItem(null)}><RiCloseLine /></CloseBtn>
                                </ModalHeader>
                                <ModalBody>
                                    <FormRow>
                                        <FormGroup>
                                            <FormLabel>Categoría *</FormLabel>
                                            <FormSelect
                                                value={formItem.id_categoria}
                                                onChange={e => setFormItem(f => ({ ...f, id_categoria: e.target.value }))}
                                            >
                                                <option value="">Seleccionar...</option>
                                                {categorias.map(c => (
                                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                                ))}
                                            </FormSelect>
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
                                    </FormRow>
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
                                </ModalBody>
                                <ModalFooter>
                                    <BtnSecondary onClick={() => setModalItem(null)}>Cancelar</BtnSecondary>
                                    <BtnPrimary onClick={guardarItem}><RiCheckLine /> Guardar</BtnPrimary>
                                </ModalFooter>
                            </Modal>
                        </ModalCenter>
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
    display: flex; align-items: center;
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

const ItemsPanel = styled.div`
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

const AddBtn = styled.button`
    display: flex; align-items: center; gap: 4px;
    padding: 5px 11px; border-radius: 8px; border: none;
    background: rgba(249,115,22,0.14); color: #f97316;
    font-size: 12px; font-weight: 700; font-family: "Poppins", sans-serif;
    cursor: pointer; transition: background 0.15s;
    &:hover { background: rgba(249,115,22,0.26); }
`;

const CatList = styled.div`display: flex; flex-direction: column;`;

const CatItem = styled.div`
    display: flex; align-items: center; gap: 8px;
    padding: 11px 16px; cursor: pointer;
    border-left: 3px solid ${({ $active }) => $active ? "#f97316" : "transparent"};
    background: ${({ $active }) => $active ? "rgba(249,115,22,0.07)" : "transparent"};
    opacity: ${({ $inactive }) => $inactive ? 0.38 : 1};
    transition: background 0.15s, border-color 0.15s;
    &:hover { background: rgba(255,255,255,0.04); }
`;

const CatName = styled.span`
    flex: 1; font-size: 13px; font-weight: 700;
    color: ${({ $active, theme }) => $active ? "#f97316" : theme.text};
    transition: color 0.15s;
`;

const CatBadge = styled.span`
    font-size: 11px; font-weight: 800;
    color: ${({ $active }) => $active ? "#f97316" : "rgba(255,255,255,0.3)"};
    background: ${({ $active }) => $active ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.06)"};
    padding: 1px 8px; border-radius: 20px;
    transition: all 0.15s;
`;

const CatActions = styled.div`
    display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s;
    ${CatItem}:hover & { opacity: 1; }
`;

const MiniBtn = styled.button`
    width: 24px; height: 24px; border-radius: 6px; border: none;
    background: ${({ $red }) => $red ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.06)"};
    color: ${({ $red }) => $red ? "#ef4444" : "rgba(255,255,255,0.45)"};
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; cursor: pointer; transition: background 0.15s;
    &:hover { background: ${({ $red }) => $red ? "rgba(239,68,68,0.22)" : "rgba(255,255,255,0.13)"}; }
`;

const BtnPrimary = styled.button`
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 9px; border: none;
    background: #f97316; color: #fff; font-size: 12px; font-weight: 700;
    font-family: "Poppins", sans-serif; cursor: pointer; transition: filter 0.15s;
    &:hover { filter: brightness(1.12); }
`;

const ItemsGrid = styled.div`
    padding: 16px;
    display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 14px;
`;

const ItemCard = styled.div`
    border-radius: 14px; padding: 16px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
    opacity: ${({ $unavailable }) => $unavailable ? 0.5 : 1};
    transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
    &:hover {
        border-color: rgba(249,115,22,0.3);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    }
`;

const ItemCardTop = styled.div`
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 8px; margin-bottom: 6px;
`;

const ItemNombre = styled.div`
    font-size: 14px; font-weight: 800; color: ${({ theme }) => theme.text};
    flex: 1; line-height: 1.3;
`;

const DisponibleSwitch = styled.button`
    background: none; border: none; cursor: pointer;
    display: flex; align-items: center; padding: 0; flex-shrink: 0;
    transition: transform 0.12s;
    &:hover { transform: scale(1.1); }
`;

const ItemDesc = styled.div`
    font-size: 11px; color: rgba(255,255,255,0.3);
    margin-bottom: 10px; line-height: 1.5;
`;

const ItemFooter = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px; flex-wrap: wrap; gap: 6px;
`;

const ItemPrecio = styled.div`
    display: flex; align-items: center; gap: 5px;
    font-size: 15px; font-weight: 900; color: #f97316;
`;

const AgotadoBadge = styled.span`
    display: inline-block; font-size: 10px; font-weight: 700;
    color: #f59e0b; background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.25); padding: 2px 8px; border-radius: 20px;
`;

const ItemCardActions = styled.div`
    display: flex; gap: 6px;
    padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);
`;

const ActionBtn = styled.button`
    display: flex; align-items: center; gap: 4px;
    padding: 5px 12px; border-radius: 7px; border: none;
    background: ${({ $red }) => $red ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)"};
    color: ${({ $red }) => $red ? "#ef4444" : "rgba(255,255,255,0.5)"};
    font-size: 11px; font-weight: 700; font-family: "Poppins", sans-serif;
    cursor: pointer; transition: background 0.15s;
    &:hover { background: ${({ $red }) => $red ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.1)"}; }
`;

const EmptyTip = styled.div`
    display: flex; flex-direction: column; align-items: center;
    gap: 5px; padding: 28px 16px; text-align: center;
    span { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.28); }
    small { font-size: 11px; color: rgba(255,255,255,0.16); }
`;

/* ── Modal ── */
const ModalOverlay = styled.div`
    position: fixed; inset: 0; background: rgba(0,0,0,0.55);
    z-index: 300; backdrop-filter: blur(3px);
`;

const ModalCenter = styled.div`
    position: fixed; inset: 0; z-index: 301;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
`;

const Modal = styled(motion.div)`
    pointer-events: all;
    width: 440px; max-width: calc(100vw - 40px);
    border-radius: 20px;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    display: flex; flex-direction: column;
    box-shadow: 0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04);
    overflow: hidden;
`;

const ModalHeader = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 22px 18px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const ModalTitle = styled.h3`
    font-size: 16px; font-weight: 800; color: ${({ theme }) => theme.text}; margin: 0;
`;

const CloseBtn = styled.button`
    width: 30px; height: 30px; border-radius: 8px; border: none;
    background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; cursor: pointer; transition: background 0.15s, color 0.15s;
    &:hover { background: rgba(239,68,68,0.14); color: #ef4444; }
`;

const ModalBody = styled.div`
    padding: 20px 22px; display: flex; flex-direction: column; gap: 14px;
`;

const FormRow = styled.div`
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
`;

const FormGroup = styled.div`display: flex; flex-direction: column; gap: 6px;`;

const FormLabel = styled.label`
    font-size: 11px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.5px; color: rgba(255,255,255,0.35);
`;

const fieldBase = css`
    padding: 10px 13px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none;
    transition: border-color 0.15s, background 0.15s;
    &:focus { border-color: #f97316; background: rgba(249,115,22,0.04); }
`;

const FormInput    = styled.input`${fieldBase}`;
const FormTextarea = styled.textarea`${fieldBase} resize: vertical;`;
const FormSelect   = styled.select`${fieldBase}`;

const ModalFooter = styled.div`
    display: flex; gap: 8px; justify-content: flex-end;
    padding: 14px 22px 18px;
    border-top: 1px solid rgba(255,255,255,0.06);
`;

const BtnSecondary = styled.button`
    padding: 9px 18px; border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.55);
    font-size: 12px; font-weight: 600; font-family: "Poppins", sans-serif;
    cursor: pointer; transition: background 0.15s;
    &:hover { background: rgba(255,255,255,0.08); }
`;
