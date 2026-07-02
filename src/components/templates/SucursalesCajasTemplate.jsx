import { useState, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { MostrarSucursales, InsertarSucursal, EditarSucursal, EliminarSucursal } from "../../supabase/crudSucursales";
import { MostrarAlmacenesPorEmpresa, InsertarAlmacen, EditarAlmacen, EliminarAlmacen, SubirLogoAlmacen } from "../../supabase/crudAlmacenesConfig";
import { RiEditLine, RiDeleteBin2Line, RiAddLine, RiCloseLine, RiImageAddLine, RiStoreLine, RiErrorWarningLine } from "react-icons/ri";
import { toastExito, confirmar } from "../../utils/toast";
import { usePlan } from "../../hooks/usePlan";

export function SucursalesCajasTemplate() {
    const { dataempresa } = useEmpresaStore();
    const { datausuarios } = useUsuariosStore();
    const queryClient = useQueryClient();
    const id_empresa = dataempresa?.id;
    const esSupervisor = datausuarios?.tipo === "supervisor";
    const { limites, tipoPlan } = usePlan();

    const [modalSuc, setModalSuc] = useState(false);
    const [editSuc, setEditSuc]   = useState(null);
    const [nombreSuc, setNombreSuc] = useState("");
    const [dirSuc, setDirSuc]       = useState("");

    const [modalAlm, setModalAlm]     = useState(false);
    const [editAlm, setEditAlm]       = useState(null);
    const [nombreAlm, setNombreAlm]   = useState("");
    const [metaAlm, setMetaAlm]       = useState("");
    const [almParaSuc, setAlmParaSuc] = useState(null);
    const [logoFile,    setLogoFile]    = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const logoRef = useRef(null);

    const { data: sucursales = [] } = useQuery({
        queryKey: ["sucursales-config", id_empresa],
        queryFn: () => MostrarSucursales({ id_empresa }),
        enabled: !!id_empresa, refetchOnWindowFocus: false,
    });

    const { data: almacenes = [] } = useQuery({
        queryKey: ["almacenes-config", id_empresa],
        queryFn: () => MostrarAlmacenesPorEmpresa({ id_empresa }),
        enabled: !!id_empresa, refetchOnWindowFocus: false,
    });

    const invalidar = () => {
        queryClient.invalidateQueries({ queryKey: ["sucursales-config"] });
        queryClient.invalidateQueries({ queryKey: ["almacenes-config"] });
        queryClient.invalidateQueries({ queryKey: ["almacenes-usr"] });
    };

    // ── Sucursales mutations ──
    const mutCrearSuc = useMutation({
        mutationFn: () => InsertarSucursal({ id_empresa, razon_social: nombreSuc, direccion: dirSuc }),
        onSuccess: () => { toastExito("Sucursal creada"); invalidar(); cerrarModalSuc(); },
    });
    const mutEditarSuc = useMutation({
        mutationFn: () => EditarSucursal({ id: editSuc.id, id_empresa: editSuc.id_empresa, razon_social: nombreSuc, direccion: dirSuc }),
        onSuccess: () => { toastExito("Sucursal actualizada"); invalidar(); cerrarModalSuc(); },
    });
    const mutEliminarSuc = useMutation({
        mutationFn: (suc) => EliminarSucursal({ id: suc.id, id_empresa: suc.id_empresa }),
        onSuccess: () => { toastExito("Sucursal eliminada"); invalidar(); },
    });

    // ── Almacenes mutations ──
    const mutCrearAlm = useMutation({
        mutationFn: async () => {
            const alm = await InsertarAlmacen({ id_sucursal: almParaSuc, id_empresa, nombre: nombreAlm, meta_ventas: Number(metaAlm) || 0 });
            if (logoFile && alm?.id) await SubirLogoAlmacen({ id: alm.id, id_empresa, file: logoFile });
            return alm;
        },
        onSuccess: () => { toastExito("Almacén creado"); invalidar(); cerrarModalAlm(); },
    });
    const mutEditarAlm = useMutation({
        mutationFn: async () => {
            await EditarAlmacen({ id: editAlm.id, id_empresa: editAlm.id_empresa, nombre: nombreAlm, meta_ventas: Number(metaAlm) || 0 });
            if (logoFile) await SubirLogoAlmacen({ id: editAlm.id, id_empresa: editAlm.id_empresa, file: logoFile });
        },
        onSuccess: () => { toastExito("Almacén actualizado"); invalidar(); cerrarModalAlm(); },
    });
    const mutEliminarAlm = useMutation({
        mutationFn: (alm) => EliminarAlmacen({ id: alm.id, id_empresa: alm.id_empresa }),
        onSuccess: () => { toastExito("Almacén eliminado"); invalidar(); },
    });

    // ── Modal helpers ──
    function abrirNuevaSuc() { setNombreSuc(""); setDirSuc(""); setEditSuc(null); setModalSuc(true); }
    function abrirEditarSuc(s) { setNombreSuc(s.razon_social ?? ""); setDirSuc(s.direccion ?? ""); setEditSuc(s); setModalSuc(true); }
    function cerrarModalSuc() { setModalSuc(false); setEditSuc(null); }

    function abrirNuevoAlm(idSuc) { setNombreAlm(""); setMetaAlm(""); setEditAlm(null); setAlmParaSuc(idSuc); setLogoFile(null); setLogoPreview(null); setModalAlm(true); }
    function abrirEditarAlm(a) { setNombreAlm(a.nombre ?? ""); setMetaAlm(String(a.meta_ventas ?? "")); setEditAlm(a); setLogoFile(null); setLogoPreview(a.icono && a.icono !== "-" ? a.icono : null); setModalAlm(true); }
    function cerrarModalAlm() { setModalAlm(false); setEditAlm(null); setLogoFile(null); setLogoPreview(null); }

    function pickLogoFile(e) {
        const f = e.target.files?.[0];
        if (!f) return;
        setLogoFile(f);
        const r = new FileReader();
        r.onload = () => setLogoPreview(r.result);
        r.readAsDataURL(f);
    }

    function handleGuardarSuc(e) {
        e.preventDefault();
        editSuc ? mutEditarSuc.mutate() : mutCrearSuc.mutate();
    }
    function handleGuardarAlm(e) {
        e.preventDefault();
        editAlm ? mutEditarAlm.mutate() : mutCrearAlm.mutate();
    }

    const sucursalesFiltradas = esSupervisor
        ? sucursales.filter(s => String(s.id) === String(datausuarios?.id_sucursal))
        : sucursales;

    const limiteAlmAlcanzado = limites.max_almacenes !== Infinity && almacenes.length >= limites.max_almacenes;

    return (
        <Page>
            <TopBar>
                <div>
                    <h1>{esSupervisor ? "Almacenes" : "Sucursales y almacenes"}</h1>
                    <p>{esSupervisor ? "gestiona los almacenes de tu sucursal" : "gestiona tus puntos de venta y sus almacenes de inventario"}</p>
                </div>
                <PlanLimitBadge $alerta={limiteAlmAlcanzado}>
                    {almacenes.length} / {limites.max_almacenes === Infinity ? "∞" : limites.max_almacenes} almacenes · {tipoPlan}
                </PlanLimitBadge>
            </TopBar>

            {limiteAlmAlcanzado && (
                <LimitAlert>
                    <RiErrorWarningLine />
                    Tu plan <strong>{tipoPlan}</strong> permite hasta <strong>{limites.max_almacenes} almacén{limites.max_almacenes !== 1 ? "es" : ""}</strong>. Actualiza tu plan para agregar más.
                </LimitAlert>
            )}

            {!esSupervisor && (
                <BtnAgregar onClick={abrirNuevaSuc}>
                    <RiAddLine /> agregar sucursal
                </BtnAgregar>
            )}

            <Grid>
                {sucursalesFiltradas.map((suc, i) => {
                    const almsDeEsta = almacenes.filter(a => a.id_sucursal === suc.id);
                    return (
                        <SucursalCard key={suc.id} $i={i}>
                            {!esSupervisor && (
                                <>
                                    <SucHeader>
                                        <SucTitulo>SUCURSAL: {(suc.razon_social ?? "Sin nombre").toUpperCase()}</SucTitulo>
                                        <SucActions>
                                            <BtnIco onClick={() => abrirEditarSuc(suc)}><RiEditLine /></BtnIco>
                                            <BtnIco $rojo onClick={() => confirmar({
                                                titulo: "¿Eliminar sucursal?",
                                                texto: `Se eliminará "${suc.razon_social}" y todos sus almacenes.`,
                                                onConfirmar: () => mutEliminarSuc.mutate(suc),
                                            })}><RiDeleteBin2Line /></BtnIco>
                                        </SucActions>
                                    </SucHeader>
                                    {suc.direccion && <SucDireccion>{suc.direccion}</SucDireccion>}
                                </>
                            )}

                            <AlmacenesLista>
                                {almsDeEsta.map(alm => (
                                    <AlmItem key={alm.id}>
                                        {alm.icono && alm.icono !== "-"
                                            ? <AlmLogo src={alm.icono} alt={alm.nombre} />
                                            : <AlmLogoPlaceholder><RiStoreLine /></AlmLogoPlaceholder>}
                                        <AlmInfo>
                                            <AlmNombre>{alm.nombre}</AlmNombre>
                                            <AlmFecha>
                                                {alm.meta_ventas > 0
                                                    ? `Meta: $${Number(alm.meta_ventas).toLocaleString("es-CO")}/mes`
                                                    : "Sin meta asignada"}
                                            </AlmFecha>
                                        </AlmInfo>
                                        <AlmActions>
                                            <BtnIco onClick={() => abrirEditarAlm(alm)}><RiEditLine /></BtnIco>
                                            <BtnIco $rojo onClick={() => confirmar({
                                                titulo: "¿Eliminar almacén?",
                                                texto: `Se eliminará "${alm.nombre}" y todo su inventario.`,
                                                onConfirmar: () => mutEliminarAlm.mutate(alm),
                                            })}><RiDeleteBin2Line /></BtnIco>
                                        </AlmActions>
                                    </AlmItem>
                                ))}

                                <BtnAgregarAlm
                                    onClick={() => !limiteAlmAlcanzado && abrirNuevoAlm(suc.id)}
                                    $bloqueado={limiteAlmAlcanzado}
                                    title={limiteAlmAlcanzado ? `Límite de ${limites.max_almacenes} almacén(es) alcanzado` : ""}
                                >
                                    <RiAddLine /> {limiteAlmAlcanzado ? `Límite alcanzado (${limites.max_almacenes} máx.)` : "agregar almacén"}
                                </BtnAgregarAlm>
                            </AlmacenesLista>
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

            {/* ── Modal Almacén ── */}
            {modalAlm && (
                <Overlay onClick={cerrarModalAlm}>
                    <Modal onClick={e => e.stopPropagation()}>
                        <ModalHeader>
                            <span>{editAlm ? "Editar almacén" : "Nuevo almacén"}</span>
                            <BtnCerrar onClick={cerrarModalAlm}><RiCloseLine /></BtnCerrar>
                        </ModalHeader>
                        <ModalForm onSubmit={handleGuardarAlm}>
                            <LogoZona onClick={() => logoRef.current?.click()} type="button">
                                {logoPreview
                                    ? <LogoImg src={logoPreview} alt="logo" />
                                    : <LogoPlaceholder><RiStoreLine /><span>logo del almacén<br/><em>opcional</em></span></LogoPlaceholder>}
                                <LogoEditBadge><RiImageAddLine /></LogoEditBadge>
                            </LogoZona>
                            <input type="file" accept="image/*" ref={logoRef} style={{ display: "none" }} onChange={pickLogoFile} />

                            <Campo>
                                <label>Nombre del almacén</label>
                                <Input value={nombreAlm} onChange={e => setNombreAlm(e.target.value)} placeholder="Ej: Bodega principal" required />
                            </Campo>
                            <Campo>
                                <label>Meta de ventas mensual ($)</label>
                                <Input type="number" min="0" value={metaAlm} onChange={e => setMetaAlm(e.target.value)} placeholder="Ej: 5000000" />
                            </Campo>
                            <BtnGuardar type="submit" disabled={mutCrearAlm.isPending || mutEditarAlm.isPending}>
                                {editAlm ? "Guardar cambios" : "Crear almacén"}
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

const AlmacenesLista = styled.div`
    display: flex; flex-direction: column; gap: 8px;
    border-top: 1px solid ${({ theme }) => theme.color2};
    padding-top: 14px;
`;

const AlmItem = styled.div`
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 10px 14px;
    background: ${({ theme }) => theme.bgtotal};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
`;

const AlmInfo = styled.div`display: flex; flex-direction: column; gap: 2px;`;
const AlmFecha = styled.span`font-size: 10px; color: ${({ theme }) => theme.colorsubtitlecard};`;
const AlmNombre = styled.span`font-size: 13px; font-weight: 700; color: ${({ theme }) => theme.text};`;
const AlmActions = styled.div`display: flex; gap: 4px;`;

const PlanLimitBadge = styled.span`
    font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px;
    font-family: "Poppins", sans-serif;
    background: ${({ $alerta }) => $alerta ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.06)"};
    color: ${({ $alerta }) => $alerta ? "#f87171" : "#94a3b8"};
    border: 1px solid ${({ $alerta }) => $alerta ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.08)"};
`;

const LimitAlert = styled.div`
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 12px; margin-bottom: 20px;
    background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25);
    color: #f87171; font-size: 13px; font-weight: 600;
    svg { font-size: 18px; flex-shrink: 0; }
`;

const BtnAgregarAlm = styled.button`
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 10px;
    border-radius: 12px;
    border: 2px dashed ${({ $bloqueado, theme }) => $bloqueado ? "rgba(248,113,113,0.3)" : theme.color2};
    background: ${({ $bloqueado }) => $bloqueado ? "rgba(248,113,113,0.05)" : "none"};
    color: ${({ $bloqueado }) => $bloqueado ? "#f87171" : "inherit"};
    font-size: 12px; font-weight: 700;
    cursor: ${({ $bloqueado }) => $bloqueado ? "not-allowed" : "pointer"};
    font-family: "Poppins", sans-serif;
    transition: all 0.15s;
    &:hover { border-color: #f88533; color: #f88533; }
`;

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

const LogoZona = styled.button`
    position: relative;
    width: 100%;
    height: 110px;
    border-radius: 14px;
    border: 2px dashed ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    cursor: pointer;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s;
    &:hover { border-color: #f88533; }
`;

const LogoImg = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const LogoPlaceholder = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    svg { font-size: 28px; }
    span {
        font-size: 12px;
        font-weight: 600;
        font-family: "Poppins", sans-serif;
        text-align: center;
        em { font-style: normal; font-size: 10px; opacity: 0.6; }
    }
`;

const LogoEditBadge = styled.div`
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(248,133,51,0.9);
    border-radius: 8px;
    padding: 4px 6px;
    display: flex;
    align-items: center;
    svg { font-size: 14px; color: #fff; }
`;

const AlmLogo = styled.img`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 1.5px solid rgba(255,255,255,0.1);
    margin-right: 4px;
`;

const AlmLogoPlaceholder = styled.div`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1.5px dashed ${({ theme }) => theme.color2};
    background: rgba(255,255,255,0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 4px;
    svg { font-size: 16px; color: ${({ theme }) => theme.colorsubtitlecard}; }
`;
