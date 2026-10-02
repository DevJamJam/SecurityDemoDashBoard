import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { MdVerified, MdPendingActions } from "react-icons/md";
import useInspectionPlanStore from "@/store/useInspectionPlanStore";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import SecurityScoreCircle from "@/components/common/SecurityScoreCircle";
import ProgressBar from "@/components/common/ProgressBar";
import Button from "@/components/common/Button";
import CommonTable from "@/components/common/CommonTable";

const INSPECTION_TYPE_LABEL = {
  server: "서버",
  network: "네트워크",
  database: "데이터베이스",
  comprehensive: "종합",
};

const VULN_SEVERITY_LABEL = { high: "상", medium: "중", low: "하" };
const VULN_STATUS_LABEL = { open: "미조치", in_progress: "조치 진행중", resolved: "조치 완료" };

const VULN_COLUMNS = [
  { key: "id", label: "ID", width: "100px" },
  { key: "title", label: "취약점명" },
  { key: "category", label: "분류", width: "120px", align: "center" },
  { key: "asset", label: "대상 자산", width: "130px" },
  {
    key: "severity", label: "위험도", width: "70px", align: "center",
    render: (v) => {
      const color = v === "high" ? "#dc2626" : v === "medium" ? "#d4a017" : "#16a34a";
      return <span style={{ fontWeight: 700, color }}>{VULN_SEVERITY_LABEL[v] || v}</span>;
    },
  },
  {
    key: "status", label: "조치 상태", width: "110px", align: "center",
    render: (v) => <StatusBadge status={v} label={VULN_STATUS_LABEL[v]} />,
  },
];

const ASSET_COLUMNS = [
  { key: "index", label: "No.", width: "60px", align: "center" },
  { key: "name", label: "자산명" },
  { key: "ipAddress", label: "IP 주소", width: "140px" },
  { key: "type", label: "유형", width: "120px" },
  {
    key: "status", label: "점검 결과", width: "110px", align: "center",
    render: (v) => <StatusBadge status={v} />,
  },
];

function ScoreRing({ score, label, size = 140 }) {
  const valid = typeof score === "number" && score > 0;
  return (
    <div className="pd-score-ring">
      <SecurityScoreCircle score={valid ? score : 0} size={size} />
      <p className="pd-score-ring__label">{label}</p>
    </div>
  );
}

function ProgressRing({ rate, label, size = 140 }) {
  const fillColor = rate >= 80 ? "#16a34a" : rate >= 50 ? "#d4a017" : "#dc2626";
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - rate / 100);

  return (
    <div className="pd-score-ring">
      <div className="pd-progress-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-color)" strokeWidth={10} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={fillColor} strokeWidth={10}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <span className="pd-progress-ring__value" style={{ color: fillColor }}>{rate}%</span>
      </div>
      <p className="pd-score-ring__label">{label}</p>
    </div>
  );
}

export default function InspectionPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { detail, detailLoading, fetchPlanDetail, resetDetail } = useInspectionPlanStore();

  useEffect(() => {
    fetchPlanDetail(id);
    return () => resetDetail();
  }, [id, fetchPlanDetail, resetDetail]);

  if (detailLoading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          <div className="loading-state__spinner" />
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <p className="empty-state__message">점검 계획 정보를 찾을 수 없습니다.</p>
          <Button variant="outline" onClick={() => navigate("/sedo/inspection-plans")}>목록으로</Button>
        </div>
      </div>
    );
  }

  const regRate = detail.registrationRate ?? 0;
  const isCompleted = detail.status === "completed";
  const typeLabel = INSPECTION_TYPE_LABEL[detail.inspectionType] || detail.inspectionType;

  return (
    <div className="page-content">
      <PageHeader
        title={detail.title}
        description={`담당자: ${detail.assignee || "–"} · ${typeLabel} 점검`}
        actions={
          <Button
            variant="outline"
            icon={<FiArrowLeft />}
            onClick={() => navigate("/sedo/inspection-plans")}
          >
            목록으로
          </Button>
        }
      />

      {/* 상단 패널: 점수 + 점검 정보 */}
      <div className="pd-top-panel">
        {/* 좌측: 보안점수 + 결과등록 현황 */}
        <div className="pd-score-panel">
          <p className="pd-score-panel__title">점검 결과 현황</p>
          <div className="pd-score-row">
            <ScoreRing score={detail.score} label="종합 보안점수" size={140} />
            <ProgressRing rate={regRate} label="결과 등록률" size={140} />
          </div>
          {isCompleted && (
            <div className="pd-completed-badge">
              <MdVerified /> 점검 완료
            </div>
          )}
          {!isCompleted && detail.status === "in_progress" && (
            <div className="pd-inprogress-badge">
              <MdPendingActions /> 점검 진행중
            </div>
          )}
        </div>

        {/* 우측: 점검 계획 상세 정보 */}
        <div className="pd-info-panel">
          <p className="pd-info-panel__title">점검 계획 상세</p>
          <div className="pd-form">
            <div className="pd-form__row">
              <label>점검계획명</label>
              <span>{detail.title}</span>
            </div>
            <div className="pd-form__row">
              <label>점검 대상</label>
              <span>{detail.targetGroup}</span>
            </div>
            <div className="pd-form__row">
              <label>점검 유형</label>
              <span>
                <span className="pd-type-badge">{typeLabel}</span>
              </span>
            </div>
            <div className="pd-form__row">
              <label>진행 상태</label>
              <span><StatusBadge status={detail.status} /></span>
            </div>
            <div className="pd-form__row">
              <label>예정일</label>
              <span>{detail.scheduledAt || "-"}</span>
            </div>
            <div className="pd-form__row">
              <label>완료일</label>
              <span>{detail.completedAt || "–"}</span>
            </div>
            <div className="pd-form__row">
              <label>담당자</label>
              <span>{detail.assignee || "-"}</span>
            </div>
            <div className="pd-form__row">
              <label>점검 설명</label>
              <span>{detail.description || "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 자산 유형별 보안 수준 */}
      {detail.assetBreakdown && detail.assetBreakdown.length > 0 && (
        <div className="card pd-breakdown-card">
          <h3 className="card__title">자산 유형별 보안 수준</h3>
          <div className="pd-breakdown-grid">
            <div className="pd-breakdown-bars">
              {detail.assetBreakdown.map((item) => (
                <ProgressBar
                  key={item.type}
                  label={`${item.type} (${item.count}대)`}
                  current={item.score}
                  total={100}
                  percents
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 취약점 목록 */}
      {detail.vulnerabilities && detail.vulnerabilities.length > 0 && (
        <div className="card pd-vuln-card">
          <h3 className="card__title">주요 취약점 ({detail.vulnerabilities.length}건)</h3>
          <CommonTable
            columns={VULN_COLUMNS}
            data={detail.vulnerabilities}
            totalCount={detail.vulnerabilities.length}
            noDataMessage="등록된 취약점이 없습니다."
          />
        </div>
      )}

      {/* 점검 대상 자산 목록 */}
      {detail.assetList && detail.assetList.length > 0 && (
        <div className="card pd-asset-card">
          <h3 className="card__title">점검 대상 자산 ({detail.assetList.length}대)</h3>
          <CommonTable
            columns={ASSET_COLUMNS}
            data={detail.assetList}
            totalCount={detail.assetList.length}
            noDataMessage="점검 대상 자산이 없습니다."
          />
        </div>
      )}
    </div>
  );
}
