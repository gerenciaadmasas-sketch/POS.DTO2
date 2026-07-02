import { create } from "zustand";
import { Dark } from "../styles/themes";

export const useThemeStore = create(() => ({
  theme: "dark",
  themeStyle: Dark,
}));
