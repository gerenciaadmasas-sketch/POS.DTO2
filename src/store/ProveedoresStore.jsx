import { create } from "zustand";
import { BuscarProveedores, EditarProveedor, EliminarProveedor, InsertarProveedor, MostrarProveedores } from "../index";

export const useProveedoresStore = create((set, get) => ({
    buscador: "",
    setBuscador: (p) => set({ buscador: p }),
    dataproveedores: [],
    parametros: {},

    mostrarProveedores: async (p) => {
        const response = await MostrarProveedores(p);
        set({ parametros: p, dataproveedores: response });
        return response;
    },

    insertarProveedor: async (p) => {
        await InsertarProveedor(p);
        const { mostrarProveedores, parametros } = get();
        await mostrarProveedores(parametros);
    },

    editarProveedor: async (p) => {
        await EditarProveedor(p);
        const { mostrarProveedores, parametros } = get();
        await mostrarProveedores(parametros);
    },

    eliminarProveedor: async (p) => {
        await EliminarProveedor(p);
        const { mostrarProveedores, parametros } = get();
        await mostrarProveedores(parametros);
    },

    buscarProveedores: async (p) => {
        const response = await BuscarProveedores(p);
        set({ dataproveedores: response });
        return response;
    },
}));
