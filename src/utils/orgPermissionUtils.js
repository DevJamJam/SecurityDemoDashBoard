export const hasAssignedDept = (user) => {
  return !!(user?.my_dept_id && user.my_dept_id.length > 0);
};

export const getPreferredDeptId = (user) => {
  if (!user?.my_dept_id?.length) return null;
  return String(user.my_dept_id[0]);
};

export const normalizeManageableDeptIds = (ids) => {
  if (!ids) return [];
  return (Array.isArray(ids) ? ids : [ids]).map(String);
};

export const isManageableDeptNode = ({ deptNode, manageableDeptIds, orgNodeMap, isAdmin }) => {
  if (isAdmin) return true;
  if (!deptNode?.id) return false;
  return manageableDeptIds.includes(String(deptNode.id));
};
