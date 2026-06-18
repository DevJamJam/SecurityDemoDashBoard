import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Inspection Plans ──
export const getInspectionPlans = (params) =>
  apiClient.get("/inspection-plans", { params });

export const getInspectionPlanDetail = (id) =>
  apiClient.get(`/inspection-plans/${id}`);

// ── Execution Jobs ──
export const getExecutionJobs = (params) =>
  apiClient.get("/execution-jobs", { params });

export const getExecutionJobDetail = (id) =>
  apiClient.get(`/execution-jobs/${id}`);

export const startExecutionJob = (payload) =>
  apiClient.post("/execution-jobs", payload);

export const updateExecutionJobStatus = (id, payload) =>
  apiClient.patch(`/execution-jobs/${id}/status`, payload);

// ── Network Segments ──
export const getNetworkSegments = (params) =>
  apiClient.get("/network-segments", { params });

export const getNetworkSegmentDetail = (id) =>
  apiClient.get(`/network-segments/${id}`);

export const updateNetworkSegment = (id, payload) =>
  apiClient.patch(`/network-segments/${id}`, payload);

// ── Inspection Results ──
export const getInspectionResults = (params) =>
  apiClient.get("/inspection-results", { params });

export const updateInspectionResult = (id, payload) =>
  apiClient.patch(`/inspection-results/${id}`, payload);

// ── Assets ──
export const getAssets = (params) =>
  apiClient.get("/assets", { params });
