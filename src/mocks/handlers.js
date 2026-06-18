import { http, HttpResponse, delay } from "msw";
import { mockUser, DEMO_ACCOUNTS } from "./data/auth.mock";
import { mockOrgTree } from "./data/org.mock";
import { DEPT_DATASETS } from "./data/dashboard.mock";
import {
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
// 로그인 인증 실패는 비즈니스 로직 오류 → HTTP 200 + RESULT: FAIL (axios가 throw하지 않음)
const authFail = (msg) => HttpResponse.json({ RESULT: "FAIL", CODE: msg });

export const handlers = [
  // ──────────────────── Auth ────────────────────
  http.post("/api/auth/login", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json();
    if (!body.user_email || !body.user_pw) {
      return authFail("이메일과 비밀번호를 입력해주세요.");
    }
    const matched = DEMO_ACCOUNTS.find(
      (a) => a.user_email === body.user_email && a.user_pw === body.user_pw
    );
    if (!matched) {
      return authFail("이메일 또는 비밀번호가 올바르지 않습니다.");
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

  // ──────────────────── Org ────────────────────
  http.get("/api/org/tree", async () => {
    await delay(MOCK_DELAY);
    return ok(mockOrgTree);
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

  // ──────────────────── Dashboard ────────────────────
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

    // 최대 카운트 기준: root urgent=2, confirm=4, info=8
    const ALL_ALERTS = {
      urgent: [
        { alert_id: "al-u001", title: "패스워드 정책 위반 급증", source: "CCE 엔진", occurred_at: new Date(Date.now() - 3600000).toISOString(), message: "서버 8대에서 패스워드 정책 위반이 동시에 발생했습니다. 즉각 점검이 필요합니다." },
        { alert_id: "al-u002", title: "명령 실행 실패 연속", source: "명령관리", occurred_at: new Date(Date.now() - 7200000).toISOString(), message: "db-server-01에서 원격 명령 실행이 연속으로 실패하고 있습니다." },
      ],
      confirm: [
        { alert_id: "al-c001", title: "신규 CVE 취약점 탐지", source: "CVE 엔진", occurred_at: new Date(Date.now() - 86400000).toISOString(), message: "CVE-2024-1234 (Critical) 취약점이 3개 자산에서 탐지되었습니다." },
        { alert_id: "al-c002", title: "보안 점수 기준치 미달", source: "대시보드", occurred_at: new Date(Date.now() - 172800000).toISOString(), message: "보안 점수가 기준치(70점) 아래로 떨어졌습니다. 점검이 필요합니다." },
        { alert_id: "al-c003", title: "미처리 조치 항목 증가", source: "조치관리", occurred_at: new Date(Date.now() - 259200000).toISOString(), message: "이번 주 미처리 조치 항목이 5건 증가하였습니다." },
        { alert_id: "al-c004", title: "점검 주기 초과 자산 발생", source: "CCE 엔진", occurred_at: new Date(Date.now() - 345600000).toISOString(), message: "점검 주기를 초과한 자산이 4개 감지되었습니다." },
      ],
      info: [
        { alert_id: "al-i001", title: "월간 보안 리포트 생성 완료", source: "리포트", occurred_at: new Date(Date.now() - 259200000).toISOString(), message: "이번 달 보안 리포트가 생성되었습니다." },
        { alert_id: "al-i002", title: "취약점 스캔 완료", source: "CVE 엔진", occurred_at: new Date(Date.now() - 345600000).toISOString(), message: "전체 자산 취약점 스캔이 완료되었습니다. 신규 탐지 3건." },
        { alert_id: "al-i003", title: "정기 점검 일정 공지", source: "시스템", occurred_at: new Date(Date.now() - 432000000).toISOString(), message: "다음 주 정기 시스템 점검이 예정되어 있습니다." },
        { alert_id: "al-i004", title: "보안 정책 업데이트 안내", source: "관리자", occurred_at: new Date(Date.now() - 518400000).toISOString(), message: "보안 정책이 업데이트되었습니다. 내용을 확인하세요." },
        { alert_id: "al-i005", title: "자산 그룹 재편성 완료", source: "자산관리", occurred_at: new Date(Date.now() - 604800000).toISOString(), message: "자산 그룹 재편성 작업이 완료되었습니다." },
        { alert_id: "al-i006", title: "CCE 점검 항목 갱신", source: "CCE 엔진", occurred_at: new Date(Date.now() - 691200000).toISOString(), message: "CCE 점검 항목이 최신 기준으로 갱신되었습니다." },
        { alert_id: "al-i007", title: "원격 명령 이력 정리 완료", source: "명령관리", occurred_at: new Date(Date.now() - 777600000).toISOString(), message: "90일 이전 원격 명령 실행 이력이 자동 정리되었습니다." },
        { alert_id: "al-i008", title: "분기 통계 업데이트", source: "리포트", occurred_at: new Date(Date.now() - 864000000).toISOString(), message: "이번 분기 시스템 점검 통계가 업데이트되었습니다." },
      ],
    };

    // dept_id 기준으로 해당 심각도의 카운트를 조회해 슬라이스 → 배지 숫자와 항상 일치
    const deptData = (dept_id && DEPT_DATASETS[dept_id]) ? DEPT_DATASETS[dept_id] : DEPT_DATASETS["root"];
    const count = deptData?.alerts?.[severity] ?? 0;
    const items = (ALL_ALERTS[severity] || []).slice(0, count);
    return ok({ items });
  }),

  http.post("/api/dashboard/pending/summary", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const deptId = body.dept_id ?? null;
    const dataset = (deptId && DEPT_DATASETS[deptId]) ? DEPT_DATASETS[deptId] : DEPT_DATASETS["root"];
    const kpi = dataset.kpi;
    return ok({
      steps: [
        { label: "조치계획등록", key: "planReg",        vuln_type: "CCE", count: getPendingAssets({ deptId, vulnType: "CCE", stepKey: "planReg" }).length },
        { label: "조치계획승인", key: "planApproval",   vuln_type: "CCE", count: getPendingAssets({ deptId, vulnType: "CCE", stepKey: "planApproval" }).length },
        { label: "조치결과등록", key: "resultReg",      vuln_type: "CVE", count: getPendingAssets({ deptId, vulnType: "CVE", stepKey: "resultReg" }).length },
        { label: "조치결과승인", key: "resultApproval", vuln_type: "CVE", count: getPendingAssets({ deptId, vulnType: "CVE", stepKey: "resultApproval" }).length },
      ],
    });
  }),

  http.post("/api/dashboard/pending/assets", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const assets = getPendingAssets({
      deptId: body.dept_id ?? null,
      vulnType: body.vuln_type ?? "CCE",
      stepKey: body.step_key ?? "planReg",
    });
    return ok({ assets });
  }),

  http.post("/api/dashboard/command-failures", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const assets = getCommandFailureAssets(body.dept_id ?? null);
    return ok({ assets });
  }),

  http.post("/api/dashboard/inspections/cce", async () => {
    await delay(MOCK_DELAY);
    return ok(MOCK_CCE_PLANS);
  }),

  http.post("/api/dashboard/inspections/cve", async () => {
    await delay(MOCK_DELAY);
    return ok(MOCK_CVE_SCANS);
  }),

  http.post("/api/dashboard/unchecked/summary", async ({ request }) => {
    await delay(MOCK_DELAY);
    return ok(MOCK_UNCHECKED_SUMMARY);
  }),

  http.post("/api/dashboard/unchecked/assets", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json().catch(() => ({}));
    const assets = getUncheckedAssets({
      deptId: body.dept_id ?? null,
      category: body.category ?? "cce_only",
    });
    return ok({ assets });
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

  // ──────────────────── Bookmark ────────────────────
  http.get("/api/bookmark", async () => {
    await delay(MOCK_DELAY);
    return ok({ user_bookmark: { CCE: [], CVE: [], COMMAND: [], DASHBOARD: [], ASSET: [] } });
  }),

  http.post("/api/bookmark", async () => {
    await delay(MOCK_DELAY);
    return ok("북마크 저장 완료");
  }),

  // ──────────────────── Fallback passthrough ────────────────────
];
