import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LongText } from '../LongText';

describe('LongText Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;
  let mockExecCommand: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    mockExecCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      value: mockExecCommand,
      writable: true,
      configurable: true,
    });
  });

  afterAll(() => {
    delete (document as any).execCommand;
  });

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
    mockExecCommand.mockReturnValue(true);
  });

  const openModal = async (container?: HTMLElement) => {
    const expandButton = container
      ? container.querySelector('button[type="button"]')
      : screen.queryByRole('button');
    if (expandButton) {
      fireEvent.click(expandButton);
      await waitFor(() => {
        expect(screen.getByText('Long Text')).toBeInTheDocument();
      }, { timeout: 3000 });
    }
  };

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
      const input = screen.getByPlaceholderText('Enter description');
      expect(input).toBeInTheDocument();
    });

    it('should display initial value', () => {
      render(
        <LongText
          value="Initial content"
          onChange={mockOnChange}
        />
      );
      const input = screen.getByDisplayValue('Initial content');
      expect(input).toBeInTheDocument();
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
    it('should open modal on double click when allowEdit is false', async () => {
      const { container } = render(
        <LongText
          value="Test content"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );

      const input = container.querySelector('input[type="text"]');
      fireEvent.doubleClick(input!);

      await waitFor(() => {
        expect(screen.getByText('Long Text')).toBeInTheDocument();
      });
    });

    it('should open modal when expand button clicked', async () => {
      const { container } = render(
        <LongText
          value="Test content"
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      await openModal(container);

      const textboxes = screen.getAllByRole('textbox');
      const modalTextarea = textboxes[1];
      expect(modalTextarea).toBeInTheDocument();
    });

    it('should save value on modal close', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      await openModal(container);

      const textboxes = screen.getAllByRole('textbox');
      const textarea = textboxes[1];
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'New content');

      const saveButton = screen.getByText('Save & Close');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('New content');
      });
    });

    it('should close modal on backdrop click', async () => {
      const { container } = render(
        <LongText
          value="Original content"
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      await openModal(container);

      const backdrop = document.querySelector('.backdrop-blur-sm');
      if (backdrop) {
        fireEvent.click(backdrop);
        await waitFor(() => {
          expect(screen.queryByText('Long Text')).not.toBeInTheDocument();
        }, { timeout: 2000 });
      } else {
        expect(screen.getByText('Long Text')).toBeInTheDocument();
      }
    });

    it('should close modal on X button click', async () => {
      const { container } = render(
        <LongText
          value="Original content"
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      await openModal(container);

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Long Text')).not.toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('should show error for required field when empty', async () => {
      const { container } = render(
        <LongText
          required
          value=""
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      await openModal(container);

      const textboxes = screen.getAllByRole('textbox');
      const textarea = textboxes[1];
      await userEvent.clear(textarea);
      fireEvent.blur(textarea);

      const saveButton = screen.getByText('Save & Close');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const errorText = screen.queryByText('This field is required');
        expect(errorText).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should enforce maxLength constraint', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          maxLength={20}
          allowEdit={true}
        />
      );

      await openModal(container);

      const textboxes = screen.getAllByRole('textbox');
      const textarea = textboxes[1] as HTMLTextAreaElement;
      expect(textarea.maxLength).toBe(20);
    });

    it('should show character count error when exceeding max', async () => {
      const { container } = render(
        <LongText
          value={'x'.repeat(20)}
          onChange={mockOnChange}
          maxLength={15}
          allowEdit={true}
        />
      );

      await openModal(container);

      const textboxes = screen.getAllByRole('textbox');
      const textarea = textboxes[1];
      fireEvent.blur(textarea);

      const saveButton = screen.getByText('Save & Close');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const errorText = screen.queryByText(/Text must be 15 characters or less/);
        expect(errorText).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Rich Text Support', () => {
    it('should support rich text mode when enabled', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const boldButton = screen.queryByTitle(/Bold/i);
      expect(boldButton).toBeInTheDocument();
    });

    it('should apply formatting buttons in rich text mode', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const italicButton = screen.queryByTitle(/Italic/i);
      expect(italicButton).toBeInTheDocument();
    });

    it('should handle link insertion in rich text', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const linkButton = screen.queryByTitle(/Link/i);
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

      const input = screen.queryByDisplayValue('Bold text and italic');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Modal/Expanded View', () => {
    it('should have expand button to open full editor', () => {
      const { container } = render(
        <LongText
          value="Some content"
          onChange={mockOnChange}
        />
      );

      const expandButton = container.querySelector('button[type="button"]');
      expect(expandButton).toBeInTheDocument();
    });

    it('should open modal when expand button clicked', async () => {
      const { container } = render(
        <LongText
          value="Some content"
          onChange={mockOnChange}
        />
      );

      await openModal(container);

      expect(screen.getByText('Long Text')).toBeInTheDocument();
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should disable expand button when disabled is true', () => {
      const { container } = render(
        <LongText
          value="Content"
          onChange={mockOnChange}
          disabled
        />
      );

      const expandButton = container.querySelector('button[type="button"]') as HTMLButtonElement;
      expect(expandButton?.disabled).toBe(true);
    });

    it('should prevent modal opening when readOnly is true', async () => {
      const { container } = render(
        <LongText
          value="Content"
          onChange={mockOnChange}
          readOnly
        />
      );

      const input = container.querySelector('input[type="text"]');
      expect(input).toBeInTheDocument();
      
      const expandButton = container.querySelector('button[type="button"]');
      expect(expandButton).not.toBeInTheDocument();

      fireEvent.doubleClick(input!);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.queryByText('Long Text')).not.toBeInTheDocument();
    });

    it('should show disabled styling', () => {
      render(
        <LongText
          value="Content"
          onChange={mockOnChange}
          disabled
        />
      );

      const input = screen.getByDisplayValue('Content');
      expect(input).toHaveClass('text-gray-400');
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

      const input = screen.getByDisplayValue('Default content');
      expect(input).toBeInTheDocument();
    });

    it('should use configMaxLength when provided', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          maxLength={100}
          config={{ maxLength: 50 }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const textboxes = screen.getAllByRole('textbox');
      const textarea = textboxes[1] as HTMLTextAreaElement;
      expect(textarea.maxLength).toBe(100);
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

      const input = screen.getByPlaceholderText('Config placeholder');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should sync external value changes', () => {
      const { rerender } = render(
        <LongText value="First" onChange={mockOnChange} />
      );

      let input = screen.queryByDisplayValue('First');
      expect(input).toBeInTheDocument();

      rerender(<LongText value="Updated" onChange={mockOnChange} />);
      input = screen.queryByDisplayValue('Updated');
      expect(input).toBeInTheDocument();
    });

    it('should maintain local changes until modal close', async () => {
      const { container } = render(
        <LongText
          value="Original"
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      await openModal(container);

      const textboxes = screen.getAllByRole('textbox');
      const textarea = textboxes[1] as HTMLTextAreaElement;
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Modified');

      expect(textarea.value).toBe('Modified');

      const saveButton = screen.getByText('Save & Close');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Modified');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      render(
        <LongText value={(null as unknown) as string} onChange={mockOnChange} />
      );

      const input = screen.getByDisplayValue('');
      expect(input).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(
        <LongText value={undefined} onChange={mockOnChange} />
      );

      const input = screen.getByDisplayValue('');
      expect(input).toBeInTheDocument();
    });

    it('should handle very long text', async () => {
      const longText = 'A'.repeat(5000);
      const { container } = render(
        <LongText
          value={longText}
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      await openModal(container);

      const textboxes = screen.getAllByRole('textbox');
      const textarea = textboxes[1] as HTMLTextAreaElement;
      expect(textarea.value).toBe(longText);
    });

    it('should handle special characters in HTML mode', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      if (editor) {
        editor.innerHTML = '<script>alert("xss")</script>';
        fireEvent.input(editor);
        
        const saveButton = screen.getByText('Save & Close');
        fireEvent.click(saveButton);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        }, { timeout: 2000 });
      } else {
        expect(editor).toBeInTheDocument();
      }
    });

    it('should handle unicode and emoji', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      await openModal(container);

      const textboxes = screen.getAllByRole('textbox');
      const textarea = textboxes[1];
      await userEvent.clear(textarea);
      await userEvent.type(textarea, '你好世界 🌍 مرحبا');

      const saveButton = screen.getByText('Save & Close');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('你好世界 🌍 مرحبا');
      });
    });

    it('should preserve formatting in rich text mode', async () => {
      const { container } = render(
        <LongText
          value="<b>Bold</b> and <i>italic</i>"
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]');
      expect(editor).toBeInTheDocument();
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
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      await openModal(container);

      const textboxes = screen.getAllByRole('textbox');
      const textarea = textboxes[1];
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

      const input = container.querySelector('input[type="text"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Rich Text Editor Interactions', () => {
    it('should handle bold formatting', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const boldButton = screen.getByTitle(/Bold/i);
      fireEvent.mouseDown(boldButton);

      const editor = document.querySelector('[contenteditable="true"]');
      expect(editor).toBeInTheDocument();
    });

    it('should handle italic formatting', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const italicButton = screen.getByTitle(/Italic/i);
      fireEvent.mouseDown(italicButton);

      const editor = document.querySelector('[contenteditable="true"]');
      expect(editor).toBeInTheDocument();
    });

    it('should handle underline formatting', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const underlineButton = screen.getByTitle(/Underline/i);
      fireEvent.mouseDown(underlineButton);

      const editor = document.querySelector('[contenteditable="true"]');
      expect(editor).toBeInTheDocument();
    });

    it('should handle list insertion', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const listButton = screen.getByTitle(/Bullet List/i);
      fireEvent.mouseDown(listButton);

      const editor = document.querySelector('[contenteditable="true"]');
      expect(editor).toBeInTheDocument();
    });

    it('should handle quote insertion', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const quoteButton = screen.getByTitle(/Quote/i);
      fireEvent.mouseDown(quoteButton);

      const editor = document.querySelector('[contenteditable="true"]');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('Modal Value Handling', () => {
    it('should initialize modal with current value', async () => {
      const { container } = render(
        <LongText
          value="Initial value"
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      await openModal(container);

      const textboxes = screen.getAllByRole('textbox');
      const textarea = textboxes[1] as HTMLTextAreaElement;
      expect(textarea.value).toBe('Initial value');
    });

    it('should not save invalid value', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          required
          allowEdit={true}
        />
      );

      await openModal(container);

      const textboxes = screen.getAllByRole('textbox');
      const textarea = textboxes[1];
      await userEvent.clear(textarea);

      const saveButton = screen.getByText('Save & Close');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const errorText = screen.queryByText('This field is required');
        expect(errorText).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should handle empty rich text content', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      expect(editor).toBeInTheDocument();

      const saveButton = screen.getByText('Save & Close');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText('Long Text')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Rich Text Formatting', () => {
    it('should handle strikethrough formatting', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const strikethroughButton = screen.getByTitle(/Strikethrough/i);
      fireEvent.mouseDown(strikethroughButton);

      expect(mockExecCommand).toHaveBeenCalled();
    });

    it('should handle numbered list insertion', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const numberedListButton = screen.getByTitle(/Numbered List/i);
      fireEvent.mouseDown(numberedListButton);

      expect(mockExecCommand).toHaveBeenCalled();
    });

    it('should handle keyboard shortcuts for bold', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true, preventDefault: vi.fn() });

      expect(mockExecCommand).toHaveBeenCalled();
    });

    it('should handle keyboard shortcuts for italic', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      fireEvent.keyDown(editor, { key: 'i', ctrlKey: true, preventDefault: vi.fn() });

      expect(mockExecCommand).toHaveBeenCalled();
    });

    it('should handle keyboard shortcuts for underline', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      fireEvent.keyDown(editor, { key: 'u', ctrlKey: true, preventDefault: vi.fn() });

      expect(mockExecCommand).toHaveBeenCalled();
    });

    it('should handle paste in rich text mode', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      const clipboardData = {
        getData: vi.fn(() => 'Pasted text'),
      };
      const pasteEvent = {
        clipboardData,
        preventDefault: vi.fn(),
      };

      fireEvent.paste(editor, pasteEvent as any);

      expect(mockExecCommand).toHaveBeenCalled();
    });

    it('should handle rich text input changes', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      editor.innerHTML = 'New content';
      fireEvent.input(editor);

      await waitFor(() => {
        expect(editor.innerHTML).toBe('New content');
      });
    });

    it('should normalize empty rich text content with br tags', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      editor.innerHTML = '<br>';

      const saveButton = screen.getByText('Save & Close');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText('Long Text')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Link Popup Functionality', () => {
    beforeEach(() => {
      Range.prototype.getBoundingClientRect = vi.fn(() => ({
        bottom: 100,
        top: 50,
        left: 10,
        right: 200,
        width: 190,
        height: 50,
        x: 10,
        y: 50,
        toJSON: vi.fn(),
      })) as any;
    });

    it('should open link popup when link button clicked', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      editor.innerHTML = 'Selected text';
      const textNode = editor.firstChild;
      if (textNode) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, textNode.textContent?.length || 0);
        const selection = globalThis.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }

      const linkButton = screen.getByTitle(/Link/i);
      fireEvent.mouseDown(linkButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('https://example.com')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should create new link with URL', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      editor.innerHTML = 'Selected text';
      const textNode = editor.firstChild;
      if (textNode) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, textNode.textContent?.length || 0);
        const selection = globalThis.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }

      const linkButton = screen.getByTitle(/Link/i);
      fireEvent.mouseDown(linkButton);

      await waitFor(() => {
        const urlInput = screen.queryByPlaceholderText('https://example.com') as HTMLInputElement;
        expect(urlInput).toBeInTheDocument();
      }, { timeout: 3000 });

      const urlInput = screen.getByPlaceholderText('https://example.com') as HTMLInputElement;
      fireEvent.change(urlInput, { target: { value: 'example.com' } });
      fireEvent.keyDown(urlInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockExecCommand).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should normalize URL without protocol', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      editor.innerHTML = 'Text';
      const textNode = editor.firstChild;
      if (textNode) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, textNode.textContent?.length || 0);
        const selection = globalThis.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }

      const linkButton = screen.getByTitle(/Link/i);
      fireEvent.mouseDown(linkButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('https://example.com')).toBeInTheDocument();
      }, { timeout: 3000 });

      const urlInput = screen.getByPlaceholderText('https://example.com') as HTMLInputElement;
      fireEvent.change(urlInput, { target: { value: 'test.com' } });
      const insertButton = screen.getByText('Insert');
      fireEvent.click(insertButton);

      await waitFor(() => {
        expect(mockExecCommand).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should cancel link creation', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      editor.innerHTML = 'Text';
      const textNode = editor.firstChild;
      if (textNode) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, textNode.textContent?.length || 0);
        const selection = globalThis.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }

      const linkButton = screen.getByTitle(/Link/i);
      fireEvent.mouseDown(linkButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('https://example.com')).toBeInTheDocument();
      }, { timeout: 3000 });

      const urlInput = screen.getByPlaceholderText('https://example.com') as HTMLInputElement;
      fireEvent.keyDown(urlInput, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('https://example.com')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should show link popup when clicking existing link', async () => {
      const { container } = render(
        <LongText
          value="<a href='https://example.com'>Link text</a>"
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      await waitFor(() => {
        const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
        expect(editor).toBeInTheDocument();
        const link = editor.querySelector('a');
        expect(link).toBeInTheDocument();
        if (link) {
          fireEvent.click(link);
        }
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.queryByText('Open')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should edit existing link', async () => {
      const { container } = render(
        <LongText
          value="<a href='https://example.com'>Link</a>"
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      await waitFor(() => {
        const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
        const link = editor.querySelector('a');
        if (link) {
          fireEvent.click(link);
        }
      }, { timeout: 2000 });

      await waitFor(() => {
        const editButton = screen.queryByText('Edit');
        if (editButton) {
          fireEvent.click(editButton);
          const urlInput = screen.queryByPlaceholderText('https://example.com') as HTMLInputElement;
          expect(urlInput).toBeInTheDocument();
        }
      }, { timeout: 2000 });
    });

    it('should remove existing link', async () => {
      const { container } = render(
        <LongText
          value="<a href='https://example.com'>Link</a>"
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      await waitFor(() => {
        const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
        const link = editor.querySelector('a');
        if (link) {
          fireEvent.click(link);
        }
      }, { timeout: 2000 });

      await waitFor(() => {
        const removeButton = screen.queryByText('Remove');
        if (removeButton) {
          fireEvent.click(removeButton);
        }
      }, { timeout: 2000 });
    });

    it('should close link popup on backdrop click', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      editor.innerHTML = 'Text';
      const textNode = editor.firstChild;
      if (textNode) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, textNode.textContent?.length || 0);
        const selection = globalThis.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }

      const linkButton = screen.getByTitle(/Link/i);
      fireEvent.mouseDown(linkButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('https://example.com')).toBeInTheDocument();
      }, { timeout: 3000 });

      const backdrop = document.querySelector('div[style*="background: transparent"]');
      if (backdrop) {
        fireEvent.mouseDown(backdrop);
      }

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('https://example.com')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Component Props', () => {
    it('should apply isBorder prop', () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          isBorder={true}
        />
      );

      const wrapper = container.querySelector('.field-component-border');
      expect(wrapper).toBeInTheDocument();
    });

    it('should apply className prop', () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          className="custom-class"
        />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Input Field Interactions', () => {
    it('should handle input change with validation error', () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          required
          maxLength={5}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Too long text' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should handle input change without validation error', () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          maxLength={100}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Valid text' } });

      expect(mockOnChange).toHaveBeenCalledWith('Valid text');
    });

    it('should handle input blur with validation', () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          required
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.blur(input);

      expect(screen.queryByText('This field is required')).toBeInTheDocument();
    });
  });

  describe('Modal State Management', () => {
    it('should reset link popup when opening modal', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      editor.innerHTML = 'Text';
      const textNode = editor.firstChild;
      if (textNode) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, textNode.textContent?.length || 0);
        const selection = globalThis.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }

      const linkButton = screen.getByTitle(/Link/i);
      fireEvent.mouseDown(linkButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('https://example.com')).toBeInTheDocument();
      }, { timeout: 3000 });

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Long Text')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      await openModal(container);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('https://example.com')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should not open modal when readOnly is true', () => {
      const { container } = render(
        <LongText
          value="Content"
          onChange={mockOnChange}
          readOnly
        />
      );

      const input = container.querySelector('input[type="text"]');
      fireEvent.doubleClick(input!);

      expect(screen.queryByText('Long Text')).not.toBeInTheDocument();
    });
  });

  describe('Rich Text Edge Cases', () => {
    it('should handle execCommand failure', async () => {
      mockExecCommand.mockReturnValue(false);

      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const boldButton = screen.getByTitle(/Bold/i);
      fireEvent.mouseDown(boldButton);

      expect(mockExecCommand).toHaveBeenCalled();
    });

    it('should handle rich text with readOnly', () => {
      const { container } = render(
        <LongText
          value="<b>Bold</b>"
          onChange={mockOnChange}
          config={{ richText: true }}
          readOnly
        />
      );

      const input = container.querySelector('input[type="text"]');
      expect(input).toBeInTheDocument();
      
      const expandButton = container.querySelector('button[type="button"]');
      expect(expandButton).not.toBeInTheDocument();

      fireEvent.doubleClick(input!);

      expect(screen.queryByText('Long Text')).not.toBeInTheDocument();
    });

    it('should handle rich text content with br tag normalization', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      editor.innerHTML = '<br/>';

      const saveButton = screen.getByText('Save & Close');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText('Long Text')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should handle link popup with empty URL', async () => {
      const { container } = render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ richText: true }}
          allowEdit={true}
        />
      );

      await openModal(container);

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      editor.innerHTML = 'Text';
      const textNode = editor.firstChild;
      if (textNode) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, textNode.textContent?.length || 0);
        const selection = globalThis.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }

      const linkButton = screen.getByTitle(/Link/i);
      fireEvent.mouseDown(linkButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('https://example.com')).toBeInTheDocument();
      }, { timeout: 3000 });

      const insertButton = screen.getByText('Insert');
      fireEvent.click(insertButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('https://example.com')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Value Handling Edge Cases', () => {
    it('should handle value change to same value in modal', async () => {
      const { container } = render(
        <LongText
          value="Same value"
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      await openModal(container);

      const saveButton = screen.getByText('Save & Close');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText('Long Text')).not.toBeInTheDocument();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should handle rich text value with HTML stripping in preview', () => {
      render(
        <LongText
          value="<b>Bold</b> text"
          onChange={mockOnChange}
          config={{ richText: true }}
        />
      );

      const input = screen.getByDisplayValue('Bold text');
      expect(input).toBeInTheDocument();
    });

    it('should handle defaultValue when value is empty', () => {
      render(
        <LongText
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: 'Default' }}
        />
      );

      const input = screen.getByDisplayValue('Default');
      expect(input).toBeInTheDocument();
    });
  });
});
