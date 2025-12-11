import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requireAll?: boolean;
}

/**
 * Wrapper component to protect routes based on user roles
 * @param requiredRoles - Array of roles required to access the route
 * @param requireAll - If true, user must have ALL roles; if false, user needs ANY role
 */
export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  requiredRoles = [],
  requireAll = false
}) => {
  const { hasAnyRole, hasAllRoles } = useUserRole();

  // If no roles required, grant access
  if (requiredRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has required roles
  const hasAccess = requireAll 
    ? hasAllRoles(requiredRoles) 
    : hasAnyRole(requiredRoles);

  if (!hasAccess) {
    return <Navigate to="/not-found" replace />;
  }

  return <>{children}</>;
};
