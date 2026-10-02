import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommonTable from "@/components/common/CommonTable";

const COLS = [
  { key: "name",   label: "자산명" },
  { key: "status", label: "상태" },
];

const DATA = [
  { id: "1", name: "웹 서버 01",  status: "active"   },
  { id: "2", name: "DB 서버 01",  status: "inactive"  },
  { id: "3", name: "방화벽 01",   status: "active"   },
];

describe("CommonTable — 기본 렌더링", () => {
  test("컬럼 헤더 렌더링", () => {
    render(<CommonTable columns={COLS} data={DATA} />);
    expect(screen.getByText("자산명")).toBeInTheDocument();
    expect(screen.getByText("상태")).toBeInTheDocument();
  });

  test("데이터 행 모두 표시", () => {
    render(<CommonTable columns={COLS} data={DATA} />);
    expect(screen.getByText("웹 서버 01")).toBeInTheDocument();
    expect(screen.getByText("DB 서버 01")).toBeInTheDocument();
    expect(screen.getByText("방화벽 01")).toBeInTheDocument();
  });

  test("빈 데이터 → noDataMessage 표시", () => {
    render(<CommonTable columns={COLS} data={[]} noDataMessage="조회된 결과가 없습니다." />);
    expect(screen.getByText("조회된 결과가 없습니다.")).toBeInTheDocument();
  });

  test("render 함수로 셀 값 커스텀 렌더링", () => {
    const cols = [{ key: "status", label: "상태", render: (v) => `[${v}]` }];
    render(<CommonTable columns={cols} data={[{ id: "1", status: "active" }]} />);
    expect(screen.getByText("[active]")).toBeInTheDocument();
  });

  test("값이 없는 컬럼은 '-' 표시", () => {
    const cols = [{ key: "missing", label: "없음" }];
    render(<CommonTable columns={cols} data={[{ id: "1" }]} />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});

describe("CommonTable — index 컬럼", () => {
  test("index 컬럼은 1부터 순서대로 표시", () => {
    const cols = [{ key: "index", label: "No." }, ...COLS];
    render(<CommonTable columns={cols} data={DATA} currentPage={1} pageSize={10} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("2페이지에서 index는 11부터 시작", () => {
    const cols = [{ key: "index", label: "No." }, ...COLS];
    render(
      <CommonTable columns={cols} data={DATA} currentPage={2} pageSize={10} totalCount={13} />
    );
    expect(screen.getByText("11")).toBeInTheDocument();
  });
});

describe("CommonTable — 행 클릭", () => {
  test("onRowClick 있으면 행에 clickable 클래스 부여", () => {
    render(<CommonTable columns={COLS} data={DATA} onRowClick={() => {}} />);
    const rows = screen.getAllByRole("row").slice(1);
    rows.forEach((row) => expect(row).toHaveClass("clickable"));
  });

  test("onRowClick 없으면 clickable 클래스 미부여", () => {
    render(<CommonTable columns={COLS} data={DATA} />);
    const rows = screen.getAllByRole("row").slice(1);
    rows.forEach((row) => expect(row).not.toHaveClass("clickable"));
  });

  test("행 클릭 시 onRowClick에 해당 행 데이터 전달", async () => {
    const onRowClick = vi.fn();
    render(<CommonTable columns={COLS} data={DATA} onRowClick={onRowClick} />);
    await userEvent.click(screen.getByText("웹 서버 01"));
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(DATA[0]);
  });

  test("다른 행 클릭 시 해당 행 데이터 전달", async () => {
    const onRowClick = vi.fn();
    render(<CommonTable columns={COLS} data={DATA} onRowClick={onRowClick} />);
    await userEvent.click(screen.getByText("방화벽 01"));
    expect(onRowClick).toHaveBeenCalledWith(DATA[2]);
  });
});

describe("CommonTable — 정렬", () => {
  test("sortable 컬럼 클릭 시 onSort 호출", async () => {
    const onSort = vi.fn();
    const cols = [{ key: "name", label: "자산명", sortable: true }];
    render(<CommonTable columns={cols} data={DATA} onSort={onSort} />);
    await userEvent.click(screen.getByText("자산명"));
    expect(onSort).toHaveBeenCalledWith("name", "asc");
  });

  test("같은 컬럼 두 번 클릭 시 방향 toggle (asc→desc)", async () => {
    const onSort = vi.fn();
    const cols = [{ key: "name", label: "자산명", sortable: true }];
    render(<CommonTable columns={cols} data={DATA} onSort={onSort} />);
    await userEvent.click(screen.getByText("자산명"));
    await userEvent.click(screen.getByText("자산명"));
    expect(onSort).toHaveBeenNthCalledWith(1, "name", "asc");
    expect(onSort).toHaveBeenNthCalledWith(2, "name", "desc");
  });

  test("sortable 없는 컬럼 클릭 시 onSort 미호출", async () => {
    const onSort = vi.fn();
    render(<CommonTable columns={COLS} data={DATA} onSort={onSort} />);
    await userEvent.click(screen.getByText("자산명"));
    expect(onSort).not.toHaveBeenCalled();
  });
});
