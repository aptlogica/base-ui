import React, { useMemo } from 'react';
import { Plus, List } from 'lucide-react';
import { FilterPopover } from '../../../components/shared/table/FilterPopover';
import { FieldsPopover } from '../../../components/shared/table/FieldsPopover';
import { SortPopover } from '../../../components/shared/table/SortPopover';
import { Search } from '../../../components/shared/table/Search';
import { BaseColumn } from '../../../types/column.types';
import { SortItem } from '../../../utils/sortUtils';
import { GalleryFieldConfiguration } from './GalleryFieldSelector';
import { formatCompactNumber } from '../../../utils/helpers';
import { ColumnConfig } from '../../../plugins/GridViewPlugin/types/grid.types';
import { normalizeFieldType } from '../../../utils/fieldType';

interface GalleryHeaderProps {
  itemCount: number;
  loadedCount?: number;
  hasMore?: boolean;
  onAddRecord?: () => void;
  attachmentField?: BaseColumn;
  attachmentFields: BaseColumn[];
  onAttachmentFieldChange?: (field: BaseColumn) => void;
  // New props for popover functionality
  columns: BaseColumn[];
  sortableColumns?: any[]; // Filtered columns for sort/filter popovers
  fieldConfig: Array<{ id: string; position: number; isHidden: boolean }>;
  onFieldToggle?: (fieldId: string) => void;
  filters: { column: string; operator: string; value: string }[];
  onAddFilter?: (filter: { column: string; operator: string; value: string }) => void;
  onRemoveFilter?: (index: number) => void;
  onUpdateFilter?: (index: number, updates: Partial<{ column: string; operator: string; value: string }>) => void;
  sorts: SortItem[];
  onSortChange?: (newSorts: SortItem[]) => void;
  onSearch: (searchTerm: string, selectedField: any) => void;
}

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  itemCount,
  loadedCount,
  hasMore,
  onAddRecord,
  attachmentField,
  attachmentFields,
  onAttachmentFieldChange,
  columns,
  sortableColumns = columns, // Default to columns if not provided
  fieldConfig,
  onFieldToggle,
  filters,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  sorts,
  onSortChange,
  onSearch
}) => {

  // Get searchable columns (exclude system fields except Title)
  const searchableColumns = useMemo(() => {
    return columns.filter(col => {
      const isSystemField = col.isSystem || col.system;
      const isTitle = col.title.toLowerCase() === 'title' || col.column_name?.toLowerCase() === 'title';
      return !isSystemField || isTitle;
    });
  }, [columns]);

  // Convert BaseColumn[] to ColumnConfig[] for FieldsPopover and FilterPopover
  const columnConfigs = useMemo((): ColumnConfig[] => {
    return columns.map((col): ColumnConfig => ({
      id: col.id ? String(col.id) : undefined,
      key: col.key || col.column_name || '',
      column_name: col.column_name,
      title: col.title || col.column_name || '',
      type: normalizeFieldType(col.type || col.uidt || 'text') as any,
      uidt: col.uidt,
      position: col.position || col.order_index || 0,
      order_index: col.order_index || 0,
      isSystem: col.isSystem || col.system || false,
      system: col.system || false,
      hidden: col.hidden || false,
      is_hidden: col.isHidden || col.is_hidden || false,
      meta: col.meta,
      config: col.config || col.meta,
    }));
  }, [columns]);

  // Convert sortableColumns to ColumnConfig[] if provided
  const sortableColumnConfigs = useMemo((): ColumnConfig[] => {
    if (!sortableColumns || sortableColumns === columns) {
      return columnConfigs;
    }
    return sortableColumns.map((col): ColumnConfig => ({
      id: col.id ? String(col.id) : undefined,
      key: col.key || col.column_name || '',
      column_name: col.column_name || col.key,
      title: col.title || col.column_name || '',
      type: normalizeFieldType(col.type || col.uidt || 'text') as any,
      uidt: col.uidt,
      position: col.position || col.order_index || 0,
      order_index: col.order_index || 0,
      isSystem: col.isSystem || col.system || false,
      system: col.system || false,
      hidden: col.hidden || false,
      is_hidden: col.isHidden || col.is_hidden || false,
      meta: col.meta,
      config: col.config || col.meta,
    }));
  }, [sortableColumns, columnConfigs]);

  return (
    <div className="bg-background border-b px-4 py-2">
      {/* Desktop Layout - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-3">
          {attachmentFields.length > 0 && onAttachmentFieldChange && (
            <GalleryFieldConfiguration
              columns={columns}
              attachmentField={attachmentField}
              onAttachmentFieldChange={(field) => field && onAttachmentFieldChange(field)}
            />
          )}
          {onFieldToggle && (
            <FieldsPopover
              columns={columnConfigs}
              fieldConfig={fieldConfig}
              onFieldToggle={onFieldToggle}
              label="Fields"
              iconComponent={List}
            />
          )}
          {onAddFilter && onRemoveFilter && onUpdateFilter && (
            <FilterPopover
              columns={sortableColumnConfigs}
              filters={filters}
              onAddFilter={onAddFilter}
              onRemoveFilter={onRemoveFilter}
              onUpdateFilter={onUpdateFilter}
            />
          )}
          {onSortChange && (
            <SortPopover
              columns={sortableColumns}
              sorts={sorts}
              onChange={onSortChange}
            />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
          <Search
            columns={searchableColumns}
            onSearch={onSearch}
          />
          </div>

          {/* Add Record Button - hide when handler is undefined */}
          {onAddRecord && (
            <button
              onClick={onAddRecord}
              className="px-6 py-2 rounded-xl btn-primary text-[var(--color-text-primary)] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </button>
          )}
        </div>
      </div>

      {/* Mobile Layout - Shown on mobile */}
      <div className="flex md:hidden flex-col gap-3">
        {/* Top row: Title, count, and attachment field selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-primary">Gallery View</h2>
            <div className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {formatCompactNumber(itemCount)}
              {hasMore && loadedCount !== undefined && ` (${formatCompactNumber(loadedCount)} loaded)`}
            </div>
          </div>
        </div>

        {/* Middle row: Attachment field selector and Search */}
        <div className="flex items-center justify-center gap-3">
          {attachmentFields.length > 0 && onAttachmentFieldChange && (
            <GalleryFieldConfiguration
              columns={columns}
              attachmentField={attachmentField}
              onAttachmentFieldChange={(field) => field && onAttachmentFieldChange(field)}
            />
          )}
          <Search
            columns={searchableColumns}
            onSearch={onSearch}
            className="flex-1 max-w-xs"
          />
        </div>

      </div>
    </div>
  );
};




