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
const HomeRouter = lazy(() => import("@/pages/stubs/HomeRouter"));
const HomeAssets = lazy(() => import("@/pages/stubs/HomeAssets"));
const HomeCve = lazy(() => import("@/pages/stubs/HomeCve"));
const HomeVulnMgmt = lazy(() => import("@/pages/stubs/HomeVulnMgmt"));
const HomeCommand = lazy(() => import("@/pages/stubs/HomeCommand"));

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
        {/* Dashboard */}
        <Route path="dashboard" element={<SuspenseWrap><Dashboard /></SuspenseWrap>}>
          <Route path="dashboard-home" element={<SuspenseWrap><AdminRoleHome /></SuspenseWrap>} />
          <Route index element={<Navigate to="dashboard-home" replace />} />
        </Route>

        {/* Assets */}
        <Route path="asset/*" element={<SuspenseWrap><HomeAssets /></SuspenseWrap>} />

        {/* CCE */}
        <Route path="plan/*" element={<SuspenseWrap><HomeRouter tab="cce" /></SuspenseWrap>} />
        <Route path="inspect/*" element={<SuspenseWrap><HomeRouter tab="cce" /></SuspenseWrap>} />
        <Route path="target_assets/*" element={<SuspenseWrap><HomeRouter tab="cce" /></SuspenseWrap>} />

        {/* CVE */}
        <Route path="cve/*" element={<SuspenseWrap><HomeCve /></SuspenseWrap>} />

        {/* VulnMgmt */}
        <Route path="vuln-mgmt/*" element={<SuspenseWrap><HomeVulnMgmt /></SuspenseWrap>} />
        <Route path="vuln-track/*" element={<SuspenseWrap><HomeVulnMgmt /></SuspenseWrap>} />

        {/* Command */}
        <Route path="asset/command-list" element={<SuspenseWrap><HomeCommand /></SuspenseWrap>} />

        <Route index element={<Navigate to="dashboard/dashboard-home" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
