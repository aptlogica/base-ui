// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
export const ROLES = {
  Owner: "owner",
  CoOwner: "co-owner",
  WorkspaceMaintainer: "maintainer",
  WorkspaceMaintainerRO: "workspace-read",
  Base: "base",
  BaseMember: "base-member",
  BaseMemberReadOnly: "base-read",
  NoAccess: "user",
} as const;

export type RoleValue = typeof ROLES[keyof typeof ROLES];

// Display labels for UI
export const ROLE_LABELS: Record<RoleValue, string> = {
  [ROLES.Owner]: "Owner",
  [ROLES.CoOwner]: "Co-owner",
  [ROLES.WorkspaceMaintainer]: "Workspace Maintainer",
  [ROLES.WorkspaceMaintainerRO]: "Workspace Read Only",
  [ROLES.Base]: "Base Access",
  [ROLES.BaseMember]: "Base Member",
  [ROLES.BaseMemberReadOnly]: "Base Read Only",
  [ROLES.NoAccess]: "No Access",
};

// Helper to get display label
export const getRoleLabel = (role: string): string => {
  return ROLE_LABELS[role as RoleValue] || role;
};

