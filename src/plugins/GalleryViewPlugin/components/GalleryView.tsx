import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { GalleryItem, useGalleryData } from '../hooks/useGalleryData';
import { GalleryHeader } from './GalleryHeader';
import { MemoizedGalleryCard } from './GalleryCard';
import CreateRecordModal from '../../../components/modals/CreateRecordModal';
import EditRecordModal from '../../../components/modals/EditRecordModal';
import DeleteConfirmModal from '../../../components/modals/DeleteConfirmModal';
import { applyFilters } from '../../../utils/filterUtils';
import { buildComparator } from '../../../utils/sortUtils';
import { buildInitialValuesForEdit } from '../../../utils/initialValues';
import { useRemoveAttachments } from '../../../hooks/useApi';
import { fieldsToExcludeInFilter } from '../../../types/constants';
import { useFrontendPagination } from '../../../hooks/useFrontendPagination';
import { formatCompactNumber } from '../../../utils/helpers';
import { Loader } from '../../../components/ui/Loader';
// Custom hooks
import { useGalleryViewConfig } from '../hooks/useGalleryViewConfig';
import { useGalleryModals } from '../hooks/useGalleryModals';

interface GalleryViewProps {
  tableData: any;
  onRefresh: () => void;
  actions: {
    addRow: (data: Record<string, unknown>) => Promise<void>;
    insertRowData: (data: Record<string, unknown>) => Promise<void>;
    deleteRecord: (recordId: string) => Promise<void>;
    updateField: (fieldId: string, data: Record<string, unknown>) => Promise<void>;
    updateView: (viewId: string, updates: Record<string, unknown>) => Promise<void>;
    updateViewConfig: (viewId: string, updates: any) => Promise<void>;
  };
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  tableData,
  onRefresh,
  actions
}) => {
  // Extract actions
  const { addRow, insertRowData, deleteRecord, updateField, updateView, updateViewConfig } = actions;
  const removeAttachmentsMutation = useRemoveAttachments();

  // Use the useGalleryData hook for consistent data processing
  const galleryData = useGalleryData({ 
    tableId: tableData?.model?.id || '', 
    viewId: tableData?.views?.find((v: any) => v.type === 'gallery')?.id 
  });

  // Get searchable columns (exclude certain fields)
  const searchableColumns = useMemo(() => {
    return galleryData.columns
      .filter(col => {
        const uidt = String(col.uidt || col.type || '').toLowerCase();
        return !fieldsToExcludeInFilter.includes(uidt);
      });
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
    handleRealTimeFilter,
    handleAddFilter,
    handleRemoveFilter,
    handleUpdateFilter,
    handleSortChange,
    handleFieldToggle,
    handleFieldOrderChange,
  } = useGalleryViewConfig({
    view: galleryData.view,
    columns: galleryData.columns,
    updateView: galleryData.updateView,
    searchableColumns,
  });

  // Modal management hook
  const {
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    selectedRecord,
    handleCreateRecord,
    handleEditRecord,
    handleDeleteRecord,
    handleDeleteRecordFromModal,
    handleCloseCreateModal,
    handleCloseEditModal,
    handleCloseDeleteModal,
    handleCreateSuccess,
    handleEditSuccess,
  } = useGalleryModals();

  // Get columns for sort/filter popovers (exclude certain fields)
  const sortableColumns = useMemo(() => {
    return galleryData.columns
      .filter(col => {
        const uidt = String(col.uidt || col.type || '').toLowerCase();
        return !fieldsToExcludeInFilter.includes(uidt);
      })
      .map(col => ({
        key: col.column_name || col.key,
        column_name: col.column_name || col.key,
        title: col.title,
        type: col.type,
        uidt: col.uidt,
        id: col.id,
        config: col.config || col.meta || {}, // Include config for SingleSelect/MultiSelect options
        options: col.options || col.config?.options || col.meta?.options, // Include options directly
        meta: col.meta, // Include meta as fallback
        hidden: col.hidden,
        isHidden: col.isHidden,
        system: col.system
      }));
  }, [galleryData.columns]);

  // Delete confirmation handler
  const handleConfirmDelete = useCallback(async () => {
    if (selectedRecord && selectedRecord.id) {
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
    const hasFilters = Array.isArray(filters) && filters.length > 0;
    const hasDraftFilter = draftFilter !== null;
    const hasSorts = Array.isArray(sorts) && sorts.length > 0;
    const hasSearch = searchTerm && selectedSearchField;

    let processedItems = [...galleryData.galleryItems];

    // Apply search filter first
    if (hasSearch && selectedSearchField) {
      processedItems = processedItems.filter(item => {
        const fieldValue = item.rawData[selectedSearchField.key];
        if (fieldValue === null || fieldValue === undefined) return false;
        return String(fieldValue).toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Combine saved filters with draft filter (if any) for real-time preview
    const allFilters = hasDraftFilter 
      ? [...filters, draftFilter]
      : filters;

    // Apply filters (includes both saved and draft)
    if (hasFilters || hasDraftFilter) {
      const rawRecords = processedItems.map(item => item.rawData);
      const filteredRecords = applyFilters(rawRecords, allFilters as any, galleryData.columns as any);
      processedItems = processedItems.filter(item => 
        filteredRecords.some(record => record.id === item.id)
      );
    }

    // Apply sorts (optimized with Map for O(1) lookups instead of O(n) findIndex)
    if (hasSorts) {
      const allCols = galleryData.columns
        .map(c => ({
          key: c.column_name || c.key,
          type: String(c.uidt)
        }));
      const rawRecords = processedItems.map(item => item.rawData);
      const cmp = buildComparator<Record<string, unknown>>(allCols, sorts, (row, key) => row[key]);
      const sortedRecords = [...rawRecords].sort(cmp);
      
      // Create a map for O(1) lookups instead of O(n) findIndex
      const recordIndexMap = new Map(
        sortedRecords.map((record, index) => [record.id, index])
      );
      
      processedItems = processedItems.sort((a, b) => {
        const aIndex = recordIndexMap.get(a.id) ?? Infinity;
        const bIndex = recordIndexMap.get(b.id) ?? Infinity;
        return aIndex - bIndex;
      });
    }

    return processedItems;
  }, [galleryData.galleryItems, filters, draftFilter, sorts, galleryData.columns, searchTerm, selectedSearchField]);

  // FRONTEND PAGINATION: Paginate filtered and sorted items
  // This allows rendering only a portion of items initially for better performance
  const {
    allLoadedData: paginatedItems,
    loadNextPage,
    hasMore,
    totalItems,
  } = useFrontendPagination({
    data: filteredAndSortedItems,
    pageSize: 30, // Same as GridView and Kanban
    initialPage: 1,
  });

  // Loading state for "Load more" button
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Handle loading more with loading state
  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    loadNextPage();
    // Brief loading state for better UX (since loadNextPage is synchronous)
    setTimeout(() => setIsLoadingMore(false), 300);
  }, [loadNextPage]);

  // Infinite scroll: Load more when scrolling near bottom
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || isLoadingMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Load more when user is within 200px of bottom
      if (scrollHeight - scrollTop - clientHeight < 200) {
        handleLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, handleLoadMore]);

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

  // const filteredFields = useMemo(() => {
  //   return galleryData.columns.filter(col => col.id !== galleryData.view?.meta?.attachment_field_id);
  // }, [galleryData.columns]);

  // Memoized attachment delete handler
  const handleAttachmentDelete = useCallback(async (item: any, fileUrls: string[]) => {
    const model_id = tableData?.model?.id;
    const column_id = galleryData.view?.meta?.attachment_field_id;
    const row_id = item?.id;

    // if (!model_id || !column_id || !row_id || !Array.isArray(fileUrls) || fileUrls.length === 0) return;

    await removeAttachmentsMutation.mutateAsync({
      model_id,
      column_id,
      row_id,
      attachments: fileUrls
    });

    onRefresh();
  }, [tableData?.model?.id, galleryData.view?.meta?.attachment_field_id, removeAttachmentsMutation, onRefresh]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <GalleryHeader
        itemCount={totalItems}
        loadedCount={paginatedItems.length}
        hasMore={hasMore}
        onAddRecord={handleCreateRecord}
        attachmentField={galleryData.attachmentField}
        attachmentFields={galleryData.attachmentFields}
        onAttachmentFieldChange={handleAttachmentFieldChange}
        columns={galleryData.columns}
        sortableColumns={sortableColumns}
        fieldConfig={localFieldConfig}
        onFieldToggle={handleFieldToggle}
        onFieldOrderChange={handleFieldOrderChange}
        filters={filters}
        onAddFilter={handleAddFilter}
        onRemoveFilter={handleRemoveFilter}
        onUpdateFilter={handleUpdateFilter}
        onRealTimeFilter={handleRealTimeFilter}
        sorts={sorts}
        onSortChange={handleSortChange}
        tableId={String(galleryData.view?.id || '')}
        searchTerm={searchTerm}
        selectedSearchField={selectedSearchField}
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
              <button
                onClick={handleCreateRecord}
                className="px-4 py-2 btn-primary rounded-xl flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Record
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginatedItems.map((item) => (
                <MemoizedGalleryCard
                  key={item.id}
                  item={item}
                  onEdit={() => handleEditRecord(item.rawData)}
                  visibleColumns={visibleColumns}
                />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center py-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2.5 text-sm font-medium rounded-xl btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <Loader size={4} />
                  ) : (
                    <span>Load more ({formatCompactNumber(totalItems - paginatedItems.length)} remaining)</span>
                  )}
                </button>
              </div>
            )}
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
        onDelete={handleDeleteFromModal}
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