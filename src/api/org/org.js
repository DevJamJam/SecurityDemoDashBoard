import sedoApi from "@/lib/sedoApi";

export const fetchOrgTree = async () => {
  const res = await sedoApi.get("/org/tree");
  return res.data;
};

export const fetchOrgDeptList = async () => {
  const res = await sedoApi.get("/org/depts");
  return res.data;
};

export const fetchPublicDeptOptions = async () => {
  const res = await sedoApi.get("/org/depts/public");
  return res.data;
};

export const checkOrgDeptDuplicate = async (payload) => {
  const res = await sedoApi.post("/org/depts/check-duplicate", payload);
  return res.data;
};

export const setOrgDepartment = async (payload) => {
  const res = await sedoApi.post("/org/depts/save", payload);
  return res.data;
};

export const deleteOrgDepartment = async (payload) => {
  const res = await sedoApi.post("/org/depts/delete", payload);
  return res.data;
};

export const getDeptMembers = async (payload) => {
  const res = await sedoApi.post("/org/depts/members", payload);
  return res.data;
};

export const setUserDepartment = async (payload) => {
  const res = await sedoApi.post("/org/depts/assign-member", payload);
  return res.data;
};

export const unsetUserDepartment = async (payload) => {
  const res = await sedoApi.post("/org/depts/remove-member", payload);
  return res.data;
};

export default {
  fetchOrgTree,
  fetchOrgDeptList,
  fetchPublicDeptOptions,
  checkOrgDeptDuplicate,
  setOrgDepartment,
  deleteOrgDepartment,
  getDeptMembers,
  setUserDepartment,
  unsetUserDepartment,
};
