import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLayoutStore = create(
  persist(
    (set) => ({
      isSideCollapsed: false,
      toggleSideCollapsed: () =>
        set((s) => ({ isSideCollapsed: !s.isSideCollapsed })),
      setSideCollapsed: (value) => set({ isSideCollapsed: !!value }),
    }),
    {
      name: "sedo-layout",
      storage: {
        getItem: (name) => sessionStorage.getItem(name),
        setItem: (name, value) => sessionStorage.setItem(name, value),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    }
  )
);

export default useLayoutStore;
