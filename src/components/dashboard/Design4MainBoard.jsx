import { useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, Tooltip,
  XAxis, YAxis, CartesianGrid,
} from "recharts";
import { buildDashboardTrendBoards, STEP_META } from "@/config/data/adminHomeDrilldownMock";

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ title, desc, right }) {
  return (
    <div className="admin-panel__header admin-panel__header--row compact">
      <div>
        <h3>{title}</h3>
        {desc && <span>{desc}</span>}
      </div>
      {right}
    </div>
  );
}

function StatusBadge({ value }) {
  const cls = {
    진행중: "running", 완료: "success", 승인대기: "pending", 조치예정: "warning",
    정상: "success", 점검중: "running", 높음: "danger", 중간: "warning", 낮음: "success",
    HIGH: "danger", CRITICAL: "danger", MEDIUM: "warning", LOW: "success",
    CCE: "pending", CVE: "running",
  };
  return (
    <span className={`admin-status-badge ${cls[value] || "default"}`}>{value}</span>
  );
}

function formatDelta(delta) {
  if (!delta) return null;
  const abs = Math.abs(delta);
  if (delta > 0) return <span className="admin-trend-delta is-up">(▲ {abs})</span>;
  return <span className="admin-trend-delta is-down">(▼ {abs})</span>;
}

