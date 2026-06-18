import classnames from "classnames";

const STATUS_LABELS = {
  in_progress: "진행중",
  completed: "완료",
  scheduled: "예정",
  failed: "실패",
  running: "실행중",
  pending: "대기",
  active: "활성",
  inactive: "비활성",
  in_review: "검토중",
  approved: "승인",
};

export default function StatusBadge({ status, dot = true }) {
  const label = STATUS_LABELS[status] || status;
  return (
    <span
      className={classnames(
        "status-badge",
        `status-badge--${status}`,
        dot && "status-badge--dot"
      )}
    >
      {label}
    </span>
  );
}
