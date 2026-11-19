// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, AlertCircle, ChevronDown, Database, Paperclip, Zap, Filter, Hash } from 'lucide-react';
import { getTablesByBaseIdService } from '../../service/clientService';
import { getExportDependencies, type ExportBaseOptions, type ExportDependency, type ExportFilterCondition, type ExportTableInfo } from '../../service/baseExportService';
import { getDefaultOperator, isFilterComplete } from '../../utils/filterUtils';
import { ExportTableFilterEditor } from './ExportTableFilterEditor';

interface ExportSbaseModalProps {
  isOpen: boolean;
  base: { id: string; title?: string; name?: string };
  onClose: () => void;
  onExport: (options: ExportBaseOptions) => void;
}

const KIND_LABEL: Record<ExportDependency['kind'], string> = {
  link: 'link',
  lookup: 'lookup',
  trigger: 'trigger',
};

interface MissingReference {
  tableId: string;
  tableTitle: string;
  dependsOnId: string;
  dependsOnTitle: string;
  items: ExportDependency[];
}

// What a missing table does to the items that need it: links and lookups are exported as text; triggers and functions
// are left out
const textItems = (m: MissingReference) => m.items.filter((i) => i.kind !== 'trigger');
const triggerItems = (m: MissingReference) => m.items.filter((i) => i.kind === 'trigger');

