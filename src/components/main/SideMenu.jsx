import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMainTabStore } from "@/store/navigation/useMainTabStore";
import {
  IconGrid,
  IconFolderAdd,
  IconShieldCheck,
  IconSearchCVE,
  IconClipboard,
} from "@/assets/icons";
import { NAV_CONFIG } from "@/config/navConfig";
import "./sideMenu.css";

const ICON_MAP = {
  dashboard:  IconGrid,
  assets:     IconFolderAdd,
  cce:        IconShieldCheck,
  cve:        IconSearchCVE,
  "vuln-mgmt": IconClipboard,
};

const SIDEBAR_WIDTH = 72;

export default function SideMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTab } = useMainTabStore();
  const [flyout, setFlyout] = useState(null);
  const closeTimer = useRef(null);

  const handleMouseEnter = (key, e) => {
    clearTimeout(closeTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setFlyout({ key, top: rect.top });
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setFlyout(null), 150);
  };

  const flyoutItem = flyout ? NAV_CONFIG.find((n) => n.key === flyout.key) : null;

  return (
    <>
      <aside className="sedo-nav">
        <nav className="sedo-nav__list">
          {NAV_CONFIG.map((item) => {
            const Icon = ICON_MAP[item.key];
            const isActive = location.pathname.startsWith(item.rootPath);
            return (
              <div
                key={item.key}
                className="sedo-nav__section"
                onMouseEnter={(e) => handleMouseEnter(item.key, e)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className={`sedo-nav__icon-btn ${isActive ? "sedo-nav__icon-btn--active" : ""}`}
                  onClick={() => {
                    setTab(item.key);
                    navigate(item.defaultPath);
                  }}
                >
                  {Icon && <Icon className="sedo-nav__icon" />}
                  <span className="sedo-nav__icon-label">{item.label}</span>
                </button>
              </div>
            );
          })}
        </nav>
      </aside>

      {flyout && flyoutItem?.subs.length > 0 && (
        <div
          className="sedo-nav__flyout"
          style={{ top: flyout.top, left: SIDEBAR_WIDTH }}
          onMouseEnter={() => clearTimeout(closeTimer.current)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="sedo-nav__flyout-title">{flyoutItem.label}</div>
          {flyoutItem.subs.map((sub) => {
            const isSubActive = location.pathname.startsWith(sub.path);
            return (
              <button
                key={sub.path}
                type="button"
                className={`sedo-nav__flyout-item ${isSubActive ? "sedo-nav__flyout-item--active" : ""}`}
                onClick={() => {
                  setTab(flyout.key);
                  navigate(sub.path);
                  setFlyout(null);
                }}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
