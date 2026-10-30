// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Settings, Zap, KeyRound, Key, ShieldCheck } from 'lucide-react';
import { useTable } from '../hooks/useApi';
import { updateClientWorkspaceAndBase } from '../service/clientService';
import { useNavigationStore } from '../stores/navigationStore';
import { Loader } from '../components/ui/Loader';
import TableTriggersModal from '../components/modals/TableTriggersModal';
import PrimaryKeyPanel from '../components/modals/tableSettings/PrimaryKeyPanel';
import UniqueKeysPanel from '../components/modals/constraints/UniqueKeysPanel';
import CheckConstraintsPanel from '../components/modals/constraints/CheckConstraintsPanel';

type Section = 'primaryKey' | 'uniqueKey' | 'checkConstraints' | 'triggers' | 'webhooks';

// Sections of the left menu; the section is part of the URL
const SECTIONS: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: 'primaryKey', label: 'Primary Key', icon: KeyRound },
  { key: 'uniqueKey', label: 'Unique Key', icon: Key },
  { key: 'checkConstraints', label: 'Check Constraints', icon: ShieldCheck },
  { key: 'triggers', label: 'Triggers & Functions', icon: Zap },
  // Webhooks hidden for now; to show again, restore this entry and the Webhook icon import
  // { key: 'webhooks', label: 'Webhooks', icon: Webhook },
];

const isSection = (value?: string): value is Section => SECTIONS.some(s => s.key === value);

// Table settings page: sections on the left, the selected section's content on the right.
// Route: /workspace/:workspaceId/base/:baseId/table/:tableId/settings/:section
const TableSettingsPage: React.FC = () => {
  const { workspaceId, baseId, tableId, section: sectionParam } = useParams();
  const navigate = useNavigate();
  // The page is outside the Layout, so it sets the workspace and base itself (also on a reload):
  // the request headers and the navigation store that the access checks read. The panels render
  // only after this, so their first requests already carry the headers.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    updateClientWorkspaceAndBase(workspaceId ?? null, baseId ?? null);
    const { setWorkspace, setBase, setTable } = useNavigationStore.getState();
    setWorkspace(workspaceId ?? null);
    setBase(baseId ?? null);
    setTable(tableId ?? null);
    setReady(true);
  }, [workspaceId, baseId, tableId]);
  const { data: response, isLoading } = useTable(ready ? tableId || '' : '');
  // The detail response keeps the table's own fields (id, title, base_id) in `model`; the panels
  // expect them on the table itself, and the URL is the fallback
  const detail = (response as { data?: any } | undefined)?.data;
  const table = detail && {
    ...detail.model,
    ...detail,
    id: detail.model?.id ?? tableId,
    base_id: detail.model?.base_id ?? baseId,
  };
  const section: Section = isSection(sectionParam) ? sectionParam : 'primaryKey';
  const tableTitle: string = table?.title || table?.name || '';

  const tablePath = `/workspace/${workspaceId}/base/${baseId}/table/${tableId}`;
  const goBack = () => {
    const viewId = table?.views?.[0]?.id;
    void navigate(viewId ? `${tablePath}/${viewId}` : `/workspace/${workspaceId}`);
  };

  if (!ready || (isLoading && !table)) {
    return (
      <div className="w-full h-[30vh] flex items-center justify-center">
        <Loader size={10} />
      </div>
    );
  }
  if (!table) return <div className="p-8 text-red-600">Table not found</div>;

  return (
    <div className="flex flex-col h-screen w-screen min-w-0 bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b shrink-0">
        <button
          type="button"
          onClick={goBack}
          className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
          aria-label="Back to table"
        >
          <ArrowLeft className="text-(--text-color-tertiary) h-5 w-5" />
        </button>
        <div className="w-10 h-10 bg-(--color-bg-brand-primary) rounded-full flex items-center justify-center shrink-0">
          <Settings className="text-green-600 h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-primary truncate">{tableTitle} - Settings</h1>
          <p className="text-sm text-secondary truncate">Manage keys, constraints and automations for this table</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Left menu: sections */}
        <nav className="flex flex-col w-[220px] shrink-0 border-r bg-gray-50 p-2 gap-y-1 overflow-y-auto" aria-label="Settings sections">
          {SECTIONS.map(({ key, label, icon: Icon }) => {
            const isActive = section === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => navigate(`${tablePath}/settings/${key}`)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors duration-200 ${isActive ? 'bg-card shadow-xs font-medium text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-green-600" />}
                <Icon className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="flex-1 truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content: remounts on switch so search and page reset */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {section === 'primaryKey' && <PrimaryKeyPanel table={table} />}
          {section === 'uniqueKey' && <UniqueKeysPanel table={table} />}
          {section === 'checkConstraints' && <CheckConstraintsPanel table={table} />}
          {(section === 'triggers' || section === 'webhooks') && (
            <TableTriggersModal key={section} embedded table={table} view={section} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TableSettingsPage;
