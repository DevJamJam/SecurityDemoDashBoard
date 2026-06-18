import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/main/Header";
import SideMenu from "../components/main/SideMenu";
import TopMenu from "../components/main/TopMenu";
import "./MainLayout.css";

export default function MainLayout() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/sedo/dashboard");
  const isSettings = location.pathname.startsWith("/sedo/set");

  const noMainScrollPaths = [
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

  const shouldDisableMainScroll = noMainScrollPaths.some((path) =>
    location.pathname.startsWith(path),
  );

  return (
    <div
      className={`main-layout ${isDashboard ? "main-layout--dashboard" : ""} ${
        isSettings ? "main-layout--settings" : ""
      }`}
    >
      <Header />
      <div className="main-layout__body">
        {!isDashboard && !isSettings && <SideMenu />}
        <div className="main-layout__panel">
          {!isDashboard && !isSettings && <TopMenu />}
          <main
            className={`main-layout__content ${
              shouldDisableMainScroll ? "no-main-scroll" : ""
            } ${isDashboard ? "dashboard-content" : ""} ${
              isSettings ? "settings-content" : ""
            }`}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
