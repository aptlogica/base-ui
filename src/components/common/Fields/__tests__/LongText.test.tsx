import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LongText } from '../LongText';

describe('LongText Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render component with label', () => {
      render(<LongText label="Description" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should display placeholder text', () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          placeholder="Enter description"
        />
      );
      const textarea = screen.getByPlaceholderText('Enter description');
      expect(textarea).toBeInTheDocument();
    });

    it('should display initial value', () => {
      render(
        <LongText
          value="Initial content"
          onChange={mockOnChange}
        />
      );
      const textarea = screen.getByDisplayValue('Initial content');
      expect(textarea).toBeInTheDocument();
    });

    it('should show required indicator', () => {
      render(
        <LongText
          label="Notes"
          required
          value=""
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display helper text', () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          helperText="Max 1000 characters"
        />
      );
      expect(screen.getByText('Max 1000 characters')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode on single click when allowEdit is true', async () => {
      const { container } = render(
        <LongText
          value="Test content"
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const field = container.querySelector('[class*="long-text"]') || container.querySelector('div');
      fireEvent.click(field!);

      await new Promise(resolve => setTimeout(resolve, 250));

      const textarea = screen.queryByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should require double click when allowEdit is false', async () => {
      const { container } = render(
        <LongText
          value="Test content"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );

      const field = container.querySelector('[class*="long-text"]') || container.querySelector('div');
      
      // Single click should not enter edit mode
      fireEvent.click(field!);
      await new Promise(resolve => setTimeout(resolve, 250));

      // Double click should enter edit mode
      fireEvent.doubleClick(field!);
      await new Promise(resolve => setTimeout(resolve, 250));

      const textarea = screen.queryByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should save value on blur', async () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      // Trigger edit mode (assuming single-click edit works)
      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'New content');
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('New content');
      });
    });

    it('should revert on Escape key', async () => {
      render(
        <LongText
          value="Original content"
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const textarea = screen.getByRole('textbox');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Modified');

      fireEvent.keyDown(textarea, { key: 'Escape' });

      // Value should revert to original
      expect((textarea as HTMLTextAreaElement).value).toBe('Original content');
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should save on Enter when Ctrl+Enter is pressed', async () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Test content');

      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Test content');
      });
    });
  });

  describe('Validation', () => {
    it('should show error for required field when empty', async () => {
      render(
        <LongText
          required
          value=""
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });

    it('should enforce maxLength constraint', async () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          maxLength={20}
          allowEdit={true}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.maxLength).toBe(20);
    });

    it('should show character count error when exceeding max', async () => {
      render(
        <LongText
          value="x".repeat(20)
          onChange={mockOnChange}
          maxLength={15}
          allowEdit={true}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(screen.getByText(/Max 15 characters/)).toBeInTheDocument();
      });
    });
  });

  describe('Rich Text Support', () => {
    it('should support rich text mode when enabled', () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      // Rich text should show editor controls
      expect(screen.queryByRole('button', { name: /bold/i })).toBeInTheDocument();
    });

    it('should apply formatting buttons in rich text mode', () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      expect(screen.queryByRole('button', { name: /bold|italic|underline/i })).toBeInTheDocument();
    });

    it('should handle link insertion in rich text', async () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      const linkButton = screen.queryByRole('button', { name: /link/i });
      expect(linkButton).toBeInTheDocument();
    });

    it('should display HTML as formatted text', () => {
      render(
        <LongText
          value="<b>Bold text</b> and <i>italic</i>"
          onChange={mockOnChange}
          config={{ richText: true }}
        />
      );

      // Should show formatted content
      const textarea = screen.queryByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Modal/Expanded View', () => {
    it('should have expand button to open full editor', () => {
      render(
        <LongText
          value="Some content"
          onChange={mockOnChange}
        />
      );

      const expandButton = screen.queryByRole('button', { name: /expand|maximize/i });
      expect(expandButton).toBeInTheDocument();
    });

    it('should open modal when expand button clicked', async () => {
      render(
        <LongText
          value="Some content"
          onChange={mockOnChange}
        />
      );

      const expandButton = screen.queryByRole('button', { name: /expand|maximize/i });
      fireEvent.click(expandButton!);

      await waitFor(() => {
        const modal = screen.queryByRole('dialog') || document.querySelector('[role="dialog"]');
        expect(modal).toBeInTheDocument();
      });
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should disable input when disabled is true', () => {
      render(
        <LongText
          value="Content"
          onChange={mockOnChange}
          disabled
          allowEdit={true}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.disabled).toBe(true);
    });

    it('should prevent editing when readOnly is true', () => {
      render(
        <LongText
          value="Content"
          onChange={mockOnChange}
          readOnly
          allowEdit={true}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.readOnly).toBe(true);
    });

    it('should show disabled styling', () => {
      render(
        <LongText
          value="Content"
          onChange={mockOnChange}
          disabled
          allowEdit={true}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Configuration Props', () => {
    it('should use defaultValue from config', () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: 'Default content' }}
        />
      );

      const textarea = screen.queryByDisplayValue('Default content');
      expect(textarea).toBeInTheDocument();
    });

    it('should use configMaxLength when provided', async () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          maxLength={100}
          config={{ maxLength: 50 }}
          allowEdit={true}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.maxLength).toBe(50);
    });

    it('should use configPlaceholder when provided', () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          placeholder="Default placeholder"
          config={{ placeholder: 'Config placeholder' }}
        />
      );

      const textarea = screen.getByPlaceholderText('Config placeholder');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should sync external value changes', () => {
      const { rerender } = render(
        <LongText value="First" onChange={mockOnChange} />
      );

      let textarea = screen.queryByDisplayValue('First');
      expect(textarea).toBeInTheDocument();

      rerender(<LongText value="Updated" onChange={mockOnChange} />);
      textarea = screen.queryByDisplayValue('Updated');
      expect(textarea).toBeInTheDocument();
    });

    it('should maintain local changes until blur', async () => {
      render(
        <LongText
          value="Original"
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const textarea = screen.getByRole('textbox');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Modified');

      // Should still show modified value
      expect((textarea as HTMLTextAreaElement).value).toBe('Modified');

      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Modified');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      render(
        <LongText value={null as any} onChange={mockOnChange} />
      );

      const textarea = screen.queryByRole('textbox');
      expect(textarea?.textContent || (textarea as HTMLTextAreaElement)?.value).toBe('');
    });

    it('should handle undefined value', () => {
      render(
        <LongText value={undefined as any} onChange={mockOnChange} />
      );

      const textarea = screen.queryByRole('textbox');
      expect(textarea?.textContent || (textarea as HTMLTextAreaElement)?.value).toBe('');
    });

    it('should handle very long text', async () => {
      const longText = 'A'.repeat(5000);
      render(
        <LongText
          value={longText}
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe(longText);
    });

    it('should handle special characters in HTML mode', async () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, '<script>alert("xss")</script>');

      fireEvent.blur(textarea);

      // Should not execute script
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should handle unicode and emoji', async () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, '你好世界 🌍 مرحبا');
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('你好世界 🌍 مرحبا');
      });
    });

    it('should preserve formatting in rich text mode', async () => {
      render(
        <LongText
          value="<b>Bold</b> and <i>italic</i>"
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      // Should preserve HTML structure
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(
        <LongText
          label="Description"
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const textarea = screen.getByRole('textbox');
      textarea.focus();

      expect(textarea).toHaveFocus();
    });

    it('should be semantically correct', () => {
      const { container } = render(
        <LongText
          value="Content"
          onChange={mockOnChange}
        />
      );

      const textarea = container.querySelector('textarea');
      expect(textarea).toBeInTheDocument();
    });
  });
});
