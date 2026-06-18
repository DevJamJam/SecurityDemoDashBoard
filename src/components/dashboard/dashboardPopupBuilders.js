export const toYmd = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const makeAssetRows = (items = [], opts = {}) =>
  items.map((item) => ({
    hostname: item.ast_hostname,
    ip: item.ast_ipaddr,
    badge: item.risk_level || item.severity || null,
    subText: item.vuln_count != null ? `취약점 ${item.vuln_count}건` : null,
    onRowClick: ({ onAssetClick, onClose }) => {
      if (typeof opts.onAssetClick === "function") opts.onAssetClick(item, opts.vulnType || "CCE", opts.stepKey || "planReg");
    },
  }));

export const buildHighRiskSummaryModal = (_code, opts = {}) => ({
  type: "summaryRows",
  eyebrow: "KPI 상세",
  title: `고위험 취약점 — ${opts.scopeName || "전사"}`,
  rows: [
    { label: "CCE 고위험", value: "-" },
    { label: "CVE 고위험", value: "-" },
  ],
});

export const buildPendingSummaryModal = (code, opts = {}) => ({
  type: "summaryRows",
  eyebrow: "KPI 상세",
  title: `승인/조치대기 — ${opts.scopeName || "전사"}`,
  rows: (code?.steps || []).map((step) => ({
    label: step.label,
    value: `${step.count ?? 0}건`,
    onClick: ({ onOpenNested }) => opts.onOpenAssets?.({ vuln_type: step.vuln_type, step_key: step.key, step_label: step.label }),
  })),
});

export const buildPendingAssetsModal = (code, opts = {}) => ({
  type: "assetList",
  eyebrow: `${opts.vulnType} · ${opts.stepLabel}`,
  title: `${opts.stepLabel} 대상 자산`,
  rows: makeAssetRows(code?.assets || [], { ...opts }),
});

export const buildCommandFailureAssetsModal = (code, opts = {}) => ({
  type: "assetList",
  eyebrow: "KPI 상세",
  title: `명령 실패 자산 — ${opts.scopeName || "전사"}`,
  rows: makeAssetRows(code?.assets || [], { ...opts }),
});

export const buildActiveInspectionsTabs = (cce, cve, opts = {}) => ({
  type: "tabs",
  eyebrow: "KPI 상세",
  title: `진행 중 점검 — ${opts.scopeName || "전사"}`,
  tabs: [
    {
      label: `CCE (${(cce?.plans || []).length}건)`,
      type: "assetList",
      rows: (cce?.plans || []).map((item) => ({
        hostname: item.ccp_name || item.plan_name,
        ip: item.target_count != null ? `대상 ${item.target_count}대` : "",
        onRowClick: () => opts.onNavigateCce?.(item),
      })),
    },
    {
      label: `CVE (${(cve?.scans || []).length}건)`,
      type: "assetList",
      rows: (cve?.scans || []).map((item) => ({
        hostname: item.job_name || item.scan_name,
        ip: item.target_count != null ? `대상 ${item.target_count}대` : "",
        onRowClick: () => opts.onNavigateCve?.(item),
      })),
    },
  ],
});

export const buildUncheckedSummaryModal = (code, opts = {}) => ({
  type: "summaryRows",
  eyebrow: "KPI 상세",
  title: `미점검 자산 — ${opts.scopeName || "전사"}`,
  rows: (code?.categories || []).map((cat) => ({
    label: cat.label,
    value: `${cat.count ?? 0}개`,
    onClick: () => opts.onOpenAssets?.(cat.key),
  })),
});

export const buildUncheckedAssetsModal = (code, opts = {}) => ({
  type: "assetList",
  eyebrow: "미점검 자산",
  title: opts.category || "미점검 자산",
  rows: makeAssetRows(code?.assets || [], { ...opts }),
});

export const buildTrendStepSummaryModal = (trendRow, opts = {}) => ({
  type: "summaryRows",
  eyebrow: `${opts.vulnType} 운영 추이`,
  title: `${trendRow?.month || ""} 단계별 현황`,
  rows: (trendRow?.stepSummary || []).map((step) => ({
    label: step.label,
    value: `${step.count ?? 0}건`,
    onClick: () => {
      if (step.stepKey === "redetect") {
        opts.onRedetectDrilldown?.({ stepKey: step.stepKey, stepLabel: step.label, month: trendRow.month });
      } else {
        opts.onAssetNavigate?.(null, opts.vulnType, step.stepKey);
      }
    },
  })),
});

export const buildTrendStepAssetsModal = (code, opts = {}) => ({
  type: "assetList",
  eyebrow: `${opts.vulnType} ${opts.month}`,
  title: opts.stepKey === "redetect" ? "재탐지 자산 목록" : `${opts.stepLabel} 자산 목록`,
  rows: makeAssetRows(code?.assets || [], { ...opts }),
});

export const buildAssetIssuesTabs = (_code, opts = {}) => ({
  type: "tabs",
  eyebrow: "자산 이슈",
  title: opts.asset?.ast_hostname || opts.asset?.name || "자산 이슈",
  tabs: [
    { label: "CCE", type: "assetList", rows: [] },
    { label: "CVE", type: "assetList", rows: [] },
  ],
});

export const buildRedetectVulnListModal = (opts = {}) => ({
  type: "assetList",
  eyebrow: "재탐지",
  title: `${opts.asset?.ast_hostname || "자산"} 재탐지 취약점`,
  rows: [],
});

export const buildRemediationHistoryModal = (code, opts = {}) => ({
  type: "summaryRows",
  eyebrow: `${opts.vulnType} 조치 이력`,
  title: `${opts.vulnId} 조치 이력`,
  rows: (code?.history || []).map((h, i) => ({
    label: h.action || `이력 ${i + 1}`,
    value: h.date || "-",
  })),
});

export const buildManagedAssetsModal = (opts = {}) => ({
  type: "assetList",
  eyebrow: "KPI 상세",
  title: `관리 자산 — ${opts.scopeName || "전사"}`,
  rows: [],
  emptyMessage: "관리 자산 목록은 자산관리 탭에서 확인하실 수 있습니다.",
});

export const buildVulnDetailModal = (opts = {}) => ({
  type: "assetList",
  eyebrow: `${opts.type} 취약점 상세`,
  title: `${opts.vulnId} — ${opts.vulnLabel || ""}`,
  rows: [],
});

export const buildTicketsByStatusModal = (opts = {}) => ({
  type: "assetList",
  eyebrow: "처리상태",
  title: `${opts.statusLabel} 티켓 목록`,
  rows: [],
});
