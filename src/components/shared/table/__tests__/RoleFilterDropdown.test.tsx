import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RoleFilterDropdown } from '../RoleFilterDropdown';

const setButtonRect = (button: HTMLButtonElement) => {
  Object.defineProperty(button, 'getBoundingClientRect', {
    value: () => ({
      x: 50,
      y: 100,
      width: 120,
      height: 24,
      top: 100,
      right: 170,
      bottom: 124,
      left: 50,
      toJSON: () => ({}),
    }),
  });
};

describe('RoleFilterDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens menu and selects a role', async () => {
    const onChange = vi.fn();
    render(
      <RoleFilterDropdown
        label="Roles"
        selectedRole={null}
        roles={['Owner', 'Member']}
        dropdownWidth={200}
        onChange={onChange}
      />
    );

    const trigger = screen.getByRole('button', { name: /roles/i });
    setButtonRect(trigger as HTMLButtonElement);
    fireEvent.click(trigger);

    expect(await screen.findByText('All Roles')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Owner'));
    expect(onChange).toHaveBeenCalledWith('Owner');
    expect(screen.queryByText('All Roles')).not.toBeInTheDocument();
  });

  it('clears selection when clicking All Roles', async () => {
    const onChange = vi.fn();
    render(
      <RoleFilterDropdown
        label="Roles"
        selectedRole="Owner"
        roles={['Owner', 'Member']}
        dropdownWidth={200}
        onChange={onChange}
      />
    );

    const trigger = screen.getByRole('button', { name: /roles/i });
    setButtonRect(trigger as HTMLButtonElement);
    fireEvent.click(trigger);

    expect(await screen.findByText('All Roles')).toBeInTheDocument();
    fireEvent.click(screen.getByText('All Roles'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('closes on escape when enabled', async () => {
    render(
      <RoleFilterDropdown
        label="Roles"
        selectedRole={null}
        roles={['Owner']}
        dropdownWidth={200}
        onChange={vi.fn()}
        closeOnEscape={true}
      />
    );

    const trigger = screen.getByRole('button', { name: /roles/i });
    setButtonRect(trigger as HTMLButtonElement);
    fireEvent.click(trigger);

    const menu = await screen.findByText('All Roles');
    fireEvent.keyDown(menu.parentElement as HTMLElement, { key: 'Escape' });
    expect(screen.queryByText('All Roles')).not.toBeInTheDocument();
  });

  it('closes on outside click', async () => {
    render(
      <RoleFilterDropdown
        label="Roles"
        selectedRole={null}
        roles={['Owner']}
        dropdownWidth={200}
        onChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole('button', { name: /roles/i });
    setButtonRect(trigger as HTMLButtonElement);
    fireEvent.click(trigger);

    expect(await screen.findByText('All Roles')).toBeInTheDocument();

    act(() => {
      fireEvent.mouseDown(document.body);
    });

    expect(screen.queryByText('All Roles')).not.toBeInTheDocument();
  });
});
