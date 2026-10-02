import { test, expect } from "@playwright/test";

const ADMIN = { email: "admin@sedo.dev", password: "Admin1234!" };
// baseURL = http://localhost:8081/SecurityDemoDashBoard
// page.goto("./") → /SecurityDemoDashBoard/  (root)
// page.goto("./sedo/...") → /SecurityDemoDashBoard/sedo/...

async function login(page) {
  await page.goto("./");
  await page.locator('input[type="email"], input:not([type="password"])').first().fill(ADMIN.email);
  await page.locator('input[type="password"]').fill(ADMIN.password);
  await page.locator("button.login_btn").click();
  await page.waitForURL("**/dashboard**", { timeout: 10000 });
}

test.describe("로그인 화면", () => {
  test("레이아웃: 좌우 스플릿, 로고 표시", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator(".auth-brand")).toBeVisible();
    await expect(page.locator(".auth-brand__logo")).toBeVisible();
    await expect(page.locator(".auth-form-panel")).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/login.png", fullPage: true });
  });

  test("빈 입력으로 로그인 시도 → 경고 다이얼로그", async ({ page }) => {
    await page.goto("./");
    await page.locator("button.login_btn").click();
    await expect(page.locator(".swal2-title")).toContainText("입력 필요");
    await page.screenshot({ path: "e2e/screenshots/login-empty-warn.png" });
    await page.locator(".swal2-confirm").click();
  });

  test("잘못된 계정으로 로그인 → 에러 다이얼로그 (한글 정상 출력)", async ({ page }) => {
    await page.goto("./");
    await page.locator('input').first().fill("wrong@test.com");
    await page.locator('input[type="password"]').fill("wrongpw");
    await page.locator("button.login_btn").click();
    await expect(page.locator(".swal2-title")).toContainText("로그인 실패");
    const text = await page.locator(".swal2-html-container").textContent();
    // 깨진 문자 없는지 확인 (한글이 아닌 중국어/특수문자 없어야 함)
    expect(text).not.toMatch(/[鍮濡踰댁뙣덉뒿쫰]/);
    expect(text).toMatch(/[가-힣]/);
    await page.screenshot({ path: "e2e/screenshots/login-fail-dialog.png" });
    await page.locator(".swal2-confirm").click();
  });

  test("정상 로그인 → 대시보드 이동", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
    await page.screenshot({ path: "e2e/screenshots/dashboard.png", fullPage: true });
  });
});

// 대시보드 로드 + AdminDetailModal(zIndex:8000) 열릴 때까지 대기하는 헬퍼
async function waitForDashboard(page) {
  await expect(
    page.locator(".design4-main-board, .admin-content-card, [class*='kpi']").first()
  ).toBeVisible({ timeout: 12000 });
}

async function expectModalOpen(page) {
  // AdminDetailModal은 inline style position:fixed zIndex:8000으로 렌더링
  const overlay = page.locator("div[style*='z-index: 8000']");
  await expect(overlay).toBeVisible({ timeout: 8000 });
  await expect(page).toHaveURL(/dashboard/, { timeout: 3000 });
}

