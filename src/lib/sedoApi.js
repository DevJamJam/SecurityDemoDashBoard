import axios from "axios";

const sedoApi = axios.create({
  baseURL: "/api",
  timeout: 20000,
  withCredentials: true,
});

/**
 * 서버 응답 envelope 4종을 단일 형태로 흡수
 *   { RESULT, CODE }  → CODE 반환 (비즈니스 오류는 예외 처리)
 *   { data }          → data 반환
 *   { items, total }  → 그대로 반환
 *   그 외             → 그대로 반환
 */
export function resolveEnvelope(data) {
  if (data == null) return data;
  if ("RESULT" in data) {
    if (data.RESULT !== "OK") throw new Error(data.CODE ?? "API 오류");
    return data.CODE;
  }
  if ("data" in data && typeof data.data === "object" && data.data !== null) return data.data;
  return data;
}

export default sedoApi;
