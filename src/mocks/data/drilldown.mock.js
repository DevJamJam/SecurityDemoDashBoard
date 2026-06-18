// 드릴다운 모달에서 사용하는 자산/점검/이력 mock 데이터
// 모든 hostname, IP는 포트폴리오 전용 샘플값 (실무 데이터 무관)

const ASSET_POOL = [
  { ast_uuid: "ast-001", ass_uuid: "ass-001", ast_hostname: "web-app-01",    ast_ipaddr: "10.0.1.11", risk_level: "HIGH",   vuln_count: 7, dept_id: "dept-002", ast_operator_person: "홍길동" },
  { ast_uuid: "ast-002", ass_uuid: "ass-002", ast_hostname: "api-server-02", ast_ipaddr: "10.0.1.21", risk_level: "MEDIUM", vuln_count: 3, dept_id: "dept-002", ast_operator_person: "홍길동" },
  { ast_uuid: "ast-003", ass_uuid: "ass-003", ast_hostname: "db-primary-01", ast_ipaddr: "10.0.3.11", risk_level: "HIGH",   vuln_count: 5, dept_id: "dept-004", ast_operator_person: "이인프라" },
  { ast_uuid: "ast-004", ass_uuid: "ass-004", ast_hostname: "mail-relay-01", ast_ipaddr: "10.0.2.11", risk_level: "MEDIUM", vuln_count: 2, dept_id: "dept-003", ast_operator_person: "박보안" },
  { ast_uuid: "ast-005", ass_uuid: "ass-005", ast_hostname: "jump-host-01",  ast_ipaddr: "10.0.1.31", risk_level: "LOW",    vuln_count: 1, dept_id: "dept-002", ast_operator_person: "홍길동" },
  { ast_uuid: "ast-006", ass_uuid: "ass-006", ast_hostname: "mon-server-01", ast_ipaddr: "10.0.2.21", risk_level: "LOW",    vuln_count: 1, dept_id: "dept-003", ast_operator_person: "박보안" },
  { ast_uuid: "ast-007", ass_uuid: "ass-007", ast_hostname: "infra-fw-01",   ast_ipaddr: "10.0.3.21", risk_level: "HIGH",   vuln_count: 4, dept_id: "dept-004", ast_operator_person: "이인프라" },
  { ast_uuid: "ast-008", ass_uuid: "ass-008", ast_hostname: "backup-srv-01", ast_ipaddr: "10.0.3.31", risk_level: "MEDIUM", vuln_count: 2, dept_id: "dept-004", ast_operator_person: "이인프라" },
];

function filterByDept(deptId) {
  if (!deptId) return ASSET_POOL;
  if (deptId === "dept-001") return ASSET_POOL; // 본부 = 전체 하위 포함
  return ASSET_POOL.filter((a) => a.dept_id === deptId);
}

// 단계별 자산 배분 (stepKey → ast_uuid 목록)
const STEP_ASSET_MAP = {
  planReg:        ["ast-001", "ast-003", "ast-007"],
  planApproval:   ["ast-002", "ast-004"],
  resultReg:      ["ast-001", "ast-008"],
  resultApproval: ["ast-003"],
  resultFix:      ["ast-002", "ast-006"],
  redetect:       ["ast-001", "ast-007"],
};

export function getPendingAssets({ deptId, vulnType, stepKey }) {
  const pool = filterByDept(deptId);
  const ids = STEP_ASSET_MAP[stepKey] || STEP_ASSET_MAP.planReg;
  return pool.filter((a) => ids.includes(a.ast_uuid));
}

export function getCommandFailureAssets(deptId) {
  return filterByDept(deptId)
    .filter((a) => a.risk_level === "HIGH")
    .slice(0, 2);
}

export function getTrendStepAssets({ deptId, vulnType, month, stepKey }) {
  const base = getPendingAssets({ deptId, vulnType, stepKey });
  // 월별로 소폭 다른 결과 반환 (포트폴리오에서 변화 확인 가능하도록)
  if (month === "6월") return base;
  if (month === "5월") return base.slice(0, Math.max(1, base.length - 1));
  return base.slice(0, Math.max(1, Math.floor(base.length * 0.7)));
}

export function getUncheckedAssets({ deptId, category }) {
  const pool = filterByDept(deptId);
  if (category === "cce_only") return pool.filter((a) => a.risk_level !== "LOW").slice(0, 2);
  if (category === "cve_only") return pool.filter((a) => a.risk_level === "HIGH").slice(0, 2);
  if (category === "both")     return pool.filter((a) => a.risk_level === "HIGH").slice(0, 1);
  return pool.slice(0, 2);
}

// 진행 중 CCE 점검 계획
export const MOCK_CCE_PLANS = {
  plans: [
    { ccp_index: "ccp-001", ccp_name: "2024년 2분기 정기 점검", target_count: 12, status: "진행중", started_at: "2024-06-01" },
    { ccp_index: "ccp-002", ccp_name: "신규 서버 초기 점검",     target_count: 3,  status: "진행중", started_at: "2024-06-10" },
  ],
};

// 진행 중 CVE 스캔
export const MOCK_CVE_SCANS = {
  scans: [
    { job_id: "job-001", job_name: "전사 CVE 정기 스캔", target_count: 18, status: "진행중", started_at: "2024-06-05" },
    { job_id: "job-002", job_name: "인프라 긴급 스캔",   target_count: 5,  status: "진행중", started_at: "2024-06-12" },
  ],
};

// 조치 이력
export const MOCK_REMEDIATION_HISTORY = {
  history: [
    { action: "조치계획 등록", date: "2024-05-02", actor: "홍길동", memo: "정기 점검 결과 반영" },
    { action: "조치계획 승인", date: "2024-05-05", actor: "관리자", memo: "계획 적절 확인"     },
    { action: "조치 결과 등록", date: "2024-05-15", actor: "홍길동", memo: "패치 적용 완료"    },
    { action: "조치 결과 승인", date: "2024-05-18", actor: "관리자", memo: "처리 결과 확인"    },
  ],
};

// 관리 자산 목록 (페이지 이동 유도용 placeholder)
export const MOCK_MANAGED_ASSETS = { assets: ASSET_POOL };

// 미점검 자산 요약 (category 별)
export const MOCK_UNCHECKED_SUMMARY = {
  categories: [
    { key: "cce_only", label: "CCE 미점검 자산",          count: 3 },
    { key: "cve_only", label: "CVE 미점검 자산",          count: 2 },
    { key: "both",     label: "CCE·CVE 모두 미점검 자산", count: 2 },
  ],
};
