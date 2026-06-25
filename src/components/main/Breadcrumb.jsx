import { useLocation } from "react-router-dom";
import { NAV_CONFIG } from "@/config/navConfig";
import "./breadcrumb.css";

export default function Breadcrumb() {
  const location = useLocation();
  const section = NAV_CONFIG.find((item) => location.pathname.startsWith(item.rootPath));
  if (!section) return null;
  const sub = section.subs.find((s) => location.pathname.startsWith(s.path));

  return (
    <div className="app-breadcrumb">
      <span className="app-breadcrumb__section">{section.label}</span>
      {sub && (
        <>
          <span className="app-breadcrumb__sep">›</span>
          <span className="app-breadcrumb__sub">{sub.label}</span>
        </>
      )}
    </div>
  );
}
