import { render, screen } from "@testing-library/react";
import StatusBadge from "@/components/common/StatusBadge";

describe("StatusBadge", () => {
  test.each([
    ["in_progress", "진행중"],
    ["completed",   "완료"],
    ["scheduled",   "예정"],
    ["failed",      "실패"],
    ["running",     "실행중"],
    ["pending",     "대기"],
    ["active",      "활성"],
    ["inactive",    "비활성"],
    ["in_review",   "검토중"],
    ["approved",    "승인"],
    ["open",        "미조치"],
    ["resolved",    "조치 완료"],
  ])("status='%s' → 한글 라벨 '%s' 표시", (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  test("알 수 없는 status는 값 그대로 표시", () => {
    render(<StatusBadge status="unknown_custom_status" />);
    expect(screen.getByText("unknown_custom_status")).toBeInTheDocument();
  });

  test("label prop이 STATUS_LABELS보다 우선 적용됨", () => {
    render(<StatusBadge status="completed" label="커스텀 라벨" />);
    expect(screen.getByText("커스텀 라벨")).toBeInTheDocument();
    expect(screen.queryByText("완료")).not.toBeInTheDocument();
  });

  test("status에 대응하는 CSS 클래스 부여", () => {
    const { container } = render(<StatusBadge status="failed" />);
    expect(container.firstChild).toHaveClass("status-badge--failed");
  });

  test("기본 dot=true 시 dot 클래스 포함", () => {
    const { container } = render(<StatusBadge status="active" />);
    expect(container.firstChild).toHaveClass("status-badge--dot");
  });

  test("dot=false 시 dot 클래스 미포함", () => {
    const { container } = render(<StatusBadge status="active" dot={false} />);
    expect(container.firstChild).not.toHaveClass("status-badge--dot");
  });
});
