export const toYmd = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

// ast_uuid(CCE), ass_uuid(CVE) 포함해서 자산 row 생성
const makeAssetRows = (items = [], opts = {}) =>
  items.map((item) => ({
    hostname: item.ast_hostname,
    ip: item.ast_ipaddr,
    ast_uuid: item.ast_uuid,
    ass_uuid: item.ass_uuid,
    badge: item.risk_level || item.severity || null,
    subText: item.vuln_count != null ? `취약점 ${item.vuln_count}건` : null,
    onRowClick: () => {
      if (typeof opts.onAssetClick === "function") {
        opts.onAssetClick(item, opts.vulnType || "CCE", opts.stepKey || "planReg");
      }
    },
  }));

// ── 고위험 취약점 요약 ──────────────────────────────────────
export const buildHighRiskSummaryModal = (_code, opts = {}) => ({
  type: "summaryRows",
  eyebrow: "KPI 상세",
  title: `고위험 취약점 — ${opts.scopeName || "전사"}`,
  rows: [
    { label: "CCE 고위험", value: `${opts.cceCount ?? 0}건` },
    { label: "CVE 고위험", value: `${opts.cveCount ?? 0}건` },
  ],
});

// ── 승인/조치대기 ─────────────────────────────────────────
export const buildPendingSummaryModal = (code, opts = {}) => ({
  type: "summaryRows",
  eyebrow: "KPI 상세",
  title: `승인/조치대기 — ${opts.scopeName || "전사"}`,
  rows: (code?.steps || []).map((step) => ({
    label: step.label,
    value: `${step.count ?? 0}건`,
    onClick: ({ onOpenNested }) =>
      opts.onOpenAssets?.({ vuln_type: step.vuln_type, step_key: step.key, step_label: step.label }),
  })),
});

export const buildPendingAssetsModal = (code, opts = {}) => ({
  type: "assetList",
  eyebrow: `${opts.vulnType} · ${opts.stepLabel}`,
  title: `${opts.stepLabel} 대상 자산`,
  rows: makeAssetRows(code?.assets || [], { ...opts }),
});

// ── 명령 실패 ─────────────────────────────────────────────
export const buildCommandFailureAssetsModal = (code, opts = {}) => ({
  type: "assetList",
  eyebrow: "KPI 상세",
  title: `명령 실패 자산 — ${opts.scopeName || "전사"}`,
  rows: makeAssetRows(code?.assets || [], { ...opts }),
});

// ── 진행 중 점검 ──────────────────────────────────────────
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
        subText: item.started_at ? `시작일: ${item.started_at}` : null,
        onRowClick: () => opts.onNavigateCce?.(item),
      })),
    },
    {
      label: `CVE (${(cve?.scans || []).length}건)`,
      type: "assetList",
      rows: (cve?.scans || []).map((item) => ({
        hostname: item.job_name || item.scan_name,
        ip: item.target_count != null ? `대상 ${item.target_count}대` : "",
        subText: item.started_at ? `시작일: ${item.started_at}` : null,
        onRowClick: () => opts.onNavigateCve?.(item),
      })),
    },
  ],
});

// ── 미점검 자산 ───────────────────────────────────────────
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

// ── 운영추이 상세보기 (월별 단계 요약) ───────────────────────
// 단계 행 클릭 → onOpenStepAssets → 해당 단계 자산 목록 모달
// 재탐지 행 클릭 → onRedetectDrilldown
export const buildTrendStepSummaryModal = (trendRow, opts = {}) => {
  const month = trendRow?.month || "";
  const stepRows = (trendRow?.stepSummary || []).map((step) => ({
    label: step.label,
    value: `${step.count ?? 0}건`,
    onClick: () =>
      opts.onOpenStepAssets?.({ stepKey: step.stepKey, stepLabel: step.label, month }),
  }));

  const summaryRows = [
    { label: "점검 자산", value: `${trendRow?.inspected ?? 0}건` },
    { label: "신규 탐지", value: `${trendRow?.foundCount ?? 0}건` },
    { label: "미처리 건수", value: `${trendRow?.remainingCount ?? 0}건` },
    ...stepRows,
    {
      label: "재탐지",
      value: `${trendRow?.redetectCount ?? 0}건`,
      onClick: () =>
        opts.onRedetectDrilldown?.({ stepKey: "redetect", stepLabel: "재탐지", month }),
    },
  ];

  return {
    type: "summaryRows",
    eyebrow: `${opts.vulnType} 운영 추이`,
    title: `${month} 상세 현황`,
    rows: summaryRows,
  };
};

