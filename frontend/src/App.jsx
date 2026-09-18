import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import LeadsList from './pages/leads/LeadsList';
import LeadDetail from './pages/leads/LeadDetail';
import FollowUpsList from './pages/followups/FollowUpsList';
import CallHistoryPage from './pages/calls/CallHistoryPage';
import BulkImportWizard from './pages/import/BulkImportWizard';
import EmployeesList from './pages/employees/EmployeesList';
import PaymentsPage from './pages/payments/PaymentsPage';
import ListingsPage from './pages/listings/ListingsPage';
import ReportsPage from './pages/reports/ReportsPage';
import AuditLogsPage from './pages/audit/AuditLogsPage';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-amber-500">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Authenticated Dashboard Shell */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<LeadsList />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/followups" element={<FollowUpsList />} />
        <Route path="/calls" element={<CallHistoryPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/listings" element={<ListingsPage />} />

        {/* Roles scoped routes */}
        <Route
          path="/import"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <BulkImportWizard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'TEAM_LEAD']}>
              <EmployeesList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'TEAM_LEAD']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
