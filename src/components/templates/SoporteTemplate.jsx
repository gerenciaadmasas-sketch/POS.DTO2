import { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase/supabase.config";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { EnviarMensaje, MostrarMensajes, MarcarLeidos } from "../../supabase/crudSoporte";
import { RiSendPlaneFill } from "react-icons/ri";
import { Icon } from "@iconify/react";

const formatHora  = (iso) => new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
const formatFecha = (iso) => new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });

export function SoporteTemplate() {
    const { dataempresa }  = useEmpresaStore();
    const { datausuarios } = useUsuariosStore();
    const qc = useQueryClient();
    const [texto, setTexto]     = useState("");
    const [enviando, setEnviando] = useState(false);
    const endRef = useRef(null);

    const { data: suscripcion } = useQuery({
        queryKey: ["suscripcion-soporte", dataempresa?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from("suscripciones")
                .select("id, nombre_cliente")
                .eq("id_empresa", dataempresa.id)
                .maybeSingle();
            return data;
        },
        enabled: !!dataempresa?.id,
        staleTime: 5 * 60 * 1000,
    });

    const idSus = suscripcion?.id;

    const { data: mensajes = [] } = useQuery({
        queryKey: ["mensajes-soporte", idSus],
        queryFn: () => MostrarMensajes({ id_suscripcion: idSus }),
        enabled: !!idSus,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (!idSus) return;
        const channel = supabase
            .channel(`chat-cliente-${idSus}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "mensajes_soporte",
                filter: `id_suscripcion=eq.${idSus}`,
            }, () => {
                qc.invalidateQueries({ queryKey: ["mensajes-soporte", idSus] });
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [idSus]);

    useEffect(() => {
        if (!idSus) return;
        MarcarLeidos({ id_suscripcion: idSus, remitente: "cliente" });
    }, [idSus, mensajes.length]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    async function enviar(e) {
        e?.preventDefault();
        if (!texto.trim() || !idSus || enviando) return;
        setEnviando(true);
        try {
            await EnviarMensaje({ id_suscripcion: idSus, remitente: "cliente", texto: texto.trim() });
            setTexto("");
            qc.invalidateQueries({ queryKey: ["mensajes-soporte", idSus] });
        } finally {
            setEnviando(false);
        }
    }

    function handleKey(e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
    }

    return (
        <Wrap>
            <ChatHeader>
                <AvatarSoporte><Icon icon="solar:headphones-bold-duotone" /></AvatarSoporte>
                <HeaderInfo>
                    <HeaderNombre>Soporte POS DL</HeaderNombre>
                    <HeaderSub>Tiempo de respuesta: mismo día · {datausuarios?.nombres?.split(" ")[0]}</HeaderSub>
                </HeaderInfo>
                <OnlineDot />
            </ChatHeader>

            <MensajesWrap>
                {!idSus ? (
                    <EmptyWrap><span>Conectando...</span></EmptyWrap>
                ) : mensajes.length === 0 ? (
                    <EmptyWrap>
                        <Icon icon="solar:headphones-bold-duotone" style={{ fontSize: 44, opacity: 0.15, color: "#f88533" }} />
                        <span>Aún no hay mensajes.<br />¡Escríbenos, estamos aquí para ayudarte!</span>
                    </EmptyWrap>
                ) : (() => {
                    let lastFecha = null;
                    return mensajes.map((m) => {
                        const esCliente = m.remitente === "cliente";
                        const f = formatFecha(m.created_at);
                        const showDate = f !== lastFecha;
                        lastFecha = f;
                        return (
                            <MsgGroup key={m.id}>
                                {showDate && (
                                    <DateDivider><DateSpan>{f}</DateSpan></DateDivider>
                                )}
                                <BubbleRow $right={esCliente}>
                                    {!esCliente && <BubbleAvatar>S</BubbleAvatar>}
                                    <BubbleWrap>
                                        <Bubble $right={esCliente}>{m.texto}</Bubble>
                                        <BubbleTime $right={esCliente}>{formatHora(m.created_at)}</BubbleTime>
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
                    placeholder="Escribe tu mensaje... (Enter para enviar)"
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    onKeyDown={handleKey}
                    rows={1}
                />
                <BtnEnviar type="submit" disabled={!texto.trim() || enviando}>
                    <RiSendPlaneFill />
                </BtnEnviar>
            </InputArea>
        </Wrap>
    );
}

/* ══ ESTILOS ══ */
const fadeUp = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}`;
const popIn  = keyframes`from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}`;

const Wrap = styled.div`
    display: flex; flex-direction: column;
    height: calc(100vh - 60px);
    max-width: 700px; margin: 0 auto;
    background: ${({ theme }) => theme.bgtotal};
    animation: ${fadeUp} 0.3s ease;

    @media (max-width: 767px) { height: calc(100vh - 56px); }
`;

const ChatHeader = styled.div`
    display: flex; align-items: center; gap: 14px;
    padding: 18px 24px;
    background: ${({ theme }) => theme.bgcards};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    flex-shrink: 0;
`;

const AvatarSoporte = styled.div`
    width: 44px; height: 44px; border-radius: 14px; flex-shrink: 0;
    background: rgba(248,133,51,0.15); border: 1.5px solid rgba(248,133,51,0.35);
    color: #f88533; font-size: 22px;
    display: flex; align-items: center; justify-content: center;
`;

const HeaderInfo = styled.div`flex: 1;`;
const HeaderNombre = styled.div`font-size: 15px; font-weight: 800; color: ${({ theme }) => theme.text};`;
const HeaderSub    = styled.div`font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard}; margin-top: 2px;`;

const OnlineDot = styled.div`
    width: 10px; height: 10px; border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 0 3px rgba(74,222,128,0.2);
`;

const MensajesWrap = styled.div`
    flex: 1; overflow-y: auto; padding: 20px 24px;
    display: flex; flex-direction: column; gap: 4px;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colorScroll}; border-radius: 10px; }

    @media (max-width: 767px) { padding: 14px 12px; }
`;

const EmptyWrap = styled.div`
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 14px;
    text-align: center; color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 14px; line-height: 1.6; padding: 40px;
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
    background: rgba(248,133,51,0.15); color: #f88533;
    font-size: 11px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
`;

const BubbleWrap = styled.div`
    display: flex; flex-direction: column; gap: 3px;
    max-width: 72%;
    animation: ${popIn} 0.2s ease;
`;

const Bubble = styled.div`
    padding: 10px 14px; border-radius: ${({ $right }) => $right ? "16px 16px 4px 16px" : "16px 16px 16px 4px"};
    background: ${({ $right }) => $right ? "#f88533" : ({ theme }) => theme.bgcards};
    border: ${({ $right }) => $right ? "none" : `1px solid ${({ theme }) => theme.color2}`};
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
