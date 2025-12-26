import { ROLES } from '../types/roles';

/**
 * Hook to check user roles from JWT token
 * Token contains roles field (string) that we parse
 */
export function useUserRole() {
  const getRole = (): string | null => {
    // Try to get from decoded token in sessionStorage
    try {
      const tokenData = sessionStorage.getItem('user_token_data');
      if (tokenData) {
        const parsed = JSON.parse(tokenData);
        return parsed.roles || null;
      }
    } catch {}
    
    // Fallback: check if role stored directly
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

  // Keep isAdmin for backward compatibility (maps to owner)
  const isAdmin = (): boolean => {
    return isOwner();
  };

  return {
    getRole,
    hasRole,
    isOwner,
    isAdmin, // Backward compatibility
  };
}
