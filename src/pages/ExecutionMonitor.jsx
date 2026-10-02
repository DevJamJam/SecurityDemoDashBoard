import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiPlay, FiSquare, FiRefreshCw } from "react-icons/fi";
import Swal from "sweetalert2";
import useExecutionStore from "@/store/useExecutionStore";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ProgressBar from "@/components/common/ProgressBar";
import Button from "@/components/common/Button";

const POLL_INTERVAL = 10_000;

const STATUS_FILTERS = [
  { value: "all",       label: "전체" },
  { value: "running",   label: "실행중" },
  { value: "completed", label: "완료" },
  { value: "scheduled", label: "예약" },
  { value: "failed",    label: "실패" },
];

export default function ExecutionMonitor() {
  const location = useLocation();
  const { jobs, loading, fetchJobs, updateStatus, clearPersistedStates, silentPoll } = useExecutionStore();
  const [statusFilter, setStatusFilter] = useState(location.state?.autoStatus ?? "all");
  const pollRef = useRef(null);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // running 작업이 있을 때만 10초 polling — 없어지면 자동 중단
  const hasRunning = jobs.some((j) => j.status === "running");
  useEffect(() => {
    if (hasRunning) {
      pollRef.current = setInterval(silentPoll, POLL_INTERVAL);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [hasRunning, silentPoll]);

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
      await updateStatus(job.id, { status: "running" });
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
      await updateStatus(job.id, { status: "failed" });
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

  // 필터는 로컬 상태 — polling으로 jobs가 갱신돼도 필터 초기화 없음
  const filteredJobs = statusFilter === "all"
    ? jobs
    : jobs.filter((j) => j.status === statusFilter);

  return (
    <div className="page-content">
      <PageHeader
        title="실행 모니터"
        description="점검 작업 실행 현황 및 상태 관리 (Mock 데모 — localStorage 상태 유지)"
        actions={
          <Button variant="outline" size="sm" icon={<FiRefreshCw />} onClick={handleClear}>
            상태 초기화
          </Button>
        }
      />

      {/* 필터 + 자동 갱신 표시 */}
      <div className="exec-toolbar">
        <div className="exec-toolbar__filters">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`exec-toolbar__filter-btn${statusFilter === f.value ? " is-active" : ""}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
              {f.value !== "all" && (
                <span className="exec-toolbar__filter-count">
                  {jobs.filter((j) => j.status === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
        {hasRunning && (
          <span className="exec-toolbar__poll-badge">
            <span className="exec-toolbar__poll-dot" />
            10초 자동 갱신 중
          </span>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-state__spinner" />
          <p>데이터를 불러오는 중...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__message">해당 상태의 작업이 없습니다.</p>
        </div>
      ) : (
        <div className="execution-grid">
          {filteredJobs.map((job) => (
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
