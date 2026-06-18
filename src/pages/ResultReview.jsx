import { useEffect, useState } from "react";
import { FiCheckCircle, FiEye } from "react-icons/fi";
import Swal from "sweetalert2";
import { getInspectionResults, updateInspectionResult } from "@/api/securityDemoApi";
import PageHeader from "@/components/layout/PageHeader";
import SearchMenu from "@/components/common/SearchMenu";
import CommonTable from "@/components/common/CommonTable";
import StatusBadge from "@/components/common/StatusBadge";
import Button from "@/components/common/Button";

const SEARCH_ITEMS = [
  { key: "planTitle", type: "input", label: "계획명", placeholder: "계획명 검색" },
  {
    key: "reviewStatus",
    type: "select",
    label: "검토 상태",
    placeholder: "전체",
    options: [
      { value: "pending", label: "대기" },
      { value: "in_review", label: "검토중" },
      { value: "approved", label: "승인" },
    ],
  },
];

export default function ResultReview() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState(null);

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const res = await getInspectionResults(f);
      setResults(res.data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (row) => {
    const result = await Swal.fire({
      title: "결과 승인",
      text: `'${row.planTitle}' 점검 결과를 승인하시겠습니까?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "승인",
      cancelButtonText: "취소",
      confirmButtonColor: "#14b8a6",
    });
    if (!result.isConfirmed) return;
    await updateInspectionResult(row.id, { reviewStatus: "approved" });
    setResults((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, reviewStatus: "approved" } : r))
    );
    Swal.fire({ title: "승인 완료", icon: "success", timer: 1200, showConfirmButton: false });
  };

  const columns = [
    { key: "index", label: "No.", width: "60px", align: "center" },
    { key: "planTitle", label: "점검 계획명", ellipsis: true },
    { key: "targetGroup", label: "대상 그룹", width: "140px" },
    {
      key: "score",
      label: "점수",
      width: "70px",
      align: "center",
      render: (v) => (v != null ? `${v}점` : "-"),
    },
    {
      key: "reviewStatus",
      label: "검토 상태",
      width: "100px",
      align: "center",
      render: (v) => <StatusBadge status={v} />,
    },
    { key: "reviewedAt", label: "검토일", width: "120px", align: "center" },
    { key: "reviewer", label: "검토자", width: "100px", align: "center" },
    {
      key: "actions",
      label: "작업",
      width: "130px",
      align: "center",
      render: (_, row) => (
        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<FiEye />}
            onClick={(e) => { e.stopPropagation(); setSelected(row); }}
          >
            상세
          </Button>
          {row.reviewStatus !== "approved" && (
            <Button
              variant="accent"
              size="sm"
              icon={<FiCheckCircle />}
              onClick={(e) => { e.stopPropagation(); handleApprove(row); }}
            >
              승인
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page-content">
      <PageHeader
        breadcrumb="점검 관리"
        title="Result Review"
        description="점검 결과 검토 및 승인 관리"
      />

      <SearchMenu
        items={SEARCH_ITEMS}
        values={filters}
        onChange={setFilters}
        onSearch={() => load(filters)}
        onReset={() => { setFilters({}); load({}); }}
      />

      {loading ? (
        <div className="loading-state">
          <div className="loading-state__spinner" />
          <p>데이터를 불러오는 중...</p>
        </div>
      ) : (
        <CommonTable
          columns={columns}
          data={results}
          totalCount={results.length}
          noDataMessage="조회된 결과가 없습니다."
        />
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">결과 상세</h3>
              <button className="modal__close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal__body">
              <dl className="info-list">
                <div className="info-list__row"><dt>계획명</dt><dd>{selected.planTitle}</dd></div>
                <div className="info-list__row"><dt>대상 그룹</dt><dd>{selected.targetGroup}</dd></div>
                <div className="info-list__row"><dt>점수</dt><dd>{selected.score}점</dd></div>
                <div className="info-list__row">
                  <dt>검토 상태</dt>
                  <dd><StatusBadge status={selected.reviewStatus} /></dd>
                </div>
                <div className="info-list__row"><dt>검토자</dt><dd>{selected.reviewer || "-"}</dd></div>
                <div className="info-list__row"><dt>검토일</dt><dd>{selected.reviewedAt || "-"}</dd></div>
                <div className="info-list__row"><dt>코멘트</dt><dd>{selected.comment || "-"}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
