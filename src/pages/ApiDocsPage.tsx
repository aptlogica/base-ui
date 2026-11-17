// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ApiDocsView from '../components/platform/docs/ApiDocsView';

// The workspace API docs on a page of their own, for direct links.
// Route: /workspace/:workspaceId/developer/api-docs
const ApiDocsPage: React.FC = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen min-w-0">
      <ApiDocsView
        workspaceId={workspaceId}
        onBack={() => navigate(workspaceId ? `/workspace/${workspaceId}` : '/workspace')}
        backLabel="Back to workspace"
      />
    </div>
  );
};

export default ApiDocsPage;
