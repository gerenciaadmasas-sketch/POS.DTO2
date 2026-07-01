import { useState, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useSucursalesStore } from "../../store/SucursalesStore";
import { useAlmacenesConfigStore } from "../../store/AlmacenesConfigStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { ListarSesionesCaja } from "../../supabase/crudSesionesCaja";
import { supabase } from "../../index";
import { RiStore2Line, RiFilterOffLine, RiUserLine, RiCalendarLine } from "react-icons/ri";

const fmt = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);
const fmtFecha = (s) => s ? new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtHora  = (s) => s ? new Date(s).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—";

export function ArqueoTemplate() {
    const { dataempresa }    = useEmpresaStore();
    const { dataSucursales } = useSucursalesStore();
    const { dataAlmacenes }  = useAlmacenesConfigStore();
    const { datausuarios: usuarioActual } = useUsuariosStore();
    const id_empresa = dataempresa?.id;

    const esSuperAdmin  = usuarioActual?.tipo === "superadmin";
    const esSupervisor  = usuarioActual?.tipo === "supervisor";
    const esCajero      = usuarioActual?.tipo === "cajero";

    const idSucursalUsuario = usuarioActual?.id_sucursal ?? null;
    const idUsuario         = usuarioActual?.id          ?? null;

    const [page,  setPage]  = useState(1);
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const pageSize = 20;

    // Filtros según rol
    const filtroSucursal = esSupervisor ? idSucursalUsuario : null;
    const filtroUsuario  = esCajero     ? idUsuario         : null;

    const { data: res = { data: [], count: 0 }, isFetching } = useQuery({
        queryKey: ["sesiones-caja", id_empresa, filtroSucursal, filtroUsuario, desde, hasta, page],
        queryFn:  () => ListarSesionesCaja({
            id_empresa,
            id_sucursal: filtroSucursal,
            id_usuario:  filtroUsuario,
            desde: desde || undefined,
            hasta: hasta || undefined,
            page, pageSize,
        }),
        enabled:  !!id_empresa,
        refetchOnWindowFocus: false,
    });

    const sesiones  = res.data ?? [];
    const totalPags = Math.ceil((res.count ?? 0) / pageSize);

    // Resolver nombres de almacén y sucursal
    const nombreAlmacen  = (id) => dataAlmacenes?.find(a => a.id === id)?.nombre      ?? "—";
    const nombreSucursal = (id) => dataSucursales?.find(s => s.id === id)?.nombre ?? dataSucursales?.find(s => s.id === id)?.razon_social ?? "—";

    // Usuarios para resolver nombres (admin/supervisor ven quién hizo el arqueo)
    const { data: listaUsuarios = [] } = useQuery({
        queryKey: ["usuarios-arqueo", id_empresa],
        queryFn:  async () => {
            const { data } = await supabase
                .from("usuarios")
                .select("id, usuario, nombres")
                .eq("id_empresa", id_empresa);
            return data ?? [];
        },
        enabled: !!id_empresa && !esCajero,
        refetchOnWindowFocus: false,
    });
    const usuariosMap = useMemo(() => {
        const map = {};
        listaUsuarios.forEach(u => {
            map[u.id] = u.nombres && u.nombres !== "-" ? u.nombres.split(" ")[0] : (u.usuario ?? "—");
        });
        return map;
    }, [listaUsuarios]);

    // Etiqueta descriptiva del alcance visible
    const alcanceLabel = esCajero
        ? "Solo tus arqueos"
        : esSupervisor
            ? `Sucursal: ${nombreSucursal(idSucursalUsuario)}`
            : "Todos los arqueos";

    const alcanceColor = esCajero ? "#60a5fa" : esSupervisor ? "#10b981" : "#f88533";

    return (
        <Page>
            <TopBar>
                <TopLeft>
                    <h1>Arqueo de Caja</h1>
                    <p>Historial de aperturas y cierres de turno</p>
                </TopLeft>
                <AlcanceTag $color={alcanceColor}>
                    {esCajero ? <RiUserLine /> : <RiStore2Line />}
                    {alcanceLabel}
                </AlcanceTag>
            </TopBar>

            {/* Filtros de fecha */}
            <FiltrosRow>
                <FiltroItem>
                    <RiCalendarLine />
                    <DateInput
                        type="date"
                        value={desde}
                        onChange={e => { setDesde(e.target.value); setPage(1); }}
                        title="Desde"
                    />
                </FiltroItem>
                <FiltroItem>
                    <RiCalendarLine />
                    <DateInput
                        type="date"
                        value={hasta}
                        onChange={e => { setHasta(e.target.value); setPage(1); }}
                        title="Hasta"
                    />
                </FiltroItem>
                {(desde || hasta) && (
                    <BtnLimpiar onClick={() => { setDesde(""); setHasta(""); setPage(1); }} title="Limpiar fechas">
                        <RiFilterOffLine />
                        Limpiar
                    </BtnLimpiar>
                )}
                <TotalInfo>
                    {res.count ?? 0} registro{(res.count ?? 0) !== 1 ? "s" : ""}
                </TotalInfo>
            </FiltrosRow>

            <TablaWrap>
                <Tabla>
                    <thead>
                        <tr>
                            <Th>Fecha</Th>
                            {!esCajero && <Th>Sucursal</Th>}
                            <Th>Almacén</Th>
                            {!esCajero && <Th>Usuario</Th>}
                            <Th>Apertura</Th>
                            <Th>Cierre</Th>
                            <Th $right>Base inicial</Th>
                            <Th $right>Total ventas</Th>
                            <Th $right>Esp. efectivo</Th>
                            <Th $right>Conteo físico</Th>
                            <Th $right>Diferencia</Th>
                            <Th>Estado</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {isFetching ? (
                            <tr><Td colSpan={12} $center>Cargando...</Td></tr>
                        ) : sesiones.length === 0 ? (
                            <tr><Td colSpan={12} $center style={{ opacity: 0.5 }}>Sin registros de caja</Td></tr>
                        ) : sesiones.map(s => {
                            const dif = s.diferencia ?? 0;
                            return (
                                <Tr key={s.id}>
                                    <Td>{fmtFecha(s.fecha)}</Td>
                                    {!esCajero && <Td><SucursalText>{nombreSucursal(s.id_sucursal)}</SucursalText></Td>}
                                    <Td><AlmacenText>{nombreAlmacen(s.id_almacen)}</AlmacenText></Td>
                                    {!esCajero && (
                                        <Td>
                                            <UsuarioBadge>{usuariosMap[s.id_usuario] ?? "—"}</UsuarioBadge>
                                        </Td>
                                    )}
                                    <Td>{fmtHora(s.hora_apertura)}</Td>
                                    <Td>{fmtHora(s.hora_cierre)}</Td>
                                    <Td $right>{fmt(s.saldo_inicial)}</Td>
                                    <Td $right>{fmt(s.total_ventas)}</Td>
                                    <Td $right>{fmt(s.saldo_esperado)}</Td>
                                    <Td $right>{fmt(s.saldo_contado)}</Td>
                                    <Td $right>
                                        <DifBadge $positivo={dif >= 0}>
                                            {dif >= 0 ? "+" : ""}{fmt(dif)}
                                        </DifBadge>
                                    </Td>
                                    <Td>
                                        <EstadoBadge $abierta={s.estado === "abierta"}>
                                            {s.estado === "abierta" ? "Abierta" : "Cerrada"}
                                        </EstadoBadge>
                                    </Td>
                                </Tr>
                            );
                        })}
                    </tbody>
                </Tabla>
            </TablaWrap>

            {totalPags > 1 && (
                <Paginacion>
                    <BtnPag onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</BtnPag>
                    <span>{page} de {totalPags}</span>
                    <BtnPag onClick={() => setPage(p => Math.min(totalPags, p + 1))} disabled={page === totalPags}>›</BtnPag>
                </Paginacion>
            )}
        </Page>
    );
}

