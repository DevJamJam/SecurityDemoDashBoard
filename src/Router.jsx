import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardHome from "@/pages/DashboardHome";
import InspectionPlanList from "@/pages/InspectionPlanList";
import InspectionPlanDetail from "@/pages/InspectionPlanDetail";
import ExecutionMonitor from "@/pages/ExecutionMonitor";
import NetworkSegments from "@/pages/NetworkSegments";
import ResultReview from "@/pages/ResultReview";
import AssetManagement from "@/pages/AssetManagement";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="inspection-plans" element={<InspectionPlanList />} />
          <Route path="inspection-plans/:id" element={<InspectionPlanDetail />} />
          <Route path="execution-monitor" element={<ExecutionMonitor />} />
          <Route path="network-segments" element={<NetworkSegments />} />
          <Route path="result-review" element={<ResultReview />} />
          <Route path="assets" element={<AssetManagement />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
