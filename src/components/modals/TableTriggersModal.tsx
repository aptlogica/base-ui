// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useMemo, useState } from 'react';
import { X, Zap, Webhook, Braces, Trash2, AlertCircle, Plus, ChevronDown } from 'lucide-react';
import Tabs from '../common/Tabs';
import { MultiLineText } from '../common/Fields/MultiLineText';
import { useAutomations, useAllAutomations, useBaseTables, useCreateAutomation, useDeleteAutomation } from '../../hooks/useApi';

type AutomationType = 'trigger' | 'webhook' | 'function';

interface TableTriggersModalProps {
  table: any;
  onClose: () => void;
}

const TAB_CONFIG: Record<AutomationType, {
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  queryLabel: string;
  titlePlaceholder: string;
  helperText: string;
}> = {
  trigger: {
    label: 'Triggers',
    icon: Zap,
    queryLabel: 'Trigger query',
    titlePlaceholder: 'e.g. Log salary changes',
    helperText: 'One CREATE TRIGGER on this table. It can call a function from the Functions tab, or define its own CREATE FUNCTION first.',
  },
  webhook: {
    label: 'Webhooks',
    icon: Webhook,
    queryLabel: 'Webhook context',
    titlePlaceholder: 'e.g. Notify CRM',
    helperText: 'Stored with the table. Webhook delivery is not active yet.',
  },
  function: {
    label: 'Functions',
    icon: Braces,
    queryLabel: 'Function query',
    titlePlaceholder: 'e.g. Set default status',
    helperText: 'One CREATE FUNCTION name() RETURNS trigger. Use it from any trigger with EXECUTE FUNCTION name().',
  },
};

const placeholderFor = (type: AutomationType, alias: string): string => {
  switch (type) {
    case 'trigger':
      return `CREATE TRIGGER my_trigger\nAFTER INSERT ON "public"."${alias}"\nFOR EACH ROW EXECUTE FUNCTION my_function();`;
    case 'function':
      return `CREATE OR REPLACE FUNCTION my_function()\nRETURNS trigger AS $$\nBEGIN\n  -- your logic, e.g. NEW.status := 'new';\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;`;
    default:
      return '{"url": "https://example.com/webhook"}';
  }
};

// Fallback name for entries saved without a title: the trigger or function name
const nameFromContext = (context: string): string => {
  const trigger = /CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+"?(\w+)"?/i.exec(context);
  if (trigger) return trigger[1];
  const fn = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:"?\w+"?\.)?"?(\w+)"?/i.exec(context);
  return fn ? fn[1] : context.split('\n')[0];
};

