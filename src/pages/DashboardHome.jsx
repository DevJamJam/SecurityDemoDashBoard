import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { FiClipboard, FiActivity, FiCheckSquare, FiServer } from "react-icons/fi";
import SecurityScoreCircle from "@/components/common/SecurityScoreCircle";
import StatusBadge from "@/components/common/StatusBadge";
import { getInspectionPlans, getExecutionJobs, getAssets } from "@/api/securityDemoApi";

const CATEGORY_COLORS = ["#14b8a6", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444"];

export default function DashboardHome() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [assetCount, setAssetCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getInspectionPlans({ page: 1, pageSize: 5 }),
      getExecutionJobs(),
      getAssets(),
    ])
      .then(([planRes, jobRes, assetRes]) => {
        setPlans(planRes.data.items || []);
        setJobs(jobRes.data.items || []);
        setAssetCount(assetRes.data.totalCount || 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const completedPlans = plans.filter((p) => p.status === "completed").length;
  const runningJobs = jobs.filter((j) => j.status === "running").length;
  const avgScore = plans.length
    ? Math.round(plans.reduce((s, p) => s + (p.score || 0), 0) / plans.length)
    : 0;

  const scoreBreakdownData = [
    { name: "네트워크", score: 72 },
    { name: "서버", score: 85 },
    { name: "DB", score: 68 },
    { name: "클라우드", score: 91 },
    { name: "엔드포인트", score: 60 },
  ];

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
      <div className="page-header">
        <div className="page-header__info">
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__description">보안 점검 현황 종합 현황판</p>
        </div>
      </div>

      <div className="summary-cards">
        <div className="card summary-card">
          <div className="summary-card__icon" style={{ background: "#e0f2fe" }}>
            <FiClipboard color="#0284c7" />
          </div>
          <div className="summary-card__body">
            <p className="summary-card__label">점검 계획</p>
            <p className="summary-card__value">{plans.length}</p>
            <p className="summary-card__sub">완료 {completedPlans}건</p>
          </div>
        </div>

        <div className="card summary-card">
          <div className="summary-card__icon" style={{ background: "#f0fdf4" }}>
            <FiActivity color="#16a34a" />
          </div>
          <div className="summary-card__body">
            <p className="summary-card__label">실행 작업</p>
            <p className="summary-card__value">{jobs.length}</p>
            <p className="summary-card__sub">진행중 {runningJobs}건</p>
          </div>
        </div>

        <div className="card summary-card">
          <div className="summary-card__icon" style={{ background: "#fefce8" }}>
            <FiCheckSquare color="#ca8a04" />
          </div>
          <div className="summary-card__body">
            <p className="summary-card__label">평균 보안 점수</p>
            <p className="summary-card__value">{avgScore}</p>
            <p className="summary-card__sub">점 / 100점 만점</p>
          </div>
        </div>

        <div className="card summary-card">
          <div className="summary-card__icon" style={{ background: "#fdf4ff" }}>
            <FiServer color="#9333ea" />
          </div>
          <div className="summary-card__body">
            <p className="summary-card__label">관리 자산</p>
            <p className="summary-card__value">{assetCount}</p>
            <p className="summary-card__sub">등록 자산 수</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-grid__score">
          <h3 className="card__title">종합 보안 점수</h3>
          <SecurityScoreCircle score={avgScore} />
        </div>

        <div className="card dashboard-grid__chart">
          <h3 className="card__title">분야별 점수</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreBreakdownData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v}점`, "점수"]} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {scoreBreakdownData.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card dashboard-grid__recent">
          <div className="card__header">
            <h3 className="card__title">최근 점검 계획</h3>
            <button className="card__link" onClick={() => navigate("/inspection-plans")}>
              전체 보기
            </button>
          </div>
          <ul className="recent-list">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="recent-list__item"
                onClick={() => navigate(`/inspection-plans/${plan.id}`)}
              >
                <span className="recent-list__name">{plan.title}</span>
                <StatusBadge status={plan.status} />
              </li>
            ))}
            {plans.length === 0 && (
              <li className="recent-list__empty">데이터가 없습니다.</li>
            )}
          </ul>
        </div>

        <div className="card dashboard-grid__jobs">
          <div className="card__header">
            <h3 className="card__title">실행 작업 현황</h3>
            <button className="card__link" onClick={() => navigate("/execution-monitor")}>
              전체 보기
            </button>
          </div>
          <ul className="recent-list">
            {jobs.slice(0, 5).map((job) => (
              <li key={job.id} className="recent-list__item">
                <span className="recent-list__name">{job.title}</span>
                <StatusBadge status={job.status} />
              </li>
            ))}
            {jobs.length === 0 && (
              <li className="recent-list__empty">데이터가 없습니다.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
