import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.username === "admin" && form.password === "demo1234") {
      navigate("/dashboard");
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다. (admin / demo1234)");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__logo">
          <img src={`${import.meta.env.BASE_URL}sedo-logo.svg`} alt="SeDo Logo" className="login-card__logo-img" />
          <h1 className="login-card__title">SeDo</h1>
          <p className="login-card__subtitle">Security Demo Dashboard</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form__field">
            <label className="search-menu__label">아이디</label>
            <input
              className="search-menu__input"
              type="text"
              placeholder="admin"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              autoComplete="username"
            />
          </div>
          <div className="login-form__field">
            <label className="search-menu__label">비밀번호</label>
            <input
              className="search-menu__input"
              type="password"
              placeholder="demo1234"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-form__error">{error}</p>}

          <Button variant="accent" type="submit" style={{ width: "100%", marginTop: 8 }}>
            로그인
          </Button>
        </form>

        <p className="login-card__hint">
          데모 계정: <strong>admin</strong> / <strong>demo1234</strong>
        </p>
      </div>
    </div>
  );
}
