import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/store/auth/useAuthStore";
import useOrgStore from "@/store/org/useOrgStore";
import AdminOrgTreeDesign4 from "@/components/dashboard/AdminOrgTreeDesign4";
import Button from "@/components/common/Button";
import {
  getPreferredDeptId,
  hasAssignedDept,
  isManageableDeptNode,
  normalizeManageableDeptIds,
} from "@/utils/orgPermissionUtils";

function OrgTreeEmptyState({ canAccessOrgManage, onMoveToOrgSettings }) {
  return (
    <div className="admin-org-tree-empty-state">
      <div className="admin-org-tree-empty-state__icon">🏢</div>
      <strong>등록된 조직이 없습니다.</strong>
      <p>조직 정보를 먼저 등록한 뒤 실제 조직도를 기준으로 화면을 구성할 수 있습니다.</p>
      {canAccessOrgManage && (
        <Button variant="coloroutGray" onClick={onMoveToOrgSettings}>
          조직 생성/관리 이동
        </Button>
      )}
    </div>
  );
}

export default function RealOrgTreePanel() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 1;
  const canAccessOrgManage = isAdmin;
  const hasAssignedDepartment = hasAssignedDept(user);
  const preferredDeptId = getPreferredDeptId(user);

  const manageableDeptIds = useMemo(
    () => normalizeManageableDeptIds(user?.manageable_dept_ids),
    [user?.manageable_dept_ids],
  );

  const orgTreeNodes = useOrgStore((state) => state.orgTreeNodes);
  const orgNodeMap = useOrgStore((state) => state.orgNodeMap);
  const selectedDeptId = useOrgStore((state) => state.selectedDeptId);
  const orgTreeLoading = useOrgStore((state) => state.orgTreeLoading);
  const orgTreeError = useOrgStore((state) => state.orgTreeError);
  const hasFetchedOrgTree = useOrgStore((state) => state.hasFetchedOrgTree);
  const fetchOrgTree = useOrgStore((state) => state.fetchOrgTree);
  const setSelectedDeptId = useOrgStore((state) => state.setSelectedDeptId);

  useEffect(() => {
    if (!hasFetchedOrgTree) {
      fetchOrgTree({ preferredDeptId });
    }
  }, [fetchOrgTree, hasFetchedOrgTree, preferredDeptId]);

  const hasInitializedSelection = useRef(false);

  useEffect(() => {
    if (hasInitializedSelection.current) return;
    if (!orgTreeNodes.length) return;
    if (!preferredDeptId) return;
    if (!orgNodeMap[preferredDeptId]) return;

    if (selectedDeptId && orgNodeMap[selectedDeptId]) {
      hasInitializedSelection.current = true;
      return;
    }

    hasInitializedSelection.current = true;
    setSelectedDeptId(preferredDeptId);
  }, [orgTreeNodes, preferredDeptId, orgNodeMap, selectedDeptId, setSelectedDeptId]);

  const handleMoveToOrgSettings = () => navigate("/sedo/set/org");

  const isSelectableNode = (node) => {
    if (isAdmin) return true;
    return isManageableDeptNode({ deptNode: node, manageableDeptIds, orgNodeMap, isAdmin: false });
  };

  return (
    <div className="admin-org-tree4 admin-org-tree4--real">
      <div className="admin-panel__header admin-panel__header--tree admin-panel__header--row admin-org-tree4__header-row">
        <div className="admin-panel__header-text">
          <h3>조직도</h3>
        </div>
        <div className="admin-org-tree4__header-actions">
          <button type="button" className="admin-inline-link-btn admin-inline-link-btn--sm" onClick={() => fetchOrgTree({ force: true })}>
            새로고침
          </button>
        </div>
      </div>

      {orgTreeLoading && !orgTreeNodes.length && (
        <div className="admin-org-tree-state admin-org-tree-state--loading">조직 정보를 불러오는 중입니다.</div>
      )}

      {!orgTreeLoading && orgTreeError && (
        <div className="admin-org-tree-state admin-org-tree-state--error">
          <strong>조직도 조회 중 문제가 발생했습니다.</strong>
          <p>{orgTreeError}</p>
          <button type="button" className="admin-inline-link-btn admin-inline-link-btn--sm" onClick={() => fetchOrgTree({ force: true })}>
            다시 시도
          </button>
        </div>
      )}

      {!orgTreeLoading && !orgTreeError && !orgTreeNodes.length && (
        <OrgTreeEmptyState canAccessOrgManage={canAccessOrgManage} onMoveToOrgSettings={handleMoveToOrgSettings} />
      )}

      {!orgTreeLoading && !orgTreeError && orgTreeNodes.length > 0 && (
        <>
          <div className={`admin-org-tree4__content ${!hasAssignedDepartment && !isAdmin ? "is-blurred" : ""}`}>
            <AdminOrgTreeDesign4
              tree={orgTreeNodes}
              selectedNodeId={selectedDeptId}
              onSelectNode={(nodeId) => {
                const targetNode = orgNodeMap[nodeId];
                if (!targetNode) return;
                if (!isSelectableNode(targetNode)) return;
                setSelectedDeptId(nodeId);
              }}
              getIsNodeSelectable={isSelectableNode}
              getIsNodeMuted={(node) => !isSelectableNode(node)}
              hideHeader
            />
          </div>
          {!hasAssignedDepartment && !isAdmin && (
            <div className="admin-org-tree-state admin-org-tree-state--overlay">
              <strong>소속 부서가 아직 배정되지 않았습니다.</strong>
              <p>관리자에게 부서 배정을 요청해주세요.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
