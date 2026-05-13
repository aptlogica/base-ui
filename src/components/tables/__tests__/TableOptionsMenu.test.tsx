import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import TableOptionsMenu from '../TableOptionsMenu';
import { useBaseAccess } from '../../../hooks/useBaseAccess';

const noop = (): void => { };

const TEST_ID = {
  POPOVER_MENU: 'popover-menu',
  EDIT_ITEM_MODAL: 'edit-item-modal',
  EDIT_MODAL_SAVE: 'edit-modal-save',
  EDIT_MODAL_CLOSE: 'edit-modal-close',
  DELETE_CONFIRM_MODAL: 'delete-confirm-modal',
  DELETE_MODAL_CONFIRM: 'delete-modal-confirm',
  DELETE_MODAL_CANCEL: 'delete-modal-cancel',
  MENU_ITEM_EDIT_TABLE: 'menu-item-edit-table',
  MENU_ITEM_DELETE_TABLE: 'menu-item-delete-table',
  MENU_ITEM_PIN_TABLE: 'menu-item-pin-table',
  MENU_ITEM_UNPIN_TABLE: 'menu-item-unpin-table',
} as const;

const mockMutateAsync = vi.fn();

vi.mock('../../../hooks/useApi', () => ({
  useUpdateTable: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

vi.mock('../../../hooks/useBaseAccess', () => ({
  useBaseAccess: vi.fn(),
}));

const useBaseAccessMock = vi.mocked(useBaseAccess);

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
    onSave: (data: { name: string; description: string }) => void;
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
            onSave({ name: 'Updated Table Name', description: 'Updated description' }).catch(noop);
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
    onConfirm: () => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid={TEST_ID.DELETE_CONFIRM_MODAL}>
        <button type="button" onClick={onClose} data-testid={TEST_ID.DELETE_MODAL_CANCEL}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} data-testid={TEST_ID.DELETE_MODAL_CONFIRM}>
          Delete
        </button>
      </div>
    ) : null,
}));

