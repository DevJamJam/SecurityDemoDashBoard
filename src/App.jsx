import { useEffect, useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import Router from "./routes/Router";
import useAuthStore from "./store/auth/useAuthStore";
import Swal from "sweetalert2";
import useBookmarkStore from "@/store/bookmark/useBookmarkStore";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isSessionExpired = useAuthStore((state) => state.isSessionExpired);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const intervalRef = useRef(null);
  const { setBookmarks, initBookmarks } = useBookmarkStore();

  useEffect(() => {
    let mounted = true;
    const initializeAuth = async () => {
      try {
        await restoreSession();
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    initializeAuth();
    return () => { mounted = false; };
  }, [restoreSession]);

  useEffect(() => {
    if (isLoggedIn) {
      const INTERVAL = 5 * 60 * 1000;
      intervalRef.current = window.setInterval(restoreSession, INTERVAL);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [isLoggedIn, restoreSession]);

  useEffect(() => {
    if (isLoggedIn && isSessionExpired) {
      Swal.fire({
        title: "세션 만료",
        text: "로그인 세션이 만료되었습니다. 다시 로그인해주세요.",
        icon: "warning",
        confirmButtonText: "로그인",
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then((result) => {
        if (result.isConfirmed) window.location.href = "/";
      });
    }
  }, [isLoggedIn, isSessionExpired]);

  useEffect(() => {
    const saved = sessionStorage.getItem("bookmarks");
    if (saved) {
      try { setBookmarks(JSON.parse(saved)); } catch { initBookmarks(); }
    } else {
      initBookmarks();
    }
  }, []);

  if (isLoading) return null;

  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}

export default App;
