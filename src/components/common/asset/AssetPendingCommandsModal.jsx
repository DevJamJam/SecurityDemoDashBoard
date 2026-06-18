export default function AssetPendingCommandsModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--overlay-modal)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--mn-color)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "24px",
          minWidth: "360px",
          maxWidth: "560px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-color)" }}>명령 대기 현황</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--text-secondary)" }}
          >
            ×
          </button>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>
          대기 중인 명령이 없습니다.
        </p>
      </div>
    </div>
  );
}
