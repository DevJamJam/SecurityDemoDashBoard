// ─────────────────────────────────────────────────────────────
// 계층 구조:
//   전사 (root)
//     └── IT본부 (dept-001)   ← 전사의 유일한 직속 부서
//           ├── 개발팀 (dept-002)
//           ├── 보안팀 (dept-003)
//           └── 인프라팀 (dept-004)
//
// 불변 원칙: 상위 KPI = 직속 하위 KPI 합계
//   IT본부 = 개발팀 + 보안팀 + 인프라팀
//   전사   = IT본부 (단일 본부이므로 동일)
// ─────────────────────────────────────────────────────────────

function makeMonthlyTrend(months, values) {
  return months.map((m, i) => ({ month: m, value: values[i] }));
}

const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월"];

// ── 개발팀 (dept-002) ───────────────────────────────────────
const dept002 = {
  scope: { role: 2, is_admin: false, selected_dept_id: "dept-002", selected_dept_name: "개발팀", asset_count: 20 },
  kpi: {
    high_risk_vulns:   { total: 5,  cce: 3, cve: 2 },
    pending_approval:  { total: 2,  approval_waiting: 1, action_waiting: 1 },
    command_failures:  { total: 1,  general: 1, schedule: 0 },
    managed_assets:    { total: 20, avg_security_score: 65 },
    active_inspections:{ total: 1,  cce: 1, cve: 0 },
    uninspected_assets:{ total: 3,  cce_only: 2, cve_only: 0, both: 1 },
  },
  dept_summary: [],
  ticket_status: {
    unresolved:       { count: 8,  percent: 40 },
    pending_approval: { count: 2,  percent: 10 },
    due_soon:         { count: 1,  percent: 5  },
    overdue:          { count: 1,  percent: 5  },
  },
  alerts: { urgent: 1, confirm: 2, info: 4, total: 7 },
  top_risk_assets: [
    { ass_uuid: "a001", ast_hostname: "web-server-01", ast_ipaddr: "10.0.1.11", risk_level: "HIGH",   ast_operator_person: "김개발", cce_count: 5, cve_count: 2 },
    { ass_uuid: "a003", ast_hostname: "app-server-01", ast_ipaddr: "10.0.1.31", risk_level: "MEDIUM", ast_operator_person: "이개발", cce_count: 2, cve_count: 1 },
  ],
  top_vulnerabilities: [
    { type: "CCE", vuln_id: "CCE-2024-0001", title: "패스워드 정책 미준수",    severity: "HIGH",   asset_count: 4, status: "조치 진행중" },
    { type: "CVE", vuln_id: "CVE-2024-1234", title: "원격 코드 실행 취약점", severity: "CRITICAL", asset_count: 2, status: "패치 배포 중" },
  ],
  score_trend: {
    current_security_rate: 65, current_fix_rate: 58,
    security_rate: makeMonthlyTrend(MONTHS, [55, 57, 59, 61, 63, 65]),
    fix_rate:      makeMonthlyTrend(MONTHS, [44, 47, 50, 52, 55, 58]),
  },
  operation_trend: {
    cce: [
      { month: "4월", inspected_assets: 12, found_count: 5, remaining_count: 3, redetect_count: 1, plan_registered: 4, plan_approved: 3, result_registered: 2, result_approved: 2, resolved_count: 2 },
      { month: "5월", inspected_assets: 14, found_count: 4, remaining_count: 3, redetect_count: 1, plan_registered: 4, plan_approved: 3, result_registered: 2, result_approved: 2, resolved_count: 1 },
      { month: "6월", inspected_assets: 15, found_count: 3, remaining_count: 2, redetect_count: 0, plan_registered: 3, plan_approved: 2, result_registered: 2, result_approved: 1, resolved_count: 1 },
    ],
    cve: [
      { month: "4월", inspected_assets: 12, found_count: 3, remaining_count: 2, redetect_count: 0, plan_registered: 2, plan_approved: 2, result_registered: 1, result_approved: 1, resolved_count: 1 },
      { month: "5월", inspected_assets: 14, found_count: 2, remaining_count: 1, redetect_count: 0, plan_registered: 2, plan_approved: 2, result_registered: 1, result_approved: 1, resolved_count: 1 },
      { month: "6월", inspected_assets: 15, found_count: 2, remaining_count: 1, redetect_count: 0, plan_registered: 1, plan_approved: 1, result_registered: 1, result_approved: 1, resolved_count: 1 },
    ],
  },
};

