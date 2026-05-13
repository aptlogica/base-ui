import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { TenantSettingsTab } from '../TenantSettingsTab';

const mockUseGetOrganization = vi.fn();
const mockUseUpdateOrganization = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };

vi.mock('../../../../hooks/useApi', () => ({
  useGetOrganization: () => mockUseGetOrganization(),
  useUpdateOrganization: (orgId: string) => mockUseUpdateOrganization(orgId),
}));

vi.mock('../../../common/Toast', () => ({
  useToast: () => mockToast,
}));

vi.mock('../../../ui/Loader', () => ({
  Loader: ({ text }: { text?: string }) => <div data-testid="loader">{text ?? 'Loading'}</div>,
}));

vi.mock('../../../common/Fields', () => ({
  MultiLineText: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
  }) => (
    <textarea
      data-testid="organization-description"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

describe('TenantSettingsTab', () => {
  const defaultOrgData = {
    id: 'org-1',
    name: 'Acme Corp',
    description: 'Company description',
    email: 'contact@acme.com',
    created_time: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetOrganization.mockReturnValue({
      data: defaultOrgData,
      isLoading: false,
    });
    mockUseUpdateOrganization.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
  });

  describe('Rendering', () => {
    it('renders organization information heading', () => {
      render(<TenantSettingsTab workspaceId="workspace-1" />);

      expect(screen.getByRole('heading', { name: /organization information/i })).toBeInTheDocument();
    });

    it('renders company name input with initial value', () => {
      render(<TenantSettingsTab workspaceId="workspace-1" />);

      const input = screen.getByLabelText(/company name/i);
      expect(input).toHaveValue('Acme Corp');
    });

    it('renders save and cancel buttons', () => {
      render(<TenantSettingsTab workspaceId="workspace-1" />);

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders owner details section when organization data exists', () => {
      render(<TenantSettingsTab workspaceId="workspace-1" />);

      expect(screen.getByRole('heading', { name: /owner details/i })).toBeInTheDocument();
    });

    it('shows loader when loading', () => {
      mockUseGetOrganization.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<TenantSettingsTab workspaceId="workspace-1" />);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
  });

  describe('Form interaction', () => {
    it('updates company name when user types', async () => {
      const user = userEvent.setup();
      render(<TenantSettingsTab workspaceId="workspace-1" />);

      const input = screen.getByLabelText(/company name/i);
      await user.clear(input);
      await user.type(input, 'New Name');

      expect(input).toHaveValue('New Name');
    });

    it('calls update mutation and shows success when save is clicked with changes', async () => {
      const user = userEvent.setup();
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseUpdateOrganization.mockReturnValue({ mutateAsync, isPending: false });

      render(<TenantSettingsTab workspaceId="workspace-1" />);

      const nameInput = screen.getByLabelText(/company name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Corp');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      expect(mutateAsync).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('Organization updated successfully');
    });

    it('disables save button when no changes', () => {
      render(<TenantSettingsTab workspaceId="workspace-1" />);

      expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
    });

    it('disables save button when company name is empty', async () => {
      const user = userEvent.setup();
      render(<TenantSettingsTab workspaceId="workspace-1" />);

      const nameInput = screen.getByLabelText(/company name/i);
      await user.clear(nameInput);

      expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
    });

    it('keeps save enabled when description is empty but name is valid', async () => {
      const user = userEvent.setup();
      render(<TenantSettingsTab workspaceId="workspace-1" />);

      const descInput = screen.getByTestId('organization-description');
      await user.clear(descInput);

      expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled();
    });

    it('resets form when cancel is clicked with changes', async () => {
      const user = userEvent.setup();
      render(<TenantSettingsTab workspaceId="workspace-1" />);

      const nameInput = screen.getByLabelText(/company name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Temp');

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockToast.info).toHaveBeenCalledWith('Changes discarded');
      expect(nameInput).toHaveValue('Acme Corp');
    });
  });

  describe('Edge cases', () => {
    it('disables save when no changes', () => {
      render(<TenantSettingsTab workspaceId="workspace-1" />);

      expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
    });

    it('shows error toast when update mutation fails', async () => {
      const user = userEvent.setup();
      const mutateAsync = vi.fn().mockRejectedValue(new Error('Network error'));
      mockUseUpdateOrganization.mockReturnValue({ mutateAsync, isPending: false });

      render(<TenantSettingsTab workspaceId="workspace-1" />);

      const nameInput = screen.getByLabelText(/company name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'New');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      expect(mockToast.error).toHaveBeenCalledWith('Network error');
    });

    it('shows Saving... on save button when mutation is pending', () => {
      mockUseUpdateOrganization.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: true,
      });

      render(<TenantSettingsTab workspaceId="workspace-1" />);

      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
    });
  });
});
