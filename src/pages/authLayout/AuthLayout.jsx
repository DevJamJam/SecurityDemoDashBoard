import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img src={`${import.meta.env.BASE_URL}sedo-logo-dark.svg`} alt="SeDo" className="auth-brand__logo" />
          <span className="auth-brand__tagline">Security Dashboard</span>
        </div>
        <div className="auth-form-panel">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
