import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/main/Header";
import SideMenu from "../components/main/SideMenu";
import Breadcrumb from "../components/main/Breadcrumb";
import "./MainLayout.css";

export default function MainLayout() {
  const location = useLocation();

  const isDashboard = location.pathname.startsWith("/sedo/dashboard");

  return (
    <div className="app-shell">
      <Header />
      <div className="app-shell__body">
        <SideMenu />
        <main
          className={[
            "app-shell__content",
            isDashboard ? "app-shell__content--dashboard" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {!isDashboard && <Breadcrumb />}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
