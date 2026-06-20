import { create } from "zustand";
import { EditarComprobante, MostrarComprobantes, SetDefaultComprobante } from "../index";

export const useComprobantesStore = create((set, get) => ({
    datacomprobantes: [],
    parametros: {},
    mostrarComprobantes: async (p) => {
        const data = await MostrarComprobantes(p);
        set({ datacomprobantes: data ?? [], parametros: p });
        return data;
    },
    editarComprobante: async (p) => {
        await EditarComprobante(p);
        const { mostrarComprobantes, parametros } = get();
        await mostrarComprobantes(parametros);
    },
    setDefaultComprobante: async (p) => {
        await SetDefaultComprobante(p);
        const { mostrarComprobantes, parametros } = get();
        await mostrarComprobantes(parametros);
    },
}));