const fadeUp = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;

const Page = styled.div`
    min-height: 100vh; background: ${({ theme }) => theme.bgtotal};
    padding: 28px; animation: ${fadeUp} 0.3s ease;
    display: flex; flex-direction: column; gap: 20px;

    @media (max-width: 767px) { padding: 68px 12px 20px; gap: 14px; }
`;

const TopBar = styled.div`
    display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px;
`;
const TopLeft = styled.div`
    h1 { font-size: 22px; font-weight: 900; color: ${({ theme }) => theme.text}; margin: 0 0 4px; }
    p  { font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard}; margin: 0; }
`;
const AlcanceTag = styled.div`
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
    color: ${({ $color }) => $color};
    background: ${({ $color }) => `${$color}18`};
    border: 1px solid ${({ $color }) => `${$color}40`};
    svg { font-size: 14px; }
`;

const FiltrosRow = styled.div`
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
`;
const FiltroItem = styled.div`
    display: flex; align-items: center; gap: 6px;
    color: ${({ theme }) => theme.colorsubtitlecard}; font-size: 14px;
`;
const DateInput = styled.input`
    padding: 7px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards}; color: ${({ theme }) => theme.text};
    font-family: "Poppins", sans-serif; outline: none; cursor: pointer;
    &:focus { border-color: #2563eb; }
    &::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
`;
const BtnLimpiar = styled.button`
    display: flex; align-items: center; gap: 5px;
    padding: 7px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;
    border: 1px solid #f87171; background: rgba(248,113,113,0.1); color: #f87171;
    cursor: pointer; font-family: "Poppins", sans-serif;
    &:hover { background: rgba(248,113,113,0.2); }
`;
const TotalInfo = styled.span`
    margin-left: auto; font-size: 12px; font-weight: 600;
    color: ${({ theme }) => theme.colorsubtitlecard};
`;

