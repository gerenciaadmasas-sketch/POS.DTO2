import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useSucursalesStore } from "../../store/SucursalesStore";
import { useAlmacenesConfigStore } from "../../store/AlmacenesConfigStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { ListarSesionesCaja } from "../../supabase/crudSesionesCaja";

const fmt = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n ?? 0);
const fmtFecha = (s) => s ? new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtHora  = (s) => s ? new Date(s).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—";

export function ArqueoTemplate() {
    const { dataempresa }    = useEmpresaStore();
    const { dataSucursales } = useSucursalesStore();
    const { dataAlmacenes }  = useAlmacenesConfigStore();
    const { datausuarios: usuarioActual } = useUsuariosStore();
    const id_empresa = dataempresa?.id;

    const [page, setPage]   = useState(1);
    const pageSize = 20;

    const { data: res = { data: [], count: 0 }, isFetching } = useQuery({
        queryKey: ["sesiones-caja", id_empresa, page],
        queryFn:  () => ListarSesionesCaja({ id_empresa, page, pageSize }),
        enabled:  !!id_empresa, refetchOnWindowFocus: false,
    });

    const sesiones  = res.data ?? [];
    const totalPags = Math.ceil((res.count ?? 0) / pageSize);

    const nombreAlmacen  = (id) => dataAlmacenes?.find(a => a.id === id)?.nombre ?? "—";
    const nombreSucursal = (id) => dataSucursales?.find(s => s.id === id)?.nombre ?? "—";

    return (
        <Page>
            <TopBar>
                <div>
                    <h1>Arqueo de Caja</h1>
                    <p>historial de aperturas y cierres de turno</p>
                </div>
            </TopBar>

            <Tabla>
                <thead>
                    <tr>
                        <Th>Fecha</Th>
                        <Th>Almacén</Th>
                        <Th>Apertura</Th>
                        <Th>Cierre</Th>
                        <Th align="right">Base inicial</Th>
                        <Th align="right">Total ventas</Th>
                        <Th align="right">Efectivo esperado</Th>
                        <Th align="right">Conteo físico</Th>
                        <Th align="right">Diferencia</Th>
                        <Th>Comentarios</Th>
                        <Th>Estado</Th>
                    </tr>
                </thead>
                <tbody>
                    {isFetching ? (
                        <tr><Td colSpan={11} style={{ textAlign: "center", padding: 32 }}>Cargando...</Td></tr>
                    ) : sesiones.length === 0 ? (
                        <tr><Td colSpan={11} style={{ textAlign: "center", padding: 32, opacity: 0.5 }}>Sin registros de caja</Td></tr>
                    ) : sesiones.map(s => {
                        const dif = s.diferencia ?? 0;
                        return (
                            <Tr key={s.id}>
                                <Td>{fmtFecha(s.fecha)}</Td>
                                <Td>{nombreAlmacen(s.id_almacen)}</Td>
                                <Td>{fmtHora(s.hora_apertura)}</Td>
                                <Td>{fmtHora(s.hora_cierre)}</Td>
                                <Td align="right">{fmt(s.saldo_inicial)}</Td>
                                <Td align="right">{fmt(s.total_ventas)}</Td>
                                <Td align="right">{fmt(s.saldo_esperado)}</Td>
                                <Td align="right">{fmt(s.saldo_contado)}</Td>
                                <Td align="right">
                                    <DifBadge $positivo={dif >= 0}>
                                        {dif >= 0 ? "+" : ""}{fmt(dif)}
                                    </DifBadge>
                                </Td>
                                <Td>
                                    <Notas>{s.notas ?? "—"}</Notas>
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

    @media (max-width: 767px) {
        padding: 68px 12px 20px;
    }
`;

const TopBar = styled.div`
    margin-bottom: 24px;
    h1 { font-size: 22px; font-weight: 900; color: ${({ theme }) => theme.text}; margin: 0 0 4px; }
    p  { font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard}; margin: 0; }
`;

const Tabla = styled.table`
    width: 100%; border-collapse: collapse;
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px; overflow: hidden;
`;

const Th = styled.th`
    padding: 12px 14px; text-align: ${({ align }) => align ?? "left"};
    font-size: 11px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.5px; color: ${({ theme }) => theme.colorsubtitlecard};
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    white-space: nowrap;
`;

const Tr = styled.tr`
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    transition: background 0.12s;
    &:last-child { border-bottom: none; }
    &:hover { background: ${({ theme }) => theme.bgtotal}; }
`;

const Td = styled.td`
    padding: 12px 14px; font-size: 13px;
    color: ${({ theme }) => theme.text};
    text-align: ${({ align }) => align ?? "left"};
    white-space: nowrap;
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
    margin-top: 20px; font-size: 13px; color: ${({ theme }) => theme.text};
`;

const BtnPag = styled.button`
    background: ${({ theme }) => theme.bgcards}; border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px; padding: 6px 14px; cursor: pointer; font-size: 16px;
    color: ${({ theme }) => theme.text};
    &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const Notas = styled.span`
    font-size: 12px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    white-space: pre-wrap;
    max-width: 200px;
    display: inline-block;
`;
