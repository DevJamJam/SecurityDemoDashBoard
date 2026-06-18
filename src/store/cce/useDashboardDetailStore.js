import { create } from "zustand";
import sedoApi from "@/lib/sedoApi";

const initialSlot = () => ({ data: null, loading: false, error: null });

const useDashboardDetailStore = create((set, get) => ({
  alerts: {
    urgent: initialSlot(),
    confirm: initialSlot(),
    info: initialSlot(),
  },

  loadAlerts: async ({ deptId, severity }) => {
    set((s) => ({
      alerts: {
        ...s.alerts,
        [severity]: { data: null, loading: true, error: null },
      },
    }));
    try {
      const res = await sedoApi.post("/dashboard/alerts", { dept_id: deptId, severity });
      if (res.data?.RESULT === "OK") {
        set((s) => ({
          alerts: {
            ...s.alerts,
            [severity]: { data: res.data.CODE, loading: false, error: null },
          },
        }));
      } else {
        throw new Error("응답이 올바르지 않습니다.");
      }
    } catch (err) {
      set((s) => ({
        alerts: {
          ...s.alerts,
          [severity]: { data: null, loading: false, error: err.message },
        },
      }));
    }
  },

  loadPendingSummary: async (deptId) => {
    const res = await sedoApi.post("/dashboard/pending/summary", { dept_id: deptId });
    if (res.data?.RESULT === "OK") return res.data.CODE;
    throw new Error("승인/조치대기 요약 조회 실패");
  },

  loadPendingAssets: async ({ deptId, vulnType, stepKey }) => {
    const res = await sedoApi.post("/dashboard/pending/assets", {
      dept_id: deptId,
      vuln_type: vulnType,
      step_key: stepKey,
    });
    if (res.data?.RESULT === "OK") return res.data.CODE;
    throw new Error("승인/조치대기 자산 조회 실패");
  },

  loadCommandFailures: async (deptId) => {
    const res = await sedoApi.post("/dashboard/command-failures", { dept_id: deptId });
    if (res.data?.RESULT === "OK") return res.data.CODE;
    throw new Error("명령 실패 자산 조회 실패");
  },

  loadActiveInspections: async (deptId) => {
    const [cceRes, cveRes] = await Promise.all([
      sedoApi.post("/dashboard/inspections/cce", { dept_id: deptId }),
      sedoApi.post("/dashboard/inspections/cve", { dept_id: deptId }),
    ]);
    const cce = cceRes.data?.RESULT === "OK" ? cceRes.data.CODE : [];
    const cve = cveRes.data?.RESULT === "OK" ? cveRes.data.CODE : [];
    return { cce, cve };
  },

  loadUncheckedSummary: async (deptId) => {
    const res = await sedoApi.post("/dashboard/unchecked/summary", { dept_id: deptId });
    if (res.data?.RESULT === "OK") return res.data.CODE;
    throw new Error("미점검 자산 요약 조회 실패");
  },

  loadUncheckedAssets: async ({ deptId, category }) => {
    const res = await sedoApi.post("/dashboard/unchecked/assets", {
      dept_id: deptId,
      category,
    });
    if (res.data?.RESULT === "OK") return res.data.CODE;
    throw new Error("미점검 자산 조회 실패");
  },

  loadTrendStepAssets: async ({ deptId, vulnType, month, stepKey }) => {
    const res = await sedoApi.post("/dashboard/trend/assets", {
      dept_id: deptId,
      vuln_type: vulnType,
      month,
      step_key: stepKey,
    });
    if (res.data?.RESULT === "OK") return res.data.CODE;
    throw new Error("운영 추이 자산 조회 실패");
  },

  loadRemediationHistory: async ({ vulnType, astUuid, cccIndex, assUuid, cveId }) => {
    const res = await sedoApi.post("/dashboard/remediation-history", {
      vuln_type: vulnType,
      ast_uuid: astUuid,
      ccc_index: cccIndex,
      ass_uuid: assUuid,
      cve_id: cveId,
    });
    if (res.data?.RESULT === "OK") return res.data.CODE;
    throw new Error("조치 이력 조회 실패");
  },
}));

export default useDashboardDetailStore;
