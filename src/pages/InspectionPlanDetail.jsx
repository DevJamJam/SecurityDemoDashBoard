import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { FiArrowLeft } from "react-icons/fi";
import useInspectionPlanStore from "@/store/useInspectionPlanStore";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import SecurityScoreCircle from "@/components/common/SecurityScoreCircle";
import Button from "@/components/common/Button";
import CommonTable from "@/components/common/CommonTable";

const ASSET_COLUMNS = [
  { key: "index", label: "No.", width: "60px", align: "center" },
  { key: "name", label: "자산명" },
  { key: "ipAddress", label: "IP 주소", width: "140px" },
  { key: "type", label: "유형", width: "110px", align: "center" },
  {
    key: "status",
    label: "점검 결과",
    width: "100px",
    align: "center",
    render: (v) => <StatusBadge status={v} />,
  },
];

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
          <Button variant="outline" onClick={() => navigate("/inspection-plans")}>
            목록으로
          </Button>
        </div>
      </div>
    );
  }

  const radarData = (detail.scoreBreakdown || []).map((item) => ({
    subject: item.category,
    score: item.score,
  }));

  return (
    <div className="page-content">
      <PageHeader
        breadcrumb="점검 관리 > 점검 계획"
        title={detail.title}
        description={`점검 계획 상세 정보 — ID: ${detail.id}`}
        actions={
          <Button
            variant="outline"
            icon={<FiArrowLeft />}
            onClick={() => navigate("/inspection-plans")}
          >
            목록으로
          </Button>
        }
      />

      <div className="detail-grid">
        <div className="card detail-grid__info">
          <h3 className="card__title">기본 정보</h3>
          <dl className="info-list">
            <div className="info-list__row">
              <dt>상태</dt>
              <dd><StatusBadge status={detail.status} /></dd>
            </div>
            <div className="info-list__row">
              <dt>점검 유형</dt>
              <dd>{detail.inspectionType}</dd>
            </div>
            <div className="info-list__row">
              <dt>대상 그룹</dt>
              <dd>{detail.targetGroup}</dd>
            </div>
            <div className="info-list__row">
              <dt>예정일</dt>
              <dd>{detail.scheduledAt}</dd>
            </div>
            <div className="info-list__row">
              <dt>완료일</dt>
              <dd>{detail.completedAt || "-"}</dd>
            </div>
            <div className="info-list__row">
              <dt>담당자</dt>
              <dd>{detail.assignee || "-"}</dd>
            </div>
            <div className="info-list__row">
              <dt>설명</dt>
              <dd>{detail.description || "-"}</dd>
            </div>
          </dl>
        </div>

        <div className="card detail-grid__score">
          <h3 className="card__title">종합 보안 점수</h3>
          <SecurityScoreCircle score={detail.score} />
        </div>

        {radarData.length > 0 && (
          <div className="card detail-grid__radar">
            <h3 className="card__title">분야별 점수</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <Radar
                  dataKey="score"
                  stroke="#14b8a6"
                  fill="#14b8a6"
                  fillOpacity={0.3}
                />
                <Tooltip formatter={(v) => [`${v}점`, "점수"]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {detail.assetList && detail.assetList.length > 0 && (
        <div className="card" style={{ marginTop: "var(--space-4)" }}>
          <h3 className="card__title">점검 대상 자산</h3>
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
