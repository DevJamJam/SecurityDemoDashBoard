import { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, Tooltip,
  XAxis, YAxis, CartesianGrid, LabelList,
} from "recharts";
import { buildDashboardTrendBoards, STEP_META } from "@/config/data/adminHomeDrilldownMock";

function SectionHeader({ title, desc }) {
  return (
    <div className="admin-panel__header admin-panel__header--row">
      <div>
        <h3>{title}</h3>
        {desc && <span>{desc}</span>}
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const badgeClassMap = {
    진행중: "running", 완료: "success", 승인대기: "pending", 조치예정: "warning",
    정상: "success", 점검중: "running", 높음: "danger", 중간: "warning", 낮음: "success",
    HIGH: "danger", CRITICAL: "danger", MEDIUM: "warning", LOW: "success",
    CCE: "pending", CVE: "running",
  };
  return (
    <span className={`admin-status-badge ${badgeClassMap[value] || "default"}`}>
      {value}
    </span>
  );
}

function formatDelta(deltaValue) {
  if (!deltaValue) return null;
  const abs = Math.abs(deltaValue);
  if (deltaValue > 0) return <span className="admin-trend-delta is-up">(▲ {abs})</span>;
  return <span className="admin-trend-delta is-down">(▼ {abs})</span>;
}

function buildStepDisplayMap(stepSummary = []) {
  return stepSummary.reduce((acc, step) => {
    acc[step.stepKey] = step.count;
    return acc;
  }, {});
}

function TrendTable({ title, rows, type, onOpenTrendSummary }) {
  const orderedSteps = Object.values(STEP_META).sort((a, b) => a.order - b.order);
  const monthColumns = rows.map((row, index) => ({
    month: row.month,
    inspected: `${row.inspected}건`,
    foundCount: `${row.foundCount}건`,
    foundDelta: index === 0 ? 0 : row.foundCount - rows[index - 1].foundCount,
    remainingCount: `${row.remainingCount}건`,
    stepDisplayMap: buildStepDisplayMap(row.stepSummary || []),
    redetectCount: row.redetectCount ?? 0,
    trendRow: row,
  }));

  return (
    <section className="admin-content-card trend-table-card design4-card">
      <SectionHeader title={title} desc="월별 주요 수치를 표 형태로 비교합니다." />
      <div className="admin-trend-matrix-wrap">
        <table className="admin-trend-matrix-table">
          <thead>
            <tr>
              <th scope="col" className="admin-trend-matrix-table__corner" colSpan={2}>구분</th>
              {monthColumns.map((col) => (
                <th scope="col" key={`${type}-${col.month}`} className="admin-trend-matrix-table__month">
                  {col.month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" colSpan={2}>점검 자산</th>
              {monthColumns.map((col) => (
                <td key={`${type}-${col.month}-inspected`}>{col.inspected}</td>
              ))}
            </tr>
            <tr>
              <th scope="row" colSpan={2}>발견 건수</th>
              {monthColumns.map((col) => (
                <td key={`${type}-${col.month}-found`}>
                  <div className="admin-trend-value-stack">
                    <strong>{col.foundCount}</strong>
                    {formatDelta(col.foundDelta)}
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" colSpan={2}>잔존 건수</th>
              {monthColumns.map((col) => (
                <td key={`${type}-${col.month}-remaining`}>{col.remainingCount}</td>
              ))}
            </tr>
            {orderedSteps.map((step, stepIndex) => (
              <tr key={`${type}-step-${step.key}`}>
                {stepIndex === 0 ? (
                  <th scope="rowgroup" rowSpan={orderedSteps.length} className="admin-trend-matrix-table__stage-group">
                    단계현황
                  </th>
                ) : null}
                <th scope="row" className="admin-trend-matrix-table__stage-label">{step.label}</th>
                {monthColumns.map((col) => (
                  <td key={`${type}-${col.month}-${step.key}`} className="admin-trend-matrix-table__stage-value">
                    {col.stepDisplayMap[step.key] > 0 ? col.stepDisplayMap[step.key] : "-"}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" colSpan={2}>재탐지</th>
              {monthColumns.map((col) => (
                <td key={`${type}-${col.month}-redetect`} className="admin-trend-matrix-table__stage-value">
                  {col.redetectCount > 0 ? col.redetectCount : "-"}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" colSpan={2}>상세</th>
              {monthColumns.map((col) => (
                <td key={`${type}-${col.month}-detail`} className="admin-trend-matrix-table__detail-cell">
                  <button
                    type="button"
                    className="admin-inline-link-btn admin-inline-link-btn--sm"
                    onClick={() => onOpenTrendSummary?.({ ...col.trendRow, foundDelta: col.foundDelta }, type)}
                  >
                    상세보기
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

function getCompletionTone(rate) {
  if (rate >= 85) return "blue";
  if (rate >= 70) return "green";
  if (rate >= 50) return "orange";
  return "red";
}

function OrganizationStatusBoard({ detail, selectedNodeId, onSelectNode, onDeptKpiClick }) {
  const rows = detail.design4?.organizationRows || [];
  if (!rows.length) return null;

  const handleKpi = (item, kpiKey) => (e) => { e.stopPropagation(); onDeptKpiClick?.(item, kpiKey); };
  const handleNameClick = (item) => (e) => { e.stopPropagation(); onSelectNode?.(item.id); };

  return (
    <section className="admin-content-card design4-card">
      <SectionHeader title="하위 부서 현황" desc="선택 범위 아래 조직의 상태를 바로 비교합니다." />
      <div className="design4-table-scroll">
        <table className="design4-data-table design4-data-table--org">
          <colgroup>
            <col style={{ width: "16%" }} />
            <col style={{ width: "11%" }} /><col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} /><col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} /><col style={{ width: "11%" }} />
            <col style={{ width: "18%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>부서명</th><th>고위험 취약점</th><th>미점검 자산</th>
              <th>승인/조치대기</th><th>진행 중 점검</th>
              <th>명령 실패</th><th>관리 자산</th><th>완료율</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const tone = getCompletionTone(item.completionRate);
              return (
                <tr key={item.id} className={`design4-org-row ${selectedNodeId === item.id ? "is-selected" : ""}`}>
                  <td className="design4-org-cell--name" onClick={handleNameClick(item)} title="이 부서로 대시보드 전환">
                    {item.name}
                  </td>
                  <td className="design4-org-cell--kpi" onClick={handleKpi(item, "highRisk")}>{item.highRiskCount}건</td>
                  <td className="design4-org-cell--kpi" onClick={handleKpi(item, "unchecked")}>{item.uncheckedCount}개</td>
                  <td className="design4-org-cell--kpi" onClick={handleKpi(item, "pending")}>{item.pendingCount}건</td>
                  <td className="design4-org-cell--kpi" onClick={handleKpi(item, "inspections")}>{item.inspectionCount}건</td>
                  <td className="design4-org-cell--kpi" onClick={handleKpi(item, "command")}>{item.commandFailCount}건</td>
                  <td className="design4-org-cell--kpi" onClick={handleKpi(item, "assets")}>{item.assetCount}개</td>
                  <td className="design4-data-table__completion-cell">
                    <div className={`design4-inline-meter design4-inline-meter--${tone}`}>
                      <div className="design4-inline-meter__track">
                        <div className="design4-inline-meter__fill" style={{ width: `${item.completionRate}%` }} />
                      </div>
                      <span className={`design4-inline-meter--${tone}`}>{item.completionRate} %</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UnifiedRateTooltip({ active, payload, label, mode }) {
  if (!active || !payload?.length) return null;
  const showSecurity = mode === "all" || mode === "security";
  const showFix = mode === "all" || mode === "action";
  const secPt = payload.find((p) => p.dataKey === "security");
  const fixPt = payload.find((p) => p.dataKey === "fix");
  return (
    <div className="design4-rate-tooltip">
      <strong>{label}</strong>
      {showSecurity && secPt && (
        <span className="design4-rate-tooltip__row">
          <span className="design4-rate-tooltip__dot design4-rate-tooltip__dot--security" />
          {`보안율 ${secPt.value}%`}
        </span>
      )}
      {showFix && fixPt && (
        <span className="design4-rate-tooltip__row">
          <span className="design4-rate-tooltip__dot design4-rate-tooltip__dot--fix" />
          {`조치율 ${fixPt.value}%`}
        </span>
      )}
    </div>
  );
}

function SecuritySummaryBoard({ detail, sectionClassName = "" }) {
  const summary = detail.design4?.securitySummary;
  const [mode, setMode] = useState("all");

  const chartData = useMemo(() => {
    if (!summary) return [];
    const secHist = summary.securityRateHistory?.length ? summary.securityRateHistory : [];
    const fixHist = summary.fixRateHistory?.length ? summary.fixRateHistory : [];
    const len = Math.max(secHist.length, fixHist.length);
    const rows = [];
    for (let i = 0; i < len; i++) {
      rows.push({ month: secHist[i]?.month ?? fixHist[i]?.month ?? "", security: secHist[i]?.value ?? null, fix: fixHist[i]?.value ?? null });
    }
    return rows;
  }, [summary]);

  if (!summary) return null;

  const secVal = summary.overallSecurityRate ?? 0;
  const fixVal = summary.vulnerabilityFixRate ?? 0;
  const showSecurity = mode === "all" || mode === "security";
  const showFix = mode === "all" || mode === "action";

  const cards = [
    { key: "security", label: summary.overallLabel || "보안율", value: `${secVal}%`, toneClass: "design4-rate-toggle--security" },
    { key: "action",   label: summary.actionLabel  || "조치율", value: `${fixVal}%`, toneClass: "design4-rate-toggle--fix" },
    { key: "all",      label: "전체", value: `보안 ${secVal}% · 조치 ${fixVal}%`, toneClass: "design4-rate-toggle--all" },
  ];

  return (
    <section className={`admin-content-card design4-card ${sectionClassName}`.trim()}>
      <SectionHeader title="보안율 / 조치율" desc={`${summary.scopeLabel} 최근 추이를 함께 확인합니다.`} />
      <div className="design4-rate-unified">
        <div className="design4-rate-unified__chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 36, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} padding={{ left: 24, right: 12 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="var(--text-secondary)" tick={{ fontSize: 12 }} width={44} />
              <Tooltip content={<UnifiedRateTooltip mode={mode} />} cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }} />
              {showSecurity && (
                <Line type="monotone" dataKey="security" name="보안율" stroke="var(--brand-dashboard)" strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0, fill: "var(--brand-dashboard)" }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "var(--brand-dashboard)" }} connectNulls>
                  <LabelList dataKey="security" position="top" offset={mode === "all" ? 18 : 12}
                    formatter={(v) => (v == null ? "" : `${v}%`)}
                    style={{ fill: "var(--brand-dashboard)", fontSize: 11, fontWeight: 600 }} />
                </Line>
              )}
              {showFix && (
                <Line type="monotone" dataKey="fix" name="조치율" stroke="var(--status-success)" strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0, fill: "var(--status-success)" }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "var(--status-success)" }} connectNulls>
                  <LabelList dataKey="fix" position="top" offset={6}
                    formatter={(v) => (v == null ? "" : `${v}%`)}
                    style={{ fill: "var(--status-success)", fontSize: 11, fontWeight: 600 }} />
                </Line>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="design4-rate-toggle-grid">
          {cards.map((card) => {
            const isActive = mode === card.key;
            return (
              <button key={card.key} type="button" onClick={() => setMode(card.key)}
                className={`design4-rate-toggle ${card.toneClass} ${isActive ? "is-active" : ""}`}
                aria-pressed={isActive}>
                <span className="design4-rate-toggle__label">{card.label}</span>
                <span className="design4-rate-toggle__value">{card.value}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function getProcessTone(key) {
  if (key === "unresolved" || key === "overdue") return "danger";
  if (key === "pending_approval" || key === "due_soon") return "warning";
  return "warning";
}

function ProcessStatusBoard({ detail, sectionClassName = "", onOpenProcessTickets }) {
  const rows = detail.design4?.processStatusSummary || [];
  return (
    <section className={`admin-content-card design4-card ${sectionClassName}`.trim()}>
      <SectionHeader title="처리상태 분포" desc="지금 확인이 필요한 상태를 먼저 보여줍니다." />
      <div className="design4-process-table-wrap">
        <table className="design4-data-table design4-data-table--process">
          <colgroup>
            <col /><col style={{ width: "92px" }} /><col style={{ width: "72px" }} />
          </colgroup>
          <tbody>
            {rows.map((item) => {
              const tone = getProcessTone(item.key);
              const clickable = typeof onOpenProcessTickets === "function" && (item.count ?? 0) > 0;
              return (
                <tr key={item.key}
                  className={`design4-process-row ${clickable ? "is-clickable" : ""}`.trim()}
                  onClick={() => clickable && onOpenProcessTickets(item)}
                  title={clickable ? `${item.label} 상세 보기` : undefined}>
                  <td className="design4-process-table__state">
                    <span className={`design4-process-point design4-process-point--${tone}`} />
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.helper}</span>
                    </div>
                  </td>
                  <td className="design4-process-table__count">
                    <span className={`design4-count-badge design4-count-badge--${tone}`}>{item.count}건</span>
                  </td>
                  <td className={`design4-process-table__percent design4-process-table__percent--${tone}`}>
                    {item.percent}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TopRiskTable({ detail, onOpenAssetIssues }) {
  const rows = detail.design4?.topRiskAssetRows || [];
  return (
    <section className="admin-content-card design4-card">
      <SectionHeader title="상위 위험 자산" desc="CCE와 CVE 이슈를 함께 보고 우선 확인할 자산을 찾습니다." />
      <div className="design4-table-scroll">
        <table className="design4-data-table design4-data-table--assets">
          <thead>
            <tr>
              <th>자산명</th><th>IP</th><th>위험도</th>
              <th>CCE 이슈</th><th>CVE 이슈</th><th>담당</th><th>상세</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="design4-data-table__empty">표시할 자산이 없습니다.</td></tr>
            ) : rows.map((item) => (
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
    </section>
  );
}

function TopVulnerabilityTable({ detail, onOpenVulnDetail }) {
  const rows = detail.design4?.topVulnerabilityRows || [];
  return (
    <section className="admin-content-card design4-card">
      <SectionHeader title="상위 취약점" desc="CCE와 CVE를 함께 보고 영향 범위가 넓은 항목을 확인합니다." />
      <div className="design4-table-scroll">
        <table className="design4-data-table design4-data-table--vulns">
          <thead>
            <tr>
              <th>구분</th><th>취약점명</th><th>심각도</th>
              <th>영향 자산</th><th>상태</th><th>상세</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="design4-data-table__empty">표시할 취약점이 없습니다.</td></tr>
            ) : rows.map((item) => (
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
    </section>
  );
}

export default function Design4MainBoard({
  detail,
  variant = "4-1",
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

  const isLeafNode = !detail.childDepartments || detail.childDepartments.length === 0;

  return (
    <section className={`design4-main design4-main--${variant.replace("-", "")}`}>
      {variant === "4-1" ? (
        <>
          {!isLeafNode && (
            <div className="design4-org-full-row">
              <OrganizationStatusBoard
                detail={detail} selectedNodeId={selectedNodeId}
                onSelectNode={onSelectNode} onDeptKpiClick={onDeptKpiClick}
              />
            </div>
          )}
          <div className="admin-content-grid trends-table-grid design4-trend-grid design4-trend-grid--41">
            <div className="design4-trend-cell design4-trend-cell--cce">
              <TrendTable title="CCE 운영 추이" rows={cceRows} type="CCE" onOpenTrendSummary={onOpenTrendSummary} />
            </div>
            <div className="design4-trend-cell design4-trend-cell--cve">
              <TrendTable title="CVE 운영 추이" rows={cveRows} type="CVE" onOpenTrendSummary={onOpenTrendSummary} />
            </div>
            <div className="design4-trend-cell design4-trend-cell--security">
              <SecuritySummaryBoard detail={detail}
                sectionClassName="design4-secondary-board design4-secondary-board--security design4-secondary-board--41" />
            </div>
            <div className="design4-trend-cell design4-trend-cell--process">
              <ProcessStatusBoard detail={detail}
                sectionClassName="design4-secondary-board design4-secondary-board--process design4-secondary-board--41"
                onOpenProcessTickets={onOpenProcessTickets} />
            </div>
          </div>
          <div className="admin-content-grid design4-top-grid">
            <TopRiskTable detail={detail} onOpenAssetIssues={onOpenAssetIssues} />
            <TopVulnerabilityTable detail={detail} onOpenVulnDetail={onOpenVulnDetail} />
          </div>
        </>
      ) : (
        <>
          <div className={`design4-layout-42 ${isLeafNode ? "design4-layout-42--leaf" : ""}`.trim()}>
            {!isLeafNode ? (
              <div className="design4-layout-42__column design4-layout-42__column--org">
                <OrganizationStatusBoard detail={detail} selectedNodeId={selectedNodeId}
                  onSelectNode={onSelectNode} onDeptKpiClick={onDeptKpiClick} />
                <TrendTable title="CCE 운영 추이" rows={cceRows} type="CCE" onOpenTrendSummary={onOpenTrendSummary} />
              </div>
            ) : (
              <div className="design4-layout-42__top-row design4-layout-42__top-row--leaf">
                <SecuritySummaryBoard detail={detail}
                  sectionClassName="design4-secondary-board design4-secondary-board--security" />
                <ProcessStatusBoard detail={detail}
                  sectionClassName="design4-secondary-board design4-secondary-board--process"
                  onOpenProcessTickets={onOpenProcessTickets} />
              </div>
            )}
            <div className="design4-layout-42__column design4-layout-42__column--right">
              {!isLeafNode && (
                <>
                  <SecuritySummaryBoard detail={detail}
                    sectionClassName="design4-secondary-board design4-secondary-board--security" />
                  <ProcessStatusBoard detail={detail}
                    sectionClassName="design4-secondary-board design4-secondary-board--process"
                    onOpenProcessTickets={onOpenProcessTickets} />
                </>
              )}
              <TrendTable
                title={isLeafNode ? "CCE 운영 추이" : "CVE 운영 추이"}
                rows={isLeafNode ? cceRows : cveRows}
                type={isLeafNode ? "CCE" : "CVE"}
                onOpenTrendSummary={onOpenTrendSummary} />
            </div>
            {isLeafNode && (
              <div className="design4-layout-42__column design4-layout-42__column--leaf-bottom">
                <TrendTable title="CVE 운영 추이" rows={cveRows} type="CVE" onOpenTrendSummary={onOpenTrendSummary} />
              </div>
            )}
          </div>
          <div className="admin-content-grid design4-top-grid">
            <TopRiskTable detail={detail} onOpenAssetIssues={onOpenAssetIssues} />
            <TopVulnerabilityTable detail={detail} onOpenVulnDetail={onOpenVulnDetail} />
          </div>
        </>
      )}
    </section>
  );
}
