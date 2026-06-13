import { create } from "zustand";
import { Dark, Light } from "../styles/themes";

/* Roles que siempre usan el tema oscuro — no pueden cambiarlo */
export const ROLES_DARK = ["superadmin", "administrador", "supervisor"];

export const useThemeStore = create((set, get) => ({
  theme: "dark",
  themeStyle: Dark,

  /* Forzar tema según rol — llamar al cargar el usuario */
  applyRoleTheme: (tipo) => {
    if (ROLES_DARK.includes(tipo)) {
      set({ theme: "dark", themeStyle: Dark });
    }
  },

  /* Toggle solo disponible para cajero */
  setTheme: (tipo) => {
    if (ROLES_DARK.includes(tipo)) return; // bloqueado
    const { theme } = get();
    const next = theme === "light" ? "dark" : "light";
    set({ theme: next, themeStyle: next === "light" ? Light : Dark });
  },
}));
