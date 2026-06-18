import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/store/auth/useAuthStore";
import useOrgStore from "@/store/org/useOrgStore";
import useVulnMgmtUiStore from "@/store/cce/useVulnMgmtUiStore";
import { useDashboardStore } from "@/store/cce/useDashboardStore";
import useDashboardDetailStore from "@/store/cce/useDashboardDetailStore";
import { STEP_META } from "@/config/data/adminHomeDrilldownMock";
import { getUncheckedCategoryLabel } from "@/config/data/dashboardPopupMeta";
import AdminDetailModal from "@/components/dashboard/AdminDetailModal";
import RealOrgTreePanel from "@/components/dashboard/RealOrgTreePanel";
import Design4MainBoard from "@/components/dashboard/Design4MainBoard";
import ScopeMetricBar from "@/components/dashboard/ScopeMetricBar";
import AdminAlertPanel from "@/components/dashboard/AdminAlertPanel";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AssetPendingCommandsModal from "@/components/common/asset/AssetPendingCommandsModal";
import TopMenuActions from "@/components/main/TopMenuActions";
import {
  buildHighRiskSummaryModal,
  buildPendingSummaryModal,
  buildPendingAssetsModal,
  buildCommandFailureAssetsModal,
  buildActiveInspectionsTabs,
  buildUncheckedSummaryModal,
  buildUncheckedAssetsModal,
  buildTrendStepSummaryModal,
  buildTrendStepAssetsModal,
  buildAssetIssuesTabs,
  buildRedetectVulnListModal,
  buildRemediationHistoryModal,
  buildManagedAssetsModal,
  buildVulnDetailModal,
  buildTicketsByStatusModal,
  toYmd,
} from "@/components/dashboard/dashboardPopupBuilders";
import {
  getPreferredDeptId,
  hasAssignedDept,
} from "@/utils/orgPermissionUtils";
import {
  getDashboardPendingSummary,
  getDashboardPendingAssets,
  getDashboardCommandFailureAssets,
  getDashboardActiveCcePlans,
  getDashboardActiveCveScans,
  getDashboardUncheckedSummary,
  getDashboardUncheckedAssets,
} from "@/api/cce/dashboardPopups";
import "./css/adminRoleHome-base.css";
import "./css/adminRoleHome-sidebar.css";
import "./css/adminRoleHome-design4.css";
import "./css/adminRoleHome-modals.css";
import "./css/adminRoleHome-searchPanel.css";

const extractCode = (res) => {
  const data = res?.data;
  if (!data || data.RESULT !== "OK") {
    throw new Error(data?.CODE || "응답이 올바르지 않습니다.");
  }
  return data.CODE;
};

function ScopeStatus({ scopeName }) {
  return (
    <div className="admin-home-statusbar compact-v3">
      <div className="admin-home-statusbar__left">
        <div className="admin-home-statusbar__title-wrap">
          <strong>보안 현황</strong>
          {scopeName && <span>범위: {scopeName}</span>}
        </div>
      </div>
      <TopMenuActions />
    </div>
  );
}

