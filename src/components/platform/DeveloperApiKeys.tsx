// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';

interface ExtraKey {
  id: number;
  name: string;
  access: string;
  scope: string;
  expires: string;
  lastUsed: string;
  status: 'Active' | 'Cancelled';
}

// Sample data until the API keys endpoint is available
const INITIAL_KEYS: ExtraKey[] = [
  { id: 1, name: 'Reporting script', access: 'Read only', scope: 'Sales base', expires: '31 Mar 2027', lastUsed: '2 hours ago', status: 'Active' },
  { id: 2, name: 'CI import job', access: 'Read & write', scope: 'Orders table', expires: '15 Jan 2027', lastUsed: 'Yesterday', status: 'Active' },
  { id: 3, name: 'Old webhook', access: 'Read & write', scope: 'Whole workspace', expires: '—', lastUsed: '12 Sep 2026', status: 'Cancelled' },
];

const ACCESS_OPTIONS = ['Read only', 'Read & write'];
const SCOPE_OPTIONS = ['Whole workspace', 'Sales base', 'Orders table'];
const EXPIRY_OPTIONS = ['In 30 days', 'In 90 days', 'In 1 year', 'Never'];

const FIELD_CLASS = 'h-9 w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-card)] px-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-green-600';
const OUTLINE_BTN = 'h-8 px-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 text-sm text-gray-700 transition-colors cursor-pointer';

const PUBLIC_KEY = 'pk_live_7d2a8c41e09b…3f9a';
const SECRET_KEY = 'sk_live_••••••••••••••••';

const KeyCard: React.FC<{
  title: string;
  badge: string;
  badgeClass: string;
  value: string;
  note: string;
  actions: React.ReactNode;
}> = ({ title, badge, badgeClass, value, note, actions }) => (
  <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] p-4 space-y-3">
    <div className="flex items-center justify-between gap-2">
      <h4 className="text-sm font-semibold text-primary">{title}</h4>
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}>{badge}</span>
    </div>
    <div className="rounded-lg border border-[var(--color-border-primary)] bg-gray-50 px-3 py-2 font-mono text-xs text-primary truncate">{value}</div>
    <p className="text-xs text-secondary">{note}</p>
    <div className="flex gap-2">{actions}</div>
  </div>
);

export const DeveloperApiKeys: React.FC = () => {
  const [keys, setKeys] = useState<ExtraKey[]>(INITIAL_KEYS);
  const [name, setName] = useState('');
  const [access, setAccess] = useState(ACCESS_OPTIONS[0]);
  const [scope, setScope] = useState(SCOPE_OPTIONS[1]);
  const [expiry, setExpiry] = useState(EXPIRY_OPTIONS[1]);
  const [limit, setLimit] = useState('600');
  const [copied, setCopied] = useState(false);

  const copyPublic = () => {
    navigator.clipboard?.writeText(PUBLIC_KEY).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const cancelKey = (id: number) =>
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: 'Cancelled' } : k)));

  const createKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setKeys((prev) => [
      ...prev,
      { id: Date.now(), name: name.trim(), access, scope, expires: expiry === 'Never' ? '—' : expiry, lastUsed: 'Never', status: 'Active' },
    ]);
    setName('');
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-primary">API keys</h3>
          <p className="text-sm text-secondary">Keys let apps and servers connect to this workspace without a password.</p>
        </div>
        <span className="badge-gray rounded-full px-2 py-0.5 text-[11px] font-medium">Sample data</span>
      </div>

      {/* Public and secret key */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <KeyCard
          title="Public key"
          badge="Safe in your app"
          badgeClass="bg-green-100 text-green-700"
          value={PUBLIC_KEY}
          note="Lets app users sign up and log in. Data access follows your access rules."
          actions={
            <>
              <button type="button" onClick={copyPublic} className={OUTLINE_BTN}>{copied ? 'Copied' : 'Copy'}</button>
              <button type="button" className={OUTLINE_BTN}>Replace</button>
            </>
          }
        />
        <KeyCard
          title="Secret key"
          badge="Server only"
          badgeClass="bg-orange-100 text-orange-700"
          value={SECRET_KEY}
          note="Full access, ignores access rules. Never put it in a website or mobile app. It was shown once when created."
          actions={<button type="button" className={OUTLINE_BTN}>Replace</button>}
        />
      </div>

      {/* Additional keys */}
      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] overflow-x-auto">
        <h4 className="px-4 pt-4 pb-2 text-sm font-semibold text-primary">Additional keys</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-secondary border-b">
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Access</th>
              <th className="px-4 py-2.5">Scope</th>
              <th className="px-4 py-2.5">Expires</th>
              <th className="px-4 py-2.5">Last used</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} className="border-b last:border-b-0">
                <td className="px-4 py-2.5 text-orange-700 whitespace-nowrap">{k.name}</td>
                <td className="px-4 py-2.5 text-primary whitespace-nowrap">{k.access}</td>
                <td className="px-4 py-2.5 text-primary whitespace-nowrap">{k.scope}</td>
                <td className="px-4 py-2.5 text-secondary whitespace-nowrap">{k.expires}</td>
                <td className="px-4 py-2.5 text-secondary whitespace-nowrap">{k.lastUsed}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${k.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {k.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {k.status === 'Active' && (
                    <button
                      type="button"
                      onClick={() => cancelKey(k.id)}
                      className="h-7 px-3 rounded-lg border border-red-300 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Cancel key
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create key */}
      <form onSubmit={createKey} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] p-4 space-y-4">
        <h4 className="text-sm font-semibold text-primary">Create key</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="space-y-1 text-xs font-medium text-secondary">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nightly report" className={FIELD_CLASS} />
          </label>
          <label className="space-y-1 text-xs font-medium text-secondary">
            Access
            <select value={access} onChange={(e) => setAccess(e.target.value)} className={FIELD_CLASS}>
              {ACCESS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-secondary">
            Scope
            <select value={scope} onChange={(e) => setScope(e.target.value)} className={FIELD_CLASS}>
              {SCOPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-secondary">
            Expires
            <select value={expiry} onChange={(e) => setExpiry(e.target.value)} className={FIELD_CLASS}>
              {EXPIRY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-secondary">
            Usage limit (requests per minute)
            <input type="number" min={1} value={limit} onChange={(e) => setLimit(e.target.value)} className={FIELD_CLASS} />
          </label>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-secondary">New keys are secret keys. You'll see the full key once, so copy it somewhere safe.</p>
          <button
            type="submit"
            disabled={!name.trim()}
            className="h-9 px-4 rounded-lg bg-green-700 hover:bg-green-800 text-sm font-medium text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            Create key
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeveloperApiKeys;
