import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useInspectionPlanStore from "@/store/useInspectionPlanStore";
import PageHeader from "@/components/layout/PageHeader";
import SearchMenu from "@/components/common/SearchMenu";
import CommonTable from "@/components/common/CommonTable";
import StatusBadge from "@/components/common/StatusBadge";
import Pagination from "@/components/common/Pagination";

const SEARCH_ITEMS = [
  { key: "title", type: "input", label: "계획명", placeholder: "계획명 검색" },
  { key: "targetGroup", type: "input", label: "대상 그룹", placeholder: "대상 그룹 검색" },
  {
    key: "status",
    type: "select",
    label: "상태",
    placeholder: "전체",
    options: [
      { value: "scheduled", label: "예정" },
      { value: "in_progress", label: "진행중" },
      { value: "completed", label: "완료" },
      { value: "failed", label: "실패" },
    ],
  },
  {
    key: "inspectionType",
    type: "select",
    label: "점검 유형",
    placeholder: "전체",
    options: [
      { value: "network", label: "네트워크" },
      { value: "server", label: "서버" },
      { value: "database", label: "데이터베이스" },
      { value: "comprehensive", label: "종합" },
    ],
  },
];

const COLUMNS = [
  { key: "index", label: "No.", width: "60px", align: "center" },
  { key: "title", label: "계획명", sortable: true, ellipsis: true },
  { key: "targetGroup", label: "대상 그룹" },
  {
    key: "inspectionType",
    label: "점검 유형",
    width: "110px",
    align: "center",
    render: (v) =>
      ({ network: "네트워크", server: "서버", database: "데이터베이스", comprehensive: "종합" }[v] ?? v),
  },
  {
    key: "status",
    label: "상태",
    width: "90px",
    align: "center",
    render: (v) => <StatusBadge status={v} />,
  },
  {
    key: "score",
    label: "점수",
    width: "70px",
    align: "center",
    sortable: true,
    render: (v) => (v != null ? `${v}점` : "-"),
  },
  { key: "scheduledAt", label: "예정일", width: "120px", align: "center" },
];

export default function InspectionPlanList() {
  const navigate = useNavigate();
  const {
    plans,
    totalCount,
    currentPage,
    pageSize,
    filters,
    loading,
    setFilters,
    setPage,
    setSort,
    fetchPlans,
  } = useInspectionPlanStore();

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSearch = () => {
    setPage(1);
    fetchPlans();
  };

  const handleReset = () => {
    setFilters({});
    setPage(1);
    fetchPlans();
  };

  return (
    <div className="page-content">
      <PageHeader
        breadcrumb="점검 관리"
        title="Inspection Plans"
        description="보안 점검 계획 목록 및 상세 조회"
      />

      <SearchMenu
        items={SEARCH_ITEMS}
        values={filters}
        onChange={setFilters}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      {loading ? (
        <div className="loading-state">
          <div className="loading-state__spinner" />
          <p>데이터를 불러오는 중...</p>
        </div>
      ) : (
        <>
          <CommonTable
            columns={COLUMNS}
            data={plans}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onSort={(key, dir) => { setSort(key, dir); fetchPlans(); }}
            onRowClick={(row) => navigate(`/inspection-plans/${row.id}`)}
            noDataMessage="조회된 점검 계획이 없습니다."
          />
          <Pagination
            currentPage={currentPage}
            totalCount={totalCount}
            pageSize={pageSize}
            onChange={(p) => { setPage(p); fetchPlans(); }}
          />
        </>
      )}
    </div>
  );
}