// ── 보안팀 (dept-003) ───────────────────────────────────────
const dept003 = {
  scope: { role: 2, is_admin: false, selected_dept_id: "dept-003", selected_dept_name: "보안팀", asset_count: 18 },
  kpi: {
    high_risk_vulns:   { total: 4,  cce: 3, cve: 1 },
    pending_approval:  { total: 2,  approval_waiting: 1, action_waiting: 1 },
    command_failures:  { total: 0,  general: 0, schedule: 0 },
    managed_assets:    { total: 18, avg_security_score: 80 },
    active_inspections:{ total: 1,  cce: 1, cve: 0 },
    uninspected_assets:{ total: 2,  cce_only: 1, cve_only: 1, both: 0 },
  },
  dept_summary: [],
  ticket_status: {
    unresolved:       { count: 6,  percent: 33 },
    pending_approval: { count: 2,  percent: 11 },
    due_soon:         { count: 1,  percent: 6  },
    overdue:          { count: 0,  percent: 0  },
  },
  alerts: { urgent: 0, confirm: 1, info: 2, total: 3 },
  top_risk_assets: [
    { ass_uuid: "a003", ast_hostname: "app-server-01", ast_ipaddr: "10.0.2.31", risk_level: "MEDIUM", ast_operator_person: "박보안", cce_count: 3, cve_count: 1 },
  ],
  top_vulnerabilities: [
    { type: "CCE", vuln_id: "CCE-2024-0002", title: "불필요한 서비스 활성화", severity: "MEDIUM", asset_count: 3, status: "미조치" },
    { type: "CCE", vuln_id: "CCE-2024-0003", title: "계정 잠금 정책 미설정",  severity: "HIGH",   asset_count: 2, status: "조치 진행중" },
  ],
  score_trend: {
    current_security_rate: 80, current_fix_rate: 72,
    security_rate: makeMonthlyTrend(MONTHS, [72, 74, 75, 77, 78, 80]),
    fix_rate:      makeMonthlyTrend(MONTHS, [62, 64, 66, 68, 70, 72]),
  },
  operation_trend: {
    cce: [
      { month: "4월", inspected_assets: 10, found_count: 4, remaining_count: 3, redetect_count: 1, plan_registered: 3, plan_approved: 3, result_registered: 2, result_approved: 2, resolved_count: 1 },
      { month: "5월", inspected_assets: 12, found_count: 4, remaining_count: 2, redetect_count: 0, plan_registered: 3, plan_approved: 2, result_registered: 2, result_approved: 2, resolved_count: 2 },
      { month: "6월", inspected_assets: 14, found_count: 3, remaining_count: 2, redetect_count: 1, plan_registered: 2, plan_approved: 2, result_registered: 2, result_approved: 2, resolved_count: 1 },
    ],
    cve: [
      { month: "4월", inspected_assets: 10, found_count: 2, remaining_count: 1, redetect_count: 0, plan_registered: 2, plan_approved: 1, result_registered: 1, result_approved: 1, resolved_count: 1 },
      { month: "5월", inspected_assets: 12, found_count: 2, remaining_count: 1, redetect_count: 0, plan_registered: 1, plan_approved: 1, result_registered: 1, result_approved: 1, resolved_count: 1 },
      { month: "6월", inspected_assets: 14, found_count: 1, remaining_count: 0, redetect_count: 1, plan_registered: 1, plan_approved: 1, result_registered: 1, result_approved: 1, resolved_count: 1 },
    ],
  },
};

