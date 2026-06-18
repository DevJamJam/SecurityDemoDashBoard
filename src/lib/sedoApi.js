import axios from "axios";

const sedoApi = axios.create({
  baseURL: "/api",
  timeout: 20000,
  withCredentials: true,
});

export default sedoApi;
