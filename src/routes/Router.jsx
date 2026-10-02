import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AuthLayout from "@/pages/authLayout/AuthLayout";
import Login from "@/pages/login/Login";
import MainLayout from "@/layouts/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const SignUp = lazy(() => import("@/pages/authLayout/SignUp"));
const FindId = lazy(() => import("@/pages/authLayout/FindId"));
const ResetPassword = lazy(() => import("@/pages/authLayout/ResetPassword"));

const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const AdminRoleHome = lazy(() => import("@/pages/dashboard/AdminRoleHome"));

const InspectionPlanList = lazy(() => import("@/pages/InspectionPlanList"));
const InspectionPlanDetail = lazy(() => import("@/pages/InspectionPlanDetail"));
const ExecutionMonitor = lazy(() => import("@/pages/ExecutionMonitor"));
const ResultReview = lazy(() => import("@/pages/ResultReview"));
const AssetManagement = lazy(() => import("@/pages/AssetManagement"));
const NetworkSegments = lazy(() => import("@/pages/NetworkSegments"));

function SuspenseWrap({ children }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;
}

export default function Router() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route index element={<Login />} />
        <Route path="signup" element={<SuspenseWrap><SignUp /></SuspenseWrap>} />
        <Route path="find-id" element={<SuspenseWrap><FindId /></SuspenseWrap>} />
        <Route path="reset-password" element={<SuspenseWrap><ResetPassword /></SuspenseWrap>} />
      </Route>

      {/* Protected routes */}
      <Route
        path="/sedo"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* 대시보드 */}
        <Route path="dashboard" element={<SuspenseWrap><Dashboard /></SuspenseWrap>}>
          <Route path="dashboard-home" element={<SuspenseWrap><AdminRoleHome /></SuspenseWrap>} />
          <Route index element={<Navigate to="dashboard-home" replace />} />
        </Route>

        {/* 점검 계획 */}
        <Route path="inspection-plans" element={<SuspenseWrap><InspectionPlanList /></SuspenseWrap>} />
        <Route path="inspection-plans/:id" element={<SuspenseWrap><InspectionPlanDetail /></SuspenseWrap>} />

        {/* 실행 모니터 */}
        <Route path="execution-monitor" element={<SuspenseWrap><ExecutionMonitor /></SuspenseWrap>} />

        {/* 결과 조회 */}
        <Route path="result-review" element={<SuspenseWrap><ResultReview /></SuspenseWrap>} />

        {/* 자산 관리 */}
        <Route path="assets" element={<SuspenseWrap><AssetManagement /></SuspenseWrap>} />

        {/* 네트워크 세그먼트 */}
        <Route path="network-segments" element={<SuspenseWrap><NetworkSegments /></SuspenseWrap>} />

        <Route index element={<Navigate to="dashboard/dashboard-home" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
