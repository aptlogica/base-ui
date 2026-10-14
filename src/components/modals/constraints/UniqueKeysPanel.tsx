// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Search, Edit, Trash2, AlertCircle, AlertTriangle, Key } from 'lucide-react';
import { TablePagination } from '../../shared/table/TablePagination';
import DeleteConfirmModal from '../DeleteConfirmModal';
import UniqueKeyFormModal from './UniqueKeyFormModal';
import { useDeleteTableConstraint, useTable, useTableConstraints } from '../../../hooks/useApi';
import { useBaseAccess } from '../../../hooks/useBaseAccess';
import type { TableConstraint } from '../../../service/clientService';
import type { Column } from '../../../types/api.types';

const PAGE_SIZE = 10;

const COLUMNS = [
  { label: 'Name', width: '33%' }, { label: 'Columns', width: '45%' }, { label: 'Actions', width: '22%' },
];

// Unique constraints of a table, one row per constraint, like pgAdmin's Constraints > Unique tab
const UniqueKeysPanel: React.FC<{ table: any }> = ({ table }) => {
  const tableId: string = table?.id;
  const { data: constraints = [], isLoading, error: loadError } = useTableConstraints(tableId, 'unique');
  const deleteConstraint = useDeleteTableConstraint();
  const { canUpdateTable, isBaseReadOnly } = useBaseAccess(table?.base_id);
  const canEdit = canUpdateTable() && !isBaseReadOnly();

  // All columns of the table come with the table itself, as in the grid
  const { data: tableData } = useTable(tableId);
  const columns = (((tableData as { data?: { columns?: Column[] } } | undefined)?.data?.columns || []) as Column[])
    .filter(c => !c.deleted)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  // Popups on top of the list: the add/edit form (item unset when adding) and the delete confirmation
  const [form, setForm] = useState<{ item?: TableConstraint } | null>(null);
  const [deleteItem, setDeleteItem] = useState<TableConstraint | null>(null);

  const columnTitles = (item: TableConstraint): string[] => item.columns.map(c => c.title);

  const query = search.trim().toLowerCase();
  const items = constraints.filter(item =>
    !query || [item.title, item.constraint_name, ...columnTitles(item)].some(text => text?.toLowerCase().includes(query)));

  // Kept in range when entries are deleted or filtered out
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const confirmDelete = async () => {
    if (!deleteItem) return;
    const item = deleteItem;
    setDeleteItem(null);
    setError('');
    try {
      await deleteConstraint.mutateAsync({ id: item.id, tableId });
    } catch (err: any) {
      setError(err?.message || 'Failed to delete');
    }
  };

  const addButton = canEdit && (
    <button
      type="button"
      onClick={() => setForm({})}
      className="px-4 h-10 rounded-xl btn-primary text-primary text-sm font-medium transition-all flex items-center gap-2 flex-shrink-0"
    >
      <Plus className="w-4 h-4" />
      Add unique key
    </button>
  );

  const renderBody = () => {
    if (isLoading) {
      return <tr><td colSpan={COLUMNS.length} className="px-6 py-12 text-center text-sm text-gray-500">Loading…</td></tr>;
    }
    if (loadError) {
      return (
        <tr>
          <td colSpan={COLUMNS.length} className="px-6 py-12 text-center text-sm text-red-600">
            Couldn't load unique keys. {(loadError as any)?.message || ''}
          </td>
        </tr>
      );
    }
    if (items.length === 0) {
      return (
        <tr>
          <td colSpan={COLUMNS.length} className="px-6 py-12 text-center">
            {query ? (
              <p className="text-sm text-gray-500">No unique keys match "{search.trim()}"</p>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Key size={32} className="icon-primary p-1.5 rounded-xl bg-primary/10" />
                <p className="text-sm text-gray-500">No unique keys yet. Add one to stop duplicate values.</p>
                {addButton}
              </div>
            )}
          </td>
        </tr>
      );
    }
    return pageItems.map(item => (
      <tr key={item.id} className="bg-card hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm text-primary break-words" title={`${item.constraint_name} in Postgres`}>{item.title}</span>
            {item.status === 'missing' && (
              <span title="This key no longer exists in the database">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-1">
            {columnTitles(item).map((name, index) => (
              <React.Fragment key={`${name}-${index}`}>
                {index > 0 && <span className="text-xs text-gray-400" aria-hidden>+</span>}
                <span className="px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-800 text-sm whitespace-nowrap">{name}</span>
              </React.Fragment>
            ))}
          </div>
        </td>
        <td className="px-4 py-3">
          {/* Same actions as the triggers list */}
          {canEdit ? (
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                aria-label={`Edit ${item.title}`}
                onClick={() => setForm({ item })}
                className="h-8 px-2 rounded-xl hover:bg-gray-100 flex items-center gap-1.5 text-sm text-gray-700 flex-shrink-0"
              >
                <Edit className="w-4 h-4 text-secondary" />
                Edit
              </button>
              <button
                type="button"
                aria-label={`Delete ${item.title}`}
                onClick={() => setDeleteItem(item)}
                disabled={deleteConstraint.isPending}
                className="h-8 px-2 rounded-xl hover:bg-gray-100 flex items-center gap-1.5 text-sm text-red-600 flex-shrink-0 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400">-</p>
          )}
        </td>
      </tr>
    ));
  };

  return (
    <div //NOSONAR
      className="h-full flex flex-col relative overflow-hidden"
      // Escape from the form or delete popups closes only that popup, not the settings popup
      onKeyDown={e => e.key === 'Escape' && (form || deleteItem) && e.stopPropagation()}
    >
      <div className="px-4 pt-4 flex-shrink-0">
        <h3 className="text-base font-semibold text-primary">Unique Keys</h3>
        <p className="text-sm text-secondary">Stop duplicate values. A key can cover one column, or several columns together.</p>
      </div>

      {/* Search + add */}
      <div className="flex items-center justify-between gap-3 p-4 flex-shrink-0">
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search unique keys"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs pl-9 pr-4 py-2 h-10 border rounded-lg text-primary focus:border-primary placeholder:text-gray-400 bg-background outline-none transition-all"
          />
        </div>
        {addButton}
      </div>

      {error && (
        <div className="mx-4 mb-3 text-sm text-red-600 flex items-center gap-1 flex-shrink-0">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* List: same box as the triggers list, filling the panel */}
      <div className="flex-1 min-h-0 flex flex-col mx-4 mb-4 border rounded-xl overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                {COLUMNS.map(({ label, width }, index) => (
                  <th
                    key={label}
                    style={{ width }}
                    className={`px-4 py-3 text-xs text-gray-700 font-semibold whitespace-nowrap ${index < 2 ? 'text-left' : 'text-center'}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">{renderBody()}</tbody>
          </table>
        </div>
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {form && ReactDOM.createPortal(
        <UniqueKeyFormModal
          key={form.item?.id || 'new'}
          table={table}
          columns={columns}
          item={form.item && (constraints.find(c => c.id === form.item?.id) ?? form.item)}
          onClose={() => setForm(null)}
        />,
        document.body
      )}

      {deleteItem && ReactDOM.createPortal(
        <DeleteConfirmModal
          isOpen
          title="Delete unique key"
          message={`Delete "${deleteItem.title}"? It is dropped from the table, so records may repeat values in ${columnTitles(deleteItem).join(', ')} again.`}
          onClose={() => setDeleteItem(null)}
          onConfirm={confirmDelete}
        />,
        document.body
      )}
    </div>
  );
};

export default UniqueKeysPanel;
