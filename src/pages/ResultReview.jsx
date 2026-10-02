import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiCheckCircle, FiEye, FiX } from "react-icons/fi";
import { MdOutlineVerified, MdOutlinePendingActions, MdOutlineRateReview } from "react-icons/md";
import Swal from "sweetalert2";
import { getInspectionResults, updateInspectionResult } from "@/api/securityDemoApi";
import PageHeader from "@/components/layout/PageHeader";
import SearchMenu from "@/components/common/SearchMenu";
import CommonTable from "@/components/common/CommonTable";
import StatusBadge from "@/components/common/StatusBadge";
import Button from "@/components/common/Button";

const scoreColor = (v) =>
  v == null       ? "var(--sub-text-color)"
  : v >= 80       ? "var(--success-color)"
  : v >= 60       ? "var(--warning-color)"
  : "var(--danger-color)";

const SEARCH_ITEMS = [
  { key: "planTitle",    type: "input",  label: "계획명",    placeholder: "계획명 검색" },
  {
    key: "reviewStatus", type: "select", label: "검토 상태", placeholder: "전체",
    options: [
      { value: "pending",   label: "대기" },
      { value: "in_review", label: "검토중" },
      { value: "approved",  label: "승인" },
    ],
  },
];

function KpiCards({ results }) {
  const total    = results.length;
  const approved = results.filter((r) => r.reviewStatus === "approved").length;
  const pending  = results.filter((r) => r.reviewStatus !== "approved").length;
  const scored   = results.filter((r) => r.score != null);
  const avg      = scored.length > 0
    ? Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length)
    : null;

  const cards = [
    { icon: <MdOutlineRateReview />,    label: "총 결과 건수", value: `${total}건`,               color: "var(--accent-color)" },
    { icon: <MdOutlineVerified />,      label: "승인 완료",    value: `${approved}건`,             color: "var(--success-color)" },
    { icon: <MdOutlinePendingActions />,label: "검토 대기",    value: `${pending}건`,              color: "var(--warning-color)" },
    { icon: <FiCheckCircle />,          label: "평균 보안점수",value: avg != null ? `${avg}점` : "-", color: scoreColor(avg) },
  ];

  return (
    <div className="rr-kpi-row">
      {cards.map((c) => (
        <div key={c.label} className="rr-kpi-card">
          <span className="rr-kpi-card__icon" style={{ color: c.color }}>{c.icon}</span>
          <div>
            <p className="rr-kpi-card__label">{c.label}</p>
            <p className="rr-kpi-card__value" style={{ color: c.color }}>{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailModal({ row, onClose, onApprove }) {
  if (!row) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal rr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">결과 상세</h3>
          <button type="button" className="modal__close" onClick={onClose}><FiX /></button>
        </div>
        <div className="modal__body">
          <div className="rr-modal-score">
            <span className="rr-modal-score__value" style={{ color: scoreColor(row.score) }}>
              {row.score != null ? row.score : "–"}
            </span>
            <span className="rr-modal-score__label">보안점수</span>
          </div>
          <dl className="info-list">
            <div className="info-list__row"><dt>점검 계획명</dt><dd>{row.planTitle}</dd></div>
            <div className="info-list__row"><dt>대상 그룹</dt><dd>{row.targetGroup}</dd></div>
            <div className="info-list__row"><dt>검토 상태</dt><dd><StatusBadge status={row.reviewStatus} /></dd></div>
            <div className="info-list__row"><dt>검토자</dt><dd>{row.reviewer || "–"}</dd></div>
            <div className="info-list__row"><dt>검토일</dt><dd>{row.reviewedAt || "–"}</dd></div>
            <div className="info-list__row"><dt>코멘트</dt><dd>{row.comment || "–"}</dd></div>
          </dl>
          {row.reviewStatus !== "approved" && (
            <div className="rr-modal-action">
              <Button variant="accent" icon={<FiCheckCircle />} onClick={() => { onApprove(row); onClose(); }}>
                이 결과 승인
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultReview() {
  const location = useLocation();
  const appliedNavState = useRef(false);

  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filters, setFilters]       = useState({});
  const [selected, setSelected]     = useState(null);

  useEffect(() => {
    getInspectionResults({})
      .then((res) => setAllResults(res.data.items || []))
      .catch(() => setError("데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (appliedNavState.current) return;
    if (location.state?.autoFilter) {
      setFilters(location.state.autoFilter);
      appliedNavState.current = true;
    }
  }, [location.state]);

  // client-side 필터링 — API re-fetch 없음
  const filtered = useMemo(() => {
    let result = allResults;
    if (filters.planTitle)    result = result.filter((r) => r.planTitle.includes(filters.planTitle));
    if (filters.reviewStatus) result = result.filter((r) => r.reviewStatus === filters.reviewStatus);
    return result;
  }, [allResults, filters]);

  const handleSearch = (f = filters) => setFilters(f);
  const handleReset  = () => setFilters({});

  const handleApprove = async (row) => {
    const confirmed = await Swal.fire({
      title: "결과 승인",
      html: `<strong>${row.planTitle}</strong><br/><span style="font-size:13px;color:#64748b;">위 점검 결과를 공식 승인하시겠습니까?</span>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "승인",
      cancelButtonText: "취소",
      confirmButtonColor: "#0891b2",
    });
    if (!confirmed.isConfirmed) return;

    await updateInspectionResult(row.id, { reviewStatus: "approved" });

    // 낙관적 업데이트
    setAllResults((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, reviewStatus: "approved", reviewedAt: new Date().toISOString().split("T")[0], reviewer: "관리자" }
          : r
      )
    );
    Swal.fire({ title: "승인 완료", icon: "success", timer: 1500, showConfirmButton: false });
  };

  const columns = [
    { key: "index",       label: "No.",      width: "60px",  align: "center" },
    { key: "planTitle",   label: "점검 계획명", ellipsis: true },
    { key: "targetGroup", label: "대상 그룹",  width: "130px", align: "center" },
    {
      key: "score", label: "보안점수", width: "90px", align: "center",
      render: (v) => (
        <span style={{ fontWeight: 700, fontSize: "var(--font-14)", color: scoreColor(v) }}>
          {v != null ? `${v}점` : "–"}
        </span>
      ),
    },
    {
      key: "reviewStatus", label: "검토 상태", width: "110px", align: "center",
      render: (v) => <StatusBadge status={v} />,
    },
    { key: "reviewedAt", label: "검토일",  width: "115px", align: "center" },
    { key: "reviewer",   label: "검토자",  width: "90px",  align: "center" },
    {
      key: "actions", label: "작업", width: "155px", align: "center",
      render: (_, row) => (
        <div className="rr-action-cell">
          <button
            type="button"
            className="rr-action-btn rr-action-btn--ghost"
            onClick={(e) => { e.stopPropagation(); setSelected(row); }}
          >
            <FiEye /> 상세
          </button>
          {/* 승인 버튼 슬롯 — 항상 동일한 너비 확보 */}
          {row.reviewStatus !== "approved" ? (
            <button
              type="button"
              className="rr-action-btn rr-action-btn--accent"
              onClick={(e) => { e.stopPropagation(); handleApprove(row); }}
            >
              <FiCheckCircle /> 승인
            </button>
          ) : (
            <span className="rr-action-placeholder" />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page-content">
      <PageHeader
        title="결과 조회"
        description="점검 완료 후 보안 결과를 검토하고 승인하는 워크플로우 — pending → 검토중 → 승인"
      />

      {!loading && <KpiCards results={allResults} />}

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
      ) : error ? (
        <div className="empty-state">
          <p className="empty-state__message" style={{ color: "var(--danger-color)" }}>{error}</p>
        </div>
      ) : (
        <CommonTable
          columns={columns}
          data={filtered}
          totalCount={filtered.length}
          noDataMessage="조회된 결과가 없습니다."
          onRowClick={(row) => setSelected(row)}
        />
      )}

      <DetailModal row={selected} onClose={() => setSelected(null)} onApprove={handleApprove} />
    </div>
  );
}
