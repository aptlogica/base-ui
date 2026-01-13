import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requireAll?: boolean;
  fallbackPath?: string;
}

export function RoleBasedRoute({ 
  children, 
  requiredRoles = [], 
  requireAll = false,
  fallbackPath = '/not-found' 
}: Readonly<RoleBasedRouteProps>) {
  const { hasRole } = useUserRole();

  // If no roles required, always render children
  if (!requiredRoles || requiredRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has access based on requireAll flag
  const hasAccess = requireAll
    ? requiredRoles.every(role => hasRole(role)) // User must have ALL required roles
    : requiredRoles.some(role => hasRole(role));  // User must have ANY required role

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}