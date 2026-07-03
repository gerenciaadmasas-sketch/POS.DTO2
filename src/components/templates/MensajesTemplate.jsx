import { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase/supabase.config";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { ListarUsuariosEmpresa } from "../../supabase/crudUsuarios";
import {
    EnviarMensajeInterno, MostrarMensajesEntre,
    MarcarLeidosInternos, ResumenConversaciones,
} from "../../supabase/crudMensajesInternos";
import { RiSendPlaneFill, RiArrowLeftLine, RiSearchLine, RiTeamLine } from "react-icons/ri";

const fmtHora  = (iso) => new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
const fmtFecha = (iso) => {
    const d = new Date(iso);
    const hoy = new Date();
    if (d.toDateString() === hoy.toDateString()) return "Hoy";
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
    if (d.toDateString() === ayer.toDateString()) return "Ayer";
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
};

const TIPO_COLOR = {
    cajero:        "#60a5fa",
    supervisor:    "#4ade80",
    administrador: "#a78bfa",
    superadmin:    "#f88533",
};

const inicial = (u) => (u?.nombres ?? u?.usuario ?? "?")[0]?.toUpperCase() ?? "?";

export function MensajesTemplate() {
    const { dataempresa }  = useEmpresaStore();
    const { datausuarios } = useUsuariosStore();
    const qc = useQueryClient();

    const id_empresa = dataempresa?.id;
    const yo_id      = String(datausuarios?.id ?? "");
    const yo_tipo    = datausuarios?.tipo;

    const [seleccionado, setSeleccionado] = useState(null); // usuario con quien estoy hablando
    const [texto, setTexto]   = useState("");
    const [enviando, setEnviando] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [vista, setVista]   = useState("lista"); // "lista" | "chat" (mobile)
    const endRef = useRef(null);

    // ── Todos los usuarios de la empresa ──────────────────────────
    const { data: todosUsuarios = [] } = useQuery({
        queryKey: ["usuarios-empresa-msg", id_empresa],
        queryFn:  () => ListarUsuariosEmpresa({ id_empresa }),
        enabled:  !!id_empresa, staleTime: 2 * 60 * 1000,
    });

    const otros = todosUsuarios.filter(u => String(u.id) !== yo_id && u.tipo !== "superadmin");

    // ── Resumen de conversaciones (último mensaje + no leídos) ────
    const { data: resumen = {} } = useQuery({
        queryKey: ["resumen-conversaciones", id_empresa, yo_id],
        queryFn:  () => ResumenConversaciones({ id_empresa, yo_id }),
        enabled:  !!id_empresa && !!yo_id,
        refetchInterval: false,
        staleTime: 0,
    });

    // ── Mensajes con el usuario seleccionado ──────────────────────
    const { data: mensajes = [] } = useQuery({
        queryKey: ["mensajes-internos", id_empresa, yo_id, seleccionado?.id],
        queryFn:  () => MostrarMensajesEntre({
            id_empresa, emisor_id: yo_id, receptor_id: String(seleccionado.id),
        }),
        enabled:  !!seleccionado && !!id_empresa,
        staleTime: 0,
    });

    // ── Realtime ──────────────────────────────────────────────────
    useEffect(() => {
        if (!id_empresa || !yo_id) return;
        const ch = supabase
            .channel(`mensajes-internos-${id_empresa}-${yo_id}`)
            .on("postgres_changes", {
                event: "INSERT", schema: "public", table: "mensajes_internos",
                filter: `id_empresa=eq.${id_empresa}`,
            }, (payload) => {
                const m = payload.new;
                const esRelevante = m.emisor_id === yo_id || m.receptor_id === yo_id;
                if (!esRelevante) return;
                qc.invalidateQueries({ queryKey: ["resumen-conversaciones", id_empresa, yo_id] });
                const partnerId = m.emisor_id === yo_id ? m.receptor_id : m.emisor_id;
                if (seleccionado && String(seleccionado.id) === String(partnerId)) {
                    qc.invalidateQueries({ queryKey: ["mensajes-internos", id_empresa, yo_id, seleccionado.id] });
                }
            })
            .on("postgres_changes", {
                event: "UPDATE", schema: "public", table: "mensajes_internos",
                filter: `id_empresa=eq.${id_empresa}`,
            }, () => {
                qc.invalidateQueries({ queryKey: ["resumen-conversaciones", id_empresa, yo_id] });
            })
            .subscribe();
        return () => supabase.removeChannel(ch);
    }, [id_empresa, yo_id, seleccionado?.id]);

    // ── Marcar como leídos al abrir conversación ──────────────────
    useEffect(() => {
        if (!seleccionado || !id_empresa || !yo_id) return;
        MarcarLeidosInternos({
            id_empresa, emisor_id: String(seleccionado.id), receptor_id: yo_id,
        }).then(() => {
            qc.invalidateQueries({ queryKey: ["resumen-conversaciones", id_empresa, yo_id] });
            qc.invalidateQueries({ queryKey: ["badge-mensajes", id_empresa, yo_id] });
        });
    }, [seleccionado?.id, mensajes.length]);

    // ── Auto-scroll ───────────────────────────────────────────────
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes]);

    // ── Enviar ────────────────────────────────────────────────────
    async function enviar(e) {
        e?.preventDefault();
        if (!texto.trim() || !seleccionado || enviando) return;
        setEnviando(true);
        try {
            await EnviarMensajeInterno({
                id_empresa, emisor_id: yo_id,
                receptor_id: String(seleccionado.id), texto: texto.trim(),
            });
            setTexto("");
            qc.invalidateQueries({ queryKey: ["mensajes-internos", id_empresa, yo_id, seleccionado.id] });
            qc.invalidateQueries({ queryKey: ["resumen-conversaciones", id_empresa, yo_id] });
        } finally { setEnviando(false); }
    }

    function handleKey(e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
    }

    function abrirChat(u) {
        setSeleccionado(u);
        setVista("chat");
    }

    // ── Filtro búsqueda ───────────────────────────────────────────
    const usuariosFiltrados = otros.filter(u => {
        const q = busqueda.toLowerCase();
        const nombre = `${u.nombres ?? ""} ${u.apellidos ?? ""}`.toLowerCase();
        return !q || nombre.includes(q) || (u.usuario ?? "").toLowerCase().includes(q);
    }).sort((a, b) => {
        const ra = resumen[String(a.id)]?.ultimo_at ?? "";
        const rb = resumen[String(b.id)]?.ultimo_at ?? "";
        return rb.localeCompare(ra);
    });

    // ── Render ────────────────────────────────────────────────────
    const panelLista = (
        <PanelLista $visible={vista === "lista"}>
            <PanelHeader>
                <PanelTitulo>Equipo</PanelTitulo>
                <PanelSub>{otros.length} integrante{otros.length !== 1 ? "s" : ""}</PanelSub>
            </PanelHeader>

            <BusquedaWrap>
                <RiSearchLine />
                <BusquedaInput
                    placeholder="Buscar..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                />
            </BusquedaWrap>

            <ListaUsuarios>
                {usuariosFiltrados.length === 0 ? (
                    <EmptyLista>
                        <RiTeamLine size={32} style={{ opacity: 0.2 }} />
                        <span>No hay otros usuarios en la empresa</span>
                    </EmptyLista>
                ) : usuariosFiltrados.map(u => {
                    const key = String(u.id);
                    const conv  = resumen[key] ?? {};
                    const activo = seleccionado && String(seleccionado.id) === key;
                    return (
                        <ItemUsuario key={u.id} $activo={activo} onClick={() => abrirChat(u)}>
                            <AvatarItem $color={TIPO_COLOR[u.tipo] ?? "#60a5fa"}>
                                {inicial(u)}
                            </AvatarItem>
                            <ItemInfo>
                                <ItemNombre>{u.nombres ?? u.usuario} {u.apellidos ?? ""}</ItemNombre>
                                <ItemUltimo>{conv.ultimo ?? "Sin mensajes aún"}</ItemUltimo>
                            </ItemInfo>
                            <ItemDer>
                                {conv.ultimo_at && (
                                    <ItemHora>{fmtFecha(conv.ultimo_at)}</ItemHora>
                                )}
                                {conv.unread > 0 && (
                                    <UnreadBadge>{conv.unread > 9 ? "9+" : conv.unread}</UnreadBadge>
                                )}
                                {!conv.unread && <RolTag $color={TIPO_COLOR[u.tipo]}>{u.tipo}</RolTag>}
                            </ItemDer>
                        </ItemUsuario>
                    );
                })}
            </ListaUsuarios>
        </PanelLista>
    );

    const panelChat = (
        <PanelChat $visible={vista === "chat" || !!seleccionado}>
            {!seleccionado ? (
                <VacioChat>
                    <RiTeamLine size={56} style={{ opacity: 0.1 }} />
                    <span>Selecciona un integrante para empezar a chatear</span>
                </VacioChat>
            ) : (
                <>
                    <ChatHeader>
                        <BtnVolver onClick={() => setVista("lista")}><RiArrowLeftLine /></BtnVolver>
                        <AvatarHeader $color={TIPO_COLOR[seleccionado.tipo] ?? "#60a5fa"}>
                            {inicial(seleccionado)}
                        </AvatarHeader>
                        <HeaderInfo>
                            <HeaderNombre>{seleccionado.nombres ?? seleccionado.usuario} {seleccionado.apellidos ?? ""}</HeaderNombre>
                            <RolTagHeader $color={TIPO_COLOR[seleccionado.tipo] ?? "#60a5fa"}>
                                {seleccionado.tipo}
                            </RolTagHeader>
                        </HeaderInfo>
                    </ChatHeader>

                    <MensajesWrap>
                        {mensajes.length === 0 ? (
                            <EmptyChat>
                                <span>Ningún mensaje aún. ¡Di algo!</span>
                            </EmptyChat>
                        ) : (() => {
                            let lastFecha = null;
                            return mensajes.map(m => {
                                const esMio = m.emisor_id === yo_id;
                                const f = fmtFecha(m.created_at);
                                const showDate = f !== lastFecha;
                                lastFecha = f;
                                return (
                                    <MsgGroup key={m.id}>
                                        {showDate && (
                                            <DateDiv><DateSpan>{f}</DateSpan></DateDiv>
                                        )}
                                        <BubbleRow $right={esMio}>
                                            {!esMio && (
                                                <BubbleAv $color={TIPO_COLOR[seleccionado.tipo] ?? "#60a5fa"}>
                                                    {inicial(seleccionado)}
                                                </BubbleAv>
                                            )}
                                            <BubbleWrap>
                                                <Bubble $right={esMio}>{m.texto}</Bubble>
                                                <BubbleTime $right={esMio}>{fmtHora(m.created_at)}</BubbleTime>
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
                            placeholder={`Mensaje para ${seleccionado.nombres ?? seleccionado.usuario}...`}
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
        </PanelChat>
    );

    return (
        <Page>
            {panelLista}
            {panelChat}
        </Page>
    );
}

/* ══ ESTILOS ══════════════════════════════════════════════════════════════════ */
const fadeUp  = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}`;
const popIn   = keyframes`from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}`;

const Page = styled.div`
    display: grid;
    grid-template-columns: 310px 1fr;
    height: calc(100vh - 0px);
    background: ${({ theme }) => theme.bgtotal};
    animation: ${fadeUp} 0.25s ease;
    overflow: hidden;

    @media (max-width: 767px) {
        grid-template-columns: 1fr;
        height: 100vh;
    }
`;

/* ── Panel lista ── */
const PanelLista = styled.div`
    display: flex; flex-direction: column;
    border-right: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards};
    overflow: hidden;

    @media (max-width: 767px) {
        display: ${({ $visible }) => $visible ? "flex" : "none"};
        position: absolute; inset: 0; z-index: 10;
    }
`;

const PanelHeader = styled.div`
    padding: 22px 20px 14px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    flex-shrink: 0;
`;
const PanelTitulo = styled.h2`
    font-size: 20px; font-weight: 900; color: ${({ theme }) => theme.text}; margin: 0 0 2px;
`;
const PanelSub = styled.p`
    font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard}; margin: 0;
`;

const BusquedaWrap = styled.div`
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 16px; flex-shrink: 0;
`;
const BusquedaInput = styled.input`
    flex: 1; border: none; background: none; outline: none;
    font-size: 13px; color: ${({ theme }) => theme.text};
    font-family: "Poppins", sans-serif;
    &::placeholder { color: ${({ theme }) => theme.colorsubtitlecard}; }
`;

const ListaUsuarios = styled.div`
    flex: 1; overflow-y: auto;
    &::-webkit-scrollbar { width: 3px; }
    &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colorScroll}; border-radius: 10px; }
`;

const EmptyLista = styled.div`
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; padding: 60px 20px;
    text-align: center; font-size: 13px;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

const ItemUsuario = styled.div`
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px; cursor: pointer;
    background: ${({ $activo }) => $activo ? "rgba(248,133,51,0.08)" : "transparent"};
    border-left: 3px solid ${({ $activo }) => $activo ? "#f88533" : "transparent"};
    transition: background 0.12s;
    &:hover { background: ${({ $activo }) => $activo ? "rgba(248,133,51,0.1)" : "rgba(255,255,255,0.04)"}; }
`;

const AvatarItem = styled.div`
    width: 42px; height: 42px; border-radius: 13px; flex-shrink: 0;
    background: ${({ $color }) => `${$color}1a`};
    border: 1.5px solid ${({ $color }) => `${$color}55`};
    color: ${({ $color }) => $color};
    font-size: 16px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
`;

const ItemInfo = styled.div`flex: 1; min-width: 0;`;
const ItemNombre = styled.div`
    font-size: 13px; font-weight: 700; color: ${({ theme }) => theme.text};
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const ItemUltimo = styled.div`
    font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-top: 2px;
`;

const ItemDer = styled.div`
    display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;
`;
const ItemHora = styled.span`font-size: 10px; color: ${({ theme }) => theme.colorsubtitlecard};`;
const UnreadBadge = styled.span`
    min-width: 18px; height: 18px; border-radius: 10px; padding: 0 4px;
    background: #f88533; color: #fff;
    font-size: 10px; font-weight: 900; font-family: "Poppins", sans-serif;
    display: flex; align-items: center; justify-content: center;
`;
const RolTag = styled.span`
    font-size: 9px; font-weight: 800; text-transform: capitalize;
    color: ${({ $color }) => $color};
    background: ${({ $color }) => `${$color}18`};
    padding: 2px 6px; border-radius: 6px;
`;

/* ── Panel chat ── */
const PanelChat = styled.div`
    display: flex; flex-direction: column; overflow: hidden;
    background: ${({ theme }) => theme.bgtotal};

    @media (max-width: 767px) {
        display: ${({ $visible }) => $visible ? "flex" : "none"};
        position: absolute; inset: 0; z-index: 10;
    }
`;

const VacioChat = styled.div`
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 14px; text-align: center; padding: 40px;
`;

const ChatHeader = styled.div`
    display: flex; align-items: center; gap: 12px;
    padding: 14px 20px;
    background: ${({ theme }) => theme.bgcards};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    flex-shrink: 0;
`;

const BtnVolver = styled.button`
    display: none;
    @media (max-width: 767px) {
        display: flex; align-items: center; justify-content: center;
        background: none; border: none; color: ${({ theme }) => theme.text};
        font-size: 22px; cursor: pointer; padding: 4px;
    }
`;

const AvatarHeader = styled.div`
    width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
    background: ${({ $color }) => `${$color}1a`};
    border: 1.5px solid ${({ $color }) => `${$color}55`};
    color: ${({ $color }) => $color};
    font-size: 15px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
`;
const HeaderInfo = styled.div`flex: 1;`;
const HeaderNombre = styled.div`font-size: 14px; font-weight: 800; color: ${({ theme }) => theme.text};`;
const RolTagHeader = styled.span`
    font-size: 10px; font-weight: 800; text-transform: capitalize;
    color: ${({ $color }) => $color};
`;

const MensajesWrap = styled.div`
    flex: 1; overflow-y: auto; padding: 20px 24px;
    display: flex; flex-direction: column; gap: 2px;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colorScroll}; border-radius: 10px; }
    @media (max-width: 767px) { padding: 14px 12px; }
