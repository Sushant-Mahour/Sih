import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/useAuthStore';
import { ROLE_HOME_ROUTES, ROLES } from '../config/roles';
import { showToast } from '../components/ui/Toast';

export function RequireAuth({ children, roles = [] }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  const userRole = user?.role || ROLES.ADMIN;

  if (!isAuthenticated && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required and user does not have permission
  if (roles.length > 0 && user && !roles.includes(userRole)) {
    const homeRoute = ROLE_HOME_ROUTES[userRole] || '/dashboard';
    showToast('You do not have access to that page.', 'error');
    return <Navigate to={homeRoute} replace />;
  }

  return children;
}
