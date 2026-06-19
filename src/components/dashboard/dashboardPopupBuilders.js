import { getStepLabel } from "@/config/data/adminHomeDrilldownMock";

export const toYmd = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const resolveStepLabel = (stepKey, fallback) => (
  stepKey === "redetect" ? fallback : getStepLabel(stepKey) || fallback || "-"
);

const makeAssetRows = (items = [], opts = {}) =>
  items.map((item) => ({
    hostname: item.ast_hostname,
    ip: item.ast_ipaddr,
    asset_cce_uuid: item.asset_cce_uuid,
    asset_uuid: item.asset_uuid,
    badge: item.risk_level || item.severity || null,
    subText: item.vuln_count != null ? `취약점 ${item.vuln_count}건` : null,
    onRowClick: () => {
      if (typeof opts.onAssetClick === "function") {
        opts.onAssetClick(item, opts.vulnType || "CCE", opts.stepKey || "planReg");
      }
    },
  }));

export const buildHighRiskSummaryModal = (code, opts = {}) => ({
  type: "summaryRows",
  eyebrow: "KPI 상세",
  title: `고위험 취약점 - ${opts.scopeName || "전사"}`,
  rows: (code?.rows || [
    { vuln_type: "CCE", vuln_label: "CCE 고위험", count: opts.cceCount ?? 0 },
    { vuln_type: "CVE", vuln_label: "CVE 고위험", count: opts.cveCount ?? 0 },
  ]).map((row) => ({
    label: `[${row.vuln_type}] ${row.vuln_label || row.vuln_id || "-"}`,
    value: `${row.count ?? 0}건`,
    subText: row.severity ? `severity: ${row.severity}` : null,
    onClick: () => opts.onOpenVulnDetail?.({
      category: row.vuln_type,
      vulnId: row.vuln_id,
      name: row.vuln_label,
    }),
  })),
});

