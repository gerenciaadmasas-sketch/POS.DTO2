import { create } from "zustand";
import { Dark, Light } from "../styles/themes";

export const useThemeStore = create((set, get) => ({
  theme: "light",
  themeStyle: Light,
  setTheme: () => {
    const { theme } = get();
    const nextTheme = theme === "light" ? "dark" : "light";
    set({ 
      theme: nextTheme, 
      themeStyle: nextTheme === "light" ? Light : Dark 
    });
  },
}));