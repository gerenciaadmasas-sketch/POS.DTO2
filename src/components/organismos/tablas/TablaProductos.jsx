import styled from "styled-components";
import { ContentAccionesTabla, Paginacion } from "../../../index";
import Swal from "sweetalert2";
import { v } from "../../../styles/variables";
import { useState } from "react";
import { useProductosStore } from "../../../store/ProductosStore";
import {
    flexRender, getCoreRowModel, getFilteredRowModel,
    getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { FaArrowsAltV } from "react-icons/fa";

export function TablaProductos({ data, SetopenRegistro, setdataSelect, setAccion }) {
    if (data == null) return;
    const [columnFilters, setColumnFilters] = useState([]);
    const { eliminarProducto } = useProductosStore();

    function eliminar(p) {
        Swal.fire({
            title: "¿Estás seguro(a)(e)?",
            text: "Una vez eliminado, ¡no podrá recuperar este registro!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si, eliminar",
        }).then(async (result) => {
            if (result.isConfirmed) {
                await eliminarProducto({ id: p.id });
            }
        });
    }

    function editar(p) {
        SetopenRegistro(true);
        setdataSelect(p);
        setAccion("Editar");
    }

    const columns = [
        {
            accessorKey: "nombre",
            header: "Nombre",
            cell: (info) => <span>{info.getValue()}</span>,
        },
        {
            accessorKey: "precio_venta",
            header: "P. Venta",
            cell: (info) => <span>{info.getValue()}</span>,
        },
        {
            accessorKey: "precio_compra",
            header: "P. Compra",
            cell: (info) => <span>{info.getValue()}</span>,
        },
        {
            accessorKey: "codigo_barra",
            header: "Cód. Barra",
            cell: (info) => <span>{info.getValue()}</span>,
        },
        {
            accessorKey: "sevende_por",
            header: "Vende por",
            cell: (info) => <span>{info.getValue()}</span>,
        },
        {
            accessorKey: "acciones",
            header: "",
            enableSorting: false,
            cell: (info) => (
                <td data-title="Acciones" className="ContentCell">
                    <ContentAccionesTabla
                        funcionEditar={() => editar(info.row.original)}
                        funcionEliminar={() => eliminar(info.row.original)}
                    />
                </td>
            ),
        },
    ];

    const table = useReactTable({
        data,
        columns,
        state: { columnFilters },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        columnResizeMode: "onChange",
    });

    return (
        <Container>
            <table className="responsive-table">
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th key={header.id}>
                                    {header.column.columnDef.header}
                                    {header.column.getCanSort() && (
                                        <span style={{ cursor: "pointer" }}
                                            onClick={header.column.getToggleSortingHandler()}>
                                            <FaArrowsAltV />
                                        </span>
                                    )}
                                    {{ asc: " 🔼", desc: " 🔽" }[header.column.getIsSorted()]}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((item) => (
                        <tr key={item.id}>
                            {item.getVisibleCells().map((cell) => (
                                <td key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
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
    position: relative;
    margin: 2%;
    .responsive-table {
        width: 100%;
        margin-bottom: 1.5em;
        border-spacing: 0;
        font-size: 0.9em;
        thead {
            th {
                border-bottom: 2px solid ${({ theme }) => theme.color2};
                font-weight: 700;
                text-align: center;
                color: ${({ theme }) => theme.text};
                padding: 0.5em;
            }
        }
        tbody {
            tr { border-bottom: 1px solid rgba(161,161,161,0.2); }
            td {
                text-align: center;
                padding: 0.5em;
                vertical-align: middle;
            }
            .ContentCell {
                display: flex;
                justify-content: center;
                align-items: center;
            }
        }
    }
`;
