import sedoApi from "@/lib/sedoApi";

export const getBookmark = async () => {
  const res = await sedoApi.get("/user/bookmark");
  return res.data;
};

export const setBookmark = async (payload) => {
  const res = await sedoApi.post("/user/bookmark", payload);
  return res.data;
};
