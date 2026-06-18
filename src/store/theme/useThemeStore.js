import { create } from "zustand";

export const useThemeStore = create((set) => ({
  isDark: false,
  toggleTheme: () =>
    set((state) => {
      const newTheme = !state.isDark;
      document.body.classList.toggle("dark", newTheme);
      return { isDark: newTheme };
    }),
}));
