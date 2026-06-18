export default function ProgressBar({
  percent,
  current,
  total,
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
      <div className="progress-bar__track" style={{ height }}>
        <div
          className={`progress-bar__fill ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="progress-bar__label">
          <span>{pct}%</span>
          {typeof current === "number" && typeof total === "number" && (
            <span>{current} / {total}</span>
          )}
        </div>
      )}
    </div>
  );
}
