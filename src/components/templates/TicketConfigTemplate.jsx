import styled from "styled-components";
import { useRef, useState, useEffect } from "react";
import { useTicketConfigStore } from "../../store/TicketConfigStore";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { toastExito, toastError } from "../../utils/toast";
import { RiEditLine } from "react-icons/ri";
import { BsQrCode } from "react-icons/bs";

const HOY = new Date().toLocaleDateString("es-PE");

export function TicketConfigTemplate() {
    const { ticketConfig, guardarTicketConfig, subirLogoTicket } = useTicketConfigStore();
    const { dataempresa } = useEmpresaStore();
    const fileRef = useRef(null);

    const [linea1,    setLinea1]    = useState("");
    const [linea2,    setLinea2]    = useState("");
    const [linea3,    setLinea3]    = useState("");
    const [piePagina, setPiePagina] = useState("");
    const [logoUrl,   setLogoUrl]   = useState("");
    const [loading,   setLoading]   = useState(false);

    useEffect(() => {
        if (ticketConfig) {
            setLinea1(ticketConfig.linea1 ?? "");
            setLinea2(ticketConfig.linea2 ?? "");
            setLinea3(ticketConfig.linea3 ?? "");
            setPiePagina(ticketConfig.pie_pagina ?? "");
            setLogoUrl(ticketConfig.logo_url ?? "");
        }
    }, [ticketConfig]);

    async function handleLogo(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setLogoUrl(preview);
        const url = await subirLogoTicket({ id_empresa: dataempresa?.id, file });
        if (url) setLogoUrl(url);
    }

    async function handleGuardar() {
        if (!dataempresa?.id) return;
        setLoading(true);
        try {
            await guardarTicketConfig({
                id_empresa: dataempresa.id,
                linea1, linea2, linea3,
                pie_pagina: piePagina,
                logo_url: logoUrl,
            });
            toastExito("Configuración guardada");
        } catch {
            toastError("Error al guardar");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Container>
            <Header>
                <h1>TICKET</h1>
                <p>puedes modificar detalles de tu ticket</p>
            </Header>

            <Ticket>
                {/* Logo */}
                <LogoWrap onClick={() => fileRef.current?.click()}>
                    {logoUrl
                        ? <img src={logoUrl} alt="logo" />
                        : <LogoPlaceholder />
                    }
                    <EditBadge><RiEditLine /></EditBadge>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleLogo}
                    />
                </LogoWrap>

                <BtnGuardar onClick={handleGuardar} disabled={loading}>
                    {loading ? "Guardando..." : "Guardar"}
                </BtnGuardar>

                {/* Cabecera editable */}
                <EditableInput
                    value={linea1}
                    onChange={(e) => setLinea1(e.target.value)}
                    placeholder="Nombre de empresa"
                    $center
                />
                <EditableInput
                    value={linea2}
                    onChange={(e) => setLinea2(e.target.value)}
                    placeholder="Dirección"
                    $center
                />
                <EditableInput
                    value={linea3}
                    onChange={(e) => setLinea3(e.target.value)}
                    placeholder="Teléfono / RUC"
                    $center
                />

                <Divider />

                {/* Número de ticket */}
                <DocNum>TICKET - T0001</DocNum>

                <Divider />

                {/* Datos de la venta */}
                <InfoRow><span>Cajero</span><span>: Nombre del Cajero</span></InfoRow>
                <InfoRow><span>Fecha Emisión</span><span>: {HOY}</span></InfoRow>
                <InfoRow><span>Cliente</span><span>: NOMBRE DEL CLIENTE</span></InfoRow>

                <Divider />

                {/* Items */}
                <ItemsHeader>
                    <span>Cant.</span>
                    <span>Descripción</span>
                    <span>Importe</span>
                </ItemsHeader>
                <ItemRow>
                    <span>1</span>
                    <span>Gaseosa Coca Cola x 1 Lt</span>
                    <span>$ 26</span>
                </ItemRow>

                <Divider />

                {/* Totales */}
                <TotalRow><span>Sub total:</span><span>$ 26</span></TotalRow>
                <TotalRow><span>Descuento:</span><span>$ 0.00</span></TotalRow>
                <TotalRow $bold><span>TOTAL:</span><span>$ 26</span></TotalRow>

                <Divider />

                <LiteralText>SON VEINTISEIS</LiteralText>

                <EditableInput
                    value=""
                    readOnly
                    placeholder="Firma / observación"
                    $center
                />

                <InfoRow><span>EFECTIVO:</span><span>$ 50</span></InfoRow>
                <InfoRow><span>VUELTO:</span><span>$ 14</span></InfoRow>
                <InfoRow><span>Tipo de Pago:</span><span>Efectivo</span></InfoRow>

                <Divider />

                {/* Pie de página editable */}
                <EditableInput
                    value={piePagina}
                    onChange={(e) => setPiePagina(e.target.value)}
                    placeholder="Mensaje de pie de página"
                    $center
                />

                <DotLine>· · · · · · · · · · · · · · · · · · · ·</DotLine>

                {/* QR placeholder */}
                <QRWrap><BsQrCode size={72} /></QRWrap>
            </Ticket>
        </Container>
    );
}

