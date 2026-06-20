import { create } from "zustand";
import { GuardarTicketConfig, MostrarTicketConfig, SubirLogoTicket } from "../supabase/crudTicketConfig";

export const useTicketConfigStore = create((set, get) => ({
    ticketConfig: null,
    mostrarTicketConfig: async (p) => {
        const data = await MostrarTicketConfig(p);
        set({ ticketConfig: data });
        return data;
    },
    guardarTicketConfig: async (p) => {
        await GuardarTicketConfig(p);
        const data = await MostrarTicketConfig({ id_empresa: p.id_empresa });
        set({ ticketConfig: data });
    },
    subirLogoTicket: async (p) => {
        const url = await SubirLogoTicket(p);
        return url;
    },
}));
