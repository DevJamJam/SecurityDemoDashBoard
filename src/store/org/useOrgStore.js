import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchOrgTree } from "@/api/org/org";

function createSessionStorage() {
  return {
    getItem: (name) => sessionStorage.getItem(name),
    setItem: (name, value) => sessionStorage.setItem(name, value),
    removeItem: (name) => sessionStorage.removeItem(name),
  };
}

function normalizeOrgTreeResponse(payload) {
  if (Array.isArray(payload?.CODE)) return payload.CODE;
  if (Array.isArray(payload?.data?.groups)) return payload.data.groups;
  if (Array.isArray(payload?.data?.tree)) return payload.data.tree;
  return [];
}

function mapTreeNodes(nodes = []) {
  return nodes.map((node) => ({
    id: String(node.dept_id),
    name: node.dept_name,
    clickable: true,
    disabled: node.is_active === false,
    deptCode: node.dept_code,
    deptLevel: node.dept_level,
    deptOrder: node.dept_order,
    parentId:
      node.parent_id === null || node.parent_id === undefined
        ? null
        : String(node.parent_id),
    isActive: node.is_active !== false,
    memberCount: node.member_count,
    assetCount: node.asset_count,
    leader: node.dept_leader,
    children: mapTreeNodes(node.children || []),
  }));
}

function findFirstNodeId(nodes = []) {
  for (const node of nodes) {
    if (node?.id != null) return String(node.id);
    const childId = findFirstNodeId(node.children || []);
    if (childId != null) return String(childId);
  }
  return null;
}

function buildFlatMap(nodes = [], acc = {}) {
  nodes.forEach((node) => {
    acc[String(node.id)] = node;
    buildFlatMap(node.children || [], acc);
  });
  return acc;
}

const normalizeSelectedDeptId = (deptId) => {
  if (deptId === null || deptId === undefined || deptId === "") return null;
  return String(deptId);
};

const useOrgStore = create(
  persist(
    (set, get) => ({
      orgTree: [],
      orgTreeNodes: [],
      orgNodeMap: {},
      selectedDeptId: null,
      orgTreeLoading: false,
      orgTreeError: null,
      hasFetchedOrgTree: false,

      fetchOrgTree: async ({ force = false, preferredDeptId = null } = {}) => {
        const { hasFetchedOrgTree, orgTreeLoading } = get();

        if (!force && (hasFetchedOrgTree || orgTreeLoading)) {
          return {
            success: true,
            data: get().orgTree,
          };
        }

        set({ orgTreeLoading: true, orgTreeError: null });

        try {
          const res = await fetchOrgTree();
          const rawTree = normalizeOrgTreeResponse(res);
          const mappedNodes = mapTreeNodes(rawTree);
          const nodeMap = buildFlatMap(mappedNodes);
          const currentSelectedDeptId = normalizeSelectedDeptId(
            get().selectedDeptId,
          );
          const normalizedPreferred = normalizeSelectedDeptId(preferredDeptId);

          let nextSelectedDeptId;
          if (currentSelectedDeptId && nodeMap[currentSelectedDeptId]) {
            nextSelectedDeptId = currentSelectedDeptId;
          } else if (normalizedPreferred && nodeMap[normalizedPreferred]) {
            nextSelectedDeptId = normalizedPreferred;
          } else {
            nextSelectedDeptId = findFirstNodeId(mappedNodes);
          }

          set({
            orgTree: rawTree,
            orgTreeNodes: mappedNodes,
            orgNodeMap: nodeMap,
            selectedDeptId: nextSelectedDeptId,
            orgTreeLoading: false,
            orgTreeError: null,
            hasFetchedOrgTree: true,
          });

          return { success: true, data: rawTree };
        } catch (error) {
          const errorMessage =
            error?.response?.data?.CODE ||
            error?.message ||
            "조직도 정보를 불러오지 못했습니다.";

          set({
            orgTreeLoading: false,
            orgTreeError: errorMessage,
            hasFetchedOrgTree: true,
          });

          return { success: false, error: errorMessage };
        }
      },

      setSelectedDeptId: (deptId) =>
        set({ selectedDeptId: normalizeSelectedDeptId(deptId) }),

      clearOrgStore: () =>
        set({
          orgTree: [],
          orgTreeNodes: [],
          orgNodeMap: {},
          selectedDeptId: null,
          orgTreeLoading: false,
          orgTreeError: null,
          hasFetchedOrgTree: false,
        }),
    }),
    {
      name: "sedo-org-store",
      storage: createSessionStorage(),
      partialize: (state) => ({
        orgTree: state.orgTree,
        orgTreeNodes: state.orgTreeNodes,
        orgNodeMap: state.orgNodeMap,
        selectedDeptId: state.selectedDeptId,
        hasFetchedOrgTree: state.hasFetchedOrgTree,
      }),
    },
  ),
);

export default useOrgStore;
