// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { BookOpen, Check, ChevronRight, Copy, FileJson, Hash, Info, Layers, Loader2, Play, ShieldCheck } from 'lucide-react';
import { useToast } from '../common/Toast';
import { apiErrorMessage } from '../../utils/apiErrors';
import { formatDate } from '../../utils/dateUtils';
import { getApiOrigin, type BaseApiStatus } from '../../service/clientService';
import { useBaseApi, useEnableBaseApi, useUpdateBaseApiSettings } from './useBaseApi';
import LiveDocsLinks, { liveDocsUrls } from './LiveDocsLinks';
import { WarningNote } from './docs/ApiDocsBlocks';

interface DeveloperOverviewProps {
  baseId: string | null;
  baseName: string;
  // Only owner and co-owner may turn the API on
  canEnable: boolean;
  onCancel: () => void;
  // Opens the API docs page
  onOpenDocs?: () => void;
}

// What turning the API on does today; keys, app login and rules come in later stages
const ENABLE_CHECKLIST = [
  'Your base gets a permanent API address (bs_…) that never changes.',
  'Every call starts from this address, with tables at /tables. Other bases are not reachable from it.',
  'API keys, app login and access rules are set up in the next steps.',
  'Base management (creating tables and columns through the API) stays off until you switch it on here.',
];

const CANCEL_BUTTON_CLASS = 'px-6 py-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700';
const COPY_BUTTON_CLASS = 'shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-card)] text-[var(--text-color-tertiary)] hover:text-[var(--text-color-primary)]';

// A read-only value with a copy button that shows a tick for a moment
const CopyField: React.FC<Readonly<{ label: string; value: string; hideLabel?: boolean }>> = ({ label, value, hideLabel }) => {
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
      {!hideLabel && <div className="text-sm font-medium text-primary">{label}</div>}
      <div className="flex items-center gap-2 rounded-xl border bg-gray-50 px-3 py-2">
        <code className="flex-1 min-w-0 font-mono text-sm text-primary truncate">{value}</code>
        <button type="button" onClick={handleCopy} aria-label={`Copy ${label}`} className={COPY_BUTTON_CLASS}>
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

// A card of the overview: a tinted icon tile, a title and content
const CARD_TONES = {
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
} as const;

const InfoCard: React.FC<Readonly<{ icon: React.ElementType; tone: keyof typeof CARD_TONES; title: string; badge?: string; description?: string; children?: React.ReactNode }>> = ({ icon: Icon, tone, title, badge, description, children }) => (
  <div className="rounded-xl border bg-card p-4 flex gap-3 min-w-0 shadow-xs">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${CARD_TONES[tone]}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-base font-semibold text-primary">{title}</div>
        {badge && <span className="badge-brand rounded-full px-2 py-0.5 text-xs font-medium">{badge}</span>}
      </div>
      {description && <p className="text-sm text-secondary">{description}</p>}
      {children}
    </div>
  </div>
);

// The base management switch: lets developers create, change and delete tables, columns, constraints and the
// primary key through the API. Off by default; only owners and co-owners can change it.
export const BaseManagementSwitch: React.FC<Readonly<{ baseId: string | null; status: BaseApiStatus; canChange: boolean; onOpenDocs?: () => void }>> = ({ baseId, status, canChange, onOpenDocs }) => {
  const toast = useToast();
  const update = useUpdateBaseApiSettings();
  const on = status.settings?.base_management.enabled ?? false;

  const toggle = async () => {
    if (!baseId) return;
    try {
      await update.mutateAsync({ baseId, enabled: !on });
      toast.success(on ? 'Base management is off.' : 'Base management is on.', { title: 'Base management' });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not change base management. Please try again.'), { title: 'Change failed' });
    }
  };

  return (
    <div className="rounded-xl border border-green-200 bg-green-50/50 overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${CARD_TONES.green}`}>
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-primary">Base management API</div>
          <p className="mt-1 text-sm text-secondary">
            Create, update and delete tables, columns and constraints using the management API.
            {on && status.settings?.base_management.enabled_at && ` On since ${formatDate(status.settings.base_management.enabled_at)}.`}
          </p>
          {!canChange && <p className="mt-1 text-xs text-secondary">Only base owners and co-owners can change this.</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Base management API"
          onClick={toggle}
          disabled={!canChange || !baseId || update.isPending}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${on ? 'bg-green-600' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>
      {onOpenDocs && (
        <button
          type="button"
          onClick={onOpenDocs}
          className="w-full flex items-center gap-3 px-4 py-3 border-t border-green-200 bg-green-50 text-sm text-green-800 hover:bg-green-100 transition-colors text-left"
        >
          <Info className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">Read the API docs: every endpoint with request and response examples.</span>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        </button>
      )}
    </div>
  );
};

const EnabledApi: React.FC<Readonly<{ status: BaseApiStatus; baseId: string | null; baseName: string; canChange: boolean; onOpenDocs?: () => void }>> = ({ status, baseId, baseName, canChange, onOpenDocs }) => {
  const baseUrl = `${getApiOrigin()}${status.base_path ?? ''}`;
  return (
    <div className="p-6 space-y-4">
      <InfoCard icon={Layers} tone="green" title="Base API" badge="Enabled" description={`${baseName}'s API address. It stays the same, even if you rename the base.${status.enabled_at ? ` Enabled on ${formatDate(status.enabled_at)}.` : ''}`}>
        <CopyField label="Base URL" value={baseUrl} />
      </InfoCard>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InfoCard icon={Hash} tone="blue" title="Base API ID">
          <CopyField label="Base API ID" value={status.public_id ?? ''} hideLabel />
        </InfoCard>
        <InfoCard icon={Play} tone="purple" title="Try it: list this base's tables">
          <CopyField label="Try it: list this base's tables" value={`curl ${baseUrl}/tables`} hideLabel />
        </InfoCard>
        <InfoCard icon={BookOpen} tone="blue" title="Live docs for your base" description="Explore and test your base's tables and fields.">
          <LiveDocsLinks baseUrl={baseUrl} />
        </InfoCard>
        <InfoCard icon={FileJson} tone="green" title="OpenAPI spec" description="For Postman or code generators.">
          <CopyField label="OpenAPI spec" value={liveDocsUrls(baseUrl).spec} hideLabel />
        </InfoCard>
      </div>
      <BaseManagementSwitch baseId={baseId} status={status} canChange={canChange} onOpenDocs={onOpenDocs} />
      <WarningNote>
        Development only: there are no API keys yet, so anyone with this URL can read and change this base's
        data. The API answers only on servers started with PUBLIC_API_OPEN_ACCESS=true.
      </WarningNote>
    </div>
  );
};

// Developer > Overview: asks to turn the base API on, then shows its base API address
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
    return <EnabledApi status={status} baseId={baseId} baseName={baseName} canChange={canEnable} onOpenDocs={onOpenDocs} />;
  }

  return (
    <div className="h-full p-6">
      <div className="h-full rounded-xl bg-gray-50 border flex items-center justify-center p-6 overflow-y-auto">
        <div className="bg-card border rounded-xl shadow-lg w-full max-w-[560px] p-8">
          <h3 className="text-xl font-semibold text-primary">Enable API &amp; app login?</h3>
          <p className="mt-3 text-sm text-secondary">
            Turning this on for <span className="font-medium text-primary">{baseName}</span> gives it a fixed API
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
            <p className="mt-5 text-sm text-secondary">Only base owners and co-owners can turn this on.</p>
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
