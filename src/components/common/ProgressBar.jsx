export default function ProgressBar({
  percent,
  current,
  total,
  label,
  percents,
  showLabel = true,
  height = 6,
}) {
  let pct = 0;
  if (typeof percent === "number") {
    pct = Math.min(100, Math.max(0, percent));
  } else if (typeof current === "number" && typeof total === "number" && total > 0) {
    pct = Math.min(100, Math.round((current / total) * 100));
  }

  const colorClass =
    pct >= 70 ? "progress-bar__fill--success"
    : pct >= 40 ? "progress-bar__fill--warning"
    : "progress-bar__fill--danger";

  return (
    <div className="progress-bar">
      {label && (
        <div className="progress-bar__named-header">
          <span className="progress-bar__name">{label}</span>
          <span className="progress-bar__pct-right" style={{ color: pct >= 70 ? "var(--success-color)" : pct >= 40 ? "var(--warning-color)" : "var(--danger-color)" }}>
            {pct}점
          </span>
        </div>
      )}
      <div className="progress-bar__track" style={{ height }}>
        <div
          className={`progress-bar__fill ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && !label && (
        <div className="progress-bar__label">
          <span>{pct}%</span>
          {!percents && typeof current === "number" && typeof total === "number" && (
            <span>{current} / {total}</span>
          )}
        </div>
      )}
    </div>
  );
}
