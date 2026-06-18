import { http, HttpResponse, delay } from "msw";
import { mockUser, DEMO_ACCOUNTS } from "./data/auth.mock";
import { mockOrgTree } from "./data/org.mock";
import { mockDashboard } from "./data/dashboard.mock";

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
    return ok(mockDashboard);
  }),

  http.post("/api/dashboard/alerts", async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = await request.json();
    const SAMPLE_ALERTS = {
      urgent: [
        { alert_id: "al-001", title: "패스워드 정책 위반 급증", source: "CCE 엔진", occurred_at: new Date(Date.now() - 3600000).toISOString(), message: "개발팀 서버 8대에서 패스워드 정책 위반이 동시에 발생했습니다. 즉각 점검이 필요합니다." },
        { alert_id: "al-002", title: "명령 실행 실패 연속", source: "명령관리", occurred_at: new Date(Date.now() - 7200000).toISOString(), message: "db-server-01에서 명령 실행이 연속으로 실패하고 있습니다." },
      ],
      confirm: [
        { alert_id: "al-003", title: "신규 CVE 취약점 탐지", source: "CVE 엔진", occurred_at: new Date(Date.now() - 86400000).toISOString(), message: "CVE-2024-1234 (Critical) 취약점이 3개 자산에서 탐지되었습니다." },
        { alert_id: "al-004", title: "보안 점수 기준치 미달", source: "대시보드", occurred_at: new Date(Date.now() - 172800000).toISOString(), message: "인프라팀 보안 점수가 기준치(70점) 아래로 떨어졌습니다." },
      ],
      info: [
        { alert_id: "al-005", title: "월간 보안 리포트 생성 완료", source: "리포트", occurred_at: new Date(Date.now() - 259200000).toISOString(), message: "2024년 6월 월간 보안 리포트가 생성되었습니다." },
      ],
    };
    return ok({ items: SAMPLE_ALERTS[body.severity] || [] });
  }),

  http.post("/api/dashboard/pending/summary", async () => {
    await delay(MOCK_DELAY);
    return ok({
      steps: [
        { label: "조치계획등록", key: "planReg", vuln_type: "CCE", count: 3 },
        { label: "조치계획승인", key: "planApproval", vuln_type: "CCE", count: 2 },
        { label: "조치결과등록", key: "resultReg", vuln_type: "CVE", count: 2 },
        { label: "조치결과승인", key: "resultApproval", vuln_type: "CVE", count: 1 },
      ],
    });
  }),

  http.post("/api/dashboard/pending/assets", async () => {
    await delay(MOCK_DELAY);
    return ok({ assets: [] });
  }),

  http.post("/api/dashboard/command-failures", async () => {
    await delay(MOCK_DELAY);
    return ok({ assets: [] });
  }),

  http.post("/api/dashboard/inspections/cce", async () => {
    await delay(MOCK_DELAY);
    return ok({ plans: [] });
  }),

  http.post("/api/dashboard/inspections/cve", async () => {
    await delay(MOCK_DELAY);
    return ok({ scans: [] });
  }),

  http.post("/api/dashboard/unchecked/summary", async () => {
    await delay(MOCK_DELAY);
    return ok({
      categories: [
        { key: "cce_only", label: "CCE 미점검 자산", count: 3 },
        { key: "cve_only", label: "CVE 미점검 자산", count: 2 },
        { key: "both", label: "CCE·CVE 모두 미점검 자산", count: 2 },
      ],
    });
  }),

  http.post("/api/dashboard/unchecked/assets", async () => {
    await delay(MOCK_DELAY);
    return ok({ assets: [] });
  }),

  http.post("/api/dashboard/trend/assets", async () => {
    await delay(MOCK_DELAY);
    return ok({ assets: [] });
  }),

  http.post("/api/dashboard/remediation-history", async () => {
    await delay(MOCK_DELAY);
    return ok({ history: [] });
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