`;

const EmptyChat = styled.div`
    flex: 1; display: flex; align-items: center; justify-content: center;
    color: ${({ theme }) => theme.colorsubtitlecard}; font-size: 13px;
`;

const MsgGroup = styled.div`display: flex; flex-direction: column; gap: 2px;`;
const DateDiv  = styled.div`display: flex; align-items: center; justify-content: center; margin: 14px 0 10px;`;
const DateSpan = styled.span`
    font-size: 11px; font-weight: 700; color: ${({ theme }) => theme.colorsubtitlecard};
    background: ${({ theme }) => theme.bgcards}; padding: 3px 12px;
    border-radius: 20px; border: 1px solid ${({ theme }) => theme.color2};
`;

const BubbleRow = styled.div`
    display: flex; align-items: flex-end; gap: 8px;
    justify-content: ${({ $right }) => $right ? "flex-end" : "flex-start"};
    margin-bottom: 6px;
`;
const BubbleAv = styled.div`
    width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
    background: ${({ $color }) => `${$color}1a`};
    color: ${({ $color }) => $color};
    font-size: 10px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
`;
const BubbleWrap = styled.div`
    display: flex; flex-direction: column; gap: 3px; max-width: 68%;
    animation: ${popIn} 0.18s ease;
`;
const Bubble = styled.div`
    padding: 10px 14px;
    border-radius: ${({ $right }) => $right ? "16px 16px 4px 16px" : "16px 16px 16px 4px"};
    background: ${({ $right, theme }) => $right ? "#f88533" : theme.bgcards};
    border: ${({ $right, theme }) => $right ? "none" : `1px solid ${theme.color2}`};
    color: ${({ $right, theme }) => $right ? "#fff" : theme.text};
    font-size: 14px; line-height: 1.5; word-break: break-word;
    box-shadow: ${({ $right }) => $right ? "0 2px 8px rgba(248,133,51,0.22)" : "none"};
