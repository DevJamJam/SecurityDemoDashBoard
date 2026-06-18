import { create } from "zustand";
import {
  getInspectionPlans,
  getInspectionPlanDetail,
} from "@/api/securityDemoApi";

const useInspectionPlanStore = create((set) => ({
  plans: [],
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
  filters: {
    title: "",
    targetGroup: "",
    status: "",
    inspectionType: "",
  },
  sortKey: "",
  sortDir: "asc",
  loading: false,
  error: null,

  detail: null,
  detailLoading: false,
  detailError: null,

  setFilters: (filters) => set({ filters, currentPage: 1 }),

  setPage: (page) => set({ currentPage: page }),

  setSort: (key, dir) => set({ sortKey: key, sortDir: dir }),

  fetchPlans: async () => {
    const { filters, currentPage, pageSize, sortKey, sortDir } =
      useInspectionPlanStore.getState();
    set({ loading: true, error: null });
    try {
      const res = await getInspectionPlans({
        ...filters,
        page: currentPage,
        pageSize,
        sortKey,
        sortDir,
      });
      set({ plans: res.data.items, totalCount: res.data.total, loading: false });
    } catch {
      set({ error: "점검계획 목록을 불러오지 못했습니다.", loading: false });
    }
  },

  fetchPlanDetail: async (id) => {
    set({ detailLoading: true, detailError: null, detail: null });
    try {
      const res = await getInspectionPlanDetail(id);
      set({ detail: res.data, detailLoading: false });
    } catch {
      set({ detailError: "상세 정보를 불러오지 못했습니다.", detailLoading: false });
    }
  },

  resetDetail: () => set({ detail: null, detailError: null }),
}));

export default useInspectionPlanStore;
