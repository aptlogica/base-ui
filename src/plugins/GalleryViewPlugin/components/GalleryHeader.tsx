import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Filter, List } from 'lucide-react';
import { FilterPopover } from '../../../components/shared/table/FilterPopover';
import { FieldsPopover } from '../../../components/shared/table/FieldsPopover';
import { SortPopover } from '../../../components/shared/table/SortPopover';
import { Search } from '../../../components/shared/table/Search';
import { BaseColumn } from '../../../types/column.types';
import { SortItem } from '../../../utils/sortUtils';
import { fieldsToExcludeInFilter } from '../../../types/constants';
import { GalleryFieldConfiguration } from './GalleryFieldSelector';
import { formatCompactNumber } from '../../../utils/helpers';

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
  onFieldOrderChange?: (newColumns: BaseColumn[]) => void;
  filters: { column: string; operator: string; value: string }[];
  onAddFilter?: (filter: { column: string; operator: string; value: string }) => void;
  onRemoveFilter?: (index: number) => void;
  onUpdateFilter?: (index: number, updates: Partial<{ column: string; operator: string; value: string }>) => void;
  onRealTimeFilter?: (filter: { column: string; operator: string; value: string } | null) => void;
  sorts: SortItem[];
  onSortChange?: (newSorts: SortItem[]) => void;
  tableId: string;
  // Search props
  searchTerm: string;
  selectedSearchField: any;
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
  onFieldOrderChange,
  filters,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  onRealTimeFilter,
  sorts,
  onSortChange,
  tableId,
  searchTerm,
  selectedSearchField,
  onSearch
}) => {
  const [showAttachmentSelector, setShowAttachmentSelector] = useState(false);

  // Get searchable columns (exclude system fields except Title)
  const searchableColumns = useMemo(() => {
    return columns.filter(col => {
      const isSystemField = col.isSystem || col.system;
      const isTitle = col.title.toLowerCase() === 'title' || col.column_name?.toLowerCase() === 'title';
      return !isSystemField || isTitle;
    });
  }, [columns]);

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
              columns={columns}
              fieldConfig={fieldConfig}
              onFieldToggle={onFieldToggle}
              tableId={tableId}
              label="Fields"
              iconComponent={List}
            />
          )}
          {onAddFilter && (
            <FilterPopover
              columns={sortableColumns}
              filters={filters}
              onAddFilter={onAddFilter}
              onRemoveFilter={onRemoveFilter}
              onUpdateFilter={onUpdateFilter}
              onRealTimeFilter={onRealTimeFilter}
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




