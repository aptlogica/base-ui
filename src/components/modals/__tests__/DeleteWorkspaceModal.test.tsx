import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteWorkspaceModal } from '../DeleteWorkspaceModal';

describe('DeleteWorkspaceModal', () => {
  it('requires exact name to enable delete', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <DeleteWorkspaceModal
        isOpen={true}
        workspace={{ id: 'w1', title: 'My Workspace' }}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete Workspace' }) as HTMLButtonElement;
    expect(deleteButton.disabled).toBe(true);

    await user.type(screen.getByPlaceholderText('Enter workspace name'), 'My Workspace');
    await waitFor(() => expect(deleteButton.disabled).toBe(false));

    await user.click(deleteButton);
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('w1'));
  });

  it('closes on cancel', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <DeleteWorkspaceModal
        isOpen={true}
        workspace={{ id: 'w1', name: 'Workspace' }}
        onClose={onClose}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />
    );
    await user.click(screen.getByText('Cancel'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
