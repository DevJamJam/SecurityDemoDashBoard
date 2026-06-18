import "./login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/store/auth/useAuthStore";
import Swal from "sweetalert2";

function Login() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const loginUser = useAuthStore((state) => state.loginUser);

  const signupHandle = () => navigate("/signup");
  const handleFindId = () => navigate("/find-id");
  const handleResetPassword = () => navigate("/reset-password");

  const handleLogin = async () => {
    if (!userId || !password) {
      Swal.fire({
        icon: "warning",
        title: "입력 필요",
        text: "아이디와 비밀번호를 입력해주세요!",
        confirmButtonText: "확인",
        confirmButtonColor: getComputedStyle(document.documentElement).getPropertyValue("--button-bg"),
      });
      return;
    }

    const res = await loginUser({ user_email: userId, user_pw: password });

    if (res.success) {
      navigate("/sedo/dashboard/dashboard-home", { replace: true });
    } else {
      Swal.fire({
        icon: "error",
        title: "로그인 실패",
        text: res.error || "아이디 또는 비밀번호를 확인해주세요.",
        confirmButtonText: "확인",
        confirmButtonColor: getComputedStyle(document.documentElement).getPropertyValue("--button-fail"),
      });
    }
  };

  return (
    <div className="content">
      <div className="login_top_content_wrapper login">
        <div>
          <div><p>Email</p></div>
          <div>
            <input value={userId} onChange={(e) => setUserId(e.target.value)} />
          </div>
        </div>
        <div>
          <div><p>Password</p></div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
            />
          </div>
        </div>
        <div className="login_bottom_content_wrapper">
          <button className="login_btn" onClick={handleLogin}>LOGIN</button>
          <div className="login_btn_wrapper">
            <button className="login_btn_none" onClick={handleFindId}>아이디 찾기</button>
            |
            <button className="login_btn_none" onClick={handleResetPassword}>비밀번호 초기화</button>
          </div>
          <div className="login_signup_wrapper">
            <p>계정이 없으신가요?</p>
            <button onClick={signupHandle} className="login_btn_none text">
              <span>회원가입</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
