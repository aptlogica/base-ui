import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ViewOptionsMenu from '../ViewOptionsMenu';
import { useBaseAccess } from '../../../hooks/useBaseAccess';

const noop = (): void => {};

const TEST_ID = {
  POPOVER_MENU: 'popover-menu',
  EDIT_ITEM_MODAL: 'edit-item-modal',
  EDIT_MODAL_SAVE: 'edit-modal-save',
  EDIT_MODAL_CLOSE: 'edit-modal-close',
  DELETE_CONFIRM_MODAL: 'delete-confirm-modal',
  DELETE_MODAL_CONFIRM: 'delete-modal-confirm',
  DELETE_MODAL_CANCEL: 'delete-modal-cancel',
  MENU_ITEM_EDIT_VIEW: 'menu-item-edit-view',
  MENU_ITEM_DELETE_VIEW: 'menu-item-delete-view',
  MENU_ITEM_PIN_VIEW: 'menu-item-pin-view',
  MENU_ITEM_UNPIN_VIEW: 'menu-item-unpin-view',
} as const;

const mockUpdateViewMutateAsync = vi.fn();
const mockDeleteViewMutateAsync = vi.fn();

vi.mock('../../../hooks/useApi', () => ({
  useUpdateView: () => ({
    mutateAsync: mockUpdateViewMutateAsync,
  }),
  useDeleteView: () => ({
    mutateAsync: mockDeleteViewMutateAsync,
  }),
}));

vi.mock('../../../hooks/useBaseAccess', () => ({
  useBaseAccess: vi.fn(),
}));

