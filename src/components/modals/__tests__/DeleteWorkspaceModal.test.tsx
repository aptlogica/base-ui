import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { DeleteWorkspaceModal } from '../DeleteWorkspaceModal';

describe('DeleteWorkspaceModal', () => {
  it('requires exact name to enable delete', async () => {
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

    fireEvent.change(screen.getByPlaceholderText('Enter workspace name'), { target: { value: 'My Workspace' } });
    expect(deleteButton.disabled).toBe(false);

    fireEvent.click(deleteButton);
    expect(onConfirm).toHaveBeenCalledWith('w1');
  });

  it('closes on cancel', () => {
    const onClose = vi.fn();
    render(
      <DeleteWorkspaceModal
        isOpen={true}
        workspace={{ id: 'w1', name: 'Workspace' }}
        onClose={onClose}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
