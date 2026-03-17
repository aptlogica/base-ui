// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { useParams } from 'react-router-dom';
import { AccountSettings } from '../components/account/AccountSettings';

const AccountSettingsPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Invalid Workspace</h2>
          <p className="text-gray-600 mt-2">Workspace ID is required</p>
        </div>
      </div>
    );
  }

  return <AccountSettings workspaceId={workspaceId} />;
};

export default AccountSettingsPage;