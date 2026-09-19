import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import api from './services/api';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
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

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-amber-500">
      <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function SetupGate({ children }) {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const checkSetup = async () => {
      try {
        const res = await api.get('/auth/setup-status');

        if (active) {
          setSetupRequired(Boolean(res.data?.setupRequired));
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || 'Unable to connect to the CRM server'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    checkSetup();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">
            CRM server unavailable
          </h1>

          <p className="text-sm text-slate-400">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-5 px-4 py-2 bg-amber-500 text-slate-950 rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <SetupRedirect setupRequired={setupRequired}>
      {children}
    </SetupRedirect>
  );
}

function SetupRedirect({ setupRequired, children }) {
  const location = window.location.pathname;

  if (setupRequired && location !== '/signup') {
    return <Navigate to="/signup" replace />;
  }

  if (!setupRequired && location === '/signup') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user?.role)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <SetupGate>
      <Routes>

        {/* Authentication */}
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        {/* Protected CRM Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/leads"
            element={<LeadsList />}
          />

          <Route
            path="/leads/:id"
            element={<LeadDetail />}
          />

          <Route
            path="/followups"
            element={<FollowUpsList />}
          />

          <Route
            path="/calls"
            element={<CallHistoryPage />}
          />

          <Route
            path="/payments"
            element={<PaymentsPage />}
          />

          <Route
            path="/listings"
            element={<ListingsPage />}
          />

          <Route
            path="/import"
            element={
              <ProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'ADMIN']}
              >
                <BulkImportWizard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'SUPER_ADMIN',
                  'ADMIN',
                  'HR_ADMIN',
                  'TEAM_LEAD'
                ]}
              >
                <EmployeesList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'SUPER_ADMIN',
                  'ADMIN',
                  'HR_ADMIN',
                  'TEAM_LEAD'
                ]}
              >
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit"
            element={
              <ProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'ADMIN']}
              >
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Unknown URL */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </SetupGate>
  );
}