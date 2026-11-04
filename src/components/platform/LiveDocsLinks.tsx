// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { ExternalLink } from 'lucide-react';

// The pages the API serves for a workspace, built from its real bases, tables and fields
export const liveDocsUrls = (baseUrl: string) => ({
  swagger: `${baseUrl}/docs`,
  redoc: `${baseUrl}/redoc`,
  spec: `${baseUrl}/openapi.json`,
});

const LINK_CLASS = 'inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 text-sm font-medium text-primary transition-colors';

// Opens the workspace's Swagger UI and ReDoc pages in a new tab
const LiveDocsLinks: React.FC<Readonly<{ baseUrl: string }>> = ({ baseUrl }) => {
  const urls = liveDocsUrls(baseUrl);
  return (
    <div className="flex flex-wrap gap-2">
      <a href={urls.swagger} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        <ExternalLink className="w-4 h-4" />
        Open Swagger UI
        <span className="font-normal text-secondary">try requests</span>
      </a>
      <a href={urls.redoc} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        <ExternalLink className="w-4 h-4" />
        Open ReDoc
        <span className="font-normal text-secondary">reference</span>
      </a>
    </div>
  );
};

export default LiveDocsLinks;
