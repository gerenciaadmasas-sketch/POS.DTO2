import { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase/supabase.config";
import { EnviarMensaje, MostrarMensajes, MostrarResumenChats, MarcarLeidos } from "../../supabase/crudSoporte";
import { RiSendPlaneFill, RiCustomerService2Line, RiArrowLeftLine, RiUserLine } from "react-icons/ri";

const formatHora  = (iso) => new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
const formatFecha = (iso) => new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
const formatRelativo = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const hoy = new Date();
    const diff = Math.floor((hoy - d) / 86400000);
    if (diff === 0) return formatHora(iso);
    if (diff === 1) return "Ayer";
    return formatFecha(iso);
};

export function ChatTemplate() {
    const qc = useQueryClient();
    const [seleccionado, setSeleccionado] = useState(null);
    const [texto, setTexto]   = useState("");
    const [enviando, setEnviando] = useState(false);
    const [vistaMovil, setVistaMovil] = useState("lista"); // "lista" | "chat"
    const endRef = useRef(null);

    const { data: resumen = [], isLoading } = useQuery({
        queryKey: ["chat-resumen"],
        queryFn: MostrarResumenChats,
        refetchInterval: 15000,
    });

    const { data: mensajes = [] } = useQuery({
        queryKey: ["mensajes-soporte", seleccionado?.id_suscripcion],
        queryFn: () => MostrarMensajes({ id_suscripcion: seleccionado.id_suscripcion }),
        enabled: !!seleccionado,
        refetchOnWindowFocus: false,
    });

    // Realtime para el thread activo
    useEffect(() => {
        if (!seleccionado) return;
        const channel = supabase
            .channel(`chat-admin-${seleccionado.id_suscripcion}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "mensajes_soporte",
                filter: `id_suscripcion=eq.${seleccionado.id_suscripcion}`,
            }, () => {
                qc.invalidateQueries({ queryKey: ["mensajes-soporte", seleccionado.id_suscripcion] });
                qc.invalidateQueries({ queryKey: ["chat-resumen"] });
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [seleccionado?.id_suscripcion]);

    // Marcar como leídos al abrir
    useEffect(() => {
        if (!seleccionado) return;
        MarcarLeidos({ id_suscripcion: seleccionado.id_suscripcion, remitente: "superadmin" });
        qc.invalidateQueries({ queryKey: ["chat-resumen"] });
    }, [seleccionado?.id_suscripcion, mensajes.length]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    function abrirChat(item) {
        setSeleccionado(item);
        setVistaMovil("chat");
        setTexto("");
    }

    async function enviar(e) {
        e?.preventDefault();
        if (!texto.trim() || !seleccionado || enviando) return;
        setEnviando(true);
        try {
            await EnviarMensaje({
                id_suscripcion: seleccionado.id_suscripcion,
                remitente: "superadmin",
                texto: texto.trim(),
            });
            setTexto("");
            qc.invalidateQueries({ queryKey: ["mensajes-soporte", seleccionado.id_suscripcion] });
            qc.invalidateQueries({ queryKey: ["chat-resumen"] });
        } finally {
            setEnviando(false);
        }
    }

    function handleKey(e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
    }

    const totalNoLeidos = resumen.reduce((s, r) => s + (r.no_leidos ?? 0), 0);

    return (
        <Wrap>
            {/* ── Panel izquierdo: lista de clientes ── */}
            <Lista $visible={vistaMovil === "lista"}>
                <ListaHeader>
                    <ListaTitulo>
                        <RiCustomerService2Line />
                        Soporte
                        {totalNoLeidos > 0 && <UnreadGlobal>{totalNoLeidos}</UnreadGlobal>}
                    </ListaTitulo>
                    <ListaSub>Chats con clientes</ListaSub>
                </ListaHeader>

                <ListaScroll>
                    {isLoading ? (
                        <ListaVacio>Cargando...</ListaVacio>
                    ) : resumen.length === 0 ? (
                        <ListaVacio>Aún no hay mensajes de clientes.</ListaVacio>
                    ) : resumen.map(item => (
                        <ClienteItem
                            key={item.id_suscripcion}
                            $activo={seleccionado?.id_suscripcion === item.id_suscripcion}
                            onClick={() => abrirChat(item)}
                        >
                            <ClienteAvatar>
                                {item.nombre ? item.nombre[0].toUpperCase() : <RiUserLine />}
                            </ClienteAvatar>
                            <ClienteInfo>
                                <ClienteNombreRow>
                                    <ClienteNombre>{item.nombre || "Sin nombre"}</ClienteNombre>
                                    {item.ultimo_at && <ClienteHora>{formatRelativo(item.ultimo_at)}</ClienteHora>}
                                </ClienteNombreRow>
                                <ClienteUltimo>{item.ultimo ?? "Sin mensajes aún"}</ClienteUltimo>
                            </ClienteInfo>
                            {item.no_leidos > 0 && <UnreadBadge>{item.no_leidos}</UnreadBadge>}
                        </ClienteItem>
                    ))}
                </ListaScroll>
            </Lista>

            {/* ── Panel derecho: chat thread ── */}
            <Thread $visible={vistaMovil === "chat"}>
                {!seleccionado ? (
                    <ThreadVacio>
                        <RiCustomerService2Line size={52} style={{ opacity: 0.12 }} />
                        <span>Selecciona un cliente para ver el chat</span>
                    </ThreadVacio>
                ) : (
                    <>
                        <ThreadHeader>
                            <BtnVolver onClick={() => setVistaMovil("lista")}>
                                <RiArrowLeftLine />
                            </BtnVolver>
                            <ThreadAvatar>{seleccionado.nombre[0]?.toUpperCase()}</ThreadAvatar>
                            <ThreadNombre>{seleccionado.nombre}</ThreadNombre>
                        </ThreadHeader>

                        <MensajesWrap>
                            {mensajes.length === 0 ? (
                                <EmptyChat>
                                    <span>Aún no hay mensajes. Inicia la conversación.</span>
                                </EmptyChat>
                            ) : (() => {
                                let lastFecha = null;
                                return mensajes.map((m) => {
                                    const esAdmin = m.remitente === "superadmin";
                                    const f = formatFecha(m.created_at);
                                    const showDate = f !== lastFecha;
                                    lastFecha = f;
                                    return (
                                        <MsgGroup key={m.id}>
                                            {showDate && (
                                                <DateDivider><DateSpan>{f}</DateSpan></DateDivider>
                                            )}
                                            <BubbleRow $right={esAdmin}>
                                                {!esAdmin && (
                                                    <BubbleAvatar>
                                                        {seleccionado.nombre[0]?.toUpperCase()}
                                                    </BubbleAvatar>
                                                )}
                                                <BubbleWrap>
                                                    <Bubble $right={esAdmin}>{m.texto}</Bubble>
                                                    <BubbleTime $right={esAdmin}>{formatHora(m.created_at)}</BubbleTime>
                                                </BubbleWrap>
                                            </BubbleRow>
                                        </MsgGroup>
                                    );
                                });
                            })()}
                            <div ref={endRef} />
                        </MensajesWrap>

                        <InputArea onSubmit={enviar}>
                            <InputMsg
                                placeholder="Escribe tu respuesta... (Enter para enviar)"
                                value={texto}
                                onChange={e => setTexto(e.target.value)}
                                onKeyDown={handleKey}
                                rows={1}
                            />
                            <BtnEnviar type="submit" disabled={!texto.trim() || enviando}>
                                <RiSendPlaneFill />
                            </BtnEnviar>
                        </InputArea>
                    </>
                )}
            </Thread>
        </Wrap>
    );
}

/* ══ ESTILOS ══ */
const fadeUp = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}`;
const popIn  = keyframes`from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}`;

const Wrap = styled.div`
    display: flex;
    height: calc(100vh - 60px);
    background: ${({ theme }) => theme.bgtotal};
    animation: ${fadeUp} 0.3s ease;
    overflow: hidden;
`;

/* ── Lista ── */
const Lista = styled.div`
    width: 300px; flex-shrink: 0;
    display: flex; flex-direction: column;
    border-right: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards};

    @media (max-width: 767px) {
        display: ${({ $visible }) => $visible ? "flex" : "none"};
        width: 100%;
    }
`;

const ListaHeader = styled.div`
    padding: 20px 18px 14px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    flex-shrink: 0;
`;

const ListaTitulo = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 16px; font-weight: 900;
    color: ${({ theme }) => theme.text};
`;

const ListaSub = styled.div`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
    margin-top: 3px;
`;

const UnreadGlobal = styled.span`
    background: #f88533; color: #fff;
    font-size: 10px; font-weight: 800;
    padding: 1px 7px; border-radius: 20px;
    margin-left: 4px;
`;

const ListaScroll = styled.div`
    flex: 1; overflow-y: auto;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colorScroll}; border-radius: 10px; }
`;

const ListaVacio = styled.div`
    padding: 40px 20px; text-align: center;
    font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const ClienteItem = styled.div`
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px; cursor: pointer; transition: background 0.15s;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    background: ${({ $activo }) => $activo ? "rgba(248,133,51,0.08)" : "transparent"};
    border-left: 3px solid ${({ $activo }) => $activo ? "#f88533" : "transparent"};
    &:hover { background: rgba(248,133,51,0.05); }
`;

const ClienteAvatar = styled.div`
    width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
    background: rgba(248,133,51,0.12); color: #f88533;
    font-size: 15px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
`;

const ClienteInfo = styled.div`flex: 1; min-width: 0;`;

const ClienteNombreRow = styled.div`
    display: flex; align-items: center; justify-content: space-between;
`;

const ClienteNombre = styled.span`
    font-size: 13px; font-weight: 700;
    color: ${({ theme }) => theme.text};
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 150px;
`;

const ClienteHora = styled.span`
    font-size: 10px; color: ${({ theme }) => theme.colorsubtitlecard};
    flex-shrink: 0;
`;

const ClienteUltimo = styled.span`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    display: block; margin-top: 2px; max-width: 200px;
`;

const UnreadBadge = styled.span`
    background: #f88533; color: #fff;
    font-size: 10px; font-weight: 900;
    width: 20px; height: 20px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
`;

/* ── Thread ── */
const Thread = styled.div`
    flex: 1; display: flex; flex-direction: column; overflow: hidden;

    @media (max-width: 767px) {
        display: ${({ $visible }) => $visible ? "flex" : "none"};
        width: 100%;
    }
`;

const ThreadVacio = styled.div`
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 14px;
`;

const ThreadHeader = styled.div`
    display: flex; align-items: center; gap: 12px;
    padding: 16px 22px;
    background: ${({ theme }) => theme.bgcards};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    flex-shrink: 0;
`;

const BtnVolver = styled.button`
    display: none;
    background: none; border: none; cursor: pointer; font-size: 20px;
    color: ${({ theme }) => theme.text}; padding: 4px;
    border-radius: 8px;
    &:hover { background: rgba(255,255,255,0.08); }

    @media (max-width: 767px) { display: flex; align-items: center; }
`;

const ThreadAvatar = styled.div`
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    background: rgba(248,133,51,0.15); color: #f88533;
    font-size: 14px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
`;

const ThreadNombre = styled.span`
    font-size: 15px; font-weight: 800;
    color: ${({ theme }) => theme.text};
`;

const MensajesWrap = styled.div`
    flex: 1; overflow-y: auto; padding: 20px 24px;
    display: flex; flex-direction: column; gap: 4px;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colorScroll}; border-radius: 10px; }

    @media (max-width: 767px) { padding: 14px 12px; }
`;

const EmptyChat = styled.div`
    flex: 1; display: flex; align-items: center; justify-content: center;
    color: ${({ theme }) => theme.colorsubtitlecard}; font-size: 13px;
    padding: 40px;
`;

const MsgGroup = styled.div`display: flex; flex-direction: column; gap: 2px;`;

const DateDivider = styled.div`
    display: flex; align-items: center; justify-content: center;
    margin: 14px 0 10px;
`;
const DateSpan = styled.span`
    font-size: 11px; font-weight: 700;
    color: ${({ theme }) => theme.colorsubtitlecard};
    background: ${({ theme }) => theme.bgcards};
    padding: 4px 12px; border-radius: 20px;
    border: 1px solid ${({ theme }) => theme.color2};
`;

const BubbleRow = styled.div`
    display: flex; align-items: flex-end; gap: 8px;
    justify-content: ${({ $right }) => $right ? "flex-end" : "flex-start"};
    margin-bottom: 6px;
`;

const BubbleAvatar = styled.div`
    width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
    background: rgba(99,102,241,0.15); color: #818cf8;
    font-size: 11px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
`;

const BubbleWrap = styled.div`
    display: flex; flex-direction: column; gap: 3px;
    max-width: 65%;
    animation: ${popIn} 0.2s ease;
`;

const Bubble = styled.div`
    padding: 10px 14px;
    border-radius: ${({ $right }) => $right ? "16px 16px 4px 16px" : "16px 16px 16px 4px"};
    background: ${({ $right }) => $right ? "#f88533" : ({ theme }) => theme.bgcards};
    border: ${({ $right, theme }) => $right ? "none" : `1px solid ${theme.color2}`};
    color: ${({ $right }) => $right ? "#fff" : ({ theme }) => theme.text};
    font-size: 14px; line-height: 1.5; word-break: break-word;
    box-shadow: ${({ $right }) => $right ? "0 2px 8px rgba(248,133,51,0.25)" : "none"};
`;

const BubbleTime = styled.span`
    font-size: 10px; color: ${({ theme }) => theme.colorsubtitlecard};
    align-self: ${({ $right }) => $right ? "flex-end" : "flex-start"};
    padding: 0 4px;
`;

const InputArea = styled.form`
    display: flex; align-items: flex-end; gap: 10px;
    padding: 14px 24px;
    background: ${({ theme }) => theme.bgcards};
    border-top: 1px solid ${({ theme }) => theme.color2};
    flex-shrink: 0;

    @media (max-width: 767px) { padding: 10px 12px; }
`;

const InputMsg = styled.textarea`
    flex: 1; resize: none; border-radius: 14px;
    padding: 12px 16px; max-height: 120px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 14px; font-family: "Poppins", sans-serif;
    outline: none; line-height: 1.5;
    &:focus { border-color: #f88533; }
    &::placeholder { color: ${({ theme }) => theme.colorsubtitlecard}; }
`;

const BtnEnviar = styled.button`
    width: 46px; height: 46px; border-radius: 14px; border: none; flex-shrink: 0;
    background: #f88533; color: #fff;
    font-size: 20px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
    &:hover:not(:disabled) { background: #e07020; transform: scale(1.05); }
    &:disabled { opacity: 0.35; cursor: not-allowed; }
`;
