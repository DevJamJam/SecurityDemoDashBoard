export default function Design4MainBoard({
  detail,
  variant = "4-1",
  readOnly = false,
  onOpenSummaryModal,
  onOpenTrendSummary,
  onOpenAssetIssues,
  onOpenVulnDetail,
  onOpenProcessTickets,
  onDeptKpiClick,
  selectedNodeId,
  onSelectNode,
}) {
  if (!detail) return null;

  const { design4 } = detail;
  if (!design4) return null;

  const {
    securitySummary,
    processStatusSummary = [],
    organizationRows = [],
    topRiskAssetRows = [],
    topVulnerabilityRows = [],
    cceRows = [],
    cveRows = [],
  } = design4;

  return (
    <div className="design4-main">
      {/* Security Score Card */}
      <div className="admin-content-card">
        <div className="admin-panel__header admin-panel__header--row">
          <h3>보안 현황 요약</h3>
          {securitySummary?.scopeLabel && (
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{securitySummary.scopeLabel}</span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ textAlign: "center", padding: "16px" }}>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--text-secondary)" }}>{securitySummary?.overallLabel || "보안율"}</p>
            <strong style={{ fontSize: "36px", color: "var(--brand-cce)" }}>{securitySummary?.overallSecurityRate ?? 0}%</strong>
          </div>
          <div style={{ textAlign: "center", padding: "16px" }}>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--text-secondary)" }}>{securitySummary?.actionLabel || "조치율"}</p>
            <strong style={{ fontSize: "36px", color: "var(--brand-dashboard)" }}>{securitySummary?.vulnerabilityFixRate ?? 0}%</strong>
          </div>
        </div>
      </div>

      {/* Process Status */}
      {processStatusSummary.length > 0 && (
        <div className="admin-content-card">
          <div className="admin-panel__header">
            <h3>처리상태 분포</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {processStatusSummary.map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => onOpenProcessTickets?.(row)}
                style={{ padding: "12px", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface-muted)", cursor: "pointer", textAlign: "left" }}
              >
                <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--text-secondary)" }}>{row.label}</p>
                <strong style={{ fontSize: "20px", color: "var(--text-color)" }}>{row.count ?? 0}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Risk Assets */}
      {topRiskAssetRows.length > 0 && (
        <div className="admin-content-card">
          <div className="admin-panel__header">
            <h3>상위 위험 자산</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {topRiskAssetRows.slice(0, 5).map((asset, i) => (
              <button
                key={asset.id || i}
                type="button"
                onClick={() => onOpenAssetIssues?.(asset)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "8px", background: "transparent", cursor: "pointer" }}
              >
                <div style={{ textAlign: "left" }}>
                  <strong style={{ fontSize: "13px", color: "var(--text-color)", display: "block" }}>{asset.name}</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{asset.ip}</span>
                </div>
                <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "11px", background: "var(--accent-danger-bg)", color: "var(--status-danger)", flexShrink: 0 }}>
                  {asset.risk}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Vulnerabilities */}
      {topVulnerabilityRows.length > 0 && (
        <div className="admin-content-card">
          <div className="admin-panel__header">
            <h3>상위 취약점</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {topVulnerabilityRows.slice(0, 5).map((vuln, i) => (
              <button
                key={vuln.id || i}
                type="button"
                onClick={() => onOpenVulnDetail?.(vuln)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "8px", background: "transparent", cursor: "pointer" }}
              >
                <div style={{ textAlign: "left" }}>
                  <strong style={{ fontSize: "13px", color: "var(--text-color)", display: "block" }}>{vuln.vulnId}</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{vuln.name}</span>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>{vuln.affectedAssetCount}개 자산</span>
                  <span style={{ fontSize: "11px", color: "var(--status-danger)" }}>{vuln.severity}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Organization Status */}
      {organizationRows.length > 0 && (
        <div className="admin-content-card">
          <div className="admin-panel__header">
            <h3>하위 부서 현황</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["부서명", "고위험", "미점검", "대기", "점검", "명령실패", "자산수"].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {organizationRows.map((row) => (
                  <tr key={row.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 10px", color: "var(--text-color)", fontWeight: 600, whiteSpace: "nowrap" }}>{row.name}</td>
                    {[
                      ["highRisk", row.highRiskCount],
                      ["unchecked", row.uncheckedCount],
                      ["pending", row.pendingCount],
                      ["inspections", row.inspectionCount],
                      ["command", row.commandFailCount],
                      ["assets", row.assetCount],
                    ].map(([key, val]) => (
                      <td key={key} style={{ padding: "8px 10px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => onDeptKpiClick?.(row, key)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: val > 0 ? "var(--brand-cce)" : "var(--text-secondary)", fontWeight: val > 0 ? 700 : 400 }}
                        >
                          {val ?? 0}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CCE Trend */}
      {cceRows.length > 0 && (
        <div className="admin-content-card">
          <div className="admin-panel__header">
            <h3>CCE 운영 추이</h3>
          </div>
          <TrendTable rows={cceRows} vulnType="CCE" onOpenTrendSummary={onOpenTrendSummary} />
        </div>
      )}

      {/* CVE Trend */}
      {cveRows.length > 0 && (
        <div className="admin-content-card">
          <div className="admin-panel__header">
            <h3>CVE 운영 추이</h3>
          </div>
          <TrendTable rows={cveRows} vulnType="CVE" onOpenTrendSummary={onOpenTrendSummary} />
        </div>
      )}
    </div>
  );
}

function TrendTable({ rows, vulnType, onOpenTrendSummary }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["월", "점검자산", "발견", "잔여", "재탐지"].map((h) => (
              <th key={h} style={{ padding: "8px 10px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "8px 10px", color: "var(--text-color)", fontWeight: 600 }}>
                <button
                  type="button"
                  onClick={() => onOpenTrendSummary?.(row, vulnType)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand-cce)", fontSize: "13px", fontWeight: 700, padding: 0 }}
                >
                  {row.month}
                </button>
              </td>
              {[row.inspected, row.foundCount, row.remainingCount, row.redetectCount].map((val, j) => (
                <td key={j} style={{ padding: "8px 10px", textAlign: "right", color: "var(--text-secondary)" }}>{val ?? 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
