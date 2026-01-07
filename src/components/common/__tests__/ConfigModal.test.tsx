import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigModal from '../ConfigModal';

describe('ConfigModal', () => {
  beforeEach(() => {
    // Clear any previous body class modifications
    document.body.classList.remove('overflow-hidden');
  });

  afterEach(() => {
    document.body.classList.remove('overflow-hidden');
  });

  describe('Visibility', () => {
    it('renders null when open is false', () => {
      const { container } = render(
        <ConfigModal open={false} onClose={vi.fn()}>
          <div>Modal Content</div>
        </ConfigModal>
      );
      
      expect(container).toBeEmptyDOMElement();
    });

    it('renders modal content when open is true', () => {
      render(
        <ConfigModal open={true} onClose={vi.fn()}>
          <div>Modal Content</div>
        </ConfigModal>
      );
      
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('displays Plugin Settings title', () => {
      render(
        <ConfigModal open={true} onClose={vi.fn()}>
          <div>Content</div>
        </ConfigModal>
      );
      
      expect(screen.getByText('Plugin Settings')).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('renders close button with correct aria-label', () => {
      render(
        <ConfigModal open={true} onClose={vi.fn()}>
          <div>Content</div>
        </ConfigModal>
      );
      
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      render(
        <ConfigModal open={true} onClose={onClose}>
          <div>Content</div>
        </ConfigModal>
      );
      
      await user.click(screen.getByRole('button', { name: 'Close' }));
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backdrop Behavior', () => {
    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      const { container } = render(
        <ConfigModal open={true} onClose={onClose}>
          <div>Content</div>
        </ConfigModal>
      );
      
      // Click on the backdrop (first child element with bg-modal-backdrop class)
      const backdrop = container.firstElementChild;
      if (backdrop) {
        await user.click(backdrop);
      }
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when modal content is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      render(
        <ConfigModal open={true} onClose={onClose}>
          <div data-testid="modal-content">Content</div>
        </ConfigModal>
      );
      
      await user.click(screen.getByTestId('modal-content'));
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Lock', () => {
    it('adds overflow-hidden class to body when opened', () => {
      render(
        <ConfigModal open={true} onClose={vi.fn()}>
          <div>Content</div>
        </ConfigModal>
      );
      
      expect(document.body.classList.contains('overflow-hidden')).toBe(true);
    });

    it('removes overflow-hidden class from body when closed', () => {
      const { rerender } = render(
        <ConfigModal open={true} onClose={vi.fn()}>
          <div>Content</div>
        </ConfigModal>
      );
      
      expect(document.body.classList.contains('overflow-hidden')).toBe(true);
      
      rerender(
        <ConfigModal open={false} onClose={vi.fn()}>
          <div>Content</div>
        </ConfigModal>
      );
      
      expect(document.body.classList.contains('overflow-hidden')).toBe(false);
    });

    it('cleans up overflow-hidden class on unmount', () => {
      const { unmount } = render(
        <ConfigModal open={true} onClose={vi.fn()}>
          <div>Content</div>
        </ConfigModal>
      );
      
      expect(document.body.classList.contains('overflow-hidden')).toBe(true);
      
      unmount();
      
      expect(document.body.classList.contains('overflow-hidden')).toBe(false);
    });
  });

  describe('Children Rendering', () => {
    it('renders single child element', () => {
      render(
        <ConfigModal open={true} onClose={vi.fn()}>
          <p>Single child</p>
        </ConfigModal>
      );
      
      expect(screen.getByText('Single child')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <ConfigModal open={true} onClose={vi.fn()}>
          <div>First child</div>
          <div>Second child</div>
          <div>Third child</div>
        </ConfigModal>
      );
      
      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
      expect(screen.getByText('Third child')).toBeInTheDocument();
    });

    it('renders complex nested children', () => {
      render(
        <ConfigModal open={true} onClose={vi.fn()}>
          <div>
            <h3>Section Title</h3>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </ConfigModal>
      );
      
      expect(screen.getByText('Section Title')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('renders with no children', () => {
      render(
        <ConfigModal open={true} onClose={vi.fn()}>
          {null}
        </ConfigModal>
      );
      
      expect(screen.getByText('Plugin Settings')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies correct modal container classes', () => {
      const { container } = render(
        <ConfigModal open={true} onClose={vi.fn()}>
          <div>Content</div>
        </ConfigModal>
      );
      
      const modalContent = container.querySelector('.rounded-2xl');
      expect(modalContent).toBeInTheDocument();
    });

    it('has sticky header', () => {
      const { container } = render(
        <ConfigModal open={true} onClose={vi.fn()}>
          <div>Content</div>
        </ConfigModal>
      );
      
      const header = container.querySelector('.sticky');
      expect(header).toBeInTheDocument();
    });
  });
});

