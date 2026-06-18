import { useEffect, useState } from "react";
import { FiEdit2, FiSave, FiX, FiAlertTriangle, FiShield, FiWifi } from "react-icons/fi";
import Swal from "sweetalert2";
import useNetworkSegmentStore from "@/store/useNetworkSegmentStore";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import Button from "@/components/common/Button";

const RISK_LABEL = { low: "낮음", medium: "보통", high: "높음" };
const RISK_COLOR = { low: "var(--success-color)", medium: "var(--warning-color)", high: "var(--danger-color)" };

export default function NetworkSegments() {
  const { segments, loading, fetchSegments, updateSegment } = useNetworkSegmentStore();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const startEdit = (seg) => {
    setEditingId(seg.id);
    setEditForm({ description: seg.description, status: seg.status });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (seg) => {
    const result = await Swal.fire({
      title: "변경 저장",
      text: "네트워크 세그먼트 정보를 저장하시겠습니까?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "저장",
      cancelButtonText: "취소",
      confirmButtonColor: "#14b8a6",
    });
    if (!result.isConfirmed) return;

    await updateSegment(seg.id, editForm);
    setEditingId(null);
    setEditForm({});
    Swal.fire({ title: "저장 완료", icon: "success", timer: 1200, showConfirmButton: false });
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          <div className="loading-state__spinner" />
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <PageHeader
        breadcrumb="인프라 관리"
        title="Network Segments"
        description="네트워크 세그먼트 현황 · 위험도 · 취약점 현황 관리"
      />

      <div className="segment-list">
        {segments.map((seg) => {
          const isEditing = editingId === seg.id;
          const riskColor = RISK_COLOR[seg.riskLevel] || "var(--sub-text-color)";

          return (
            <div key={seg.id} className={`card segment-card${isEditing ? " editing" : ""}`}>
              <div className="segment-card__header">
                <div className="segment-card__info">
                  <span className="segment-card__id">{seg.id}</span>
                  <h3 className="segment-card__name">{seg.nameKo || seg.name}</h3>
                  <p className="segment-card__name-en">{seg.name}</p>
                </div>
                <div className="segment-card__header-actions">
                  {isEditing ? (
                    <>
                      <Button variant="accent" size="sm" icon={<FiSave />} onClick={() => handleSave(seg)}>
                        저장
                      </Button>
                      <Button variant="ghost" size="sm" icon={<FiX />} onClick={cancelEdit}>
                        취소
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" icon={<FiEdit2 />} onClick={() => startEdit(seg)}>
                      편집
                    </Button>
                  )}
                </div>
              </div>

              <div className="segment-card__risk-bar">
                <div
                  className="segment-card__risk-badge"
                  style={{ background: `${riskColor}1a`, color: riskColor, borderColor: riskColor }}
                >
                  <FiAlertTriangle />
                  위험도 {RISK_LABEL[seg.riskLevel] || seg.riskLevel} ({seg.riskScore}점)
                </div>
                <StatusBadge status={isEditing ? editForm.status : seg.status} />
              </div>

              <dl className="segment-card__meta">
                <div>
                  <dt>CIDR</dt>
                  <dd><code>{seg.cidr}</code></dd>
                </div>
                <div>
                  <dt>IP 범위</dt>
                  <dd><code style={{ fontSize: "var(--font-10)" }}>{seg.ipRange}</code></dd>
                </div>
                <div>
                  <dt>자산 수</dt>
                  <dd>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <FiWifi style={{ color: "var(--accent-color)" }} />
                      {seg.assetCount}개
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>상태</dt>
                  <dd>
                    {isEditing ? (
                      <select
                        className="search-menu__select"
                        value={editForm.status}
                        onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      >
                        <option value="active">활성</option>
                        <option value="inactive">비활성</option>
                      </select>
                    ) : (
                      <StatusBadge status={seg.status} />
                    )}
                  </dd>
                </div>
              </dl>

              <div className="segment-card__vuln-row">
                <div className="segment-card__vuln-item">
                  <FiAlertTriangle color="var(--danger-color)" />
                  <span>취약점 <strong>{seg.vulnerabilityCount}</strong>건</span>
                </div>
                <div className="segment-card__vuln-item">
                  <FiShield color="var(--warning-color)" />
                  <span>오픈 포트 <strong>{seg.openPortCount}</strong>개</span>
                </div>
                <div className="segment-card__vuln-item">
                  <span style={{ fontSize: "var(--font-10)", color: "var(--sub-text-color)" }}>
                    최근 점검: {seg.lastInspectedAt ? seg.lastInspectedAt.split("T")[0] : "-"}
                  </span>
                </div>
              </div>

              <div className="segment-card__desc">
                <dt>설명</dt>
                {isEditing ? (
                  <textarea
                    className="segment-card__textarea"
                    value={editForm.description}
                    rows={2}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  />
                ) : (
                  <dd>{seg.description || "-"}</dd>
                )}
              </div>

              {seg.tags && seg.tags.length > 0 && (
                <div className="segment-card__tags">
                  {seg.tags.map((tag) => (
                    <span key={tag} className="segment-card__tag">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {segments.length === 0 && (
          <div className="empty-state">
            <p className="empty-state__message">네트워크 세그먼트 데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
