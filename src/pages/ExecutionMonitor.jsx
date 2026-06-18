import { useEffect } from "react";
import { FiPlay, FiSquare, FiRefreshCw } from "react-icons/fi";
import Swal from "sweetalert2";
import useExecutionStore from "@/store/useExecutionStore";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ProgressBar from "@/components/common/ProgressBar";
import Button from "@/components/common/Button";

export default function ExecutionMonitor() {
  const { jobs, loading, fetchJobs, updateStatus, clearPersistedStates } = useExecutionStore();

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleStart = async (job) => {
    const result = await Swal.fire({
      title: "실행 시작",
      text: `'${job.title}' 작업을 시작하시겠습니까?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "시작",
      cancelButtonText: "취소",
      confirmButtonColor: "#14b8a6",
    });
    if (result.isConfirmed) {
      await updateStatus(job.id, "running");
    }
  };

  const handleStop = async (job) => {
    const result = await Swal.fire({
      title: "실행 중단",
      text: `'${job.title}' 작업을 중단하시겠습니까?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "중단",
      cancelButtonText: "취소",
      confirmButtonColor: "#ef4444",
    });
    if (result.isConfirmed) {
      await updateStatus(job.id, "failed");
    }
  };

  const handleClear = async () => {
    const result = await Swal.fire({
      title: "상태 초기화",
      text: "로컬에 저장된 실행 상태를 초기화하고 기본 상태로 돌아갑니다.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "초기화",
      cancelButtonText: "취소",
    });
    if (result.isConfirmed) {
      clearPersistedStates();
      fetchJobs();
    }
  };

  return (
    <div className="page-content">
      <PageHeader
        breadcrumb="점검 관리"
        title="Execution Monitor"
        description="점검 작업 실행 현황 및 상태 관리 (Mock 데모 — localStorage 상태 유지)"
        actions={
          <Button variant="outline" size="sm" icon={<FiRefreshCw />} onClick={handleClear}>
            상태 초기화
          </Button>
        }
      />

      {loading ? (
        <div className="loading-state">
          <div className="loading-state__spinner" />
          <p>데이터를 불러오는 중...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__message">실행 작업이 없습니다.</p>
        </div>
      ) : (
        <div className="execution-grid">
          {jobs.map((job) => (
            <div key={job.id} className="card execution-card">
              <div className="execution-card__header">
                <div className="execution-card__info">
                  <p className="execution-card__id">{job.id}</p>
                  <h3 className="execution-card__title">{job.title}</h3>
                  <p className="execution-card__target">{job.targetGroup}</p>
                </div>
                <StatusBadge status={job.status} />
              </div>

              <div className="execution-card__progress">
                <div className="execution-card__progress-label">
                  <span>진행률</span>
                  <span>{job.progress}%</span>
                </div>
                <ProgressBar percent={job.progress} />
              </div>

              <dl className="execution-card__meta">
                <div>
                  <dt>시작일시</dt>
                  <dd>{job.startedAt || "-"}</dd>
                </div>
                <div>
                  <dt>완료일시</dt>
                  <dd>{job.completedAt || "-"}</dd>
                </div>
              </dl>

              <div className="execution-card__actions">
                {(job.status === "scheduled" || job.status === "failed") && (
                  <Button
                    variant="accent"
                    size="sm"
                    icon={<FiPlay />}
                    onClick={() => handleStart(job)}
                  >
                    시작
                  </Button>
                )}
                {job.status === "running" && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<FiSquare />}
                    onClick={() => handleStop(job)}
                  >
                    중단
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
