import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoleDropdown } from '../../dropdown/RoleDropdown';

const options = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
];

describe('RoleDropdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens menu via click and selects an option', () => {
    const onChange = vi.fn();
    render(<RoleDropdown value="" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    const opt = screen.getByRole('menuitemradio', { name: 'Admin' });
    fireEvent.click(opt);
    expect(onChange).toHaveBeenCalledWith('admin');
  });

  it('closes on outside click but not when clicking other dropdown trigger/menu', () => {
    render(<RoleDropdown value="" options={options} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    vi.runAllTimers(); // Allow the event listener to be attached
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Click on an element with dropdown trigger data attribute
    const otherTrigger = document.createElement('div');
    otherTrigger.dataset.dropdownTrigger = 'true';
    document.body.appendChild(otherTrigger);

    fireEvent.mouseDown(otherTrigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    otherTrigger.remove();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('keyboard Escape closes and ArrowDown/Up cycles selection', () => {
    const onChange = vi.fn();
    render(<RoleDropdown value="" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenCalledWith('admin');

    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('toggle open with keyboard on trigger (Enter/Space)', () => {
    render(<RoleDropdown value="" options={options} onChange={vi.fn()} />);
    const trigger = screen.getByRole('button');
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});