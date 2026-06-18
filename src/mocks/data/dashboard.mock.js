export const mockDashboard = {
  scope: {
    role: 1,
    is_admin: true,
    selected_dept_id: null,
    asset_count: 45,
  },
  kpi: {
    high_risk_vulns: { total: 12, cce: 8, cve: 4 },
    pending_approval: { total: 5, approval_waiting: 3, action_waiting: 2 },
    command_failures: { total: 2, general: 1, schedule: 1 },
    managed_assets: { total: 45, avg_security_score: 73 },
    active_inspections: { total: 3, cce: 2, cve: 1 },
    uninspected_assets: { total: 7, cce_only: 3, cve_only: 2, both: 2 },
  },
  dept_summary: [
    { dept_id: "dept-002", dept_name: "개발팀", high_risk_count: 5, unchecked_count: 3, pending_approval_count: 2, inspection_count: 1, command_failures_count: 1, asset_count: 20, completion_rate: 65 },
    { dept_id: "dept-003", dept_name: "보안팀", high_risk_count: 4, unchecked_count: 2, pending_approval_count: 2, inspection_count: 1, command_failures_count: 0, asset_count: 18, completion_rate: 80 },
    { dept_id: "dept-004", dept_name: "인프라팀", high_risk_count: 3, unchecked_count: 2, pending_approval_count: 1, inspection_count: 1, command_failures_count: 1, asset_count: 7, completion_rate: 55 },
  ],
  ticket_status: {
    unresolved: { count: 18, percent: 40 },
    pending_approval: { count: 5, percent: 11 },
    due_soon: { count: 3, percent: 7 },
    overdue: { count: 2, percent: 4 },
  },
  alerts: { urgent: 2, confirm: 4, info: 8, total: 14 },
  top_risk_assets: [
    { ass_uuid: "a001", ast_hostname: "web-server-01", ast_ipaddr: "10.0.0.11", risk_level: "HIGH", ast_operator_person: "김개발", cce_count: 5, cve_count: 2 },
    { ass_uuid: "a002", ast_hostname: "db-server-01", ast_ipaddr: "10.0.0.21", risk_level: "HIGH", ast_operator_person: "이인프라", cce_count: 4, cve_count: 3 },
    { ass_uuid: "a003", ast_hostname: "app-server-01", ast_ipaddr: "10.0.0.31", risk_level: "MEDIUM", ast_operator_person: "박보안", cce_count: 2, cve_count: 1 },
  ],
  top_vulnerabilities: [
    { type: "CCE", vuln_id: "CCE-2024-0001", title: "패스워드 정책 미준수", severity: "HIGH", asset_count: 8, status: "조치 진행중" },
    { type: "CCE", vuln_id: "CCE-2024-0002", title: "불필요한 서비스 활성화", severity: "MEDIUM", asset_count: 6, status: "미조치" },
    { type: "CVE", vuln_id: "CVE-2024-1234", title: "원격 코드 실행 취약점", severity: "CRITICAL", asset_count: 3, status: "패치 배포 중" },
  ],
  score_trend: {
    current_security_rate: 73,
    current_fix_rate: 61,
    security_rate: [
      { month: "2024-01", value: 60 }, { month: "2024-02", value: 63 }, { month: "2024-03", value: 67 },
      { month: "2024-04", value: 70 }, { month: "2024-05", value: 71 }, { month: "2024-06", value: 73 },
    ],
    fix_rate: [
      { month: "2024-01", value: 45 }, { month: "2024-02", value: 50 }, { month: "2024-03", value: 53 },
      { month: "2024-04", value: 56 }, { month: "2024-05", value: 59 }, { month: "2024-06", value: 61 },
    ],
  },
  operation_trend: {
    cce: [
      { month: "2024-04", inspected_assets: 30, found_count: 12, remaining_count: 8, redetect_count: 2, plan_registered: 10, plan_approved: 8, result_registered: 6, result_approved: 5, resolved_count: 4 },
      { month: "2024-05", inspected_assets: 35, found_count: 10, remaining_count: 6, redetect_count: 1, plan_registered: 9, plan_approved: 7, result_registered: 6, result_approved: 5, resolved_count: 4 },
      { month: "2024-06", inspected_assets: 38, found_count: 8, remaining_count: 5, redetect_count: 1, plan_registered: 7, plan_approved: 6, result_registered: 5, result_approved: 4, resolved_count: 3 },
    ],
    cve: [
      { month: "2024-04", inspected_assets: 28, found_count: 6, remaining_count: 4, redetect_count: 0, plan_registered: 5, plan_approved: 4, result_registered: 3, result_approved: 3, resolved_count: 2 },
      { month: "2024-05", inspected_assets: 32, found_count: 5, remaining_count: 3, redetect_count: 0, plan_registered: 4, plan_approved: 4, result_registered: 3, result_approved: 3, resolved_count: 2 },
      { month: "2024-06", inspected_assets: 35, found_count: 4, remaining_count: 2, redetect_count: 1, plan_registered: 3, plan_approved: 3, result_registered: 2, result_approved: 2, resolved_count: 2 },
    ],
  },
};
