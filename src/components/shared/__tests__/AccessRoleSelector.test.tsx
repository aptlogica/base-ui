import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessRoleSelector } from '../AccessRoleSelector';
import type { AccessRole, RoleConfig } from '../AccessRoleSelector';
import { defaultRoleConfig } from '../roleConfig';

vi.mock('../../hooks/useClickOutside', () => ({
  useClickOutside: vi.fn(() => ({ current: null })),
}));

const mockOnChange = vi.fn();

describe('AccessRoleSelector', () => {
  const roleConfig: Record<AccessRole, RoleConfig> = defaultRoleConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
  });

  describe('Rendering', () => {
    it('should render trigger button with current role label', () => {
      render(
        <AccessRoleSelector
          value="editor"
          onChange={mockOnChange}
          roleConfig={roleConfig}
        />
      );
      expect(screen.getByText('Editor')).toBeInTheDocument();
    });

    it('should render owner role when value is owner', () => {
      render(
        <AccessRoleSelector
          value="owner"
          onChange={mockOnChange}
          roleConfig={roleConfig}
        />
      );
      expect(screen.getByText('Owner')).toBeInTheDocument();
    });

    it('should apply custom className to wrapper', () => {
      const { container } = render(
        <AccessRoleSelector
          value="viewer"
          onChange={mockOnChange}
          roleConfig={roleConfig}
          className="custom-class"
        />
      );
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should render disabled button when disabled is true', () => {
      render(
        <AccessRoleSelector
          value="editor"
          onChange={mockOnChange}
          roleConfig={roleConfig}
          disabled
        />
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not open dropdown when disabled and button is clicked', async () => {
      render(
        <AccessRoleSelector
          value="editor"
          onChange={mockOnChange}
          roleConfig={roleConfig}
          disabled
        />
      );
      const button = screen.getByRole('button');
      await userEvent.click(button);
      expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
    });
  });

  describe('Dropdown open and close', () => {
    it('should open dropdown and show search when button is clicked', async () => {
      render(
        <AccessRoleSelector
          value="editor"
          onChange={mockOnChange}
          roleConfig={roleConfig}
        />
      );
      const button = screen.getByRole('button');
      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      });
    });

    it('should show role options when dropdown is open', async () => {
      render(
        <AccessRoleSelector
          value="editor"
          onChange={mockOnChange}
          roleConfig={roleConfig}
        />
      );
      const button = screen.getByRole('button');
      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.getByText('Viewer')).toBeInTheDocument();
      });
    });

    it('should show No roles found when search matches nothing', async () => {
      render(
        <AccessRoleSelector
          value="editor"
          onChange={mockOnChange}
          roleConfig={roleConfig}
        />
      );
      const button = screen.getByRole('button');
      await userEvent.click(button);
      await waitFor(() => expect(screen.getByPlaceholderText('Search')).toBeInTheDocument());
      const searchInput = screen.getByPlaceholderText('Search');
      await userEvent.type(searchInput, 'xyznonexistent');
      await waitFor(() => {
        expect(screen.getByText('No roles found')).toBeInTheDocument();
      });
    });
  });

  describe('Role selection', () => {
    it('should call onChange with selected role when role option is clicked', async () => {
      render(
        <AccessRoleSelector
          value="editor"
          onChange={mockOnChange}
          roleConfig={roleConfig}
        />
      );
      const button = screen.getByRole('button');
      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Viewer')).toBeInTheDocument());
      const viewerOption = screen.getByText('Viewer').closest('button');
      expect(viewerOption).toBeTruthy();
      if (viewerOption) {
        await userEvent.click(viewerOption);
      }
      expect(mockOnChange).toHaveBeenCalledWith('viewer');
    });

    it('should call onChange with owner when owner option is clicked', async () => {
      render(
        <AccessRoleSelector
          value="viewer"
          onChange={mockOnChange}
          roleConfig={roleConfig}
        />
      );
      const button = screen.getByRole('button');
      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Owner')).toBeInTheDocument());
      const ownerButtons = screen.getAllByText('Owner');
      const optionButton = ownerButtons.find((el) => el.closest('button')?.getAttribute('type') === 'button');
      if (optionButton?.closest('button')) {
        await userEvent.click(optionButton.closest('button')!);
      }
      expect(mockOnChange).toHaveBeenCalledWith('owner');
    });
  });

  describe('Search filter', () => {
    it('should filter roles by label when search query is entered', async () => {
      render(
        <AccessRoleSelector
          value="editor"
          onChange={mockOnChange}
          roleConfig={roleConfig}
        />
      );
      const button = screen.getByRole('button');
      await userEvent.click(button);
      await waitFor(() => expect(screen.getByPlaceholderText('Search')).toBeInTheDocument());
      const searchInput = screen.getByPlaceholderText('Search');
      await userEvent.type(searchInput, 'View');
      await waitFor(() => {
        expect(screen.getByText('Viewer')).toBeInTheDocument();
      });
    });
  });

  describe('Edge cases', () => {
    it('should render when value is no-access', () => {
      render(
        <AccessRoleSelector
          value="no-access"
          onChange={mockOnChange}
          roleConfig={roleConfig}
        />
      );
      expect(screen.getByText('No Access')).toBeInTheDocument();
    });

    it('should render when value is commenter', () => {
      render(
        <AccessRoleSelector
          value="commenter"
          onChange={mockOnChange}
          roleConfig={roleConfig}
        />
      );
      expect(screen.getByText('Commenter')).toBeInTheDocument();
    });
  });
});
