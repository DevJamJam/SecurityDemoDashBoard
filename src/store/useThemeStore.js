import { create } from "zustand";

const getInitialTheme = () => {
  const saved = localStorage.getItem("sedo-theme");
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme) => {
  document.body.classList.toggle("dark", theme === "dark");
  localStorage.setItem("sedo-theme", theme);
};

const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),

  initTheme: () => {
    const theme = get().theme;
    applyTheme(theme);
  },

  toggleTheme: () => {
    const next = get().theme === "light" ? "dark" : "light";
    applyTheme(next);
    set({ theme: next });
  },
}));

export default useThemeStore;
