// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useWorkspaceAccess } from '../hooks/useWorkspaceAccess';

/**
 * Route guard that allows access based on workspace access level
 * Allows Admin users and users with full_access to the workspace
 */
export const AccessLevelRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const { canAccessSettings } = useWorkspaceAccess(workspaceId);

  if (!canAccessSettings()) {
    if (workspaceId) {
      return <Navigate to={`/workspace/${workspaceId}`} replace />;
    }
    return <Navigate to="/workspace" replace />;
  }

  return <>{children}</>;
};

