import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MostrarVersion, EditarVersion } from "../../supabase/crudVersion";
import { RiEditLine, RiCloseLine } from "react-icons/ri";
import { Icon } from "@iconify/react";
import { toastExito } from "../../utils/toast";

export function VersionTemplate() {
    const queryClient = useQueryClient();
    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({ version: "", descripcion: "" });

    const { data: versiones = [] } = useQuery({
        queryKey: ["config-version"],
        queryFn: MostrarVersion,
    });

    const actual = versiones[0];

    const mutEditar = useMutation({
        mutationFn: () => EditarVersion({ id: editando.id, ...form }),
        onSuccess: () => { toastExito("Versión actualizada"); queryClient.invalidateQueries({ queryKey: ["config-version"] }); cerrar(); },
    });

    function abrirEditar(v) {
        setForm({ version: v.version, descripcion: v.descripcion ?? "" });
        setEditando(v);
        setModal(true);
    }

    function cerrar() { setModal(false); setEditando(null); }

    function handleGuardar(e) {
        e.preventDefault();
        mutEditar.mutate();
    }

    return (
        <Page>
            <TopBar>
                <h1>Versión del sistema</h1>
                <p>historial de versiones y notas de actualización</p>
            </TopBar>

            {/* Versión actual */}
            {actual && (
                <VersionActual>
                    <Icon icon="solar:shield-check-bold-duotone" style={{ fontSize: 48, color: "#4ade80" }} />
                    <VersionInfo>
                        <VersionTag>{actual.version}</VersionTag>
                        <VersionFecha>Última actualización: {new Date(actual.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</VersionFecha>
                    </VersionInfo>
                </VersionActual>
            )}

            {/* Historial */}
            <Historial>
                {versiones.map((v, i) => (
                    <HistorialItem key={v.id} $actual={i === 0}>
                        <HistorialHeader>
                            <HistorialVersion $actual={i === 0}>{v.version}</HistorialVersion>
                            <HistorialFecha>{new Date(v.fecha).toLocaleDateString("es-CO")}</HistorialFecha>
                            <BtnIco onClick={() => abrirEditar(v)}><RiEditLine /></BtnIco>
                        </HistorialHeader>
                        {v.descripcion && <HistorialDesc>{v.descripcion}</HistorialDesc>}
                    </HistorialItem>
                ))}
            </Historial>

            {/* Modal */}
            {modal && (
                <Overlay onClick={cerrar}>
                    <Modal onClick={e => e.stopPropagation()}>
                        <ModalHeader>
                            <span>Editar versión</span>
                            <BtnCerrar onClick={cerrar}><RiCloseLine /></BtnCerrar>
                        </ModalHeader>
                        <ModalForm onSubmit={handleGuardar}>
                            <Campo>
                                <label>Versión</label>
                                <Input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="Ej: SaaS.DTO2.v3" required />
                            </Campo>
                            <Campo>
                                <label>Notas de actualización</label>
                                <Textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe qué cambió en esta versión..." rows={5} />
                            </Campo>
                            <BtnGuardar type="submit" disabled={mutEditar.isPending}>
                                {editando ? "Guardar cambios" : "Registrar versión"}
                            </BtnGuardar>
                        </ModalForm>
                    </Modal>
                </Overlay>
            )}
        </Page>
    );
}

const fadeUp = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;

const Page = styled.div`
    min-height: 100vh; background: ${({ theme }) => theme.bgtotal};
    padding: 28px; animation: ${fadeUp} 0.3s ease;
    max-width: 700px; margin: 0 auto;
    @media (max-width: 767px) { padding: 68px 12px 20px; }
`;

const TopBar = styled.div`
    margin-bottom: 28px;
    h1 { font-size: 22px; font-weight: 900; color: ${({ theme }) => theme.text}; margin: 0 0 4px; }
    p { font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard}; margin: 0; }
`;

const VersionActual = styled.div`
    display: flex; align-items: center; gap: 20px;
    padding: 24px; border-radius: 18px;
    background: ${({ theme }) => theme.bgcards};
    border: 2px solid rgba(74,222,128,0.3);
    margin-bottom: 28px;
`;

const VersionInfo = styled.div`display: flex; flex-direction: column; gap: 4px;`;

const VersionTag = styled.div`
    font-size: 28px; font-weight: 900; color: #4ade80;
    letter-spacing: 1px;
`;

const VersionFecha = styled.div`
    font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const Historial = styled.div`display: flex; flex-direction: column; gap: 12px;`;

const HistorialItem = styled.div`
    padding: 16px 20px; border-radius: 14px;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ $actual, theme }) => $actual ? "rgba(74,222,128,0.2)" : theme.color2};
`;

const HistorialHeader = styled.div`
    display: flex; align-items: center; gap: 12px;
`;

const HistorialVersion = styled.span`
    font-size: 15px; font-weight: 900;
    color: ${({ $actual }) => $actual ? "#4ade80" : "#94a3b8"};
`;

const HistorialFecha = styled.span`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard}; flex: 1;
`;

const BtnIco = styled.button`
    background: none; border: none; cursor: pointer; font-size: 16px; padding: 5px;
    border-radius: 6px; display: flex; align-items: center;
    color: ${({ theme }) => theme.colorsubtitlecard};
    &:hover { background: rgba(255,255,255,0.08); }
`;

const HistorialDesc = styled.div`
    margin-top: 10px; font-size: 12px; line-height: 1.6;
    color: ${({ theme }) => theme.colorsubtitlecard};
    white-space: pre-wrap;
`;

const Overlay = styled.div`
    position: fixed; inset: 0; background: rgba(0,0,0,0.55);
    display: flex; align-items: center; justify-content: center; z-index: 300;
`;

const Modal = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 20px; padding: 24px; width: 440px; max-width: 92vw;
    box-shadow: 0 16px 48px rgba(0,0,0,0.35);
`;

const ModalHeader = styled.div`
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
    span { font-size: 16px; font-weight: 900; color: ${({ theme }) => theme.text}; }
`;

const BtnCerrar = styled.button`
    background: none; border: none; cursor: pointer; font-size: 20px;
    color: ${({ theme }) => theme.text}; display: flex; align-items: center;
`;

const ModalForm = styled.form`display: flex; flex-direction: column; gap: 14px;`;

const Campo = styled.div`
    display: flex; flex-direction: column; gap: 5px;
    label { font-size: 11px; font-weight: 700; color: ${({ theme }) => theme.colorsubtitlecard}; text-transform: uppercase; }
`;

const Input = styled.input`
    padding: 10px 14px; border-radius: 10px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none;
    &:focus { border-color: #f88533; }
`;

const Textarea = styled.textarea`
    padding: 10px 14px; border-radius: 10px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none; resize: vertical;
    &:focus { border-color: #f88533; }
`;

const BtnGuardar = styled.button`
    padding: 12px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #f88533, #f56a00);
    color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif;
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
