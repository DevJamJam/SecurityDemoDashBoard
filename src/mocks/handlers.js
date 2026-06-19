import { http, HttpResponse, delay } from "msw";
import { mockUser, DEMO_ACCOUNTS } from "./data/auth.mock";
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

const ok = (code) => HttpResponse.json({ RESULT: "OK", CODE: code });
const fail = (msg) => HttpResponse.json({ RESULT: "FAIL", CODE: msg }, { status: 400 });
// 濡쒓렇???몄쬆 ?ㅽ뙣??鍮꾩쫰?덉뒪 濡쒖쭅 ?ㅻ쪟 ??HTTP 200 + RESULT: FAIL (axios媛 throw?섏? ?딆쓬)
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
      asset_cce_uuid: index < source.length ? asset.asset_cce_uuid : `${asset.asset_cce_uuid}-${index + 1}`,
      asset_uuid: index < source.length ? asset.asset_uuid : `${asset.asset_uuid}-${index + 1}`,
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
  vuln_person: asset.ast_operator_person || "-",
  current_step: issue.step_key || "planReg",
  step_label: issue.status || "-",
  created_at: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
  days_open: index + 1,
});

const makeIssues = (asset, type = "all") => {
  const cceCount = Math.max(0, asset?.cce_count ?? 2);
  const cveCount = Math.max(0, asset?.cve_count ?? 1);
  const cce = takeMockItems(issueTemplates.CCE, cceCount).map((issue, index) => ({
    ...issue,
    name: issue.vuln_label,
    asset_uuid: asset?.asset_uuid,
  }));
  const cve = takeMockItems(issueTemplates.CVE, cveCount).map((issue, index) => ({
    ...issue,
    name: issue.vuln_label,
    asset_uuid: asset?.asset_uuid,
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
  // ???????????????????? Auth ????????????????????
  http.post("/api/auth/login", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json();
    if (!body.user_email || !body.user_pw) {
      return authFail("?대찓?쇨낵 鍮꾨?踰덊샇瑜??낅젰?댁＜?몄슂.");
    }
    const matched = DEMO_ACCOUNTS.find(
      (a) => a.user_email === body.user_email && a.user_pw === body.user_pw
    );
    if (!matched) {
      return authFail("?대찓???먮뒗 鍮꾨?踰덊샇媛 ?щ컮瑜댁? ?딆뒿?덈떎.");
    }
    sessionActive = true;
    currentSessionUser = matched;
    return ok(matched);
  }),

  http.post("/api/auth/logout", async () => {
    await delay(MOCK_DELAY);
    sessionActive = false;
    currentSessionUser = null;
    return ok("濡쒓렇?꾩썐 ?꾨즺");
  }),

  http.get("/api/auth/me", async () => {
    await delay(MOCK_DELAY);
    if (!sessionActive || !currentSessionUser) {
      return fail("?몄뀡??留뚮즺?섏뿀?듬땲??");
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
    if (!body.current_pw || !body.new_pw) return fail("?낅젰媛믪씠 ?щ컮瑜댁? ?딆뒿?덈떎.");
    return ok("鍮꾨?踰덊샇 蹂寃??꾨즺");
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
      return fail("?뚯썝媛???꾩닔媛믪씠 ?꾨씫?섏뿀?듬땲??");
    }
    return ok({
      user_index: `usr-${Date.now()}`,
      user_email: body.user_email,
      user_name: body.user_name || "신규 사용자",
      dept_id: body.dept_id || "",
    });
  }),

  // ???????????????????? Org ????????????????????
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
        { user_index: "usr-001", user_name: "愿由ъ옄", user_email: "admin@sedo.dev" },
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

  // ???????????????????? Dashboard ????????????????????
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

    // dept_id 湲곗??쇰줈 ?대떦 ?ш컖?꾩쓽 移댁슫?몃? 議고쉶???щ씪?댁뒪 ??諛곗? ?レ옄? ??긽 ?쇱튂
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
    const asset = getScopedAssets(null).find((item) => item.asset_uuid === body.asset_uuid) || getScopedAssets(null)[0];
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

  // ???????????????????? Bookmark ????????????????????
  http.get("/api/user/bookmark", async () => {
    await delay(MOCK_DELAY);
    return ok({ user_bookmark: { CCE: [], CVE: [], COMMAND: [], DASHBOARD: [], ASSET: [] } });
  }),

  http.post("/api/user/bookmark", async () => {
    await delay(MOCK_DELAY);
    return ok("遺곷쭏??????꾨즺");
  }),

  // ???????????????????? SecurityDemo API (ExecutionMonitor / DashboardHome ?? ????????????????????
  http.get("/api/inspection-plans", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({
      items: [
        { id: "plan-001", title: "서버 정기 보안 점검", targetGroup: "IT인프라", status: "completed", inspectionType: "CCE", score: 82, createdAt: "2024-05-01" },
        { id: "plan-002", title: "개발 환경 취약점 점검", targetGroup: "개발팀", status: "running", inspectionType: "CVE", score: 71, createdAt: "2024-05-15" },
        { id: "plan-003", title: "보안 패치 적용 점검", targetGroup: "전체", status: "pending", inspectionType: "CCE", score: 0, createdAt: "2024-06-01" },
        { id: "plan-004", title: "네트워크 접근 통제 점검", targetGroup: "인프라팀", status: "completed", inspectionType: "CCE", score: 77, createdAt: "2024-04-20" },
        { id: "plan-005", title: "취약점 DB 기준 정밀 스캔", targetGroup: "전체", status: "pending", inspectionType: "CVE", score: 0, createdAt: "2024-06-10" },
      ],
      total: 5,
    });
  }),

  http.get("/api/inspection-plans/:id", async ({ params }) => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({ id: params.id, title: "점검 계획 상세", status: "completed", score: 80 });
  }),

  http.get("/api/execution-jobs", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({
      items: [
        { id: "job-001", title: "서버 일괄 점검 실행", status: "completed", progress: 100, startedAt: "2024-05-10T09:00:00Z", completedAt: "2024-05-10T11:30:00Z" },
        { id: "job-002", title: "취약점 스캔 실행", status: "running", progress: 60, startedAt: "2024-05-20T14:00:00Z" },
        { id: "job-003", title: "패치 배포 스크립트", status: "pending", progress: 0 },
        { id: "job-004", title: "정기 보안 점검 배치", status: "failed", progress: 35, startedAt: "2024-05-18T08:00:00Z" },
      ],
      total: 4,
    });
  }),

  http.get("/api/execution-jobs/:id", async ({ params }) => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({ id: params.id, title: "실행 작업 상세", status: "completed", progress: 100 });
  }),

  http.post("/api/execution-jobs", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ id: `job-${Date.now()}`, ...body, status: "pending", progress: 0 });
  }),

  http.patch("/api/execution-jobs/:id/status", async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ id: params.id, ...body });
  }),

  http.get("/api/network-segments", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({
      items: [
        { id: "seg-001", name: "DMZ 구간", cidr: "192.168.1.0/24", status: "active" },
        { id: "seg-002", name: "내부망", cidr: "10.0.0.0/24", status: "active" },
        { id: "seg-003", name: "관리망", cidr: "172.16.0.0/24", status: "inactive" },
      ],
      total: 3,
    });
  }),

  http.get("/api/network-segments/:id", async ({ params }) => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({ id: params.id, name: "세그먼트 상세", cidr: "10.0.0.0/24", status: "active" });
  }),

  http.patch("/api/network-segments/:id", async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ id: params.id, ...body });
  }),

  http.get("/api/inspection-results", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({ items: [], total: 0 });
  }),

  http.patch("/api/inspection-results/:id", async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ id: params.id, ...body });
  }),

  http.get("/api/assets", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({ items: [], totalCount: 0 });
  }),

  // ???????????????????? Fallback passthrough ????????????????????
];
