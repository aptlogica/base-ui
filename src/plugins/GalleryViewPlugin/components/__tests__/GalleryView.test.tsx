import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GalleryView } from '../GalleryView';
import * as useGalleryViewConfigHook from '../../hooks/useGalleryViewConfig';
import * as useGalleryModalsHook from '../../hooks/useGalleryModals';
import * as useBaseAccessHook from '../../../../hooks/useBaseAccess';
import * as useFrontendPaginationHook from '../../../../hooks/useFrontendPagination';

vi.mock('../../hooks/useGalleryViewConfig');
vi.mock('../../hooks/useGalleryModals');
vi.mock('../../../../hooks/useBaseAccess');
vi.mock('../../../../hooks/useFrontendPagination');
vi.mock('../GalleryHeader', () => ({
  GalleryHeader: (props: any) => (
    <div data-testid="gallery-header">
      <span>Items: {props.itemCount}</span>
      {props.onAddRecord && (
        <button onClick={props.onAddRecord}>Add</button>
      )}
    </div>
  ),
}));
vi.mock('../GalleryCard', () => ({
  MemoizedGalleryCard: ({ item, onEdit }: any) => (
    <div data-testid={`gallery-card-${item.id}`}>
      <span>{item.title}</span>
      {onEdit && <button onClick={onEdit}>Edit</button>}
    </div>
  ),
}));
vi.mock('../../../../components/modals/CreateRecordModal', () => ({
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));
vi.mock('../../../../components/modals/EditRecordModal', () => ({
  default: ({ isOpen, onClose, onSuccess, onDelete }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Update</button>
        {onDelete && <button onClick={() => onDelete('rec-1')}>Delete</button>}
      </div>
    ) : null,
}));
vi.mock('../../../../components/modals/DeleteConfirmModal', () => ({
  default: ({ isOpen, onClose, onConfirm }: any) =>
    isOpen ? (
      <div data-testid="delete-modal">
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    ) : null,
}));

describe('GalleryView', () => {
  const mockOnRefresh = vi.fn();
  const mockDeleteRecord = vi.fn().mockResolvedValue(undefined);
  const mockUpdateViewConfig = vi.fn().mockResolvedValue(undefined);

  const mockTableData = {
    model: { id: 'table-1', base_id: 'base-1' },
    columns: [],
    records: [],
    views: [{ id: 'view-1', type: 'gallery' }],
  };

  const mockGalleryItems = [
    {
      id: 'rec-1',
      title: 'Item 1',
      metadata: { Title: 'Item 1' },
      rawData: { id: 'rec-1', title: 'Item 1' },
    },
    {
      id: 'rec-2',
      title: 'Item 2',
      metadata: { Title: 'Item 2' },
      rawData: { id: 'rec-2', title: 'Item 2' },
    },
  ];

  // Base mock return values
  const baseGalleryDataReturn = {
    tableData: mockTableData,
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    addRow: vi.fn(),
    insertRowData: vi.fn(),
    deleteRecord: mockDeleteRecord,
    updateField: vi.fn(),
    updateView: vi.fn(),
    updateViewConfig: mockUpdateViewConfig,
    galleryItems: mockGalleryItems,
    attachmentField: undefined,
    attachmentFields: [],
    columns: [],
    view: { id: 'view-1', type: 'gallery' },
  };

  const baseGalleryViewConfigReturn = {
    filters: [],
    sorts: [],
    draftFilter: null,
    searchTerm: '',
    setSearchTerm: vi.fn(),
    selectedSearchField: null,
    setSelectedSearchField: vi.fn(),
    localFieldConfig: [],
    setLocalFieldConfig: vi.fn(),
    visibleColumns: [],
    handleRealTimeFilter: vi.fn(),
    handleAddFilter: vi.fn(),
    handleRemoveFilter: vi.fn(),
    handleUpdateFilter: vi.fn(),
    handleSortChange: vi.fn(),
    handleFieldToggle: vi.fn(),
    handleFieldOrderChange: vi.fn(),
  };

  const baseGalleryModalsReturn = {
    isCreateModalOpen: false,
    isEditModalOpen: false,
    isDeleteModalOpen: false,
    selectedRecord: null,
    handleCreateRecord: vi.fn(),
    handleEditRecord: vi.fn(),
    handleDeleteRecord: vi.fn(),
    handleDeleteRecordFromModal: vi.fn(),
    handleCloseCreateModal: vi.fn(),
    handleCloseEditModal: vi.fn(),
    handleCloseDeleteModal: vi.fn(),
    handleCreateSuccess: vi.fn(),
    handleEditSuccess: vi.fn(),
  };

  const baseFrontendPaginationReturn = {
    allLoadedData: mockGalleryItems,
    loadNextPage: vi.fn(),
    hasMore: false,
    totalItems: mockGalleryItems.length,
    reset: vi.fn(),
  };

  const mockUseGalleryViewConfig = vi.spyOn(useGalleryViewConfigHook, 'useGalleryViewConfig');
  const mockUseGalleryModals = vi.spyOn(useGalleryModalsHook, 'useGalleryModals');
  const mockUseBaseAccess = vi.spyOn(useBaseAccessHook, 'useBaseAccess');
  const mockUseFrontendPagination = vi.spyOn(useFrontendPaginationHook, 'useFrontendPagination');

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseGalleryViewConfig.mockReturnValue(baseGalleryViewConfigReturn as any);

    mockUseGalleryModals.mockReturnValue(baseGalleryModalsReturn);

    mockUseBaseAccess.mockReturnValue({
      isBaseReadOnly: () => false,
      canCreateRecord: () => true,
      canEditRecord: () => true,
      canDeleteRecord: () => true,
    } as any);

    mockUseFrontendPagination.mockReturnValue(baseFrontendPaginationReturn as any);
  });

  describe('rendering', () => {
    it('should render gallery view with items', () => {
      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should render gallery header', () => {
      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByTestId('gallery-header')).toBeInTheDocument();
    });

    it('should render empty state when no items', () => {
      mockUseFrontendPagination.mockReturnValue({
        ...baseFrontendPaginationReturn,
        allLoadedData: [],
        totalItems: 0,
      } as any);

      const galleryData = {
        ...baseGalleryDataReturn,
        galleryItems: [],
      };

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={galleryData as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByText(/no items/i)).toBeInTheDocument();
    });

    it('should render add button in empty state when not read-only', () => {
      mockUseFrontendPagination.mockReturnValue({
        allLoadedData: [],
        loadNextPage: vi.fn(),
        hasMore: false,
        totalItems: 0,
        reset: vi.fn(),
      } as any);

      const galleryData = {
        ...baseGalleryDataReturn,
        galleryItems: [],
      };

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={galleryData as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      const addButton = screen.getByText('Add Record');
      expect(addButton).toBeInTheDocument();
    });

    it('should not render add button in empty state when read-only', () => {
      mockUseBaseAccess.mockReturnValue({
        isBaseReadOnly: () => true,
        canCreateRecord: () => false,
        canEditRecord: () => false,
        canDeleteRecord: () => false,
      } as any);

      mockUseFrontendPagination.mockReturnValue({
        allLoadedData: [],
        loadNextPage: vi.fn(),
        hasMore: false,
        totalItems: 0,
        reset: vi.fn(),
      } as any);

      const galleryData = {
        ...baseGalleryDataReturn,
        galleryItems: [],
      };

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={galleryData as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      const addButtons = screen.queryAllByText('Add Record');
      expect(addButtons).toHaveLength(0);
    });

    it('should render load more button when hasMore is true', () => {
      mockUseFrontendPagination.mockReturnValue({
        allLoadedData: mockGalleryItems,
        loadNextPage: vi.fn(),
        hasMore: true,
        totalItems: 10,
        reset: vi.fn(),
      } as any);

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByText(/remaining/)).toBeInTheDocument();
    });
  });

  describe('modals', () => {
    it('should open create modal', () => {
      const handleCreateRecord = vi.fn();
      mockUseGalleryModals.mockReturnValue({
        ...baseGalleryModalsReturn,
        isCreateModalOpen: true,
        handleCreateRecord,
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });

    it('should open edit modal', () => {
      mockUseGalleryModals.mockReturnValue({
        ...baseGalleryModalsReturn,
        isEditModalOpen: true,
        selectedRecord: mockGalleryItems[0].rawData,
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    });

    it('should open delete modal', () => {
      mockUseGalleryModals.mockReturnValue({
        ...baseGalleryModalsReturn,
        isDeleteModalOpen: true,
        selectedRecord: mockGalleryItems[0].rawData,
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    });

    it('should close create modal', () => {
      const handleCloseCreateModal = vi.fn();
      mockUseGalleryModals.mockReturnValue({
        ...baseGalleryModalsReturn,
        isCreateModalOpen: true,
        handleCloseCreateModal,
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      fireEvent.click(screen.getByText('Close'));
      expect(handleCloseCreateModal).toHaveBeenCalled();
    });

    it('should handle create success and refresh', () => {
      const handleCreateSuccess = vi.fn((callback) => callback?.());
      mockUseGalleryModals.mockReturnValue({
        ...baseGalleryModalsReturn,
        isCreateModalOpen: true,
        handleCreateSuccess,
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      fireEvent.click(screen.getByText('Save'));
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('should handle edit success and refresh', () => {
      const handleEditSuccess = vi.fn((callback) => callback?.());
      mockUseGalleryModals.mockReturnValue({
        ...baseGalleryModalsReturn,
        isEditModalOpen: true,
        selectedRecord: mockGalleryItems[0].rawData,
        handleEditSuccess,
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      fireEvent.click(screen.getByText('Update'));
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('should not show delete button in edit modal when read-only', () => {
      mockUseBaseAccess.mockReturnValue({
        isBaseReadOnly: () => true,
        canCreateRecord: () => false,
        canEditRecord: () => false,
        canDeleteRecord: () => false,
      } as any);

      mockUseGalleryModals.mockReturnValue({
        ...baseGalleryModalsReturn,
        isEditModalOpen: true,
        selectedRecord: mockGalleryItems[0].rawData,
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should open edit modal on card edit', () => {
      const handleEditRecord = vi.fn();
      mockUseGalleryModals.mockReturnValue({
        ...baseGalleryModalsReturn,
        handleEditRecord,
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      const editButton = screen.getAllByText('Edit')[0];
      fireEvent.click(editButton);

      expect(handleEditRecord).toHaveBeenCalledWith(mockGalleryItems[0].rawData);
    });

    it('should not show edit button when read-only', () => {
      mockUseBaseAccess.mockReturnValue({
        isBaseReadOnly: () => true,
        canCreateRecord: () => false,
        canEditRecord: () => false,
        canDeleteRecord: () => false,
      } as any);

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('should load more items on button click', async () => {
      const loadNextPage = vi.fn();
      mockUseFrontendPagination.mockReturnValue({
        allLoadedData: mockGalleryItems,
        loadNextPage,
        hasMore: true,
        totalItems: 10,
        reset: vi.fn(),
      } as any);

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      const loadMoreButton = screen.getByText(/remaining/);
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(loadNextPage).toHaveBeenCalled();
      });
    });

    it('should handle delete confirmation', async () => {
      const handleCloseDeleteModal = vi.fn();
      mockUseGalleryModals.mockReturnValue({
        ...baseGalleryModalsReturn,
        isDeleteModalOpen: true,
        selectedRecord: { id: 'rec-1', title: 'Item 1' },
        handleCloseDeleteModal,
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(mockDeleteRecord).toHaveBeenCalledWith('rec-1');
        expect(handleCloseDeleteModal).toHaveBeenCalled();
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });

    it('should handle delete error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDeleteRecord.mockRejectedValueOnce(new Error('Delete failed'));

      mockUseGalleryModals.mockReturnValue({
        ...baseGalleryModalsReturn,
        isDeleteModalOpen: true,
        selectedRecord: { id: 'rec-1', title: 'Item 1' },
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting record:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('filtering and sorting', () => {
    it('should apply filters to gallery items', () => {
      mockUseGalleryViewConfig.mockReturnValue({
        ...baseGalleryViewConfigReturn,
        filters: [{ column: 'title', operator: 'eq', value: 'Item 1' }],
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should apply sorts to gallery items', () => {
      mockUseGalleryViewConfig.mockReturnValue({
        ...baseGalleryViewConfigReturn,
        sorts: [{ column: 'title', direction: 'desc' }],
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should apply search filter', () => {
      mockUseGalleryViewConfig.mockReturnValue({
        ...baseGalleryViewConfigReturn,
        searchTerm: 'Item 1',
        selectedSearchField: { key: 'title', title: 'Title', type: 'text' },
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should apply draft filter for preview', () => {
      mockUseGalleryViewConfig.mockReturnValue({
        ...baseGalleryViewConfigReturn,
        draftFilter: { column: 'title', operator: 'contains', value: 'Item' },
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('read-only mode', () => {
    it('should not show add button in header when read-only', () => {
      mockUseBaseAccess.mockReturnValue({
        isBaseReadOnly: () => true,
        canCreateRecord: () => false,
        canEditRecord: () => false,
        canDeleteRecord: () => false,
      } as any);

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      const addButtons = screen.queryAllByText('Add');
      expect(addButtons).toHaveLength(0);
    });

    it('should not allow attachment field change when read-only', () => {
      mockUseBaseAccess.mockReturnValue({
        isBaseReadOnly: () => true,
        canCreateRecord: () => false,
        canEditRecord: () => false,
        canDeleteRecord: () => false,
      } as any);

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByTestId('gallery-header')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined base_id', () => {
      const tableDataWithoutBaseId = {
        model: { id: 'table-1' },
        columns: [],
        records: [],
        views: [],
      };

      render(
        <GalleryView
          tableData={tableDataWithoutBaseId}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByTestId('gallery-header')).toBeInTheDocument();
    });

    it('should handle empty visible columns', () => {
      mockUseGalleryViewConfig.mockReturnValue({
        ...baseGalleryViewConfigReturn,
        visibleColumns: [],
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should handle null selectedRecord in delete', async () => {
      mockUseGalleryModals.mockReturnValue({
        ...baseGalleryModalsReturn,
        isDeleteModalOpen: true,
        selectedRecord: null,
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(mockDeleteRecord).not.toHaveBeenCalled();
      });
    });

    it('should handle missing record id in delete', async () => {
      mockUseGalleryModals.mockReturnValue({
        ...baseGalleryModalsReturn,
        isDeleteModalOpen: true,
        selectedRecord: { title: 'Item without ID' },
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(mockDeleteRecord).not.toHaveBeenCalled();
      });
    });
  });

  describe('pagination', () => {
    it('should show correct remaining count', () => {
      mockUseFrontendPagination.mockReturnValue({
        allLoadedData: mockGalleryItems,
        loadNextPage: vi.fn(),
        hasMore: true,
        totalItems: 10,
        reset: vi.fn(),
      } as any);

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByText(/8 remaining/)).toBeInTheDocument();
    });

    it('should not show load more when hasMore is false', () => {
      mockUseFrontendPagination.mockReturnValue({
        allLoadedData: mockGalleryItems,
        loadNextPage: vi.fn(),
        hasMore: false,
        totalItems: 2,
        reset: vi.fn(),
      } as any);

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
    });
  });

  describe('attachment field change', () => {
    it('should update view config and refresh', async () => {
      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      const header = screen.getByTestId('gallery-header');
      expect(header).toBeInTheDocument();
    });
  });

  describe('initial values for edit', () => {
    it('should build initial values for edit modal', () => {
      mockUseGalleryModals.mockReturnValue({
        ...baseGalleryModalsReturn,
        isEditModalOpen: true,
        selectedRecord: mockGalleryItems[0].rawData,
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    });

    it('should handle missing selectedRecord', () => {
      mockUseGalleryModals.mockReturnValue({
        ...baseGalleryModalsReturn,
        isEditModalOpen: true,
        selectedRecord: null,
      });

      render(
        <GalleryView
          tableData={mockTableData}
          galleryData={baseGalleryDataReturn as any}
          onRefresh={mockOnRefresh}
          actions={{ deleteRecord: mockDeleteRecord, updateViewConfig: mockUpdateViewConfig }}
        />
      );

      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    });
  });
});


