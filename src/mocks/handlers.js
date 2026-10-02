import { http, HttpResponse, delay } from "msw";
import { DEMO_ACCOUNTS } from "./data/auth.mock";
import { mockOrgTree } from "./data/org.mock";
import { DEPT_DATASETS } from "./data/dashboard.mock";
import {
  getScopedAssets,
  getPendingAssets,
  getCommandFailureAssets,
  getTrendStepAssets,
  getUncheckedAssets,
  MOCK_CCE_PLANS,
  MOCK_CVE_SCANS,
  MOCK_REMEDIATION_HISTORY,
  MOCK_UNCHECKED_SUMMARY,
} from "./data/drilldown.mock";

const MOCK_DELAY = 300;

let sessionActive = false;
let currentSessionUser = null;

// 실행 중 작업 진행률 시뮬레이션 — poll마다 3~6% 증가, 100% 도달 시 completed
const _runSim = { "job-007": 62, "job-008": 45, "job-009": 28, "job-010": 15 };
function tickRunning() {
  for (const id of Object.keys(_runSim)) {
    if (_runSim[id] < 100) _runSim[id] = Math.min(100, _runSim[id] + 3 + Math.floor(Math.random() * 4));
  }
}

// e2e 테스트 전용 — /__test/error-flags 엔드포인트로 제어
const _testErrorFlags = new Set();

const ok = (code) => HttpResponse.json({ RESULT: "OK", CODE: code });
const fail = (msg) => HttpResponse.json({ RESULT: "FAIL", CODE: msg }, { status: 400 });
// 로그인 인증 실패는 HTTP 200 + RESULT: FAIL 반환 (axios가 throw하지 않음)
const authFail = (msg) => HttpResponse.json({ RESULT: "FAIL", CODE: msg });

const getDeptDataset = (deptId) =>
  (deptId && DEPT_DATASETS[deptId]) ? DEPT_DATASETS[deptId] : DEPT_DATASETS.root;

const getDeptId = (body = {}) => body.dept_id || null;

const flattenOrgTree = (nodes = [], parentId = null) =>
  nodes.flatMap((node) => {
    const current = {
      dept_id: node.dept_id,
      dept_name: node.dept_name,
      dept_code: node.dept_code,
      dept_level: node.dept_level,
      dept_order: node.dept_order,
      parent_id: node.parent_id ?? parentId,
      is_active: node.is_active,
      member_count: node.member_count,
      asset_count: node.asset_count,
      dept_leader: node.dept_leader,
    };
    return [current, ...flattenOrgTree(node.children || [], node.dept_id)];
  });

const takeMockAssets = (deptId, count, preferred = []) => {
  const pool = getScopedAssets(deptId);
  const source = preferred.length > 0 ? preferred : pool;
  if (count <= 0 || source.length === 0) return [];

  return Array.from({ length: count }, (_, index) => {
    const asset = source[index % source.length];
    return {
      ...asset,
      inspectionId: index < source.length ? asset.inspectionId : `${asset.inspectionId}-${index + 1}`,
      id: index < source.length ? asset.id : `${asset.id}-${index + 1}`,
    };
  });
};

const takeMockItems = (items, count) => {
  if (count <= 0 || items.length === 0) return [];
  return Array.from({ length: count }, (_, index) => ({
    ...items[index % items.length],
    ccp_index: items[index % items.length].ccp_index
      ? `${items[index % items.length].ccp_index}-${index + 1}`
      : undefined,
    job_id: items[index % items.length].job_id
      ? `${items[index % items.length].job_id}-${index + 1}`
      : undefined,
  }));
};

const issueTemplates = {
  CCE: [
    { vuln_id: "CCE-2024-0001", vuln_label: "패스워드 정책 미준수", severity: "HIGH", status: "조치 진행중", step_key: "planReg" },
    { vuln_id: "CCE-2024-0002", vuln_label: "불필요 서비스 활성화", severity: "MEDIUM", status: "미조치", step_key: "planApproval" },
    { vuln_id: "CCE-2024-0003", vuln_label: "계정 잠금 정책 미설정", severity: "HIGH", status: "승인 대기", step_key: "resultReg" },
  ],
  CVE: [
    { vuln_id: "CVE-2024-1234", vuln_label: "원격 코드 실행 취약점", severity: "CRITICAL", status: "패치 배포중", step_key: "resultReg" },
    { vuln_id: "CVE-2024-5678", vuln_label: "SQL 인젝션 취약점", severity: "HIGH", status: "미조치", step_key: "resultApproval" },
  ],
};

const withAssetContext = (asset, issue, index = 0) => ({
  ...asset,
  ...issue,
  vuln_type: issue.vuln_id?.startsWith("CVE") ? "CVE" : "CCE",
  vuln_person: asset.owner || "-",
  current_step: issue.step_key || "planReg",
  step_label: issue.status || "-",
  created_at: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
  days_open: index + 1,
});

const makeIssues = (asset, type = "all") => {
  const cceCount = Math.max(0, asset?.cce_count ?? 2);
  const cveCount = Math.max(0, asset?.cve_count ?? 1);
  const cce = takeMockItems(issueTemplates.CCE, cceCount).map((issue) => ({
    ...issue,
    name: issue.vuln_label,
    assetId: asset?.id,
  }));
  const cve = takeMockItems(issueTemplates.CVE, cveCount).map((issue) => ({
    ...issue,
    name: issue.vuln_label,
    assetId: asset?.id,
  }));
  if (type === "cce") return { cce_issues: cce, cve_issues: [] };
  if (type === "cve") return { cce_issues: [], cve_issues: cve };
  return { cce_issues: cce, cve_issues: cve };
};

const makeTickets = (deptId, status) => {
  const dataset = getDeptDataset(deptId);
  const count = dataset.ticket_status?.[status]?.count ?? 0;
  const assets = takeMockAssets(deptId, count, getScopedAssets(deptId));
  return assets.map((asset, index) => {
    const issue = index % 2 === 0 ? issueTemplates.CCE[index % issueTemplates.CCE.length] : issueTemplates.CVE[index % issueTemplates.CVE.length];
    return withAssetContext(asset, issue, index);
  });
};

