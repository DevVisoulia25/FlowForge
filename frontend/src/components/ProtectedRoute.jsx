import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = ['owner', 'department'], requireSetup = true }) => {
  const { user, company, loading, isSetupComplete } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-indigo-400">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium tracking-wide text-slate-400">Loading FlowForge...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If setup is not complete and user is owner, redirect to wizard
  if (requireSetup && !isSetupComplete && user.role === 'owner') {
    return <Navigate to="/setup" replace />;
  }

  // Role verification
  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'department') {
      return <Navigate to="/department-dashboard" replace />;
    }
    return <Navigate to="/owner-dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
