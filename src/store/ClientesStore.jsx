import { create } from "zustand";
import { BuscarClientes, EditarCliente, EliminarCliente, InsertarCliente, MostrarClientes } from "../index";

export const useClientesStore = create((set, get) => ({
    buscador: "",
    setBuscador: (p) => set({ buscador: p }),
    dataclientes: [],
    parametros: {},

    mostrarClientes: async (p) => {
        const response = await MostrarClientes(p);
        set({ parametros: p, dataclientes: response });
        return response;
    },

    insertarCliente: async (p) => {
        await InsertarCliente(p);
        const { mostrarClientes, parametros } = get();
        await mostrarClientes(parametros);
    },

    editarCliente: async (p) => {
        await EditarCliente(p);
        const { mostrarClientes, parametros } = get();
        await mostrarClientes(parametros);
    },

    eliminarCliente: async (p) => {
        await EliminarCliente(p);
        const { mostrarClientes, parametros } = get();
        await mostrarClientes(parametros);
    },

    buscarClientes: async (p) => {
        const response = await BuscarClientes(p);
        set({ dataclientes: response });
        return response;
    },
}));
