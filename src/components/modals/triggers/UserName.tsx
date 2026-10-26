// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { useUserProfile } from '../../../hooks/useApi';

// Name of the user whose ID is stored in created_by / last_modified_by
const UserName: React.FC<{ userId?: string }> = ({ userId }) => {
  const { data } = useUserProfile(userId || '');
  const profile = (data as { data?: any } | undefined)?.data;
  if (!userId) return <>-</>;
  const name = profile?.display_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.email;
  return <>{name || userId}</>;
};

export default UserName;
