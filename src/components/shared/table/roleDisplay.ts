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
