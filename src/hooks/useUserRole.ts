/**
 * Hook to check user roles from JWT token
 * Roles are stored in sessionStorage after login
 */
export function useUserRole() {
  const getRoles = (): string[] => {
    const roles = sessionStorage.getItem('user_roles');
    return roles ? JSON.parse(roles) : [];
  };

  const hasRole = (role: string): boolean => {
    const roles = getRoles();
    return roles.includes(role);
  };

  const hasAnyRole = (rolesArray: string[]): boolean => {
    const userRoles = getRoles();
    return rolesArray.some(role => userRoles.includes(role));
  };

  const hasAllRoles = (rolesArray: string[]): boolean => {
    const userRoles = getRoles();
    return rolesArray.every(role => userRoles.includes(role));
  };

  const isAdmin = (): boolean => {
    return hasRole('Admin');
  };

  return {
    getRoles,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin
  };
}
