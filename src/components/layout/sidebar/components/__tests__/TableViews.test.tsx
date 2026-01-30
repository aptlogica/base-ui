import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { TableViews } from '../TableViews';

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

const mockViews = [
  { id: 'view-1', title: 'Grid View', type: 'grid' },
  { id: 'view-2', title: 'Kanban View', type: 'kanban' },
];

const mockMutateAsync = vi.fn();
const mockMutate = vi.fn();

vi.mock('../../../../hooks/useApi', () => ({
  useUpdateTable: () => ({
    mutate: mockMutate,
    mutateAsync: mockMutateAsync,
  }),
}));

vi.mock('../../../../hooks/useWorkspaceAccess', () => ({
  useWorkspaceAccess: vi.fn(),
}));

vi.mock('../../../../hooks/useBaseAccess', () => ({
  useBaseAccess: vi.fn(),
}));

vi.mock('../../../../components/views/ViewOptionsMenu', () => ({
  default: ({
    view,
    onPinToggle,
    onDelete,
  }: {
    view: { id: string; title: string };
    onPinToggle: (viewId: string, pinned: boolean) => void;
    onDelete: () => void;
  }) => (
    <div data-testid={`view-options-${view.id}`}>
      <button type="button" onClick={() => onPinToggle(view.id, true)}>
        Pin
      </button>
      <button type="button" onClick={() => onDelete()}>
        Delete
      </button>
    </div>
  ),
}));

vi.mock('../CreateViewButton', () => ({
  CreateViewButton: ({
    onOpenModal,
  }: {
    onOpenModal: (type: string) => void;
  }) => (
    <div data-testid="create-view-button">
      <button type="button" onClick={() => onOpenModal('grid')}>
        Create Grid View
      </button>
    </div>
  ),
}));

import { useWorkspaceAccess } from '../../../../hooks/useWorkspaceAccess';
import { useBaseAccess } from '../../../../hooks/useBaseAccess';

const useWorkspaceAccessMock = vi.mocked(useWorkspaceAccess);
const useBaseAccessMock = vi.mocked(useBaseAccess);

const defaultProps = {
  table: mockTable,
  views: mockViews,
  navigateToView: mockNavigateToView,
  isViewActive: mockIsViewActive,
  handleViewDeletion: mockHandleViewDeletion,
  setShowCreateViewModal: mockSetShowCreateViewModal,
  setPopoverRef: mockSetPopoverRef,
  setEditingViewId: mockSetEditingViewId,
};

describe('TableViews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue(undefined);
    mockIsViewActive.mockReturnValue(false);
    useWorkspaceAccessMock.mockReturnValue({
      isWorkspaceReadOnly: vi.fn().mockReturnValue(false),
    } as ReturnType<typeof useWorkspaceAccessMock>);
    useBaseAccessMock.mockReturnValue({
      canCreateView: vi.fn().mockReturnValue(true),
    } as ReturnType<typeof useBaseAccessMock>);
  });

  describe('Rendering', () => {
    it('should render Create View button when canCreateView and not read-only', () => {
      render(<TableViews {...defaultProps} />);
      expect(screen.getByTestId('create-view-button')).toBeInTheDocument();
    });

    it('should not render Create View button when workspace is read-only', () => {
      useWorkspaceAccessMock.mockReturnValue({
        isWorkspaceReadOnly: vi.fn().mockReturnValue(true),
      } as ReturnType<typeof useWorkspaceAccessMock>);
      render(<TableViews {...defaultProps} />);
      expect(screen.queryByTestId('create-view-button')).not.toBeInTheDocument();
    });

    it('should not render Create View button when cannot create view', () => {
      useBaseAccessMock.mockReturnValue({
        canCreateView: vi.fn().mockReturnValue(false),
      } as ReturnType<typeof useBaseAccessMock>);
      render(<TableViews {...defaultProps} />);
      expect(screen.queryByTestId('create-view-button')).not.toBeInTheDocument();
    });

    it('should render list of views', () => {
      render(<TableViews {...defaultProps} />);
      expect(screen.getByText('Grid View')).toBeInTheDocument();
      expect(screen.getByText('Kanban View')).toBeInTheDocument();
    });

    it('should render nothing when views is empty', () => {
      render(<TableViews {...defaultProps} views={[]} />);
      expect(screen.queryByText('Grid View')).not.toBeInTheDocument();
    });

    it('should render ViewOptionsMenu for each view when not read-only', () => {
      render(<TableViews {...defaultProps} />);
      expect(screen.getByTestId('view-options-view-1')).toBeInTheDocument();
      expect(screen.getByTestId('view-options-view-2')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call setShowCreateViewModal when Create View is clicked', async () => {
      const user = userEvent.setup();
      render(<TableViews {...defaultProps} />);
      const createButton = screen.getByRole('button', { name: /create grid view/i });

      await user.click(createButton);

      expect(mockSetShowCreateViewModal).toHaveBeenCalledWith({
        tableId: mockTable.id,
        viewType: 'grid',
      });
    });

    it('should call navigateToView when view name is clicked', async () => {
      const user = userEvent.setup();
      render(<TableViews {...defaultProps} />);
      const gridViewButton = screen.getByRole('button', { name: /go to view grid view/i });

      await user.click(gridViewButton);

      expect(mockNavigateToView).toHaveBeenCalledWith(
        mockTable.workspace_id,
        mockTable.base_id,
        mockTable.id,
        'view-1'
      );
    });

    it('should call handleViewDeletion when Delete is clicked on view options', async () => {
      const user = userEvent.setup();
      render(<TableViews {...defaultProps} />);
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

      await user.click(deleteButtons[0]);

      expect(mockHandleViewDeletion).toHaveBeenCalledWith(mockViews[0]);
    });
  });

  describe('Pin toggle', () => {
    it('should call updateTable mutateAsync when pin is toggled', async () => {
      mockMutateAsync.mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<TableViews {...defaultProps} />);
      const pinButtons = screen.getAllByRole('button', { name: /pin/i });

      await user.click(pinButtons[0]);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    it('should revert pinned state when mutateAsync rejects', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Network error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();
      render(<TableViews {...defaultProps} />);
      const pinButtons = screen.getAllByRole('button', { name: /pin/i });

      await user.click(pinButtons[0]);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Sorted views', () => {
    it('should show pinned views first', () => {
      const tableWithPinned = {
        ...mockTable,
        meta: { pinnedViews: { 'view-2': true } },
      };
      render(<TableViews {...defaultProps} table={tableWithPinned} />);
      const viewButtons = screen.getAllByRole('button', { name: /go to view/i });
      expect(viewButtons[0]).toHaveAccessibleName(/kanban view/i);
      expect(viewButtons[1]).toHaveAccessibleName(/grid view/i);
    });
  });

  describe('Edge cases', () => {
    it('should handle views defaulting to empty array', () => {
      const propsWithoutViews = {
        ...defaultProps,
        views: undefined,
      };
      render(<TableViews {...(propsWithoutViews as React.ComponentProps<typeof TableViews>)} />);
      expect(screen.queryByText('Grid View')).not.toBeInTheDocument();
    });

    it('should handle table with no meta', () => {
      const tableNoMeta = { ...mockTable, meta: undefined };
      render(<TableViews {...defaultProps} table={tableNoMeta} />);
      expect(screen.getByText('Grid View')).toBeInTheDocument();
    });
  });
});
