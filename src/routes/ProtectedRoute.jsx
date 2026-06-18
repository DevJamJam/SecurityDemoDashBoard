import { Navigate } from "react-router-dom";
import useAuthStore from "@/store/auth/useAuthStore";

export default function ProtectedRoute({ children }) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}
