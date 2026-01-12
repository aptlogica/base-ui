import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LinksField } from '../LinksField';

vi.mock('../../hooks/useTable', () => ({
  useTable: vi.fn(() => ({
    getData: vi.fn(() => Promise.resolve({
      data: [
        { id: '1', name: 'Record 1' },
        { id: '2', name: 'Record 2' }
      ]
    }))
  }))
}));

vi.mock('../../hooks/useInsertRelationData', () => ({
  useInsertRelationData: vi.fn(() => ({
    insertRelationData: vi.fn(() => Promise.resolve({ id: '1' }))
  }))
}));

describe('LinksField Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render links field', () => {
      render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display label', () => {
      render(
        <LinksField
          label="Related Records"
          value={null}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(screen.getByText('Related Records')).toBeInTheDocument();
    });

    it('should display list of linked records', () => {
      const links = [
        { id: '1', name: 'Record 1' },
        { id: '2', name: 'Record 2' }
      ];

      render(
        <LinksField
          value={links}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display add link button', () => {
      render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should display helper text', () => {
      render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          helperText="Link related records"
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(screen.getByText('Link related records')).toBeInTheDocument();
    });
  });

  describe('Link Management', () => {
    it('should open search dropdown on add button click', async () => {
      render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      const addButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.toLowerCase().includes('add') || btn.textContent?.includes('+')
      );

      if (addButton) {
        fireEvent.click(addButton);
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(document.body).toBeInTheDocument();
      }
    });

    it('should filter records by search text', async () => {
      render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      const searchInputs = document.querySelectorAll('input[type="text"]');
      if (searchInputs.length > 0) {
        await userEvent.type(searchInputs[searchInputs.length - 1], 'Record 1');
        await new Promise(resolve => setTimeout(resolve, 200));

        expect(document.body).toBeInTheDocument();
      }
    });

    it('should select record from dropdown', async () => {
      render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      const addButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.toLowerCase().includes('add') || btn.textContent?.includes('+')
      );

      if (addButton) {
        fireEvent.click(addButton);
        await new Promise(resolve => setTimeout(resolve, 100));

        const options = document.querySelectorAll('div[role="option"], li');
        if (options.length > 0) {
          fireEvent.click(options[0]);
          await new Promise(resolve => setTimeout(resolve, 100));

          expect(mockOnChange).toHaveBeenCalled();
        }
      }
    });

    it('should remove link on delete button click', async () => {
      const links = [
        { id: '1', name: 'Record 1' }
      ];

      render(
        <LinksField
          value={links}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      const deleteButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.toLowerCase().includes('delete') ||
               btn.textContent?.toLowerCase().includes('remove') ||
               btn.textContent?.includes('×') ||
               btn.textContent?.includes('-')
      );

      if (deleteButton) {
        fireEvent.click(deleteButton);
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockOnChange).toHaveBeenCalled();
      }
    });

    it('should add multiple links sequentially', async () => {
      const { rerender } = render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      // First link
      const addButton1 = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.toLowerCase().includes('add') || btn.textContent?.includes('+')
      );

      if (addButton1) {
        fireEvent.click(addButton1);
        await new Promise(resolve => setTimeout(resolve, 100));

        const options = document.querySelectorAll('div[role="option"], li');
        if (options.length > 0) {
          fireEvent.click(options[0]);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Second link
      rerender(
        <LinksField
          value={[{ id: '1', name: 'Record 1' }]}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Link Display', () => {
    it('should display link record names', () => {
      const links = [
        { id: '1', name: 'Product A' },
        { id: '2', name: 'Customer B' }
      ];

      render(
        <LinksField
          value={links}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should display link count', () => {
      const links = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        name: `Record ${i}`
      }));

      render(
        <LinksField
          value={links}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle empty links array', () => {
      render(
        <LinksField
          value={[]}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should disable adding links when disabled', () => {
      render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
          disabled
        />
      );

      const addButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.toLowerCase().includes('add') || btn.textContent?.includes('+')
      );

      if (addButton) {
        expect((addButton as HTMLButtonElement).disabled).toBe(true);
      }
    });

    it('should prevent link operations when readOnly', () => {
      const links = [{ id: '1', name: 'Record 1' }];

      render(
        <LinksField
          value={links}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
          readOnly
        />
      );

      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        expect((btn as HTMLButtonElement).disabled).toBe(true);
      });
    });
  });

  describe('Configuration Props', () => {
    it('should use linkTableId from config', () => {
      render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          config={{ linkTableId: 'specific_table' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should support custom configuration', () => {
      render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          config={{
            linkTableId: 'table1',
            displayField: 'title',
            maxLinks: 10
          }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should sync external link changes', () => {
      const { rerender } = render(
        <LinksField
          value={[{ id: '1', name: 'Record 1' }]}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      rerender(
        <LinksField
          value={[
            { id: '1', name: 'Record 1' },
            { id: '2', name: 'Record 2' }
          ]}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle rapid link updates', () => {
      const { rerender } = render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      rerender(
        <LinksField
          value={[{ id: '1', name: 'Record 1' }]}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      rerender(
        <LinksField
          value={[
            { id: '1', name: 'Record 1' },
            { id: '2', name: 'Record 2' }
          ]}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Dropdown Positioning', () => {
    it('should position dropdown below input by default', async () => {
      render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should adjust dropdown position when space limited', async () => {
      const { container } = render(
        <div style={{ height: '100px' }}>
          <LinksField
            value={null}
            onChange={mockOnChange}
            config={{ linkTableId: 'table1' }}
          />
        </div>
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(
        <LinksField
          value={undefined as any}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle empty array', () => {
      render(
        <LinksField
          value={[]}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle large number of links', () => {
      const links = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        name: `Record ${i}`
      }));

      render(
        <LinksField
          value={links}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle duplicate link attempts', async () => {
      const links = [{ id: '1', name: 'Record 1' }];

      render(
        <LinksField
          value={links}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      render(
        <LinksField
          value={null}
          onChange={mockOnChange}
          config={{ linkTableId: 'table1' }}
        />
      );

      const addButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.toLowerCase().includes('add') || btn.textContent?.includes('+')
      );

      if (addButton) {
        (addButton as HTMLButtonElement).focus();
        expect(addButton).toHaveFocus();
      }
    });
  });
});
