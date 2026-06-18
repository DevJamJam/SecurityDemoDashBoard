import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/main/Header";
import SideMenu from "../components/main/SideMenu";
import "./MainLayout.css";

export default function MainLayout() {
  const location = useLocation();

  const noScrollPaths = [
    "/sedo/asset",
    "/sedo/cve/cve-status-detail",
    "/sedo/cve/assets-to-cve",
    "/sedo/cve/cve-to-assets",
    "/sedo/cve/inspection",
    "/sedo/plan/detail",
    "/sedo/plan/status",
    "/sedo/plan/result-view",
    "/sedo/inspect/inspect_List_detail_list",
  ];

  const isDashboard = location.pathname.startsWith("/sedo/dashboard");
  const noScroll = noScrollPaths.some((p) => location.pathname.startsWith(p));

  return (
    <div className="app-shell">
      <Header />
      <div className="app-shell__body">
        <SideMenu />
        <main
          className={[
            "app-shell__content",
            isDashboard ? "app-shell__content--dashboard" : "",
            noScroll ? "app-shell__content--no-scroll" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