/* ─── Estilos ─── */

const Container = styled.div`
    min-height: 100vh;
    padding: 24px 16px 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: ${({ theme }) => theme.bgtotal};

    @media (max-width: 767px) { padding-top: 78px; }
`;

const Header = styled.div`
    text-align: center;
    margin-bottom: 20px;
    h1 {
        font-size: 22px;
        font-weight: 800;
        color: ${({ theme }) => theme.text};
        margin: 0 0 4px;
        letter-spacing: 2px;
    }
    p {
        font-size: 12px;
        color: ${({ theme }) => theme.colorsubtitlecard};
        margin: 0;
    }
`;

const Ticket = styled.div`
    background: #fff;
    color: #222;
    width: 100%;
    max-width: 360px;
    padding: 20px 16px;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
`;

const LogoWrap = styled.div`
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #e8e8e8;
    margin: 0 auto 8px;
    cursor: pointer;
    overflow: hidden;
    border: 2px solid #ccc;

    img {
        width: 100%; height: 100%;
        object-fit: cover;
    }
    &:hover > div { opacity: 1; }
`;

const LogoPlaceholder = styled.div`
    width: 100%; height: 100%;
    background: #d0d0d0;
`;

const EditBadge = styled.div`
    position: absolute;
    bottom: 2px; right: 2px;
    background: #f88533;
    color: #fff;
    border-radius: 50%;
    width: 22px; height: 22px;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px;
    opacity: 0.9;
    transition: opacity 0.2s;
`;

const BtnGuardar = styled.button`
    background: #f88533;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 8px 0;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    width: 100%;
    margin-bottom: 4px;
    &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const EditableInput = styled.input`
    background: #fff9c4;
    border: 1px solid #f0e040;
    border-radius: 3px;
    padding: 4px 8px;
    font-size: 12px;
    font-family: 'Courier New', monospace;
    color: #222;
    width: 100%;
    box-sizing: border-box;
    text-align: ${({ $center }) => $center ? "center" : "left"};
    outline: none;

    &:focus { border-color: #f88533; background: #fffde0; }
    &::placeholder { color: #aaa; }
`;

const Divider = styled.hr`
    border: none;
    border-top: 1px dashed #bbb;
    margin: 4px 0;
`;

const DocNum = styled.div`
    text-align: center;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 1px;
`;

const InfoRow = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 11px;
`;

const ItemsHeader = styled.div`
    display: grid;
    grid-template-columns: 36px 1fr auto;
    gap: 4px;
    font-weight: 700;
    font-size: 11px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 4px;
`;

const ItemRow = styled.div`
    display: grid;
    grid-template-columns: 36px 1fr auto;
    gap: 4px;
    font-size: 11px;
`;

const TotalRow = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: ${({ $bold }) => $bold ? "800" : "400"};
`;

const LiteralText = styled.div`
    font-size: 10px;
    text-align: center;
    font-style: italic;
    color: #555;
`;

const DotLine = styled.div`
    text-align: center;
    color: #aaa;
    letter-spacing: 2px;
    font-size: 11px;
`;

const QRWrap = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 4px;
    color: #333;
`;
