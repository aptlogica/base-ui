// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Zap, Trash2, AlertCircle, Plus, Edit, Search } from 'lucide-react';
import Tabs from '../common/Tabs';
import { TablePagination } from '../shared/table/TablePagination';
import DeleteConfirmModal from './DeleteConfirmModal';
import AutomationFormModal from './triggers/AutomationFormModal';
import UserName from './triggers/UserName';
import { useAutomations, useDeleteAutomation } from '../../hooks/useApi';
import type { Automation } from '../../service/clientService';
import {
  AutomationType, TYPE_CONFIG, displayTitle, formatDate, nameFromContext, triggerEvent,
} from './triggers/automationUtils';

interface TableTriggersModalProps {
  table: any;
  // 'triggers' shows the Triggers and Functions tabs; 'webhooks' shows only webhooks
  view: 'triggers' | 'webhooks';
  onClose: () => void;
}

const VIEW_TYPES: Record<TableTriggersModalProps['view'], AutomationType[]> = {
  triggers: ['trigger', 'function'],
  webhooks: ['webhook'],
};

// Columns of the list, per tab: the title, then (triggers and functions) the name in the query
const PAGE_SIZE = 10;

// Fixed widths, so the table always fits the popup without scrolling sideways
const COLUMNS: Record<AutomationType, { label: string; width: string }[]> = {
  trigger: [
    { label: 'Title', width: '23%' }, { label: 'Trigger', width: '21%' }, { label: 'Event', width: '15%' },
    { label: 'Created by', width: '12%' }, { label: 'Created at', width: '12%' }, { label: 'Actions', width: '17%' },
  ],
  function: [
    { label: 'Title', width: '28%' }, { label: 'Function', width: '27%' },
    { label: 'Created by', width: '14%' }, { label: 'Created at', width: '13%' }, { label: 'Actions', width: '18%' },
  ],
  webhook: [
    { label: 'Title', width: '48%' }, { label: 'Created by', width: '17%' }, { label: 'Created at', width: '16%' }, { label: 'Actions', width: '19%' },
  ],
};

