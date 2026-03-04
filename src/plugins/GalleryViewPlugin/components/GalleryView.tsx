import React, { useMemo, useCallback } from 'react';
import { Plus, Image as ImageIcon } from 'lucide-react';
import type { UseGalleryDataReturn } from '../hooks/useGalleryData';
import { GalleryHeader } from './GalleryHeader';
import { MemoizedGalleryCard } from './GalleryCard';
import CreateRecordModal from '../../../components/modals/CreateRecordModal';
import EditRecordModal from '../../../components/modals/EditRecordModal';
import DeleteConfirmModal from '../../../components/modals/DeleteConfirmModal';
import { applyFilters, FilterCondition } from '../../../utils/filterUtils';
import { buildComparator, SortItem } from '../../../utils/sortUtils';
import { buildInitialValuesForEdit } from '../../../utils/initialValues';
import { useInfiniteScrollPagination } from '../../../hooks/useInfiniteScrollPagination';
import { formatCompactNumber } from '../../../utils/helpers';
import { LoadMoreSection } from '../../../components/shared/LoadMoreSection';
import { useBaseAccess } from '../../../hooks/useBaseAccess';
// Custom hooks
import { useGalleryViewConfig } from '../hooks/useGalleryViewConfig';
import { useGalleryModals } from '../hooks/useGalleryModals';
import { getSearchableColumns } from '../utils/galleryColumns';

const applySearchFilter = (
  items: UseGalleryDataReturn['galleryItems'],
  searchTerm: string,
  selectedSearchField: { key?: string } | null | undefined
) => {
  if (!searchTerm || !selectedSearchField?.key) return items;
  return items.filter(item => {
    const fieldValue = item.rawData[selectedSearchField.key as string];
    if (fieldValue === null || fieldValue === undefined) return false;
    return String(fieldValue).toLowerCase().includes(searchTerm.toLowerCase());
  });
};

const applyAllFilters = (
  items: UseGalleryDataReturn['galleryItems'],
  filters: FilterCondition[],
  draftFilter: FilterCondition | null,
  columns: UseGalleryDataReturn['columns']
) => {
  const hasFilters = Array.isArray(filters) && filters.length > 0;
  const hasDraftFilter = draftFilter !== null;
  if (!hasFilters && !hasDraftFilter) return items;
  const allFilters = hasDraftFilter ? [...filters, draftFilter] : filters;
  const rawRecords = items.map(item => item.rawData);
  const filteredRecords = applyFilters(rawRecords, allFilters as any, columns as any);
  return items.filter(item => filteredRecords.some(record => record.id === item.id));
};

const applySortsToItems = (
  items: UseGalleryDataReturn['galleryItems'],
  sorts: SortItem[],
  columns: UseGalleryDataReturn['columns']
) => {
  if (!Array.isArray(sorts) || sorts.length === 0) return items;
  const allCols = columns.map(c => ({
    key: c.column_name || c.key,
    type: String(c.uidt)
  }));
  const rawRecords = items.map(item => item.rawData);
  const cmp = buildComparator<Record<string, unknown>>(allCols, sorts, (row, key) => row[key]);
  const sortedRecords = [...rawRecords].sort(cmp);
  const recordIndexMap = new Map(sortedRecords.map((record, index) => [record.id, index]));
  return items.sort((a, b) => {
    const aIndex = recordIndexMap.get(a.id) ?? Infinity;
    const bIndex = recordIndexMap.get(b.id) ?? Infinity;
    return aIndex - bIndex;
  });
};

