// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { AlertTriangle, Info, Plus } from 'lucide-react';

type Access = 'all' | 'own' | 'none';
type Action = 'read' | 'create' | 'update' | 'delete';
type Permissions = Record<string, Partial<Record<Action, Access>>>;

interface Role {
  key: string;
  name: string;
  hint: string;
  permissions: Permissions;
}

const ACTIONS: { key: Action; label: string }[] = [
  { key: 'read', label: 'Read' },
  { key: 'create', label: 'Create' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
];

const TABLES = ['Products', 'Orders', 'Invoices', 'Support tickets', 'Staff notes', 'Suppliers'];

const ACCESS_OPTIONS: { value: Access; label: string }[] = [
  { value: 'all', label: 'All rows' },
  { value: 'own', label: 'Own rows' },
  { value: 'none', label: 'No access' },
];

const ACCESS_STYLE: Record<Access, string> = {
  all: 'bg-green-800 border-green-800 text-white font-semibold',
  own: 'bg-green-50 border-green-300 text-green-900',
  none: 'bg-[var(--color-card)] border-[var(--color-border-primary)] text-gray-500',
};

// Sample data until the roles endpoint is available
const INITIAL_ROLES: Role[] = [
  { key: 'anonymous', name: 'Anonymous', hint: 'Built-in · not logged in', permissions: { Products: { read: 'all' } } },
  { key: 'authenticated', name: 'Authenticated', hint: 'Built-in · any logged-in user', permissions: { Products: { read: 'all' } } },
  {
    key: 'customer',
    name: 'Customer',
    hint: 'Default for new signups',
    permissions: {
      Products: { read: 'all' },
      Orders: { read: 'own', create: 'own', update: 'own' },
      Invoices: { read: 'own' },
      'Support tickets': { read: 'own', create: 'own', update: 'own' },
    },
  },
  {
    key: 'manager',
    name: 'Manager',
    hint: 'Staff of the app owner',
    permissions: Object.fromEntries(
      TABLES.map((t) => [t, { read: 'all', create: 'all', update: 'all', delete: 'none' }])
    ) as Permissions,
  },
];

const CARD_CLASS = 'rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)]';

export const DeveloperRolesRules: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [selectedKey, setSelectedKey] = useState('customer');

  const role = roles.find((r) => r.key === selectedKey) ?? roles[0];
  const anonymous = roles.find((r) => r.key === 'anonymous');

  const getAccess = (r: Role, table: string, action: Action): Access => r.permissions[table]?.[action] ?? 'none';

  const setAccess = (table: string, action: Action, value: Access) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.key === role.key
          ? { ...r, permissions: { ...r.permissions, [table]: { ...r.permissions[table], [action]: value } } }
          : r
      )
    );
  };

  const addRole = () => {
    const name = window.prompt('Role name')?.trim();
    if (!name) return;
    const key = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    setRoles((prev) => [...prev, { key, name, hint: 'Custom role', permissions: {} }]);
    setSelectedKey(key);
  };

  // Tables Anonymous can read: anyone with the public key can see them
  const publicTables = anonymous ? TABLES.filter((t) => getAccess(anonymous, t, 'read') !== 'none') : [];
  // Tables where the selected role uses "Own rows": they get a hidden owner field
  const ownTables = TABLES.filter((t) => ACTIONS.some((a) => getAccess(role, t, a.key) === 'own'));

  return (
    <div className="p-6 space-y-5">
      <div>
        <h3 className="text-xl font-semibold text-primary">Roles &amp; rules</h3>
        <p className="text-sm text-secondary">
          Choose a role, then decide what it can do with each table. Anything not allowed here is blocked.
        </p>
      </div>

      <div className="flex gap-4 items-start">
        {/* Roles list */}
        <aside className={`${CARD_CLASS} w-[210px] flex-shrink-0 p-3 space-y-2`} aria-label="Roles">
          <p className="text-sm font-semibold text-primary">Roles</p>
          {roles.map((r) => {
            const active = r.key === role.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setSelectedKey(r.key)}
                aria-pressed={active}
                className={`w-full text-left rounded-lg border px-3 py-2 transition-colors cursor-pointer ${active ? 'border-green-600 bg-green-50' : 'border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50'}`}
              >
                <span className="block text-sm font-medium text-primary">{r.name}</span>
                <span className="block text-xs text-secondary">{r.hint}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={addRole}
            className="w-full flex items-center justify-center gap-1 h-9 rounded-lg border border-dashed border-[var(--color-border-primary)] text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New role
          </button>
        </aside>

        {/* Permission matrix */}
        <section className={`${CARD_CLASS} flex-1 min-w-0 p-4 space-y-4`} aria-label={`What ${role.name} can do`}>
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-sm font-semibold text-primary">What {role.name} can do</h4>
            <span className="rounded-full border border-[var(--color-border-primary)] px-2 py-0.5 text-[11px] text-secondary">
              Sample data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-1.5 text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-secondary">
                  <th scope="col" className="font-medium pr-3">Table</th>
                  {ACTIONS.map((a) => (
                    <th key={a.key} scope="col" className="font-medium px-1">{a.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLES.map((table) => (
                  <tr key={table}>
                    <th scope="row" className="text-left font-medium text-primary pr-3 whitespace-nowrap">{table}</th>
                    {ACTIONS.map((a) => {
                      const value = getAccess(role, table, a.key);
                      return (
                        <td key={a.key} className="px-1">
                          <select
                            value={value}
                            onChange={(e) => setAccess(table, a.key, e.target.value as Access)}
                            aria-label={`${role.name} ${a.label} ${table}`}
                            className={`h-8 w-full min-w-[96px] rounded-lg border px-2 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-600 ${ACCESS_STYLE[value]}`}
                          >
                            {ACCESS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value} className="bg-white text-gray-900 font-normal">{o.label}</option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary" aria-label="Legend">
            <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-800" /> All rows: every record in the table</li>
            <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-200 border border-green-300" /> Own rows: only records this user created</li>
            <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-[var(--color-border-primary)]" /> No access</li>
          </ul>
        </section>
      </div>

      {publicTables.length > 0 && (
        <div role="note" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            <strong>{publicTables.join(', ')}</strong> can be read by Anonymous, so anyone with your public key can see {publicTables.length > 1 ? 'them' : 'it'}.
            That&apos;s fine for a product catalog, but check before going live.
          </p>
        </div>
      )}

      {ownTables.length > 0 && (
        <div role="note" className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Using &ldquo;Own rows&rdquo; on <strong>{ownTables.join(', ')}</strong> adds a hidden owner field.
            It&apos;s filled in automatically whenever an app user creates a record.
          </p>
        </div>
      )}
    </div>
  );
};

export default DeveloperRolesRules;
