import { create } from "zustand";
import {
  getNetworkSegments,
  getNetworkSegmentDetail,
  updateNetworkSegment,
} from "@/api/securityDemoApi";

const useNetworkSegmentStore = create((set, get) => ({
  segments: [],
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
  loading: false,
  error: null,

  selectedSegment: null,
  selectedLoading: false,

  fetchSegments: async () => {
    const { currentPage, pageSize } = get();
    set({ loading: true, error: null });
    try {
      const res = await getNetworkSegments({ page: currentPage, pageSize });
      set({ segments: res.data.items, totalCount: res.data.total, loading: false });
    } catch {
      set({ error: "네트워크 세그먼트를 불러오지 못했습니다.", loading: false });
    }
  },

  fetchSegmentDetail: async (id) => {
    set({ selectedLoading: true });
    try {
      const res = await getNetworkSegmentDetail(id);
      set({ selectedSegment: res.data, selectedLoading: false });
    } catch {
      set({ selectedLoading: false });
    }
  },

  updateSegment: async (id, payload) => {
    const res = await updateNetworkSegment(id, payload);
    set((state) => ({
      segments: state.segments.map((s) =>
        s.id === id ? { ...s, ...res.data } : s
      ),
    }));
    return res.data;
  },

  setPage: (page) => set({ currentPage: page }),
}));

export default useNetworkSegmentStore;
