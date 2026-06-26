import { create } from "zustand";
import { Dark, Light } from "../styles/themes";

export const useThemeStore = create((set, get) => ({
  theme: "dark",
  themeStyle: Dark,

  setTheme: () => {
    const { theme } = get();
    const next = theme === "light" ? "dark" : "light";
    set({ theme: next, themeStyle: next === "light" ? Light : Dark });
  },
}));