test.describe("대시보드", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForDashboard(page);
  });

  test("KPI 카드 렌더링", async ({ page }) => {
    await page.screenshot({ path: "e2e/screenshots/dashboard-kpi.png", fullPage: true });
  });

  test("조직 트리 패널 표시", async ({ page }) => {
    const orgPanel = page.locator(".org-tree, [class*='org'], [class*='tree']").first();
    await expect(orgPanel).toBeVisible({ timeout: 8000 });
  });

  test("주요 이슈 위험 자산 테이블 — 자산명/IP 렌더링 확인", async ({ page }) => {
    const table = page.locator(".design4-data-table--assets").first();
    await expect(table).toBeVisible({ timeout: 10000 });
    const firstNameCell = table.locator("tbody tr").first().locator("td").first();
    const nameText = await firstNameCell.textContent({ timeout: 5000 });
    expect(nameText?.trim()).not.toBe("");
    await page.screenshot({ path: "e2e/screenshots/dashboard-issue-table.png" });
  });

  test("주요 이슈 상세보기 모달 — 데이터 로드 및 로그인 미튕김", async ({ page }) => {
    const table = page.locator(".design4-data-table--assets").first();
    await expect(table).toBeVisible({ timeout: 10000 });
    await table.locator(".admin-inline-link-btn").first().click();
    await expectModalOpen(page);
    await page.screenshot({ path: "e2e/screenshots/dashboard-asset-modal.png", fullPage: true });
  });

  test("주요 이슈 각 행 상세보기 — 행별로 다른 자산명 표시", async ({ page }) => {
    const table = page.locator(".design4-data-table--assets").first();
    await expect(table).toBeVisible({ timeout: 10000 });
    const rows = table.locator("tbody tr");
    const count = await rows.count();
    if (count < 2) return; // 행이 1개 이하면 스킵

    // 첫 번째 행 상세보기 → 자산명 캡처
    await rows.nth(0).locator(".admin-inline-link-btn").click();
    await expectModalOpen(page);
    const firstTitle = await page.locator("div[style*='z-index: 8000'] h2").textContent();

    // 닫기
    await page.locator("div[style*='z-index: 8000'] button[type='button']").last().click();
    await expect(page.locator("div[style*='z-index: 8000']")).not.toBeVisible({ timeout: 3000 });

    // 두 번째 행 상세보기 → 자산명이 첫 번째와 달라야 함
    await rows.nth(1).locator(".admin-inline-link-btn").click();
    await expectModalOpen(page);
    const secondTitle = await page.locator("div[style*='z-index: 8000'] h2").textContent();

    expect(firstTitle?.trim()).not.toBe(secondTitle?.trim());
    await page.screenshot({ path: "e2e/screenshots/dashboard-asset-modal-row2.png", fullPage: true });
  });

  test("KPI 칩 — 위험탐지 클릭 시 고위험 취약점 모달 열림", async ({ page }) => {
    const chip = page.locator(".scope-chip--danger").first();
    const visible = await chip.isVisible().catch(() => false);
    if (!visible) { test.skip(); return; }
    await chip.click();
    await expectModalOpen(page);
    await page.screenshot({ path: "e2e/screenshots/dashboard-chip-danger.png", fullPage: true });
  });

  test("KPI 칩 — 미처리 클릭 시 승인대기 모달 열림", async ({ page }) => {
    const chip = page.locator(".scope-chip--warning").first();
    const visible = await chip.isVisible().catch(() => false);
    if (!visible) { test.skip(); return; }
    await chip.click();
    await expectModalOpen(page);
    await page.screenshot({ path: "e2e/screenshots/dashboard-chip-warning.png", fullPage: true });
  });

  test("KPI 칩 — 명령오류 클릭 시 명령실패 자산 모달 열림", async ({ page }) => {
    const chip = page.locator(".scope-chip--command").first();
    const visible = await chip.isVisible().catch(() => false);
    if (!visible) { test.skip(); return; }
    await chip.click();
    await expectModalOpen(page);
    await page.screenshot({ path: "e2e/screenshots/dashboard-chip-command.png", fullPage: true });
  });

  test("KPI 칩 — 점검범위 클릭 시 관리자산 모달 열림", async ({ page }) => {
    const chip = page.locator(".scope-chip--neutral").first();
    const visible = await chip.isVisible().catch(() => false);
    if (!visible) { test.skip(); return; }
    await chip.click();
    await expectModalOpen(page);
    await page.screenshot({ path: "e2e/screenshots/dashboard-chip-neutral.png", fullPage: true });
  });

  test("월별 추이 테이블 — CCE 탭 '보기' 클릭 시 추이 상세 모달 열림", async ({ page }) => {
    // admin-trend-matrix-table 내의 '보기' 버튼
    const viewBtn = page.locator(".admin-trend-matrix-table .admin-inline-link-btn").first();
    const visible = await viewBtn.isVisible({ timeout: 8000 }).catch(() => false);
    if (!visible) { test.skip(); return; }
    await viewBtn.click();
    await expectModalOpen(page);
    await page.screenshot({ path: "e2e/screenshots/dashboard-trend-modal.png", fullPage: true });
  });

  test("취약점 목록 — 취약점 행 클릭 시 취약점 상세 모달 열림", async ({ page }) => {
    const vulnTable = page.locator(".design4-data-table--vulns");
    const visible = await vulnTable.isVisible({ timeout: 8000 }).catch(() => false);
    if (!visible) { test.skip(); return; }
    const firstRow = vulnTable.locator("tbody tr").first();
    const rowVisible = await firstRow.isVisible().catch(() => false);
    if (!rowVisible) { test.skip(); return; }
    await firstRow.click();
    await expectModalOpen(page);
    await page.screenshot({ path: "e2e/screenshots/dashboard-vuln-modal.png", fullPage: true });
  });
});

