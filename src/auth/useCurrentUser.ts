// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useAuth } from './AuthContext';

/**
 * Returns the current authenticated user object from AuthContext.
 * Usage: const user = useCurrentUser();
 */
export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}

/**
 * Helper function to get user initials from AuthContext user data
 */
export function getUserInitials(user: any): string {
  if (!user) return 'U';
  
  // Handle first_name + last_name format
  if (user.first_name && user.last_name) {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  }
  
  // Handle display_name field
  if (user.display_name && user.display_name !== 'User') {
    return user.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  
  // Fallback to email initial
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  
  return 'U';
}

/** Helper function to get user display name from AuthContext user data*/
export function getUserDisplayName(user: any): string {
  if (!user) return 'User';
  
  // Handle first_name + last_name format
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  
  // Fallback to display_name field (if it's not just 'User')
  if (user.display_name && user.display_name !== 'User') {
    return user.display_name;
  }
  
  // Fallback to email
  if (user.email && user.email !== 'user@example.com') {
    return user.email;
  }
  
  return 'User';
}