describe('TableOptionsMenu', () => {
  const defaultTable = {
    id: 'table-1',
    name: 'My Table',
    title: 'My Table',
    description: 'Table description',
    base_id: 'base-1',
  };

  const defaultProps = {
    table: defaultTable,
    onRename: vi.fn(),
    onEditDescription: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue(undefined);
    useBaseAccessMock.mockReturnValue({
      canDeleteTable: vi.fn().mockReturnValue(true),
      isBaseReadOnly: vi.fn().mockReturnValue(false),
      canUpdateTable: vi.fn().mockReturnValue(true),
    } as ReturnType<typeof useBaseAccessMock>);
  });

  describe('Rendering', () => {
    it('returns null when no menu items are available', () => {
      useBaseAccessMock.mockReturnValue({
        canDeleteTable: vi.fn().mockReturnValue(false),
        isBaseReadOnly: vi.fn().mockReturnValue(true),
        canUpdateTable: vi.fn().mockReturnValue(false),
      } as ReturnType<typeof useBaseAccessMock>);

      const { container } = render(
        <TableOptionsMenu {...defaultProps} onPinToggle={undefined} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders PopoverMenu when at least one menu item is available', () => {
      render(<TableOptionsMenu {...defaultProps} />);

      expect(screen.getByTestId(TEST_ID.POPOVER_MENU)).toBeInTheDocument();
    });

    it('renders Edit table menu item when canUpdateTable and not read-only', () => {
      render(<TableOptionsMenu {...defaultProps} />);

      expect(
        screen.getByTestId(TEST_ID.MENU_ITEM_EDIT_TABLE)
      ).toBeInTheDocument();
    });

    it('renders Delete table menu item when canDeleteTable', () => {
      render(<TableOptionsMenu {...defaultProps} />);

      expect(
        screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_TABLE)
      ).toBeInTheDocument();
    });

    it('renders Pin table menu item when onPinToggle provided and not read-only', () => {
      const onPinToggle = vi.fn();
      render(<TableOptionsMenu {...defaultProps} onPinToggle={onPinToggle} />);

      expect(
        screen.getByTestId(TEST_ID.MENU_ITEM_PIN_TABLE)
      ).toBeInTheDocument();
    });

    it('renders Unpin table when isPinned is true and onPinToggle provided', () => {
      const onPinToggle = vi.fn();
      render(
        <TableOptionsMenu {...defaultProps} onPinToggle={onPinToggle} isPinned />
      );

      expect(
        screen.getByTestId(TEST_ID.MENU_ITEM_UNPIN_TABLE)
      ).toBeInTheDocument();
    });

    it('does not render Pin item when isBaseReadOnly returns true', () => {
      useBaseAccessMock.mockReturnValue({
        canDeleteTable: vi.fn().mockReturnValue(true),
        isBaseReadOnly: vi.fn().mockReturnValue(true),
        canUpdateTable: vi.fn().mockReturnValue(true),
      } as ReturnType<typeof useBaseAccessMock>);

      render(
        <TableOptionsMenu {...defaultProps} onPinToggle={vi.fn()} />
      );

      expect(screen.queryByTestId(TEST_ID.MENU_ITEM_PIN_TABLE)).not.toBeInTheDocument();
      expect(screen.queryByTestId(TEST_ID.MENU_ITEM_UNPIN_TABLE)).not.toBeInTheDocument();
    });
  });

  describe('Edit table flow', () => {
    it('opens edit modal when Edit table is clicked', async () => {
      const user = userEvent.setup();
      render(<TableOptionsMenu {...defaultProps} />);

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_EDIT_TABLE));

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EDIT_ITEM_MODAL)).toBeInTheDocument();
      });
    });

    it('calls updateTable mutation and callbacks when edit save succeeds', async () => {
      const user = userEvent.setup();
      const onRename = vi.fn();
      const onEditDescription = vi.fn();
      render(
        <TableOptionsMenu
          {...defaultProps}
          table={defaultTable}
          onRename={onRename}
          onEditDescription={onEditDescription}
        />
      );

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_EDIT_TABLE));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EDIT_MODAL_SAVE)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.EDIT_MODAL_SAVE));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          tableId: 'table-1',
          params: expect.objectContaining({
            title: 'Updated Table Name',
            description: 'Updated description',
          }),
        });
      });
      expect(onRename).toHaveBeenCalledWith('Updated Table Name');
      expect(onEditDescription).toHaveBeenCalledWith('Updated description');
    });

    it('closes edit modal after successful save', async () => {
      const user = userEvent.setup();
      render(<TableOptionsMenu {...defaultProps} />);

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_EDIT_TABLE));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EDIT_ITEM_MODAL)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.EDIT_MODAL_SAVE));

      await waitFor(() => {
        expect(screen.queryByTestId(TEST_ID.EDIT_ITEM_MODAL)).not.toBeInTheDocument();
      });
    });

    it('shows alert and rethrows when update table mutation fails', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(global, 'alert').mockImplementation(noop);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
      mockMutateAsync.mockRejectedValue(new Error('Network error'));

      render(<TableOptionsMenu {...defaultProps} table={defaultTable} />);

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_EDIT_TABLE));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EDIT_MODAL_SAVE)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.EDIT_MODAL_SAVE));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Failed to update table "My Table". Please try again.'
        );
      });

      alertSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('closes edit modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<TableOptionsMenu {...defaultProps} />);

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_EDIT_TABLE));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EDIT_ITEM_MODAL)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.EDIT_MODAL_CLOSE));

      await waitFor(() => {
        expect(screen.queryByTestId(TEST_ID.EDIT_ITEM_MODAL)).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete table flow', () => {
    it('opens delete modal when Delete table is clicked', async () => {
      const user = userEvent.setup();
      render(<TableOptionsMenu {...defaultProps} />);

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_TABLE));

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.DELETE_CONFIRM_MODAL)).toBeInTheDocument();
      });
    });

    it('calls handleTableDeletion and onDelete when delete is confirmed', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <TableOptionsMenu {...defaultProps} onDelete={onDelete} />
      );

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_TABLE));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.DELETE_MODAL_CONFIRM)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.DELETE_MODAL_CONFIRM));

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
      });
    });

    it('closes delete modal after confirm', async () => {
      const user = userEvent.setup();
      render(<TableOptionsMenu {...defaultProps} />);

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_TABLE));
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
      render(<TableOptionsMenu {...defaultProps} />);

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_TABLE));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.DELETE_MODAL_CANCEL)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.DELETE_MODAL_CANCEL));

      await waitFor(() => {
        expect(screen.queryByTestId(TEST_ID.DELETE_CONFIRM_MODAL)).not.toBeInTheDocument();
      });
    });

    it('shows alert when handleTableDeletion throws', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(global, 'alert').mockImplementation(noop);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
      const onDelete = vi.fn().mockRejectedValue(new Error('Forbidden'));

      render(
        <TableOptionsMenu
          {...defaultProps}
          onDelete={onDelete}
          table={{ ...defaultTable, title: 'Table Title' }}
        />
      );

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_TABLE));
      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.DELETE_MODAL_CONFIRM)).toBeInTheDocument();
      });
      await user.click(screen.getByTestId(TEST_ID.DELETE_MODAL_CONFIRM));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Failed to delete table "Table Title". Please try again.'
        );
      });

      alertSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Pin table', () => {
    it('calls onPinToggle with table id and inverted isPinned when Pin table clicked', async () => {
      const user = userEvent.setup();
      const onPinToggle = vi.fn();
      render(
        <TableOptionsMenu
          {...defaultProps}
          onPinToggle={onPinToggle}
          isPinned={false}
        />
      );

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_PIN_TABLE));

      expect(onPinToggle).toHaveBeenCalledWith('table-1', true);
    });

    it('calls onPinToggle with false when Unpin table clicked', async () => {
      const user = userEvent.setup();
      const onPinToggle = vi.fn();
      render(
        <TableOptionsMenu
          {...defaultProps}
          onPinToggle={onPinToggle}
          isPinned
        />
      );

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_UNPIN_TABLE));

      expect(onPinToggle).toHaveBeenCalledWith('table-1', false);
    });
  });

  describe('Edge cases', () => {
    it('uses table.name when table.title is missing for delete alert', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(global, 'alert').mockImplementation(noop);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
      const onDelete = vi.fn().mockRejectedValue(new Error('Err'));

      render(
        <TableOptionsMenu
          {...defaultProps}
          onDelete={onDelete}
          table={{ id: 't1', name: 'Fallback Name', base_id: 'b1' }}
        />
      );

      await user.click(screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_TABLE));
      await user.click(screen.getByTestId(TEST_ID.DELETE_MODAL_CONFIRM));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Failed to delete table "Fallback Name". Please try again.'
        );
      });

      alertSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('does not render Edit when canUpdateTable is false and still shows Delete', () => {
      useBaseAccessMock.mockReturnValue({
        canDeleteTable: vi.fn().mockReturnValue(true),
        isBaseReadOnly: vi.fn().mockReturnValue(false),
        canUpdateTable: vi.fn().mockReturnValue(false),
      } as ReturnType<typeof useBaseAccessMock>);

      render(<TableOptionsMenu {...defaultProps} />);

      expect(screen.queryByTestId(TEST_ID.MENU_ITEM_EDIT_TABLE)).not.toBeInTheDocument();
      expect(screen.getByTestId(TEST_ID.MENU_ITEM_DELETE_TABLE)).toBeInTheDocument();
    });

    it('does not render Pin when onPinToggle is not provided', () => {
      useBaseAccessMock.mockReturnValue({
        canDeleteTable: vi.fn().mockReturnValue(true),
        isBaseReadOnly: vi.fn().mockReturnValue(false),
        canUpdateTable: vi.fn().mockReturnValue(true),
      } as ReturnType<typeof useBaseAccessMock>);

      render(<TableOptionsMenu {...defaultProps} onPinToggle={undefined} />);

      expect(screen.queryByTestId(TEST_ID.MENU_ITEM_PIN_TABLE)).not.toBeInTheDocument();
      expect(screen.queryByTestId(TEST_ID.MENU_ITEM_UNPIN_TABLE)).not.toBeInTheDocument();
    });
  });
});
