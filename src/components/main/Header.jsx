import { useEffect, useRef, useState } from "react";
import ThemeToggle from "../common/ThemeToggle";
import PasswordChangeModal from "./PasswordChangeModal";
import "./header.css";
import useAuthStore from "@/store/auth/useAuthStore";
import useLayoutStore from "@/store/common/useLayoutStore";
import { useMainTabStore } from "@/store/navigation/useMainTabStore";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const logoutUser = useAuthStore((state) => state.logoutUser);
  const navigate = useNavigate();
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

  const handleLogout = async () => {
    try {
      await logoutUser();
      useMainTabStore.getState().resetTab();
      navigate("/");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "로그아웃 실패",
        text: error.message || "로그아웃 처리 중 오류가 발생했습니다.",
        confirmButtonText: "확인",
        confirmButtonColor: getComputedStyle(document.documentElement).getPropertyValue("--button-bg"),
      });
    }
  };

  const roleLabel = user?.role === 1 ? "관리자" : "부서장";

  return (
    <>
      <header className="sedo-header">
        <div className="sedo-header__brand">
          <img
            src={`${import.meta.env.BASE_URL}sedo-logo.svg`}
            alt="SeDo"
            className="sedo-header__logo"
          />
          <span className="sedo-header__wordmark">SeDo</span>
          <span className="sedo-header__badge">DEMO</span>
        </div>

        <div className="sedo-header__actions">
          <ThemeToggle />

          <div className="sedo-header__user" ref={userMenuRef}>
            <button
              type="button"
              className={`sedo-header__user-btn ${menuOpen ? "is-open" : ""}`}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="sedo-header__avatar">{(user?.name || "U")[0]}</span>
              <span className="sedo-header__user-name">{user?.name || "사용자"}</span>
              <span className="sedo-header__role-pill">{roleLabel}</span>
            </button>

            {menuOpen && (
              <div className="sedo-header__dropdown">
                <button
                  type="button"
                  className="sedo-header__dropdown-item"
                  onClick={() => { setMenuOpen(false); setPwModalOpen(true); }}
                >
                  비밀번호 변경
                </button>
                <div className="sedo-header__dropdown-divider" />
                <button
                  type="button"
                  className="sedo-header__dropdown-item sedo-header__dropdown-item--danger"
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <PasswordChangeModal isOpen={pwModalOpen} onClose={() => setPwModalOpen(false)} />
    </>
  );
}
