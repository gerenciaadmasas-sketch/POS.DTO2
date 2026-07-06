import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MostrarProspectos, ActualizarProspecto, EliminarProspecto } from "../../supabase/crudProspectos";
import { RiDeleteBin2Line, RiWhatsappLine, RiPhoneLine, RiCloseLine, RiCheckLine, RiSearchLine, RiUserAddLine, RiUserStarLine } from "react-icons/ri";

const ESTADOS = [
    { key: "nuevo",          label: "Nuevo",          color: "#818cf8" },
    { key: "contactado",     label: "Contactado",     color: "#f88533" },
    { key: "en_negociacion", label: "En negociación", color: "#fbbf24" },
    { key: "cerrado",        label: "Cerrado",        color: "#34d399" },
    { key: "perdido",        label: "Perdido",        color: "#f87171" },
];

const colorEstado = (e) => ESTADOS.find(x => x.key === e)?.color ?? "#9ca3af";
const labelEstado = (e) => ESTADOS.find(x => x.key === e)?.label ?? e;

const formatFecha = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const LABEL_PLAN = { mensual: "Mensual", bimestral: "Bimestral", trimestral: "Trimestral" };

export function ProspectosTemplate() {
    const qc = useQueryClient();
    const nav = useNavigate();
    const [filtro, setFiltro]           = useState("todos");
    const [busqueda, setBusqueda]       = useState("");
    const [detalle, setDetalle]         = useState(null);
    const [notasEdit, setNotasEdit]     = useState("");
    const [estadoEdit, setEstadoEdit]   = useState("");

    const { data: prospectos = [], isLoading } = useQuery({
        queryKey: ["prospectos"],
        queryFn: MostrarProspectos,
        refetchOnWindowFocus: false,
    });

    const mutUpdate = useMutation({
        mutationFn: ActualizarProspecto,
        onSuccess: () => { qc.invalidateQueries(["prospectos"]); setDetalle(null); },
    });

    const mutDelete = useMutation({
        mutationFn: EliminarProspecto,
        onSuccess: () => { qc.invalidateQueries(["prospectos"]); setDetalle(null); },
    });

    const abrirDetalle = (p) => {
        setDetalle(p);
        setNotasEdit(p.notas ?? "");
        setEstadoEdit(p.estado);
    };

    const guardar = () => mutUpdate.mutate({ id: detalle.id, estado: estadoEdit, notas: notasEdit });
    const eliminar = (id) => { if (window.confirm("¿Eliminar este prospecto?")) mutDelete.mutate(id); };

    const lista = prospectos
        .filter(p => filtro === "todos" || p.estado === filtro)
        .filter(p => {
            const q = busqueda.toLowerCase();
            return !q || `${p.nombre} ${p.apellido} ${p.negocio} ${p.telefono}`.toLowerCase().includes(q);
        });

    /* ── Stats ── */
    const total     = prospectos.length;
    const nuevos    = prospectos.filter(p => p.estado === "nuevo").length;
    const enNeg     = prospectos.filter(p => p.estado === "en_negociacion").length;
    const cerrados  = prospectos.filter(p => p.estado === "cerrado").length;

    return (
        <Wrap>
            <Header>
                <HeaderLeft>
                    <Title>Leads</Title>
                    <Sub>Panel comercial · gestión de leads</Sub>
                </HeaderLeft>
            </Header>

            {/* ── Stats ── */}
            <StatsRow>
                {[
                    { label: "Total",         val: total,    color: "#818cf8" },
                    { label: "Nuevos",        val: nuevos,   color: "#f88533" },
                    { label: "En negociación",val: enNeg,    color: "#fbbf24" },
                    { label: "Cerrados",      val: cerrados, color: "#34d399" },
                ].map(s => (
                    <StatCard key={s.label} $color={s.color}>
                        <StatVal $color={s.color}>{s.val}</StatVal>
                        <StatLabel>{s.label}</StatLabel>
                    </StatCard>
                ))}
            </StatsRow>

            {/* ── Filtros y búsqueda ── */}
            <Controls>
                <SearchWrap>
                    <RiSearchLine />
                    <SearchInput
                        placeholder="Buscar por nombre, negocio o teléfono..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                </SearchWrap>
                <FiltrosRow>
                    <FiltroBtn $active={filtro === "todos"} onClick={() => setFiltro("todos")}>
                        Todos ({total})
                    </FiltroBtn>
                    {ESTADOS.map(e => (
                        <FiltroBtn
                            key={e.key}
                            $active={filtro === e.key}
                            $color={e.color}
                            onClick={() => setFiltro(e.key)}
                        >
                            {e.label} ({prospectos.filter(p => p.estado === e.key).length})
                        </FiltroBtn>
                    ))}
                </FiltrosRow>
            </Controls>

            {/* ── Tabla ── */}
            {isLoading ? (
                <Empty>Cargando prospectos...</Empty>
            ) : lista.length === 0 ? (
                <Empty>
                    <RiUserAddLine size={40} style={{ opacity: 0.3 }} />
                    <span>Aún no hay leads{filtro !== "todos" ? " con este estado" : ""}.</span>
                </Empty>
            ) : (
                <TableWrap>
                    <Table>
                        <thead>
                            <Tr>
                                <Th>Nombre</Th>
                                <Th>Negocio</Th>
                                <Th>Contacto</Th>
                                <Th>Estado</Th>
                                <Th>Fecha</Th>
                                <Th></Th>
                            </Tr>
                        </thead>
                        <tbody>
                            {lista.map(p => (
                                <TrBody key={p.id} onClick={() => abrirDetalle(p)}>
                                    <Td>
                                        <NombreWrap>
                                            <Avatar $color={colorEstado(p.estado)}>
                                                {p.nombre[0]}{p.apellido[0]}
                                            </Avatar>
                                            <div>
                                                <NombreText>{p.nombre} {p.apellido}</NombreText>
                                            </div>
                                        </NombreWrap>
                                    </Td>
                                    <Td><NegocioText>{p.negocio}</NegocioText></Td>
                                    <Td>
                                        <ContactoWrap>
                                            {p.contacto_preferido === "whatsapp"
                                                ? <RiWhatsappLine color="#25d366" />
                                                : <RiPhoneLine color="#818cf8" />
                                            }
                                            <TelText>{p.telefono}</TelText>
                                        </ContactoWrap>
                                    </Td>
                                    <Td>
                                        <Badge $color={colorEstado(p.estado)}>
                                            {labelEstado(p.estado)}
                                        </Badge>
                                    </Td>
                                    <Td><FechaText>{formatFecha(p.created_at)}</FechaText></Td>
                                    <Td onClick={e => { e.stopPropagation(); eliminar(p.id); }}>
                                        <BtnDel><RiDeleteBin2Line /></BtnDel>
                                    </Td>
                                </TrBody>
                            ))}
                        </tbody>
                    </Table>
                </TableWrap>
            )}

            {/* ══ PANEL DETALLE ══ */}
            {detalle && (
                <>
                <Overlay onClick={() => setDetalle(null)} />
                <Drawer>
                    <DrawerHeader>
                        <DrawerAvatar $color={colorEstado(detalle.estado)}>
                            {detalle.nombre[0]}{detalle.apellido[0]}
                        </DrawerAvatar>
                        <DrawerHeaderInfo>
                            <DrawerNombre>{detalle.nombre} {detalle.apellido}</DrawerNombre>
                            <DrawerNegocio>{detalle.negocio}</DrawerNegocio>
                        </DrawerHeaderInfo>
                        <BtnCerrar onClick={() => setDetalle(null)}><RiCloseLine /></BtnCerrar>
                    </DrawerHeader>

                    <DrawerSection>
                        <DrawerLabel>Teléfono</DrawerLabel>
                        <DrawerContactoRow>
                            {detalle.contacto_preferido === "whatsapp"
                                ? <RiWhatsappLine color="#25d366" size={18} />
                                : <RiPhoneLine color="#818cf8" size={18} />
                            }
                            <DrawerVal>{detalle.telefono}</DrawerVal>
                            {detalle.contacto_preferido === "whatsapp" && (
                                <BtnWA
                                    as="a"
                                    href={`https://wa.me/57${detalle.telefono.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <RiWhatsappLine /> Abrir chat
                                </BtnWA>
                            )}
                        </DrawerContactoRow>
                    </DrawerSection>

                    <DrawerSection>
                        <DrawerLabel>Prefiere contacto por</DrawerLabel>
                        <DrawerVal style={{ textTransform: "capitalize" }}>{detalle.contacto_preferido}</DrawerVal>
                    </DrawerSection>

                    {detalle.email && (
                        <DrawerSection>
                            <DrawerLabel>Email</DrawerLabel>
                            <DrawerVal>{detalle.email}</DrawerVal>
                        </DrawerSection>
                    )}

                    {detalle.plan_elegido && (
                        <DrawerSection>
                            <DrawerLabel>Plan elegido</DrawerLabel>
                            <DrawerVal>{LABEL_PLAN[detalle.plan_elegido] ?? detalle.plan_elegido}</DrawerVal>
                        </DrawerSection>
                    )}

                    {detalle.actividad_economica && (
                        <DrawerSection>
                            <DrawerLabel>Actividad económica</DrawerLabel>
                            <DrawerVal>{detalle.actividad_economica.replace(/_/g, " ")}</DrawerVal>
                        </DrawerSection>
                    )}

                    <DrawerSection>
                        <DrawerLabel>Registrado</DrawerLabel>
                        <DrawerVal>{formatFecha(detalle.created_at)}</DrawerVal>
                    </DrawerSection>

                    <DrawerSection>
                        <DrawerLabel>Estado</DrawerLabel>
                        <EstadoSelector>
                            {ESTADOS.map(e => (
                                <EstadoOpt
                                    key={e.key}
                                    $color={e.color}
                                    $active={estadoEdit === e.key}
                                    onClick={() => setEstadoEdit(e.key)}
                                >
                                    {estadoEdit === e.key && <RiCheckLine />}
                                    {e.label}
                                </EstadoOpt>
                            ))}
                        </EstadoSelector>
                    </DrawerSection>

                    <DrawerSection>
                        <DrawerLabel>Notas internas</DrawerLabel>
                        <NotasArea
                            placeholder="Agrega notas del seguimiento, acuerdos, próximos pasos..."
                            value={notasEdit}
                            onChange={e => setNotasEdit(e.target.value)}
                            rows={4}
                        />
                    </DrawerSection>

                    <BtnCrearCliente
                        onClick={() => nav("/saas", { state: { prospecto: detalle } })}
                    >
                        <RiUserStarLine /> Crear como cliente
                    </BtnCrearCliente>

                    <DrawerActions>
                        <BtnGuardar onClick={guardar} disabled={mutUpdate.isPending}>
                            {mutUpdate.isPending ? "Guardando..." : "Guardar cambios"}
                        </BtnGuardar>
                        <BtnEliminar onClick={() => eliminar(detalle.id)} disabled={mutDelete.isPending}>
                            <RiDeleteBin2Line /> Eliminar
                        </BtnEliminar>
                    </DrawerActions>
                </Drawer>
                </>
            )}
        </Wrap>
    );
}

/* ═══════════════════════════
   ESTILOS
═══════════════════════════ */
const fadeUp = keyframes`
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
`;

const Wrap = styled.div`
    padding: 24px 28px;
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    animation: ${fadeUp} 0.3s ease both;

    @media (max-width: 768px) { padding: 68px 14px 28px; }
`;



const Header = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
`;

const HeaderLeft = styled.div``;

const Title = styled.h1`
    font-size: 22px; font-weight: 900; margin: 0;
    color: ${({ theme }) => theme.text};
`;

const Sub = styled.p`
    font-size: 13px; margin: 2px 0 0;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

/* Stats */
const StatsRow = styled.div`
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
    margin-bottom: 24px;

    @media (max-width: 640px) { grid-template-columns: repeat(2,1fr); }
    @media (max-width: 360px) { grid-template-columns: 1fr; }
`;

const StatCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-top: 3px solid ${({ $color }) => $color};
    border-radius: 14px; padding: 16px 20px;
    display: flex; flex-direction: column; gap: 4px;
`;

const StatVal = styled.span`
    font-size: 28px; font-weight: 900;
    color: ${({ $color }) => $color};
`;

const StatLabel = styled.span`
    font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

/* Controls */
const Controls = styled.div`
    display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;
`;

const SearchWrap = styled.div`
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px; border-radius: 12px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards};
    color: ${({ theme }) => theme.colorsubtitlecard};
    max-width: 420px;
`;

const SearchInput = styled.input`
    background: none; border: none; outline: none; width: 100%;
    font-size: 14px; font-family: "Poppins", sans-serif;
    color: ${({ theme }) => theme.text};
    &::placeholder { color: ${({ theme }) => theme.colorsubtitlecard}; }
`;

const FiltrosRow = styled.div`
    display: flex; gap: 8px; flex-wrap: wrap;
`;

const FiltroBtn = styled.button`
    padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700;
    font-family: "Poppins", sans-serif; cursor: pointer; transition: all 0.15s;
    border: 1.5px solid ${({ $active, $color, theme }) =>
        $active ? ($color ?? "#f88533") : theme.color2};
    background: ${({ $active, $color }) =>
        $active ? ($color ? `${$color}22` : "rgba(248,133,51,0.15)") : "transparent"};
    color: ${({ $active, $color, theme }) =>
        $active ? ($color ?? "#f88533") : theme.colorsubtitlecard};
    &:hover { border-color: ${({ $color }) => $color ?? "#f88533"}; color: ${({ $color }) => $color ?? "#f88533"}; }
`;

/* Tabla */
const TableWrap = styled.div`
    overflow-x: auto; border-radius: 16px;
    border: 1px solid ${({ theme }) => theme.color2};
`;

const Table = styled.table`
    width: 100%; border-collapse: collapse;
`;

const Tr = styled.tr`
    background: ${({ theme }) => theme.bgcards};
`;

const Th = styled.th`
    padding: 14px 16px; text-align: left;
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    white-space: nowrap;
`;

const TrBody = styled.tr`
    cursor: pointer; transition: background 0.15s;
    &:hover { background: ${({ theme }) => theme.bghover ?? "rgba(248,133,51,0.05)"}; }
    &:not(:last-child) td { border-bottom: 1px solid ${({ theme }) => theme.color2}; }
`;

const Td = styled.td`
    padding: 14px 16px; vertical-align: middle;
`;

const NombreWrap = styled.div`
    display: flex; align-items: center; gap: 10px;
`;

const Avatar = styled.div`
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    background: ${({ $color }) => `${$color}22`};
    border: 1.5px solid ${({ $color }) => `${$color}55`};
    color: ${({ $color }) => $color};
    font-size: 12px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    text-transform: uppercase;
`;

const NombreText = styled.span`
    font-size: 14px; font-weight: 700; color: ${({ theme }) => theme.text};
    white-space: nowrap;
`;

const NegocioText = styled.span`
    font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard};
    max-width: 200px; display: block;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const ContactoWrap = styled.div`
    display: flex; align-items: center; gap: 6px;
`;

const TelText = styled.span`
    font-size: 13px; color: ${({ theme }) => theme.text}; font-weight: 600;
`;

const Badge = styled.span`
    display: inline-flex; align-items: center;
    padding: 4px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 700; white-space: nowrap;
    background: ${({ $color }) => `${$color}20`};
    border: 1px solid ${({ $color }) => `${$color}55`};
    color: ${({ $color }) => $color};
`;

const FechaText = styled.span`
    font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard}; white-space: nowrap;
`;

const BtnDel = styled.button`
    width: 34px; height: 34px; border-radius: 8px; border: none;
    background: rgba(248,113,113,0.1); color: #f87171;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; cursor: pointer; transition: all 0.15s;
    &:hover { background: rgba(248,113,113,0.2); }
`;

const Empty = styled.div`
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    padding: 64px 24px; text-align: center;
    color: ${({ theme }) => theme.colorsubtitlecard}; font-size: 14px;
`;

/* Drawer detalle */
const Overlay = styled.div`
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px); z-index: 300;
`;

const Drawer = styled.div`
    position: fixed; top: 0; right: 0; bottom: 0; width: 420px;
    background: ${({ theme }) => theme.bgcards};
    border-left: 1px solid ${({ theme }) => theme.color2};
    box-shadow: -12px 0 40px rgba(0,0,0,0.3);
    z-index: 301; overflow-y: auto;
    padding: 28px 28px 40px;
    display: flex; flex-direction: column; gap: 20px;
    animation: ${fadeUp} 0.25s ease;

    @media (max-width: 480px) {
        width: 100%; top: auto; border-radius: 24px 24px 0 0;
        border-left: none; border-top: 1px solid ${({ theme }) => theme.color2};
    }
`;

const DrawerHeader = styled.div`
    display: flex; align-items: center; gap: 14px;
`;

const DrawerAvatar = styled.div`
    width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
    background: ${({ $color }) => `${$color}22`};
    border: 2px solid ${({ $color }) => `${$color}55`};
    color: ${({ $color }) => $color};
    font-size: 16px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
    text-transform: uppercase;
`;

const DrawerHeaderInfo = styled.div`
    flex: 1; min-width: 0;
`;

const DrawerNombre = styled.div`
    font-size: 16px; font-weight: 800; color: ${({ theme }) => theme.text};
`;

const DrawerNegocio = styled.div`
    font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard};
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const BtnCerrar = styled.button`
    width: 34px; height: 34px; border-radius: 9px; border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; cursor: pointer; flex-shrink: 0;
    &:hover { border-color: #f88533; color: #f88533; }
`;

const DrawerSection = styled.div`
    display: flex; flex-direction: column; gap: 6px;
`;

const DrawerLabel = styled.span`
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

const DrawerVal = styled.span`
    font-size: 14px; font-weight: 600; color: ${({ theme }) => theme.text};
`;

const DrawerContactoRow = styled.div`
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
`;

const BtnWA = styled.button`
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700;
    background: #25d36622; border: 1px solid #25d36655; color: #25d366;
    cursor: pointer; font-family: "Poppins", sans-serif; text-decoration: none;
    transition: all 0.15s;
    &:hover { background: #25d36633; }
`;

const EstadoSelector = styled.div`
    display: flex; flex-wrap: wrap; gap: 8px;
`;

const EstadoOpt = styled.button`
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700;
    cursor: pointer; font-family: "Poppins", sans-serif; transition: all 0.15s;
    border: 1.5px solid ${({ $active, $color }) => $active ? $color : `${$color}44`};
    background: ${({ $active, $color }) => $active ? `${$color}25` : "transparent"};
    color: ${({ $active, $color, theme }) => $active ? $color : theme.colorsubtitlecard};
    &:hover { border-color: ${({ $color }) => $color}; color: ${({ $color }) => $color}; }
`;

const NotasArea = styled.textarea`
    width: 100%; border-radius: 12px; padding: 12px 14px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif;
    outline: none; resize: vertical; box-sizing: border-box;
    line-height: 1.6;
    &:focus { border-color: #f88533; }
    &::placeholder { color: ${({ theme }) => theme.colorsubtitlecard}; }
`;

const DrawerActions = styled.div`
    display: flex; gap: 10px; margin-top: 4px;
`;

const BtnGuardar = styled.button`
    flex: 1; padding: 13px; border-radius: 12px;
    border: 2px solid #B56B12; background: #E8891A;
    color: #fff; font-size: 14px; font-weight: 800;
    font-family: "Poppins", sans-serif; cursor: pointer;
    box-shadow: 3px 3px 0 #B56B12;
    transition: all 0.1s;
    &:hover:not(:disabled) { filter: brightness(1.08); }
    &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
`;

const BtnEliminar = styled.button`
    display: flex; align-items: center; gap: 6px;
    padding: 13px 18px; border-radius: 12px;
    border: 1.5px solid rgba(248,113,113,0.4); background: rgba(248,113,113,0.1);
    color: #f87171; font-size: 14px; font-weight: 700;
    font-family: "Poppins", sans-serif; cursor: pointer;
    transition: all 0.15s;
    &:hover:not(:disabled) { background: rgba(248,113,113,0.2); border-color: #f87171; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const BtnCrearCliente = styled.button`
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 13px; border-radius: 12px;
    border: 2px solid #4f46e5; background: rgba(79,70,229,0.12);
    color: #818cf8; font-size: 14px; font-weight: 800;
    font-family: "Poppins", sans-serif; cursor: pointer;
    transition: all 0.15s;
    &:hover { background: rgba(79,70,229,0.22); border-color: #818cf8; color: #a5b4fc; }
`;
