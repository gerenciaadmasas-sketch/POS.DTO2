import { create } from "zustand";
import { persist } from "zustand/middleware";
import { InsertarEmpresa, MostrarEmpresaXidusuario, EditarEmpresa } from "../index";

export const useEmpresaStore = create(
    persist(
        (set) => ({
            dataempresa: null,
            setEmpresa: (data) => set({ dataempresa: data }),
            mostrarempresa: async (p) => {
                const response = await MostrarEmpresaXidusuario(p);
                if (response) set({ dataempresa: response });
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
        }),
        {
            name: "pos-empresa",
        }
    )
);