// ── 인프라팀 (dept-004) ───────────────────────────────────────
const dept004 = {
  scope: { role: 2, is_admin: false, selected_dept_id: "dept-004", selected_dept_name: "인프라팀", asset_count: 7 },
  kpi: {
    high_risk_vulns:   { total: 3,  cce: 2, cve: 1 },
    pending_approval:  { total: 1,  approval_waiting: 1, action_waiting: 0 },
    command_failures:  { total: 1,  general: 0, schedule: 1 },
    managed_assets:    { total: 7,  avg_security_score: 55 },
    active_inspections:{ total: 1,  cce: 0, cve: 1 },
    uninspected_assets:{ total: 2,  cce_only: 0, cve_only: 1, both: 1 },
  },
  dept_summary: [],
  ticket_status: {
    unresolved:       { count: 4,  percent: 57 },
    pending_approval: { count: 1,  percent: 14 },
    due_soon:         { count: 1,  percent: 14 },
    overdue:          { count: 1,  percent: 14 },
  },
  alerts: { urgent: 1, confirm: 1, info: 2, total: 4 },
  top_risk_assets: [
    { ass_uuid: "a002", ast_hostname: "db-server-01", ast_ipaddr: "10.0.3.21", risk_level: "HIGH", ast_operator_person: "이인프라", cce_count: 4, cve_count: 3 },
  ],
  top_vulnerabilities: [
    { type: "CVE", vuln_id: "CVE-2024-5678", title: "SQL 인젝션 취약점",       severity: "HIGH",   asset_count: 2, status: "미조치" },
    { type: "CCE", vuln_id: "CCE-2024-0004", title: "원격 접속 로그 미설정",   severity: "MEDIUM", asset_count: 1, status: "조치 진행중" },
  ],
  score_trend: {
    current_security_rate: 55, current_fix_rate: 44,
    security_rate: makeMonthlyTrend(MONTHS, [45, 47, 49, 51, 53, 55]),
    fix_rate:      makeMonthlyTrend(MONTHS, [34, 36, 38, 40, 42, 44]),
  },
  operation_trend: {
    cce: [
      { month: "4월", inspected_assets: 8, found_count: 3, remaining_count: 2, redetect_count: 0, plan_registered: 3, plan_approved: 2, result_registered: 2, result_approved: 1, resolved_count: 1 },
      { month: "5월", inspected_assets: 9, found_count: 2, remaining_count: 1, redetect_count: 0, plan_registered: 2, plan_approved: 2, result_registered: 2, result_approved: 1, resolved_count: 1 },
      { month: "6월", inspected_assets: 9, found_count: 2, remaining_count: 1, redetect_count: 0, plan_registered: 2, plan_approved: 2, result_registered: 1, result_approved: 1, resolved_count: 1 },
    ],
    cve: [
      { month: "4월", inspected_assets: 6, found_count: 1, remaining_count: 1, redetect_count: 0, plan_registered: 1, plan_approved: 1, result_registered: 1, result_approved: 1, resolved_count: 0 },
      { month: "5월", inspected_assets: 6, found_count: 1, remaining_count: 1, redetect_count: 0, plan_registered: 1, plan_approved: 1, result_registered: 1, result_approved: 1, resolved_count: 0 },
      { month: "6월", inspected_assets: 6, found_count: 1, remaining_count: 1, redetect_count: 0, plan_registered: 1, plan_approved: 1, result_registered: 0, result_approved: 0, resolved_count: 0 },
    ],
  },
};

