import { useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function AdminDetailModal({
  open,
  data,
  stackDepth = 1,
  onClose,
  onBack,
  onOpenNested,
  onAssetClick,
}) {
  if (!open || !data) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 8000, background: "var(--overlay-modal)", display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--mn-color)",
          borderLeft: "1px solid var(--border)",
          width: "min(720px, 90vw)",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          {stackDepth > 1 && (
            <button
              type="button"
              onClick={onBack}
              style={{ background: "none", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", padding: "4px 10px", color: "var(--text-secondary)", fontSize: "13px" }}
            >
              ← 이전
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {data.eyebrow && <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>{data.eyebrow}</p>}
            <h2 style={{ margin: 0, fontSize: "17px", color: "var(--text-color)", fontWeight: 700 }}>{data.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", color: "var(--text-secondary)", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
          {data.loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
              <LoadingSpinner />
            </div>
          ) : data.error ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--status-danger)" }}>
              <strong>오류</strong>
              <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: "13px" }}>{data.error}</p>
            </div>
          ) : data.content ? (
            typeof data.content === "function"
              ? data.content({ onOpenNested, onAssetClick, onClose })
              : data.content
          ) : (
            <ModalBodyRenderer data={data} onOpenNested={onOpenNested} onAssetClick={onAssetClick} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}

function TabsRenderer({ tabs, onOpenNested, onAssetClick, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const tab = tabs[activeTab];

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
        {tabs.map((t, i) => (
          <button
            key={i}
            type="button"
            style={{ background: "none", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: activeTab === i ? 700 : 400, color: activeTab === i ? "var(--brand-cce)" : "var(--text-secondary)", borderBottom: activeTab === i ? "2px solid var(--brand-cce)" : "none" }}
            onClick={() => setActiveTab(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab && <ModalBodyRenderer data={tab} onOpenNested={onOpenNested} onAssetClick={onAssetClick} onClose={onClose} />}
    </div>
  );
}

function ModalBodyRenderer({ data, onOpenNested, onAssetClick, onClose }) {
  if (data.type === "summaryRows" && Array.isArray(data.rows)) {
    return (
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
        {data.rows.map((row, i) => (
          <li
            key={i}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border)", cursor: row.onClick ? "pointer" : "default", background: "var(--surface-muted)" }}
            onClick={() => row.onClick?.({ onOpenNested })}
          >
            <span style={{ fontSize: "13px", color: "var(--text-color)" }}>{row.label}</span>
            <strong style={{ fontSize: "16px", color: "var(--brand-cce)" }}>{row.value}</strong>
          </li>
        ))}
      </ul>
    );
  }

  if (data.type === "assetList" && Array.isArray(data.rows)) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {data.rows.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "24px" }}>
            {data.emptyMessage || "항목이 없습니다."}
          </p>
        ) : (
          data.rows.map((row, i) => (
            <div
              key={i}
              style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border)", cursor: "pointer", background: "var(--surface-muted)" }}
              onClick={() => row.onRowClick?.({ onOpenNested, onAssetClick, onClose })}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "var(--text-color)" }}>{row.hostname || row.ast_hostname || row.name}</strong>
                  <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>{row.ip || row.ast_ipaddr}</span>
                </div>
                {row.badge && <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", background: "var(--accent-danger-bg)", color: "var(--status-danger)" }}>{row.badge}</span>}
              </div>
              {row.subText && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>{row.subText}</p>}
            </div>
          ))
        )}
      </div>
    );
  }

  if (data.type === "tabs" && Array.isArray(data.tabs)) {
    return <TabsRenderer tabs={data.tabs} onOpenNested={onOpenNested} onAssetClick={onAssetClick} onClose={onClose} />;
  }

  return (
    <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)" }}>
      <p>데이터를 표시할 수 없습니다.</p>
    </div>
  );
}
