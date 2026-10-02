import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

// ── useExecutionStore 모킹 ────────────────────────────────────────────────────
vi.mock("@/store/useExecutionStore", () => ({
  default: vi.fn(() => ({
    jobs: [],
    loading: false,
    fetchJobs: vi.fn(),
    updateStatus: vi.fn(),
    clearPersistedStates: vi.fn(),
    silentPoll: vi.fn(),
  })),
}));

// ── API 모킹 (ResultReview) ──────────────────────────────────────────────────
vi.mock("@/api/securityDemoApi", () => ({
  getInspectionResults: vi.fn(() =>
    Promise.resolve({ data: { items: [
      { id: "r1", planTitle: "점검A", targetGroup: "서비스팀", score: 72, reviewStatus: "pending",   reviewer: null, reviewedAt: null, comment: null },
      { id: "r2", planTitle: "점검B", targetGroup: "인프라팀", score: 88, reviewStatus: "approved",  reviewer: "관리자", reviewedAt: "2024-07-01", comment: null },
      { id: "r3", planTitle: "점검C", targetGroup: "개발팀",   score: 60, reviewStatus: "in_review", reviewer: null, reviewedAt: null, comment: null },
    ] } })
  ),
  updateInspectionResult: vi.fn(() => Promise.resolve({})),
}));

// ── ExecutionMonitor ─────────────────────────────────────────────────────────
import ExecutionMonitor from "@/pages/ExecutionMonitor";

describe("ExecutionMonitor — location.state 자동 필터", () => {
  test("state 없으면 '전체' 탭이 활성화", () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/sedo/execution-monitor" }]}>
        <ExecutionMonitor />
      </MemoryRouter>
    );
    const allBtn = screen.getByRole("button", { name: /^전체/ });
    expect(allBtn).toHaveClass("is-active");
  });

  test("autoStatus='running' 전달 시 '실행중' 탭이 활성화", () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/sedo/execution-monitor", state: { autoStatus: "running" } }]}
      >
        <ExecutionMonitor />
      </MemoryRouter>
    );
    const runningBtn = screen.getByRole("button", { name: /실행중/ });
    expect(runningBtn).toHaveClass("is-active");
  });

  test("autoStatus='running' 시 '전체' 탭은 비활성화", () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/sedo/execution-monitor", state: { autoStatus: "running" } }]}
      >
        <ExecutionMonitor />
      </MemoryRouter>
    );
    const allBtn = screen.getByRole("button", { name: /^전체/ });
    expect(allBtn).not.toHaveClass("is-active");
  });

  test("autoStatus='completed' 전달 시 '완료' 탭이 활성화", () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/sedo/execution-monitor", state: { autoStatus: "completed" } }]}
      >
        <ExecutionMonitor />
      </MemoryRouter>
    );
    const completedBtn = screen.getByRole("button", { name: /완료/ });
    expect(completedBtn).toHaveClass("is-active");
  });
});

// ── ResultReview ─────────────────────────────────────────────────────────────
import ResultReview from "@/pages/ResultReview";

describe("ResultReview — location.state 자동 필터", () => {
  test("state 없으면 모든 결과 표시 (3건)", async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/sedo/result-review" }]}>
        <ResultReview />
      </MemoryRouter>
    );
    // 로딩 끝나고 행 표시 대기
    const rows = await screen.findAllByRole("row");
    // header 1 + data 3 = 4
    expect(rows.length).toBeGreaterThanOrEqual(4);
  });

  test("autoFilter={reviewStatus:'pending'} 전달 시 pending 행만 표시", async () => {
    render(
      <MemoryRouter
        initialEntries={[{
          pathname: "/sedo/result-review",
          state: { autoFilter: { reviewStatus: "pending" } },
        }]}
      >
        <ResultReview />
      </MemoryRouter>
    );
    // "점검A"만 pending이므로 1행만 나와야 함
    const cell = await screen.findByText("점검A");
    expect(cell).toBeInTheDocument();
    // "점검B"(approved)는 필터에 걸려 보이지 않아야 함
    expect(screen.queryByText("점검B")).not.toBeInTheDocument();
  });

  test("autoFilter 없을 때 approved 행도 포함", async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/sedo/result-review" }]}>
        <ResultReview />
      </MemoryRouter>
    );
    await screen.findByText("점검A");
    expect(screen.getByText("점검B")).toBeInTheDocument();
    expect(screen.getByText("점검C")).toBeInTheDocument();
  });
});
