// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { X, Settings, Zap, KeyRound, Key, ShieldCheck } from 'lucide-react';
import TableTriggersModal from './TableTriggersModal';

interface TableSettingsModalProps {
  table: any;
  onClose: () => void;
}

type Section = 'primaryKey' | 'uniqueKey' | 'checkConstraints' | 'triggers' | 'webhooks';

// Sections of the left panel
const SECTIONS: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: 'primaryKey', label: 'Primary Key', icon: KeyRound },
  { key: 'uniqueKey', label: 'Unique Key', icon: Key },
  { key: 'checkConstraints', label: 'Check Constraints', icon: ShieldCheck },
  { key: 'triggers', label: 'Triggers & Functions', icon: Zap },
  // Webhooks hidden for now; to show again, restore this entry and the Webhook icon import
  // { key: 'webhooks', label: 'Webhooks', icon: Webhook },
];

// Table settings: sections on the left, the selected section's content on the right
const TableSettingsModal: React.FC<TableSettingsModalProps> = ({ table, onClose }) => {
  const tableTitle: string = table?.title || table?.name || '';
  const [section, setSection] = useState<Section>('triggers');

  return (
    <div //NOSONAR
      className="bg-modal-backdrop relative"
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      <button type="button" aria-label="Close modal" className="absolute inset-0" onClick={onClose} />
      <div className="bg-modal !p-0 flex flex-col relative overflow-hidden h-[760px] !max-h-[92vh] !max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <Settings className="text-green-600 h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">{tableTitle} - Settings</h2>
              <p className="text-sm text-secondary truncate">Manage automations for this table</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="text-[var(--text-color-tertiary)] h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex">
          {/* Left panel: sections */}
          <nav className="w-[220px] flex-shrink-0 border-r bg-gray-50 p-2 space-y-1 overflow-y-auto" aria-label="Settings sections">
            {SECTIONS.map(({ key, label, icon: Icon }) => {
              const isActive = section === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSection(key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors duration-200 ${isActive ? 'bg-card shadow-xs font-medium text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-green-600" />}
                  <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="flex-1 truncate">{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right panel: the selected section; remounts on switch so search and page reset */}
          <div className="flex-1 min-w-0">
            {(section === 'triggers' || section === 'webhooks') && (
              <TableTriggersModal key={section} embedded table={table} view={section} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableSettingsModal;