async function navTo(page, labelText, urlPattern) {
  await page.locator(".sedo-nav__icon-label", { hasText: labelText }).click();
  await page.waitForURL(urlPattern, { timeout: 8000 });
}

test.describe("점검 계획", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navTo(page, "점검 계획", "**/inspection-plans**");
  });

  test("목록 테이블 렌더링", async ({ page }) => {
    await expect(page.locator("table.common-table").first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "e2e/screenshots/inspection-plans.png", fullPage: true });
  });

  test("행 클릭 → 상세 페이지 이동", async ({ page }) => {
    const firstRow = page.locator("tbody tr.clickable").first();
    await expect(firstRow).toBeVisible({ timeout: 8000 });
    await firstRow.click();
    await page.waitForURL("**/inspection-plans/**", { timeout: 5000 });
    // 상세 페이지 콘텐츠 로딩 대기
    await expect(page.locator(".pd-top-panel").first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "e2e/screenshots/inspection-plan-detail.png", fullPage: true });
  });
});

test.describe("실행 모니터", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navTo(page, "실행 모니터", "**/execution-monitor**");
  });

  test("작업 목록 렌더링", async ({ page }) => {
    await expect(page.locator(".execution-grid").first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: "e2e/screenshots/execution-monitor.png", fullPage: true });
  });

  test("상태 필터 — '완료' 클릭 시 카드 수 변경", async ({ page }) => {
    await expect(page.locator(".execution-grid").first()).toBeVisible({ timeout: 10000 });
    const allCount = await page.locator(".execution-card").count();
    await page.locator(".exec-toolbar__filter-btn", { hasText: "완료" }).click();
    const filteredCount = await page.locator(".execution-card").count();
    // 완료 상태만 보여야 하므로 전체보다 적거나 같아야 함
    expect(filteredCount).toBeLessThanOrEqual(allCount);
    await page.screenshot({ path: "e2e/screenshots/execution-monitor-filter.png", fullPage: true });
  });
});

test.describe("결과 조회", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navTo(page, "결과 조회", "**/result-review**");
  });

  test("결과 테이블 렌더링", async ({ page }) => {
    await expect(page.locator("table.common-table").first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "e2e/screenshots/result-review.png", fullPage: true });
  });

  test("행 클릭 → 상세 모달 열림", async ({ page }) => {
    const firstRow = page.locator("tbody tr.clickable").first();
    await expect(firstRow).toBeVisible({ timeout: 8000 });
    await firstRow.click();
    await expect(page.locator(".modal-overlay")).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: "e2e/screenshots/result-review-modal.png", fullPage: true });
  });

  test("승인 버튼 → SweetAlert2 확인 다이얼로그 표시", async ({ page }) => {
    const approveBtn = page.locator("button", { hasText: "승인" }).first();
    const visible = await approveBtn.isVisible({ timeout: 8000 }).catch(() => false);
    if (!visible) { test.skip(); return; }
    await approveBtn.click();
    await expect(page.locator(".swal2-title")).toBeVisible({ timeout: 5000 });
    await page.locator(".swal2-cancel").click();
    await page.screenshot({ path: "e2e/screenshots/result-review-approve.png", fullPage: true });
  });
});

