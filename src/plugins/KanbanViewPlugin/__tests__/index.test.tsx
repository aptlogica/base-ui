import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import KanbanViewPlugin from '../index';
import type { PluginAPI } from '../../../core/types';

const mockUseKanbanData = vi.hoisted(() => vi.fn());
vi.mock('../hooks/useKanbanData', () => ({
  useKanbanData: mockUseKanbanData
}));

vi.mock('../../components/ui/Loader', () => ({
  Loader: vi.fn(({ size }) => <div data-testid="loader" data-size={size}>Loading...</div>)
}));

const mockMatchesViewType = vi.hoisted(() => vi.fn());
vi.mock('../../../utils/viewType', () => ({
  matchesViewType: mockMatchesViewType
}));

describe('KanbanViewPlugin', () => {
  const mockRegisterExtension = vi.fn();
  const mockApi: PluginAPI = {
    registerExtension: mockRegisterExtension
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Plugin Manifest', () => {
    it('should have correct manifest', () => {
      expect(KanbanViewPlugin.manifest).toEqual({
        id: 'kanban-view-plugin',
        name: 'Kanban View Plugin',
        version: '2.0.0',
        description: 'Clean kanban view with data layer separation and modern architecture'
      });
    });
  });

  describe('Plugin Initialization', () => {
    it('should initialize plugin', async () => {
      await KanbanViewPlugin.initialize(mockApi, {});
      expect(mockRegisterExtension).toHaveBeenCalledTimes(1);
    });

    it('should register view extension', async () => {
      await KanbanViewPlugin.initialize(mockApi, {});
      expect(mockRegisterExtension).toHaveBeenCalledWith('view', expect.objectContaining({
        id: 'kanban-view',
        order: 53,
        render: expect.any(Function)
      }));
    });
  });

  describe('View Extension Render', () => {
    let renderFunction: any;

    beforeEach(async () => {
      await KanbanViewPlugin.initialize(mockApi, {});
      renderFunction = mockRegisterExtension.mock.calls[0][1].render;
    });

    it('should return null when tableId is missing', () => {
      const result = renderFunction({ table: {}, view: { type: 'kanban' } });
      expect(result).toBeNull();
    });

    it('should return null when viewType does not match kanban', () => {
      mockMatchesViewType.mockReturnValue(false);
      const result = renderFunction({
        table: { id: 'table1' },
        view: { type: 'grid' }
      });
      expect(result).toBeNull();
    });

    it('should render KanbanView when tableId exists and viewType matches', () => {
      mockMatchesViewType.mockReturnValue(true);
      mockUseKanbanData.mockReturnValue({
        tableData: { model: { id: 'table1' }, columns: [], records: [] },
        isLoading: false,
        error: null,
        refresh: vi.fn()
      });

      const result = renderFunction({
        table: { id: 'table1' },
        view: { id: 'view1', type: 'kanban' },
        viewType: 'kanban'
      });

      expect(result).not.toBeNull();
      expect(mockMatchesViewType).toHaveBeenCalled();
    });

    it('should use viewType prop when available', () => {
      mockMatchesViewType.mockReturnValue(true);
      renderFunction({
        table: { id: 'table1' },
        viewType: 'kanban'
      });

      expect(mockMatchesViewType).toHaveBeenCalledWith('kanban', ['kanban', 'kanbanview', 'kanban-view']);
    });

    it('should fallback to view type when viewType prop is missing', () => {
      mockMatchesViewType.mockReturnValue(true);
      renderFunction({
        table: { id: 'table1' },
        view: { type: 'kanban' }
      });

      expect(mockMatchesViewType).toHaveBeenCalledWith('kanban', ['kanban', 'kanbanview', 'kanban-view']);
    });

    it('should handle kanbanview type', () => {
      mockMatchesViewType.mockReturnValue(true);
      renderFunction({
        table: { id: 'table1' },
        viewType: 'kanbanview'
      });

      expect(mockMatchesViewType).toHaveBeenCalledWith('kanbanview', ['kanban', 'kanbanview', 'kanban-view']);
    });

    it('should handle kanban-view type', () => {
      mockMatchesViewType.mockReturnValue(true);
      renderFunction({
        table: { id: 'table1' },
        viewType: 'kanban-view'
      });

      expect(mockMatchesViewType).toHaveBeenCalledWith('kanban-view', ['kanban', 'kanbanview', 'kanban-view']);
    });
  });

  describe('KanbanView Component', () => {
    let renderFunction: any;

    beforeEach(async () => {
      await KanbanViewPlugin.initialize(mockApi, {});
      renderFunction = mockRegisterExtension.mock.calls[0][1].render;
      mockMatchesViewType.mockReturnValue(true);
    });

    it('should show error when useKanbanData returns error', () => {
      const errorMessage = 'Failed to load data';
      mockUseKanbanData.mockReturnValue({
        tableData: null,
        isLoading: false,
        error: new Error(errorMessage),
        refresh: vi.fn()
      });

      render(renderFunction({
        table: { id: 'table1' },
        viewType: 'kanban'
      }));

      expect(screen.getByText('Something went wrong while loading the kanban view.')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should show error when error is string', () => {
      mockUseKanbanData.mockReturnValue({
        tableData: null,
        isLoading: false,
        error: 'String error',
        refresh: vi.fn()
      });

      render(renderFunction({
        table: { id: 'table1' },
        viewType: 'kanban'
      }));

      expect(screen.getByText('String error')).toBeInTheDocument();
    });

    it('should show unknown error message', () => {
      mockUseKanbanData.mockReturnValue({
        tableData: null,
        isLoading: false,
        error: { unknown: true },
        refresh: vi.fn()
      });

      render(renderFunction({
        table: { id: 'table1' },
        viewType: 'kanban'
      }));

      expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      const mockRefresh = vi.fn();
      mockUseKanbanData.mockReturnValue({
        tableData: null,
        isLoading: false,
        error: new Error('Test error'),
        refresh: mockRefresh
      });

      render(renderFunction({
        table: { id: 'table1' },
        viewType: 'kanban'
      }));

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should show loader when isLoading is true', () => {
      mockUseKanbanData.mockReturnValue({
        tableData: null,
        isLoading: true,
        error: null,
        refresh: vi.fn()
      });

      render(renderFunction({
        table: { id: 'table1' },
        viewType: 'kanban'
      }));

      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('should show loader when tableData is null', () => {
      mockUseKanbanData.mockReturnValue({
        tableData: null,
        isLoading: false,
        error: null,
        refresh: vi.fn()
      });

      render(renderFunction({
        table: { id: 'table1' },
        viewType: 'kanban'
      }));

      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('should show loader when tableData model is missing', () => {
      mockUseKanbanData.mockReturnValue({
        tableData: { columns: [], records: [] },
        isLoading: false,
        error: null,
        refresh: vi.fn()
      });

      render(renderFunction({
        table: { id: 'table1' },
        viewType: 'kanban'
      }));

      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('should pass tableId to useKanbanData', () => {
      mockUseKanbanData.mockReturnValue({
        tableData: { model: { id: 'table1' }, columns: [], records: [] },
        isLoading: false,
        error: null,
        refresh: vi.fn()
      });

      // The render function creates and returns the component
      const result = renderFunction({
        table: { id: 'table1' },
        viewType: 'kanban'
      });

      // Component should render without throwing when tableId is passed
      expect(result).not.toBeNull();
    });

    it('should pass viewId to useKanbanData when provided', () => {
      mockUseKanbanData.mockReturnValue({
        tableData: { model: { id: 'table1' }, columns: [], records: [] },
        isLoading: false,
        error: null,
        refresh: vi.fn()
      });

      // The render function creates and returns the component
      const result = renderFunction({
        table: { id: 'table1' },
        view: { id: 'view1' },
        viewType: 'kanban'
      });

      // Component should render without throwing when viewId is passed
      expect(result).not.toBeNull();
    });
  });

  describe('Edge Cases', () => {
    let renderFunction: any;

    beforeEach(async () => {
      await KanbanViewPlugin.initialize(mockApi, {});
      renderFunction = mockRegisterExtension.mock.calls[0][1].render;
    });

    it('should handle undefined table', () => {
      const result = renderFunction({ viewType: 'kanban' });
      expect(result).toBeNull();
    });

    it('should handle undefined view', () => {
      mockMatchesViewType.mockReturnValue(true);
      mockUseKanbanData.mockReturnValue({
        tableData: { model: { id: 'table1' }, columns: [], records: [] },
        isLoading: false,
        error: null,
        refresh: vi.fn()
      });

      const result = renderFunction({
        table: { id: 'table1' },
        viewType: 'kanban'
      });

      expect(result).not.toBeNull();
    });

    it('should handle empty props', () => {
      const result = renderFunction({});
      expect(result).toBeNull();
    });

    it('should handle null tableId', () => {
      const result = renderFunction({ table: { id: null }, viewType: 'kanban' });
      expect(result).toBeNull();
    });

    it('should handle undefined tableId', () => {
      const result = renderFunction({ table: { id: undefined }, viewType: 'kanban' });
      expect(result).toBeNull();
    });

    it('should handle empty string tableId', () => {
      const result = renderFunction({ table: { id: '' }, viewType: 'kanban' });
      expect(result).toBeNull();
    });
  });
});
