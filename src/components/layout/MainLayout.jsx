import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import useThemeStore from "@/store/useThemeStore";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    const close = () => setSidebarOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  return (
    <div className="app-shell">
      <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <div className="body-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
