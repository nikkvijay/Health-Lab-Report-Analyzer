import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Reports from "./pages/Reports";
import Results from "./pages/Results";
import Trends from "./pages/Trends";
import Settings from "./pages/Settings";
import SharedReport from "./pages/SharedReport";
import NotFound from "./pages/NotFoundPage";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";

const AppRouter = () => (
  <Routes>
    {/* Public routes */}
    <Route 
      path="/login" 
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } 
    />
    <Route 
      path="/register" 
      element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } 
    />

    {/* Shared report route - public but token-protected */}
    <Route path="/shared/reports/:reportId" element={<SharedReport />} />

    {/* Protected routes */}
    <Route 
      path="/" 
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="upload" element={<Upload />} />
      <Route path="reports" element={<Reports />} />
      <Route path="results" element={<Results />} />
      <Route path="trends" element={<Trends />} />
      <Route path="settings" element={<Settings />} />
    </Route>
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRouter;
