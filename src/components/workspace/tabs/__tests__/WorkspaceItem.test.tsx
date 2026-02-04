import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { WorkspaceItem } from '../WorkspaceItem';

const mockUseWorkspaceBases = vi.fn();

vi.mock('../../../../hooks/useApi', () => ({
  useWorkspaceBases: (workspaceId: string) => mockUseWorkspaceBases(workspaceId),
}));

vi.mock('../../../common/dropdown/RoleDropdown', () => ({
  RoleDropdown: ({
    value,
    options,
    onChange,
    placeholder,
  }: {
    value: string;
    options: Array<{ label: string; value: string }>;
    onChange: (value: string) => void;
    placeholder: string;
  }) => (
    <select
      data-testid="role-dropdown"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={placeholder}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

describe('WorkspaceItem', () => {
  const defaultWorkspace = {
    id: 'workspace-1',
    title: 'Test Workspace',
    name: 'test_workspace',
  };

  const defaultProps = {
    workspace: defaultWorkspace,
    assignment: undefined as any,
    onRoleChange: vi.fn(),
    onBaseRoleChange: vi.fn(),
    onToggleBase: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWorkspaceBases.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });
  });

  describe('Rendering', () => {
    it('renders workspace title', () => {
      render(<WorkspaceItem {...defaultProps} />);

      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    });

    it('renders workspace name when title is missing', () => {
      const workspace = { id: 'ws-1', name: 'fallback_name' };
      render(<WorkspaceItem {...defaultProps} workspace={workspace} />);

      expect(screen.getByText('fallback_name')).toBeInTheDocument();
    });

    it('renders base count badge with singular when one base', () => {
      mockUseWorkspaceBases.mockReturnValue({
        data: { data: [{ id: 'base-1' }] },
        isLoading: false,
      });

      render(<WorkspaceItem {...defaultProps} />);

      expect(screen.getByText('1 Base')).toBeInTheDocument();
    });

    it('renders base count badge with plural when multiple bases', () => {
      mockUseWorkspaceBases.mockReturnValue({
        data: { data: [{ id: 'base-1' }, { id: 'base-2' }] },
        isLoading: false,
      });

      render(<WorkspaceItem {...defaultProps} />);

      expect(screen.getByText('2 Bases')).toBeInTheDocument();
    });

    it('renders loading state when bases query is loading and base_specific is selected', () => {
      mockUseWorkspaceBases.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(
        <WorkspaceItem
          {...defaultProps}
          assignment={{ workspaceId: 'workspace-1', role: 'base_specific', bases: [] }}
        />
      );

      const loadingContainer = document.querySelector('.flex.items-center.justify-center.py-4');
      expect(loadingContainer).toBeInTheDocument();
    });

    it('renders no bases message when bases array is empty and base_specific is selected', () => {
      mockUseWorkspaceBases.mockReturnValue({
        data: { data: [] },
        isLoading: false,
      });

      render(
        <WorkspaceItem
          {...defaultProps}
          assignment={{ workspaceId: 'workspace-1', role: 'base_specific', bases: [] }}
        />
      );

      expect(screen.getByText('No bases found')).toBeInTheDocument();
    });

    it('does not show bases section when assignment role is not base_specific', () => {
      mockUseWorkspaceBases.mockReturnValue({
        data: { data: [{ id: 'base-1', title: 'Base 1' }] },
        isLoading: false,
      });

      render(<WorkspaceItem {...defaultProps} assignment={{ workspaceId: 'workspace-1', role: 'maintainer' }} />);

      expect(screen.queryByText('BASES')).not.toBeInTheDocument();
    });

    it('shows bases section when assignment role is base_specific', () => {
      mockUseWorkspaceBases.mockReturnValue({
        data: { data: [{ id: 'base-1', title: 'Base 1' }] },
        isLoading: false,
      });

      render(
        <WorkspaceItem
          {...defaultProps}
          assignment={{ workspaceId: 'workspace-1', role: 'base_specific', bases: [] }}
        />
      );

      expect(screen.getByText('BASES')).toBeInTheDocument();
    });
  });

  describe('Workspace role', () => {
    it('calls onRoleChange when workspace role is selected', async () => {
      const user = userEvent.setup();
      render(<WorkspaceItem {...defaultProps} />);

      const workspaceDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(workspaceDropdown, 'maintainer');

      expect(defaultProps.onRoleChange).toHaveBeenCalledWith('workspace-1', 'maintainer');
    });

    it('calls onRoleChange with null when clear button is clicked and assignment has role', async () => {
      const user = userEvent.setup();
      render(
        <WorkspaceItem
          {...defaultProps}
          assignment={{ workspaceId: 'workspace-1', role: 'maintainer' }}
        />
      );

      const clearButton = screen.getByTitle('Clear selection');
      await user.click(clearButton);

      expect(defaultProps.onRoleChange).toHaveBeenCalledWith('workspace-1', null);
    });

    it('does not render clear role button when assignment has no role', () => {
      render(<WorkspaceItem {...defaultProps} />);

      expect(screen.queryByTitle('Clear selection')).not.toBeInTheDocument();
    });
  });

  describe('Base role and response shape', () => {
    it('extracts bases from response with data property', () => {
      mockUseWorkspaceBases.mockReturnValue({
        data: { data: [{ id: 'base-1', title: 'Base One' }] },
        isLoading: false,
      });

      render(
        <WorkspaceItem
          {...defaultProps}
          assignment={{ workspaceId: 'workspace-1', role: 'base_specific', bases: [] }}
        />
      );

      expect(screen.getByText('Base One')).toBeInTheDocument();
    });

    it('extracts bases from response when data is direct array', () => {
      mockUseWorkspaceBases.mockReturnValue({
        data: [{ id: 'base-1', title: 'Direct Base' }],
        isLoading: false,
      });

      render(
        <WorkspaceItem
          {...defaultProps}
          assignment={{ workspaceId: 'workspace-1', role: 'base_specific', bases: [] }}
        />
      );

      expect(screen.getByText('Direct Base')).toBeInTheDocument();
    });

    it('calls onToggleBase when clear base role button is clicked', async () => {
      const user = userEvent.setup();
      mockUseWorkspaceBases.mockReturnValue({
        data: { data: [{ id: 'base-1', title: 'Base 1' }] },
        isLoading: false,
      });

      render(
        <WorkspaceItem
          {...defaultProps}
          assignment={{
            workspaceId: 'workspace-1',
            role: 'base_specific',
            bases: [{ baseId: 'base-1', role: 'base-member' }],
          }}
        />
      );

      const clearBaseButton = screen.getByRole('button', { name: /clear base role selection/i });
      await user.click(clearBaseButton);

      expect(defaultProps.onToggleBase).toHaveBeenCalledWith('workspace-1', 'base-1');
    });
  });

  describe('Edge cases', () => {
    it('renders zero bases badge when response is empty', () => {
      mockUseWorkspaceBases.mockReturnValue({
        data: { data: [] },
        isLoading: false,
      });

      render(<WorkspaceItem {...defaultProps} />);

      expect(screen.getByText('0 Bases')).toBeInTheDocument();
    });

    it('uses base name when base title is missing', () => {
      mockUseWorkspaceBases.mockReturnValue({
        data: { data: [{ id: 'base-1', name: 'base_one' }] },
        isLoading: false,
      });

      render(
        <WorkspaceItem
          {...defaultProps}
          assignment={{ workspaceId: 'workspace-1', role: 'base_specific', bases: [] }}
        />
      );

      expect(screen.getByText('base_one')).toBeInTheDocument();
    });
  });
});
