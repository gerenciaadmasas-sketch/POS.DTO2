import { create } from "zustand";
import { supabase } from "../supabase/supabase.config";
import { QueryClient } from "@tanstack/react-query";

export const useAuthStore = create((set) => ({
    loginEmail: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        return data;
    },
    cerrarSesion: async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/login";
    },
}));
