import { useLocation } from "react-router-dom";

export default function HomeCve() {
  const location = useLocation();
  return (
    <div style={{ padding: "32px", color: "var(--text-color)" }}>
      <h2 style={{ marginBottom: "8px" }}>CVE 관리</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
        현재 경로: <code style={{ background: "var(--surface-muted)", padding: "2px 6px", borderRadius: "4px" }}>{location.pathname}</code>
      </p>
      <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "16px" }}>
        이 섹션은 CVE 취약점 점검, 자산별 CVE 현황, CVE 별 영향 자산 조회 기능을 제공합니다.
      </p>
    </div>
  );
}
