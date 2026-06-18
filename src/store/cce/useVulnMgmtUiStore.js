import { create } from "zustand";

const useVulnMgmtUiStore = create((set) => ({
  activeMode: "CCE",
  selectedCceAsset: null,
  selectedCveAsset: null,

  setActiveMode: (mode) => set({ activeMode: mode }),
  setSelectedCceAsset: (asset) => set({ selectedCceAsset: asset }),
  setSelectedCveAsset: (asset) => set({ selectedCveAsset: asset }),

  clearSelection: () =>
    set({ selectedCceAsset: null, selectedCveAsset: null }),
}));

export default useVulnMgmtUiStore;
