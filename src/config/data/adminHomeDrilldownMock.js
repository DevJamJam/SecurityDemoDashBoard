export const STEP_META = {
  planReg:       { key: "planReg",       label: "계획등록",   order: 1, path: "/sedo/vuln-mgmt/plan-reg" },
  planApproval:  { key: "planApproval",  label: "계획 검토", order: 2, path: "/sedo/vuln-mgmt/plan-approval" },
  resultReg:     { key: "resultReg",     label: "결과등록",   order: 3, path: "/sedo/vuln-mgmt/result-reg" },
  resultApproval:{ key: "resultApproval",label: "결과검토",   order: 4, path: "/sedo/vuln-mgmt/result-approval" },
  resultFix:     { key: "resultFix",     label: "완료목록",   order: 5, path: "/sedo/vuln-mgmt/result-fix" },
};

export function buildDashboardTrendBoards(detail) {
  return {
    cceRows: detail.design4?.cceRows ?? [],
    cveRows: detail.design4?.cveRows ?? [],
  };
}
