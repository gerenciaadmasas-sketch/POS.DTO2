import { useRef, useState } from "react";
import styled from "styled-components";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useSucursalesStore } from "../../store/SucursalesStore";
import { useAlmacenesConfigStore } from "../../store/AlmacenesConfigStore";
import { SubirLogoAlmacen } from "../../supabase/crudAlmacenesConfig";
import { RiEditLine, RiDeleteBin2Line, RiCheckLine, RiCloseLine, RiImageAddLine, RiStoreLine } from "react-icons/ri";
import { toastExito } from "../../utils/toast";

export function AlmacenesTemplate() {
    const { dataempresa }    = useEmpresaStore();
    const { dataSucursales, mostrarSucursales } = useSucursalesStore();
    const { dataAlmacenes, mostrarAlmacenes, insertarAlmacen, editarAlmacen, eliminarAlmacen } = useAlmacenesConfigStore();

    const [editandoId,  setEditandoId]  = useState(null);
    const [editValor,   setEditValor]   = useState("");
    const [editFile,    setEditFile]    = useState(null);
    const [editPreview, setEditPreview] = useState(null);
    const [agregandoId, setAgregandoId] = useState(null);
    const [nuevoNombre, setNuevoNombre] = useState("");
    const [nuevoFile,   setNuevoFile]   = useState(null);
    const [nuevoPreview,setNuevoPreview]= useState(null);

    const editFileRef  = useRef(null);
    const nuevoFileRef = useRef(null);

    useQuery({
        queryKey: ["sucursales-alm", dataempresa?.id],
        queryFn:  () => mostrarSucursales({ id_empresa: dataempresa.id }),
        enabled:  !!dataempresa?.id,
        refetchOnWindowFocus: false,
    });

    useQuery({
        queryKey: ["almacenes-cfg", dataempresa?.id],
        queryFn:  () => mostrarAlmacenes({ id_empresa: dataempresa.id }),
        enabled:  !!dataempresa?.id,
        refetchOnWindowFocus: false,
    });

    const mutInsert = useMutation({
        mutationFn: async (p) => {
            const alm = await insertarAlmacen(p);
            if (nuevoFile && alm?.id) {
                await SubirLogoAlmacen({ id: alm.id, id_empresa: dataempresa.id, file: nuevoFile });
                await mostrarAlmacenes({ id_empresa: dataempresa.id });
            }
            return alm;
        },
        onSuccess: () => {
            toastExito("Almacén agregado", "Almacenes");
            setAgregandoId(null); setNuevoNombre(""); setNuevoFile(null); setNuevoPreview(null);
        },
    });

    const mutEdit = useMutation({
        mutationFn: async (p) => {
            await editarAlmacen(p);
            if (editFile) {
                await SubirLogoAlmacen({ id: p.id, id_empresa: dataempresa.id, file: editFile });
                await mostrarAlmacenes({ id_empresa: dataempresa.id });
            }
        },
        onSuccess: () => {
            toastExito("Almacén actualizado", "Almacenes");
            setEditandoId(null); setEditFile(null); setEditPreview(null);
        },
    });

    const mutDelete = useMutation({
        mutationFn: (p) => eliminarAlmacen(p),
        onSuccess: () => toastExito("Almacén eliminado", "Almacenes"),
    });

    const deEstaSucursal = (id) => dataAlmacenes.filter(a => a.id_sucursal === id);

    const confirmarEdit  = (a) => {
        if (editValor.trim() || editFile) mutEdit.mutate({ id: a.id, id_empresa: a.id_empresa, nombre: editValor.trim() || a.nombre });
        else setEditandoId(null);
    };
    const confirmarNuevo = (s) => {
        if (nuevoNombre.trim()) mutInsert.mutate({ id_empresa: dataempresa.id, id_sucursal: s.id, nombre: nuevoNombre.trim(), icono: "-" });
        else setAgregandoId(null);
    };

    function pickEditFile(e) {
        const f = e.target.files?.[0];
        if (!f) return;
        setEditFile(f);
        const r = new FileReader();
        r.onload = () => setEditPreview(r.result);
        r.readAsDataURL(f);
    }
    function pickNuevoFile(e) {
        const f = e.target.files?.[0];
        if (!f) return;
        setNuevoFile(f);
        const r = new FileReader();
        r.onload = () => setNuevoPreview(r.result);
        r.readAsDataURL(f);
    }

    return (
        <Page>
            <Cabecera>
                <h1>Almacenes por sucursal</h1>
                <p>gestiona tus almacenes por sucursal</p>
            </Cabecera>

            <Contenido>
                {(dataSucursales ?? []).map(sucursal => {
                    const almacenes = deEstaSucursal(sucursal.id);
                    return (
                        <Card key={sucursal.id}>
                            <CardHeader>
                                <HeaderNombre>SUCURSAL: {(sucursal.nombre ?? "").toUpperCase()}</HeaderNombre>
                            </CardHeader>

                            <CardBody>
                                {almacenes.map(alm => (
                                    <FilaAlmacen key={alm.id}>
                                        {editandoId === alm.id ? (
                                            <EditRow>
                                                <LogoBtn
                                                    type="button"
                                                    title="Cambiar logo"
                                                    onClick={() => editFileRef.current?.click()}
                                                >
                                                    {editPreview || (alm.icono && alm.icono !== "-")
                                                        ? <LogoImg src={editPreview || alm.icono} />
                                                        : <RiImageAddLine />}
                                                </LogoBtn>
                                                <input type="file" accept="image/*" ref={editFileRef} style={{ display: "none" }} onChange={pickEditFile} />
                                                <InputEdit
                                                    autoFocus
                                                    value={editValor}
                                                    onChange={e => setEditValor(e.target.value)}
                                                    onKeyDown={e => { if (e.key === "Enter") confirmarEdit(alm); if (e.key === "Escape") { setEditandoId(null); setEditFile(null); setEditPreview(null); } }}
                                                />
                                                <BtnIco $verde onClick={() => confirmarEdit(alm)}><RiCheckLine /></BtnIco>
                                                <BtnIco onClick={() => { setEditandoId(null); setEditFile(null); setEditPreview(null); }}><RiCloseLine /></BtnIco>
                                            </EditRow>
                                        ) : (
                                            <>
                                                <InfoRow>
                                                    {alm.icono && alm.icono !== "-"
                                                        ? <LogoThumb src={alm.icono} />
                                                        : <LogoPlaceholder><RiStoreLine /></LogoPlaceholder>}
                                                    <AlmNombre>{alm.nombre}</AlmNombre>
                                                </InfoRow>
                                                <FilaAcciones>
                                                    <BtnIco onClick={() => { setEditandoId(alm.id); setEditValor(alm.nombre); setEditFile(null); setEditPreview(null); }}><RiEditLine /></BtnIco>
                                                    <BtnIco $rojo onClick={() => mutDelete.mutate({ id: alm.id, id_empresa: alm.id_empresa })}><RiDeleteBin2Line /></BtnIco>
                                                </FilaAcciones>
                                            </>
                                        )}
                                    </FilaAlmacen>
                                ))}

                                {agregandoId === sucursal.id ? (
                                    <FilaInput>
                                        <LogoBtn
                                            type="button"
                                            title="Agregar logo"
                                            onClick={() => nuevoFileRef.current?.click()}
                                        >
                                            {nuevoPreview ? <LogoImg src={nuevoPreview} /> : <RiImageAddLine />}
                                        </LogoBtn>
                                        <input type="file" accept="image/*" ref={nuevoFileRef} style={{ display: "none" }} onChange={pickNuevoFile} />
                                        <InputNuevo
                                            autoFocus
                                            placeholder="Nombre del almacén..."
                                            value={nuevoNombre}
                                            onChange={e => setNuevoNombre(e.target.value)}
                                            onKeyDown={e => { if (e.key === "Enter") confirmarNuevo(sucursal); if (e.key === "Escape") { setAgregandoId(null); setNuevoNombre(""); setNuevoFile(null); setNuevoPreview(null); } }}
                                        />
                                        <BtnIco $verde onClick={() => confirmarNuevo(sucursal)}><RiCheckLine /></BtnIco>
                                        <BtnIco onClick={() => { setAgregandoId(null); setNuevoNombre(""); setNuevoFile(null); setNuevoPreview(null); }}><RiCloseLine /></BtnIco>
                                    </FilaInput>
                                ) : (
                                    <BtnAgregar onClick={() => { setAgregandoId(sucursal.id); setNuevoNombre(""); }}>
                                        ⊕ agregar almacén
                                    </BtnAgregar>
                                )}
                            </CardBody>
                        </Card>
                    );
                })}
            </Contenido>
        </Page>
    );
}

