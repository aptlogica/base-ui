// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { ROLES } from '../types/roles';

export function useUserRole() {
  const getRole = (): string | null => {
    // Single source of truth for cached role
    const role = sessionStorage.getItem('user_role');
    return role || null;
  };

  const hasRole = (role: string): boolean => {
    const userRole = getRole();
    return userRole === role;
  };

  const isOwner = (): boolean => {
    return hasRole(ROLES.Owner);
  };

  const isCoOwner = (): boolean => {
    return hasRole(ROLES.CoOwner);
  };

  const isMaintainer = (): boolean => {
    return hasRole(ROLES.WorkspaceMaintainer);
  };

  const isBaseMember = (): boolean => {
    return hasRole(ROLES.BaseMember);
  };

  const hasAdminRole = (): boolean => {
    return isOwner() || isCoOwner();
  };

  const hasFullAccessRole = (): boolean => {
    return hasAdminRole() || isMaintainer();
  };

  // Keep isAdmin for backward compatibility (maps to owner or co-owner)
  const isAdmin = (): boolean => {
    return hasAdminRole();
  };

  return {
    getRole,
    hasRole,
    isOwner,
    isCoOwner,
    isMaintainer,
    isBaseMember,
    hasAdminRole,
    hasFullAccessRole,
    isAdmin, // Backward compatibility
  };
}
