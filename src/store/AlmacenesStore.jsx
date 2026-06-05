import { create } from "zustand";
import {
    InsertarStockAlmacen,
    MostrarStockAlmacen,
    MostrarStockAlmacenXSucursal,
    EditarStockAlmacen,
    EliminarStockAlmacen,
} from "../index";

export const useAlmacenesStore = create((set) => ({
    dataalmacen: [],
    mostrarAlmacen: async (p) => {
        const response = await MostrarStockAlmacenXSucursal(p);
        set({ dataalmacen: response });
        return response;
    },
    mostrarAlmacenXProducto: async (p) => {
        const response = await MostrarStockAlmacen(p);
        set({ dataalmacen: response });
        return response;
    },
    insertarStockAlmacenes: async (p) => {
        await InsertarStockAlmacen(p);
    },
    editarStockAlmacenes: async (p) => {
        await EditarStockAlmacen(p);
    },
    eliminarStockAlmacenes: async (p) => {
        await EliminarStockAlmacen(p);
    },
}));
