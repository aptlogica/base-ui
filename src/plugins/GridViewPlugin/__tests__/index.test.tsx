import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GridViewPlugin from '../index';
import { matchesViewType } from '../../../utils/viewType';
import { useGridData } from '../hooks/useGridData';

// Mock dependencies
vi.mock('../../../utils/viewType');
vi.mock('../hooks/useGridData');
vi.mock('../components/Table/Table', () => ({
  Table: ({ tableData, onRefresh, actions }: any) => (
    <div data-testid="grid-table">
      <button data-testid="refresh-btn" onClick={onRefresh}>Refresh</button>
      <div data-testid="table-data">{tableData?.model?.name}</div>
      <div data-testid="actions">{JSON.stringify(actions)}</div>
    </div>
  )
}));
vi.mock('../../../components/ui/Loader', () => ({
  Loader: ({ size }: { size: number }) => <div data-testid="loader" data-size={size}>Loading...</div>
}));

describe('GridViewPlugin', () => {
  const mockUseGridData = vi.mocked(useGridData);
  const mockMatchesViewType = vi.mocked(matchesViewType);
  const mockApi = {
    registerExtension: vi.fn(),
    registerExtensionPoint: vi.fn(),
    getPlugin: vi.fn(),
    getPluginConfig: vi.fn(),
    getService: vi.fn(),
    registerService: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchesViewType.mockReturnValue(false);
    mockUseGridData.mockReturnValue({
      tableData: undefined,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
      addRow: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
      insertRowData: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
      deleteRecord: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
      bulkDeleteRecords: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
      updateField: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
      deleteColumn: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
      createField: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
      updateView: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
      updateRowOrder: vi.fn(),
    });
  });

  describe('Plugin manifest', () => {
    it('should have correct plugin manifest', () => {
      expect(GridViewPlugin.manifest).toEqual({
        id: 'grid-view-plugin',
        name: 'Grid View Plugin',
        version: '2.0.0',
        description: 'Advanced grid view with clean architecture, filtering, sorting, and editing capabilities',
      });
    });
  });

  describe('Plugin initialization', () => {
    it('should register view extension on initialize', async () => {
      await GridViewPlugin.initialize(mockApi, {} as any);

      expect(mockApi.registerExtension).toHaveBeenCalledWith('view', {
        id: 'grid-view',
        order: 50,
        render: expect.any(Function)
      });
    });
  });

  describe('GridView extension rendering', () => {
    let extensionProps: any;

    beforeEach(async () => {
      await GridViewPlugin.initialize(mockApi, {} as any);
      extensionProps = mockApi.registerExtension.mock.calls[0][1];
    });

    it('should return null when tableId is missing', () => {
      const result = extensionProps.render({
        table: {},
        view: { id: 'view-1', type: 'grid' }
      });

      expect(result).toBeNull();
    });

    it('should return null when view type does not match grid types', () => {
      mockMatchesViewType.mockReturnValue(false);

      const result = extensionProps.render({
        table: { id: 'table-1' },
        view: { id: 'view-1', type: 'kanban' },
        viewType: 'kanban'
      });

      expect(result).toBeNull();
    });

    it('should render GridView when conditions are met', () => {
      mockMatchesViewType.mockReturnValue(true);
      mockUseGridData.mockReturnValue({
        tableData: { model: { name: 'Test Table' } },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        addRow: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        insertRowData: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        deleteRecord: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        bulkDeleteRecords: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        updateField: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        deleteColumn: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        createField: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        updateView: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        updateRowOrder: vi.fn(),
      } as any);

      const result = extensionProps.render({
        table: { id: 'table-1' },
        view: { id: 'view-1', type: 'grid' },
        viewType: 'grid'
      });

      expect(result).toBeTruthy();
    });

    it('should call matchesViewType with correct parameters', () => {
      extensionProps.render({
        table: { id: 'table-1' },
        view: { id: 'view-1', type: 'grid-view' },
        viewType: 'grid'
      });

      expect(mockMatchesViewType).toHaveBeenCalledWith(
        'grid',
        ['grid', 'gridview', 'grid-view']
      );
    });
  });

  describe('GridView component', () => {
    let GridView: any;

    beforeEach(async () => {
      await GridViewPlugin.initialize(mockApi, {} as any);
      const extensionProps = mockApi.registerExtension.mock.calls[0][1];
      mockMatchesViewType.mockReturnValue(true);

      GridView = () => extensionProps.render({
        table: { id: 'table-1' },
        view: { id: 'view-1', type: 'grid' }
      });
    });

    it('should display loading state', () => {
      mockUseGridData.mockReturnValue({
        tableData: undefined,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
        addRow: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined } as any,
        insertRowData: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined } as any,
        deleteRecord: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined } as any,
        bulkDeleteRecords: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined } as any,
        updateField: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined } as any,
        deleteColumn: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined } as any,
        createField: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined } as any,
        updateView: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined } as any,
        updateRowOrder: vi.fn(),
      });

      render(<GridView />);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.getByTestId('loader')).toHaveAttribute('data-size', '10');
    });

    it('should display error state with retry button', async () => {
      const mockRefresh = vi.fn();
      mockUseGridData.mockReturnValue({
        tableData: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
        refresh: mockRefresh,
        addRow: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        insertRowData: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        deleteRecord: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        bulkDeleteRecords: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        updateField: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        deleteColumn: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        createField: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        updateView: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        updateRowOrder: vi.fn(),
      });

      render(<GridView />);

      expect(screen.getByText('Something went wrong while loading the table.')).toBeInTheDocument();
      
      const retryButton = screen.getByText('Retry');
      await userEvent.click(retryButton);
      
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('should display loading when tableData model is missing', () => {
      mockUseGridData.mockReturnValue({
        tableData: {},
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        addRow: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        insertRowData: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        deleteRecord: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        bulkDeleteRecords: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        updateField: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        deleteColumn: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        createField: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        updateView: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        updateRowOrder: vi.fn(),
      } as any);

      render(<GridView />);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should render Table component when data is loaded', async () => {
      const mockActions = {
        addRow: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined },
        insertRowData: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined },
        deleteRecord: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined },
        bulkDeleteRecords: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined },
        updateField: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined },
        deleteColumn: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined },
        createField: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined },
        updateView: { mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false, error: null, data: undefined },
        updateRowOrder: vi.fn(),
      };

      mockUseGridData.mockReturnValue({
        tableData: { model: { name: 'Test Table' } },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        ...mockActions,
      } as any);

      render(<GridView />);

      await waitFor(() => {
        expect(screen.getByTestId('grid-table')).toBeInTheDocument();
        expect(screen.getByTestId('table-data')).toHaveTextContent('Test Table');
      });
    });

    it('should pass correct props to Table component', async () => {
      const mockRefresh = vi.fn();
      const mockActions = {
        addRow: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        insertRowData: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        deleteRecord: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        bulkDeleteRecords: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        updateField: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        deleteColumn: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        createField: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        updateView: { mutate: vi.fn(), mutateAsync: vi.fn() } as any,
        updateRowOrder: vi.fn(),
      };

      mockUseGridData.mockReturnValue({
        tableData: { model: { name: 'Test Table' } },
        isLoading: false,
        error: null,
        refresh: mockRefresh,
        ...mockActions,
      } as any);

      render(<GridView />);

      await waitFor(() => {
        const refreshBtn = screen.getByTestId('refresh-btn');
        expect(refreshBtn).toBeInTheDocument();
      });

      const refreshBtn = screen.getByTestId('refresh-btn');
      await userEvent.click(refreshBtn);
      
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });
});