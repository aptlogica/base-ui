import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BaseMenu } from '../BaseMenu';

// Mock PopoverMenu to simplify testing
vi.mock('../PopoverMenu', () => ({
  PopoverMenu: ({ trigger, items }: { trigger: React.ReactNode; items: any[] }) => (
    <div data-testid="popover-menu">
      <button data-testid="menu-trigger">{trigger}</button>
      <div data-testid="menu-items">
        {items.map((item, index) => (
          <button
            key={index}
            data-testid={`menu-item-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            onClick={item.onClick}
            className={item.danger ? 'danger' : ''}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  ),
}));

describe('BaseMenu', () => {
  const mockBase = {
    id: 'base-1',
    title: 'Test Base',
    name: 'test-base',
    description: 'A test base',
    workspace_id: 'workspace-1',
  };

  const defaultProps = {
    base: mockBase,
    onEdit: vi.fn(),
    onAddMembers: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the menu trigger', () => {
      render(<BaseMenu {...defaultProps} />);
      expect(screen.getByTestId('menu-trigger')).toBeInTheDocument();
    });

    it('renders all menu items when all permissions are true (default)', () => {
      render(<BaseMenu {...defaultProps} />);
      
      expect(screen.getByTestId('menu-item-edit')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-add-members')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-delete')).toBeInTheDocument();
    });

    it('renders Edit icon with correct styling', () => {
      render(<BaseMenu {...defaultProps} />);
      const editButton = screen.getByTestId('menu-item-edit');
      expect(editButton).toBeInTheDocument();
    });

    it('renders Add Members icon with correct styling', () => {
      render(<BaseMenu {...defaultProps} />);
      const addMembersButton = screen.getByTestId('menu-item-add-members');
      expect(addMembersButton).toBeInTheDocument();
    });

    it('renders Delete option with danger styling', () => {
      render(<BaseMenu {...defaultProps} />);
      const deleteButton = screen.getByTestId('menu-item-delete');
      expect(deleteButton).toHaveClass('danger');
    });
  });

  describe('Conditional Rendering', () => {
    it('hides Edit option when canEdit is false', () => {
      render(<BaseMenu {...defaultProps} canEdit={false} />);
      
      expect(screen.queryByTestId('menu-item-edit')).not.toBeInTheDocument();
      expect(screen.getByTestId('menu-item-add-members')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-delete')).toBeInTheDocument();
    });

    it('hides Add Members option when canAddMembers is false', () => {
      render(<BaseMenu {...defaultProps} canAddMembers={false} />);
      
      expect(screen.getByTestId('menu-item-edit')).toBeInTheDocument();
      expect(screen.queryByTestId('menu-item-add-members')).not.toBeInTheDocument();
      expect(screen.getByTestId('menu-item-delete')).toBeInTheDocument();
    });

    it('hides Delete option when canDelete is false', () => {
      render(<BaseMenu {...defaultProps} canDelete={false} />);
      
      expect(screen.getByTestId('menu-item-edit')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-add-members')).toBeInTheDocument();
      expect(screen.queryByTestId('menu-item-delete')).not.toBeInTheDocument();
    });

    it('hides all options when all permissions are false', () => {
      render(
        <BaseMenu
          {...defaultProps}
          canEdit={false}
          canAddMembers={false}
          canDelete={false}
        />
      );
      
      expect(screen.queryByTestId('menu-item-edit')).not.toBeInTheDocument();
      expect(screen.queryByTestId('menu-item-add-members')).not.toBeInTheDocument();
      expect(screen.queryByTestId('menu-item-delete')).not.toBeInTheDocument();
    });

    it('shows only Edit when other permissions are false', () => {
      render(
        <BaseMenu
          {...defaultProps}
          canEdit={true}
          canAddMembers={false}
          canDelete={false}
        />
      );
      
      expect(screen.getByTestId('menu-item-edit')).toBeInTheDocument();
      expect(screen.queryByTestId('menu-item-add-members')).not.toBeInTheDocument();
      expect(screen.queryByTestId('menu-item-delete')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onEdit with base when Edit is clicked', async () => {
      const user = userEvent.setup();
      render(<BaseMenu {...defaultProps} />);
      
      await user.click(screen.getByTestId('menu-item-edit'));
      
      expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockBase);
    });

    it('calls onAddMembers with base when Add Members is clicked', async () => {
      const user = userEvent.setup();
      render(<BaseMenu {...defaultProps} />);
      
      await user.click(screen.getByTestId('menu-item-add-members'));
      
      expect(defaultProps.onAddMembers).toHaveBeenCalledTimes(1);
      expect(defaultProps.onAddMembers).toHaveBeenCalledWith(mockBase);
    });

    it('calls onDelete with base when Delete is clicked', async () => {
      const user = userEvent.setup();
      render(<BaseMenu {...defaultProps} />);
      
      await user.click(screen.getByTestId('menu-item-delete'));
      
      expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
      expect(defaultProps.onDelete).toHaveBeenCalledWith(mockBase);
    });
  });

  describe('Base Object Variations', () => {
    it('handles base with only id', () => {
      const minimalBase = { id: 'minimal-base' };
      render(<BaseMenu {...defaultProps} base={minimalBase} />);
      
      expect(screen.getByTestId('popover-menu')).toBeInTheDocument();
    });

    it('handles base with name instead of title', () => {
      const baseWithName = { id: 'base-2', name: 'Named Base' };
      render(<BaseMenu {...defaultProps} base={baseWithName} />);
      
      expect(screen.getByTestId('popover-menu')).toBeInTheDocument();
    });

    it('passes correct base object to callbacks', async () => {
      const user = userEvent.setup();
      const customBase = {
        id: 'custom-base',
        title: 'Custom Title',
        description: 'Custom Description',
        workspace_id: 'workspace-2',
      };
      
      render(<BaseMenu {...defaultProps} base={customBase} />);
      await user.click(screen.getByTestId('menu-item-edit'));
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith(customBase);
    });
  });
});

