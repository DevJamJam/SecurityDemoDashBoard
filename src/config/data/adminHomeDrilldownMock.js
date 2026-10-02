// path는 SeDo 포트폴리오 라우터에 실재하는 경로로 매핑
// (원본 VARO의 vuln-mgmt 하위 경로 → 가장 가까운 메뉴로 대응)
export const STEP_META = {
  planReg:       { key: "planReg",       label: "계획등록", order: 1, path: "/sedo/inspection-plans" },
  planApproval:  { key: "planApproval",  label: "계획검토", order: 2, path: "/sedo/inspection-plans" },
  resultReg:     { key: "resultReg",     label: "결과등록", order: 3, path: "/sedo/result-review" },
  resultApproval:{ key: "resultApproval",label: "결과검토", order: 4, path: "/sedo/result-review" },
  resultFix:     { key: "resultFix",     label: "완료목록", order: 5, path: "/sedo/result-review" },
};

export const DASHBOARD_TREND_STEPS = Object.values(STEP_META).sort((a, b) => a.order - b.order);

export const getStepLabel = (stepKey) => STEP_META[stepKey]?.label || stepKey || "-";

export const getStepPath = (stepKey) => STEP_META[stepKey]?.path || "/sedo/vuln-mgmt/plan-reg";

export function buildDashboardTrendBoards(detail) {
  return {
    cceRows: detail.design4?.cceRows ?? [],
    cveRows: detail.design4?.cveRows ?? [],
  };
}
