import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "@/components/common/Pagination";

describe("Pagination — 렌더링 조건", () => {
  test("totalCount <= pageSize 이면 렌더링하지 않음", () => {
    const { container } = render(
      <Pagination currentPage={1} totalCount={5} pageSize={10} onChange={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("totalCount === pageSize 이면 렌더링하지 않음 (정확히 1페이지)", () => {
    const { container } = render(
      <Pagination currentPage={1} totalCount={10} pageSize={10} onChange={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("totalCount > pageSize 이면 페이지 버튼 표시", () => {
    render(<Pagination currentPage={1} totalCount={30} pageSize={10} onChange={() => {}} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});

describe("Pagination — 비활성화 상태", () => {
  test("첫 페이지에서 처음/이전 버튼 disabled", () => {
    render(<Pagination currentPage={1} totalCount={30} pageSize={10} onChange={() => {}} />);
    const btns = screen.getAllByRole("button");
    expect(btns[0]).toBeDisabled();
    expect(btns[1]).toBeDisabled();
  });

  test("마지막 페이지에서 다음/마지막 버튼 disabled", () => {
    render(<Pagination currentPage={3} totalCount={30} pageSize={10} onChange={() => {}} />);
    const btns = screen.getAllByRole("button");
    expect(btns[btns.length - 2]).toBeDisabled();
    expect(btns[btns.length - 1]).toBeDisabled();
  });

  test("중간 페이지에서 모든 방향 버튼 활성화", () => {
    render(<Pagination currentPage={2} totalCount={30} pageSize={10} onChange={() => {}} />);
    const btns = screen.getAllByRole("button");
    expect(btns[0]).not.toBeDisabled();
    expect(btns[btns.length - 1]).not.toBeDisabled();
  });
});

describe("Pagination — 클릭 이벤트", () => {
  test("페이지 번호 클릭 → onChange에 해당 번호 전달", async () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={1} totalCount={30} pageSize={10} onChange={onChange} />);
    await userEvent.click(screen.getByText("2"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  test("다음 버튼 클릭 → currentPage+1 전달", async () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={1} totalCount={30} pageSize={10} onChange={onChange} />);
    const btns = screen.getAllByRole("button");
    await userEvent.click(btns[btns.length - 2]);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  test("이전 버튼 클릭 → currentPage-1 전달", async () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={2} totalCount={30} pageSize={10} onChange={onChange} />);
    const btns = screen.getAllByRole("button");
    await userEvent.click(btns[1]);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  test("처음 버튼 → 1 전달", async () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={3} totalCount={30} pageSize={10} onChange={onChange} />);
    const btns = screen.getAllByRole("button");
    await userEvent.click(btns[0]);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  test("마지막 버튼 → totalPages 전달", async () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={1} totalCount={30} pageSize={10} onChange={onChange} />);
    const btns = screen.getAllByRole("button");
    await userEvent.click(btns[btns.length - 1]);
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
