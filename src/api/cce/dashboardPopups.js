import sedoApi from "@/lib/sedoApi";

export const getDashboardPendingSummary = async (deptId) => {
  const res = await sedoApi.post("/dashboard/pending/summary", { dept_id: deptId });
  return res;
};

export const getDashboardPendingAssets = async ({ deptId, vulnType, stepKey }) => {
  const res = await sedoApi.post("/dashboard/pending/assets", {
    dept_id: deptId,
    vuln_type: vulnType,
    step_key: stepKey,
  });
  return res;
};

export const getDashboardCommandFailureAssets = async (deptId) => {
  const res = await sedoApi.post("/dashboard/command-failures", { dept_id: deptId });
  return res;
};

export const getDashboardActiveCcePlans = async (deptId) => {
  const res = await sedoApi.post("/dashboard/inspections/cce", { dept_id: deptId });
  return res;
};

export const getDashboardActiveCveScans = async (deptId) => {
  const res = await sedoApi.post("/dashboard/inspections/cve", { dept_id: deptId });
  return res;
};

export const getDashboardUncheckedSummary = async (deptId) => {
  const res = await sedoApi.post("/dashboard/unchecked/summary", { dept_id: deptId });
  return res;
};

export const getDashboardUncheckedAssets = async ({ deptId, category }) => {
  const res = await sedoApi.post("/dashboard/unchecked/assets", {
    dept_id: deptId,
    category,
  });
  return res;
};
