import { DASHBOARD_TREND_STEPS } from "./data/adminHomeDrilldownMock";

export const NAV_CONFIG = [
  {
    key: "dashboard",
    label: "보안 현황",
    rootPath: "/sedo/dashboard",
    defaultPath: "/sedo/dashboard/dashboard-home",
    subs: [],
  },
  {
    key: "assets",
    label: "자산 인벤토리",
    rootPath: "/sedo/asset",
    defaultPath: "/sedo/asset/asset-list",
    subs: [
      { label: "자산 목록",    path: "/sedo/asset/asset-list" },
      { label: "자산 그룹",    path: "/sedo/asset/asset-mgmt/default" },
      { label: "원격 명령",    path: "/sedo/asset/command-list" },
      { label: "네트워크 탐지", path: "/sedo/asset/network-scan" },
    ],
  },
  {
    key: "cce",
    label: "시스템 점검",
    rootPath: "/sedo/plan",
    defaultPath: "/sedo/plan/intro",
    subs: [
      { label: "점검 개요", path: "/sedo/plan/intro" },
      { label: "점검 현황", path: "/sedo/plan/status" },
      { label: "점검 일정", path: "/sedo/plan/schedule" },
      { label: "결과 조회", path: "/sedo/plan/result-view" },
      { label: "점검 항목", path: "/sedo/inspect/inspect_List" },
    ],
  },
  {
    key: "cve",
    label: "취약점 스캔",
    rootPath: "/sedo/cve",
    defaultPath: "/sedo/cve/inspection",
    subs: [
      { label: "스캔 실행",     path: "/sedo/cve/inspection" },
      { label: "자산별 결과",   path: "/sedo/cve/assets-to-cve" },
      { label: "취약점별 자산", path: "/sedo/cve/cve-to-assets" },
      { label: "스캔 현황",     path: "/sedo/cve/cve-status" },
    ],
  },
  {
    key: "vuln-mgmt",
    label: "조치 관리",
    rootPath: "/sedo/vuln-mgmt",
    defaultPath: "/sedo/vuln-mgmt/plan-reg",
    subs: DASHBOARD_TREND_STEPS.map(({ label, path }) => ({ label, path })),
  },
];
