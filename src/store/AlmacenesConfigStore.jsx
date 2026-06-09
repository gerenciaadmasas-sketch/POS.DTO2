import { create } from "zustand";
import { MostrarAlmacenesPorEmpresa, InsertarAlmacen, EditarAlmacen, EliminarAlmacen } from "../index";

export const useAlmacenesConfigStore = create((set, get) => ({
    dataAlmacenes: [],

    mostrarAlmacenes: async (p) => {
        const response = await MostrarAlmacenesPorEmpresa(p);
        set({ dataAlmacenes: response ?? [] });
        return response;
    },

    insertarAlmacen: async (p) => {
        const nuevo = await InsertarAlmacen(p);
        if (nuevo) set({ dataAlmacenes: [...get().dataAlmacenes, nuevo] });
    },

    editarAlmacen: async (p) => {
        const actualizado = await EditarAlmacen(p);
        if (actualizado) {
            set({
                dataAlmacenes: get().dataAlmacenes.map(a =>
                    a.id === actualizado.id ? actualizado : a
                ),
            });
        }
    },

    eliminarAlmacen: async (p) => {
        await EliminarAlmacen(p);
        set({ dataAlmacenes: get().dataAlmacenes.filter(a => a.id !== p.id) });
    },
}));
