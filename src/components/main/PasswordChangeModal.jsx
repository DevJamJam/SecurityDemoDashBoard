import { useState } from "react";
import sedoApi from "@/lib/sedoApi";
import Swal from "sweetalert2";

export default function PasswordChangeModal({ isOpen, onClose }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Swal.fire({ icon: "warning", title: "입력 필요", text: "모든 항목을 입력해주세요.", confirmButtonText: "확인" });
      return;
    }
    if (newPw !== confirmPw) {
      Swal.fire({ icon: "error", title: "비밀번호 불일치", text: "새 비밀번호가 일치하지 않습니다.", confirmButtonText: "확인" });
      return;
    }
    try {
      const res = await sedoApi.post("/auth/change-password", { current_pw: currentPw, new_pw: newPw });
      if (res.data?.RESULT === "OK") {
        Swal.fire({ icon: "success", title: "변경 완료", text: "비밀번호가 변경되었습니다.", confirmButtonText: "확인" });
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
        onClose();
      } else {
        throw new Error("변경 실패");
      }
    } catch {
      Swal.fire({ icon: "error", title: "변경 실패", text: "현재 비밀번호를 확인해주세요.", confirmButtonText: "확인" });
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "var(--overlay-modal)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--mn-color)", border: "1px solid var(--border)", borderRadius: "16px", padding: "28px", minWidth: "360px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-color)" }}>비밀번호 변경</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--text-secondary)" }}>×</button>
        </div>
        {[["현재 비밀번호", currentPw, setCurrentPw], ["새 비밀번호", newPw, setNewPw], ["새 비밀번호 확인", confirmPw, setConfirmPw]].map(([label, value, setter]) => (
          <div key={label} style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>{label}</label>
            <input
              type="password"
              value={value}
              onChange={(e) => setter(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface-muted)", color: "var(--text-color)", boxSizing: "border-box" }}
            />
          </div>
        ))}
        <button
          onClick={handleSubmit}
          style={{ width: "100%", padding: "12px", background: "var(--button-bg)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}
        >
          변경
        </button>
      </div>
    </div>
  );
}
