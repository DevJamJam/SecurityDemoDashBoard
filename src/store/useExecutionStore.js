import { create } from "zustand";
import {
  getExecutionJobs,
  getExecutionJobDetail,
  startExecutionJob,
  updateExecutionJobStatus,
} from "@/api/securityDemoApi";

const STORAGE_KEY = "sedo-execution-states";

const loadPersistedStates = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persistStates = (states) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
};

const useExecutionStore = create((set, get) => ({
  jobs: [],
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
  loading: false,
  error: null,

  selectedJob: null,
  selectedLoading: false,

  persistedStates: loadPersistedStates(),

  fetchJobs: async () => {
    const { currentPage, pageSize } = get();
    set({ loading: true, error: null });
    try {
      const res = await getExecutionJobs({ page: currentPage, pageSize });
      const persisted = get().persistedStates;
      const items = res.data.items.map((job) => {
        const override = persisted[job.id];
        return override ? { ...job, ...override } : job;
      });
      set({ jobs: items, totalCount: res.data.total, loading: false });
    } catch {
      set({ error: "실행 목록을 불러오지 못했습니다.", loading: false });
    }
  },

  // 백그라운드 polling 전용 — loading 상태를 바꾸지 않아 UI 깜빡임 없음
  // persisted override는 사용자가 직접 바꾼 status에만 적용, running 진행률은 API 값 우선
  silentPoll: async () => {
    const { currentPage, pageSize } = get();
    try {
      const res = await getExecutionJobs({ page: currentPage, pageSize });
      const persisted = get().persistedStates;
      const items = res.data.items.map((job) => {
        const override = persisted[job.id];
        if (override?.status && override.status !== "running") {
          return { ...job, ...override };
        }
        return job;
      });
      set({ jobs: items, totalCount: res.data.total });
    } catch {
      // 백그라운드 실패는 무시 — 현재 표시 중인 데이터 유지
    }
  },

  fetchJobDetail: async (id) => {
    set({ selectedLoading: true });
    try {
      const res = await getExecutionJobDetail(id);
      const persisted = get().persistedStates[id];
      set({
        selectedJob: persisted ? { ...res.data, ...persisted } : res.data,
        selectedLoading: false,
      });
    } catch {
      set({ selectedLoading: false });
    }
  },

  startJob: async (payload) => {
    const res = await startExecutionJob(payload);
    await get().fetchJobs();
    return res.data;
  },

  updateStatus: async (id, payload) => {
    await updateExecutionJobStatus(id, payload);

    const persisted = { ...get().persistedStates };
    persisted[id] = { ...persisted[id], ...payload, updatedAt: new Date().toISOString() };
    persistStates(persisted);

    set((state) => ({
      persistedStates: persisted,
      jobs: state.jobs.map((j) =>
        j.id === id ? { ...j, ...payload } : j
      ),
    }));
  },

  clearPersistedStates: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ persistedStates: {} });
  },

  setPage: (page) => set({ currentPage: page }),
}));

export default useExecutionStore;
