import { create } from "zustand";
import {
  login,
  logout,
  fetchLoginUser,
  signUp,
  checkEmailDuplicate,
} from "@/api/auth/auth";
import useBookmarkStore from "@/store/bookmark/useBookmarkStore";
import useOrgStore from "@/store/org/useOrgStore";

const normalizeDeptIds = (ids) => {
  if (!Array.isArray(ids)) return [];
  return ids
    .filter((id) => id !== null && id !== undefined && id !== "")
    .map((id) => String(id));
};

const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  authError: null,
  isSessionExpired: false,

  loginUser: async (credentials) => {
    try {
      const res = await login(credentials);
      if (res.RESULT === "OK") {
        const { user_index, user_name, value } = res.CODE;

        set((state) => ({
          ...state,
          user: {
            id: user_index,
            name: user_name,
            role: value,
            can_create_root: Boolean(res.CODE?.can_create_root),
            is_dept_leader: Boolean(res.CODE?.is_dept_leader),
            my_dept_id: normalizeDeptIds(res.CODE?.my_dept_id),
            manageable_dept_ids: normalizeDeptIds(res.CODE?.manageable_dept_ids),
          },
          isLoggedIn: true,
          authError: null,
          isSessionExpired: false,
        }));

        useBookmarkStore
          .getState()
          .loadBookmarksFromUserData(res.CODE.user_bookmark);

        return { success: true };
      }
      return {
        success: false,
        error: res.CODE || "로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.",
      };
    } catch (err) {
      set((state) => ({ ...state, authError: err.message }));
      return {
        success: false,
        error:
          "서버와의 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      };
    }
  },

  logoutUser: async () => {
    try {
      const res = await logout();
      set((state) => ({
        ...state,
        user: null,
        isLoggedIn: false,
        authError: null,
        isSessionExpired: false,
      }));

      sessionStorage.removeItem("bookmarks");
      const { initBookmarks } = useBookmarkStore.getState();
      initBookmarks();
      useOrgStore.getState().clearOrgStore();
      return res;
    } catch (err) {
      set((state) => ({
        ...state,
        user: null,
        isLoggedIn: false,
        authError: err.message,
      }));
      sessionStorage.removeItem("bookmarks");
      const { initBookmarks } = useBookmarkStore.getState();
      initBookmarks();
      useOrgStore.getState().clearOrgStore();
      return {
        success: false,
        error: "로그아웃 중 오류가 발생했습니다.",
      };
    }
  },

  restoreSession: async () => {
    try {
      const res = await fetchLoginUser();
      if (res.RESULT === "OK") {
        const { user_index, user_name, user_roletype_role_index } = res.CODE;

        if (user_index && user_name) {
          set((state) => ({
            ...state,
            user: {
              id: user_index,
              name: user_name,
              role: user_roletype_role_index,
              can_create_root: Boolean(res.CODE?.can_create_root),
              is_dept_leader: Boolean(res.CODE?.is_dept_leader),
              my_dept_id: normalizeDeptIds(res.CODE?.my_dept_id),
              manageable_dept_ids: normalizeDeptIds(res.CODE?.manageable_dept_ids),
            },
            isLoggedIn: true,
            authError: null,
            isSessionExpired: false,
          }));
          return true;
        }
      }
      set((state) => ({
        ...state,
        user: null,
        isLoggedIn: false,
        authError: "세션이 만료되었습니다. 다시 로그인해주세요.",
        isSessionExpired: true,
      }));
      useOrgStore.getState().clearOrgStore();
      return false;
    } catch {
      set((state) => ({
        ...state,
        user: null,
        isLoggedIn: false,
        authError: "세션 복원 중 오류가 발생했습니다.",
        isSessionExpired: true,
      }));
      useOrgStore.getState().clearOrgStore();
      return false;
    }
  },

  resetSessionExpired: () => {
    set((state) => ({
      ...state,
      isSessionExpired: false,
    }));
  },

  checkEmailDuplicate: async (email) => {
    try {
      const res = await checkEmailDuplicate(email);
      return res;
    } catch {
      return {
        success: false,
        error: "이메일 중복 검사 중 오류가 발생했습니다.",
      };
    }
  },

  register: async (payload) => {
    try {
      const res = await signUp(payload);
      return res;
    } catch {
      return {
        success: false,
        error: "회원가입 중 오류가 발생했습니다.",
      };
    }
  },
}));

export default useAuthStore;
