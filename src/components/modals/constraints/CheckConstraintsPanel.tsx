// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from "react";
import ReactDOM from "react-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { TablePagination } from "../../shared/table/TablePagination";
import DeleteConfirmModal from "../DeleteConfirmModal";
import AdvancedDropdown from "../../common/dropdown/AdvancedDropdown";
import CheckConstraintFormModal from "./CheckConstraintFormModal";
import { CHECK_CATEGORIES, categoryByKey } from "./checkCategories";
import { toTitles } from "./checkSql";
import {
  useDeleteTableConstraint,
  useTable,
  useTableConstraints,
} from "../../../hooks/useApi";
import { useBaseAccess } from "../../../hooks/useBaseAccess";
import type { TableConstraint } from "../../../service/clientService";
import type { Column } from "../../../types/api.types";

const PAGE_SIZE = 10;

const COLUMNS = [
  { label: "Name", width: "22%" },
  { label: "Category", width: "17%" },
  { label: "Condition", width: "29%" },
  { label: "Fields", width: "14%" },
  { label: "Actions", width: "18%" },
];

// Check constraints of a table
const CheckConstraintsPanel: React.FC<{ table: any }> = ({ table }) => {
  const tableId: string = table?.id;
  const {
    data: constraints = [],
    isLoading,
    error: loadError,
  } = useTableConstraints(tableId, "check");
  const deleteConstraint = useDeleteTableConstraint();
  const { canUpdateTable, isBaseReadOnly } = useBaseAccess(table?.base_id);
  const canEdit = canUpdateTable() && !isBaseReadOnly();

  const { data: tableData } = useTable(tableId);
  const columns = (
    ((tableData as { data?: { columns?: Column[] } } | undefined)?.data
      ?.columns || []) as Column[]
  )
    .filter((c) => !c.deleted)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  // The schema comes with any saved constraint; before the first one the table name alone is shown
  const tableName =
    constraints[0]?.table_name || `"${table?.alias || "table"}"`;

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [form, setForm] = useState<{ item?: TableConstraint } | null>(null);
  const [deleteItem, setDeleteItem] = useState<TableConstraint | null>(null);

  const columnTitles = (item: TableConstraint): string[] =>
    item.columns.map((c) => c.title);

  // The condition as the user reads it: field titles instead of column names
  const shownCondition = (item: TableConstraint): string =>
    toTitles(item.condition || "", columns);

  const query = search.trim().toLowerCase();
  const items = constraints.filter(
    (item) =>
      (!categoryFilter || categoryByKey(item.category).key === categoryFilter) &&
      (!query ||
        [
          item.title,
          item.constraint_name,
          item.condition,
          shownCondition(item),
          ...columnTitles(item),
        ].some((text) => text?.toLowerCase().includes(query))),
  );

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const resetView = () => setPage(1);

  const confirmDelete = async () => {
    if (!deleteItem) return;
    const item = deleteItem;
    setDeleteItem(null);
    setError("");
    try {
      await deleteConstraint.mutateAsync({ id: item.id, tableId });
    } catch (err: any) {
      setError(err?.message || "Failed to delete");
    }
  };

  const addButton = canEdit && (
    <button
      type="button"
      onClick={() => setForm({})}
      className="px-4 h-10 rounded-xl btn-primary text-primary text-sm font-medium transition-all flex items-center gap-2 shrink-0"
    >
      <Plus className="w-4 h-4" />
      Add check constraint
    </button>
  );

  const renderRow = (item: TableConstraint) => {
    return (
      <tr key={item.id} className="bg-card hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-sm text-primary wrap-break-word"
              title={`${item.constraint_name} in Postgres`}
            >
              {item.title}
            </span>
            {item.status === "missing" && (
              <span title="This constraint is not in the database any more. Edit and save it to add it again, or delete it.">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700 whitespace-nowrap">
            {categoryByKey(item.category).label}
          </span>
        </td>
        <td className="px-4 py-3">
          <span
            title={shownCondition(item)}
            className="block w-full text-left text-xs font-mono text-gray-800 truncate"
          >
            {shownCondition(item)}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {columnTitles(item).map((title, index) => (
              <span
                key={`${title}-${index}`}
                className="px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-800 text-xs whitespace-nowrap"
              >
                {title}
              </span>
            ))}
          </div>
        </td>
        <td className="px-4 py-3">
          {canEdit ? (
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                aria-label={`Edit ${item.title}`}
                onClick={() => setForm({ item })}
                className="h-8 px-2 rounded-xl hover:bg-gray-100 flex items-center gap-1.5 text-sm text-gray-700 shrink-0"
              >
                <Edit className="w-4 h-4 text-secondary" />
                Edit
              </button>
              <button
                type="button"
                aria-label={`Delete ${item.title}`}
                onClick={() => setDeleteItem(item)}
                disabled={deleteConstraint.isPending}
                className="h-8 px-2 rounded-xl hover:bg-gray-100 flex items-center gap-1.5 text-sm text-red-600 shrink-0 disabled:opacity-50"
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
    );
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td
            colSpan={COLUMNS.length}
            className="px-6 py-12 text-center text-sm text-gray-500"
          >
            Loading…
          </td>
        </tr>
      );
    }
    if (loadError) {
      return (
        <tr>
          <td
            colSpan={COLUMNS.length}
            className="px-6 py-12 text-center text-sm text-red-600"
          >
            Couldn't load check constraints. {(loadError as any)?.message || ""}
          </td>
        </tr>
      );
    }
    if (items.length === 0) {
      return (
        <tr>
          <td colSpan={COLUMNS.length} className="px-6 py-12 text-center">
            {query || categoryFilter ? (
              <p className="text-sm text-gray-500">
                No check constraints match
              </p>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <ShieldCheck
                  size={32}
                  className="icon-primary p-1.5 rounded-xl bg-primary/10"
                />
                <p className="text-sm text-gray-500">
                  No check constraints yet. Add rules like "Age between 18 and
                  100".
                </p>
                {addButton}
              </div>
            )}
          </td>
        </tr>
      );
    }
    return pageItems.map(renderRow);
  };

  return (
    <div //NOSONAR
      className="h-full flex flex-col relative overflow-hidden"
      // Escape from the form or delete popups closes only that popup, not the settings popup
      onKeyDown={(e) =>
        e.key === "Escape" && (form || deleteItem) && e.stopPropagation()
      }
    >
      <div className="px-4 pt-4 shrink-0">
        <h3 className="text-base font-semibold text-primary">
          Check Constraints
        </h3>
        <p className="text-sm text-secondary">
          Conditions every record must pass. Postgres checks them on every save.
        </p>
      </div>

      {/* Search, category filter + add */}
      <div className="flex items-center justify-between gap-3 p-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative w-64 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search check constraints"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetView();
              }}
              className="w-full text-xs pl-9 pr-4 py-2 h-10 border rounded-lg text-primary focus:border-primary placeholder:text-gray-400 bg-background outline-none transition-all"
            />
          </div>
          <div className="w-52">
            <AdvancedDropdown
              options={[
                { label: "All categories", value: "" },
                ...CHECK_CATEGORIES.map((c) => ({
                  label: c.label,
                  value: c.key,
                })),
              ]}
              value={categoryFilter}
              placeholder="All categories"
              sort={false}
              onChange={(value) => {
                setCategoryFilter(String(value));
                resetView();
              }}
            />
          </div>
        </div>
        {addButton}
      </div>

      {error && (
        <div className="mx-4 mb-3 text-sm text-red-600 flex items-center gap-1 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col mx-4 mb-4 border rounded-xl overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                {COLUMNS.map(({ label, width }, index) => (
                  <th
                    key={label || index}
                    style={{ width }}
                    className={`px-4 py-3 text-xs text-gray-700 font-semibold whitespace-nowrap ${index < COLUMNS.length - 1 ? "text-left" : "text-center"}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">{renderBody()}</tbody>
          </table>
        </div>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {form &&
        ReactDOM.createPortal(
          <CheckConstraintFormModal
            key={form.item?.id || "new"}
            table={table}
            columns={columns}
            tableName={tableName}
            existingTitles={constraints
              .filter((c) => c.id !== form.item?.id)
              .map((c) => c.title)}
            item={
              form.item &&
              (constraints.find((c) => c.id === form.item?.id) ?? form.item)
            }
            onClose={() => setForm(null)}
          />,
          document.body,
        )}

      {deleteItem &&
        ReactDOM.createPortal(
          <DeleteConfirmModal
            isOpen
            title="Delete check constraint"
            message={`Delete "${deleteItem.title}"? Records will no longer be checked against it.`}
            onClose={() => setDeleteItem(null)}
            onConfirm={confirmDelete}
          />,
          document.body,
        )}
    </div>
  );
};

export default CheckConstraintsPanel;
