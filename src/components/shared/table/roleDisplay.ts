// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
export const roleFilterOptions = [
  'Owner',
  'Co-owner',
  'Workspace Maintainer',
  'Workspace Read Only',
  'Base Member',
  'Base Read Only'
];

export const getAccessRoleDisplayName = (access: string): string => {
  switch (access) {
    case 'maintainer':
      return 'Workspace Maintainer';
    case 'workspace-read':
      return 'Workspace Read Only';
    case 'base-member':
      return 'Base Member';
    case 'base-read':
      return 'Base Read Only';
    default:
      return access || 'User';
  }
};
