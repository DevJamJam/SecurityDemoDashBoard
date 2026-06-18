import sedoApi from "@/lib/sedoApi";

export const login = async (payload) => {
  const res = await sedoApi.post("/auth/login", payload);
  return res.data;
};

export const logout = async () => {
  const res = await sedoApi.post("/auth/logout");
  return res;
};

export const fetchLoginUser = async () => {
  const res = await sedoApi.get("/auth/me");
  return res.data;
};

export const signUp = async (payload) => {
  const res = await sedoApi.post("/auth/signup", payload);
  return res.data;
};

export const checkEmailDuplicate = async (payload) => {
  const res = await sedoApi.post("/auth/check-email", payload);
  return res.data;
};

export const changePassword = async (payload) => {
  const res = await sedoApi.post("/auth/change-password", payload);
  return res.data;
};
