import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import SetupWizard from './pages/SetupWizard';
import OwnerDashboard from './pages/OwnerDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import CreateOrder from './pages/CreateOrder';
import DepartmentManagement from './pages/DepartmentManagement';
import StageManagement from './pages/StageManagement';
import CompanyProfile from './pages/CompanyProfile';
import Reports from './pages/Reports';
import ActivityLogs from './pages/ActivityLogs';
import AccountSettings from './pages/AccountSettings';
import RevertRequests from './pages/RevertRequests';

const HomeRedirect = () => {
  const { user, isSetupComplete, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'owner') {
    return isSetupComplete ? <Navigate to="/owner-dashboard" replace /> : <Navigate to="/setup" replace />;
  }
  return <Navigate to="/department-dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Setup Wizard Route */}
          <Route element={<ProtectedRoute allowedRoles={['owner']} requireSetup={false} />}>
            <Route path="/setup" element={<SetupWizard />} />
          </Route>

          {/* Owner Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/orders/create" element={<CreateOrder />} />
            <Route path="/departments" element={<DepartmentManagement />} />
            <Route path="/stages" element={<StageManagement />} />
            <Route path="/company-profile" element={<CompanyProfile />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/activity-logs" element={<ActivityLogs />} />
            <Route path="/account-settings" element={<AccountSettings />} />
            <Route path="/revert-requests" element={<RevertRequests />} />
          </Route>

          {/* Department Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['department']} />}>
            <Route path="/department-dashboard" element={<DepartmentDashboard />} />
          </Route>

          {/* Shared Protected Routes (Owner & Department) */}
          <Route element={<ProtectedRoute allowedRoles={['owner', 'department']} />}>
            <Route path="/orders" element={<OrderList />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