vi.mock('../../common/PopoverMenu', () => ({
  PopoverMenu: ({
    trigger,
    items,
  }: {
    trigger: React.ReactNode;
    items: Array<{ label: string; onClick: () => void }>;
  }) => (
    <div data-testid={TEST_ID.POPOVER_MENU}>
      {trigger}
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          data-testid={`menu-item-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../modals/EditItemModal', () => ({
  EditItemModal: ({
    isOpen,
    onSave,
    onClose,
  }: {
    isOpen: boolean;
    onSave: (data: { name: string; description: string }) => void | Promise<void>;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid={TEST_ID.EDIT_ITEM_MODAL}>
        <button type="button" onClick={onClose} data-testid={TEST_ID.EDIT_MODAL_CLOSE}>
          Close
        </button>
        <button
          type="button"
          data-testid={TEST_ID.EDIT_MODAL_SAVE}
          onClick={() => {
            const result = onSave({
              name: 'Updated View Name',
              description: 'Updated view description',
            });
            if (result && typeof (result as Promise<void>).catch === 'function') {
              (result as Promise<void>).catch(noop);
            }
          }}
        >
          Save
        </button>
      </div>
    ) : null,
}));

vi.mock('../../modals/DeleteConfirmModal', () => ({
  default: ({
    isOpen,
    onConfirm,
    onClose,
  }: {
    isOpen: boolean;
    onConfirm: () => void | Promise<void>;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid={TEST_ID.DELETE_CONFIRM_MODAL}>
        <button type="button" onClick={onClose} data-testid={TEST_ID.DELETE_MODAL_CANCEL}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            const result = onConfirm();
            if (result && typeof (result as Promise<void>).catch === 'function') {
              (result as Promise<void>).catch(noop);
            }
          }}
          data-testid={TEST_ID.DELETE_MODAL_CONFIRM}
        >
          Delete
        </button>
      </div>
    ) : null,
}));

const useBaseAccessMock = vi.mocked(useBaseAccess);

describe('ViewOptionsMenu', () => {
  const defaultView = {
    id: 'view-1',
    name: 'My View',
    title: 'My View',
    description: 'View description',
    base_id: 'base-1',
  };

  const defaultProps = {
    view: defaultView,
    onRename: vi.fn(),
    onEditDescription: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateViewMutateAsync.mockResolvedValue(undefined);
    mockDeleteViewMutateAsync.mockResolvedValue(undefined);
    useBaseAccessMock.mockReturnValue({
      canDeleteView: vi.fn().mockReturnValue(true),
      isBaseReadOnly: vi.fn().mockReturnValue(false),
      canUpdateView: vi.fn().mockReturnValue(true),
    } as ReturnType<typeof useBaseAccessMock>);
  });

  describe('Rendering', () => {
    it('returns null when no menu items are available', () => {
      useBaseAccessMock.mockReturnValue({
        canDeleteView: vi.fn().mockReturnValue(false),
        isBaseReadOnly: vi.fn().mockReturnValue(true),
        canUpdateView: vi.fn().mockReturnValue(false),
      } as ReturnType<typeof useBaseAccessMock>);

      const { container } = render(
        <ViewOptionsMenu {...defaultProps} onPinToggle={undefined} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders PopoverMenu when at least one menu item is available', () => {
      render(<ViewOptionsMenu {...defaultProps} />);

      expect(screen.getByTestId(TEST_ID.POPOVER_MENU)).toBeInTheDocument();
    });

    it('renders Edit view menu item when canUpdateView and not read-only', () => {
      render(<ViewOptionsMenu {...defaultProps} />);

      expect(
        screen.getByTestId(TEST_ID.MENU_ITEM_EDIT_VIEW)
      ).toBeInTheDocument();
    });

    it('renders Delete view menu item when canDeleteView', () => {
      render(<ViewOptionsMenu {...defaultProps} />);

      expect(
        screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_VIEW)
      ).toBeInTheDocument();
    });

    it('renders Pin view menu item when onPinToggle provided and not read-only', () => {
      const onPinToggle = vi.fn();
      render(<ViewOptionsMenu {...defaultProps} onPinToggle={onPinToggle} />);

      expect(
        screen.getByTestId(TEST_ID.MENU_ITEM_PIN_VIEW)
      ).toBeInTheDocument();
    });

    it('renders Unpin view when isPinned is true and onPinToggle provided', () => {
      const onPinToggle = vi.fn();
      render(
        <ViewOptionsMenu {...defaultProps} onPinToggle={onPinToggle} isPinned />
      );

      expect(
        screen.getByTestId(TEST_ID.MENU_ITEM_UNPIN_VIEW)
      ).toBeInTheDocument();
    });

    it('does not render Pin item when isBaseReadOnly returns true', () => {
      useBaseAccessMock.mockReturnValue({
        canDeleteView: vi.fn().mockReturnValue(true),
        isBaseReadOnly: vi.fn().mockReturnValue(true),
        canUpdateView: vi.fn().mockReturnValue(true),
      } as ReturnType<typeof useBaseAccessMock>);

      render(
        <ViewOptionsMenu {...defaultProps} onPinToggle={vi.fn()} />
      );

      expect(screen.queryByTestId(TEST_ID.MENU_ITEM_PIN_VIEW)).not.toBeInTheDocument();
      expect(screen.queryByTestId(TEST_ID.MENU_ITEM_UNPIN_VIEW)).not.toBeInTheDocument();
    });
  });

  describe('Edit view flow', () => {
    it('opens edit modal when Edit view is clicked', async () => {
      const user = userEvent.setup();
      render(<ViewOptionsMenu {...defaultProps} />);

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_EDIT_VIEW));

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EDIT_ITEM_MODAL)).toBeInTheDocument();
      });
    });

    it('calls updateView mutation and callbacks when edit save succeeds', async () => {
      const user = userEvent.setup();
      const onRename = vi.fn();
      const onEditDescription = vi.fn();
      render(
        <ViewOptionsMenu
          {...defaultProps}
          view={defaultView}
          onRename={onRename}
          onEditDescription={onEditDescription}
        />
      );

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_EDIT_VIEW));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EDIT_MODAL_SAVE)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.EDIT_MODAL_SAVE));

      await waitFor(() => {
        expect(mockUpdateViewMutateAsync).toHaveBeenCalledWith({
          viewId: 'view-1',
          view: expect.objectContaining({
            title: 'Updated View Name',
            description: 'Updated view description',
          }),
        });
      });
      expect(onRename).toHaveBeenCalledWith('Updated View Name');
      expect(onEditDescription).toHaveBeenCalledWith('Updated view description');
    });

    it('closes edit modal after successful save', async () => {
      const user = userEvent.setup();
      render(<ViewOptionsMenu {...defaultProps} />);

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_EDIT_VIEW));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EDIT_ITEM_MODAL)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.EDIT_MODAL_SAVE));

      await waitFor(() => {
        expect(screen.queryByTestId(TEST_ID.EDIT_ITEM_MODAL)).not.toBeInTheDocument();
      });
    });

    it('logs error when update view mutation fails', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
      mockUpdateViewMutateAsync.mockRejectedValue(new Error('API error'));

      render(<ViewOptionsMenu {...defaultProps} view={defaultView} />);

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_EDIT_VIEW));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EDIT_MODAL_SAVE)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.EDIT_MODAL_SAVE));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('closes edit modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ViewOptionsMenu {...defaultProps} />);

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_EDIT_VIEW));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EDIT_ITEM_MODAL)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.EDIT_MODAL_CLOSE));

      await waitFor(() => {
        expect(screen.queryByTestId(TEST_ID.EDIT_ITEM_MODAL)).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete view flow', () => {
    it('opens delete modal when Delete view is clicked', async () => {
      const user = userEvent.setup();
      render(<ViewOptionsMenu {...defaultProps} />);

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_VIEW));

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.DELETE_CONFIRM_MODAL)).toBeInTheDocument();
      });
    });

    it('calls deleteView mutation and onDelete when delete is confirmed', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <ViewOptionsMenu {...defaultProps} onDelete={onDelete} />
      );

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_VIEW));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.DELETE_MODAL_CONFIRM)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.DELETE_MODAL_CONFIRM));

      await waitFor(() => {
        expect(mockDeleteViewMutateAsync).toHaveBeenCalledWith('view-1');
        expect(onDelete).toHaveBeenCalled();
      });
    });

    it('closes delete modal after confirm', async () => {
      const user = userEvent.setup();
      render(<ViewOptionsMenu {...defaultProps} />);

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_VIEW));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.DELETE_CONFIRM_MODAL)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.DELETE_MODAL_CONFIRM));

      await waitFor(() => {
        expect(screen.queryByTestId(TEST_ID.DELETE_CONFIRM_MODAL)).not.toBeInTheDocument();
      });
    });

    it('closes delete modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<ViewOptionsMenu {...defaultProps} />);

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_VIEW));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.DELETE_MODAL_CANCEL)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.DELETE_MODAL_CANCEL));

      await waitFor(() => {
        expect(screen.queryByTestId(TEST_ID.DELETE_CONFIRM_MODAL)).not.toBeInTheDocument();
      });
    });

    it('logs error when deleteView mutation fails', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
      mockDeleteViewMutateAsync.mockRejectedValue(new Error('Delete failed'));

      render(
        <ViewOptionsMenu
          {...defaultProps}
          view={{ ...defaultView, title: 'View Title' }}
        />
      );

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_VIEW));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.DELETE_MODAL_CONFIRM)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.DELETE_MODAL_CONFIRM));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Pin view', () => {
    it('calls onPinToggle with view id and inverted isPinned when Pin view clicked', async () => {
      const user = userEvent.setup();
      const onPinToggle = vi.fn();
      render(
        <ViewOptionsMenu
          {...defaultProps}
          onPinToggle={onPinToggle}
          isPinned={false}
        />
      );

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_PIN_VIEW));

      expect(onPinToggle).toHaveBeenCalledWith('view-1', true);
    });

    it('calls onPinToggle with false when Unpin view clicked', async () => {
      const user = userEvent.setup();
      const onPinToggle = vi.fn();
      render(
        <ViewOptionsMenu
          {...defaultProps}
          onPinToggle={onPinToggle}
          isPinned
        />
      );

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_UNPIN_VIEW));

      expect(onPinToggle).toHaveBeenCalledWith('view-1', false);
    });
  });

  describe('Edge cases', () => {
    it('uses base_id from view.table when view.base_id is missing', () => {
      const viewWithTable = {
        id: 'view-1',
        title: 'Nested View',
        table: { base_id: 'base-from-table' },
      };

      render(<ViewOptionsMenu {...defaultProps} view={viewWithTable} />);

      expect(useBaseAccessMock).toHaveBeenCalledWith('base-from-table');
    });

    it('uses view.base_id when present', () => {
      render(<ViewOptionsMenu {...defaultProps} view={defaultView} />);

      expect(useBaseAccessMock).toHaveBeenCalledWith('base-1');
    });

    it('does not render Edit when canUpdateView is false and still shows Delete', () => {
      useBaseAccessMock.mockReturnValue({
        canDeleteView: vi.fn().mockReturnValue(true),
        isBaseReadOnly: vi.fn().mockReturnValue(false),
        canUpdateView: vi.fn().mockReturnValue(false),
      } as ReturnType<typeof useBaseAccessMock>);

      render(<ViewOptionsMenu {...defaultProps} />);

      expect(screen.queryByTestId(TEST_ID.MENU_ITEM_EDIT_VIEW)).not.toBeInTheDocument();
      expect(screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_VIEW)).toBeInTheDocument();
    });

    it('does not render Pin when onPinToggle is not provided', () => {
      useBaseAccessMock.mockReturnValue({
        canDeleteView: vi.fn().mockReturnValue(true),
        isBaseReadOnly: vi.fn().mockReturnValue(false),
        canUpdateView: vi.fn().mockReturnValue(true),
      } as ReturnType<typeof useBaseAccessMock>);

      render(<ViewOptionsMenu {...defaultProps} onPinToggle={undefined} />);

      expect(screen.queryByTestId(TEST_ID.MENU_ITEM_PIN_VIEW)).not.toBeInTheDocument();
      expect(screen.queryByTestId(TEST_ID.MENU_ITEM_UNPIN_VIEW)).not.toBeInTheDocument();
    });
  });
});
