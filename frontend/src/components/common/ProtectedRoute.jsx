import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading, hasRole } = useAuth();
  const location = useLocation();

  // Fallback checks to resolve asynchronous React state update race conditions on login redirect
  const localUserStr = localStorage.getItem('user');
  const localToken = localStorage.getItem('token');
  const resolvedUser = user || (localUserStr ? JSON.parse(localUserStr) : null);
  const resolvedIsAuth = isAuthenticated || !!localToken;

  const checkHasRole = (requiredRoles) => {
    if (!resolvedUser || !resolvedUser.roles) return false;
    const userRoleNames = resolvedUser.roles.map((r) => r.name);
    return requiredRoles.some((role) => userRoleNames.includes(role));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-emerald-500">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        <span className="ml-3 text-lg font-medium">Verifying Session...</span>
      </div>
    );
  }

  if (!resolvedIsAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !checkHasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
