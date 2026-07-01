import { create } from "zustand";
import { BuscarProductos, EditarProducto, EliminarProducto, InsertarProducto, MostrarProductos } from "../index";
import { Generarcodigo } from "../hooks/Generarcodigo";

export const useProductosStore = create((set, get) => ({
    buscador: "",
    setBuscador: (p) => {
        set({ buscador: p });
    },
    dataproductos: [],
    productoItemSelect: [],
    parametros: {},
    codigogenerado: "",
    mostrarProductos: async (p) => {
        const response = await MostrarProductos(p);
        set({ parametros: p });
        set({ dataproductos: response });
        set({ productoItemSelect: response?.[0] });
        return response;
    },
    selectProducto: (p) => {
        set({ productoItemSelect: p });
    },
    insertarProducto: async (p) => {
        const id = await InsertarProducto(p);
        const { mostrarProductos, parametros } = get();
        await mostrarProductos(parametros);
        return id;
    },
    eliminarProducto: async (p) => {
        await EliminarProducto(p);
        const { mostrarProductos, parametros } = get();
        await mostrarProductos(parametros);
    },
    editarProducto: async (p) => {
        await EditarProducto(p);
        const { mostrarProductos, parametros } = get();
        await mostrarProductos(parametros);
    },
    buscarProductos: async (p) => {
        const response = await BuscarProductos(p);
        set({ dataproductos: response });
        return response;
    },
    generarCodigo: () => {
        const { dataproductos } = get();
        const ultimoId = dataproductos?.[0]?.id ?? 0;
        const response = Generarcodigo({ id: ultimoId });
        set({ codigogenerado: response });
        return response;
    },
}));
