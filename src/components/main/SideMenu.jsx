import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMainTabStore } from "@/store/navigation/useMainTabStore";
import useLayoutStore from "@/store/common/useLayoutStore";
import { FiChevronLeft, FiChevronRight, FiChevronDown } from "react-icons/fi";
import {
  IconGrid,
  IconFolderAdd,
  IconShieldCheck,
  IconSearchCVE,
  IconClipboard,
} from "@/assets/icons";
import { DASHBOARD_TREND_STEPS } from "@/config/data/adminHomeDrilldownMock";
import "./sideMenu.css";

const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "보안 현황",
    Icon: IconGrid,
    rootPath: "/sedo/dashboard",
    defaultPath: "/sedo/dashboard/dashboard-home",
    subs: [],
  },
  {
    key: "assets",
    label: "자산 인벤토리",
    Icon: IconFolderAdd,
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
    Icon: IconShieldCheck,
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
    Icon: IconSearchCVE,
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
    Icon: IconClipboard,
    rootPath: "/sedo/vuln-mgmt",
    defaultPath: "/sedo/vuln-mgmt/plan-reg",
    subs: DASHBOARD_TREND_STEPS.map(({ label, path }) => ({ label, path })),
  },
];

export default function SideMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTab } = useMainTabStore();
  const { isSideCollapsed, toggleSideCollapsed } = useLayoutStore();

  // 현재 경로에 해당하는 섹션을 초기 open 상태로 설정
  const getInitialOpen = () => {
    const matched = NAV_ITEMS.find((item) =>
      location.pathname.startsWith(item.rootPath)
    );
    return matched?.key ?? null;
  };

  const [openKey, setOpenKey] = useState(getInitialOpen);

  // 경로 변경 시 해당 섹션을 자동으로 열어줌
  useEffect(() => {
    const matched = NAV_ITEMS.find((item) =>
      location.pathname.startsWith(item.rootPath)
    );
    if (matched) setOpenKey(matched.key);
  }, [location.pathname]);

  const handleNavClick = (item) => {
    setTab(item.key);

    if (item.subs.length === 0) {
      // 서브 없는 항목(보안 현황)은 바로 이동
      navigate(item.defaultPath);
      return;
    }

    // 서브 있는 항목: 이미 열려 있으면 접고, 닫혀 있으면 열고 첫 서브로 이동
    if (openKey === item.key) {
      setOpenKey(null);
    } else {
      setOpenKey(item.key);
      navigate(item.defaultPath);
    }
  };

  const handleSubClick = (sub) => {
    navigate(sub.path);
  };

  return (
    <aside className={`sedo-nav ${isSideCollapsed ? "sedo-nav--collapsed" : ""}`}>
      <nav className="sedo-nav__list">
        {NAV_ITEMS.map((item) => {
          const isRouteActive = location.pathname.startsWith(item.rootPath);
          const isOpen = openKey === item.key;
          const hasSubs = item.subs.length > 0;

          return (
            <div key={item.key} className="sedo-nav__section">
              <button
                type="button"
                className={`sedo-nav__item ${isRouteActive ? "sedo-nav__item--active" : ""}`}
                onClick={() => handleNavClick(item)}
                title={isSideCollapsed ? item.label : undefined}
              >
                <item.Icon className="sedo-nav__icon" />
                {!isSideCollapsed && (
                  <>
                    <span className="sedo-nav__label">{item.label}</span>
                    {hasSubs && (
                      <FiChevronDown
                        className={`sedo-nav__chevron ${isOpen ? "sedo-nav__chevron--open" : ""}`}
                      />
                    )}
                  </>
                )}
              </button>

              {!isSideCollapsed && isOpen && hasSubs && (
                <div className="sedo-nav__subs">
                  {item.subs.map((sub) => {
                    const isSubActive = location.pathname.startsWith(sub.path);
                    return (
                      <button
                        key={sub.path}
                        type="button"
                        className={`sedo-nav__sub ${isSubActive ? "sedo-nav__sub--active" : ""}`}
                        onClick={() => handleSubClick(sub)}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sedo-nav__collapse-wrap">
        <button
          type="button"
          className="sedo-nav__collapse"
          onClick={toggleSideCollapsed}
          title={isSideCollapsed ? "메뉴 펼치기" : "메뉴 접기"}
        >
          {isSideCollapsed ? <FiChevronRight /> : <><FiChevronLeft /><span>접기</span></>}
        </button>
      </div>
    </aside>
  );
}
