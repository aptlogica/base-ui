import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock PopoverMenu to avoid DOM measurement and portal complexity
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

import { GridActionsBar } from '../GridActionsBar';
import { GRID_ACTION_GROUPS } from '../gridActionCatalog';

describe('GridActionsBar', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the Data Clean dropdown', () => {
    // Arrange
    const onActionSelect = vi.fn();

    // Act
    render(<GridActionsBar onActionSelect={onActionSelect} />);

    // Assert
    expect(screen.getByText('Data Clean')).toBeDefined();
  });

  it('renders the Data Transform dropdown', () => {
    // Arrange
    const onActionSelect = vi.fn();

    // Act
    render(<GridActionsBar onActionSelect={onActionSelect} />);

    // Assert
    expect(screen.getByText('Data Transform')).toBeDefined();
  });

  it('does not render Data Clean when isReadOnly is true', () => {
    // Arrange
    const onActionSelect = vi.fn();

    // Act
    render(<GridActionsBar isReadOnly onActionSelect={onActionSelect} />);

    // Assert
    expect(screen.queryByText('Data Clean')).toBeNull();
  });

  it('does not render Data Transform when isReadOnly is true', () => {
    // Arrange
    const onActionSelect = vi.fn();

    // Act
    render(<GridActionsBar isReadOnly onActionSelect={onActionSelect} />);

    // Assert
    expect(screen.queryByText('Data Transform')).toBeNull();
  });

  it('shows an action item when Data Clean trigger is clicked', () => {
    // Arrange
    const onActionSelect = vi.fn();
    render(<GridActionsBar onActionSelect={onActionSelect} />);

    // Act
    fireEvent.click(screen.getByText('Data Clean'));

    // Assert
    expect(screen.getByText(GRID_ACTION_GROUPS.clean[0].label)).toBeDefined();
  });

  it('calls onActionSelect with the correct clean action when selected', () => {
    // Arrange
    const onActionSelect = vi.fn();
    render(<GridActionsBar onActionSelect={onActionSelect} />);

    // Act
    fireEvent.click(screen.getByText('Data Clean'));
    const itemLabel = GRID_ACTION_GROUPS.clean[0].label;
    fireEvent.click(screen.getByText(itemLabel));

    // Assert
    expect(onActionSelect).toHaveBeenCalledWith(GRID_ACTION_GROUPS.clean[0]);
  });

  it('calls onActionSelect with the correct transform action when selected', () => {
    // Arrange
    const onActionSelect = vi.fn();
    render(<GridActionsBar onActionSelect={onActionSelect} />);

    // Act
    fireEvent.click(screen.getByText('Data Transform'));
    const itemLabel = GRID_ACTION_GROUPS.transform[0].label;
    fireEvent.click(screen.getByText(itemLabel));

    // Assert
    expect(onActionSelect).toHaveBeenCalledWith(GRID_ACTION_GROUPS.transform[0]);
  });
});