// ── IT본부 (dept-001) = 개발팀 + 보안팀 + 인프라팀 합계 ────────
// 검증: high_risk 5+4+3=12 ✓  assets 20+18+7=45 ✓  cmd_fail 1+0+1=2 ✓
const dept001 = {
  scope: { role: 1, is_admin: true, selected_dept_id: "dept-001", selected_dept_name: "IT본부", asset_count: 45 },
  kpi: {
    high_risk_vulns:   { total: 12, cce: 8, cve: 4 },
    pending_approval:  { total: 5,  approval_waiting: 3, action_waiting: 2 },
    command_failures:  { total: 2,  general: 1, schedule: 1 },
    managed_assets:    { total: 45, avg_security_score: 69 },
    active_inspections:{ total: 3,  cce: 2, cve: 1 },
    uninspected_assets:{ total: 7,  cce_only: 3, cve_only: 2, both: 2 },
  },
  dept_summary: [
    { dept_id: "dept-002", dept_name: "개발팀",  high_risk_count: 5, unchecked_count: 3, pending_approval_count: 2, inspection_count: 1, command_failures_count: 1, asset_count: 20, completion_rate: 65 },
    { dept_id: "dept-003", dept_name: "보안팀",  high_risk_count: 4, unchecked_count: 2, pending_approval_count: 2, inspection_count: 1, command_failures_count: 0, asset_count: 18, completion_rate: 80 },
    { dept_id: "dept-004", dept_name: "인프라팀", high_risk_count: 3, unchecked_count: 2, pending_approval_count: 1, inspection_count: 1, command_failures_count: 1, asset_count: 7,  completion_rate: 55 },
  ],
  ticket_status: {
    unresolved:       { count: 18, percent: 40 },
    pending_approval: { count: 5,  percent: 11 },
    due_soon:         { count: 3,  percent: 7  },
    overdue:          { count: 2,  percent: 4  },
  },
  alerts: { urgent: 2, confirm: 4, info: 7, total: 13 },
  top_risk_assets: [
    { ass_uuid: "a001", ast_hostname: "web-server-01", ast_ipaddr: "10.0.1.11", risk_level: "HIGH",   ast_operator_person: "김개발",  cce_count: 5, cve_count: 2 },
    { ass_uuid: "a002", ast_hostname: "db-server-01",  ast_ipaddr: "10.0.3.21", risk_level: "HIGH",   ast_operator_person: "이인프라", cce_count: 4, cve_count: 3 },
    { ass_uuid: "a003", ast_hostname: "app-server-01", ast_ipaddr: "10.0.2.31", risk_level: "MEDIUM", ast_operator_person: "박보안",   cce_count: 2, cve_count: 1 },
  ],
  top_vulnerabilities: [
    { type: "CCE", vuln_id: "CCE-2024-0001", title: "패스워드 정책 미준수",    severity: "HIGH",     asset_count: 8, status: "조치 진행중" },
    { type: "CCE", vuln_id: "CCE-2024-0002", title: "불필요한 서비스 활성화", severity: "MEDIUM",   asset_count: 6, status: "미조치" },
    { type: "CVE", vuln_id: "CVE-2024-1234", title: "원격 코드 실행 취약점", severity: "CRITICAL",  asset_count: 3, status: "패치 배포 중" },
  ],
  score_trend: {
    current_security_rate: 69, current_fix_rate: 61,
    security_rate: makeMonthlyTrend(MONTHS, [58, 60, 63, 65, 67, 69]),
    fix_rate:      makeMonthlyTrend(MONTHS, [46, 49, 52, 55, 58, 61]),
  },
  // CCE: 개발팀+보안팀+인프라팀 합계
  // 검증 4월: inspected 12+10+8=30 ✓  found 5+4+3=12 ✓  remaining 3+3+2=8 ✓  redetect 1+1+0=2 ✓
  operation_trend: {
    cce: [
      { month: "4월", inspected_assets: 30, found_count: 12, remaining_count: 8, redetect_count: 2, plan_registered: 10, plan_approved: 8, result_registered: 6, result_approved: 5, resolved_count: 4 },
      { month: "5월", inspected_assets: 35, found_count: 10, remaining_count: 6, redetect_count: 1, plan_registered: 9,  plan_approved: 7, result_registered: 6, result_approved: 5, resolved_count: 4 },
      { month: "6월", inspected_assets: 38, found_count: 8,  remaining_count: 5, redetect_count: 1, plan_registered: 7,  plan_approved: 6, result_registered: 5, result_approved: 4, resolved_count: 3 },
    ],
    cve: [
      { month: "4월", inspected_assets: 28, found_count: 6, remaining_count: 4, redetect_count: 0, plan_registered: 5, plan_approved: 4, result_registered: 3, result_approved: 3, resolved_count: 2 },
      { month: "5월", inspected_assets: 32, found_count: 5, remaining_count: 3, redetect_count: 0, plan_registered: 4, plan_approved: 4, result_registered: 3, result_approved: 3, resolved_count: 2 },
      { month: "6월", inspected_assets: 35, found_count: 4, remaining_count: 2, redetect_count: 1, plan_registered: 3, plan_approved: 3, result_registered: 2, result_approved: 2, resolved_count: 2 },
    ],
  },
};

// ── 전사 (root) = IT본부와 동일 KPI, dept_summary에 IT본부 표시 ──
export const mockDashboard = {
  ...dept001,
  scope: { role: 1, is_admin: true, selected_dept_id: null, selected_dept_name: "전사", asset_count: 45 },
  dept_summary: [
    { dept_id: "dept-001", dept_name: "IT본부", high_risk_count: 12, unchecked_count: 7, pending_approval_count: 5, inspection_count: 3, command_failures_count: 2, asset_count: 45, completion_rate: 69 },
  ],
  alerts: { urgent: 2, confirm: 4, info: 8, total: 14 },
};

export const DEPT_DATASETS = {
  root:      mockDashboard,
  "dept-001": dept001,
  "dept-002": dept002,
  "dept-003": dept003,
  "dept-004": dept004,
};
