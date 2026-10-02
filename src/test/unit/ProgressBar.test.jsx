import { render, screen } from "@testing-library/react";
import ProgressBar from "@/components/common/ProgressBar";

const getFill = (container) => container.querySelector(".progress-bar__fill");

describe("ProgressBar — 퍼센트 계산", () => {
  test("percent prop으로 너비 결정", () => {
    const { container } = render(<ProgressBar percent={60} />);
    expect(getFill(container).style.width).toBe("60%");
  });

  test("current/total 비율로 너비 계산 (75%)", () => {
    const { container } = render(<ProgressBar current={3} total={4} />);
    expect(getFill(container).style.width).toBe("75%");
  });

  test("100 초과 값은 100%로 클램프", () => {
    const { container } = render(<ProgressBar percent={150} />);
    expect(getFill(container).style.width).toBe("100%");
  });

  test("0 미만 값은 0%로 클램프", () => {
    const { container } = render(<ProgressBar percent={-10} />);
    expect(getFill(container).style.width).toBe("0%");
  });

  test("total=0이면 0%", () => {
    const { container } = render(<ProgressBar current={5} total={0} />);
    expect(getFill(container).style.width).toBe("0%");
  });
});

describe("ProgressBar — 색상 클래스", () => {
  test("70% 이상 → success", () => {
    const { container } = render(<ProgressBar percent={70} />);
    expect(getFill(container)).toHaveClass("progress-bar__fill--success");
  });

  test("40~69% → warning", () => {
    const { container } = render(<ProgressBar percent={55} />);
    expect(getFill(container)).toHaveClass("progress-bar__fill--warning");
  });

  test("39% 이하 → danger", () => {
    const { container } = render(<ProgressBar percent={30} />);
    expect(getFill(container)).toHaveClass("progress-bar__fill--danger");
  });

  test("경계값 40% → warning", () => {
    const { container } = render(<ProgressBar percent={40} />);
    expect(getFill(container)).toHaveClass("progress-bar__fill--warning");
  });
});

describe("ProgressBar — 레이블", () => {
  test("label prop 표시", () => {
    render(<ProgressBar percent={60} label="서버 보안점수" />);
    expect(screen.getByText("서버 보안점수")).toBeInTheDocument();
  });

  test("showLabel=true + percent prop이면 퍼센트 텍스트 표시", () => {
    render(<ProgressBar percent={60} showLabel />);
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  test("showLabel=false이면 퍼센트 텍스트 없음", () => {
    render(<ProgressBar percent={60} showLabel={false} />);
    expect(screen.queryByText("60%")).not.toBeInTheDocument();
  });
});
