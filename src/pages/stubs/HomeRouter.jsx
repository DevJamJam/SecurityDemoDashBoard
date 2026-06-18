import { useLocation } from "react-router-dom";

export default function HomeRouter({ tab }) {
  const location = useLocation();
  return (
    <div style={{ padding: "32px", color: "var(--text-color)" }}>
      <h2 style={{ marginBottom: "8px" }}>CCE 관리</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
        현재 경로: <code style={{ background: "var(--surface-muted)", padding: "2px 6px", borderRadius: "4px" }}>{location.pathname}</code>
      </p>
      <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "16px" }}>
        이 섹션은 CCE 점검 관리 기능을 제공합니다. 포트폴리오 데모에서는 대시보드 기능을 중점적으로 확인하실 수 있습니다.
      </p>
    </div>
  );
}
