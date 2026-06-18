import { useState, useEffect } from "react";
import { dateToString } from "@/config/data/common";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import useDashboardDetailStore from "@/store/cce/useDashboardDetailStore";

const ALERT_SEVERITY_CARDS = [
  { key: "urgent", label: "긴급", cls: "danger" },
  { key: "confirm", label: "확인", cls: "warning" },
  { key: "info", label: "안내", cls: "info" },
];

function AlertListItem({ alert }) {
  const [expanded, setExpanded] = useState(false);
  const timeLabel = alert.occurred_at ? dateToString(new Date(alert.occurred_at)) : "-";

  return (
    <article
      className={`admin-alert-panel__item ${expanded ? "is-expanded" : ""}`}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="admin-alert-panel__item-top">
        <strong className="admin-alert-panel__item-title">{alert.title}</strong>
        <div className="admin-alert-panel__item-meta">
          <span className="admin-alert-panel__item-source">{alert.source}</span>
          <span className="admin-alert-panel__item-time">{timeLabel}</span>
        </div>
      </div>
      {expanded && <p className="admin-alert-panel__item-message">{alert.message}</p>}
    </article>
  );
}

function AdminAlertPanel({ alerts, deptId }) {
  const [selected, setSelected] = useState(null);
  const alertSlots = useDashboardDetailStore((s) => s.alerts);
  const loadAlerts = useDashboardDetailStore((s) => s.loadAlerts);
  const resetAlerts = useDashboardDetailStore((s) => s.resetAlerts);

  useEffect(() => {
    resetAlerts();
    setSelected(null);
  }, [deptId]);

  const counts = {
    urgent: alerts?.urgent ?? 0,
    confirm: alerts?.confirm ?? 0,
    info: alerts?.info ?? 0,
  };

  const handleCardClick = (severity) => {
    if (selected === severity) { setSelected(null); return; }
    setSelected(severity);
    if (!alertSlots[severity]?.data && !alertSlots[severity]?.loading) {
      loadAlerts({ deptId, severity }).catch(() => {});
    }
  };

  const currentSlot = selected ? alertSlots[selected] : null;
  const currentItems = currentSlot?.data?.items || [];

  return (
    <section className="admin-side-card admin-alert-panel admin-alert-panel--cards">
      <div className="admin-panel__header compact admin-panel__header--row admin-alert-panel__title-row">
        <div><h3>확인 필요 알림</h3></div>
      </div>

      <div className="admin-alert-panel__summary compact-v2">
        {ALERT_SEVERITY_CARDS.map((card) => (
          <button
            type="button"
            key={card.key}
            className={`admin-alert-panel__summary-box ${card.cls} ${selected === card.key ? "is-active" : ""}`}
            onClick={() => handleCardClick(card.key)}
          >
            <span>{card.label}</span>
            <strong>{counts[card.key]}</strong>
          </button>
        ))}
      </div>

      {selected && (
        <div className="admin-alert-panel__detail">
          {currentSlot?.loading ? (
            <div className="admin-alert-panel__state-loading"><LoadingSpinner /></div>
          ) : currentSlot?.error ? (
            <div className="admin-alert-panel__state-error">
              <strong>알림을 불러오지 못했습니다.</strong>
              <p>{currentSlot.error}</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="admin-alert-panel__state-empty">표시할 알림이 없습니다.</div>
          ) : (
            <div className="admin-alert-panel__list">
              {currentItems.map((alert) => (
                <AlertListItem key={alert.alert_id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default AdminAlertPanel;
