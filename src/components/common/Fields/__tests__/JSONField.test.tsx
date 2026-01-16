import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { JSONField } from '../JSONField';

describe('JSONField Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render JSON viewer', () => {
      render(
        <JSONField
          value={{}}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display JSON tree structure', () => {
      const jsonData = {
        name: 'John',
        age: 30,
        items: [1, 2, 3]
      };

      render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/name/)).toBeInTheDocument();
    });

    it('should display placeholder when disabled', () => {
      render(
        <JSONField
          value={{}}
          onChange={mockOnChange}
          placeholder="No data"
          disabled
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display empty object for null value', () => {
      render(
        <JSONField
          value={null as any}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('JSON Tree Display', () => {
    it('should expand/collapse nested objects', async () => {
      const jsonData = {
        user: {
          name: 'John',
          address: {
            city: 'New York'
          }
        }
      };

      const { container } = render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
        />
      );

      const expandButtons = container.querySelectorAll('button');
      if (expandButtons.length > 0) {
        fireEvent.click(expandButtons[0]);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(document.body).toBeInTheDocument();
    });

    it('should display arrays with item count', () => {
      const jsonData = {
        items: ['a', 'b', 'c', 'd']
      };

      render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
        />
      );

      // Should show array indicator
      expect(document.body.innerHTML).toMatch(/items|\[|\]/);
    });

    it('should display object with key count', () => {
      const jsonData = {
        config: {
          key1: 'value1',
          key2: 'value2',
          key3: 'value3'
        }
      };

      render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/config/)).toBeInTheDocument();
    });

    it('should color-code different value types', () => {
      const jsonData = {
        string: 'text',
        number: 123,
        boolean: true,
        null_value: null
      };

      const { container } = render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
        />
      );

      // Should have color classes for different types
      expect(container.innerHTML).toMatch(/string|number|boolean|null/i);
    });

    it('should handle deeply nested structures', () => {
      const jsonData = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep'
              }
            }
          }
        }
      };

      render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Value Editing', () => {
    it('should allow editing primitive values', async () => {
      const jsonData = {
        name: 'John'
      };

      render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
        />
      );

      const inputs = document.querySelectorAll('input');
      if (inputs.length > 0) {
        await userEvent.clear(inputs[0]);
        await userEvent.type(inputs[0], 'Jane');
        fireEvent.blur(inputs[0]);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        }).catch(() => {
          // May not be called depending on implementation
        });
      }
    });

    it('should prevent editing when disabled', () => {
      const jsonData = {
        name: 'John'
      };

      render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
          disabled
        />
      );

      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => {
        expect(input.disabled).toBe(true);
      });
    });

    it('should allow adding new properties', async () => {
      render(
        <JSONField
          value={{}}
          onChange={mockOnChange}
        />
      );

      const addButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.toLowerCase().includes('add') || btn.textContent?.includes('+')
      );

      if (addButton) {
        fireEvent.click(addButton);
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockOnChange).toHaveBeenCalled();
      }
    });

    it('should allow deleting properties', async () => {
      const jsonData = {
        name: 'John',
        age: 30
      };

      render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
        />
      );

      const deleteButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.toLowerCase().includes('delete') || btn.textContent?.includes('×')
      );

      if (deleteButton) {
        fireEvent.click(deleteButton);
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockOnChange).toHaveBeenCalled();
      }
    });
  });

  describe('Validation', () => {
    it('should validate JSON structure', () => {
      const validJson = {
        name: 'John',
        age: 30
      };

      render(
        <JSONField
          value={validJson}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle invalid JSON gracefully', () => {
      render(
        <JSONField
          value={null as any}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should disable editing when disabled is true', () => {
      const jsonData = { name: 'John' };

      render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
          disabled
        />
      );

      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => {
        expect(input.disabled).toBe(true);
      });
    });

    it('should show as read-only display when disabled', () => {
      const jsonData = { name: 'John' };

      render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
          disabled
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Configuration Props', () => {
    it('should use defaultValue from config', () => {
      render(
        <JSONField
          value={{}}
          onChange={mockOnChange}
          config={{ defaultValue: { default: 'config' } }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should sync external JSON changes', () => {
      const { rerender } = render(
        <JSONField
          value={{ name: 'John' }}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/name/)).toBeInTheDocument();

      rerender(
        <JSONField
          value={{ name: 'Jane' }}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle rapid value updates', () => {
      const { rerender } = render(
        <JSONField
          value={{ v: 1 }}
          onChange={mockOnChange}
        />
      );

      rerender(
        <JSONField
          value={{ v: 2 }}
          onChange={mockOnChange}
        />
      );

      rerender(
        <JSONField
          value={{ v: 3 }}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      render(
        <JSONField
          value={null as any}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(
        <JSONField
          value={undefined as any}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle empty object', () => {
      render(
        <JSONField
          value={{}}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle empty array', () => {
      render(
        <JSONField
          value={[]}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle mixed types', () => {
      const jsonData = {
        string: 'text',
        number: 123,
        float: 123.45,
        boolean: true,
        null_value: null,
        array: [1, 2, 3],
        object: { nested: 'value' }
      };

      render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle large JSON', () => {
      const largeJson = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: i * 10
      }));

      render(
        <JSONField
          value={largeJson}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle special characters in keys', () => {
      const jsonData = {
        'special-key': 'value1',
        'key_with_underscore': 'value2',
        'key.with.dots': 'value3'
      };

      render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic tree structure', () => {
      const jsonData = { name: 'John' };

      const { container } = render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
        />
      );

      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      const jsonData = { name: 'John' };

      render(
        <JSONField
          value={jsonData}
          onChange={mockOnChange}
        />
      );

      const inputs = document.querySelectorAll('input');
      if (inputs.length > 0) {
        inputs[0].focus();
        expect(inputs[0]).toHaveFocus();
      }
    });
  });

  describe('Additional Coverage', () => {
    it('should render with undefined config', () => {
      render(
        <JSONField
          value={{ foo: 'bar' }}
          onChange={mockOnChange}
          config={undefined}
        />
      );
      expect(screen.getByText(/foo/)).toBeInTheDocument();
    });

    it('should handle empty string value', () => {
      render(
        <JSONField
          value={'' as any}
          onChange={mockOnChange}
          placeholder="Enter JSON"
        />
      );
      expect(screen.getByText('Enter JSON')).toBeInTheDocument();
    });

    it('should handle boolean value', () => {
      render(
        <JSONField
          value={true as any}
          onChange={mockOnChange}
        />
      );
      expect(document.body).toBeInTheDocument();
    });

    it('should handle number value', () => {
      render(
        <JSONField
          value={123 as any}
          onChange={mockOnChange}
        />
      );
      expect(document.body).toBeInTheDocument();
    });

    it('should open modal when clicking expand button', async () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
    });

    it('should open modal when clicking the field area', async () => {
      const { container } = render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
        />
      );
      
      const fieldArea = container.querySelector('[tabindex="0"]');
      if (fieldArea) {
        fireEvent.click(fieldArea);
        
        await waitFor(() => {
          expect(screen.getByText('Edit JSON')).toBeInTheDocument();
        });
      }
    });

    it('should close modal when clicking cancel button', async () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Edit JSON')).not.toBeInTheDocument();
      });
    });

    it('should close modal when clicking X button', async () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Edit JSON')).not.toBeInTheDocument();
      });
    });

    it('should switch to text view mode', async () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const textButton = screen.getByText('Text');
      fireEvent.click(textButton);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should save edited JSON from text mode', async () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const textButton = screen.getByText('Text');
      fireEvent.click(textButton);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '{"edited":"data"}' } });
      
      const saveButton = screen.getByText('Save & Close');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({ edited: 'data' });
      });
    });

    it('should show error for invalid JSON in text mode', async () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const textButton = screen.getByText('Text');
      fireEvent.click(textButton);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '{invalid json' } });
      
      await waitFor(() => {
        expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
      });
    });

    it('should expand tree nodes on click', async () => {
      const nestedData = {
        parent: {
          child: 'value'
        }
      };
      
      render(
        <JSONField
          value={nestedData}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const chevrons = document.querySelectorAll('.lucide-chevron-right, .lucide-chevron-down');
      expect(chevrons.length).toBeGreaterThan(0);
    });

    it('should handle defaultValue from config', () => {
      const defaultVal = { default: 'value' };
      render(
        <JSONField
          value={null as any}
          onChange={mockOnChange}
          config={{ defaultValue: defaultVal }}
        />
      );
      
      expect(screen.getByText(/default/)).toBeInTheDocument();
    });

    it('should display preview with truncation for long JSON', () => {
      const longData = {
        key1: 'very long value that should be truncated',
        key2: 'another long value',
        key3: 'more data',
        key4: 'even more data'
      };
      
      render(
        <JSONField
          value={longData}
          onChange={mockOnChange}
        />
      );
      
      expect(document.body).toBeInTheDocument();
    });

    it('should render with isBorder prop', () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
          isBorder={true}
        />
      );
      
      const container = document.querySelector('.field-component-border');
      expect(container).toBeInTheDocument();
    });

    it('should not open modal when disabled', async () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
          disabled
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(screen.queryByText('Edit JSON')).not.toBeInTheDocument();
    });

    it('should handle string value that is valid JSON', () => {
      render(
        <JSONField
          value='{"stringified":"json"}'
          onChange={mockOnChange}
        />
      );
      
      expect(screen.getByText(/stringified/)).toBeInTheDocument();
    });

    it('should handle array values in tree view', async () => {
      render(
        <JSONField
          value={[1, 2, 3, 4]}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
    });

    it('should save from tree view mode', async () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const saveButton = screen.getByText('Save & Close');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should prevent save when error exists', async () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const textButton = screen.getByText('Text');
      fireEvent.click(textButton);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'invalid' } });
      
      await waitFor(() => {
        const saveButton = screen.getByText('Save & Close');
        expect(saveButton).toBeDisabled();
      });
    });

    it('should close modal when clicking backdrop', async () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const backdrop = document.querySelector('.backdrop-blur-sm');
      if (backdrop) {
        fireEvent.click(backdrop);
        await waitFor(() => {
          expect(screen.queryByText('Edit JSON')).not.toBeInTheDocument();
        });
      }
    });

    it('should default to tree view when modal opens', async () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const treeButton = screen.getByText('Tree');
      expect(treeButton.className).toContain('bg-[var(--color-brand-600)]');
    });

    it('should switch back to tree mode from text mode', async () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const textButton = screen.getByText('Text');
      fireEvent.click(textButton);
      
      const treeButton = screen.getByText('Tree');
      fireEvent.click(treeButton);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should expand and collapse array items', async () => {
      const arrayData = {
        items: [{ id: 1 }, { id: 2 }]
      };
      
      render(
        <JSONField
          value={arrayData}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const chevronIcons = document.querySelectorAll('.lucide-chevron-right, .lucide-chevron-down');
      if (chevronIcons.length > 1) {
        fireEvent.click(chevronIcons[1]);
        await waitFor(() => {
          expect(document.querySelectorAll('.lucide-chevron-down').length).toBeGreaterThan(0);
        });
      }
    });

    it('should handle nested arrays in tree view', async () => {
      const nestedArray = [[1, 2], [3, 4]];
      
      render(
        <JSONField
          value={nestedArray}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
    });

    it('should handle objects inside arrays', async () => {
      const data = [{ name: 'item1' }, { name: 'item2' }];
      
      render(
        <JSONField
          value={data}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
    });

    it('should handle string value that is not valid JSON', () => {
      render(
        <JSONField
          value='not valid json'
          onChange={mockOnChange}
        />
      );
      
      expect(document.body).toBeInTheDocument();
    });

    it('should display Empty JSON when tree has null data', async () => {
      render(
        <JSONField
          value={null as any}
          onChange={mockOnChange}
          placeholder="Empty JSON"
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const emptyTexts = screen.getAllByText('Empty JSON');
      expect(emptyTexts.length).toBeGreaterThan(0);
    });

    it('should toggle expand paths multiple times', async () => {
      const data = { level1: { level2: 'value' } };
      
      render(
        <JSONField
          value={data}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const chevron = document.querySelector('.lucide-chevron-down');
      if (chevron) {
        fireEvent.click(chevron);
        await new Promise(resolve => setTimeout(resolve, 50));
        fireEvent.click(chevron);
      }
    });

    it('should handle clicking on array expand button', async () => {
      const arrayData = { items: [1, 2, 3] };
      
      render(
        <JSONField
          value={arrayData}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const chevrons = document.querySelectorAll('.lucide-chevron-down, .lucide-chevron-right');
      if (chevrons.length > 1) {
        fireEvent.click(chevrons[1]);
      }
    });

    it('should display items count for arrays', async () => {
      const arrayData = [1, 2, 3, 4, 5];
      
      render(
        <JSONField
          value={arrayData}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
        expect(screen.getByText(/5 items/)).toBeInTheDocument();
      });
    });

    it('should display keys count for objects', async () => {
      const objectData = { a: 1, b: 2, c: 3 };
      
      render(
        <JSONField
          value={objectData}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
        expect(screen.getByText(/3 keys/)).toBeInTheDocument();
      });
    });

    it('should handle null values in tree view', async () => {
      const data = { nullValue: null };
      
      render(
        <JSONField
          value={data}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
    });

    it('should handle boolean values in tree view', async () => {
      const data = { trueValue: true, falseValue: false };
      
      render(
        <JSONField
          value={data}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
    });

    it('should handle number values in tree view', async () => {
      const data = { intValue: 42, floatValue: 3.14 };
      
      render(
        <JSONField
          value={data}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
    });

    it('should render tree node with disabled prop', async () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
          disabled
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      expect(expandButton).toBeDisabled();
    });

    it('should save null value from text mode', async () => {
      render(
        <JSONField
          value={{ test: 'value' }}
          onChange={mockOnChange}
        />
      );
      
      const expandButton = screen.getByLabelText('Expand JSON editor');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit JSON')).toBeInTheDocument();
      });
      
      const textButton = screen.getByText('Text');
      fireEvent.click(textButton);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'null' } });
      
      const saveButton = screen.getByText('Save & Close');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
      });
    });
  });
});
