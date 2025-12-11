import React from 'react';
import { useAuth } from './AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
 
export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // or a spinner

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
} 