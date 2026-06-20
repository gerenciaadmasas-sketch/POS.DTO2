import styled from "styled-components";
import { Paginacion } from "../../../index";
import { useComprobantesStore } from "../../../store/ComprobantesStore";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { v } from "../../../styles/variables";
import { useState } from "react";
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { FaArrowsAltV } from "react-icons/fa";
import { RiEditLine } from "react-icons/ri";

export function TablaComprobantes({ onEditar }) {
    const { datacomprobantes, setDefaultComprobante } = useComprobantesStore();
    const { dataempresa } = useEmpresaStore();
    const [sorting, setSorting] = useState([]);

    async function handleDefault(row) {
        if (row.por_default) return;
        await setDefaultComprobante({ id: row.id, id_empresa: dataempresa?.id });
    }

    const columns = [
        {
            accessorKey: "tipo",
            header: "Comprobante",
            cell: (info) => <span>{info.getValue()}</span>,
        },
        {
            accessorKey: "serie",
            header: "Serie",
            cell: (info) => <Badge>{info.getValue()}</Badge>,
        },
        {
            accessorKey: "correlativo",
            header: "Correlativo",
            cell: (info) => <span>{info.getValue()}</span>,
        },
        {
            accessorKey: "por_default",
            header: "Por default",
            enableSorting: false,
            cell: (info) => (
                <CheckWrap>
                    <Checkbox
                        type="checkbox"
                        checked={info.getValue()}
                        onChange={() => handleDefault(info.row.original)}
                    />
                </CheckWrap>
            ),
        },
        {
            accessorKey: "acciones",
            header: "",
            enableSorting: false,
            cell: (info) => (
                <BtnEdit onClick={() => onEditar(info.row.original)} title="Editar">
                    <RiEditLine />
                </BtnEdit>
            ),
        },
    ];

    const table = useReactTable({
        data: datacomprobantes,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <Container>
            <TableWrap>
                <table>
                    <thead>
                        {table.getHeaderGroups().map((hg) => (
                            <tr key={hg.id}>
                                {hg.headers.map((header) => (
                                    <th key={header.id}>
                                        <ThContent
                                            $sortable={header.column.getCanSort()}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            {header.column.columnDef.header}
                                            {header.column.getCanSort() && <FaArrowsAltV style={{ opacity: 0.5, fontSize: 11 }} />}
                                            {{ asc: " 🔼", desc: " 🔽" }[header.column.getIsSorted()] ?? ""}
                                        </ThContent>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableWrap>
            <Paginacion
                table={table}
                irinicio={() => table.setPageIndex(0)}
                pagina={table.getState().pagination.pageIndex + 1}
                maximo={table.getPageCount()}
            />
        </Container>
    );
}

const Container = styled.div`
    width: 100%;
    margin-top: 16px;
`;

const TableWrap = styled.div`
    overflow-x: auto;
    border-radius: 14px;
    border: 1px solid ${({ theme }) => theme.color2};

    table {
        width: 100%;
        border-collapse: collapse;

        thead tr {
            background: ${({ theme }) => theme.bgAlpha};
        }
        th {
            padding: 14px 16px;
            text-align: left;
            font-size: 12px;
            font-weight: 700;
            color: ${({ theme }) => theme.colorsubtitlecard};
            border-bottom: 1px solid ${({ theme }) => theme.color2};
            white-space: nowrap;
        }
        td {
            padding: 13px 16px;
            font-size: 13px;
            color: ${({ theme }) => theme.text};
            border-bottom: 1px solid ${({ theme }) => theme.color2};
        }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: ${({ theme }) => theme.bgAlpha}; }
    }
`;

const ThContent = styled.span`
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: ${({ $sortable }) => $sortable ? "pointer" : "default"};
    user-select: none;
`;

const Badge = styled.span`
    background: rgba(248, 133, 51, 0.12);
    color: #f88533;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
`;

const CheckWrap = styled.div`
    display: flex;
    align-items: center;
`;

const Checkbox = styled.input`
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #f88533;
`;

const BtnEdit = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 17px;
    display: flex;
    align-items: center;
    padding: 6px;
    border-radius: 8px;
    transition: color 0.2s, background 0.2s;

    &:hover {
        color: #f88533;
        background: rgba(248, 133, 51, 0.1);
    }
`;
