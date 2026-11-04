// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { BookOpen, Check, Copy, Loader2 } from 'lucide-react';
import { useToast } from '../common/Toast';
import { apiErrorMessage } from '../../utils/apiErrors';
import { formatDate } from '../../utils/dateUtils';
import { getApiOrigin, type WorkspaceApiStatus } from '../../service/clientService';
import { useEnableWorkspaceApi, useWorkspaceApi } from './useWorkspaceApi';

interface DeveloperOverviewProps {
  workspaceId: string | null;
  workspaceName: string;
  // Only owner and co-owner may turn the API on
  canEnable: boolean;
  onCancel: () => void;
  // Opens the API docs page
  onOpenDocs?: () => void;
}

// What turning the API on does today; keys, app login and rules come in later stages
const ENABLE_CHECKLIST = [
  'Your workspace gets a permanent API address (ws_…) that never changes.',
  'API keys, app login and access rules are set up in the next steps.',
  'Every table stays locked until you set access rules.',
];

const CANCEL_BUTTON_CLASS = 'px-6 py-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700';
const COPY_BUTTON_CLASS = 'shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-card)] text-[var(--text-color-tertiary)] hover:text-[var(--text-color-primary)]';

// A read-only value with a copy button that shows a tick for a moment
const CopyField: React.FC<Readonly<{ label: string; value: string }>> = ({ label, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available (e.g. insecure context); nothing else to do
    }
  };

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-primary">{label}</div>
      <div className="flex items-center gap-2 rounded-xl border bg-gray-50 px-3 py-2">
        <code className="flex-1 min-w-0 font-mono text-sm text-primary truncate">{value}</code>
        <button type="button" onClick={handleCopy} aria-label={`Copy ${label}`} className={COPY_BUTTON_CLASS}>
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

const EnabledApi: React.FC<Readonly<{ status: WorkspaceApiStatus; onOpenDocs?: () => void }>> = ({ status, onOpenDocs }) => (
  <div className="p-6 space-y-5 max-w-3xl">
    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-primary">Base API</h3>
        <span className="badge-brand rounded-full px-2 py-0.5 text-xs font-medium">Enabled</span>
      </div>
      <p className="mt-1 text-sm text-secondary">
        Your workspace's API address. It stays the same, even if you rename the workspace.
        {status.enabled_at && ` Enabled on ${formatDate(status.enabled_at)}.`}
      </p>
    </div>
    <CopyField label="Base URL" value={`${getApiOrigin()}${status.base_path ?? ''}`} />
    <CopyField label="Workspace API ID" value={status.public_id ?? ''} />
    <CopyField label="Try it: list this workspace's bases" value={`curl ${getApiOrigin()}${status.base_path ?? ''}/bases`} />
    {onOpenDocs && (
      <button
        type="button"
        onClick={onOpenDocs}
        className="flex items-center gap-2 text-sm font-medium text-green-700 hover:underline"
      >
        <BookOpen className="w-4 h-4" />
        Read the API docs: every endpoint with request and response examples
      </button>
    )}
    <div role="note" className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-900">
      Development only: there are no API keys yet, so anyone with this URL can read and change this workspace's
      data. The API answers only on servers started with PUBLIC_API_OPEN_ACCESS=true.
    </div>
  </div>
);

// Developer > Overview: asks to turn the workspace API on, then shows its base API address
const DeveloperOverview: React.FC<DeveloperOverviewProps> = ({ workspaceId, workspaceName, canEnable, onCancel, onOpenDocs }) => {
  const toast = useToast();
  const { data: status, isLoading, error, refetch } = useWorkspaceApi(workspaceId);
  const enableApi = useEnableWorkspaceApi();

  const handleEnable = async () => {
    if (!workspaceId) return;
    try {
      await enableApi.mutateAsync(workspaceId);
      toast.success('The workspace API is on.', { title: 'API enabled' });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not turn on the workspace API. Please try again.'), { title: 'Enable failed' });
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="p-6">
        <div role="alert" className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 flex items-center justify-between gap-3">
          <span>{apiErrorMessage(error, 'Could not load the API status for this workspace.')}</span>
          <button type="button" onClick={() => void refetch()} className="font-medium underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (status.enabled) {
    return <EnabledApi status={status} onOpenDocs={onOpenDocs} />;
  }

  return (
    <div className="h-full p-6">
      <div className="h-full rounded-xl bg-gray-50 border flex items-center justify-center p-6 overflow-y-auto">
        <div className="bg-card border rounded-xl shadow-lg w-full max-w-[560px] p-8">
          <h3 className="text-xl font-semibold text-primary">Enable API &amp; app login?</h3>
          <p className="mt-3 text-sm text-secondary">
            Turning this on for <span className="font-medium text-primary">{workspaceName}</span> gives it a fixed API
            address. Nothing in your tables is shared yet.
          </p>
          <ul className="mt-5 space-y-3">
            {ENABLE_CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-primary">
                <Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {!canEnable && (
            <p className="mt-5 text-sm text-secondary">Only workspace owners and co-owners can turn this on.</p>
          )}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button type="button" onClick={onCancel} disabled={enableApi.isPending} className={CANCEL_BUTTON_CLASS}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEnable}
              disabled={!canEnable || !workspaceId || enableApi.isPending}
              className="flex items-center gap-2 px-6 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enableApi.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Enable API &amp; app login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperOverview;
