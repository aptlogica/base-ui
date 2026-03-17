// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface PluginErrorBoundaryProps {
  children: React.ReactNode;
  pluginId: string;
  onPluginError?: (pluginId: string, error: Error) => void;
}

export const PluginErrorBoundary: React.FC<PluginErrorBoundaryProps> = ({
  children,
  pluginId,
  onPluginError
}) => {
  const handleError = (error: Error) => {
    console.error(`Error in plugin ${pluginId}:`, error);
    if (onPluginError) {
      onPluginError(pluginId, error);
    }
  };

  const fallback = (
    <div className="plugin-error">
      <h3>Plugin Error</h3>
      <p>The plugin "{pluginId}" encountered an error and could not be rendered.</p>
      <details>
        <summary>Technical Details</summary>
        <p>Check the browser console for more information.</p>
      </details>
    </div>
  );

  return (
    <ErrorBoundary 
      fallback={fallback}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
};