/* ── Styled ──────────────────────────────────── */

const Page = styled.div`
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;

    @media (max-width: 767px) {
        padding: 72px 12px 20px;
        align-items: stretch;
    }
`;

const Cabecera = styled.div`
    text-align: center;
    margin-bottom: 36px;
    h1 {
        font-size: 22px;
        font-weight: 900;
        color: ${({ theme }) => theme.text};
        margin: 0 0 6px;
    }
    p {
        font-size: 13px;
        color: ${({ theme }) => theme.colorsubtitlecard};
        margin: 0;
    }
`;

const Contenido = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
`;

const Card = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px;
    width: 300px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const HeaderNombre = styled.span`
    font-size: 13px;
    font-weight: 800;
    color: ${({ theme }) => theme.text};
    letter-spacing: 0.4px;
`;

const CardBody = styled.div`
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const FilaAlmacen = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px;
    background: ${({ theme }) => theme.bgtotal};
`;

const InfoRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
`;

const LogoThumb = styled.img`
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 1.5px solid rgba(255,255,255,0.12);
`;

const LogoPlaceholder = styled.div`
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1.5px dashed ${({ theme }) => theme.color2};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    svg { font-size: 14px; color: ${({ theme }) => theme.colorsubtitlecard}; }
`;

const LogoBtn = styled.button`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1.5px dashed #6366f1;
    background: rgba(99,102,241,0.08);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    padding: 0;
    transition: border-color 0.15s, background 0.15s;
    svg { font-size: 15px; color: #818cf8; }
    &:hover { background: rgba(99,102,241,0.18); }
`;

