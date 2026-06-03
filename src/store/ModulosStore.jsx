import {create} from "zustand";
import { MostrarModulos } from "../supabase/crudModulos";
export const useModulosStore = create((set)=>({
    dataModulos:[],
    mostrarModulos:async()=>{
        const response = await MostrarModulos()
        set({dataModulos:response})
        return response;
    }
}))
