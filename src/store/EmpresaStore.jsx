import { create } from "zustand";
import { InsertarEmpresa, MostrarEmpresaXidusuario, EditarEmpresa } from "../index";

export const useEmpresaStore = create((set) => ({
    dataempresa: [],
    mostrarempresa: async (p) => {
        const response = await MostrarEmpresaXidusuario(p);
        set({ dataempresa: response });
        return response;
    },
    insertarempresa: async (p) => {
        const response = await InsertarEmpresa(p);
        return response;
    },
    editarempresa: async (p) => {
        const response = await EditarEmpresa(p);
        if (response) set({ dataempresa: response });
        return response;
    },
}));
