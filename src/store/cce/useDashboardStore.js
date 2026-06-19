import { create } from "zustand";
import { getOrgDashboard } from "@/api/cce/dashboard";
import { getStepLabel } from "@/config/data/adminHomeDrilldownMock";

const TREND_STEP_METRICS = [
  ["planReg", "plan_registered"],
  ["planApproval", "plan_approved"],
  ["resultReg", "result_registered"],
  ["resultApproval", "result_approved"],
  ["resultFix", "resolved_count"],
];

function buildDetailFromCode(code) {
  const {
    scope = {},
    kpi = {},
    dept_summary = [],
    ticket_status = {},
    alerts = {},
    top_risk_assets = [],
    top_vulnerabilities = [],
    score_trend = {},
    operation_trend = {},
  } = code;

  const summary = {
    highRiskCount: kpi.high_risk_vulns?.total ?? 0,
    highRiskCce: kpi.high_risk_vulns?.cce ?? 0,
    highRiskCve: kpi.high_risk_vulns?.cve ?? 0,
    riskChangeText: `CCE ${kpi.high_risk_vulns?.cce ?? 0}건 · CVE ${kpi.high_risk_vulns?.cve ?? 0}건`,

    approvePendingCount: kpi.pending_approval?.total ?? 0,
    approvePending: kpi.pending_approval?.approval_waiting ?? 0,
    actionPending: kpi.pending_approval?.action_waiting ?? 0,

    commandFailCount: kpi.command_failures?.total ?? 0,
    commandGeneral: kpi.command_failures?.general ?? 0,
    commandSchedule: kpi.command_failures?.schedule ?? 0,

    assetCount: kpi.managed_assets?.total ?? 0,
    securityScore: kpi.managed_assets?.avg_security_score ?? 0,

    inspectionCount: kpi.active_inspections?.total ?? 0,
    inspectionCce: kpi.active_inspections?.cce ?? 0,
    inspectionCve: kpi.active_inspections?.cve ?? 0,
    completionRate: `${score_trend.current_fix_rate ?? 0}%`,

    uncheckedAssetCount: kpi.uninspected_assets?.total ?? 0,
    uncheckedCceOnly: kpi.uninspected_assets?.cce_only ?? 0,
    uncheckedCveOnly: kpi.uninspected_assets?.cve_only ?? 0,
    uncheckedBoth: kpi.uninspected_assets?.both ?? 0,
  };

  const securitySummary = {
    overallSecurityRate: score_trend.current_security_rate ?? 0,
    vulnerabilityFixRate: score_trend.current_fix_rate ?? 0,
    overallLabel: "보안률",
    actionLabel: "조치율",
    scopeLabel: scope.selected_dept_name ? `${scope.selected_dept_name} 기준` : "전사 기준",
    securityRateHistory: (score_trend.security_rate || []).map((item) => ({
      month: item.month,
      value: item.value,
    })),
    fixRateHistory: (score_trend.fix_rate || []).map((item) => ({
      month: item.month,
      value: item.value,
    })),
  };

  const processStatusSummary = [
    {
      key: "unresolved",
      label: "미해결",
      count: ticket_status.unresolved?.count ?? 0,
      helper: "미처리, 진행중, 재오픈 항목을 포함한 총 건수",
      percent: ticket_status.unresolved?.percent ?? 0,
    },
    {
      key: "pending_approval",
      label: "승인대기",
      count: ticket_status.pending_approval?.count ?? 0,
      helper: "검토나 결재가 필요한 항목",
      percent: ticket_status.pending_approval?.percent ?? 0,
    },
    {
      key: "due_soon",
      label: "마감 임박",
      count: ticket_status.due_soon?.count ?? 0,
      helper: "마감일이 임박한 항목",
      percent: ticket_status.due_soon?.percent ?? 0,
    },
    {
      key: "overdue",
      label: "기한 초과",
      count: ticket_status.overdue?.count ?? 0,
      helper: "마감일이 지난 항목",
      percent: ticket_status.overdue?.percent ?? 0,
    },
  ];

  const topRiskAssetRows = top_risk_assets.map((asset, index) => ({
    id: `risk-asset-${index}`,
    asset_uuid: asset.asset_uuid,
    name: asset.ast_hostname,
    ip: asset.ast_ipaddr,
    risk: asset.risk_level,
    owner: asset.ast_operator_person || "-",
    cceCount: asset.cce_count ?? 0,
    cveCount: asset.cve_count ?? 0,
    cceIssues: [],
    cveIssues: [],
  }));

  const topVulnerabilityRows = top_vulnerabilities.map((vuln, index) => ({
    id: `vuln-${index}`,
    category: vuln.type,
    vulnId: vuln.vuln_id,
    name: vuln.title,
    severity: vuln.severity,
    affectedAssetCount: vuln.asset_count ?? 0,
    status: vuln.status || "-",
  }));

  const organizationRows = dept_summary.map((dept) => ({
    id: String(dept.dept_id),
    name: dept.dept_name,
    highRiskCount: dept.high_risk_count ?? 0,
    uncheckedCount: dept.unchecked_count ?? 0,
    pendingCount: dept.pending_approval_count ?? 0,
    inspectionCount: dept.inspection_count ?? 0,
    commandFailCount: dept.command_failures_count ?? 0,
    assetCount: dept.asset_count ?? 0,
    completionRate: dept.completion_rate ?? 0,
  }));

  const buildTrendRows = (items) =>
    (items || []).map((item) => ({
      month: item.month,
      inspected: item.inspected_assets ?? 0,
      foundCount: item.found_count ?? 0,
      remainingCount: item.remaining_count ?? 0,
      redetectCount: item.redetect_count ?? 0,
      stepSummary: TREND_STEP_METRICS.map(([stepKey, metricKey]) => ({
        stepKey,
        label: getStepLabel(stepKey),
        count: item[metricKey] ?? 0,
        modalData: null,
      })),
    }));

  const cceRows = buildTrendRows(operation_trend.cce);
  const cveRows = buildTrendRows(operation_trend.cve);
  const deptName = scope.selected_dept_name || "전사";

  return {
    id: scope.selected_dept_id ? String(scope.selected_dept_id) : "root",
    name: deptName,
    breadcrumb: [deptName],
    childDepartments: dept_summary.map((dept) => ({ id: String(dept.dept_id), name: dept.dept_name })),
    pendingActions: [],
    topRiskAssets: topRiskAssetRows,
    topVulnerabilities: topVulnerabilityRows,
    summary,
    scope: {
      role: scope.role,
      is_admin: scope.is_admin,
      selected_dept_id: scope.selected_dept_id,
      selected_dept_name: scope.selected_dept_name,
      asset_count: scope.asset_count,
    },
    alerts: {
      urgent: alerts.urgent ?? 0,
      confirm: alerts.confirm ?? 0,
      info: alerts.info ?? 0,
      total: alerts.total ?? 0,
    },
    design4: {
      securitySummary,
      processStatusSummary,
      organizationRows,
      topRiskAssetRows,
      topVulnerabilityRows,
      cceRows,
      cveRows,
      dashboardDataSource: {
        monthlyStats: [],
      },
    },
  };
}

export const useDashboardStore = create((set) => ({
  detail: null,
  isLoading: false,
  error: null,

  loadOrgDashboard: async (deptId = null) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getOrgDashboard(deptId);
      if (response?.data?.RESULT === "OK") {
        const detail = buildDetailFromCode(response.data.CODE);
        set({ detail, isLoading: false });
      } else {
        throw new Error("API 응답이 올바르지 않습니다.");
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  resetOrgDashboard: () => {
    set({ detail: null, isLoading: false, error: null });
  },
}));
