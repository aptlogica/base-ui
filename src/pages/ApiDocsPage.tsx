// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ApiDocsView from '../components/platform/docs/ApiDocsView';

// The application API docs on a page of their own, for direct links.
// Routes: /workspace/:workspaceId/applications/:applicationId/api-docs (the examples use that application's
// address) and /workspace/:workspaceId/developer/api-docs (a sample address)
const ApiDocsPage: React.FC = () => {
  const { workspaceId, applicationId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen min-w-0">
      <ApiDocsView
        workspaceId={workspaceId}
        applicationId={applicationId}
        onBack={() => navigate(workspaceId ? `/workspace/${workspaceId}` : '/workspace')}
        backLabel="Back to workspace"
      />
    </div>
  );
};

export default ApiDocsPage;
