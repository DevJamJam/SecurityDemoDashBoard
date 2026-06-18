import { useEffect, useRef, useState } from "react";
import ThemeToggle from "../common/ThemeToggle";
import PasswordChangeModal from "./PasswordChangeModal";
import "./header.css";
import { useMainTabStore } from "@/store/navigation/useMainTabStore";
import { clientFeatures } from "@/config/clientFeatures";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "@/store/auth/useAuthStore";
import useLayoutStore from "@/store/common/useLayoutStore";
import Swal from "sweetalert2";
import {
  IconFolderAdd,
  IconShieldCheck,
  IconGrid,
  IconMessageReport,
  IconSearchFound,
  IconAssign,
} from "@/assets/icons";

export default function Header() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/sedo/dashboard");
  const tab = useMainTabStore((state) => state.tab);
  const setTab = useMainTabStore((state) => state.setTab);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logoutUser = useAuthStore((state) => state.logoutUser);
  const isSideCollapsed = useLayoutStore((state) => state.isSideCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (location.pathname.startsWith("/sedo/vuln-mgmt")) {
      setTab("vuln-mgmt");
      return;
    }
    if (location.pathname.startsWith("/sedo/vuln-track")) {
      setTab("vuln-track");
      return;
    }
    if (
      location.pathname.startsWith("/sedo/plan") ||
      location.pathname.startsWith("/sedo/inspect") ||
      location.pathname.startsWith("/sedo/target_assets")
    ) {
      setTab("cce");
      return;
    }
    if (location.pathname.startsWith("/sedo/asset")) {
      setTab("assets");
      return;
    }
    if (location.pathname.startsWith("/sedo/cve")) {
      setTab("cve");
      return;
    }
    if (location.pathname.startsWith("/sedo/dashboard")) {
      setTab("dashboard");
    }
  }, [location.pathname, setTab]);

  const handleTabClick = (targetTab) => {
    setTab(targetTab);
    if (targetTab === "dashboard") {
      navigate("/sedo/dashboard/dashboard-home");
    } else if (targetTab === "cce") {
      navigate("/sedo/plan/intro");
    } else if (targetTab === "vuln-mgmt") {
      navigate("/sedo/vuln-mgmt/plan-reg");
    } else if (targetTab === "vuln-track") {
      navigate("/sedo/vuln-track/plan");
    } else if (targetTab === "assets") {
      navigate("/sedo/asset/asset-list");
    } else if (targetTab === "cve") {
      navigate("/sedo/cve/inspection");
    }
  };

  const handleLogout = async () => {
    try {
      const res = await logoutUser();
      useMainTabStore.getState().resetTab();
      if (res?.data?.RESULT === "OK") {
        navigate("/");
      } else {
        navigate("/");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "로그아웃 실패",
        text: error.message || "로그아웃 처리 중 오류가 발생했습니다.",
        confirmButtonText: "확인",
        confirmButtonColor: getComputedStyle(document.documentElement).getPropertyValue("--button-fail"),
      });
    }
  };

  return (
    <>
      <header
        className={`header-container ${isDashboard ? "is-dashboard" : ""} ${
          isSideCollapsed ? "is-side-collapsed" : ""
        }`}
      >
        <div className="header-left">
          <div className="logo">
            <img src="/sedo-logo.svg" alt="SeDo" />
          </div>
        </div>
        <div className="header-center">
          <div className="header-menu-group">
            <button
              className={`header-menu dashboard ${tab === "dashboard" ? "active" : ""}`}
              onClick={() => handleTabClick("dashboard")}
            >
              <IconGrid className="header-menu__icon dashboard" />
              DashBoard
            </button>
            {clientFeatures.enableAssets && (
              <button
                className={`header-menu assets ${tab === "assets" ? "active" : ""}`}
                onClick={() => handleTabClick("assets")}
              >
                <IconFolderAdd className="header-menu__icon assets" />
                자산관리
              </button>
            )}
            {clientFeatures.enableCce && (
              <button
                className={`header-menu cce ${tab === "cce" ? "active" : ""}`}
                onClick={() => handleTabClick("cce")}
              >
                <IconShieldCheck className="header-menu__icon cce" />
                CCE 관리
              </button>
            )}
            {clientFeatures.enableCve && (
              <button
                className={`header-menu cve ${tab === "cve" ? "active" : ""}`}
                onClick={() => handleTabClick("cve")}
              >
                <IconMessageReport className="header-menu__icon cve" />
                CVE 관리
              </button>
            )}
            {clientFeatures.enableCce && (
              <>
                <button
                  className={`header-menu vuln-mgmt ${tab === "vuln-mgmt" ? "active" : ""}`}
                  onClick={() => handleTabClick("vuln-mgmt")}
                >
                  <IconSearchFound className="header-menu__icon vuln-mgmt" />
                  취약점관리
                </button>
                {clientFeatures.enableVulnTrack && (
                  <button
                    className={`header-menu vuln-track ${tab === "vuln-track" ? "active" : ""}`}
                    onClick={() => handleTabClick("vuln-track")}
                  >
                    <IconAssign className="header-menu__icon vuln-track" />
                    취약점추적
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="header-right">
          <ThemeToggle />
          <div className="user-menu" ref={userMenuRef}>
            <button
              type="button"
              className={`user-name ${menuOpen ? "is-open" : ""}`}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {user?.name || "사용자"} 님
            </button>
            {menuOpen && (
              <div className="user-menu__dropdown">
                <button
                  type="button"
                  className="user-menu__item"
                  onClick={() => {
                    setMenuOpen(false);
                    setPwModalOpen(true);
                  }}
                >
                  비밀번호 변경
                </button>
              </div>
            )}
          </div>
          <button className="logout-button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </header>
      <PasswordChangeModal
        isOpen={pwModalOpen}
        onClose={() => setPwModalOpen(false)}
      />
    </>
  );
}
