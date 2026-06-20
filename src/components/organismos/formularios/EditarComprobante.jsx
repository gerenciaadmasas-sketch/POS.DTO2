import styled from "styled-components";
import { useState } from "react";
import { useComprobantesStore } from "../../../store/ComprobantesStore";
import { v } from "../../../styles/variables";

export function EditarComprobanteModal({ data, onClose }) {
    const { editarComprobante } = useComprobantesStore();
    const [serie, setSerie] = useState(data.serie ?? "");
    const [correlativo, setCorrelativo] = useState(data.correlativo ?? 0);
    const [loading, setLoading] = useState(false);

    async function handleGuardar(e) {
        e.preventDefault();
        setLoading(true);
        try {
            await editarComprobante({ id: data.id, serie, correlativo: Number(correlativo) });
            onClose();
        } finally {
            setLoading(false);
        }
    }

    return (
        <Overlay onClick={onClose}>
            <Modal onClick={(e) => e.stopPropagation()}>
                <Header>
                    <h2>Editar {data.tipo}</h2>
                    <BtnClose onClick={onClose}><v.iconocerrar /></BtnClose>
                </Header>
                <form onSubmit={handleGuardar}>
                    <Field>
                        <label>Serie</label>
                        <input
                            value={serie}
                            onChange={(e) => setSerie(e.target.value.toUpperCase())}
                            placeholder="Ej: F001"
                            maxLength={10}
                            required
                        />
                    </Field>
                    <Field>
                        <label>Correlativo</label>
                        <input
                            type="number"
                            min={0}
                            value={correlativo}
                            onChange={(e) => setCorrelativo(e.target.value)}
                            required
                        />
                    </Field>
                    <BtnGuardar type="submit" disabled={loading}>
                        {loading ? "Guardando..." : "Guardar"}
                    </BtnGuardar>
                </form>
            </Modal>
        </Overlay>
    );
}

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
    padding: 28px 24px;
    width: 340px;
    max-width: 92vw;
    box-shadow: 0 16px 48px rgba(0,0,0,0.35);
`;
const Header = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 22px;
    h2 { font-size: 16px; font-weight: 700; color: ${({ theme }) => theme.text}; margin: 0; }
`;
const BtnClose = styled.button`
    background: none; border: none; cursor: pointer;
    font-size: 20px; color: ${({ theme }) => theme.text};
    display: flex; align-items: center;
`;
const Field = styled.div`
    display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;
    label { font-size: 12px; font-weight: 600; color: ${({ theme }) => theme.colorsubtitlecard}; }
    input {
        background: ${({ theme }) => theme.bgtotal};
        border: 1px solid ${({ theme }) => theme.color2};
        border-radius: 10px;
        padding: 10px 14px;
        color: ${({ theme }) => theme.text};
        font-size: 14px;
        outline: none;
        &:focus { border-color: #f88533; }
    }
`;
const BtnGuardar = styled.button`
    width: 100%; padding: 12px;
    background: linear-gradient(135deg, #f88533, #f56a00);
    color: #fff; border: none; border-radius: 12px;
    font-size: 14px; font-weight: 700; cursor: pointer;
    margin-top: 4px;
    &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