const LogoImg = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const AlmNombre = styled.span`
    font-size: 13px;
    font-weight: 700;
    color: ${({ theme }) => theme.text};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const FilaAcciones = styled.div`display: flex; gap: 2px;`;

const EditRow   = styled.div`display: flex; flex: 1; align-items: center; gap: 6px;`;
const FilaInput = styled.div`display: flex; align-items: center; gap: 6px;`;

const BtnIco = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    color: ${({ $rojo, $verde, theme }) => $rojo ? "#f87171" : $verde ? "#4ade80" : theme.colorsubtitlecard};
    font-size: 15px;
    padding: 3px 5px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: background 0.15s;
    &:hover { background: rgba(255,255,255,0.08); }
`;

const InputEdit = styled.input`
    flex: 1;
    background: transparent;
    border: none;
    border-bottom: 2px solid #6366f1;
    color: ${({ theme }) => theme.text};
    font-size: 13px;
    font-weight: 700;
    font-family: "Poppins", sans-serif;
    outline: none;
    padding: 2px 4px;
`;

const InputNuevo = styled.input`
    flex: 1;
    padding: 7px 10px;
    border: 1px dashed #6366f1;
    border-radius: 7px;
    background: rgba(99,102,241,0.06);
    color: ${({ theme }) => theme.text};
    font-size: 13px;
    font-family: "Poppins", sans-serif;
    outline: none;
    &::placeholder { color: #6b7280; }
`;

const BtnAgregar = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px;
    border: 1px dashed ${({ theme }) => theme.color2};
    border-radius: 8px;
    background: transparent;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    &:hover { border-color: #6366f1; color: #818cf8; }
`;
