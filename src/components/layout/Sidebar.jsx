import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiClipboard,
  FiActivity,
  FiGlobe,
  FiCheckSquare,
  FiServer,
} from "react-icons/fi";

const MENU_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: <FiGrid /> },
  { to: "/inspection-plans", label: "Inspection Plans", icon: <FiClipboard /> },
  { to: "/execution-monitor", label: "Execution Monitor", icon: <FiActivity /> },
  { to: "/network-segments", label: "Network Segments", icon: <FiGlobe /> },
  { to: "/result-review", label: "Result Review", icon: <FiCheckSquare /> },
  { to: "/assets", label: "Assets", icon: <FiServer /> },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <nav className={`sidebar${isOpen ? " open" : ""}`}>
        <div className="sidebar__nav">
          <div className="sidebar__section-title">Navigation</div>
          {MENU_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__item${isActive ? " active" : ""}`
              }
              onClick={onClose}
            >
              <span className="sidebar__item-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="sidebar__footer">
          <p className="sidebar__footer-text">SeDo v1.0 — Portfolio Demo</p>
        </div>
      </nav>
      {isOpen && <div className="sidebar-overlay active" onClick={onClose} />}
    </>
  );
}
