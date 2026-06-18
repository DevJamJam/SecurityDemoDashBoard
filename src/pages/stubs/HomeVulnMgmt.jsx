import { useLocation } from "react-router-dom";

export default function HomeVulnMgmt() {
  const location = useLocation();
  return (
    <div style={{ padding: "32px", color: "var(--text-color)" }}>
      <h2 style={{ marginBottom: "8px" }}>취약점 관리</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
        현재 경로: <code style={{ background: "var(--surface-muted)", padding: "2px 6px", borderRadius: "4px" }}>{location.pathname}</code>
      </p>
      <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "16px" }}>
        이 섹션은 계획등록 · 계획 검토 · 결과등록 · 결과검토 · 완료목록 workflow를 제공합니다.
      </p>
    </div>
  );
}