const TablaWrap = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px; overflow: auto;
`;

const Tabla = styled.table`width: 100%; border-collapse: collapse;`;

const Th = styled.th`
    padding: 12px 14px; text-align: ${({ $right }) => $right ? "right" : "left"};
    font-size: 11px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.5px; color: ${({ theme }) => theme.colorsubtitlecard};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    white-space: nowrap;
`;

const Tr = styled.tr`
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    transition: background 0.12s;
    &:last-child { border-bottom: none; }
    &:hover td { background: ${({ theme }) => theme.bgtotal}; }
`;

const Td = styled.td`
    padding: 11px 14px; font-size: 13px;
    color: ${({ theme }) => theme.text};
    text-align: ${({ $right, $center }) => $right ? "right" : $center ? "center" : "left"};
    white-space: nowrap;
`;

const SucursalText = styled.span`
    font-size: 12px; color: ${({ theme }) => theme.colorsubtitlecard};
`;
const AlmacenText = styled.span`
    font-weight: 700;
`;
const UsuarioBadge = styled.span`
    display: inline-block; padding: 2px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 700;
    background: rgba(99,102,241,0.12); color: #818cf8;
`;

const DifBadge = styled.span`
    font-weight: 800; font-size: 13px;
    color: ${({ $positivo }) => $positivo ? "#4ade80" : "#f87171"};
`;

const EstadoBadge = styled.span`
    padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
    background: ${({ $abierta }) => $abierta ? "rgba(74,222,128,0.12)" : "rgba(148,163,184,0.12)"};
    color: ${({ $abierta }) => $abierta ? "#4ade80" : "#94a3b8"};
`;

const Paginacion = styled.div`
    display: flex; align-items: center; justify-content: center; gap: 14px;
    font-size: 13px; color: ${({ theme }) => theme.text};
`;

const BtnPag = styled.button`
    background: ${({ theme }) => theme.bgcards}; border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px; padding: 6px 14px; cursor: pointer; font-size: 16px;
    color: ${({ theme }) => theme.text};
    &:disabled { opacity: 0.3; cursor: not-allowed; }
`;
