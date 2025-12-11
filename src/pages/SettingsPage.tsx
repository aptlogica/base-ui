import React from 'react';
import { useParams } from 'react-router-dom';
import { SettingsPage } from '../components/workspace/SettingsPage';

const SettingsPageRoute: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Workspace Not Found</h1>
          <p className="text-gray-600">Please select a valid workspace.</p>
        </div>
      </div>
    );
  }

  return <SettingsPage workspaceId={workspaceId} />;
};

export default SettingsPageRoute;