const TableTriggersModal: React.FC<TableTriggersModalProps> = ({ table, onClose }) => {
  const tableId: string = table?.id;
  const alias: string = table?.alias || 'table_name';
  // "table" = this table only; "all" = every table of this base (view and delete only)
  const [scope, setScope] = useState<'table' | 'all'>('table');
  const showAll = scope === 'all';
  const { data: tableAutomations = [], isLoading: tableLoading } = useAutomations(tableId);
  const { data: allAutomations = [], isLoading: allLoading } = useAllAutomations(showAll);
  const { data: baseTablesData } = useBaseTables(table?.base_id || '');

  // Table id -> title, for the tables of this base
  const baseTableTitles = useMemo(() => {
    const raw: any = baseTablesData;
    const list: any[] = Array.isArray(raw) ? raw : raw?.data || [];
    // Each entry is { model: { id, title, ... }, ... }; fall back to a plain table object
    return new Map<string, string>(list.map(t => {
      const m = t?.model ?? t;
      return [String(m?.id), m?.title || m?.name || ''];
    }));
  }, [baseTablesData]);

  const automations = showAll
    ? allAutomations.filter(a => baseTableTitles.has(a.model_id))
    : tableAutomations;
  const isLoading = showAll ? allLoading : tableLoading;
  const createAutomation = useCreateAutomation();
  const deleteAutomation = useDeleteAutomation();

  const [activeTab, setActiveTab] = useState<AutomationType>('trigger');
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [showForm, setShowForm] = useState(false);
  // undefined = nothing chosen yet, so the first entry is open; null = all collapsed
  const [expandedId, setExpandedId] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState('');

  const tab = TAB_CONFIG[activeTab];
  const items = automations.filter(a => a.type === activeTab);
  const countOf = (type: AutomationType) => automations.filter(a => a.type === type).length;

  // With nothing saved in this tab yet, go straight to the add form
  const isEmpty = !isLoading && items.length === 0;
  const formOpen = !showAll && (showForm || isEmpty);
  const openId = expandedId === undefined ? items[0]?.id : expandedId;

  const resetForm = () => {
    setTitle('');
    setContext('');
    setError('');
  };

  const changeScope = (next: 'table' | 'all') => {
    setScope(next);
    setShowForm(false);
    setExpandedId(undefined);
    resetForm();
  };

  const changeTab = (key: string) => {
    setActiveTab(key as AutomationType);
    setShowForm(false);
    setExpandedId(undefined);
    resetForm();
  };

  const openForm = () => {
    resetForm();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!context.trim()) {
      setError(`${tab.queryLabel} is required`);
      return;
    }
    setError('');
    try {
      await createAutomation.mutateAsync({ model_id: tableId, title: title.trim(), type: activeTab, context: context.trim() });
      closeForm();
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id: string, ownerTableId: string) => {
    setError('');
    try {
      await deleteAutomation.mutateAsync({ id, tableId: ownerTableId });
    } catch (err: any) {
      setError(err?.message || 'Failed to delete');
    }
  };

  const TabIcon = tab.icon;

  return (
    <div //NOSONAR
      className="bg-modal-backdrop relative"
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      <button type="button" aria-label="Close modal" className="absolute inset-0" onClick={onClose} />
      <div className="bg-modal !p-0 flex flex-col relative overflow-hidden h-[640px] !max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="text-green-600 h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">Triggers & Webhooks</h2>
              <p className="text-sm text-secondary truncate">Add a trigger, webhook or function to "{table?.title || table?.name}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="text-[var(--text-color-tertiary)] h-5 w-5" />
          </button>
        </div>

        {/* Tabs + scope switch */}
        <div className="flex items-center border-b flex-shrink-0 pr-4">
          <Tabs
            className="!px-4 !border-b-0 flex-1 min-w-0"
            activeKey={activeTab}
            onChange={changeTab}
            tabs={(Object.keys(TAB_CONFIG) as AutomationType[]).map(type => {
              const Icon = TAB_CONFIG[type].icon;
              return { key: type, label: TAB_CONFIG[type].label, icon: <Icon className="w-4 h-4" />, count: countOf(type) };
            })}
          />
          <div className="flex items-center border border-[var(--color-border-primary)] rounded-xl p-0.5 flex-shrink-0" role="group" aria-label="Show">
            {([['table', 'This table'], ['all', 'All tables']] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => changeScope(value)}
                aria-pressed={scope === value}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${scope === value ? 'bg-[var(--color-bg-brand-primary)] text-black' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover-bg)] hover:text-[var(--color-text-primary)]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-4 space-y-4">
            {isLoading && <p className="text-sm text-secondary">Loading…</p>}
            {showAll && isEmpty && (
              <p className="text-sm text-secondary text-center py-8">No {tab.label.toLowerCase()} in any table of this base yet.</p>
            )}

            {/* Saved entries of this tab (accordion) */}
            {items.length > 0 && (
              <div className="space-y-2">
                {items.map(item => {
                  const expanded = openId === item.id;
                  const displayTitle = item.title || nameFromContext(item.context);
                  return (
                    <div key={item.id} className="border bg-[var(--color-utility-bg)] rounded-xl">
                      <div className="flex items-center gap-2 p-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : item.id)}
                          aria-expanded={expanded}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                          <TabIcon size={24} className="icon-primary p-1.5 rounded-xl bg-primary/10 flex-shrink-0" />
                          <span className="text-sm font-medium text-primary truncate">{displayTitle}</span>
                          {showAll && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs flex-shrink-0 max-w-[40%] truncate">
                              {baseTableTitles.get(item.model_id) || 'Unknown table'}
                            </span>
                          )}
                          <ChevronDown className={`w-4 h-4 text-secondary ml-auto flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${displayTitle}`}
                          onClick={() => handleDelete(item.id, item.model_id)}
                          disabled={deleteAutomation.isPending}
                          className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                      {expanded && (
                        <pre className="text-xs text-secondary font-mono whitespace-pre-wrap break-all border-t px-3 py-3">{item.context}</pre>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add form for this tab */}
            {formOpen && (
              <div className="border rounded-xl p-4 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="automationTitle" className="field-component-label !text-primary">
                    Title <span className="field-component-required">*</span>
                  </label>
                  <input
                    id="automationTitle"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={tab.titlePlaceholder}
                    maxLength={50}
                    autoFocus
                    className="field-component field-component-border field-component-focus border"
                  />
                  <p className="text-xs text-gray-500">{title.length}/50 characters</p>
                </div>

                <MultiLineText
                  key={activeTab}
                  label={tab.queryLabel}
                  value={context}
                  onChange={value => setContext(value)}
                  placeholder={placeholderFor(activeTab, alias)}
                  rows={10}
                  maxLength={5000}
                  isBorder={true}
                  required
                  className="font-mono !text-xs"
                  helperText={tab.helperText}
                />
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed at Bottom */}
        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
          {showAll ? (
            <button
              type="button"
              onClick={onClose}
              className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all text-gray-700"
            >
              Close
            </button>
          ) : formOpen ? (
            <>
              <button
                type="button"
                onClick={isEmpty ? onClose : closeForm}
                disabled={createAutomation.isPending}
                className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={createAutomation.isPending || !title.trim() || !context.trim()}
                className="px-16 py-2 rounded-xl btn-primary text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createAutomation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all text-gray-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={openForm}
                className="px-10 py-2 rounded-xl btn-primary text-primary font-medium transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add {activeTab}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableTriggersModal;
