import { useLocation, useNavigate } from "react-router-dom";
import { useMainTabStore } from "@/store/navigation/useMainTabStore";
import useLayoutStore from "@/store/common/useLayoutStore";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./sideMenu.css";

const CCE_MENUS = [
  { label: "점검 소개", path: "/sedo/plan/intro" },
  { label: "점검현황", path: "/sedo/plan/status" },
  { label: "점검관리", path: "/sedo/plan/schedule" },
  { label: "결과조회", path: "/sedo/plan/result-view" },
  { label: "점검항목관리", path: "/sedo/inspect/inspect_List" },
];

const VULN_MGMT_MENUS = [
  { label: "조치계획등록", path: "/sedo/vuln-mgmt/plan-reg" },
  { label: "조치계획승인", path: "/sedo/vuln-mgmt/plan-approval" },
  { label: "조치결과등록", path: "/sedo/vuln-mgmt/result-reg" },
  { label: "조치결과승인", path: "/sedo/vuln-mgmt/result-approval" },
  { label: "조치완료", path: "/sedo/vuln-mgmt/result-fix" },
];

const ASSET_MENUS = [
  { label: "자산 목록", path: "/sedo/asset/asset-list" },
  { label: "자산 그룹", path: "/sedo/asset/asset-mgmt/default" },
  { label: "명령 실행", path: "/sedo/asset/command-list" },
  { label: "시스템 정보 수집", path: "/sedo/asset/system-info-collect" },
  { label: "네트워크 스캔", path: "/sedo/asset/network-scan" },
  { label: "네트워크 접근통제", path: "/sedo/asset/network-acl" },
];

const CVE_MENUS = [
  { label: "CVE 점검", path: "/sedo/cve/inspection" },
  { label: "자산별 CVE", path: "/sedo/cve/assets-to-cve" },
  { label: "CVE 별 자산", path: "/sedo/cve/cve-to-assets" },
  { label: "CVE 현황", path: "/sedo/cve/cve-status" },
];

export default function SideMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const tab = useMainTabStore((state) => state.tab);
  const { isSideCollapsed, toggleSideCollapsed } = useLayoutStore();

  const getMenus = () => {
    if (tab === "cce") return CCE_MENUS;
    if (tab === "vuln-mgmt") return VULN_MGMT_MENUS;
    if (tab === "assets") return ASSET_MENUS;
    if (tab === "cve") return CVE_MENUS;
    return [];
  };

  const menus = getMenus();

  return (
    <aside className={`side-menu ${isSideCollapsed ? "side-menu--collapsed" : ""}`}>
      <div className="side-menu__items">
        {menus.map((menu) => {
          const isActive = location.pathname.startsWith(menu.path);
          return (
            <button
              key={menu.path}
              type="button"
              className={`side-menu__item ${isActive ? "side-menu__item--active" : ""}`}
              onClick={() => navigate(menu.path)}
              title={isSideCollapsed ? menu.label : undefined}
            >
              {!isSideCollapsed && <span>{menu.label}</span>}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="side-menu__collapse-btn"
        onClick={toggleSideCollapsed}
      >
        {isSideCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>
    </aside>
  );
}
