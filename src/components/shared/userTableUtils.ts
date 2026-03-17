// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
export const getAvatarColor = (userId: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-cyan-500'
  ];

  const hash = userId.split('').reduce((acc, char) => acc + (char.codePointAt(0) || 0), 0);
  return colors[hash % colors.length];
};

export const formatCreatedDate = (createdTime?: string): string => {
  if (!createdTime) return '-';

  try {
    const date = new Date(createdTime);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '-';
  }
};

export const formatRelativeLastActive = (
  lastActiveAt?: string,
  lastLoginAt?: string,
  activityUpdatedAt?: string
): string => {
  const dateStr = activityUpdatedAt || lastActiveAt || lastLoginAt;
  if (!dateStr || dateStr === '0001-01-01T00:00:00Z') {
    return '-';
  }

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  } catch {
    return '-';
  }
};

export const getRolePillStyle = (role: string): string => {
  const roleLower = role.toLowerCase();
  if (roleLower.includes('owner')) {
    return 'bg-green-100 text-green-700 border border-green-200';
  }
  if (roleLower.includes('co-owner')) {
    return 'bg-green-50 text-green-600 border border-green-200';
  }
  if (roleLower.includes('workspace maintainer')) {
    return 'bg-purple-100 text-purple-700 border border-purple-200';
  }
  if (roleLower.includes('workspace read only')) {
    return 'bg-orange-100 text-orange-700 border border-orange-200';
  }
  if (roleLower.includes('base member')) {
    return 'bg-red-100 text-red-700 border border-red-200';
  }
  if (roleLower.includes('base read only')) {
    return 'bg-gray-100 text-gray-700 border border';
  }
  return 'bg-gray-100 text-gray-700 border border';
};