export const handlers = [
  // Auth
  http.post("/api/auth/login", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json();
    if (!body.user_email || !body.user_pw) {
      return authFail("아이디와 비밀번호를 입력해주세요.");
    }
    const matched = DEMO_ACCOUNTS.find(
      (a) => a.user_email === body.user_email && a.user_pw === body.user_pw
    );
    if (!matched) {
      return authFail("아이디 또는 비밀번호를 확인해주세요.");
    }
    sessionActive = true;
    currentSessionUser = matched;
    return ok(matched);
  }),

  http.post("/api/auth/logout", async () => {
    await delay(MOCK_DELAY);
    sessionActive = false;
    currentSessionUser = null;
    return ok("로그아웃 완료");
  }),

  http.get("/api/auth/me", async () => {
    await delay(MOCK_DELAY);
    if (!sessionActive || !currentSessionUser) {
      return fail("세션이 만료되었습니다.");
    }
    const u = currentSessionUser;
    return ok({
      user_index: u.user_index,
      user_name: u.user_name,
      user_roletype_role_index: u.value,
      can_create_root: u.can_create_root,
      is_dept_leader: u.is_dept_leader,
      my_dept_id: u.my_dept_id,
      manageable_dept_ids: u.manageable_dept_ids,
    });
  }),

  http.post("/api/auth/change-password", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json();
    if (!body.current_pw || !body.new_pw) return fail("입력값이 올바르지 않습니다.");
    return ok("비밀번호 변경 완료");
  }),

  http.post("/api/auth/check-email", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const email = body.user_email || body.email || body;
    const duplicated = DEMO_ACCOUNTS.some((account) => account.user_email === email);
    return ok({ duplicated, available: !duplicated });
  }),

  http.post("/api/auth/signup", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    if (!body.user_email || !body.user_pw) {
      return fail("필수 입력값이 누락되었습니다.");
    }
    return ok({
      user_index: `usr-${Date.now()}`,
      user_email: body.user_email,
      user_name: body.user_name || "신규 사용자",
      dept_id: body.dept_id || "",
    });
  }),

  // Org
  http.get("/api/org/tree", async () => {
    await delay(MOCK_DELAY);
    return ok(mockOrgTree);
  }),

  http.get("/api/org/depts", async () => {
    await delay(MOCK_DELAY);
    return ok({ departments: flattenOrgTree(mockOrgTree) });
  }),

  http.get("/api/org/depts/public", async () => {
    await delay(MOCK_DELAY);
    return ok({
      departments: flattenOrgTree(mockOrgTree).map((dept) => ({
        dept_id: dept.dept_id,
        dept_name: dept.dept_name,
        parent_id: dept.parent_id,
      })),
    });
  }),

  http.post("/api/org/depts/check-duplicate", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const depts = flattenOrgTree(mockOrgTree);
    const duplicated = depts.some((dept) =>
      (body.dept_code && dept.dept_code === body.dept_code) ||
      (body.dept_name && dept.dept_name === body.dept_name)
    );
    return ok({ duplicated, available: !duplicated });
  }),

  http.post("/api/org/depts/save", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    return ok({
      dept_id: body.dept_id || `dept-new-${Date.now()}`,
      ...body,
      saved: true,
    });
  }),

  http.post("/api/org/depts/delete", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    return ok({ dept_id: body.dept_id, deleted: true });
  }),

  http.post("/api/org/depts/members", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    return ok({
      dept_id: body.dept_id,
      members: [
        { user_index: "usr-001", user_name: "시스템 관리자", user_email: "admin@sedo.dev" },
        { user_index: "usr-002", user_name: "부서장", user_email: "user@sedo.dev" },
      ],
    });
  }),

  http.post("/api/org/depts/assign-member", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    return ok({ ...body, assigned: true });
  }),

  http.post("/api/org/depts/remove-member", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    return ok({ ...body, removed: true });
  }),

  http.post("/api/org/create", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json();
    return ok({ dept_id: `dept-new-${Date.now()}`, ...body });
  }),

  http.post("/api/org/update", async ({ request }) => {
    await delay(MOCK_DELAY);
    return ok("조직 정보가 업데이트되었습니다.");
  }),

  http.post("/api/org/delete", async () => {
    await delay(MOCK_DELAY);
    return ok("조직이 삭제되었습니다.");
  }),

  // Dashboard
  http.post("/api/dashboard", async ({ request }) => {
    await delay(MOCK_DELAY * 1.5);
    const body = await request.json().catch(() => ({}));
    const deptId = body.dept_id ?? null;
    const data = (deptId && DEPT_DATASETS[deptId]) ? DEPT_DATASETS[deptId] : DEPT_DATASETS["root"];
    return ok(data);
  }),

  http.post("/api/dashboard/alerts", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const { severity, dept_id } = body;

    const ALL_ALERTS = {
      urgent: [
        { alert_id: "al-u001", title: "패스워드 정책 위반 급증", source: "CCE 엔진", occurred_at: new Date(Date.now() - 3600000).toISOString(), message: "여러 서버에서 패스워드 정책 위반이 동시에 발생했습니다." },
        { alert_id: "al-u002", title: "명령 실행 실패 지속", source: "명령관리", occurred_at: new Date(Date.now() - 7200000).toISOString(), message: "db-server-01에서 원격 명령 실행이 연속으로 실패했습니다." },
      ],
      confirm: [
        { alert_id: "al-c001", title: "신규 CVE 취약점 탐지", source: "CVE 엔진", occurred_at: new Date(Date.now() - 86400000).toISOString(), message: "CVE-2024-1234 취약점이 3개 자산에서 탐지되었습니다." },
        { alert_id: "al-c002", title: "보안 점수 기준치 미달", source: "대시보드", occurred_at: new Date(Date.now() - 172800000).toISOString(), message: "보안 점수가 기준치 아래로 하락했습니다." },
        { alert_id: "al-c003", title: "미처리 조치 항목 증가", source: "조치관리", occurred_at: new Date(Date.now() - 259200000).toISOString(), message: "미처리 조치 항목이 증가했습니다." },
        { alert_id: "al-c004", title: "점검 주기 초과 자산 발생", source: "CCE 엔진", occurred_at: new Date(Date.now() - 345600000).toISOString(), message: "점검 주기를 초과한 자산이 발견되었습니다." },
      ],
      info: [
        { alert_id: "al-i001", title: "월간 보안 리포트 생성 완료", source: "리포트", occurred_at: new Date(Date.now() - 259200000).toISOString(), message: "월간 보안 리포트가 생성되었습니다." },
        { alert_id: "al-i002", title: "취약점 스캔 완료", source: "CVE 엔진", occurred_at: new Date(Date.now() - 345600000).toISOString(), message: "전체 자산 취약점 스캔이 완료되었습니다." },
        { alert_id: "al-i003", title: "정기 점검 일정 공지", source: "시스템", occurred_at: new Date(Date.now() - 432000000).toISOString(), message: "다음 주 정기 시스템 점검이 예정되어 있습니다." },
        { alert_id: "al-i004", title: "보안 정책 업데이트 안내", source: "관리자", occurred_at: new Date(Date.now() - 518400000).toISOString(), message: "보안 정책이 업데이트되었습니다." },
        { alert_id: "al-i005", title: "자산 그룹 재편성 완료", source: "자산관리", occurred_at: new Date(Date.now() - 604800000).toISOString(), message: "자산 그룹 재편성 작업이 완료되었습니다." },
        { alert_id: "al-i006", title: "CCE 점검 항목 갱신", source: "CCE 엔진", occurred_at: new Date(Date.now() - 691200000).toISOString(), message: "CCE 점검 항목이 최신 기준으로 갱신되었습니다." },
        { alert_id: "al-i007", title: "원격 명령 이력 정리 완료", source: "명령관리", occurred_at: new Date(Date.now() - 777600000).toISOString(), message: "오래된 원격 명령 실행 이력이 정리되었습니다." },
        { alert_id: "al-i008", title: "분기 통계 업데이트", source: "리포트", occurred_at: new Date(Date.now() - 864000000).toISOString(), message: "분기 시스템 점검 통계가 업데이트되었습니다." },
      ],
    };

    // dept_id 기준으로 해당 부서의 알림 건수를 반환
    const deptData = (dept_id && DEPT_DATASETS[dept_id]) ? DEPT_DATASETS[dept_id] : DEPT_DATASETS["root"];
    const count = deptData?.alerts?.[severity] ?? 0;
    const items = (ALL_ALERTS[severity] || []).slice(0, count);
    return ok({ items });
  }),

  http.post("/api/dashboard/high-risk/summary", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const deptId = getDeptId(body);
    const dataset = getDeptDataset(deptId);
    const rows = (dataset.top_vulnerabilities || []).map((item) => ({
      vuln_type: item.type,
      vuln_id: item.vuln_id,
      vuln_label: item.title,
      severity: item.severity,
      count: item.asset_count ?? 0,
      status: item.status,
    }));
    return ok({
      rows,
      total_cnt: rows.reduce((sum, row) => sum + (row.count || 0), 0),
    });
  }),

  http.post("/api/dashboard/pending/summary", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const kpi = getDeptDataset(getDeptId(body)).kpi;
    return ok({
      steps: [
        { label: "계획검토 대기", key: "planApproval", vuln_type: "CCE", count: kpi.pending_approval?.approval_waiting ?? 0 },
        { label: "결과등록 대기", key: "resultReg", vuln_type: "CVE", count: kpi.pending_approval?.action_waiting ?? 0 },
      ],
    });
  }),

  http.post("/api/dashboard/pending/assets", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const deptId = getDeptId(body);
    const kpi = getDeptDataset(deptId).kpi;
    const count = body.step_key === "planApproval"
      ? kpi.pending_approval?.approval_waiting ?? 0
      : kpi.pending_approval?.action_waiting ?? 0;
    const preferred = getPendingAssets({
      deptId,
      vulnType: body.vuln_type ?? "CCE",
      stepKey: body.step_key ?? "planReg",
    });
    const assets = takeMockAssets(deptId, count, preferred);
    return ok({ assets });
  }),

  http.post("/api/dashboard/command-failures", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const deptId = getDeptId(body);
    const count = getDeptDataset(deptId).kpi.command_failures?.total ?? 0;
    const assets = takeMockAssets(deptId, count, getCommandFailureAssets(deptId));
    return ok({ assets });
  }),

  http.post("/api/dashboard/inspections/cce", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const count = getDeptDataset(getDeptId(body)).kpi.active_inspections?.cce ?? 0;
    return ok({ plans: takeMockItems(MOCK_CCE_PLANS.plans, count) });
  }),

  http.post("/api/dashboard/inspections/cve", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const count = getDeptDataset(getDeptId(body)).kpi.active_inspections?.cve ?? 0;
    return ok({ scans: takeMockItems(MOCK_CVE_SCANS.scans, count) });
  }),

  http.post("/api/dashboard/unchecked/summary", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const kpi = getDeptDataset(getDeptId(body)).kpi.uninspected_assets ?? {};
    return ok({
      categories: MOCK_UNCHECKED_SUMMARY.categories.map((cat) => ({
        ...cat,
        count: kpi[cat.key] ?? 0,
      })),
    });
  }),

  http.post("/api/dashboard/unchecked/assets", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const deptId = getDeptId(body);
    const category = body.category ?? "cce_only";
    const count = getDeptDataset(deptId).kpi.uninspected_assets?.[category] ?? 0;
    const assets = takeMockAssets(
      deptId,
      count,
      getUncheckedAssets({ deptId, category }),
    );
    return ok({ assets });
  }),

  http.post("/api/dashboard/assets", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const deptId = getDeptId(body);
    const count = getDeptDataset(deptId).kpi.managed_assets?.total ?? 0;
    return ok({ assets: takeMockAssets(deptId, count, getScopedAssets(deptId)) });
  }),

  http.post("/api/dashboard/asset-issues", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const asset = getScopedAssets(null).find((item) => item.id === body.asset_id) || getScopedAssets(null)[0];
    const issues = makeIssues(asset, body.type || "all");
    return ok({
      ...issues,
      cce_meta: { total: issues.cce_issues.length },
      cve_meta: { total: issues.cve_issues.length },
    });
  }),

  http.post("/api/dashboard/vulnerability-detail", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const deptId = getDeptId(body);
    const type = body.type || "CCE";
    const template = [...issueTemplates.CCE, ...issueTemplates.CVE].find((issue) => issue.vuln_id === body.vuln_id) || issueTemplates[type]?.[0] || issueTemplates.CCE[0];
    const count = getDeptDataset(deptId).top_vulnerabilities
      ?.find((item) => item.vuln_id === body.vuln_id)?.asset_count ?? 3;
    const assets = takeMockAssets(deptId, count, getScopedAssets(deptId))
      .map((asset, index) => withAssetContext(asset, template, index));
    return ok({
      vuln: {
        type,
        vuln_id: body.vuln_id,
        vuln_label: template.vuln_label,
        severity: template.severity,
      },
      assets,
      total_cnt: assets.length,
    });
  }),

  http.post("/api/dashboard/tickets", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const deptId = getDeptId(body);
    const items = makeTickets(deptId, body.status);
    return ok({
      items,
      total_cnt: items.length,
      current_page: 1,
      total_page: 1,
    });
  }),

  http.post("/api/dashboard/trend/assets", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const assets = getTrendStepAssets({
      deptId: body.dept_id ?? null,
      vulnType: body.vuln_type ?? "CCE",
      month: body.month ?? "6월",
      stepKey: body.step_key ?? "planReg",
    });
    return ok({ assets });
  }),

  http.post("/api/dashboard/remediation-history", async () => {
    await delay(MOCK_DELAY);
    return ok(MOCK_REMEDIATION_HISTORY);
  }),

  // Bookmark
  http.get("/api/user/bookmark", async () => {
    await delay(MOCK_DELAY);
    return ok({ user_bookmark: { CCE: [], CVE: [], COMMAND: [], DASHBOARD: [], ASSET: [] } });
  }),

  http.post("/api/user/bookmark", async () => {
    await delay(MOCK_DELAY);
    return ok("북마크 저장 완료");
  }),

  // SecurityDemo API
  http.get("/api/inspection-plans", async ({ request }) => {
    await delay(MOCK_DELAY);
    if (_testErrorFlags.has("inspection-plans")) return new HttpResponse(null, { status: 500 });
    const url = new URL(request.url);
    const qTitle          = url.searchParams.get("title") || "";
    const qTargetGroup    = url.searchParams.get("targetGroup") || "";
    const qStatus         = url.searchParams.get("status") || "";
    const qInspectionType = url.searchParams.get("inspectionType") || "";
    const page            = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize        = parseInt(url.searchParams.get("pageSize") || "10", 10);

    const ALL = [
      { id: "plan-001", title: "1분기 서버 정기 보안 점검", targetGroup: "IT인프라팀", inspectionType: "server", status: "completed", score: 82, scheduledAt: "2024-03-15" },
      { id: "plan-002", title: "개발 환경 취약점 스캔", targetGroup: "개발1팀", inspectionType: "comprehensive", status: "completed", score: 71, scheduledAt: "2024-03-22" },
      { id: "plan-003", title: "DMZ 구간 네트워크 보안 점검", targetGroup: "인프라팀", inspectionType: "network", status: "completed", score: 88, scheduledAt: "2024-04-05" },
      { id: "plan-004", title: "데이터베이스 접근 제어 점검", targetGroup: "DB팀", inspectionType: "database", status: "completed", score: 76, scheduledAt: "2024-04-10" },
      { id: "plan-005", title: "클라우드 인프라 보안 점검", targetGroup: "클라우드팀", inspectionType: "server", status: "completed", score: 91, scheduledAt: "2024-04-20" },
      { id: "plan-006", title: "ERP 시스템 취약점 점검", targetGroup: "ERP팀", inspectionType: "database", status: "completed", score: 68, scheduledAt: "2024-04-25" },
      { id: "plan-007", title: "2분기 서버 정기 보안 점검", targetGroup: "IT인프라팀", inspectionType: "server", status: "completed", score: 85, scheduledAt: "2024-05-10" },
      { id: "plan-008", title: "무선 네트워크 보안 점검", targetGroup: "네트워크팀", inspectionType: "network", status: "completed", score: 79, scheduledAt: "2024-05-15" },
      { id: "plan-009", title: "업무 PC 취약점 점검", targetGroup: "IT지원팀", inspectionType: "comprehensive", status: "completed", score: 74, scheduledAt: "2024-05-20" },
      { id: "plan-010", title: "방화벽 정책 보안 점검", targetGroup: "보안팀", inspectionType: "network", status: "completed", score: 93, scheduledAt: "2024-05-28" },
      { id: "plan-011", title: "API 서버 보안 취약점 점검", targetGroup: "개발2팀", inspectionType: "server", status: "completed", score: 67, scheduledAt: "2024-06-05" },
      { id: "plan-012", title: "재해복구 시스템 점검", targetGroup: "IT인프라팀", inspectionType: "server", status: "completed", score: 87, scheduledAt: "2024-06-12" },
      { id: "plan-013", title: "3분기 종합 보안 점검", targetGroup: "전체", inspectionType: "comprehensive", status: "in_progress", score: null, scheduledAt: "2024-07-05" },
      { id: "plan-014", title: "내부망 세그먼트 점검", targetGroup: "인프라팀", inspectionType: "network", status: "in_progress", score: null, scheduledAt: "2024-07-10" },
      { id: "plan-015", title: "결제 시스템 보안 점검", targetGroup: "서비스팀", inspectionType: "database", status: "in_progress", score: null, scheduledAt: "2024-07-15" },
      { id: "plan-016", title: "소스코드 취약점 점검", targetGroup: "개발1팀", inspectionType: "comprehensive", status: "in_progress", score: null, scheduledAt: "2024-07-18" },
      { id: "plan-017", title: "VPN 게이트웨이 보안 점검", targetGroup: "네트워크팀", inspectionType: "network", status: "scheduled", score: null, scheduledAt: "2024-08-01" },
      { id: "plan-018", title: "메일 서버 보안 점검", targetGroup: "IT인프라팀", inspectionType: "server", status: "scheduled", score: null, scheduledAt: "2024-08-05" },
      { id: "plan-019", title: "HR 시스템 취약점 점검", targetGroup: "HR팀", inspectionType: "database", status: "scheduled", score: null, scheduledAt: "2024-08-10" },
      { id: "plan-020", title: "3분기 네트워크 전수 점검", targetGroup: "인프라팀", inspectionType: "network", status: "scheduled", score: null, scheduledAt: "2024-08-15" },
      { id: "plan-021", title: "모바일 앱 보안 점검", targetGroup: "개발2팀", inspectionType: "comprehensive", status: "scheduled", score: null, scheduledAt: "2024-08-20" },
      { id: "plan-022", title: "백업 서버 보안 점검", targetGroup: "IT인프라팀", inspectionType: "server", status: "scheduled", score: null, scheduledAt: "2024-08-25" },
      { id: "plan-023", title: "컨테이너 인프라 취약점 점검", targetGroup: "클라우드팀", inspectionType: "server", status: "scheduled", score: null, scheduledAt: "2024-09-01" },
      { id: "plan-024", title: "랜섬웨어 대응 취약점 점검", targetGroup: "보안팀", inspectionType: "comprehensive", status: "scheduled", score: null, scheduledAt: "2024-09-05" },
      { id: "plan-025", title: "외부망 노출 서비스 점검", targetGroup: "인프라팀", inspectionType: "network", status: "scheduled", score: null, scheduledAt: "2024-09-10" },
      { id: "plan-026", title: "CRM 시스템 취약점 점검", targetGroup: "영업팀", inspectionType: "database", status: "failed", score: null, scheduledAt: "2024-06-20" },
      { id: "plan-027", title: "OT 시스템 보안 점검", targetGroup: "제조팀", inspectionType: "server", status: "failed", score: null, scheduledAt: "2024-06-25" },
      { id: "plan-028", title: "4분기 서버 정기 보안 점검", targetGroup: "IT인프라팀", inspectionType: "server", status: "scheduled", score: null, scheduledAt: "2024-10-05" },
      { id: "plan-029", title: "4분기 종합 보안 취약점 점검", targetGroup: "전체", inspectionType: "comprehensive", status: "scheduled", score: null, scheduledAt: "2024-10-15" },
      { id: "plan-030", title: "연말 보안 실태 점검", targetGroup: "전체", inspectionType: "comprehensive", status: "scheduled", score: null, scheduledAt: "2024-12-10" },
    ];

    let filtered = ALL;
    if (qTitle)          filtered = filtered.filter((p) => p.title.includes(qTitle));
    if (qTargetGroup)    filtered = filtered.filter((p) => p.targetGroup.includes(qTargetGroup));
    if (qStatus)         filtered = filtered.filter((p) => p.status === qStatus);
    if (qInspectionType) filtered = filtered.filter((p) => p.inspectionType === qInspectionType);

    const total = filtered.length;
    const items = filtered.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({ items, total });
  }),

  http.get("/api/inspection-plans/:id", async ({ params }) => {
    await delay(MOCK_DELAY);
    const planMap = {
      "plan-001": { title: "1분기 서버 정기 보안 점검", targetGroup: "IT인프라팀", inspectionType: "server", status: "completed", score: 82, scheduledAt: "2024-03-10", completedAt: "2024-03-15", assignee: "김보안", description: "IT 인프라 서버 전체에 대한 1분기 정기 보안 취약점 점검" },
      "plan-002": { title: "개발 환경 취약점 스캔", targetGroup: "개발1팀", inspectionType: "server", status: "completed", score: 71, scheduledAt: "2024-03-20", completedAt: "2024-03-22", assignee: "이담당", description: "개발팀 서버 환경 전반의 취약점 및 설정 오류 점검" },
      "plan-013": { title: "3분기 종합 보안 점검", targetGroup: "전체", inspectionType: "comprehensive", status: "in_progress", score: null, scheduledAt: "2024-07-05", completedAt: null, assignee: "박보안", description: "전사 자산 대상 3분기 종합 보안 점검" },
    };
    const base = planMap[params.id] || { title: "점검 계획 상세", targetGroup: "IT인프라팀", inspectionType: "server", status: "completed", score: 82, scheduledAt: "2024-03-15", completedAt: "2024-03-18", assignee: "김보안", description: "정기 보안 취약점 점검" };
    return HttpResponse.json({
      id: params.id,
      ...base,
      registrationRate: base.score ? Math.floor(base.score * 0.9) : 0,
      assetBreakdown: [
        { type: "서버 (Linux)", score: 85, count: 8 },
        { type: "서버 (Windows)", score: 74, count: 5 },
        { type: "네트워크 장비", score: 91, count: 3 },
        { type: "데이터베이스", score: 68, count: 4 },
      ],
      assetList: [
        { index: 1, name: "web-srv-001", ipAddress: "10.10.1.10", type: "서버(Linux)", status: "completed" },
        { index: 2, name: "web-srv-002", ipAddress: "10.10.1.11", type: "서버(Linux)", status: "completed" },
        { index: 3, name: "db-master-001", ipAddress: "10.10.3.10", type: "DB서버", status: "completed" },
        { index: 4, name: "db-slave-001", ipAddress: "10.10.3.11", type: "DB서버", status: "failed" },
        { index: 5, name: "fw-core-001", ipAddress: "10.10.5.1", type: "방화벽", status: "completed" },
        { index: 6, name: "app-srv-001", ipAddress: "10.10.2.20", type: "서버(Windows)", status: "in_progress" },
      ],
      vulnerabilities: [
        { id: "vuln-001", title: "패스워드 정책 미준수", severity: "high", category: "계정 관리", asset: "web-srv-001", status: "open" },
        { id: "vuln-002", title: "불필요 서비스 (telnet) 활성화", severity: "high", category: "서비스 보안", asset: "db-slave-001", status: "open" },
        { id: "vuln-003", title: "OS 패치 미적용 (CVE-2024-0012)", severity: "medium", category: "패치 관리", asset: "app-srv-001", status: "in_progress" },
        { id: "vuln-004", title: "익명 FTP 접근 허용", severity: "medium", category: "접근 제어", asset: "web-srv-002", status: "resolved" },
        { id: "vuln-005", title: "로그 모니터링 미설정", severity: "low", category: "감사 및 로깅", asset: "fw-core-001", status: "resolved" },
      ],
    });
  }),

  http.get("/api/execution-jobs", async () => {
    await delay(MOCK_DELAY);
    tickRunning();
    const r = (id) => ({ status: _runSim[id] >= 100 ? "completed" : "running", progress: _runSim[id] });
    const items = [
      { id: "job-001", title: "1분기 서버 점검 배치 실행",    targetGroup: "IT인프라팀", status: "completed", progress: 100, startedAt: "2024-03-15T09:00:00Z", completedAt: "2024-03-15T11:45:00Z" },
      { id: "job-002", title: "개발 환경 취약점 스캔 실행",    targetGroup: "개발1팀",   status: "completed", progress: 100, startedAt: "2024-03-22T14:00:00Z", completedAt: "2024-03-22T16:30:00Z" },
      { id: "job-003", title: "DMZ 네트워크 점검 배치",        targetGroup: "인프라팀",  status: "completed", progress: 100, startedAt: "2024-04-05T10:00:00Z", completedAt: "2024-04-05T12:15:00Z" },
      { id: "job-004", title: "DB 접근 제어 점검 실행",        targetGroup: "DB팀",      status: "completed", progress: 100, startedAt: "2024-04-10T09:00:00Z", completedAt: "2024-04-10T10:50:00Z" },
      { id: "job-005", title: "클라우드 인프라 보안 스캔",     targetGroup: "클라우드팀",status: "completed", progress: 100, startedAt: "2024-04-20T08:30:00Z", completedAt: "2024-04-20T10:00:00Z" },
      { id: "job-006", title: "방화벽 정책 점검 실행",         targetGroup: "보안팀",    status: "completed", progress: 100, startedAt: "2024-05-28T09:30:00Z", completedAt: "2024-05-28T10:45:00Z" },
      { id: "job-007", title: "3분기 종합 보안 점검 배치",     targetGroup: "전체",      ...r("job-007"), startedAt: "2024-07-05T09:00:00Z", completedAt: _runSim["job-007"] >= 100 ? "2024-07-05T12:00:00Z" : null },
      { id: "job-008", title: "내부망 세그먼트 점검 실행",     targetGroup: "인프라팀",  ...r("job-008"), startedAt: "2024-07-10T10:00:00Z", completedAt: _runSim["job-008"] >= 100 ? "2024-07-10T13:00:00Z" : null },
      { id: "job-009", title: "결제 시스템 보안 스캔",         targetGroup: "서비스팀",  ...r("job-009"), startedAt: "2024-07-15T11:00:00Z", completedAt: _runSim["job-009"] >= 100 ? "2024-07-15T14:00:00Z" : null },
      { id: "job-010", title: "소스코드 취약점 정적 분석",     targetGroup: "개발1팀",   ...r("job-010"), startedAt: "2024-07-18T14:00:00Z", completedAt: _runSim["job-010"] >= 100 ? "2024-07-18T17:00:00Z" : null },
      { id: "job-011", title: "VPN 게이트웨이 보안 점검",      targetGroup: "네트워크팀",status: "scheduled", progress: 0,   startedAt: null, completedAt: null },
      { id: "job-012", title: "메일 서버 보안 스캔",           targetGroup: "IT인프라팀",status: "scheduled", progress: 0,   startedAt: null, completedAt: null },
      { id: "job-013", title: "HR 시스템 취약점 스캔",         targetGroup: "HR팀",      status: "scheduled", progress: 0,   startedAt: null, completedAt: null },
      { id: "job-014", title: "컨테이너 이미지 취약점 스캔",   targetGroup: "클라우드팀",status: "scheduled", progress: 0,   startedAt: null, completedAt: null },
      { id: "job-015", title: "CRM 시스템 취약점 스캔",        targetGroup: "영업팀",    status: "failed",    progress: 35,  startedAt: "2024-06-20T09:00:00Z", completedAt: null },
      { id: "job-016", title: "OT 시스템 보안 점검 배치",      targetGroup: "제조팀",    status: "failed",    progress: 12,  startedAt: "2024-06-25T10:00:00Z", completedAt: null },
    ];
    return HttpResponse.json({ items, total: items.length });
  }),

  http.get("/api/execution-jobs/:id", async ({ params }) => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({ id: params.id, title: "실행 작업 상세", status: "completed", progress: 100 });
  }),

  http.post("/api/execution-jobs", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ id: `job-${Date.now()}`, ...body, status: "scheduled", progress: 0 });
  }),

  http.patch("/api/execution-jobs/:id/status", async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ id: params.id, ...body });
  }),

  http.get("/api/network-segments", async () => {
    await delay(MOCK_DELAY);
    const items = [
      {
        id: "seg-001", name: "DMZ", nameKo: "비무장지대 (DMZ) 구간",
        cidr: "10.10.1.0/24", ipRange: "10.10.1.1 ~ 10.10.1.254",
        assetCount: 12, status: "active", riskLevel: "high", riskScore: 78,
        vulnerabilityCount: 14, openPortCount: 23,
        lastInspectedAt: "2024-07-10T10:00:00Z",
        description: "외부 인터넷과 내부망 사이에 위치한 비무장지대 구간. 웹 서버, 메일 서버 등 외부 서비스 자산이 위치합니다.",
        tags: ["외부노출", "웹서버", "이메일"],
      },
      {
        id: "seg-002", name: "Internal-LAN", nameKo: "업무 내부망",
        cidr: "10.10.2.0/24", ipRange: "10.10.2.1 ~ 10.10.2.254",
        assetCount: 48, status: "active", riskLevel: "medium", riskScore: 42,
        vulnerabilityCount: 6, openPortCount: 8,
        lastInspectedAt: "2024-07-12T09:00:00Z",
        description: "일반 업무 사용자 PC 및 그룹웨어 서버가 위치하는 내부 업무망 구간입니다.",
        tags: ["업무PC", "그룹웨어", "내부망"],
      },
      {
        id: "seg-003", name: "Management", nameKo: "서버 관리망",
        cidr: "172.16.1.0/24", ipRange: "172.16.1.1 ~ 172.16.1.254",
        assetCount: 8, status: "active", riskLevel: "medium", riskScore: 38,
        vulnerabilityCount: 3, openPortCount: 6,
        lastInspectedAt: "2024-07-08T11:00:00Z",
        description: "서버 원격 관리를 위한 전용 관리망. 점프서버를 통한 접근만 허용됩니다.",
        tags: ["관리망", "점프서버", "SSH"],
      },
      {
        id: "seg-004", name: "DB-Network", nameKo: "데이터베이스 전용망",
        cidr: "172.16.2.0/24", ipRange: "172.16.2.1 ~ 172.16.2.254",
        assetCount: 6, status: "active", riskLevel: "high", riskScore: 65,
        vulnerabilityCount: 9, openPortCount: 4,
        lastInspectedAt: "2024-07-11T14:00:00Z",
        description: "데이터베이스 서버 전용 격리망. 애플리케이션 서버에서만 접근 가능합니다.",
        tags: ["DB서버", "격리망", "MySQL", "Oracle"],
      },
      {
        id: "seg-005", name: "Cloud-VPC", nameKo: "클라우드 VPC",
        cidr: "192.168.10.0/24", ipRange: "192.168.10.1 ~ 192.168.10.254",
        assetCount: 21, status: "active", riskLevel: "low", riskScore: 22,
        vulnerabilityCount: 2, openPortCount: 5,
        lastInspectedAt: "2024-07-09T16:00:00Z",
        description: "퍼블릭 클라우드 환경의 가상 사설 클라우드 구간. 자동화된 보안 그룹 정책이 적용됩니다.",
        tags: ["클라우드", "VPC", "자동화"],
      },
      {
        id: "seg-006", name: "Dev-Network", nameKo: "개발 전용망",
        cidr: "192.168.20.0/24", ipRange: "192.168.20.1 ~ 192.168.20.254",
        assetCount: 15, status: "active", riskLevel: "medium", riskScore: 51,
        vulnerabilityCount: 7, openPortCount: 12,
        lastInspectedAt: "2024-07-05T10:00:00Z",
        description: "개발 및 테스트 서버가 위치한 개발 전용망. 운영망과 물리적으로 분리되어 있습니다.",
        tags: ["개발", "테스트", "CI/CD"],
      },
      {
        id: "seg-007", name: "Backup-Net", nameKo: "백업 전용망",
        cidr: "172.16.3.0/24", ipRange: "172.16.3.1 ~ 172.16.3.254",
        assetCount: 4, status: "active", riskLevel: "low", riskScore: 18,
        vulnerabilityCount: 1, openPortCount: 3,
        lastInspectedAt: "2024-07-03T09:00:00Z",
        description: "데이터 백업 서버 및 스토리지 전용망. 백업 작업 시간대에만 트래픽이 허용됩니다.",
        tags: ["백업", "스토리지"],
      },
      {
        id: "seg-008", name: "Wireless", nameKo: "무선 네트워크",
        cidr: "192.168.30.0/24", ipRange: "192.168.30.1 ~ 192.168.30.254",
        assetCount: 35, status: "active", riskLevel: "medium", riskScore: 55,
        vulnerabilityCount: 5, openPortCount: 9,
        lastInspectedAt: "2024-06-28T15:00:00Z",
        description: "임직원 모바일 기기 및 BYOD 장비 접속을 위한 무선 네트워크 구간입니다.",
        tags: ["무선", "BYOD", "모바일"],
      },
      {
        id: "seg-009", name: "Guest-WiFi", nameKo: "게스트 무선망",
        cidr: "192.168.40.0/24", ipRange: "192.168.40.1 ~ 192.168.40.254",
        assetCount: 0, status: "active", riskLevel: "low", riskScore: 15,
        vulnerabilityCount: 0, openPortCount: 2,
        lastInspectedAt: "2024-06-20T12:00:00Z",
        description: "방문객 및 외부인 인터넷 접속 전용 게스트 무선망. 내부망 접근 완전 차단.",
        tags: ["게스트", "외부인", "인터넷전용"],
      },
      {
        id: "seg-010", name: "OT-Network", nameKo: "OT/ICS 운영 기술망",
        cidr: "10.10.3.0/24", ipRange: "10.10.3.1 ~ 10.10.3.254",
        assetCount: 9, status: "inactive", riskLevel: "high", riskScore: 82,
        vulnerabilityCount: 11, openPortCount: 16,
        lastInspectedAt: "2024-06-15T10:00:00Z",
        description: "제조 설비 및 산업 제어 시스템이 연결된 OT/ICS 망. 현재 점검 중으로 일시 비활성 상태입니다.",
        tags: ["OT", "ICS", "제조", "비활성"],
      },
    ];
    return HttpResponse.json({ items, total: items.length });
  }),

  http.get("/api/network-segments/:id", async ({ params }) => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({ id: params.id, name: "Internal-LAN", nameKo: "업무 내부망", cidr: "10.10.2.0/24", status: "active" });
  }),

  http.patch("/api/network-segments/:id", async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ id: params.id, ...body });
  }),

  http.get("/api/network-connections", async () => {
    await delay(MOCK_DELAY);
    // 망간 연결 관계 — src/dst: 세그먼트 name (영문 ID), counts: { allow, block, total }
    const items = [
      { src: "DMZ",         dst: "Internal-LAN", counts: { allow: 8,  block: 2,  total: 10 }, hasAlert: false },
      { src: "Internal-LAN", dst: "DMZ",         counts: { allow: 3,  block: 7,  total: 10 }, hasAlert: false },
      { src: "Internal-LAN", dst: "DB-Network",  counts: { allow: 10, block: 0,  total: 10 }, hasAlert: false },
      { src: "DB-Network",  dst: "Internal-LAN", counts: { allow: 10, block: 0,  total: 10 }, hasAlert: false },
      { src: "DMZ",         dst: "Cloud-VPC",    counts: { allow: 5,  block: 5,  total: 10 }, hasAlert: true  },
      { src: "Cloud-VPC",   dst: "DMZ",          counts: { allow: 2,  block: 8,  total: 10 }, hasAlert: true  },
      { src: "Internal-LAN", dst: "Dev-Network", counts: { allow: 10, block: 0,  total: 10 }, hasAlert: false },
      { src: "Dev-Network", dst: "Internal-LAN", counts: { allow: 10, block: 0,  total: 10 }, hasAlert: false },
      { src: "Dev-Network", dst: "DB-Network",   counts: { allow: 6,  block: 4,  total: 10 }, hasAlert: false },
      { src: "Management",  dst: "Internal-LAN", counts: { allow: 10, block: 0,  total: 10 }, hasAlert: false },
      { src: "Management",  dst: "DMZ",          counts: { allow: 10, block: 0,  total: 10 }, hasAlert: false },
      { src: "Management",  dst: "DB-Network",   counts: { allow: 8,  block: 2,  total: 10 }, hasAlert: false },
      { src: "OT-Network",  dst: "Management",   counts: { allow: 0,  block: 10, total: 10 }, hasAlert: false },
      { src: "Cloud-VPC",   dst: "Internal-LAN", counts: { allow: 4,  block: 6,  total: 10 }, hasAlert: false },
      { src: "Internal-LAN", dst: "Cloud-VPC",   counts: { allow: 7,  block: 3,  total: 10 }, hasAlert: false },
    ];
    return HttpResponse.json({ items });
  }),

  http.get("/api/inspection-results", async () => {
    await delay(MOCK_DELAY);
    const items = [
      { id: "res-001", planTitle: "1분기 서버 정기 보안 점검", targetGroup: "IT인프라팀", score: 82, reviewStatus: "approved", reviewedAt: "2024-03-18", reviewer: "김보안", comment: "취약점 14건 모두 조치 확인" },
      { id: "res-002", planTitle: "개발 환경 취약점 스캔", targetGroup: "개발1팀", score: 71, reviewStatus: "approved", reviewedAt: "2024-03-25", reviewer: "이담당", comment: "패치 적용 완료, 재점검 권고" },
      { id: "res-003", planTitle: "DMZ 구간 네트워크 보안 점검", targetGroup: "인프라팀", score: 88, reviewStatus: "approved", reviewedAt: "2024-04-08", reviewer: "박관리", comment: "우수한 보안 상태 유지" },
      { id: "res-004", planTitle: "데이터베이스 접근 제어 점검", targetGroup: "DB팀", score: 76, reviewStatus: "approved", reviewedAt: "2024-04-14", reviewer: "최담당", comment: "계정 관리 정책 개선 필요" },
      { id: "res-005", planTitle: "클라우드 인프라 보안 점검", targetGroup: "클라우드팀", score: 91, reviewStatus: "approved", reviewedAt: "2024-04-23", reviewer: "정보안", comment: "보안 그룹 정책 최적화 확인" },
      { id: "res-006", planTitle: "ERP 시스템 취약점 점검", targetGroup: "ERP팀", score: 68, reviewStatus: "approved", reviewedAt: "2024-04-30", reviewer: "한담당", comment: "ERP 계정 권한 재검토 필요" },
      { id: "res-007", planTitle: "2분기 서버 정기 보안 점검", targetGroup: "IT인프라팀", score: 85, reviewStatus: "approved", reviewedAt: "2024-05-14", reviewer: "김보안", comment: "불필요 서비스 2건 비활성화 완료" },
      { id: "res-008", planTitle: "무선 네트워크 보안 점검", targetGroup: "네트워크팀", score: 79, reviewStatus: "approved", reviewedAt: "2024-05-19", reviewer: "이담당", comment: "WPA3 전환 권고 사항 등록" },
      { id: "res-009", planTitle: "업무 PC 취약점 점검", targetGroup: "IT지원팀", score: 74, reviewStatus: "approved", reviewedAt: "2024-05-23", reviewer: "박관리", comment: "OS 업데이트 일괄 배포 완료" },
      { id: "res-010", planTitle: "방화벽 정책 보안 점검", targetGroup: "보안팀", score: 93, reviewStatus: "approved", reviewedAt: "2024-06-01", reviewer: "최담당", comment: "정책 최적화로 보안 강화 확인" },
      { id: "res-011", planTitle: "API 서버 보안 취약점 점검", targetGroup: "개발2팀", score: 67, reviewStatus: "in_review", reviewedAt: "2024-06-10", reviewer: "정보안", comment: null },
      { id: "res-012", planTitle: "재해복구 시스템 점검", targetGroup: "IT인프라팀", score: 87, reviewStatus: "in_review", reviewedAt: null, reviewer: null, comment: null },
      { id: "res-013", planTitle: "소스코드 취약점 점검 (1차)", targetGroup: "개발1팀", score: 72, reviewStatus: "in_review", reviewedAt: null, reviewer: null, comment: null },
      { id: "res-014", planTitle: "VPN 접근 제어 점검", targetGroup: "네트워크팀", score: 81, reviewStatus: "in_review", reviewedAt: null, reviewer: null, comment: null },
      { id: "res-015", planTitle: "메일 서버 보안 점검", targetGroup: "IT인프라팀", score: 76, reviewStatus: "in_review", reviewedAt: null, reviewer: null, comment: null },
      { id: "res-016", planTitle: "HR 시스템 취약점 점검", targetGroup: "HR팀", score: 83, reviewStatus: "pending", reviewedAt: null, reviewer: null, comment: null },
      { id: "res-017", planTitle: "컨테이너 보안 취약점 점검", targetGroup: "클라우드팀", score: 89, reviewStatus: "pending", reviewedAt: null, reviewer: null, comment: null },
      { id: "res-018", planTitle: "외부망 노출 서비스 점검", targetGroup: "인프라팀", score: 64, reviewStatus: "pending", reviewedAt: null, reviewer: null, comment: null },
      { id: "res-019", planTitle: "CRM 데이터 접근 점검", targetGroup: "영업팀", score: 70, reviewStatus: "pending", reviewedAt: null, reviewer: null, comment: null },
      { id: "res-020", planTitle: "결제 시스템 보안 점검 (1차)", targetGroup: "서비스팀", score: 77, reviewStatus: "pending", reviewedAt: null, reviewer: null, comment: null },
      { id: "res-021", planTitle: "백업 시스템 무결성 점검", targetGroup: "IT인프라팀", score: 92, reviewStatus: "pending", reviewedAt: null, reviewer: null, comment: null },
      { id: "res-022", planTitle: "DB 암호화 정책 점검", targetGroup: "DB팀", score: 85, reviewStatus: "pending", reviewedAt: null, reviewer: null, comment: null },
      { id: "res-023", planTitle: "침입 탐지 시스템 점검", targetGroup: "보안팀", score: 88, reviewStatus: "pending", reviewedAt: null, reviewer: null, comment: null },
      { id: "res-024", planTitle: "클라우드 IAM 정책 점검", targetGroup: "클라우드팀", score: 90, reviewStatus: "pending", reviewedAt: null, reviewer: null, comment: null },
    ];
    return HttpResponse.json({ items, total: items.length });
  }),

  http.patch("/api/inspection-results/:id", async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ id: params.id, ...body });
  }),

  http.get("/api/assets", async () => {
    await delay(MOCK_DELAY);
    if (_testErrorFlags.has("assets")) return new HttpResponse(null, { status: 500 });
    const items = [
      { id: "ast-001", name: "web-server-01", ipAddress: "10.10.1.10", type: "server", os: "Ubuntu 22.04", location: "IDC-A 서버실", status: "active", lastScannedAt: "2024-07-10" },
      { id: "ast-002", name: "web-server-02", ipAddress: "10.10.1.11", type: "server", os: "Ubuntu 22.04", location: "IDC-A 서버실", status: "active", lastScannedAt: "2024-07-10" },
      { id: "ast-003", name: "mail-server-01", ipAddress: "10.10.1.20", type: "server", os: "CentOS 7.9", location: "IDC-A 서버실", status: "active", lastScannedAt: "2024-07-08" },
      { id: "ast-004", name: "db-primary-01", ipAddress: "172.16.2.10", type: "db_server", os: "RHEL 8.6", location: "IDC-B 서버실", status: "active", lastScannedAt: "2024-07-11" },
      { id: "ast-005", name: "db-replica-01", ipAddress: "172.16.2.11", type: "db_server", os: "RHEL 8.6", location: "IDC-B 서버실", status: "active", lastScannedAt: "2024-07-11" },
      { id: "ast-006", name: "db-replica-02", ipAddress: "172.16.2.12", type: "db_server", os: "RHEL 8.6", location: "IDC-B 서버실", status: "active", lastScannedAt: "2024-07-09" },
      { id: "ast-007", name: "app-server-01", ipAddress: "10.10.2.10", type: "server", os: "Ubuntu 20.04", location: "IDC-A 서버실", status: "active", lastScannedAt: "2024-07-12" },
      { id: "ast-008", name: "app-server-02", ipAddress: "10.10.2.11", type: "server", os: "Ubuntu 20.04", location: "IDC-A 서버실", status: "active", lastScannedAt: "2024-07-12" },
      { id: "ast-009", name: "batch-server-01", ipAddress: "10.10.2.20", type: "server", os: "CentOS 8.4", location: "IDC-A 서버실", status: "active", lastScannedAt: "2024-07-07" },
      { id: "ast-010", name: "firewall-core", ipAddress: "172.16.1.1", type: "network_device", os: "FortiOS 7.2", location: "네트워크실", status: "active", lastScannedAt: "2024-07-05" },
      { id: "ast-011", name: "switch-core-01", ipAddress: "172.16.1.10", type: "network_device", os: "Cisco IOS 15.2", location: "네트워크실", status: "active", lastScannedAt: "2024-07-05" },
      { id: "ast-012", name: "switch-access-01", ipAddress: "172.16.1.20", type: "network_device", os: "Cisco IOS 15.2", location: "네트워크실", status: "active", lastScannedAt: "2024-07-05" },
      { id: "ast-013", name: "cloud-api-gw-01", ipAddress: "192.168.10.10", type: "cloud_instance", os: "Amazon Linux 2023", location: "AWS ap-northeast-2", status: "active", lastScannedAt: "2024-07-09" },
      { id: "ast-014", name: "cloud-was-01", ipAddress: "192.168.10.20", type: "cloud_instance", os: "Ubuntu 22.04", location: "AWS ap-northeast-2", status: "active", lastScannedAt: "2024-07-09" },
      { id: "ast-015", name: "cloud-was-02", ipAddress: "192.168.10.21", type: "cloud_instance", os: "Ubuntu 22.04", location: "AWS ap-northeast-2", status: "active", lastScannedAt: "2024-07-09" },
      { id: "ast-016", name: "cloud-cache-01", ipAddress: "192.168.10.30", type: "cloud_instance", os: "Amazon Linux 2023", location: "AWS ap-northeast-2", status: "active", lastScannedAt: "2024-07-08" },
      { id: "ast-017", name: "dev-server-01", ipAddress: "192.168.20.10", type: "server", os: "Ubuntu 22.04", location: "개발환경", status: "active", lastScannedAt: "2024-07-05" },
      { id: "ast-018", name: "dev-server-02", ipAddress: "192.168.20.11", type: "server", os: "Ubuntu 22.04", location: "개발환경", status: "active", lastScannedAt: "2024-07-05" },
      { id: "ast-019", name: "ci-runner-01", ipAddress: "192.168.20.20", type: "server", os: "Ubuntu 20.04", location: "개발환경", status: "active", lastScannedAt: "2024-07-04" },
      { id: "ast-020", name: "backup-nas-01", ipAddress: "172.16.3.10", type: "server", os: "TrueNAS 13.0", location: "IDC-B 서버실", status: "active", lastScannedAt: "2024-07-03" },
      { id: "ast-021", name: "jump-server-01", ipAddress: "172.16.1.100", type: "server", os: "Ubuntu 22.04", location: "IDC-A 서버실", status: "active", lastScannedAt: "2024-07-12" },
      { id: "ast-022", name: "monitor-server-01", ipAddress: "172.16.1.110", type: "server", os: "CentOS 8.4", location: "IDC-A 서버실", status: "active", lastScannedAt: "2024-07-06" },
      { id: "ast-023", name: "log-server-01", ipAddress: "10.10.2.50", type: "server", os: "Ubuntu 20.04", location: "IDC-A 서버실", status: "active", lastScannedAt: "2024-07-06" },
      { id: "ast-024", name: "vpn-gateway-01", ipAddress: "10.10.1.5", type: "network_device", os: "Cisco ASA 9.14", location: "네트워크실", status: "active", lastScannedAt: "2024-06-28" },
      { id: "ast-025", name: "ids-sensor-01", ipAddress: "172.16.1.30", type: "network_device", os: "Snort 3.0", location: "네트워크실", status: "active", lastScannedAt: "2024-06-25" },
      { id: "ast-026", name: "erp-app-01", ipAddress: "10.10.2.30", type: "server", os: "Windows Server 2019", location: "IDC-A 서버실", status: "active", lastScannedAt: "2024-06-20" },
      { id: "ast-027", name: "erp-db-01", ipAddress: "172.16.2.20", type: "db_server", os: "Windows Server 2019", location: "IDC-B 서버실", status: "active", lastScannedAt: "2024-06-20" },
      { id: "ast-028", name: "cloud-rds-01", ipAddress: "192.168.10.40", type: "cloud_instance", os: "Amazon RDS MySQL 8.0", location: "AWS ap-northeast-2", status: "active", lastScannedAt: "2024-07-08" },
      { id: "ast-029", name: "ot-controller-01", ipAddress: "10.10.3.10", type: "server", os: "Windows 10 IoT", location: "제조동 제어실", status: "inactive", lastScannedAt: "2024-06-15" },
      { id: "ast-030", name: "ot-plc-01", ipAddress: "10.10.3.20", type: "network_device", os: "Siemens S7", location: "제조동 제어실", status: "inactive", lastScannedAt: "2024-06-15" },
      { id: "ast-031", name: "old-web-server-01", ipAddress: "10.10.1.50", type: "server", os: "CentOS 6.10", location: "IDC-A 서버실", status: "inactive", lastScannedAt: "2024-05-01" },
      { id: "ast-032", name: "legacy-db-01", ipAddress: "172.16.2.50", type: "db_server", os: "Oracle Linux 7", location: "IDC-B 서버실", status: "inactive", lastScannedAt: "2024-05-15" },
      { id: "ast-033", name: "dev-pc-lead", ipAddress: "192.168.20.100", type: "pc", os: "macOS 14.3", location: "개발팀 사무실", status: "active", lastScannedAt: "2024-07-01" },
      { id: "ast-034", name: "admin-workstation-01", ipAddress: "10.10.2.200", type: "pc", os: "Windows 11 Pro", location: "보안팀 사무실", status: "active", lastScannedAt: "2024-07-01" },
      { id: "ast-035", name: "cloud-lambda-01", ipAddress: "192.168.10.50", type: "cloud_instance", os: "AWS Lambda (Node.js 20)", location: "AWS ap-northeast-2", status: "active", lastScannedAt: "2024-07-09" },
    ];
    return HttpResponse.json({ items, total: items.length });
  }),

  // e2e 테스트 전용 — 에러 플래그 설정/초기화 (개발 모드에서만 유효)
  http.post("/__test/error-flags", async ({ request }) => {
    const body = await request.json();
    if (body.clear) _testErrorFlags.clear();
    if (Array.isArray(body.set)) body.set.forEach((f) => _testErrorFlags.add(f));
    return HttpResponse.json({ flags: [..._testErrorFlags] });
  }),

  // Fallback passthrough
];