`;
const BubbleTime = styled.span`
    font-size: 10px; color: ${({ theme }) => theme.colorsubtitlecard};
    align-self: ${({ $right }) => $right ? "flex-end" : "flex-start"};
    padding: 0 4px;
`;

const InputArea = styled.form`
    display: flex; align-items: flex-end; gap: 10px;
    padding: 14px 20px;
    background: ${({ theme }) => theme.bgcards};
    border-top: 1px solid ${({ theme }) => theme.color2};
    flex-shrink: 0;
    @media (max-width: 767px) { padding: 10px 12px; }
`;
const InputMsg = styled.textarea`
    flex: 1; resize: none; border-radius: 14px; padding: 11px 16px;
    max-height: 120px; border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 14px; font-family: "Poppins", sans-serif; outline: none; line-height: 1.5;
    &:focus { border-color: #f88533; }
    &::placeholder { color: ${({ theme }) => theme.colorsubtitlecard}; }
`;
const BtnEnviar = styled.button`
    width: 44px; height: 44px; border-radius: 13px; border: none; flex-shrink: 0;
    background: #f88533; color: #fff; font-size: 18px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all 0.15s;
    &:hover:not(:disabled) { background: #e07020; transform: scale(1.05); }
    &:disabled { opacity: 0.35; cursor: not-allowed; }
`;
