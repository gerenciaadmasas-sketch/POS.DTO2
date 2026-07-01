import { create } from "zustand";
import { BuscarCategorias, EditarCategoria, EliminarCategoria, InsertarCategorias, MostrarCategorias } from "../index";

export const useCategoriasStore = create((set, get) => ({
    buscador: "",
    setBuscador: (p) => {
        set({ buscador: p });
    },
    datacategorias: [],
    categoriasItemSelect: [],
    parametros: {},
    mostrarCategorias: async (p) => {
        const response = await MostrarCategorias(p)
        set({ parametros: p })
        set({ datacategorias: response })
        set({ categoriasItemSelect: response[0] })
        return response;
    },
    selectCategoria: (p) => {
        set({ categoriasItemSelect: p })
    },
    insertarCategorias: async (p) => {
        await InsertarCategorias(p);
        const { mostrarCategorias, parametros } = get();
        await mostrarCategorias(parametros);
    },
    eliminarCategoria: async (p) => {
        await EliminarCategoria(p);
        const { mostrarCategorias, parametros } = get();
        await mostrarCategorias(parametros);
    },
    editarCategoria: async (p) => {
        await EditarCategoria(p);
        const { mostrarCategorias, parametros } = get();
        await mostrarCategorias(parametros);
    },
    buscarCategorias: async (p) => {
        const response = await BuscarCategorias(p)
        set({ datacategorias: response });
        return response;
    },
}));