export const buildPendingSummaryModal = (code, opts = {}) => ({
  type: "summaryRows",
  eyebrow: "KPI 상세",
  title: `승인/조치대기 - ${opts.scopeName || "전사"}`,
  rows: (code?.steps || []).map((step) => ({
    label: step.label,
    value: `${step.count ?? 0}건`,
    onClick: () =>
      opts.onOpenAssets?.({ vuln_type: step.vuln_type, step_key: step.key, step_label: step.label }),
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
  title: `명령 실패 자산 - ${opts.scopeName || "전사"}`,
  rows: makeAssetRows(code?.assets || [], { ...opts }),
});

export const buildActiveInspectionsTabs = (cce, cve, opts = {}) => ({
  type: "tabs",
  eyebrow: "KPI 상세",
  title: `진행 중 점검 - ${opts.scopeName || "전사"}`,
  tabs: [
    {
      label: `CCE (${(cce?.plans || []).length}건)`,
      type: "assetList",
      rows: (cce?.plans || []).map((item) => ({
        hostname: item.ccp_name || item.plan_name,
        ip: item.target_count != null ? `대상 ${item.target_count}대` : "",
        subText: item.started_at ? `시작일 ${item.started_at}` : null,
        onRowClick: () => opts.onNavigateCce?.(item),
      })),
    },
    {
      label: `CVE (${(cve?.scans || []).length}건)`,
      type: "assetList",
      rows: (cve?.scans || []).map((item) => ({
        hostname: item.job_name || item.scan_name,
        ip: item.target_count != null ? `대상 ${item.target_count}대` : "",
        subText: item.started_at ? `시작일 ${item.started_at}` : null,
        onRowClick: () => opts.onNavigateCve?.(item),
      })),
    },
  ],
});

export const buildUncheckedSummaryModal = (code, opts = {}) => ({
  type: "summaryRows",
  eyebrow: "KPI 상세",
  title: `미점검 자산 - ${opts.scopeName || "전사"}`,
  rows: (code?.categories || []).map((cat) => ({
    label: cat.label,
    value: `${cat.count ?? 0}건`,
    onClick: () => opts.onOpenAssets?.(cat.key),
  })),
});

export const buildUncheckedAssetsModal = (code, opts = {}) => ({
  type: "assetList",
  eyebrow: "미점검 자산",
  title: opts.category || "미점검 자산",
  rows: makeAssetRows(code?.assets || [], { ...opts }),
});

export const buildTrendStepSummaryModal = (trendRow, opts = {}) => {
  const month = trendRow?.month || "";
  const stepRows = (trendRow?.stepSummary || []).map((step) => {
    const stepLabel = resolveStepLabel(step.stepKey, step.label);
    return {
      label: stepLabel,
      value: `${step.count ?? 0}건`,
      onClick: () =>
        opts.onOpenStepAssets?.({ stepKey: step.stepKey, stepLabel, month }),
    };
  });

  return {
    type: "summaryRows",
    eyebrow: `${opts.vulnType} 운영 추이`,
    title: `${month} 상세 현황`,
    rows: [
      { label: "점검 자산", value: `${trendRow?.inspected ?? 0}건` },
      { label: "신규 발견", value: `${trendRow?.foundCount ?? 0}건` },
      { label: "미처리 건수", value: `${trendRow?.remainingCount ?? 0}건` },
      ...stepRows,
      {
        label: "재탐지",
        value: `${trendRow?.redetectCount ?? 0}건`,
        onClick: () =>
          opts.onRedetectDrilldown?.({ stepKey: "redetect", stepLabel: "재탐지", month }),
      },
    ],
  };
};

export const buildTrendStepAssetsModal = (code, opts = {}) => ({
  type: "assetList",
  eyebrow: `${opts.vulnType} ${opts.month}`,
  title: opts.stepKey === "redetect" ? "재탐지 자산 목록" : `${resolveStepLabel(opts.stepKey, opts.stepLabel)} 자산 목록`,
  rows: opts.stepKey === "redetect"
    ? (code?.assets || []).map((item) => ({
        hostname: item.ast_hostname,
        ip: item.ast_ipaddr,
        badge: item.risk_level || item.severity || null,
        subText: item.vuln_count != null ? `취약점 ${item.vuln_count}건` : null,
        onRowClick: () => opts.onOpenRedetectVulns?.(item),
      }))
    : makeAssetRows(code?.assets || [], {
        ...opts,
        onAssetClick: opts.onAssetClick,
      }),
});

export const buildAssetIssuesTabs = (code = {}, opts = {}) => ({
  type: "tabs",
  eyebrow: "자산 이슈",
  title: opts.asset?.ast_hostname || opts.asset?.name || "자산 이슈",
  tabs: [
    {
      label: `CCE (${code?.cce_meta?.total ?? (code?.cce_issues || []).length}건)`,
      type: "assetList",
      rows: (code?.cce_issues || []).map((item) => ({
        hostname: item.name || item.vuln_label,
        ip: item.vuln_id,
        badge: item.severity,
        subText: item.status || null,
      })),
      emptyMessage: "자산 관리 탭에서 상세 CCE 이슈를 확인하세요.",
    },
    {
      label: `CVE (${code?.cve_meta?.total ?? (code?.cve_issues || []).length}건)`,
      type: "assetList",
      rows: (code?.cve_issues || []).map((item) => ({
        hostname: item.name || item.vuln_label,
        ip: item.vuln_id,
        badge: item.severity,
        subText: item.status || null,
      })),
      emptyMessage: "자산 관리 탭에서 상세 CVE 이슈를 확인하세요.",
    },
  ],
});

export const buildRedetectVulnListModal = (opts = {}) => ({
  type: "assetList",
  eyebrow: "재탐지",
  title: `${opts.asset?.ast_hostname || "자산"} 재탐지 취약점`,
  rows: (opts.asset?.redetect_vulns || [
    { vuln_id: opts.vulnType === "CCE" ? "CCE-2024-0001" : "CVE-2024-1234", vuln_label: "재탐지 취약점", severity: "HIGH" },
  ]).map((item) => ({
    hostname: item.vuln_label || item.vuln_id,
    ip: item.vuln_id,
    badge: item.severity,
    subText: "이 취약점의 조치 이력을 확인할 수 있습니다.",
    onRowClick: () => opts.onOpenHistory?.({
      asset: opts.asset,
      vulnType: opts.vulnType,
      vulnId: item.vuln_id,
    }),
  })),
  emptyMessage: "재탐지된 취약점 목록이 없습니다.",
});

export const buildRemediationHistoryModal = (code, opts = {}) => ({
  type: "summaryRows",
  eyebrow: `${opts.vulnType} 조치 이력`,
  title: `${opts.vulnId} 조치 이력`,
  rows: (code?.history || []).map((history, index) => ({
    label: history.action || `이력 ${index + 1}`,
    value: history.date || "-",
    subText: history.memo || null,
  })),
});

export const buildManagedAssetsModal = (code = {}, opts = {}) => ({
  type: "assetList",
  eyebrow: "KPI 상세",
  title: `관리 자산 - ${opts.scopeName || "전사"}`,
  rows: makeAssetRows(code?.assets || [], { ...opts }),
  emptyMessage: "자산 상세 목록은 자산 인벤토리 메뉴에서 확인하세요.",
});

export const buildVulnDetailModal = (code = {}, opts = {}) => ({
  type: "assetList",
  eyebrow: `${opts.type} 취약점 상세`,
  title: `${opts.vulnId} - ${opts.vulnLabel || ""}`,
  rows: (code?.assets || []).map((item) => ({
    hostname: item.ast_hostname,
    ip: item.ast_ipaddr,
    badge: item.risk_level || item.severity,
    subText: item.vuln_person ? `담당: ${item.vuln_person}` : null,
    onRowClick: () => opts.onAssetNavigate?.(item, opts.type, item.step_key || "planReg"),
  })),
  emptyMessage: "취약점 상세 정보는 시스템 점검 또는 취약점 스캔 메뉴에서 확인하세요.",
});

export const buildTicketsByStatusModal = (code = {}, opts = {}) => ({
  type: "assetList",
  eyebrow: "처리상태",
  title: `${opts.statusLabel} 티켓 목록`,
  rows: (code?.items || []).map((item) => ({
    hostname: item.ast_hostname,
    ip: item.ast_ipaddr,
    badge: item.vuln_type,
    subText: `${item.vuln_id} · ${item.step_label || item.current_step || "-"}`,
    onRowClick: () => opts.onAssetNavigate?.(item),
  })),
  emptyMessage: "조치 관리 메뉴에서 티켓 목록을 확인하세요.",
});