function AdminRoleHome() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const isAdminUser = user?.role === 1;
  const hasAssignedDepartment = hasAssignedDept(user);
  const preferredDeptId = getPreferredDeptId(user);
  const canViewDashboard = isAdminUser || hasAssignedDepartment;

  const selectedDeptId = useOrgStore((state) => state.selectedDeptId);
  const setSelectedDeptId = useOrgStore((state) => state.setSelectedDeptId);
  const orgNodeMap = useOrgStore((state) => state.orgNodeMap);
  const hasFetchedOrgTree = useOrgStore((state) => state.hasFetchedOrgTree);

  const { detail, error, loadOrgDashboard, isLoading } = useDashboardStore();
  const { setActiveMode, setSelectedCceAsset, setSelectedCveAsset } = useVulnMgmtUiStore();
  const dashDetail = useDashboardDetailStore();

  useEffect(() => {
    if (selectedDeptId) return;
    if (!preferredDeptId) return;
    setSelectedDeptId(preferredDeptId);
  }, [selectedDeptId, preferredDeptId, setSelectedDeptId]);

  useEffect(() => {
    if (!hasFetchedOrgTree) return;
    if (!canViewDashboard) return;
    if (!isAdminUser && !selectedDeptId) return;
    loadOrgDashboard(selectedDeptId || null);
  }, [selectedDeptId, hasFetchedOrgTree, canViewDashboard, isAdminUser]);

  const scopeDeptName = selectedDeptId ? orgNodeMap[selectedDeptId]?.name : null;

  const displayDetail = useMemo(() => {
    if (!detail) return null;
    const name = scopeDeptName || "전사";
    const breadcrumb = scopeDeptName ? [scopeDeptName] : ["전사"];
    return { ...detail, name, breadcrumb };
  }, [detail, scopeDeptName]);

  const isAdmin = displayDetail?.scope?.is_admin ?? isAdminUser;
  const scopeName = displayDetail?.name || "전사";

  const [modalStack, setModalStack] = useState([]);
  const currentModal = modalStack[modalStack.length - 1] || null;
  const [commandModalAsset, setCommandModalAsset] = useState(null);

  const openModal = useCallback((data) => {
    if (!data) return;
    setModalStack((prev) => [...prev, data]);
  }, []);

  const replaceTopModal = useCallback((data) => {
    setModalStack((prev) => {
      if (prev.length === 0) return [data];
      return [...prev.slice(0, -1), data];
    });
  }, []);

  const closeModal = () => setModalStack([]);
  const backModal = () => setModalStack((prev) => prev.slice(0, -1));
  const getDeptId = () => selectedDeptId ?? "";

  const openWithLoading = useCallback(
    async (loadingMeta, taskFn) => {
      openModal({ ...loadingMeta, loading: true });
      try {
        const result = await taskFn();
        replaceTopModal(result);
      } catch (err) {
        replaceTopModal({
          ...loadingMeta,
          loading: false,
          error: err?.message || "데이터 조회에 실패했습니다.",
        });
      }
    },
    [openModal, replaceTopModal],
  );

  const handleAssetNavigate = (asset, sourceType, stepKey, vulnFilter) => {
    const stepPath = STEP_META[stepKey]?.path || "/sedo/vuln-mgmt/plan-reg";

    if (sourceType === "CCE") {
      setActiveMode("CCE");
      setSelectedCceAsset(asset);
      navigate(stepPath, {
        state: {
          dashboardDrilldown: {
            sourceType: "CCE",
            stepKey,
            assetName: asset?.asset_name || asset?.ast_hostname,
            scopeName: displayDetail?.name,
            ...(vulnFilter ? { vulnFilter } : {}),
          },
        },
      });
      closeModal();
      return;
    }

    setActiveMode("CVE");
    setSelectedCveAsset(asset);
    navigate(stepPath, {
      state: {
        dashboardDrilldown: {
          sourceType: "CVE",
          stepKey,
          assetName: asset?.asset_name || asset?.ast_hostname,
          scopeName: displayDetail?.name,
          ...(vulnFilter ? { vulnFilter } : {}),
        },
      },
    });
    closeModal();
  };

  const openHighRiskSummary = () => {
    openModal(
      buildHighRiskSummaryModal(null, {
        scopeName,
        deptId: getDeptId(),
        cceCount: displayDetail?.summary?.highRiskCce,
        cveCount: displayDetail?.summary?.highRiskCve,
        onAssetNavigate: handleAssetNavigate,
      }),
    );
  };

  const openPendingAssets = (payload) => {
    openWithLoading(
      { type: "assetList", eyebrow: `${payload.vuln_type} · ${payload.step_label}`, title: `${payload.step_label} 대상 자산` },
      async () => {
        const code = await dashDetail.loadPendingAssets({
          deptId: getDeptId(),
          vulnType: payload.vuln_type,
          stepKey: payload.step_key,
        });
        return buildPendingAssetsModal(code, {
          vulnType: payload.vuln_type,
          stepKey: payload.step_key,
          stepLabel: payload.step_label,
          scopeName,
          onAssetClick: handleAssetNavigate,
        });
      },
    );
  };

  const openPendingSummary = () => {
    openWithLoading(
      { type: "summaryRows", eyebrow: "KPI 상세", title: "승인 / 조치대기 상세" },
      async () => {
        const code = await dashDetail.loadPendingSummary(getDeptId());
        return buildPendingSummaryModal(code, { scopeName, onOpenAssets: openPendingAssets });
      },
    );
  };

  const openCommandAssetPending = (asset) => {
    setCommandModalAsset({ ass_uuid: asset.ass_uuid, ast_hostname: asset.ast_hostname, ast_ipaddr: asset.ast_ipaddr });
  };

  const openCommandFailures = () => {
    openWithLoading(
      { type: "assetList", eyebrow: "KPI 상세", title: "명령 실패 자산" },
      async () => {
        const code = await dashDetail.loadCommandFailures(getDeptId());
        return buildCommandFailureAssetsModal(code, { scopeName, onOpenAssetPending: openCommandAssetPending });
      },
    );
  };

  const openActiveInspections = () => {
    openWithLoading(
      { type: "tabs", eyebrow: "KPI 상세", title: "진행 중 점검" },
      async () => {
        const { cce, cve } = await dashDetail.loadActiveInspections(getDeptId());
        return buildActiveInspectionsTabs(cce, cve, {
          scopeName,
          onNavigateCce: (item) => { navigate(`/sedo/plan/detail/${item.ccp_index}`, { state: { fromDashboard: true } }); closeModal(); },
          onNavigateCve: (item) => { navigate(`/sedo/cve/inspection-detail/${item.job_id}`, { state: { fromDashboard: true } }); closeModal(); },
        });
      },
    );
  };

  const openUncheckedAssets = (category) => {
    openWithLoading(
      { type: "assetList", eyebrow: "미점검 자산", title: getUncheckedCategoryLabel(category) },
      async () => {
        const code = await dashDetail.loadUncheckedAssets({ deptId: getDeptId(), category });
        return buildUncheckedAssetsModal(code, { category, scopeName });
      },
    );
  };

  const openUncheckedSummary = () => {
    openWithLoading(
      { type: "summaryRows", eyebrow: "KPI 상세", title: "미점검 자산 상세" },
      async () => {
        const code = await dashDetail.loadUncheckedSummary(getDeptId());
        return buildUncheckedSummaryModal(code, { scopeName, onOpenAssets: openUncheckedAssets });
      },
    );
  };

  const openTrendStepAssets = ({ vulnType, month, stepKey, stepLabel }) => {
    openWithLoading(
      { type: "assetList", eyebrow: `${vulnType} ${month}`, title: stepKey === "redetect" ? "재탐지 자산 목록" : `${stepLabel} 자산 목록` },
      async () => {
        const code = await dashDetail.loadTrendStepAssets({ deptId: getDeptId(), vulnType, month, stepKey });
        return buildTrendStepAssetsModal(code, {
          vulnType, month, stepKey, stepLabel, scopeName,
          onAssetClick: handleAssetNavigate,
          onOpenRedetectVulns: (asset) => openRedetectVulnList(asset, vulnType),
          onAssetNavigate: (asset, vt) => handleAssetNavigate(asset, vt, "planReg"),
        });
      },
    );
  };

  const openRedetectVulnList = (asset, vulnType) => {
    openModal(buildRedetectVulnListModal({
      asset, vulnType, scopeName,
      onOpenHistory: openRemediationHistory,
      onAssetNavigate: (a, vt) => handleAssetNavigate(a, vt, "planReg"),
    }));
  };

  const openRemediationHistory = ({ asset, vulnType, vulnId }) => {
    openWithLoading(
      { type: "custom", eyebrow: `${vulnType} 조치 이력`, title: `${vulnId} 조치 이력` },
      async () => {
        const code = await dashDetail.loadRemediationHistory(
          vulnType === "CCE"
            ? { vulnType, astUuid: asset?.ast_uuid, cccIndex: vulnId }
            : { vulnType, assUuid: asset?.ass_uuid, cveId: vulnId },
        );
        return buildRemediationHistoryModal(code, { asset, vulnType, vulnId });
      },
    );
  };

  const openTrendSummary = (trendRow, vulnType) => {
    openModal(buildTrendStepSummaryModal(trendRow, {
      vulnType, scopeName, deptId: getDeptId(),
      onOpenStepAssets: ({ stepKey, stepLabel, month }) =>
        openTrendStepAssets({ vulnType, month, stepKey, stepLabel }),
      onRedetectDrilldown: ({ stepKey, stepLabel, month }) =>
        openTrendStepAssets({ vulnType, month, stepKey: "redetect", stepLabel }),
    }));
  };

  const openAssetIssues = (asset) => {
    openModal(buildAssetIssuesTabs(null, { asset, scopeName }));
  };

  const openVulnDetail = (item) => {
    if (!item?.vulnId || !item?.category) return;
    openModal(buildVulnDetailModal({ type: item.category, vulnId: item.vulnId, vulnLabel: item.name, deptId: getDeptId(), scopeName, onAssetNavigate: handleAssetNavigate }));
  };

  const openProcessStatusTickets = (statusRow) => {
    openModal(buildTicketsByStatusModal({
      deptId: getDeptId(),
      status: statusRow.key,
      statusLabel: statusRow.label,
      scopeName,
      onAssetDetail: (ticket) => { navigate(`/sedo/asset/asset-list/asset-detail/${ticket.ass_uuid}`, { state: { ast_uuid: ticket.ast_uuid, fromDashboard: true } }); closeModal(); },
      onAssetNavigate: (ticket) => {
        const ymd = toYmd(ticket.created_at);
        const vulnFilter = { start_date: ymd, end_date: ymd, ...(ticket.vuln_type === "CCE" ? { ccc_item_no: ticket.vuln_id } : { cve_id: ticket.vuln_id }) };
        handleAssetNavigate({ ass_uuid: ticket.ass_uuid, ast_uuid: ticket.ast_uuid, ast_hostname: ticket.ast_hostname, ast_ipaddr: ticket.ast_ipaddr }, ticket.vuln_type, ticket.current_step, vulnFilter);
      },
    }));
  };

  const openManagedAssets = () => {
    openModal(buildManagedAssetsModal({ deptId: getDeptId(), scopeName }));
  };

  const openDeptPendingAssets = (payload, deptCtx) => {
    openWithLoading(
      { type: "assetList", eyebrow: `${payload.vuln_type} · ${payload.step_label}`, title: `${payload.step_label} 대상 자산` },
      async () => {
        const res = await getDashboardPendingAssets({ deptId: deptCtx.deptId, vulnType: payload.vuln_type, stepKey: payload.step_key });
        const code = extractCode(res);
        return buildPendingAssetsModal(code, { vulnType: payload.vuln_type, stepKey: payload.step_key, stepLabel: payload.step_label, scopeName: deptCtx.scopeName, onAssetClick: handleAssetNavigate });
      },
    );
  };

  const openDeptUncheckedAssets = (category, deptCtx) => {
    openWithLoading(
      { type: "assetList", eyebrow: `부서 · ${deptCtx.scopeName}`, title: getUncheckedCategoryLabel(category) },
      async () => {
        const res = await getDashboardUncheckedAssets({ deptId: deptCtx.deptId, category });
        const code = extractCode(res);
        return buildUncheckedAssetsModal(code, { category, scopeName: deptCtx.scopeName });
      },
    );
  };

  const openDeptHighRiskSummary = (deptCtx) => {
    openModal(buildHighRiskSummaryModal(null, { scopeName: deptCtx.scopeName, deptId: deptCtx.deptId, onAssetNavigate: handleAssetNavigate }));
  };

  const openDeptPendingSummary = (deptCtx) => {
    openWithLoading(
      { type: "summaryRows", eyebrow: `부서 · ${deptCtx.scopeName}`, title: "승인/조치대기 상세" },
      async () => {
        const res = await getDashboardPendingSummary(deptCtx.deptId);
        const code = extractCode(res);
        return buildPendingSummaryModal(code, { scopeName: deptCtx.scopeName, onOpenAssets: (p) => openDeptPendingAssets(p, deptCtx) });
      },
    );
  };

  const openDeptCommandFailures = (deptCtx) => {
    openWithLoading(
      { type: "assetList", eyebrow: `부서 · ${deptCtx.scopeName}`, title: "명령 실패 자산" },
      async () => {
        const res = await getDashboardCommandFailureAssets(deptCtx.deptId);
        const code = extractCode(res);
        return buildCommandFailureAssetsModal(code, { scopeName: deptCtx.scopeName, onOpenAssetPending: openCommandAssetPending });
      },
    );
  };

  const openDeptActiveInspections = (deptCtx) => {
    openWithLoading(
      { type: "tabs", eyebrow: `부서 · ${deptCtx.scopeName}`, title: "진행 중 점검" },
      async () => {
        const [cceRes, cveRes] = await Promise.all([getDashboardActiveCcePlans(deptCtx.deptId), getDashboardActiveCveScans(deptCtx.deptId)]);
        const cceCode = extractCode(cceRes);
        const cveCode = extractCode(cveRes);
        return buildActiveInspectionsTabs(cceCode, cveCode, {
          scopeName: deptCtx.scopeName,
          onNavigateCce: (item) => { navigate(`/sedo/plan/detail/${item.ccp_index}`, { state: { fromDashboard: true } }); closeModal(); },
          onNavigateCve: (item) => { navigate(`/sedo/cve/inspection-detail/${item.job_id}`, { state: { fromDashboard: true } }); closeModal(); },
        });
      },
    );
  };

  const openDeptUncheckedSummary = (deptCtx) => {
    openWithLoading(
      { type: "summaryRows", eyebrow: `부서 · ${deptCtx.scopeName}`, title: "미점검 자산 상세" },
      async () => {
        const res = await getDashboardUncheckedSummary(deptCtx.deptId);
        const code = extractCode(res);
        return buildUncheckedSummaryModal(code, { scopeName: deptCtx.scopeName, onOpenAssets: (cat) => openDeptUncheckedAssets(cat, deptCtx) });
      },
    );
  };

  const openDeptManagedAssets = (deptCtx) => {
    openModal(buildManagedAssetsModal({ deptId: deptCtx.deptId, scopeName: deptCtx.scopeName }));
  };

  const handleDeptKpiClick = (row, kpiKey) => {
    const deptCtx = { deptId: row.id, scopeName: row.name };
    switch (kpiKey) {
      case "highRisk": openDeptHighRiskSummary(deptCtx); break;
      case "unchecked": openDeptUncheckedSummary(deptCtx); break;
      case "pending": openDeptPendingSummary(deptCtx); break;
      case "inspections": openDeptActiveInspections(deptCtx); break;
      case "command": openDeptCommandFailures(deptCtx); break;
      case "assets": openDeptManagedAssets(deptCtx); break;
      default: break;
    }
  };

  const handleOpenSummaryModal = (cardKey) => {
    switch (cardKey) {
      case "highRisk": openHighRiskSummary(); break;
      case "pending": openPendingSummary(); break;
      case "command": openCommandFailures(); break;
      case "inspections": openActiveInspections(); break;
      case "unchecked": openUncheckedSummary(); break;
      case "assets": openManagedAssets(); break;
      default: break;
    }
  };

  const renderLoadingState = () => (
    <section className="admin-role-home__main admin-role-home__main--design4">
      <div className="admin-role-home__loading-wrap"><LoadingSpinner /></div>
    </section>
  );

  const renderErrorState = () => (
    <section className="admin-role-home__main admin-role-home__main--design4">
      <div className="admin-content-card">
        <div className="admin-panel__header">
          <h3>데이터 로드 실패</h3>
          <span>{error}</span>
        </div>
      </div>
    </section>
  );

  const renderUnassignedState = () => (
    <section className="admin-role-home__main admin-role-home__main--design4 admin-role-home__main--blurred">
      <div className="admin-role-home__blur-bg" aria-hidden="true" />
      <div className="admin-role-home__blur-notice">
        <strong>소속 부서가 아직 배정되지 않았습니다.</strong>
        <p>관리자에게 부서 배정을 요청해주세요.</p>
      </div>
    </section>
  );

  return (
    <div className="admin-role-home">
      <ScopeStatus scopeName={scopeName} />

      <div className="admin-role-home__body admin-role-home__body--design4">
        <aside className="admin-role-home__sidebar admin-role-home__sidebar--design4">
          <div className="admin-side-card admin-side-card--tree top-first admin-side-card--design4-tree">
            <RealOrgTreePanel />
          </div>
          <AdminAlertPanel alerts={displayDetail?.alerts} deptId={selectedDeptId ?? ""} />
        </aside>

        {!canViewDashboard ? (
          renderUnassignedState()
        ) : !displayDetail ? (
          error ? renderErrorState() : renderLoadingState()
        ) : (
          <section className="admin-role-home__main admin-role-home__main--design4">
            <ScopeMetricBar
              summary={displayDetail.summary}
              onOpenSummaryModal={handleOpenSummaryModal}
            />
            <Design4MainBoard
              detail={displayDetail}
              onOpenTrendSummary={openTrendSummary}
              onOpenAssetIssues={openAssetIssues}
              onOpenVulnDetail={openVulnDetail}
              onOpenProcessTickets={openProcessStatusTickets}
              onDeptKpiClick={handleDeptKpiClick}
              selectedNodeId={selectedDeptId}
              onSelectNode={setSelectedDeptId}
            />
            {isLoading && (
              <div className="admin-role-home__loading-overlay" aria-busy="true" aria-live="polite">
                <LoadingSpinner />
              </div>
            )}
          </section>
        )}
      </div>

      <AdminDetailModal
        open={!!currentModal}
        data={currentModal}
        stackDepth={modalStack.length}
        onClose={closeModal}
        onBack={backModal}
        onOpenNested={openModal}
        onAssetClick={handleAssetNavigate}
      />

      <AssetPendingCommandsModal
        isOpen={!!commandModalAsset}
        onClose={() => setCommandModalAsset(null)}
        asset={commandModalAsset}
        pendingCommands={{}}
      />
    </div>
  );
}

export default AdminRoleHome;
