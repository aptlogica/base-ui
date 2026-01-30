import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableViewsWithData } from '../TableViewsWithData';

const mockNavigateToView = vi.fn();
const mockIsViewActive = vi.fn();
const mockHandleViewDeletion = vi.fn();
const mockSetShowCreateViewModal = vi.fn();
const mockSetPopoverRef = vi.fn();
const mockSetEditingViewId = vi.fn();

const mockTable = {
  id: 'table-1',
  base_id: 'base-1',
  workspace_id: 'ws-1',
  title: 'Test Table',
  meta: {},
};

const mockViewsData = [
  { id: 'view-1', title: 'Grid View', type: 'grid' },
  { id: 'view-2', title: 'Kanban View', type: 'kanban' },
];

const defaultProps = {
  table: mockTable,
  navigateToView: mockNavigateToView,
  isViewActive: mockIsViewActive,
  handleViewDeletion: mockHandleViewDeletion,
  setShowCreateViewModal: mockSetShowCreateViewModal,
  setEditingViewId: mockSetEditingViewId,
  setPopoverRef: mockSetPopoverRef,
};

vi.mock('../../../../hooks/useApi', () => ({
  useTableViews: vi.fn(),
}));

vi.mock('../TableViews', () => ({
  TableViews: ({ views, table }: { views: unknown[]; table: { id: string } }) => (
    <div data-testid="table-views">
      <span data-testid="views-count">{views.length}</span>
      <span data-testid="table-id">{table.id}</span>
      {views.map((v: { id: string; title: string }) => (
        <span key={v.id} data-testid={`view-${v.id}`}>
          {v.title}
        </span>
      ))}
    </div>
  ),
}));

import { useTableViews } from '../../../../hooks/useApi';

const useTableViewsMock = vi.mocked(useTableViews);

describe('TableViewsWithData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTableViewsMock.mockReturnValue({
      data: { data: mockViewsData },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useTableViewsMock>);
  });

  describe('Rendering', () => {
    it('should render TableViews component', () => {
      render(<TableViewsWithData {...defaultProps} />);
      expect(screen.getByTestId('table-views')).toBeInTheDocument();
    });

    it('should pass table prop to TableViews', () => {
      render(<TableViewsWithData {...defaultProps} />);
      expect(screen.getByTestId('table-id')).toHaveTextContent('table-1');
    });

    it('should pass views from useTableViews to TableViews', () => {
      render(<TableViewsWithData {...defaultProps} />);
      expect(screen.getByTestId('views-count')).toHaveTextContent('2');
      expect(screen.getByTestId('view-view-1')).toHaveTextContent('Grid View');
      expect(screen.getByTestId('view-view-2')).toHaveTextContent('Kanban View');
    });
  });

  describe('useTableViews', () => {
    it('should call useTableViews with table id', () => {
      render(<TableViewsWithData {...defaultProps} />);
      expect(useTableViewsMock).toHaveBeenCalledWith('table-1');
    });

    it('should pass empty views when useTableViews returns no data', () => {
      useTableViewsMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useTableViewsMock>);
      render(<TableViewsWithData {...defaultProps} />);
      expect(screen.getByTestId('views-count')).toHaveTextContent('0');
    });

    it('should pass empty views when response data is not an array', () => {
      useTableViewsMock.mockReturnValue({
        data: { data: null },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useTableViewsMock>);
      render(<TableViewsWithData {...defaultProps} />);
      expect(screen.getByTestId('views-count')).toHaveTextContent('0');
    });
  });

  describe('Props forwarding', () => {
    it('should forward table and views to TableViews', () => {
      render(<TableViewsWithData {...defaultProps} />);
      expect(screen.getByTestId('table-views')).toBeInTheDocument();
      expect(screen.getByTestId('table-id')).toHaveTextContent(mockTable.id);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty views array from useTableViews', () => {
      useTableViewsMock.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useTableViewsMock>);
      render(<TableViewsWithData {...defaultProps} />);
      expect(screen.getByTestId('views-count')).toHaveTextContent('0');
    });

    it('should handle different table id', () => {
      const otherTable = { ...mockTable, id: 'table-99' };
      render(<TableViewsWithData {...defaultProps} table={otherTable} />);
      expect(useTableViewsMock).toHaveBeenCalledWith('table-99');
      expect(screen.getByTestId('table-id')).toHaveTextContent('table-99');
    });
  });
});