test.describe("자산 관리", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navTo(page, "자산 관리", "**/assets**");
  });

  test("자산 테이블 렌더링", async ({ page }) => {
    await expect(page.locator("table.common-table").first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "e2e/screenshots/assets.png", fullPage: true });
  });

  test("행 클릭 → 자산 상세 모달 열림 및 IP 주소 표시", async ({ page }) => {
    const firstRow = page.locator("tbody tr.clickable").first();
    await expect(firstRow).toBeVisible({ timeout: 8000 });
    await firstRow.click();
    await expect(page.locator(".modal-overlay")).toBeVisible({ timeout: 5000 });
    // 모달 내 IP 주소(code 태그) 가 표시되는지 확인
    await expect(page.locator(".modal code").first()).toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: "e2e/screenshots/assets-modal.png", fullPage: true });
    // 오버레이 클릭으로 닫힘 확인
    await page.locator(".modal-overlay").click({ position: { x: 10, y: 10 } });
    await expect(page.locator(".modal-overlay")).not.toBeVisible({ timeout: 3000 });
  });
});

// MSW 에러 플래그를 설정/해제하는 헬퍼
// MSW Service Worker가 /__test/error-flags 엔드포인트를 처리하므로
// page.evaluate()로 fetch 호출 시 MSW가 받아서 모듈 레벨 플래그를 변경
async function setMswError(page, endpoints = []) {
  await page.evaluate(
    (eps) =>
      fetch("/__test/error-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ set: eps }),
      }),
    endpoints
  );
}

async function clearMswErrors(page) {
  await page.evaluate(() =>
    fetch("/__test/error-flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear: true }),
    })
  );
}

test.describe("에러 상태 — API 500 시뮬레이션", () => {
  test.afterEach(async ({ page }) => {
    await clearMswErrors(page);
  });

  test("자산 관리 — API 500 시 에러 메시지 표시", async ({ page }) => {
    await login(page);
    await setMswError(page, ["assets"]);
    await navTo(page, "자산 관리", "**/assets**");
    // 에러 상태: 스피너 사라지고 empty-state(에러 메시지) 표시
    await expect(page.locator(".empty-state")).toBeVisible({ timeout: 8000 });
    await expect(page.locator(".empty-state__message")).toContainText("불러오지 못했습니다");
    await page.screenshot({ path: "e2e/screenshots/assets-api-error.png", fullPage: true });
  });

  test("점검 계획 — API 500 시 에러 메시지 표시", async ({ page }) => {
    await login(page);
    await setMswError(page, ["inspection-plans"]);
    await navTo(page, "점검 계획", "**/inspection-plans**");
    await expect(page.locator(".empty-state")).toBeVisible({ timeout: 8000 });
    await expect(page.locator(".empty-state__message")).toContainText("불러오지 못했습니다");
    await page.screenshot({ path: "e2e/screenshots/inspection-plans-api-error.png", fullPage: true });
  });

  test("에러 플래그 해제 후 정상 데이터 표시 복구", async ({ page }) => {
    await login(page);
    await setMswError(page, ["assets"]);
    await navTo(page, "자산 관리", "**/assets**");
    await expect(page.locator(".empty-state")).toBeVisible({ timeout: 8000 });

    // 에러 플래그 해제 후 다른 페이지 경유 → 자산 관리 재진입 (reload는 세션 유실 위험)
    await clearMswErrors(page);
    await navTo(page, "점검 계획", "**/inspection-plans**");
    await navTo(page, "자산 관리", "**/assets**");
    await expect(page.locator("table.common-table").first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "e2e/screenshots/assets-recovery.png", fullPage: true });
  });
});

