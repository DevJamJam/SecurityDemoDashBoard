import { create } from "zustand";
import { clientFeatures } from "@/config/clientFeatures";

const getDefaultTab = () => {
  if (clientFeatures.enableAssets) return "assets";
  if (clientFeatures.enableCce) return "cce";
  if (clientFeatures.enableDashboard) return "dashboard";
  if (clientFeatures.enableCve) return "cve";
  if (clientFeatures.enableCommand) return "command";
  return null;
};

export const useMainTabStore = create((set) => ({
  tab: getDefaultTab(),
  setTab: (tab) => set({ tab }),
  resetTab: () => set({ tab: "assets" }),
}));
