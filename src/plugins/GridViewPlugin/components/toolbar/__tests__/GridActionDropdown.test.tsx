import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GridActionDefinition } from '../gridActionCatalog';
import { GridActionDropdown } from '../GridActionDropdown';

// Mock PopoverMenu to simplify testing and avoid portal complexity
vi.mock('../../../../../components/common/PopoverMenu', () => {
  let open = false;
  return {
    PopoverMenu: ({ trigger, items, onOpenChange }: any) => (
      <div data-testid="popover-menu">
        <button
          data-testid="menu-trigger"
          onClick={() => {
            open = !open;
            onOpenChange?.(open);
          }}
        >
          {trigger}
        </button>
        <div data-testid="menu-items">
          {items.map((item: any) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              data-testid={`menu-item-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
    ),
  };
});

describe('GridActionDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger with label and icon when icon prop is provided', () => {
    // Arrange
    const TriggerIcon: React.FC<{ className?: string }> = ({ className }) => (
      <span data-testid="trigger-icon" className={className} />
    );

    const props = {
      label: 'Actions',
      icon: TriggerIcon as any,
      actions: [] as GridActionDefinition[],
      onActionSelect: vi.fn(),
    } as const;

    // Act
    render(<GridActionDropdown {...props} />);

    // Assert
    const trigger = screen.getByTestId('menu-trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Actions');
    expect(screen.getByTestId('trigger-icon')).toBeInTheDocument();
  });

  it('does not render a trigger icon when icon prop is not provided', () => {
    // Arrange
    const props = {
      label: 'More',
      actions: [] as GridActionDefinition[],
      onActionSelect: vi.fn(),
    } as const;

    // Act
    render(<GridActionDropdown {...props} />);

    // Assert
    expect(screen.getByTestId('menu-trigger')).toBeInTheDocument();
    expect(screen.queryByTestId('trigger-icon')).toBeNull();
  });

  it('renders action items and calls onActionSelect with the selected action', async () => {
    // Arrange
    const user = userEvent.setup();

    const ActionIcon: React.FC<{ className?: string; 'data-testid'?: string }> = ({ className }) => (
      <span data-testid="action-icon-1" className={className} />
    );

    const action: GridActionDefinition = {
      id: 'remove_extra_spaces' as any,
      group: 'clean',
      label: 'Remove Extra Spaces',
      description: 'desc',
      icon: ActionIcon as any,
    };

    const onActionSelect = vi.fn();

    // Act
    render(
      <GridActionDropdown label="Actions" actions={[action]} onActionSelect={onActionSelect} />
    );

    // The mock PopoverMenu renders the trigger immediately; open simulation not required for items
    const itemTestId = 'menu-item-remove-extra-spaces';
    const menuItem = screen.getByTestId(itemTestId);

    await user.click(menuItem);

    // Assert
    expect(onActionSelect).toHaveBeenCalledTimes(1);
    expect(onActionSelect).toHaveBeenCalledWith(action);

    const icon = screen.getByTestId('action-icon-1');
    expect(icon).toHaveClass('w-5');
    expect(icon).toHaveClass('h-5');
  });

  it('handles empty actions array without rendering any menu item buttons', () => {
    // Arrange
    const props = {
      label: 'Empty',
      actions: [] as GridActionDefinition[],
      onActionSelect: vi.fn(),
    } as const;

    // Act
    render(<GridActionDropdown {...props} />);

    // Assert
    const container = screen.getByTestId('menu-items');
    const buttons = container.querySelectorAll('button');
    // Only the wrapper buttons (if any) are present; ensure there are no action buttons
    expect(buttons.length).toBe(0);
  });

  it('toggles chevron icon when popover open state changes', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<GridActionDropdown label="Actions" actions={[]} onActionSelect={vi.fn()} />);

    // Initially closed -> chevron down should be present
    expect(document.querySelector('.lucide-chevron-down')).toBeInTheDocument();

    // Act: click trigger to open
    const trigger = screen.getByTestId('menu-trigger');
    await user.click(trigger);

    // Assert: chevron up should be present
    expect(document.querySelector('.lucide-chevron-up')).toBeInTheDocument();
  });
});
