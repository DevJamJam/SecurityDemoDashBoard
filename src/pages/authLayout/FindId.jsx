import { useNavigate } from "react-router-dom";

export default function FindId() {
  const navigate = useNavigate();
  return (
    <div className="content">
      <div className="login_top_content_wrapper">
        <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
          <p>아이디 찾기는 관리자에게 문의해주세요.</p>
          <button
            className="login_btn_none"
            style={{ marginTop: "12px", color: "var(--brand-cce)" }}
            onClick={() => navigate("/")}
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
