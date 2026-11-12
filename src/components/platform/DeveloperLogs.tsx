// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useMemo, useState } from 'react';

interface LogEntry {
  time: string;
  caller: string;
  // Anonymous callers are shown in plain text, named callers as a link-style value
  callerKind: 'user' | 'key' | 'anonymous';
  method: string;
  path: string;
  allowed: boolean;
  why: string;
}

interface KeyUsage {
  name: string;
  count: number;
}

// Sample data until the request log endpoint is available
const SAMPLE_LOGS: LogEntry[] = [
  { time: '10:42:08', caller: 'aisha@example.com', callerKind: 'user', method: 'GET', path: '/orders', allowed: true, why: 'Customer › Orders › Read › Own rows' },
  { time: '10:41:55', caller: 'Not logged in', callerKind: 'anonymous', method: 'GET', path: '/products', allowed: true, why: 'Anonymous › Products › Read › All rows' },
  { time: '10:41:12', caller: 'Not logged in', callerKind: 'anonymous', method: 'GET', path: '/orders', allowed: false, why: 'No rule for Anonymous on Orders' },
  { time: '10:40:47', caller: 'rohan@example.com', callerKind: 'user', method: 'DELETE', path: '/orders/1077', allowed: false, why: 'Customer › Orders › Delete › No access' },
  { time: '10:39:30', caller: 'Reporting script', callerKind: 'key', method: 'GET', path: '/invoices', allowed: true, why: 'Secret key, read only, Sales base' },
  { time: '10:38:02', caller: 'CI import job', callerKind: 'key', method: 'POST', path: '/orders/bulk', allowed: true, why: 'Secret key, read & write, Orders' },
  { time: '10:36:44', caller: 'Old webhook', callerKind: 'key', method: 'GET', path: '/suppliers', allowed: false, why: 'Key was cancelled on 12 Sep 2026' },
  { time: '10:35:19', caller: 'priya@example.com', callerKind: 'user', method: 'PATCH', path: '/tickets/88', allowed: true, why: 'Manager › Support tickets › Update › All rows' },
];

const SAMPLE_USAGE: KeyUsage[] = [
  { name: 'Public key', count: 48210 },
  { name: 'Reporting script', count: 6940 },
  { name: 'CI import job', count: 1305 },
];

const TIME_RANGES = ['Last hour', 'Last 24 hours', 'Last 7 days', 'Last 30 days'];

const SELECT_CLASS = 'h-9 w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-card)] px-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-green-600';

const callerClass = (kind: LogEntry['callerKind']) =>
  kind === 'anonymous' ? 'text-primary' : kind === 'key' ? 'text-orange-700' : 'text-brand-700';

export const DeveloperLogs: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'denied'>('all');
  const [caller, setCaller] = useState('everything');
  const [range, setRange] = useState(TIME_RANGES[0]);

  const callers = useMemo(() => Array.from(new Set(SAMPLE_LOGS.map((l) => l.caller))), []);

  const rows = SAMPLE_LOGS.filter(
    (l) => (filter === 'all' || !l.allowed) && (caller === 'everything' || l.caller === caller)
  );
  const maxUsage = Math.max(...SAMPLE_USAGE.map((u) => u.count));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-primary">Logs</h3>
          <p className="text-sm text-secondary">Every request, and the rule that allowed or blocked it.</p>
        </div>
        <span className="badge-gray rounded-full px-2 py-0.5 text-[11px] font-medium">Sample data</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="inline-flex rounded-lg border border-[var(--color-border-primary)] bg-gray-50 p-0.5" role="group" aria-label="Result filter">
          {([['all', 'All requests'], ['denied', 'Denied only']] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`h-8 px-3 rounded-md text-sm transition-colors ${filter === value ? 'bg-card shadow-xs font-medium text-primary' : 'text-gray-600 hover:text-primary'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="w-56 space-y-1 text-xs font-medium text-secondary">
          Key or user
          <select value={caller} onChange={(e) => setCaller(e.target.value)} className={SELECT_CLASS}>
            <option value="everything">Everything</option>
            {callers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="w-44 space-y-1 text-xs font-medium text-secondary">
          Time
          <select value={range} onChange={(e) => setRange(e.target.value)} className={SELECT_CLASS}>
            {TIME_RANGES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Request table */}
      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-secondary border-b">
              <th className="px-4 py-2.5">Time</th>
              <th className="px-4 py-2.5">Caller</th>
              <th className="px-4 py-2.5">Request</th>
              <th className="px-4 py-2.5">Result</th>
              <th className="px-4 py-2.5">Why</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={`${l.time}-${l.path}`} className="border-b last:border-b-0">
                <td className="px-4 py-2.5 text-secondary whitespace-nowrap">{l.time}</td>
                <td className={`px-4 py-2.5 whitespace-nowrap ${callerClass(l.callerKind)}`}>{l.caller}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-primary whitespace-nowrap">{l.method} {l.path}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${l.allowed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {l.allowed ? 'Allowed' : 'Denied'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-secondary">{l.why}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-secondary">No requests match these filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Usage by key */}
      <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] p-4 space-y-3">
        <h4 className="text-sm font-semibold text-primary">Usage by key, last 7 days</h4>
        {SAMPLE_USAGE.map((u) => (
          <div key={u.name} className="flex items-center gap-4 text-sm">
            <span className="w-36 flex-shrink-0 text-orange-700">{u.name}</span>
            <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full rounded-full bg-green-700" style={{ width: `${(u.count / maxUsage) * 100}%` }} />
            </div>
            <span className="w-16 text-right text-secondary">{u.count.toLocaleString('en-US')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeveloperLogs;