// ── 운영추이 단계별 자산 목록 ────────────────────────────
export const buildTrendStepAssetsModal = (code, opts = {}) => ({
  type: "assetList",
  eyebrow: `${opts.vulnType} ${opts.month}`,
  title: opts.stepKey === "redetect" ? "재탐지 자산 목록" : `${opts.stepLabel} 자산 목록`,
  rows: makeAssetRows(code?.assets || [], {
    ...opts,
    onAssetClick: opts.onAssetClick,
  }),
});

// ── 자산 이슈 탭 ─────────────────────────────────────────
export const buildAssetIssuesTabs = (_code, opts = {}) => ({
  type: "tabs",
  eyebrow: "자산 이슈",
  title: opts.asset?.ast_hostname || opts.asset?.name || "자산 이슈",
  tabs: [
    {
      label: "CCE",
      type: "assetList",
      rows: [],
      emptyMessage: "자산 관리 탭에서 상세 CCE 이슈를 확인하세요.",
    },
    {
      label: "CVE",
      type: "assetList",
      rows: [],
      emptyMessage: "자산 관리 탭에서 상세 CVE 이슈를 확인하세요.",
    },
  ],
});

// ── 재탐지 취약점 목록 ────────────────────────────────────
export const buildRedetectVulnListModal = (opts = {}) => ({
  type: "assetList",
  eyebrow: "재탐지",
  title: `${opts.asset?.ast_hostname || "자산"} 재탐지 취약점`,
  rows: [],
  emptyMessage: "재탐지된 취약점 목록이 없습니다.",
});

// ── 조치 이력 ─────────────────────────────────────────────
export const buildRemediationHistoryModal = (code, opts = {}) => ({
  type: "summaryRows",
  eyebrow: `${opts.vulnType} 조치 이력`,
  title: `${opts.vulnId} 조치 이력`,
  rows: (code?.history || []).map((h, i) => ({
    label: h.action || `이력 ${i + 1}`,
    value: h.date || "-",
    subText: h.memo || null,
  })),
});

// ── 관리 자산 ─────────────────────────────────────────────
export const buildManagedAssetsModal = (opts = {}) => ({
  type: "assetList",
  eyebrow: "KPI 상세",
  title: `관리 자산 — ${opts.scopeName || "전사"}`,
  rows: [],
  emptyMessage: "자산 상세 목록은 '자산 인벤토리' 메뉴에서 확인하세요.",
});

// ── 취약점 상세 ───────────────────────────────────────────
export const buildVulnDetailModal = (opts = {}) => ({
  type: "assetList",
  eyebrow: `${opts.type} 취약점 상세`,
  title: `${opts.vulnId} — ${opts.vulnLabel || ""}`,
  rows: [],
  emptyMessage: "취약점 상세 정보는 '시스템 점검' 또는 '취약점 스캔' 메뉴에서 확인하세요.",
});

// ── 처리 상태별 티켓 ─────────────────────────────────────
export const buildTicketsByStatusModal = (opts = {}) => ({
  type: "assetList",
  eyebrow: "처리상태",
  title: `${opts.statusLabel} 티켓 목록`,
  rows: [],
  emptyMessage: "조치 관리 메뉴에서 티켓 목록을 확인하세요.",
});
