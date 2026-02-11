import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CreateViewPopover } from '../CreateViewPopover';

const mockOnOpenModal = vi.fn();
const mockOnClose = vi.fn();
const mockSetPopoverRef = vi.fn();

const mockAnchorRef = { current: document.createElement('button') };

vi.mock('../../../../types/viewTypes', () => ({
  VIEW_TYPES: [
    { type: 'grid', label: 'Grid' },
    { type: 'kanban', label: 'Kanban' },
  ],
  VIEW_ICONS: {
    grid: { icon: () => null, color: '#38bdf8' },
    kanban: { icon: () => null, color: '#f59e42' },
  },
}));

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe('CreateViewPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(mockAnchorRef.current, 'getBoundingClientRect', {
      value: () => ({
        top: 100,
        left: 50,
        bottom: 130,
        right: 200,
        width: 150,
        height: 30,
        x: 50,
        y: 100,
        toJSON: () => ({}),
      }),
      configurable: true,
    });
  });

  describe('Rendering', () => {
    it('should render popover with view type options from VIEW_TYPES', () => {
      render(
        <CreateViewPopover
          anchorRef={mockAnchorRef as React.RefObject<HTMLElement>}
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
          setPopoverRef={mockSetPopoverRef}
        />
      );
      expect(screen.getByText('Grid')).toBeInTheDocument();
      expect(screen.getByText('Kanban')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call onOpenModal with view type when option is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CreateViewPopover
          anchorRef={mockAnchorRef as React.RefObject<HTMLElement>}
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
          setPopoverRef={mockSetPopoverRef}
        />
      );
      const gridButton = screen.getByRole('button', { name: /grid/i });

      await user.click(gridButton);

      expect(mockOnOpenModal).toHaveBeenCalledWith('grid');
    });

    it('should call onOpenModal with kanban when Kanban is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CreateViewPopover
          anchorRef={mockAnchorRef as React.RefObject<HTMLElement>}
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
          setPopoverRef={mockSetPopoverRef}
        />
      );
      const kanbanButton = screen.getByRole('button', { name: /kanban/i });

      await user.click(kanbanButton);

      expect(mockOnOpenModal).toHaveBeenCalledWith('kanban');
    });

    it('should call onClose when option is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CreateViewPopover
          anchorRef={mockAnchorRef as React.RefObject<HTMLElement>}
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
          setPopoverRef={mockSetPopoverRef}
        />
      );
      await user.click(screen.getByRole('button', { name: /grid/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Click outside', () => {
    it('should call onClose when mousedown occurs outside popover', () => {
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <CreateViewPopover
            anchorRef={mockAnchorRef as React.RefObject<HTMLElement>}
            onOpenModal={mockOnOpenModal}
            onClose={mockOnClose}
            setPopoverRef={mockSetPopoverRef}
          />
        </div>
      );
      const outside = screen.getByTestId('outside');

      act(() => {
        outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('setPopoverRef', () => {
    it('should call setPopoverRef when popover is mounted', () => {
      render(
        <CreateViewPopover
          anchorRef={mockAnchorRef as React.RefObject<HTMLElement>}
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
          setPopoverRef={mockSetPopoverRef}
        />
      );
      expect(mockSetPopoverRef).toHaveBeenCalled();
    });
  });
});
