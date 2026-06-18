const CARD_KEYS = {
  assets: "assets",
  inspections: "inspections",
  unchecked: "unchecked",
  highRisk: "highRisk",
  pending: "pending",
  command: "command",
};

export default function AdminSummaryCards({ summary, readOnly = false, onOpenSummaryModal }) {
  const cardItems = [
    {
      key: CARD_KEYS.highRisk,
      label: "고위험 취약점",
      value: `${summary.highRiskCount}건`,
      subItems: [
        { label: "CCE", value: `${summary.highRiskCce ?? 0}건` },
        { label: "CVE", value: `${summary.highRiskCve ?? 0}건` },
      ],
      type: "danger",
      clickable: true,
      priority: "high",
    },
    {
      key: CARD_KEYS.unchecked,
      label: "미점검 자산",
      value: `${summary.uncheckedAssetCount}개`,
      subItems: [
        { label: "CCE 미점검", value: `${summary.uncheckedCceOnly ?? 0}개` },
        { label: "CVE 미점검", value: `${summary.uncheckedCveOnly ?? 0}개` },
        { label: "전체 미점검", value: `${summary.uncheckedBoth ?? 0}개` },
      ],
      type: "warning",
      clickable: true,
      priority: "high",
    },
    {
      key: CARD_KEYS.pending,
      label: readOnly ? "확인 필요 항목" : "승인 / 조치대기",
      value: `${summary.approvePendingCount}건`,
      subItems: readOnly
        ? null
        : [
            { label: "승인대기", value: `${summary.approvePending ?? 0}건` },
            { label: "조치대기", value: `${summary.actionPending ?? 0}건` },
          ],
      subText: readOnly ? "조회 가능한 대기 건수" : null,
      type: "pending",
      clickable: true,
      priority: "high",
    },
    {
      key: CARD_KEYS.inspections,
      label: "진행 중 점검",
      value: `${summary.inspectionCount}건`,
      subItems: [
        { label: "CCE", value: `${summary.inspectionCce ?? 0}건` },
        { label: "CVE", value: `${summary.inspectionCve ?? 0}건` },
      ],
      type: "inspection",
      clickable: true,
      priority: "normal",
    },
    {
      key: CARD_KEYS.command,
      label: "명령 실패",
      value: `${summary.commandFailCount}건`,
      type: "command",
      clickable: true,
      priority: "normal",
    },
    {
      key: CARD_KEYS.assets,
      label: "관리 자산",
      value: `${summary.assetCount}개`,
      subText: `보안점수 ${summary.securityScore}점`,
      type: "assets",
      clickable: true,
      priority: "normal",
    },
  ];

  return (
    <div className="admin-summary-cards v2">
      {cardItems.map((item) => {
        const content = (
          <>
            <div className="admin-summary-card__topline">
              <p className="admin-summary-card__label">{item.label}</p>
              {item.clickable && <span className="admin-summary-card__hint">상세</span>}
            </div>
            <strong className="admin-summary-card__value">{item.value}</strong>
            {item.subItems && item.subItems.length > 0 ? (
              <ul className="admin-summary-card__sub admin-summary-card__sub--list">
                {item.subItems.map((si) => (
                  <li key={si.label}>
                    <span className="admin-summary-card__sub-label">{si.label}</span>
                    <span className="admin-summary-card__sub-value">{si.value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="admin-summary-card__sub">{item.subText}</span>
            )}
          </>
        );

        return item.clickable ? (
          <button
            type="button"
            key={item.key}
            className={`admin-summary-card ${item.type} ${item.priority} clickable`}
            onClick={() => onOpenSummaryModal?.(item.key)}
          >
            {content}
          </button>
        ) : (
          <div key={item.key} className={`admin-summary-card ${item.type} ${item.priority}`}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