interface GalleryViewProps {
  tableData: any;
  galleryData: UseGalleryDataReturn;
  onRefresh: () => void;
  actions: {
    deleteRecord: (recordId: string) => Promise<void>;
    updateViewConfig: (viewId: string, updates: any) => Promise<void>;
  };
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  tableData,
  galleryData,
  onRefresh,
  actions
}) => {
  // Extract actions
  const { deleteRecord, updateViewConfig } = actions;
  // Extract base ID for permission checks
  const baseId = useMemo(() => String(tableData?.model?.base_id ?? ''), [tableData?.model?.base_id]);
  // Check permissions for read-only access
  const { isBaseReadOnly, canCreateRecord } = useBaseAccess(baseId || undefined);
  const isReadOnly = isBaseReadOnly();
  // Get searchable columns (exclude system fields except Title)
  const searchableColumns = useMemo(() => {
    return getSearchableColumns(galleryData.columns);
  }, [galleryData.columns]);

  // View configuration hook
  const {
    filters,
    sorts,
    draftFilter,
    searchTerm,
    setSearchTerm,
    selectedSearchField,
    setSelectedSearchField,
    localFieldConfig,
    visibleColumns,
    handleAddFilter,
    handleRemoveFilter,
    handleUpdateFilter,
    handleSortChange,
    handleFieldToggle,
  } = useGalleryViewConfig({
    view: galleryData.view,
    columns: galleryData.columns,
    updateView: galleryData.updateView,
    searchableColumns,
    isReadOnly,
  });

  // Modal management hook
  const {
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    selectedRecord,
    handleCreateRecord,
    handleEditRecord,
    handleDeleteRecordFromModal,
    handleCloseCreateModal,
    handleCloseEditModal,
    handleCloseDeleteModal,
    handleCreateSuccess,
    handleEditSuccess,
  } = useGalleryModals();


  // Delete confirmation handler
  const handleConfirmDelete = useCallback(async () => {
    if (selectedRecord?.id) {
      try {
      await deleteRecord(String(selectedRecord.id));
        handleCloseDeleteModal();
      onRefresh();
      } catch (error) {
        console.error('Error deleting record:', error);
        // Keep modal open on error so user can retry
      }
    }
  }, [selectedRecord, deleteRecord, handleCloseDeleteModal, onRefresh]);

  // Wrapper for handleDeleteRecordFromModal to pass galleryItems
  const handleDeleteFromModal = useCallback((recordId: string) => {
    handleDeleteRecordFromModal(recordId, galleryData.galleryItems);
  }, [handleDeleteRecordFromModal, galleryData.galleryItems]);

  // Memoized search handler to prevent recreation
  const handleSearch = useCallback((term: string, selectedField: any) => {
    setSearchTerm(term);
    setSelectedSearchField(selectedField);
  }, [setSearchTerm, setSelectedSearchField]);

  // Attachment field change handler
  const handleAttachmentFieldChange = useCallback(async (field: any) => {
    // Update view config with selected attachment field
    if (galleryData.view) {
      await updateViewConfig(galleryData.view.id, {
        attachment_field_id: field.id
      });
      // Force refresh to re-process data with new attachment field
    onRefresh();
    }
  }, [galleryData.view, updateViewConfig, onRefresh]);

  // Apply filters and sorts to gallery items (following KanbanBoard pattern)
  // Includes both saved filters and draft/real-time filter for preview
  const filteredAndSortedItems = useMemo(() => {
    let processedItems = [...galleryData.galleryItems];
    processedItems = applySearchFilter(processedItems, searchTerm, selectedSearchField);
    processedItems = applyAllFilters(processedItems, filters, draftFilter, galleryData.columns);
    processedItems = applySortsToItems(processedItems, sorts, galleryData.columns);

    return processedItems;
  }, [galleryData.galleryItems, filters, draftFilter, sorts, galleryData.columns, searchTerm, selectedSearchField]);

  // FRONTEND PAGINATION: Paginate filtered and sorted items
  // This allows rendering only a portion of items initially for better performance
  const {
    paginatedData: paginatedItems,
    handleLoadMore,
    hasMore,
    totalItems,
    isLoadingMore,
    scrollContainerRef,
  } = useInfiniteScrollPagination({
    data: filteredAndSortedItems,
    pageSize: 30, // Same as GridView and Kanban
  });

  const getEditInitialValues = useCallback(() => {
    if (!selectedRecord) return {};
    let initialValues = typeof buildInitialValuesForEdit === 'function'
      ? buildInitialValuesForEdit({
        record: selectedRecord,
        recordId: selectedRecord.id,
        columns: galleryData.columns,
      })
      : { ...selectedRecord };

    return initialValues;
  }, [selectedRecord, galleryData]);


  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <GalleryHeader
        itemCount={totalItems}
        loadedCount={paginatedItems.length}
        hasMore={hasMore}
        onAddRecord={isReadOnly ? undefined : handleCreateRecord}
        attachmentField={galleryData.attachmentField}
        attachmentFields={galleryData.attachmentFields}
        onAttachmentFieldChange={isReadOnly ? undefined : handleAttachmentFieldChange}
        columns={galleryData.columns}
        fieldConfig={localFieldConfig}
        onFieldToggle={isReadOnly ? undefined : handleFieldToggle}
        filters={filters}
        onAddFilter={handleAddFilter}
        onRemoveFilter={handleRemoveFilter}
        onUpdateFilter={handleUpdateFilter}
        sorts={sorts}
        onSortChange={handleSortChange}
        onSearch={handleSearch}
      />

      {/* Gallery Grid */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto p-6 bg-background"
      >
        {totalItems === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items in gallery</h3>
              <p className="text-gray-500 mb-4">Start by adding some records with attachments</p>
              {!isReadOnly && canCreateRecord() && (
                <button
                  onClick={handleCreateRecord}
                  className="px-4 py-2 btn-primary rounded-xl flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Add Record
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginatedItems.map((item) => (
                <MemoizedGalleryCard
                  key={item.id}
                  item={item}
                  onEdit={isReadOnly ? undefined : () => handleEditRecord(item.rawData)}
                  visibleColumns={visibleColumns}
                />
              ))}
            </div>
            
            {/* Load More Button */}
            <LoadMoreSection
              isVisible={hasMore}
              isLoading={isLoadingMore}
              onLoadMore={handleLoadMore}
              className="py-6"
              label={`Load more (${formatCompactNumber(totalItems - paginatedItems.length)} remaining)`}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <CreateRecordModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSuccess={() => handleCreateSuccess(onRefresh)}
        table={tableData?.model}
        fields={galleryData.columns}
        title="New record"
        submitLabel="Save record"
      />

      <EditRecordModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={() => handleEditSuccess(onRefresh)}
        recordId={selectedRecord?.id}
        table={tableData?.model}
        fields={galleryData.columns}
        initialValues={getEditInitialValues()}
        onDelete={isReadOnly ? undefined : handleDeleteFromModal}
        title="Edit record"
        submitLabel="Update record"
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Record"
        message={`Are you sure you want to delete "${selectedRecord?.title || 'this record'}"?`}
      />
    </div>
  );
};
