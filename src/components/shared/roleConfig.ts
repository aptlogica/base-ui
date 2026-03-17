// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { Shield, XCircle, Star, PenTool, MessageSquare } from 'lucide-react';
import { AccessRole, RoleConfig } from './AccessRoleSelector';

export const defaultRoleConfig: Record<AccessRole, RoleConfig> = {
  'owner': {
    label: 'Owner',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: Shield,
    description: 'Has full control over all workspace bases, settings, and billing.'
  },
  'creator': {
    label: 'Creator',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: Star,
    description: 'Can create, configure, and edit all bases within the workspace.'
  },
  'editor': {
    label: 'Editor',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: PenTool,
    description: 'Can add, edit, and delete records, but cannot modify base configurations.'
  },
  'commenter': {
    label: 'Commenter',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: MessageSquare,
    description: 'Can view and comment on records, but cannot edit or delete.'
  },
  'viewer': {
    label: 'Viewer',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: Shield,
    description: 'Can view records but cannot edit, delete, or comment.'
  },
  'no-access': {
    label: 'No Access',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
    description: 'No access to workspace resources.'
  }
};

