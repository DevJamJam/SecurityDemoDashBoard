import sedoApi from "@/lib/sedoApi";

const normDeptId = (deptId) =>
  deptId === null || deptId === undefined ? "" : deptId;

export const getDashboardHighRiskSummary = async (deptId) => {
  const res = await sedoApi.post("/dashboard/high-risk/summary", {
    dept_id: normDeptId(deptId),
  });
  return res;
};

export const getDashboardPendingSummary = async (deptId) => {
  const res = await sedoApi.post("/dashboard/pending/summary", { dept_id: normDeptId(deptId) });
  return res;
};

export const getDashboardPendingAssets = async ({ deptId, vulnType, stepKey }) => {
  const res = await sedoApi.post("/dashboard/pending/assets", {
    dept_id: normDeptId(deptId),
    vuln_type: vulnType,
    step_key: stepKey,
  });
  return res;
};

export const getDashboardCommandFailureAssets = async (deptId) => {
  const res = await sedoApi.post("/dashboard/command-failures", { dept_id: normDeptId(deptId) });
  return res;
};

export const getDashboardActiveCcePlans = async (deptId) => {
  const res = await sedoApi.post("/dashboard/inspections/cce", { dept_id: normDeptId(deptId) });
  return res;
};

export const getDashboardActiveCveScans = async (deptId) => {
  const res = await sedoApi.post("/dashboard/inspections/cve", { dept_id: normDeptId(deptId) });
  return res;
};

export const getDashboardUncheckedSummary = async (deptId) => {
  const res = await sedoApi.post("/dashboard/unchecked/summary", { dept_id: normDeptId(deptId) });
  return res;
};

export const getDashboardUncheckedAssets = async ({ deptId, category }) => {
  const res = await sedoApi.post("/dashboard/unchecked/assets", {
    dept_id: normDeptId(deptId),
    category,
  });
  return res;
};

export const getDashboardManagedAssets = async (deptId) => {
  const res = await sedoApi.post("/dashboard/assets", { dept_id: normDeptId(deptId) });
  return res;
};

export const getDashboardAssetIssues = async ({ assetUuid, type = "all" }) => {
  const res = await sedoApi.post("/dashboard/asset-issues", {
    asset_uuid: assetUuid,
    type,
  });
  return res;
};

export const getDashboardVulnerabilityDetail = async ({ type, vulnId, deptId }) => {
  const res = await sedoApi.post("/dashboard/vulnerability-detail", {
    type,
    vuln_id: vulnId,
    dept_id: normDeptId(deptId),
  });
  return res;
};

export const getDashboardTicketsByStatus = async ({ deptId, status }) => {
  const res = await sedoApi.post("/dashboard/tickets", {
    dept_id: normDeptId(deptId),
    status,
  });
  return res;
};
