import styled from "styled-components";
import { ContentAccionesTabla, Paginacion, Checkbox1 } from "../../../index";
import { confirmar } from "../../../utils/toast";
import { v } from "../../../styles/variables";
import { useState, useMemo } from "react";
import { useProductosStore } from "../../../store/ProductosStore";
import { useUsuariosStore } from "../../../store/UsuariosStore";
import {
    flexRender, getCoreRowModel, getFilteredRowModel,
    getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { FaArrowsAltV } from "react-icons/fa";

export function TablaProductos({ data, SetopenRegistro, setdataSelect, setAccion }) {
    if (data == null) return;
    const { datausuarios } = useUsuariosStore();
    const esAdmin = datausuarios?.tipo === "administrador" || datausuarios?.tipo === "superadmin";
    const [columnFilters, setColumnFilters] = useState([]);
    const { eliminarProducto } = useProductosStore();

    function eliminar(p) {
        confirmar({
            titulo: "¿Eliminar producto?",
            texto: `Se eliminará "${p.nombre}". ¡Esta acción no se puede deshacer!`,
            onConfirmar: () => eliminarProducto({ id: p.id, id_empresa: p.id_empresa }),
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
            cell: (info) => (
                <NombreCell>
                    {info.row.original.imagen && info.row.original.imagen !== "-"
                        ? <ThumbImg src={info.row.original.imagen} alt={info.getValue()} />
                        : <ThumbPlaceholder />}
                    <span>{info.getValue()}</span>
                </NombreCell>
            ),
        },
        {
            accessorKey: "p_venta",
            header: "P. Venta",
            cell: (info) => <span>{info.getValue()}</span>,
        },
        ...(esAdmin ? [{
            accessorKey: "p_compra",
            header: "P. Compra",
            cell: (info) => <span>{info.getValue()}</span>,
        }] : []),
        {
            accessorKey: "categoria",
            header: "Categoría",
            cell: (info) => <span>{info.getValue()}</span>,
        },
        {
            accessorKey: "codigo_barra",
            header: "Cód. Barra",
            cell: (info) => <span>{info.getValue()}</span>,
        },
        {
            accessorKey: "almacenes_txt",
            header: "Almacén",
            cell: (info) => <span>{info.getValue()}</span>,
        },
        {
            accessorKey: "maneja_inventarios",
            header: "Inventarios",
            enableSorting: false,
            cell: (info) => (
                <div className="ContentCell">
                    <Checkbox1 isChecked={info.getValue()} onChange={() => {}} />
                </div>
            ),
        },
        {
            accessorKey: "acciones",
            header: "",
            enableSorting: false,
            cell: (info) => (
                <div className="ContentCell">
                    <ContentAccionesTabla
                        funcionEditar={() => editar(info.row.original)}
                        funcionEliminar={() => eliminar(info.row.original)}
                    />
                </div>
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

const NombreCell = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    text-align: left;
`;

const ThumbImg = styled.img`
    width: 34px;
    height: 34px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.1);
`;

const ThumbPlaceholder = styled.div`
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(255,255,255,0.05);
    border: 1px dashed rgba(255,255,255,0.12);
    flex-shrink: 0;
`;

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