test.describe("네트워크 세그먼트", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navTo(page, "네트워크", "**/network-segments**");
  });

  test("망 연결도 토폴로지 렌더링", async ({ page }) => {
    await expect(page.locator(".topo-stage").first()).toBeVisible({ timeout: 12000 });
    await page.screenshot({ path: "e2e/screenshots/network-segments.png", fullPage: true });
  });

  test("통신 매트릭스 탭 전환 — 테이블 렌더링 확인", async ({ page }) => {
    await expect(page.locator(".topo-stage").first()).toBeVisible({ timeout: 12000 });
    await page.locator(".seg-tabs__tab", { hasText: "통신 매트릭스" }).click();
    await expect(page.locator(".matrix-table").first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "e2e/screenshots/network-segments-matrix.png", fullPage: true });
  });

  test("세그먼트 목록 탭 전환", async ({ page }) => {
    await expect(page.locator(".topo-stage").first()).toBeVisible({ timeout: 12000 });
    await page.locator(".seg-tabs__tab", { hasText: "세그먼트 목록" }).click();
    await expect(page.locator(".segment-list").first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "e2e/screenshots/network-segments-cards.png", fullPage: true });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 대시보드 → 페이지 바로가기 (cross-page navigation with router state)
// ────────────────────────────────────────────────────────────────────────────
test.describe("대시보드 바로가기 — 페이지 이동 + 자동 필터", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForDashboard(page);
  });

  test("상태바 바로가기 버튼 3개 렌더링 확인", async ({ page }) => {
    const navLinks = page.locator(".scope-nav-link");
    await expect(navLinks).toHaveCount(3, { timeout: 8000 });
    await expect(navLinks.nth(0)).toContainText("결과 조회");
    await expect(navLinks.nth(1)).toContainText("실행 모니터");
    await expect(navLinks.nth(2)).toContainText("자산 관리");
    await page.screenshot({ path: "e2e/screenshots/dashboard-nav-links.png" });
  });

  test("'결과 조회 →' 클릭 → result-review 이동 + pending 필터 자동 적용", async ({ page }) => {
    await page.locator(".scope-nav-link", { hasText: "결과 조회" }).click();
    await page.waitForURL("**/result-review**", { timeout: 8000 });

    // SearchMenu의 select(.search-menu__select) value가 'pending'인지 확인
    const selectEl = page.locator(".search-menu__select").first();
    await expect(selectEl).toBeVisible({ timeout: 5000 });
    await expect(selectEl).toHaveValue("pending");
    await page.screenshot({ path: "e2e/screenshots/result-review-auto-filter.png", fullPage: true });
  });

  test("'실행 모니터 →' 클릭 → execution-monitor 이동 + running 탭 자동 활성화", async ({ page }) => {
    await page.locator(".scope-nav-link", { hasText: "실행 모니터" }).click();
    await page.waitForURL("**/execution-monitor**", { timeout: 8000 });

    // "실행중" 필터 버튼이 is-active 클래스를 가져야 함
    const runningBtn = page.locator(".exec-toolbar__filter-btn.is-active");
    await expect(runningBtn).toBeVisible({ timeout: 5000 });
    await expect(runningBtn).toContainText("실행중");
    await page.screenshot({ path: "e2e/screenshots/execution-monitor-auto-filter.png", fullPage: true });
  });

  test("'자산 관리 →' 클릭 → assets 페이지 이동", async ({ page }) => {
    await page.locator(".scope-nav-link", { hasText: "자산 관리" }).click();
    await page.waitForURL("**/assets**", { timeout: 8000 });
    await expect(page.locator("table.common-table").first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "e2e/screenshots/assets-from-dashboard.png", fullPage: true });
  });
});
