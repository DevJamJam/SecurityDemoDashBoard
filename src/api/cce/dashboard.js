import sedoApi from "@/lib/sedoApi";

export const getOrgDashboard = async (deptId = null) => {
  const payload = deptId != null ? { dept_id: deptId } : {};
  const res = await sedoApi.post("/dashboard", payload);
  return res;
};
