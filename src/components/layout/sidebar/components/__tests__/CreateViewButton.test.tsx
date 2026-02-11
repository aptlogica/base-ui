import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CreateViewButton } from '../CreateViewButton';

const mockOnOpenModal = vi.fn();
const mockSetPopoverRef = vi.fn();

const mockTable = {
  id: 'table-1',
  base_id: 'base-1',
  workspace_id: 'ws-1',
  title: 'Test Table',
};

vi.mock('../CreateViewPopover', () => ({
  CreateViewPopover: ({
    onOpenModal,
    onClose,
  }: {
    onOpenModal: (type: string) => void;
    onClose: () => void;
  }) => (
    <div data-testid="create-view-popover">
      <button type="button" onClick={() => onOpenModal('grid')}>
        Grid
      </button>
      <button type="button" onClick={onClose}>
        Close Popover
      </button>
    </div>
  ),
}));

describe('CreateViewButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render Create View button', () => {
      render(
        <CreateViewButton
          table={mockTable}
          onOpenModal={mockOnOpenModal}
          setPopoverRef={mockSetPopoverRef}
        />
      );
      expect(screen.getByRole('button', { name: /create view/i })).toBeInTheDocument();
    });

    it('should not render popover when closed', () => {
      render(
        <CreateViewButton
          table={mockTable}
          onOpenModal={mockOnOpenModal}
          setPopoverRef={mockSetPopoverRef}
        />
      );
      expect(screen.queryByTestId('create-view-popover')).not.toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should open popover when button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CreateViewButton
          table={mockTable}
          onOpenModal={mockOnOpenModal}
          setPopoverRef={mockSetPopoverRef}
        />
      );
      const button = screen.getByRole('button', { name: /create view/i });

      await user.click(button);

      expect(screen.getByTestId('create-view-popover')).toBeInTheDocument();
    });

    it('should close popover when Close Popover is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CreateViewButton
          table={mockTable}
          onOpenModal={mockOnOpenModal}
          setPopoverRef={mockSetPopoverRef}
        />
      );
      await user.click(screen.getByRole('button', { name: /create view/i }));
      expect(screen.getByTestId('create-view-popover')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /close popover/i }));

      expect(screen.queryByTestId('create-view-popover')).not.toBeInTheDocument();
    });

    it('should call onOpenModal with view type when Grid is selected', async () => {
      const user = userEvent.setup();
      render(
        <CreateViewButton
          table={mockTable}
          onOpenModal={mockOnOpenModal}
          setPopoverRef={mockSetPopoverRef}
        />
      );
      await user.click(screen.getByRole('button', { name: /create view/i }));
      await user.click(screen.getByRole('button', { name: /grid/i }));

      expect(mockOnOpenModal).toHaveBeenCalledWith('grid');
    });

    it('should close popover after onOpenModal is called', async () => {
      const user = userEvent.setup();
      render(
        <CreateViewButton
          table={mockTable}
          onOpenModal={mockOnOpenModal}
          setPopoverRef={mockSetPopoverRef}
        />
      );
      await user.click(screen.getByRole('button', { name: /create view/i }));
      await user.click(screen.getByRole('button', { name: /grid/i }));

      expect(mockOnOpenModal).toHaveBeenCalledWith('grid');
      expect(screen.queryByTestId('create-view-popover')).not.toBeInTheDocument();
    });

    it('should toggle popover on second button click', async () => {
      const user = userEvent.setup();
      render(
        <CreateViewButton
          table={mockTable}
          onOpenModal={mockOnOpenModal}
          setPopoverRef={mockSetPopoverRef}
        />
      );
      const button = screen.getByRole('button', { name: /create view/i });

      await user.click(button);
      expect(screen.getByTestId('create-view-popover')).toBeInTheDocument();

      await user.click(button);
      expect(screen.queryByTestId('create-view-popover')).not.toBeInTheDocument();
    });
  });
});
