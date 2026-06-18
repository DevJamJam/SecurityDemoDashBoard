import { FiSun, FiMoon, FiMenu } from "react-icons/fi";
import useThemeStore from "@/store/useThemeStore";

export default function Header({ onMenuToggle }) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="header">
      <button className="header__btn" onClick={onMenuToggle} aria-label="메뉴 열기">
        <FiMenu />
      </button>

      <div className="header__logo">
        <img
          src="/sedo-logo.svg"
          alt="SeDo Logo"
          className="header__logo-img"
        />
        <div className="header__logo-text">
          <span className="header__logo-name">SeDo</span>
          <span className="header__logo-sub">Security Demo Dashboard</span>
        </div>
      </div>

      <span className="header__badge">MOCK MODE</span>

      <div className="header__spacer" />

      <div className="header__actions">
        <button
          className="header__btn"
          onClick={toggleTheme}
          aria-label="테마 전환"
          title={theme === "dark" ? "라이트 모드" : "다크 모드"}
        >
          {theme === "dark" ? <FiSun /> : <FiMoon />}
        </button>

        <div className="header__user">
          <div className="header__avatar">A</div>
          <span className="header__username">Admin</span>
        </div>
      </div>
    </header>
  );
}
