import { create } from "zustand";
import { MostrarSucursales } from "../index";
export const useSucursalesStore = create((set) => ({
    sucursalesItemSelect: [],
    selectSucursal: (p) => {
        set({ sucursalesItemSelect: p });
    },
    dataSucursales: [],
    mostrarSucursales: async (p) => {
        const response = await MostrarSucursales(p);
        set({ dataSucursales: response ?? [] });
        if (response?.length) set({ sucursalesItemSelect: response[0] });
        return response;
    }
}))
