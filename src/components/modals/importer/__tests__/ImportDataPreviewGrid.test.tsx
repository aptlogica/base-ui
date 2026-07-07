import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImportDataPreviewGrid } from '../ImportDataPreviewGrid';
import type { ImportColumnMapping, ImportPreview } from '../ImportTypes';

vi.mock('lucide-react', () => ({
  Dot: () => <span data-testid="dot-icon" />,
}));

const createPreview = (overrides?: Partial<ImportPreview>): ImportPreview => ({
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
  ],
  rows: [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' },
  ],
  totalRows: 2,
  ...overrides,
});

const createMappings = (): Record<string, ImportColumnMapping> => ({
  name: {
    sourceName: 'Full Name',
    include: true,
    fieldType: 'text',
    defaultValue: '',
  },
  email: {
    sourceName: 'Email Address',
    include: true,
    fieldType: 'email',
    defaultValue: '',
  },
});

describe('ImportDataPreviewGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the data preview title', () => {
      render(
        <ImportDataPreviewGrid preview={createPreview()} mappings={createMappings()} />
      );

      expect(screen.getByText('Data preview')).toBeInTheDocument();
    });

    it('should render row count summary text', () => {
      render(
        <ImportDataPreviewGrid preview={createPreview()} mappings={createMappings()} />
      );

      expect(screen.getByText(/Showing 2 of 2 rows/)).toBeInTheDocument();
    });

    it('should render total records from preview totalRows', () => {
      render(
        <ImportDataPreviewGrid
          preview={createPreview({ totalRows: 500 })}
          mappings={createMappings()}
        />
      );

      expect(screen.getByText(/500 total records in CSV file/)).toBeInTheDocument();
    });

    it('should render column headers from mapping source names', () => {
      render(
        <ImportDataPreviewGrid preview={createPreview()} mappings={createMappings()} />
      );

      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('should render cell values from preview rows', () => {
      render(
        <ImportDataPreviewGrid preview={createPreview()} mappings={createMappings()} />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });
  });

  describe('Column visibility', () => {
    it('should hide columns marked as not included', () => {
      const mappings = createMappings();
      mappings.email = { ...mappings.email, include: false };

      render(<ImportDataPreviewGrid preview={createPreview()} mappings={mappings} />);

      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.queryByText('Email Address')).not.toBeInTheDocument();
    });

    it('should use column label when source name is missing', () => {
      const mappings: Record<string, ImportColumnMapping> = {
        name: {
          sourceName: '',
          include: true,
          fieldType: 'text',
          defaultValue: '',
        },
      };
      const preview: ImportPreview = {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ name: 'Alice' }],
        totalRows: 1,
      };

      render(<ImportDataPreviewGrid preview={preview} mappings={mappings} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should render empty message when no preview rows exist', () => {
      const preview: ImportPreview = {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [],
        totalRows: 0,
      };

      render(
        <ImportDataPreviewGrid
          preview={preview}
          mappings={{
            name: { sourceName: 'Name', include: true, fieldType: 'text', defaultValue: '' },
          }}
        />
      );

      expect(screen.getByText('No preview rows available.')).toBeInTheDocument();
    });
  });

  describe('Remove empty rows', () => {
    it('should filter out rows where all cells are empty', () => {
      const preview: ImportPreview = {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ name: 'Alice' }, { name: '' }, { name: '   ' }],
        totalRows: 3,
      };

      render(
        <ImportDataPreviewGrid
          preview={preview}
          mappings={{
            name: { sourceName: 'Name', include: true, fieldType: 'text', defaultValue: '' },
          }}
          removeEmptyRows
        />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText(/Showing 1 of 1 rows/)).toBeInTheDocument();
    });

    it('should keep all rows when removeEmptyRows is false', () => {
      const preview: ImportPreview = {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ name: 'Alice' }, { name: '' }],
        totalRows: 2,
      };

      render(
        <ImportDataPreviewGrid
          preview={preview}
          mappings={{
            name: { sourceName: 'Name', include: true, fieldType: 'text', defaultValue: '' },
          }}
        />
      );

      expect(screen.getByText(/Showing 2 of 2 rows/)).toBeInTheDocument();
    });
  });

  describe('Remove duplicate records', () => {
    it('should filter out duplicate rows when enabled', () => {
      const preview: ImportPreview = {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ name: 'Alice' }, { name: 'Alice' }, { name: 'Bob' }],
        totalRows: 3,
      };

      render(
        <ImportDataPreviewGrid
          preview={preview}
          mappings={{
            name: { sourceName: 'Name', include: true, fieldType: 'text', defaultValue: '' },
          }}
          removeDuplicateRecords
        />
      );

      expect(screen.getByText(/Showing 2 of 2 rows/)).toBeInTheDocument();
    });
  });

  describe('Cell formatting', () => {
    it('should truncate cell values longer than 96 characters', () => {
      const longText = 'A'.repeat(100);
      const preview: ImportPreview = {
        columns: [{ key: 'notes', label: 'Notes' }],
        rows: [{ notes: longText }],
        totalRows: 1,
      };

      render(
        <ImportDataPreviewGrid
          preview={preview}
          mappings={{
            notes: { sourceName: 'Notes', include: true, fieldType: 'text', defaultValue: '' },
          }}
        />
      );

      expect(screen.getByText(`${'A'.repeat(93)}...`)).toBeInTheDocument();
    });

    it('should render empty string for null cell values', () => {
      const preview: ImportPreview = {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ name: null }],
        totalRows: 1,
      };

      const { container } = render(
        <ImportDataPreviewGrid
          preview={preview}
          mappings={{
            name: { sourceName: 'Name', include: true, fieldType: 'text', defaultValue: '' },
          }}
        />
      );

      const cell = container.querySelector('tbody td span');
      expect(cell?.textContent).toBe('');
    });

    it('should stringify date cell values as iso strings', () => {
      const date = new Date('2024-06-15T12:00:00.000Z');
      const preview: ImportPreview = {
        columns: [{ key: 'created', label: 'Created' }],
        rows: [{ created: date }],
        totalRows: 1,
      };

      render(
        <ImportDataPreviewGrid
          preview={preview}
          mappings={{
            created: { sourceName: 'Created', include: true, fieldType: 'date', defaultValue: '' },
          }}
        />
      );

      expect(screen.getByText(date.toISOString())).toBeInTheDocument();
    });

    it('should stringify object cell values as json', () => {
      const preview: ImportPreview = {
        columns: [{ key: 'meta', label: 'Meta' }],
        rows: [{ meta: { key: 'value' } }],
        totalRows: 1,
      };

      render(
        <ImportDataPreviewGrid
          preview={preview}
          mappings={{
            meta: { sourceName: 'Meta', include: true, fieldType: 'json', defaultValue: '' },
          }}
        />
      );

      expect(screen.getByText('{"key":"value"}')).toBeInTheDocument();
    });

    it('should stringify number cell values as strings', () => {
      const preview: ImportPreview = {
        columns: [{ key: 'count', label: 'Count' }],
        rows: [{ count: 42 }],
        totalRows: 1,
      };

      render(
        <ImportDataPreviewGrid
          preview={preview}
          mappings={{
            count: { sourceName: 'Count', include: true, fieldType: 'number', defaultValue: '' },
          }}
        />
      );

      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('Row limit', () => {
    it('should display at most 100 preview rows', () => {
      const rows = Array.from({ length: 150 }, (_, index) => ({ name: `Row ${index}` }));
      const preview: ImportPreview = {
        columns: [{ key: 'name', label: 'Name' }],
        rows,
        totalRows: 150,
      };

      render(
        <ImportDataPreviewGrid
          preview={preview}
          mappings={{
            name: { sourceName: 'Name', include: true, fieldType: 'text', defaultValue: '' },
          }}
        />
      );

      expect(screen.getByText(/Showing 100 of 150 rows/)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should use rows length when totalRows is not provided', () => {
      const preview: ImportPreview = {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ name: 'Alice' }],
      };

      render(
        <ImportDataPreviewGrid
          preview={preview}
          mappings={{
            name: { sourceName: 'Name', include: true, fieldType: 'text', defaultValue: '' },
          }}
        />
      );

      expect(screen.getByText(/1 total records in CSV file/)).toBeInTheDocument();
    });
  });
});