function buildStepMap(stepSummary = []) {
  return stepSummary.reduce((acc, s) => { acc[s.stepKey] = s.count; return acc; }, {});
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Tabbed Trend Board  (CCE / CVE 탭 전환 단일 테이블)
// ─────────────────────────────────────────────────────────────────────────────

function TabbedTrendBoard({ cceRows, cveRows, onOpenTrendSummary }) {
  const [tab, setTab] = useState("CCE");
  const rows = tab === "CCE" ? cceRows : cveRows;
  const steps = Object.values(STEP_META).sort((a, b) => a.order - b.order);

  const cols = rows.map((row, i) => ({
    month: row.month,
    inspected: `${row.inspected}건`,
    foundCount: `${row.foundCount}건`,
    foundDelta: i === 0 ? 0 : row.foundCount - rows[i - 1].foundCount,
    remaining: `${row.remainingCount}건`,
    stepMap: buildStepMap(row.stepSummary || []),
    redetect: row.redetectCount ?? 0,
    trendRow: row,
  }));

  const tabBtn = (key) => (
    <button type="button" role="tab" aria-selected={tab === key}
      className={`d4-tab-btn${tab === key ? " d4-tab-btn--active" : ""}`}
      onClick={() => setTab(key)}>
      {key}
    </button>
  );

  return (
    <section className="admin-content-card trend-table-card design4-card">
      <SectionHeader
        title="월별 점검 현황"
        desc="운영 기간 내 점검 현황을 월별로 비교합니다."
        right={
          <div className="d4-tab-group" role="tablist">
            {tabBtn("CCE")}
            {tabBtn("CVE")}
          </div>
        }
      />
      <div className="admin-trend-matrix-wrap">
        <table className="admin-trend-matrix-table">
          <thead>
            <tr>
              <th className="admin-trend-matrix-table__corner" colSpan={2}>구분</th>
              {cols.map((c) => (
                <th key={`${tab}-${c.month}`} className="admin-trend-matrix-table__month">{c.month}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th colSpan={2}>점검 범위</th>
              {cols.map((c) => <td key={`${tab}-${c.month}-i`}>{c.inspected}</td>)}
            </tr>
            <tr>
              <th colSpan={2}>신규 탐지</th>
              {cols.map((c) => (
                <td key={`${tab}-${c.month}-f`}>
                  <div className="admin-trend-value-stack">
                    <strong>{c.foundCount}</strong>
                    {formatDelta(c.foundDelta)}
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <th colSpan={2}>미처리</th>
              {cols.map((c) => <td key={`${tab}-${c.month}-r`}>{c.remaining}</td>)}
            </tr>
            {steps.map((step, idx) => (
              <tr key={`${tab}-step-${step.key}`}>
                {idx === 0 ? (
                  <th rowSpan={steps.length} className="admin-trend-matrix-table__stage-group">조치 단계</th>
                ) : null}
                <th className="admin-trend-matrix-table__stage-label">{step.label}</th>
                {cols.map((c) => (
                  <td key={`${tab}-${c.month}-${step.key}`} className="admin-trend-matrix-table__stage-value">
                    {c.stepMap[step.key] > 0 ? c.stepMap[step.key] : "-"}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th colSpan={2}>재탐지</th>
              {cols.map((c) => (
                <td key={`${tab}-${c.month}-rd`} className="admin-trend-matrix-table__stage-value">
                  {c.redetect > 0 ? c.redetect : "-"}
                </td>
              ))}
            </tr>
            <tr>
              <th colSpan={2}>상세</th>
              {cols.map((c) => (
                <td key={`${tab}-${c.month}-det`} className="admin-trend-matrix-table__detail-cell">
                  <button type="button" className="admin-inline-link-btn admin-inline-link-btn--sm"
                    onClick={() => onOpenTrendSummary?.({ ...c.trendRow, foundDelta: c.foundDelta }, tab)}>
                    보기
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2a. Security Area Chart  (토글 버튼 없이 항상 두 지표 동시 표시)
// ─────────────────────────────────────────────────────────────────────────────

function AreaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const sec = payload.find((p) => p.dataKey === "security");
  const fix = payload.find((p) => p.dataKey === "fix");
  return (
    <div className="design4-rate-tooltip">
      <strong>{label}</strong>
      {sec && (
        <span className="design4-rate-tooltip__row">
          <span className="design4-rate-tooltip__dot design4-rate-tooltip__dot--security" />
          {`보안율 ${sec.value}%`}
        </span>
      )}
      {fix && (
        <span className="design4-rate-tooltip__row">
          <span className="design4-rate-tooltip__dot design4-rate-tooltip__dot--fix" />
          {`조치율 ${fix.value}%`}
        </span>
      )}
    </div>
  );
}

function SecurityAreaChart({ detail }) {
  const summary = detail.design4?.securitySummary;

  const chartData = useMemo(() => {
    if (!summary) return [];
    const sh = summary.securityRateHistory ?? [];
    const fh = summary.fixRateHistory ?? [];
    const len = Math.max(sh.length, fh.length);
    return Array.from({ length: len }, (_, i) => ({
      month: sh[i]?.month ?? fh[i]?.month ?? "",
      security: sh[i]?.value ?? null,
      fix: fh[i]?.value ?? null,
    }));
  }, [summary]);

  if (!summary) return null;

  const secVal = summary.overallSecurityRate ?? 0;
  const fixVal = summary.vulnerabilityFixRate ?? 0;

  return (
    <section className="admin-content-card design4-card d4-area-chart-card">
      <SectionHeader
        title="보안 지표 추이"
        desc={summary.scopeLabel ? `${summary.scopeLabel} 보안율 · 조치율` : "보안율 · 조치율 추이"}
      />
      <div className="d4-area-legend">
        <span className="d4-legend-dot d4-legend-dot--sec" />
        <span className="d4-legend-label">보안율 <strong>{secVal}%</strong></span>
        <span className="d4-legend-sep" />
        <span className="d4-legend-dot d4-legend-dot--fix" />
        <span className="d4-legend-label">조치율 <strong>{fixVal}%</strong></span>
      </div>
      <div className="d4-area-chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`}
              stroke="var(--text-secondary)" tick={{ fontSize: 11 }} width={42} />
            <Tooltip content={<AreaTooltip />}
              cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }} />
            <Area type="monotone" dataKey="security" name="보안율"
              stroke="var(--brand-primary)" strokeWidth={2}
              fill="var(--brand-primary)" fillOpacity={0.1}
              dot={{ r: 3, fill: "var(--brand-primary)", strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0, fill: "var(--brand-primary)" }}
              connectNulls />
            <Area type="monotone" dataKey="fix" name="조치율"
              stroke="var(--status-success)" strokeWidth={2}
              fill="var(--status-success)" fillOpacity={0.1}
              dot={{ r: 3, fill: "var(--status-success)", strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0, fill: "var(--status-success)" }}
              connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2b. Process Stage Bars  (점 인디케이터 리스트 → 수평 바 카드)
// ─────────────────────────────────────────────────────────────────────────────

function stageTone(key) {
  if (key === "unresolved" || key === "overdue") return "danger";
  if (key === "pending_approval" || key === "due_soon") return "warning";
  return "warning";
}

function ProcessStageBars({ detail, onOpenProcessTickets }) {
  const rows = detail.design4?.processStatusSummary ?? [];

  return (
    <section className="admin-content-card design4-card d4-process-bars-card">
      <SectionHeader title="처리 단계 현황" desc="조치 단계별 건수 분포" />
      <div className="d4-process-bars">
        {rows.map((item) => {
          const tone = stageTone(item.key);
          const clickable = typeof onOpenProcessTickets === "function" && (item.count ?? 0) > 0;
          return (
            <div key={item.key}
              className={`d4-process-bar-row${clickable ? " d4-process-bar-row--clickable" : ""}`}
              onClick={() => clickable && onOpenProcessTickets(item)}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={clickable ? (e) => e.key === "Enter" && onOpenProcessTickets(item) : undefined}
              title={clickable ? `${item.label} 상세 보기` : undefined}>
              <div className="d4-process-bar-header">
                <div className="d4-process-bar-label">
                  <span className={`d4-process-tone d4-process-tone--${tone}`} />
                  <strong>{item.label}</strong>
                  {item.helper && <span className="d4-process-helper">{item.helper}</span>}
                </div>
                <span className={`d4-process-count d4-process-count--${tone}`}>{item.count}건</span>
              </div>
              <div className="d4-process-track">
                <div className={`d4-process-fill d4-process-fill--${tone}`}
                  style={{ width: `${Math.min(item.percent ?? 0, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Department Status Rows  (모든 화면 폭에서 자연스럽게 가득 채워지는 행 레이아웃)
// ─────────────────────────────────────────────────────────────────────────────

function completionTone(rate) {
  if (rate >= 85) return "blue";
  if (rate >= 70) return "green";
  if (rate >= 50) return "orange";
  return "red";
}

function DeptTileGrid({ detail, selectedNodeId, onSelectNode, onDeptKpiClick }) {
  const rows = detail.design4?.organizationRows ?? [];
  if (!rows.length) return null;

  return (
    <section className="admin-content-card design4-card">
      <SectionHeader title="부서별 현황" desc="하위 부서의 보안 지표를 한눈에 비교합니다." />
      <div className="d4-dept-rows">
        {rows.map((item) => {
          const tone = completionTone(item.completionRate);
          const isSelected = selectedNodeId === item.id;
          return (
            <div key={item.id}
              className={`d4-dept-row${isSelected ? " d4-dept-row--selected" : ""}`}>
              {/* 부서명 */}
              <button type="button" className="d4-dept-row__name"
                onClick={() => onSelectNode?.(item.id)} title="이 부서로 전환">
                {item.name}
              </button>

              {/* KPI 칩 */}
              <div className="d4-dept-row__kpis">
                <button type="button" className="d4-row-chip d4-row-chip--danger"
                  onClick={() => onDeptKpiClick?.(item, "highRisk")}>
                  위험&nbsp;<strong>{item.highRiskCount}건</strong>
                </button>
                <button type="button" className="d4-row-chip d4-row-chip--warning"
                  onClick={() => onDeptKpiClick?.(item, "unchecked")}>
                  미점검&nbsp;<strong>{item.uncheckedCount}개</strong>
                </button>
                <button type="button" className="d4-row-chip d4-row-chip--neutral"
                  onClick={() => onDeptKpiClick?.(item, "pending")}>
                  대기&nbsp;<strong>{item.pendingCount}건</strong>
                </button>
                <button type="button" className="d4-row-chip d4-row-chip--neutral"
                  onClick={() => onDeptKpiClick?.(item, "assets")}>
                  자산&nbsp;<strong>{item.assetCount}개</strong>
                </button>
              </div>

              {/* 완료율 바 */}
              <div className="d4-dept-row__meter">
                <div className="d4-dept-row__track">
                  <div className={`d4-dept-row__fill d4-dept-row__fill--${tone}`}
                    style={{ width: `${item.completionRate}%` }} />
                </div>
                <span className={`d4-dept-row__pct d4-dept-row__pct--${tone}`}>
                  {item.completionRate}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Issue Tab Table  (위험 자산 / 주요 취약점 탭 전환 단일 테이블)
// ─────────────────────────────────────────────────────────────────────────────

function IssueTabTable({ detail, onOpenAssetIssues, onOpenVulnDetail }) {
  const [tab, setTab] = useState("risk");
  const riskRows = detail.design4?.topRiskAssetRows ?? [];
  const vulnRows = detail.design4?.topVulnerabilityRows ?? [];

  const tabBtn = (key, label) => (
    <button type="button" role="tab" aria-selected={tab === key}
      className={`d4-tab-btn${tab === key ? " d4-tab-btn--active" : ""}`}
      onClick={() => setTab(key)}>
      {label}
    </button>
  );

  return (
    <section className="admin-content-card design4-card">
      <SectionHeader
        title="주요 이슈"
        desc="우선 확인이 필요한 자산과 취약점을 표시합니다."
        right={
          <div className="d4-tab-group" role="tablist">
            {tabBtn("risk", "위험 자산")}
            {tabBtn("vuln", "주요 취약점")}
          </div>
        }
      />
      {tab === "risk" ? (
        <div className="design4-table-scroll">
          <table className="design4-data-table design4-data-table--assets">
            <thead>
              <tr>
                <th>자산명</th><th>IP</th><th>위험도</th>
                <th>시스템 점검</th><th>취약점 스캔</th><th>담당</th><th>상세</th>
              </tr>
            </thead>
            <tbody>
              {riskRows.length === 0 ? (
                <tr><td colSpan={7} className="design4-data-table__empty">표시할 자산이 없습니다.</td></tr>
              ) : riskRows.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.ip}</td>
                  <td><StatusBadge value={item.risk} /></td>
                  <td>{item.cceCount}건</td>
                  <td>{item.cveCount}건</td>
                  <td>{item.owner}</td>
                  <td>
                    <button type="button" className="admin-inline-link-btn admin-inline-link-btn--sm"
                      onClick={() => onOpenAssetIssues?.(item)}>상세보기</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="design4-table-scroll">
          <table className="design4-data-table design4-data-table--vulns">
            <thead>
              <tr>
                <th>구분</th><th>취약점명</th><th>심각도</th>
                <th>영향 범위</th><th>조치 현황</th><th>상세</th>
              </tr>
            </thead>
            <tbody>
              {vulnRows.length === 0 ? (
                <tr><td colSpan={6} className="design4-data-table__empty">표시할 취약점이 없습니다.</td></tr>
              ) : vulnRows.map((item) => (
                <tr key={item.id}>
                  <td><StatusBadge value={item.category} /></td>
                  <td>{item.name}</td>
                  <td><StatusBadge value={item.severity} /></td>
                  <td>{item.affectedAssetCount}개</td>
                  <td>{item.status}</td>
                  <td>
                    <button type="button" className="admin-inline-link-btn admin-inline-link-btn--sm"
                      onClick={() => onOpenVulnDetail?.(item)}>상세보기</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

export default function Design4MainBoard({
  detail,
  onOpenTrendSummary,
  onOpenAssetIssues,
  onOpenVulnDetail,
  onOpenProcessTickets,
  onDeptKpiClick,
  selectedNodeId,
  onSelectNode,
}) {
  const { cceRows, cveRows } = useMemo(() => {
    if (detail.design4?.cceRows && detail.design4?.cveRows) {
      return { cceRows: detail.design4.cceRows, cveRows: detail.design4.cveRows };
    }
    return buildDashboardTrendBoards(detail);
  }, [detail]);

  const hasChildDepts = detail.childDepartments?.length > 0;

  return (
    <section className="design4-main">
      {/* 1. Department tile grid — KPI 지표 바로 아래 (parent nodes only) */}
      {hasChildDepts && (
        <DeptTileGrid
          detail={detail}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          onDeptKpiClick={onDeptKpiClick}
        />
      )}

      {/* 2. Tabbed trend board */}
      <TabbedTrendBoard cceRows={cceRows} cveRows={cveRows} onOpenTrendSummary={onOpenTrendSummary} />

      {/* 3. Security area chart + process stage bars */}
      <div className="d4-metrics-row">
        <SecurityAreaChart detail={detail} />
        <ProcessStageBars detail={detail} onOpenProcessTickets={onOpenProcessTickets} />
      </div>

      {/* 4. Issue tab table */}
      <IssueTabTable
        detail={detail}
        onOpenAssetIssues={onOpenAssetIssues}
        onOpenVulnDetail={onOpenVulnDetail}
      />
    </section>
  );
}
