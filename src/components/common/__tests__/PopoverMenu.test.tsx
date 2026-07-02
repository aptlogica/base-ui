import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PopoverMenu } from '../PopoverMenu';

// Mock ReactDOM.createPortal for portaled tests
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (element: React.ReactNode) => element,
  };
});

describe('PopoverMenu', () => {
  const mockItems = [
    { label: 'Edit', onClick: vi.fn(), icon: <span>✏️</span> },
    { label: 'Delete', onClick: vi.fn(), danger: true, icon: <span>🗑️</span> },
    { label: 'Share', onClick: vi.fn() },
    { label: 'Disabled Action', onClick: vi.fn(), disabled: true },
  ];

  const defaultProps = {
    trigger: <span>Open Menu</span>,
    items: mockItems,
  };

  // Store original requestAnimationFrame
  const originalRAF = global.requestAnimationFrame;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body for portal tests
    document.body.innerHTML = '';
    // Mock requestAnimationFrame to execute callback synchronously
    global.requestAnimationFrame = vi.fn((callback) => {
      // Don't execute the callback - prevents issues with refs being null after cleanup
      return 0;
    });
  });

  afterEach(() => {
    // Restore original requestAnimationFrame
    global.requestAnimationFrame = originalRAF;
    cleanup();
  });

  describe('Trigger Rendering', () => {
    it('renders the trigger element', () => {
      render(<PopoverMenu {...defaultProps} />);
      
      expect(screen.getByText('Open Menu')).toBeInTheDocument();
    });

    it('renders trigger button with correct aria attributes', () => {
      render(<PopoverMenu {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when menu is opened', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      await user.click(trigger);
      
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Menu Opening/Closing', () => {
    it('menu is hidden initially', () => {
      render(<PopoverMenu {...defaultProps} />);
      
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('opens menu when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
    });

    it('closes menu when trigger is clicked again', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      await user.click(trigger);
      expect(screen.getByText('Edit')).toBeInTheDocument();
      
      await user.click(trigger);
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('closes menu when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <PopoverMenu {...defaultProps} />
          <div data-testid="outside">Outside element</div>
        </div>
      );
      
      await user.click(screen.getByRole('button'));
      expect(screen.getByText('Edit')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('outside'));
      
      await waitFor(() => {
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      });
    });
  });

  describe('Menu Item Interactions', () => {
    it('calls onClick handler when menu item is clicked', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Edit'));
      
      expect(mockItems[0].onClick).toHaveBeenCalledTimes(1);
    });

    it('closes menu after clicking a menu item', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Edit'));
      
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('renders icons when provided', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('✏️')).toBeInTheDocument();
      expect(screen.getByText('🗑️')).toBeInTheDocument();
    });

    it('does not call onClick for disabled items', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Disabled Action'));
      
      expect(mockItems[3].onClick).not.toHaveBeenCalled();
    });

    it('applies danger styling to danger items', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      
      const deleteButton = screen.getByText('Delete').closest('button');
      expect(deleteButton).toHaveClass('text-red-600');
    });

    it('applies disabled styling to disabled items', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      
      const disabledButton = screen.getByText('Disabled Action').closest('button');
      expect(disabledButton).toBeDisabled();
      expect(disabledButton).toHaveClass('opacity-50');
    });
  });

  describe('Alignment Options', () => {
    it('uses auto alignment by default', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      
      // Menu should be visible
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('accepts left alignment', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} align="left" />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('accepts right alignment', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} align="right" />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  describe('Portal Mode', () => {
    it('renders in non-portal mode by default', async () => {
      const user = userEvent.setup();
      const { container } = render(<PopoverMenu {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      
      // Menu should be within the container (not portaled)
      expect(container.querySelector('.min-w-\\[210px\\]')).toBeInTheDocument();
    });

    it('renders in portal mode when portaled is true', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} portaled={true} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('applies fixed positioning in portal mode', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} portaled={true} />);
      
      await user.click(screen.getByRole('button'));
      
      // In portal mode, the menu has 'fixed' class for positioning
      // Since createPortal is mocked to render inline, we search the document
      const menu = document.querySelector('.fixed.z-\\[9999\\]');
      expect(menu).toBeInTheDocument();
    });
  });

  describe('Custom Class Name', () => {
    it('applies custom className to container', () => {
      render(<PopoverMenu {...defaultProps} className="custom-class" />);
      
      expect(document.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Event Propagation', () => {
    it('stops propagation when trigger is clicked', async () => {
      const parentClickHandler = vi.fn();
      const user = userEvent.setup();
      
      render(
        <div onClick={parentClickHandler}>
          <PopoverMenu {...defaultProps} />
        </div>
      );
      
      await user.click(screen.getByRole('button'));
      
      // Parent click should not be called due to stopPropagation
      expect(parentClickHandler).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Menu Items', () => {
    it('renders all menu items', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.getByText('Disabled Action')).toBeInTheDocument();
    });

    it('handles empty items array', async () => {
      const user = userEvent.setup();
      render(<PopoverMenu trigger={<span>Open</span>} items={[]} />);
      
      await user.click(screen.getByRole('button'));
      
      // Menu should still open but be empty
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    });

    it('handles single item', async () => {
      const user = userEvent.setup();
      const singleItem = [{ label: 'Only Option', onClick: vi.fn() }];
      
      render(<PopoverMenu trigger={<span>Open</span>} items={singleItem} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('Only Option')).toBeInTheDocument();
    });
  });

  describe('Delete/Remove Special Styling', () => {
    it('applies red styling for items with delete in label', async () => {
      const user = userEvent.setup();
      const deleteItem = [{ label: 'Delete Item', onClick: vi.fn(), danger: true }];
      
      render(<PopoverMenu trigger={<span>Open</span>} items={deleteItem} />);
      
      await user.click(screen.getByRole('button'));
      
      const button = screen.getByText('Delete Item').closest('button');
      expect(button).toHaveClass('text-red-600');
    });

    it('applies red styling for items with remove in label', async () => {
      const user = userEvent.setup();
      const removeItem = [{ label: 'Remove User', onClick: vi.fn(), danger: true }];
      
      render(<PopoverMenu trigger={<span>Open</span>} items={removeItem} />);
      
      await user.click(screen.getByRole('button'));
      
      const button = screen.getByText('Remove User').closest('button');
      expect(button).toHaveClass('text-red-600');
    });
  });
});
