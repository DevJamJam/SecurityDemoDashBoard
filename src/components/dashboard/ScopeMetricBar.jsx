export default function ScopeMetricBar({ summary, onOpenSummaryModal }) {
  if (!summary) return null;

  const chips = [
    { key: "assets",   label: "점검 범위", value: `${summary.assetCount}대`,           tone: "neutral" },
    { key: "highRisk", label: "위험 탐지", value: `${summary.highRiskCount}건`,         tone: "danger"  },
    { key: "pending",  label: "미처리",    value: `${summary.approvePendingCount}건`,    tone: "warning" },
    { key: "command",  label: "명령 오류", value: `${summary.commandFailCount}건`,       tone: "command" },
  ];

  return (
    <div className="scope-metric-bar">
      <div className="scope-metric-bar__info">
        <span className="scope-metric-bar__title">보안 운영 현황</span>
        <span className="scope-metric-bar__score">
          보안 점수 <strong>{summary.securityScore}</strong>점
        </span>
      </div>
      <div className="scope-metric-bar__chips">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`scope-chip scope-chip--${chip.tone}`}
            onClick={() => onOpenSummaryModal?.(chip.key)}
          >
            <span className="scope-chip__label">{chip.label}</span>
            <strong className="scope-chip__value">{chip.value}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
