import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="login_container">
      <div className="login_img_wrapper">
        <img src={`${import.meta.env.BASE_URL}sedo-logo.svg`} alt="SeDo" />
      </div>
      <Outlet />
    </div>
  );
}
