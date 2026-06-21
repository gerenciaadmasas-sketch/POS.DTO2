import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { MostrarSucursales, InsertarSucursal, EditarSucursal, EliminarSucursal } from "../../supabase/crudSucursales";
import { MostrarCajas, InsertarCaja, EditarCaja, EliminarCaja } from "../../supabase/crudCajas";
import { RiEditLine, RiDeleteBin2Line, RiAddLine, RiCloseLine } from "react-icons/ri";
import { toastExito } from "../../utils/toast";
import { confirmar } from "../../utils/toast";

export function SucursalesCajasTemplate() {
    const { dataempresa } = useEmpresaStore();
    const queryClient = useQueryClient();
    const id_empresa = dataempresa?.id;

    const [modalSuc, setModalSuc] = useState(false);
    const [editSuc, setEditSuc]   = useState(null);
    const [nombreSuc, setNombreSuc] = useState("");
    const [dirSuc, setDirSuc]       = useState("");

    const [modalCaja, setModalCaja] = useState(false);
    const [editCaja, setEditCaja]   = useState(null);
    const [nombreCaja, setNombreCaja] = useState("");
    const [cajaParaSuc, setCajaParaSuc] = useState(null);

    const { data: sucursales = [] } = useQuery({
        queryKey: ["sucursales-config", id_empresa],
        queryFn: () => MostrarSucursales({ id_empresa }),
        enabled: !!id_empresa, refetchOnWindowFocus: false,
    });

    const { data: cajas = [] } = useQuery({
        queryKey: ["cajas-config", id_empresa],
        queryFn: () => MostrarCajas({ id_empresa }),
        enabled: !!id_empresa, refetchOnWindowFocus: false,
    });

    const invalidar = () => {
        queryClient.invalidateQueries({ queryKey: ["sucursales-config"] });
        queryClient.invalidateQueries({ queryKey: ["cajas-config"] });
    };

    // ── Sucursales mutations ──
    const mutCrearSuc = useMutation({
        mutationFn: () => InsertarSucursal({ id_empresa, razon_social: nombreSuc, direccion: dirSuc }),
        onSuccess: () => { toastExito("Sucursal creada"); invalidar(); cerrarModalSuc(); },
    });
    const mutEditarSuc = useMutation({
        mutationFn: () => EditarSucursal({ id: editSuc.id, razon_social: nombreSuc, direccion: dirSuc }),
        onSuccess: () => { toastExito("Sucursal actualizada"); invalidar(); cerrarModalSuc(); },
    });
    const mutEliminarSuc = useMutation({
        mutationFn: (id) => EliminarSucursal({ id }),
        onSuccess: () => { toastExito("Sucursal eliminada"); invalidar(); },
    });

    // ── Cajas mutations ──
    const mutCrearCaja = useMutation({
        mutationFn: () => InsertarCaja({ id_sucursal: cajaParaSuc, id_empresa, nombre: nombreCaja }),
        onSuccess: () => { toastExito("Caja creada"); invalidar(); cerrarModalCaja(); },
    });
    const mutEditarCaja = useMutation({
        mutationFn: () => EditarCaja({ id: editCaja.id, nombre: nombreCaja }),
        onSuccess: () => { toastExito("Caja actualizada"); invalidar(); cerrarModalCaja(); },
    });
    const mutEliminarCaja = useMutation({
        mutationFn: (id) => EliminarCaja({ id }),
        onSuccess: () => { toastExito("Caja eliminada"); invalidar(); },
    });

    // ── Modal helpers ──
    function abrirNuevaSuc() { setNombreSuc(""); setDirSuc(""); setEditSuc(null); setModalSuc(true); }
    function abrirEditarSuc(s) { setNombreSuc(s.razon_social ?? ""); setDirSuc(s.direccion ?? ""); setEditSuc(s); setModalSuc(true); }
    function cerrarModalSuc() { setModalSuc(false); setEditSuc(null); }

    function abrirNuevaCaja(idSuc) { setNombreCaja(""); setEditCaja(null); setCajaParaSuc(idSuc); setModalCaja(true); }
    function abrirEditarCaja(c) { setNombreCaja(c.nombre ?? ""); setEditCaja(c); setModalCaja(true); }
    function cerrarModalCaja() { setModalCaja(false); setEditCaja(null); }

    function handleGuardarSuc(e) {
        e.preventDefault();
        editSuc ? mutEditarSuc.mutate() : mutCrearSuc.mutate();
    }
    function handleGuardarCaja(e) {
        e.preventDefault();
        editCaja ? mutEditarCaja.mutate() : mutCrearCaja.mutate();
    }

    return (
        <Page>
            <TopBar>
                <div>
                    <h1>Cajas por sucursal</h1>
                    <p>gestiona tus sucursales y cajas</p>
                </div>
            </TopBar>

            {/* Botón agregar sucursal */}
            <BtnAgregar onClick={abrirNuevaSuc}>
                <RiAddLine /> agregar sucursal
            </BtnAgregar>

            {/* Cards de sucursales */}
            <Grid>
                {sucursales.map((suc, i) => {
                    const cajasDeEsta = cajas.filter(c => c.id_sucursal === suc.id);
                    return (
                        <SucursalCard key={suc.id} $i={i}>
                            <SucHeader>
                                <SucTitulo>SUCURSAL: {(suc.razon_social ?? "Sin nombre").toUpperCase()}</SucTitulo>
                                <SucActions>
                                    <BtnIco onClick={() => abrirEditarSuc(suc)}><RiEditLine /></BtnIco>
                                    <BtnIco $rojo onClick={() => confirmar({
                                        titulo: "¿Eliminar sucursal?",
                                        texto: `Se eliminará "${suc.razon_social}" y todas sus cajas.`,
                                        onConfirmar: () => mutEliminarSuc.mutate(suc.id),
                                    })}><RiDeleteBin2Line /></BtnIco>
                                </SucActions>
                            </SucHeader>

                            {suc.direccion && <SucDireccion>{suc.direccion}</SucDireccion>}

                            {/* Cajas dentro de la sucursal */}
                            <CajasLista>
                                {cajasDeEsta.map(caja => (
                                    <CajaItem key={caja.id}>
                                        <CajaInfo>
                                            <CajaFecha>{new Date(caja.created_at).toLocaleDateString("es-CO")}</CajaFecha>
                                            <CajaNombre>{caja.nombre}</CajaNombre>
                                        </CajaInfo>
                                        <CajaActions>
                                            <BtnIco onClick={() => abrirEditarCaja(caja)}><RiEditLine /></BtnIco>
                                            <BtnIco $rojo onClick={() => confirmar({
                                                titulo: "¿Eliminar caja?",
                                                texto: `Se eliminará "${caja.nombre}".`,
                                                onConfirmar: () => mutEliminarCaja.mutate(caja.id),
                                            })}><RiDeleteBin2Line /></BtnIco>
                                        </CajaActions>
                                    </CajaItem>
                                ))}

                                <BtnAgregarCaja onClick={() => abrirNuevaCaja(suc.id)}>
                                    <RiAddLine /> agregar caja
                                </BtnAgregarCaja>
                            </CajasLista>
                        </SucursalCard>
                    );
                })}
            </Grid>

            {/* ── Modal Sucursal ── */}
            {modalSuc && (
                <Overlay onClick={cerrarModalSuc}>
                    <Modal onClick={e => e.stopPropagation()}>
                        <ModalHeader>
                            <span>{editSuc ? "Editar sucursal" : "Nueva sucursal"}</span>
                            <BtnCerrar onClick={cerrarModalSuc}><RiCloseLine /></BtnCerrar>
                        </ModalHeader>
                        <ModalForm onSubmit={handleGuardarSuc}>
                            <Campo>
                                <label>Nombre</label>
                                <Input value={nombreSuc} onChange={e => setNombreSuc(e.target.value)} placeholder="Ej: Sucursal Norte" required />
                            </Campo>
                            <Campo>
                                <label>Dirección</label>
                                <Input value={dirSuc} onChange={e => setDirSuc(e.target.value)} placeholder="Ej: Calle 50 #10-20" />
                            </Campo>
                            <BtnGuardar type="submit" disabled={mutCrearSuc.isPending || mutEditarSuc.isPending}>
                                {editSuc ? "Guardar cambios" : "Crear sucursal"}
                            </BtnGuardar>
                        </ModalForm>
                    </Modal>
                </Overlay>
            )}

            {/* ── Modal Caja ── */}
            {modalCaja && (
                <Overlay onClick={cerrarModalCaja}>
                    <Modal onClick={e => e.stopPropagation()}>
                        <ModalHeader>
                            <span>{editCaja ? "Editar caja" : "Nueva caja"}</span>
                            <BtnCerrar onClick={cerrarModalCaja}><RiCloseLine /></BtnCerrar>
                        </ModalHeader>
                        <ModalForm onSubmit={handleGuardarCaja}>
                            <Campo>
                                <label>Nombre de la caja</label>
                                <Input value={nombreCaja} onChange={e => setNombreCaja(e.target.value)} placeholder="Ej: Caja principal" required />
                            </Campo>
                            <BtnGuardar type="submit" disabled={mutCrearCaja.isPending || mutEditarCaja.isPending}>
                                {editCaja ? "Guardar cambios" : "Crear caja"}
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
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    padding: 28px;
    animation: ${fadeUp} 0.3s ease;
    @media (max-width: 767px) { padding: 68px 12px 20px; }
`;

const TopBar = styled.div`
    text-align: center;
    margin-bottom: 24px;
    h1 { font-size: 22px; font-weight: 900; color: ${({ theme }) => theme.text}; margin: 0 0 4px; }
    p  { font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard}; margin: 0; }
`;

const BtnAgregar = styled.button`
    display: flex; align-items: center; gap: 8px;
    margin: 0 auto 28px;
    padding: 14px 28px;
    border-radius: 14px;
    border: 2px dashed ${({ theme }) => theme.color2};
    background: none;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 14px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif;
    transition: all 0.15s;
    &:hover {
        border-color: #f88533;
        color: #f88533;
        background: rgba(248,133,51,0.06);
    }
`;

/* ── Grid ── */
const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 20px;
    max-width: 1000px;
    margin: 0 auto;
`;

const SucursalCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 18px;
    padding: 20px;
    animation: ${fadeUp} 0.35s ease both;
    animation-delay: ${({ $i }) => $i * 0.06}s;
    transition: box-shadow 0.2s;
    &:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.12); }
`;

const SucHeader = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 8px;
`;

const SucTitulo = styled.h3`
    font-size: 14px; font-weight: 900; color: ${({ theme }) => theme.text};
    margin: 0; letter-spacing: 0.3px;
`;

const SucActions = styled.div`display: flex; gap: 4px;`;

const SucDireccion = styled.div`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
    margin-bottom: 14px;
`;

const BtnIco = styled.button`
    background: none; border: none; cursor: pointer;
    font-size: 16px; padding: 5px; border-radius: 6px;
    color: ${({ $rojo, theme }) => $rojo ? "#f87171" : theme.colorsubtitlecard};
    display: flex; align-items: center;
    transition: background 0.15s;
    &:hover { background: rgba(255,255,255,0.08); }
`;

/* ── Cajas ── */
const CajasLista = styled.div`
    display: flex; flex-direction: column; gap: 8px;
    border-top: 1px solid ${({ theme }) => theme.color2};
    padding-top: 14px;
`;

const CajaItem = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px;
    background: ${({ theme }) => theme.bgtotal};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
`;

const CajaInfo = styled.div`display: flex; flex-direction: column; gap: 2px;`;

const CajaFecha = styled.span`
    font-size: 10px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const CajaNombre = styled.span`
    font-size: 13px; font-weight: 700; color: ${({ theme }) => theme.text};
`;

const CajaActions = styled.div`display: flex; gap: 4px;`;

const BtnAgregarCaja = styled.button`
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 10px;
    border-radius: 12px;
    border: 2px dashed ${({ theme }) => theme.color2};
    background: none;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 12px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif;
    transition: all 0.15s;
    &:hover {
        border-color: #f88533;
        color: #f88533;
    }
`;

/* ── Modal ── */
const Overlay = styled.div`
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.55);
    display: flex; align-items: center; justify-content: center;
    z-index: 300;
`;

const Modal = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 20px;
    padding: 24px;
    width: 380px;
    max-width: 92vw;
    box-shadow: 0 16px 48px rgba(0,0,0,0.35);
`;

const ModalHeader = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px;
    span { font-size: 16px; font-weight: 900; color: ${({ theme }) => theme.text}; }
`;

const BtnCerrar = styled.button`
    background: none; border: none; cursor: pointer;
    font-size: 20px; color: ${({ theme }) => theme.text};
    display: flex; align-items: center;
`;

const ModalForm = styled.form`
    display: flex; flex-direction: column; gap: 14px;
`;

const Campo = styled.div`
    display: flex; flex-direction: column; gap: 5px;
    label { font-size: 11px; font-weight: 700; color: ${({ theme }) => theme.colorsubtitlecard}; text-transform: uppercase; }
`;

const Input = styled.input`
    padding: 10px 14px; border-radius: 10px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif;
    outline: none;
    &:focus { border-color: #f88533; }
`;

const BtnGuardar = styled.button`
    padding: 12px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #f88533, #f56a00);
    color: #fff; font-size: 14px; font-weight: 700;
    cursor: pointer; font-family: "Poppins", sans-serif;
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