export const ExportSbaseModal: React.FC<ExportSbaseModalProps> = ({ isOpen, base, onClose, onExport }) => {
  const [tables, setTables] = useState<ExportTableInfo[]>([]);
  const [dependencies, setDependencies] = useState<ExportDependency[]>([]);
  const [selectedTableIds, setSelectedTableIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [includeData, setIncludeData] = useState(true);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [includeAutomations, setIncludeAutomations] = useState(true);
  const [includeSystemColumns, setIncludeSystemColumns] = useState(false);
  // The row filter of each table (by table id), and the table whose filter is open
  const [filters, setFilters] = useState<Record<string, ExportFilterCondition[]>>({});
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !base?.id) return;
    const controller = new AbortController();
    setLoading(true);
    setSearch('');
    setFilters({});
    setOpenFilterId(null);

    const apply = (list: ExportTableInfo[], deps: ExportDependency[]) => {
      setTables(list);
      setDependencies(deps);
      setSelectedTableIds(new Set(list.map((t) => t.id)));
    };

    // The server says which table needs which; if that call fails the dialog still works, without warnings
    getExportDependencies(base.id, controller.signal)
      .then((res) => apply(res.tables, res.dependencies))
      .catch(async (e: any) => {
        if (e?.name === 'AbortError') return;
        try {
          const res: any = await getTablesByBaseIdService(base.id);
          const raw = Array.isArray(res) ? res : res?.data || [];
          apply(
            raw
              .map((t: any) => ({ id: t.model?.id || t.id || '', title: t.model?.title || t.title || 'Untitled Table' }))
              .filter((t: ExportTableInfo) => !!t.id),
            [],
          );
        } catch {
          apply([], []);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [isOpen, base?.id]);

  // A selected table that needs a table which is not selected, one entry per pair
  const missing = useMemo<MissingReference[]>(() => {
    const byPair = new Map<string, MissingReference>();
    for (const d of dependencies) {
      if (!selectedTableIds.has(d.table_id) || selectedTableIds.has(d.depends_on_id)) continue;
      if (d.kind === 'trigger' && !includeAutomations) continue;
      const key = `${d.table_id}|${d.depends_on_id}`;
      const entry = byPair.get(key) || {
        tableId: d.table_id,
        tableTitle: d.table_title,
        dependsOnId: d.depends_on_id,
        dependsOnTitle: d.depends_on_title,
        items: [],
      };
      entry.items.push(d);
      byPair.set(key, entry);
    }
    return Array.from(byPair.values());
  }, [dependencies, selectedTableIds, includeAutomations]);

  // A table is filtered when its filter has conditions (only counts when rows are exported)
  const filteredIds = useMemo(
    () => new Set(includeData ? Object.entries(filters).filter(([id, c]) => c.length > 0 && selectedTableIds.has(id)).map(([id]) => id) : []),
    [filters, selectedTableIds, includeData],
  );
  const incompleteFilter = Array.from(filteredIds).some((id) => (filters[id] || []).some((c) => !isFilterComplete(c)));

  if (!isOpen) return null;

  const baseTitle = base.title || base.name || 'Base';
  const query = search.trim().toLowerCase();
  const visibleTables = query ? tables.filter((t) => t.title.toLowerCase().includes(query)) : tables;
  const selectedCount = selectedTableIds.size;
  const allSelected = tables.length > 0 && selectedCount === tables.length;
  const someSelected = selectedCount > 0;

  const toggleSelectAll = () => setSelectedTableIds(allSelected ? new Set() : new Set(tables.map((t) => t.id)));

  const toggleTable = (id: string) => {
    setSelectedTableIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const includeTables = (ids: string[]) => setSelectedTableIds((prev) => new Set([...prev, ...ids]));

  const handleExport = () => {
    if (!someSelected && tables.length > 0) return;
    if (incompleteFilter) return;
    // only the filters of tables that are exported; the first condition of a filter has no logic
    const rowFilters: Record<string, ExportFilterCondition[]> = {};
    filteredIds.forEach((id) => {
      rowFilters[id] = (filters[id] || []).map(({ logic, ...rest }, index) => (index === 0 ? rest : { ...rest, logic: logic || 'AND' }));
    });
    onExport({
      includeData,
      includeAttachments,
      includeAutomations,
      includeSystemColumns: includeData && includeSystemColumns,
      filters: Object.keys(rowFilters).length > 0 ? rowFilters : undefined,
      tables: allSelected ? undefined : Array.from(selectedTableIds),
    });
  };

  return (
    <div className="bg-modal-backdrop" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="bg-modal max-w-[900px]! h-[85vh]! max-h-[780px]! p-0! flex flex-col relative overflow-hidden" role="dialog" aria-label="Export SereniBase">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-primary truncate">Export “{baseTitle}”</h2>
            <p className="text-sm text-secondary truncate">Choose the tables and what to include (.sbase).</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center shrink-0" aria-label="Close">
            <X className="text-gray-400 h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-y-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search table"
              aria-label="Search table"
              className="w-full text-sm pl-9 pr-3 h-10 border rounded-xl text-primary bg-card outline-none focus:border-primary"
            />
          </div>

          {loading ? (
            <div className="py-4 text-center text-sm text-gray-500">Loading tables…</div>
          ) : tables.length === 0 ? (
            <div className="py-2 text-sm text-gray-500">No tables found in this base.</div>
          ) : (
            <div className="flex flex-col gap-y-2.5">
              <label className="flex items-center gap-2.5 text-sm text-gray-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={toggleSelectAll}
                  className="rounded h-4 w-4"
                />
                <span className="font-medium">Select all</span>
                <span className="text-gray-500">({selectedCount} of {tables.length} tables selected)</span>
              </label>
              {visibleTables.length === 0 && <p className="text-sm text-gray-500">No table matches “{search}”.</p>}
              {visibleTables.map((t) => {
                const selected = selectedTableIds.has(t.id);
                const conditions = filters[t.id] || [];
                const canFilter = selected && includeData && (t.fields?.length || 0) > 0;
                const isOpenFilter = canFilter && openFilterId === t.id;
                return (
                  <div key={t.id} className="flex flex-col gap-y-2">
                    <div className="flex items-center gap-2.5 text-sm text-gray-700">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none min-w-0 flex-1">
                        <input type="checkbox" checked={selected} onChange={() => toggleTable(t.id)} className="rounded h-4 w-4" />
                        <span className="truncate">{t.title}</span>
                      </label>
                      {selected && (t.fields?.length || 0) > 0 && (
                        <button
                          type="button"
                          disabled={!includeData}
                          title={includeData ? 'Export only the rows that match a filter' : 'Turn on Data to filter rows'}
                          onClick={() => {
                            if (conditions.length === 0 && openFilterId !== t.id) {
                              // opening an empty filter starts it with a first condition
                              const first = t.fields?.[0];
                              if (first) setFilters((prev) => ({ ...prev, [t.id]: [{ column: first.id, operator: getDefaultOperator(first.uidt), value: '' }] }));
                            }
                            setOpenFilterId(isOpenFilter ? null : t.id);
                          }}
                          className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium border shadow-xs rounded-xl focus:outline-none shrink-0 ${conditions.length > 0 && includeData ? 'bg-green-50 text-green-700 border-green-300' : 'bg-card text-tertiary border-border'} ${includeData ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                        >
                          <Filter className="w-4 h-4" />
                          Filter
                          {conditions.length > 0 && includeData && (
                            <span className="ml-1 w-8 rounded-xl bg-green-500 text-white text-xs font-bold">{conditions.length}</span>
                          )}
                        </button>
                      )}
                    </div>
                    {isOpenFilter && (
                      <div className="ml-6 min-w-0">
                        <ExportTableFilterEditor
                          fields={t.fields || []}
                          conditions={conditions}
                          onChange={(next) => {
                            setFilters((prev) => ({ ...prev, [t.id]: next }));
                            if (next.length === 0) setOpenFilterId(null);
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {!someSelected && tables.length > 0 && <p className="text-xs text-red-600">Please select at least one table to export.</p>}

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              aria-expanded={showAdvanced}
              className="w-full flex items-center justify-between text-sm font-medium text-green-700 cursor-pointer"
            >
              Advanced Options
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            {showAdvanced && (
              <div className="mt-3 flex flex-col gap-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={includeData} onChange={(e) => setIncludeData(e.target.checked)} className="mt-0.5 rounded h-4 w-4" />
                  <div>
                    <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5"><Database className="w-4 h-4 text-gray-500" />Data (records / rows)</span>
                    <p className="text-xs text-secondary mt-0.5">Exports table records as part of the base file.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={includeAttachments} onChange={(e) => setIncludeAttachments(e.target.checked)} className="mt-0.5 rounded h-4 w-4" />
                  <div>
                    <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5"><Paperclip className="w-4 h-4 text-gray-500" />Attachments &amp; Cover Image</span>
                    <p className="text-xs text-secondary mt-0.5">Packs file uploads and the base cover into a .sbase.zip archive.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={includeAutomations} onChange={(e) => setIncludeAutomations(e.target.checked)} className="mt-0.5 rounded h-4 w-4" />
                  <div>
                    <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5"><Zap className="w-4 h-4 text-gray-500" />Triggers &amp; Functions</span>
                    <p className="text-xs text-secondary mt-0.5">Exports database triggers and functions of the selected tables.</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 select-none ${includeData ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                  <input type="checkbox" checked={includeData && includeSystemColumns} disabled={!includeData} onChange={(e) => setIncludeSystemColumns(e.target.checked)} className="mt-0.5 rounded h-4 w-4" />
                  <div>
                    <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5"><Hash className="w-4 h-4 text-gray-500" />System columns (Id, created / modified time and user)</span>
                    <p className="text-xs text-secondary mt-0.5">Exports the system columns of every record. Needs Data.</p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {incompleteFilter && (
            <p className="text-xs text-red-600">Complete or remove the filters that have no value.</p>
          )}

          {missing.map((m) => (
            <div key={`${m.tableId}|${m.dependsOnId}`} className="rounded-xl border border-amber-300 bg-amber-50 p-4" role="alert">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-800">{m.tableTitle} references {m.dependsOnTitle}</p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    {m.dependsOnTitle} isn&apos;t selected, so related records may not be included.
                  </p>
                  {textItems(m).length > 0 && (
                    <p className="text-xs text-amber-700 mt-1">
                      Exported as text: {textItems(m).map((i) => `${i.item} (${KIND_LABEL[i.kind]})`).join(', ')}
                    </p>
                  )}
                  {triggerItems(m).length > 0 && (
                    <p className="text-xs text-amber-700 mt-1">
                      Left out: {triggerItems(m).map((i) => `${i.item} (${KIND_LABEL[i.kind]})`).join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => includeTables([m.dependsOnId])}
                className="mt-3 ml-7 px-4 py-1.5 rounded-lg border bg-card hover:bg-gray-50 text-sm font-medium text-gray-700 cursor-pointer"
              >
                Include related tables
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t shrink-0 bg-gray-50">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl border bg-card hover:bg-gray-100 text-gray-700 text-sm font-medium cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={(tables.length > 0 && !someSelected) || incompleteFilter}
            className="px-6 py-2 rounded-xl btn-primary text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export Base
          </button>
        </div>
      </div>
    </div>
  );
};
