// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { BookOpen, Check, Copy, Loader2, Power } from 'lucide-react';
import { useToast } from '../common/Toast';
import { apiErrorMessage } from '../../utils/apiErrors';
import { formatDate } from '../../utils/dateUtils';
import { getApiOrigin, type BaseApiStatus } from '../../service/clientService';
import { useBaseApi, useDisableBaseApi, useEnableBaseApi } from './useBaseApi';
import LiveDocsLinks, { liveDocsUrls } from './LiveDocsLinks';
import { WarningNote } from './docs/ApiDocsBlocks';

interface DeveloperOverviewProps {
  baseId: string | null;
  baseName: string;
  // Only workspace owners and co-owners may turn the API on or off
  canEnable: boolean;
  onCancel: () => void;
  // Opens the API docs page
  onOpenDocs?: () => void;
}

// What turning the API on does today; keys, app login and rules come in later stages
const ENABLE_CHECKLIST = [
  'Your base gets a permanent API address (bs_…) that never changes.',
  'Only this base is reachable through it: its tables, fields and records.',
  'API keys, app login and access rules are set up in the next steps.',
];

const CANCEL_BUTTON_CLASS = 'px-6 py-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700';
const COPY_BUTTON_CLASS = 'shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-card)] text-[var(--text-color-tertiary)] hover:text-[var(--text-color-primary)]';
const SMALL_BUTTON_CLASS = 'flex items-center gap-1.5 h-8 px-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 text-sm text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

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

interface EnabledApiProps {
  status: BaseApiStatus;
  canDisable: boolean;
  onOpenDocs?: () => void;
}

const EnabledApi: React.FC<Readonly<EnabledApiProps>> = ({ status, canDisable, onOpenDocs }) => {
  const toast = useToast();
  const disableApi = useDisableBaseApi();
  const baseUrl = `${getApiOrigin()}${status.base_path ?? ''}`;

  const handleDisable = async () => {
    try {
      await disableApi.mutateAsync(status.base_id);
      toast.success('The base API is off. Its address is kept for when you turn it on again.', { title: 'API turned off' });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not turn off the base API. Please try again.'), { title: 'Turn off failed' });
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-primary">Base API</h3>
            <span className="badge-brand rounded-full px-2 py-0.5 text-xs font-medium">Enabled</span>
          </div>
          <p className="mt-1 text-sm text-secondary">
            Your base's API address. It stays the same, even if you rename the base.
            {status.enabled_at && ` Enabled on ${formatDate(status.enabled_at)}.`}
          </p>
        </div>
        {canDisable && (
          <button type="button" onClick={handleDisable} disabled={disableApi.isPending} className={SMALL_BUTTON_CLASS}>
            {disableApi.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
            Turn API off
          </button>
        )}
      </div>
      <CopyField label="Base URL" value={baseUrl} />
      <CopyField label="Base API ID" value={status.public_id ?? ''} />
      <CopyField label="Try it: list this base's tables" value={`curl ${baseUrl}/tables`} />
      <div className="space-y-2">
        <div className="text-sm font-medium text-primary">Live docs for your tables</div>
        <p className="text-sm text-secondary">
          Built from this base's real tables and fields, and updated within seconds when they change.
        </p>
        <LiveDocsLinks baseUrl={baseUrl} />
      </div>
      <CopyField label="OpenAPI spec (for Postman or code generators)" value={liveDocsUrls(baseUrl).spec} />
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
      <WarningNote>
        Development only: there are no API keys yet, so anyone with this URL can read and change this base's
        data. The API answers only on servers started with PUBLIC_API_OPEN_ACCESS=true.
      </WarningNote>
    </div>
  );
};

// Developer > Overview: asks to turn the base's API on, then shows its address
const DeveloperOverview: React.FC<DeveloperOverviewProps> = ({ baseId, baseName, canEnable, onCancel, onOpenDocs }) => {
  const toast = useToast();
  const { data: status, isLoading, error, refetch } = useBaseApi(baseId);
  const enableApi = useEnableBaseApi();

  const handleEnable = async () => {
    if (!baseId) return;
    try {
      await enableApi.mutateAsync(baseId);
      toast.success('The base API is on.', { title: 'API enabled' });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not turn on the base API. Please try again.'), { title: 'Enable failed' });
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
          <span>{apiErrorMessage(error, 'Could not load the API status for this base.')}</span>
          <button type="button" onClick={() => void refetch()} className="font-medium underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (status.enabled) {
    return <EnabledApi status={status} canDisable={canEnable} onOpenDocs={onOpenDocs} />;
  }

  // Turned off earlier: the address is kept, so turning it on again brings it back
  const wasOn = Boolean(status.public_id);

  return (
    <div className="h-full p-6">
      <div className="h-full rounded-xl bg-gray-50 border flex items-center justify-center p-6 overflow-y-auto">
        <div className="bg-card border rounded-xl shadow-lg w-full max-w-[560px] p-8">
          <h3 className="text-xl font-semibold text-primary">Enable API &amp; app login?</h3>
          <p className="mt-3 text-sm text-secondary">
            Turning this on for <span className="font-medium text-primary">{baseName}</span> gives it a fixed API
            address. Nothing in your tables is shared yet.
          </p>
          {wasOn && (
            <p className="mt-3 text-sm text-secondary">
              The API was turned off. Turning it on again keeps its address,{' '}
              <code className="font-mono text-primary">{status.public_id}</code>.
            </p>
          )}
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
              disabled={!canEnable || !baseId || enableApi.isPending}
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
