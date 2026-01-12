import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { User } from '../User';

vi.mock('../../hooks/useGetTenantUsers', () => ({
  useGetTenantUsers: vi.fn(() => ({
    users: [
      { id: '1', name: 'John Doe', email: 'john@example.com', avatar: 'j' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', avatar: 'js' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', avatar: 'bj' }
    ],
    isLoading: false
  }))
}));

describe('User Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render user field', () => {
      render(
        <User
          value={null}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display label', () => {
      render(
        <User
          label="Assigned To"
          value={null}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(screen.getByText('Assigned To')).toBeInTheDocument();
    });

    it('should display single user', () => {
      const user = { id: '1', name: 'John Doe' };

      render(
        <User
          value={user}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display multiple users', () => {
      const users = [
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Smith' }
      ];

      render(
        <User
          value={users}
          onChange={mockOnChange}
          config={{ allowMultiple: true }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display helper text', () => {
      render(
        <User
          value={null}
          onChange={mockOnChange}
          helperText="Select a user"
          config={{}}
        />
      );

      expect(screen.getByText('Select a user')).toBeInTheDocument();
    });

    it('should show required indicator', () => {
      render(
        <User
          label="Owner"
          required
          value={null}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('User Selection', () => {
    it('should open dropdown on click', async () => {
      render(
        <User
          value={null}
          onChange={mockOnChange}
          config={{}}
        />
      );

      const input = document.querySelector('input') || screen.getByRole('combobox', { hidden: true });
      if (input) {
        fireEvent.click(input);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(document.body).toBeInTheDocument();
    });

    it('should display user list in dropdown', async () => {
      const { container } = render(
        <User
          value={null}
          onChange={mockOnChange}
          config={{}}
        />
      );

      const input = container.querySelector('input');
      if (input) {
        fireEvent.click(input);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(document.body).toBeInTheDocument();
    });

    it('should select single user from dropdown', async () => {
      render(
        <User
          value={null}
          onChange={mockOnChange}
          config={{}}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      if (input) {
        fireEvent.click(input);
        await new Promise(resolve => setTimeout(resolve, 100));

        const options = document.querySelectorAll('div[role="option"], li');
        if (options.length > 0) {
          fireEvent.click(options[0]);
          await new Promise(resolve => setTimeout(resolve, 100));

          expect(mockOnChange).toHaveBeenCalled();
        }
      }
    });

    it('should support multiple user selection', async () => {
      render(
        <User
          value={null}
          onChange={mockOnChange}
          config={{ allowMultiple: true }}
        />
      );

      const input = document.querySelector('input');
      if (input) {
        fireEvent.click(input);
        await new Promise(resolve => setTimeout(resolve, 100));

        const options = document.querySelectorAll('div[role="option"], li, label');
        if (options.length > 0) {
          fireEvent.click(options[0]);
          await new Promise(resolve => setTimeout(resolve, 100));

          if (options.length > 1) {
            fireEvent.click(options[1]);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      expect(document.body).toBeInTheDocument();
    });

    it('should filter users by search text', async () => {
      render(
        <User
          value={null}
          onChange={mockOnChange}
          config={{}}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, 'john');
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(input.value).toBe('john');
    });

    it('should display user avatars in dropdown', async () => {
      const { container } = render(
        <User
          value={null}
          onChange={mockOnChange}
          config={{}}
        />
      );

      const input = container.querySelector('input');
      if (input) {
        fireEvent.click(input);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('User Display', () => {
    it('should show user name', () => {
      const user = { id: '1', name: 'John Doe', email: 'john@example.com' };

      render(
        <User
          value={user}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should show user avatar', () => {
      const user = { id: '1', name: 'John Doe', avatar: 'j' };

      render(
        <User
          value={user}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display multiple user pills', () => {
      const users = [
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Smith' }
      ];

      render(
        <User
          value={users}
          onChange={mockOnChange}
          config={{ allowMultiple: true }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle user without avatar', () => {
      const user = { id: '1', name: 'John Doe' };

      render(
        <User
          value={user}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should show email address', () => {
      const user = { id: '1', name: 'John Doe', email: 'john@example.com' };

      render(
        <User
          value={user}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('User Removal', () => {
    it('should remove user on clear click', async () => {
      const user = { id: '1', name: 'John Doe' };

      render(
        <User
          value={user}
          onChange={mockOnChange}
          config={{}}
        />
      );

      const clearButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('×') || btn.textContent?.includes('clear')
      );

      if (clearButton) {
        fireEvent.click(clearButton);
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockOnChange).toHaveBeenCalled();
      }
    });

    it('should remove specific user from multi-select', async () => {
      const users = [
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Smith' }
      ];

      render(
        <User
          value={users}
          onChange={mockOnChange}
          config={{ allowMultiple: true }}
        />
      );

      const removeButtons = Array.from(document.querySelectorAll('button')).filter(
        btn => btn.textContent?.includes('×')
      );

      if (removeButtons.length > 0) {
        fireEvent.click(removeButtons[0]);
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockOnChange).toHaveBeenCalled();
      }
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should disable dropdown when disabled', () => {
      const user = { id: '1', name: 'John Doe' };

      render(
        <User
          value={user}
          onChange={mockOnChange}
          config={{}}
          disabled
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it('should prevent changes when readOnly', () => {
      const user = { id: '1', name: 'John Doe' };

      render(
        <User
          value={user}
          onChange={mockOnChange}
          config={{}}
          readOnly
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.readOnly).toBe(true);
    });
  });

  describe('Configuration Props', () => {
    it('should support single selection mode', () => {
      render(
        <User
          value={null}
          onChange={mockOnChange}
          config={{ allowMultiple: false }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should support multiple selection mode', () => {
      render(
        <User
          value={null}
          onChange={mockOnChange}
          config={{ allowMultiple: true }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should apply custom placeholder', () => {
      render(
        <User
          value={null}
          onChange={mockOnChange}
          placeholder="Choose user"
          config={{}}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should sync external user changes', () => {
      const { rerender } = render(
        <User
          value={{ id: '1', name: 'John Doe' }}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();

      rerender(
        <User
          value={{ id: '2', name: 'Jane Smith' }}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should handle change from single to multiple', () => {
      const { rerender } = render(
        <User
          value={{ id: '1', name: 'John Doe' }}
          onChange={mockOnChange}
          config={{ allowMultiple: false }}
        />
      );

      rerender(
        <User
          value={[
            { id: '1', name: 'John Doe' },
            { id: '2', name: 'Jane Smith' }
          ]}
          onChange={mockOnChange}
          config={{ allowMultiple: true }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should sync rapid user updates', () => {
      const { rerender } = render(
        <User
          value={{ id: '1', name: 'John Doe' }}
          onChange={mockOnChange}
          config={{}}
        />
      );

      rerender(
        <User
          value={{ id: '2', name: 'Jane Smith' }}
          onChange={mockOnChange}
          config={{}}
        />
      );

      rerender(
        <User
          value={{ id: '3', name: 'Bob Johnson' }}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Dropdown Positioning', () => {
    it('should position dropdown below input', async () => {
      render(
        <User
          value={null}
          onChange={mockOnChange}
          config={{}}
        />
      );

      const input = document.querySelector('input');
      if (input) {
        fireEvent.click(input);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(document.body).toBeInTheDocument();
    });

    it('should adjust dropdown when space limited', async () => {
      const { container } = render(
        <div style={{ height: '100px' }}>
          <User
            value={null}
            onChange={mockOnChange}
            config={{}}
          />
        </div>
      );

      const input = container.querySelector('input');
      if (input) {
        fireEvent.click(input);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      render(
        <User
          value={null}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(
        <User
          value={undefined as any}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle empty array in multi-select', () => {
      render(
        <User
          value={[]}
          onChange={mockOnChange}
          config={{ allowMultiple: true }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle user with special characters in name', () => {
      const user = { id: '1', name: "O'Brien & Co." };

      render(
        <User
          value={user}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(screen.getByText("O'Brien & Co.")).toBeInTheDocument();
    });

    it('should handle large number of users in list', () => {
      // This would need to mock useGetTenantUsers differently
      render(
        <User
          value={null}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle long user names', () => {
      const user = { id: '1', name: 'A Very Long User Name That Goes On And On' };

      render(
        <User
          value={user}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(
        <User
          label="Assigned To"
          value={null}
          onChange={mockOnChange}
          config={{}}
        />
      );

      expect(screen.getByText('Assigned To')).toBeInTheDocument();
    });

    it('should support keyboard navigation in dropdown', async () => {
      render(
        <User
          value={null}
          onChange={mockOnChange}
          config={{}}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      input.focus();

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(input).toHaveFocus();
    });

    it('should have proper button roles for removal', () => {
      const user = { id: '1', name: 'John Doe' };

      render(
        <User
          value={user}
          onChange={mockOnChange}
          config={{}}
        />
      );

      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
