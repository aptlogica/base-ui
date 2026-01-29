import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DropdownTrigger } from '../../dropdown/DropdownTrigger';

describe('DropdownTrigger', () => {
  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(
      <DropdownTrigger
        displayLabel="Select an option..."
        isOpen={false}
        onToggle={onToggle}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows selected count badge in multiple mode', () => {
    render(
      <DropdownTrigger
        displayLabel="Alpha"
        isOpen={false}
        multiple
        selectedCount={3}
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('clear button invokes onClear and does not toggle', async () => {
    const onToggle = vi.fn();
    const onClear = vi.fn();
    render(
      <DropdownTrigger
        displayLabel="Alpha"
        isOpen={false}
        clearable
        multiple
        selectedCount={2}
        onToggle={onToggle}
        onClear={onClear}
      />
    );
    // The clear button is now a div with role="button" and aria-label="Clear selection"
    const clearBtn = screen.getByRole('button', { name: /clear selection/i });
    
    expect(clearBtn).toBeTruthy();
    fireEvent.click(clearBtn);
    
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('shows loading spinner and disables button', () => {
    render(
      <DropdownTrigger
        displayLabel="Alpha"
        isOpen={false}
        loading
        onToggle={vi.fn()}
      />
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows rotated chevron when open below, chevron up when open above', () => {
    const { rerender } = render(
      <DropdownTrigger
        displayLabel="Alpha"
        isOpen
        onToggle={vi.fn()}
        dropdownPosition="below"
      />
    );
    expect(document.querySelector('svg.rotate-180')).toBeTruthy();

    rerender(
      <DropdownTrigger
        displayLabel="Alpha"
        isOpen
        onToggle={vi.fn()}
        dropdownPosition="above"
      />
    );
    // When above, chevron up should render (no rotate-180 on chevron down)
    expect(document.querySelector('svg.rotate-180')).toBeFalsy();
  });

  it('applies error styling when error is present', () => {
    render(
      <DropdownTrigger
        displayLabel="Alpha"
        isOpen={false}
        error="Problem"
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByRole('button').className).toMatch(/border-red-500/);
  });

  it('uses placeholder style when label contains "Select"', () => {
    render(
      <DropdownTrigger
        displayLabel="Select an option..."
        isOpen={false}
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByText('Select an option...').className).toMatch(/text-gray-500/);
  });
});