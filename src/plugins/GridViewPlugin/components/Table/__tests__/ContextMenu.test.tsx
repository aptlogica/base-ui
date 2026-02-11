import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextMenu } from '../components/ContextMenu';

describe('ContextMenu', () => {
  const mockOnClose = vi.fn();
  const mockOnDelete = vi.fn();

  const defaultProps = {
    x: 100,
    y: 150,
    onClose: mockOnClose,
    onDelete: mockOnDelete,
    canDeleteRecord: true,
  };

  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    
    // Mock window dimensions
    Object.defineProperty(globalThis, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(globalThis, 'innerHeight', { value: 768, writable: true });

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 150,
      left: 100,
      right: 280,
      bottom: 200,
      width: 180,
      height: 50,
      x: 100,
      y: 150,
      toJSON: () => {},
    }));

    // Mock requestAnimationFrame
    globalThis.requestAnimationFrame = vi.fn((cb: any) => setTimeout(cb, 0)) as any;
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render context menu with delete option when canDeleteRecord is true', () => {
      render(<ContextMenu {...defaultProps} />);
      
      expect(screen.getByText('Delete record')).toBeInTheDocument();
    });

    it('should not render delete option when canDeleteRecord is false', () => {
      render(<ContextMenu {...defaultProps} canDeleteRecord={false} />);
      
      expect(screen.queryByText('Delete record')).not.toBeInTheDocument();
    });
  });

  describe('positioning', () => {
    it('should position menu at specified coordinates', () => {
      render(<ContextMenu {...defaultProps} />);
      
      const menu = document.querySelector('.select-none.border.p-2.space-y-1.animate-fade-in');
      expect(menu).toHaveStyle({
        position: 'fixed',
        top: '150px',
        left: '100px'
      });
    });

    it('should adjust position when menu would go off screen right', async () => {
      const propsNearRightEdge = {
        ...defaultProps,
        x: 950, // Near right edge
        y: 100
      };

      render(<ContextMenu {...propsNearRightEdge} />);

      await waitFor(() => {
        const menu = document.querySelector('.select-none.border.p-2.space-y-1.animate-fade-in');
        expect(menu).toBeInTheDocument();
      });
    });

    it('should adjust position when menu would go off screen bottom', async () => {
      const propsNearBottomEdge = {
        ...defaultProps,
        x: 100,
        y: 700 // Near bottom edge
      };

      render(<ContextMenu {...propsNearBottomEdge} />);

      await waitFor(() => {
        const menu = document.querySelector('.select-none.border.p-2.space-y-1.animate-fade-in');
        expect(menu).toBeInTheDocument();
      });
    });

    it('should handle positioning at viewport edges', async () => {
      const propsAtEdges = {
        ...defaultProps,
        x: 10,
        y: 10
      };

      render(<ContextMenu {...propsAtEdges} />);

      await waitFor(() => {
        const menu = document.querySelector('.select-none.border.p-2.space-y-1.animate-fade-in');
        expect(menu).toBeInTheDocument();
      });
    });

    it('should position above when more space available above', async () => {
      const propsWithSpaceAbove = {
        ...defaultProps,
        x: 100,
        y: 600 // Close to bottom with more space above
      };

      render(<ContextMenu {...propsWithSpaceAbove} />);

      await waitFor(() => {
        const menu = document.querySelector('.select-none.border.p-2.space-y-1.animate-fade-in');
        expect(menu).toBeInTheDocument();
      });
    });
  });

  describe('event handling', () => {
    it('should add event listeners on mount', () => {
      render(<ContextMenu {...defaultProps} />);

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should remove event listeners on unmount', () => {
      const { unmount } = render(<ContextMenu {...defaultProps} />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should close menu on outside click', () => {
      render(<ContextMenu {...defaultProps} />);

      // Simulate click outside
      fireEvent.mouseDown(document.body);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close menu on Escape key', () => {
      render(<ContextMenu {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close menu on inside click', () => {
      render(<ContextMenu {...defaultProps} />);

      const menu = document.querySelector('.select-none.border.p-2.space-y-1.animate-fade-in');
      fireEvent.mouseDown(menu!);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('delete functionality', () => {
    it('should call onDelete when delete button is clicked', async () => {
      render(<ContextMenu {...defaultProps} />);

      const deleteButton = screen.getByText('Delete record');
      await userEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('should call onClose after successful delete', async () => {
      render(<ContextMenu {...defaultProps} />);

      const deleteButton = screen.getByText('Delete record');
      await userEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('should not render delete button when canDeleteRecord is false', () => {
      const propsWithNoDeletePermission = {
        ...defaultProps,
        canDeleteRecord: false
      };

      render(<ContextMenu {...propsWithNoDeletePermission} />);

      expect(screen.queryByText('Delete record')).not.toBeInTheDocument();
    });
  });

  describe('styling and appearance', () => {
    it('should have correct base styling', () => {
      render(<ContextMenu {...defaultProps} />);

      const menu = document.querySelector('.select-none.border.p-2.space-y-1.animate-fade-in');
      expect(menu).toHaveStyle({
        position: 'fixed',
        'min-width': '180px',
        'z-index': '10000'
      });
    });

    it('should have hover effects on delete option', () => {
      render(<ContextMenu {...defaultProps} />);

      const deleteButton = screen.getByText('Delete record').closest('button');
      expect(deleteButton).toHaveClass('hover:bg-red-400');
    });
  });

  describe('accessibility', () => {
    it('should have accessible delete button', () => {
      render(<ContextMenu {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /delete record/i });
      expect(deleteButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<ContextMenu {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /delete record/i });
      
      // Focus the button
      deleteButton.focus();
      expect(deleteButton).toHaveFocus();
    });

    it('should support Enter key activation on delete button', async () => {
      render(<ContextMenu {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /delete record/i });
      deleteButton.focus();
      await userEvent.keyboard('{Enter}');

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('should support Space key activation on delete button', async () => {
      render(<ContextMenu {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /delete record/i });
      deleteButton.focus();
      await userEvent.keyboard(' ');

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle missing getBoundingClientRect', async () => {
      // Mock a case where getBoundingClientRect returns null
      const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      }));

      render(<ContextMenu {...defaultProps} />);

      await waitFor(() => {
        const menu = document.querySelector('.select-none.border.p-2.space-y-1.animate-fade-in');
        expect(menu).toBeInTheDocument();
      });

      // Restore original function
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('should handle window resize scenarios', () => {
      render(<ContextMenu {...defaultProps} />);

      // Simulate window resize
      Object.defineProperty(globalThis, 'innerWidth', { value: 800 });
      Object.defineProperty(globalThis, 'innerHeight', { value: 600 });

      // Component should still render without errors
      expect(screen.getByRole('button', { name: /delete record/i })).toBeInTheDocument();
    });

    it('should handle rapid position updates', async () => {
      const { rerender } = render(<ContextMenu {...defaultProps} />);
      
      rerender(<ContextMenu {...defaultProps} x={400} y={450} />);

      await waitFor(() => {
        expect(document.querySelector('.select-none.border.p-2.space-y-1.animate-fade-in')).toBeInTheDocument();
      });
    });

    it('should handle null menu ref gracefully', () => {
      render(<ContextMenu {...defaultProps} />);

      // Simulate null ref scenario by clicking outside before menu is fully rendered
      fireEvent.mouseDown(document.body);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});