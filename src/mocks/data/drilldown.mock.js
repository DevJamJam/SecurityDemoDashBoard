// Drilldown modal mock data. All values are portfolio-safe sample data.

const ASSET_POOL = [
  { inspectionId: "insp-001", id: "ast-001", name: "web-server-01",  ipAddress: "10.0.1.11", risk_level: "HIGH",   vuln_count: 7, cce_count: 5, cve_count: 2, dept_id: "dept-002", owner: "홍길동" },
  { inspectionId: "insp-002", id: "ast-002", name: "api-server-02",  ipAddress: "10.0.1.21", risk_level: "MEDIUM", vuln_count: 3, cce_count: 3, cve_count: 2, dept_id: "dept-002", owner: "홍길동" },
  { inspectionId: "insp-003", id: "ast-003", name: "db-primary-01",  ipAddress: "10.0.3.11", risk_level: "HIGH",   vuln_count: 5, cce_count: 2, cve_count: 1, dept_id: "dept-004", owner: "이인프라" },
  { inspectionId: "insp-004", id: "ast-004", name: "mail-relay-01",  ipAddress: "10.0.2.11", risk_level: "MEDIUM", vuln_count: 2, cce_count: 2, cve_count: 0, dept_id: "dept-003", owner: "박보안" },
  { inspectionId: "insp-005", id: "ast-005", name: "jump-host-01",   ipAddress: "10.0.1.31", risk_level: "LOW",    vuln_count: 1, cce_count: 1, cve_count: 0, dept_id: "dept-002", owner: "홍길동" },
  { inspectionId: "insp-006", id: "ast-006", name: "mon-server-01",  ipAddress: "10.0.2.21", risk_level: "LOW",    vuln_count: 1, cce_count: 1, cve_count: 0, dept_id: "dept-003", owner: "박보안" },
  { inspectionId: "insp-007", id: "ast-007", name: "infra-fw-01",    ipAddress: "10.0.3.21", risk_level: "HIGH",   vuln_count: 4, cce_count: 3, cve_count: 1, dept_id: "dept-004", owner: "이인프라" },
  { inspectionId: "insp-008", id: "ast-008", name: "backup-srv-01",  ipAddress: "10.0.3.31", risk_level: "MEDIUM", vuln_count: 2, cce_count: 2, cve_count: 0, dept_id: "dept-004", owner: "이인프라" },
];

function filterByDept(deptId) {
  if (!deptId) return ASSET_POOL;
  if (deptId === "dept-001") return ASSET_POOL;
  return ASSET_POOL.filter((asset) => asset.dept_id === deptId);
}

export function getScopedAssets(deptId) {
  return filterByDept(deptId);
}

// 각 단계별 대상 자산. dept 분포:
//   dept-002: insp-001, insp-002, insp-005
//   dept-003: insp-004, insp-006
//   dept-004: insp-003, insp-007, insp-008
// → 전사 합산: planReg:4, planApproval:3, resultReg:3, resultApproval:2, resultFix:3, redetect:3
const STEP_ASSET_MAP = {
  planReg:       ["insp-001", "insp-003", "insp-006", "insp-007"],
  planApproval:  ["insp-002", "insp-004", "insp-007"],
  resultReg:     ["insp-001", "insp-004", "insp-008"],
  resultApproval:["insp-003", "insp-006"],
  resultFix:     ["insp-002", "insp-006", "insp-008"],
  redetect:      ["insp-001", "insp-004", "insp-007"],
};

export function getPendingAssets({ deptId, stepKey }) {
  const pool = filterByDept(deptId);
  const ids = STEP_ASSET_MAP[stepKey] || STEP_ASSET_MAP.planReg;
  return pool.filter((asset) => ids.includes(asset.inspectionId));
}

export function getCommandFailureAssets(deptId) {
  return filterByDept(deptId)
    .filter((asset) => asset.risk_level === "HIGH")
    .slice(0, 2);
}

export function getTrendStepAssets({ deptId, month, stepKey }) {
  const base = getPendingAssets({ deptId, stepKey });
  if (month === "6월") return base;
  if (month === "5월") return base.slice(0, Math.max(1, base.length - 1));
  return base.slice(0, Math.max(1, Math.floor(base.length * 0.7)));
}

export function getUncheckedAssets({ deptId, category }) {
  const pool = filterByDept(deptId);
  if (category === "cce_only") return pool.filter((asset) => asset.risk_level !== "LOW").slice(0, 2);
  if (category === "cve_only") return pool.filter((asset) => asset.risk_level === "HIGH").slice(0, 2);
  if (category === "both")     return pool.filter((asset) => asset.risk_level === "HIGH").slice(0, 1);
  return pool.slice(0, 2);
}

export const MOCK_CCE_PLANS = {
  plans: [
    { ccp_index: "ccp-001", ccp_name: "2024년 2분기 정기 점검", target_count: 12, status: "진행중", started_at: "2024-06-01" },
    { ccp_index: "ccp-002", ccp_name: "신규 서버 초기 점검",     target_count: 3,  status: "진행중", started_at: "2024-06-10" },
  ],
};

export const MOCK_CVE_SCANS = {
  scans: [
    { job_id: "job-001", job_name: "전사 CVE 정기 스캔",  target_count: 18, status: "진행중", started_at: "2024-06-05" },
    { job_id: "job-002", job_name: "인프라 긴급 스캔",     target_count: 5,  status: "진행중", started_at: "2024-06-12" },
  ],
};

export const MOCK_REMEDIATION_HISTORY = {
  history: [
    { action: "계획등록", date: "2024-05-02", actor: "홍길동", memo: "정기 점검 결과 반영" },
    { action: "계획검토", date: "2024-05-05", actor: "관리자", memo: "계획 적정성 확인" },
    { action: "결과등록", date: "2024-05-15", actor: "홍길동", memo: "패치 적용 완료" },
    { action: "결과검토", date: "2024-05-18", actor: "관리자", memo: "처리 결과 확인" },
  ],
};

export const MOCK_MANAGED_ASSETS = { assets: ASSET_POOL };

export const MOCK_UNCHECKED_SUMMARY = {
  categories: [
    { key: "cce_only", label: "CCE 미점검 자산", count: 3 },
    { key: "cve_only", label: "CVE 미점검 자산", count: 2 },
    { key: "both",     label: "CCE/CVE 모두 미점검 자산", count: 2 },
  ],
};
