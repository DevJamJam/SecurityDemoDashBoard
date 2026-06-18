import { create } from "zustand";
import { getBookmark, setBookmark } from "@/api/cce/bookmark";

const DEFAULT_BOOKMARKS = {
  CCE: [],
  CVE: [],
  COMMAND: [],
  DASHBOARD: [],
  ASSET: [],
};

const useBookmarkStore = create((set) => ({
  bookmarks: DEFAULT_BOOKMARKS,

  setBookmarks: (bm) => {
    set({ bookmarks: bm });
    sessionStorage.setItem("bookmarks", JSON.stringify(bm));
    setBookmark({
      user_bookmark: JSON.stringify(bm),
    });
  },
  initBookmarks: () => set({ bookmarks: { ...DEFAULT_BOOKMARKS } }),

  loadBookmarksFromUserData: (raw) => {
    let data;
    try {
      data = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      data = DEFAULT_BOOKMARKS;
    }
    set({ bookmarks: { ...DEFAULT_BOOKMARKS, ...data } });
    sessionStorage.setItem("bookmarks", JSON.stringify(data));
  },
  fetchBookmarks: async () => {
    try {
      const res = await getBookmark();
      if (res.RESULT === "OK") {
        set({ bookmarks: { ...DEFAULT_BOOKMARKS, ...res.CODE.user_bookmark } });
        sessionStorage.setItem(
          "bookmarks",
          JSON.stringify(res.CODE.user_bookmark)
        );
      }
    } catch {
      /* 북마크 로드 실패 시 기본값 유지 */
    }
  },
}));

export default useBookmarkStore;
