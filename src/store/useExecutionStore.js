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
        if (override) {
          return { ...job, ...override };
        }
        return job;
      });

      set({ jobs: items, totalCount: res.data.total, loading: false });
    } catch {
      set({ error: "실행 목록을 불러오지 못했습니다.", loading: false });
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
