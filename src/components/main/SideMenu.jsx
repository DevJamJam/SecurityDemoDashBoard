import { useLocation, useNavigate } from "react-router-dom";
import { useMainTabStore } from "@/store/navigation/useMainTabStore";
import {
  IconGrid,
  IconFolderAdd,
  IconShieldCheck,
  IconClipboard,
  IconNetworkPing,
  IconFactCheck,
} from "@/assets/icons";
import { NAV_CONFIG } from "@/config/navConfig";
import "./sideMenu.css";

const ICON_MAP = {
  "dashboard":          IconGrid,
  "inspection-plans":   IconShieldCheck,
  "execution-monitor":  IconClipboard,
  "result-review":      IconFactCheck,
  "assets":             IconFolderAdd,
  "network-segments":   IconNetworkPing,
};

export default function SideMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTab } = useMainTabStore();

  return (
    <aside className="sedo-nav">
      <nav className="sedo-nav__list">
        {NAV_CONFIG.map((item) => {
          const Icon = ICON_MAP[item.key];
          const isActive = location.pathname.startsWith(item.rootPath);
          return (
            <div key={item.key} className="sedo-nav__section">
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
  );
}
