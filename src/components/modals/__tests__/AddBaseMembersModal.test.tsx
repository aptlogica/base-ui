import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AddBaseMembersModal } from '../AddBaseMembersModal';

const bulkAddMutateAsync = vi.fn();
const removeUserMutateAsync = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../../../hooks/useApi', () => ({
  useBulkAddBaseMembers: () => ({ mutateAsync: bulkAddMutateAsync, isPending: false }),
  useRemoveUserFromBase: () => ({ mutateAsync: removeUserMutateAsync, isPending: false }),
  useGetUsersForAssign: () => ({
    data: [
      { id: 'u1', display_name: 'User One', email: 'u1@test.com' },
      { id: 'u2', display_name: 'User Two', email: 'u2@test.com' },
    ],
  }),
  useBaseMembers: () => ({
    data: { data: [{ user_id: 'u1', display_name: 'User One', email: 'u1@test.com', roles: [{ name: 'base-member', scope_level: 'base' }] }] },
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('../../common/Toast', () => ({
  useToast: () => ({ success: toastSuccess, error: toastError }),
}));

vi.mock('../../common/MultiSelectTags', () => ({
  MultiSelectTags: ({ value, onChange, options }: any) => (
    <div>
      <div data-testid="multi-select-count">{value.length}</div>
      <button
        type="button"
        onClick={() => onChange(options.filter((o: any) => !o.disabled).map((o: any) => o.value))}
      >
        Select Users
      </button>
    </div>
  ),
}));

vi.mock('../../common/dropdown/RoleDropdown', () => ({
  RoleDropdown: ({ value, onChange }: any) => (
    <button type="button" onClick={() => onChange(value === 'base-member' ? 'base-read' : 'base-member')}>
      {value}
    </button>
  ),
}));

describe('AddBaseMembersModal', () => {
  beforeEach(() => {
    bulkAddMutateAsync.mockReset();
    removeUserMutateAsync.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  it('renders when open and shows member list', () => {
    render(
      <AddBaseMembersModal
        isOpen={true}
        onClose={vi.fn()}
        workspaceId="ws1"
        baseId="b1"
      />
    );

    expect(screen.getByText('Add & Manage Members')).toBeInTheDocument();
    expect(screen.getByText('User One')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <AddBaseMembersModal
        isOpen={true}
        onClose={onClose}
        workspaceId="ws1"
        baseId="b1"
      />
    );

    fireEvent.click(screen.getByText('Add & Manage Members').closest('.bg-modal-backdrop') as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });

  it('adds selected users on save', async () => {
    render(
      <AddBaseMembersModal
        isOpen={true}
        onClose={vi.fn()}
        workspaceId="ws1"
        baseId="b1"
      />
    );

    fireEvent.click(screen.getByText('Select Users'));
    const saveButton = screen.getByRole('button', { name: 'Add' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(bulkAddMutateAsync).toHaveBeenCalled();
    });
  });

  it('updates roles when role is changed for existing member', async () => {
    render(
      <AddBaseMembersModal
        isOpen={true}
        onClose={vi.fn()}
        workspaceId="ws1"
        baseId="b1"
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'base-member' })[0]);
    const saveButton = screen.getByRole('button', { name: 'Update' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(bulkAddMutateAsync).toHaveBeenCalled();
    });
  });

  it('removes a member when remove button is clicked', async () => {
    render(
      <AddBaseMembersModal
        isOpen={true}
        onClose={vi.fn()}
        workspaceId="ws1"
        baseId="b1"
      />
    );

    const removeButton = screen.getByLabelText('Remove member');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(removeUserMutateAsync).toHaveBeenCalledWith({ baseId: 'b1', user_id: 'u1' });
    });
  });
});