const TableTriggersModal: React.FC<TableTriggersModalProps> = ({ table, view, onClose }) => {
  const tableId: string = table?.id;
  const tableTitle: string = table?.title || table?.name || '';
  const { data: automations = [], isLoading } = useAutomations(tableId);
  const deleteAutomation = useDeleteAutomation();

  const tabTypes = VIEW_TYPES[view];
  const [activeTab, setActiveTab] = useState<AutomationType>(tabTypes[0]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  // Popups on top of the list: the add/edit form and the delete confirmation
  const [form, setForm] = useState<{ type: AutomationType; item?: Automation } | null>(null);
  const [deleteItem, setDeleteItem] = useState<Automation | null>(null);

  const tab = TYPE_CONFIG[activeTab];
  const TabIcon = tab.icon;
  const countOf = (type: AutomationType) => automations.filter(a => a.type === type).length;

  const query = search.trim().toLowerCase();
  const items = automations
    .filter(a => a.type === activeTab)
    .filter(a => !query || [displayTitle(a), nameFromContext(a.context), a.context].some(text => text.toLowerCase().includes(query)));

  // Kept in range when entries are deleted or filtered out
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const changeTab = (key: string) => {
    setActiveTab(key as AutomationType);
    setSearch('');
    setPage(1);
    setError('');
  };

  // Clicking a title or Edit opens the edit form
  const openItem = (item: Automation) => setForm({ type: item.type, item });

  const confirmDelete = async () => {
    if (!deleteItem) return;
    const item = deleteItem;
    setDeleteItem(null);
    setError('');
    try {
      await deleteAutomation.mutateAsync({ id: item.id, tableId });
    } catch (err: any) {
      setError(err?.message || 'Failed to delete');
    }
  };

  const columns = COLUMNS[activeTab];

  return (
    <div //NOSONAR
      className="bg-modal-backdrop relative"
      // Escape closes the list only when no popup is open on top of it
      onKeyDown={e => e.key === 'Escape' && !form && !deleteItem && onClose()}
    >
      <button type="button" aria-label="Close modal" className="absolute inset-0" onClick={onClose} />
      <div className="bg-modal !p-0 flex flex-col relative overflow-hidden h-[680px] !max-h-[90vh] !max-w-6xl">
        {/* Header: table name - tab */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="text-green-600 h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">{tableTitle} - {tab.label}</h2>
              <p className="text-sm text-secondary truncate">{tab.description}</p>
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

        {/* Tabs (the webhooks view has only one type, so no tabs) */}
        {tabTypes.length > 1 && (
          <div className="border-b flex-shrink-0">
            <Tabs
              className="!px-4 !border-b-0"
              activeKey={activeTab}
              onChange={changeTab}
              tabs={tabTypes.map(type => {
                const Icon = TYPE_CONFIG[type].icon;
                return { key: type, label: TYPE_CONFIG[type].label, icon: <Icon className="w-4 h-4" />, count: countOf(type) };
              })}
            />
          </div>
        )}

        {/* Search + add */}
        <div className="flex items-center justify-between gap-3 p-4 flex-shrink-0">
          <div className="relative w-72 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${tab.label.toLowerCase()}`}
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs pl-9 pr-4 py-2 h-10 border rounded-lg text-primary focus:border-primary placeholder:text-gray-400 bg-background outline-none transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => setForm({ type: activeTab })}
            className="px-4 h-10 rounded-xl btn-primary text-primary text-sm font-medium transition-all flex items-center gap-2 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add {tab.singular}
          </button>
        </div>

        {error && (
          <div className="mx-4 mb-3 text-sm text-red-600 flex items-center gap-1 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Table of this tab's entries */}
        <div className="flex-1 min-h-0 flex flex-col mx-4 mb-4 border rounded-xl overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr>
                  {columns.map(({ label, width }, index) => (
                    <th
                      key={label}
                      style={{ width }}
                      className={`px-4 py-3 text-xs text-gray-700 font-semibold whitespace-nowrap ${index === 0 || label === 'Trigger' || label === 'Function' ? 'text-left' : 'text-center'}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-gray-500">Loading…</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center">
                      {query ? (
                        <p className="text-sm text-gray-500">No {tab.label.toLowerCase()} match "{search.trim()}"</p>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <TabIcon size={32} className="icon-primary p-1.5 rounded-xl bg-primary/10" />
                          <p className="text-sm text-gray-500">No {tab.label.toLowerCase()} yet</p>
                          <button
                            type="button"
                            onClick={() => setForm({ type: activeTab })}
                            className="px-4 py-2 rounded-xl btn-primary text-primary text-sm font-medium flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add {tab.singular}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  pageItems.map(item => {
                    const title = displayTitle(item);
                    return (
                      <tr key={item.id} className="bg-card hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 max-w-[240px]">
                          <button
                            type="button"
                            onClick={() => openItem(item)}
                            className="flex items-center gap-2 text-left w-full min-w-0 group"
                          >
                            <span className="text-sm font-medium text-primary truncate group-hover:underline" title={title}>{title}</span>
                          </button>
                        </td>
                        {item.type !== 'webhook' && (
                          <td className="px-4 py-3 max-w-[220px]">
                            <span className="block text-xs text-gray-600 font-mono truncate" title={nameFromContext(item.context)}>{nameFromContext(item.context)}</span>
                          </td>
                        )}
                        {item.type === 'trigger' && (
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center gap-1">
                              {triggerEvent(item.context).split(', ').map(event => (
                                <span key={event} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium whitespace-nowrap">{event}</span>
                              ))}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap text-center truncate"><UserName userId={item.created_by} /></td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap text-center">{formatDate(item.created_time)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              aria-label={`Edit ${title}`}
                              onClick={() => openItem(item)}
                              className="h-8 px-2 rounded-xl hover:bg-gray-100 flex items-center gap-1.5 text-sm text-gray-700 flex-shrink-0"
                            >
                              <Edit className="w-4 h-4 text-secondary" />
                              Edit
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${title}`}
                              onClick={() => setDeleteItem(item)}
                              disabled={deleteAutomation.isPending}
                              className="h-8 px-2 rounded-xl hover:bg-gray-100 flex items-center gap-1.5 text-sm text-red-600 flex-shrink-0 disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {form && ReactDOM.createPortal(
        <AutomationFormModal
          key={form.item?.id || `new-${form.type}`}
          type={form.type}
          table={table}
          item={form.item && (automations.find(a => a.id === form.item?.id) ?? form.item)}
          onClose={() => setForm(null)}
        />,
        document.body
      )}

      {deleteItem && ReactDOM.createPortal(
        <DeleteConfirmModal
          isOpen
          title={`Delete ${TYPE_CONFIG[deleteItem.type].singular}`}
          message={
            deleteItem.type === 'function'
              ? `Delete "${displayTitle(deleteItem)}"? The function is removed from the database. It can't be deleted while a trigger still uses it.`
              : `Delete "${displayTitle(deleteItem)}"? It is removed from the database right away.`
          }
          onClose={() => setDeleteItem(null)}
          onConfirm={confirmDelete}
        />,
        document.body
      )}
    </div>
  );
};

export default TableTriggersModal;
