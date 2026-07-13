import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldType } from '../../../../types/fieldTypes';
import { ImportColumnMapper } from '../ImportColumnMapper';
import type { ImportColumnMapping, ImportPreview } from '../ImportTypes';

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Key: () => <span data-testid="key-icon" />,
  };
});

vi.mock('../../../common/dropdown/AdvancedDropdown', () => ({
  default: ({
    options = [],
    value,
    onChange,
    disabled,
    placeholder,
  }: {
    options?: Array<{ value: string; label: string }>;
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
  }) => (
    <select
      data-testid={placeholder || 'advanced-dropdown'}
      disabled={disabled}
      value={value || ''}
      onChange={(event) => onChange?.(event.target.value)}
    >
      <option value="">none</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('../../../../types/fieldTypes', () => ({
  FieldType: {
    Text: 'text',
    Email: 'email',
    Number: 'number',
  },
  getFieldTypeIconComponent: vi.fn(() => <span data-testid="field-type-icon" />),
}));

vi.mock('../importFieldConfig', () => ({
  getAllowedImportFieldOptions: vi.fn(() => [
    { key: 'text', label: 'Single line text', icon: null },
    { key: 'email', label: 'Email', icon: null },
    { key: 'number', label: 'Number', icon: null },
  ]),
}));

vi.mock('../DefaultValueEditor', () => ({
  DefaultValueEditor: ({
    value,
    onChange,
    disabled,
    fieldType,
  }: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    fieldType: string;
  }) => (
    <input
      data-testid={`default-value-${fieldType}`}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

const createPreview = (): ImportPreview => ({
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
  ],
  rows: [
    { name: 'Alice', email: 'alice@example.com' },
  ],
  totalRows: 1,
});

const createMappings = (): Record<string, ImportColumnMapping> => ({
  name: {
    sourceName: 'Name',
    include: true,
    fieldType: FieldType.Text,
    defaultValue: '',
  },
  email: {
    sourceName: 'Email',
    include: true,
    fieldType: FieldType.Email,
    defaultValue: '',
  },
});

describe('ImportColumnMapper', () => {
  const mockOnChange = vi.fn();
  const mockOnPrimaryKeyChange = vi.fn();

  const defaultProps = {
    preview: createPreview(),
    mappings: createMappings(),
    onChange: mockOnChange,
    primaryKey: null as string | null,
    onPrimaryKeyChange: mockOnPrimaryKeyChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render configure columns title', () => {
      render(<ImportColumnMapper {...defaultProps} />);

      expect(screen.getByText('Configure Columns')).toBeInTheDocument();
    });

    it('should render column detection summary', () => {
      render(<ImportColumnMapper {...defaultProps} />);

      expect(screen.getByText(/2 columns detected/)).toBeInTheDocument();
      expect(screen.getByText(/2 columns selected for import/)).toBeInTheDocument();
    });

    it('should render primary column section', () => {
      render(<ImportColumnMapper {...defaultProps} />);

      expect(screen.getByText('Primary Column')).toBeInTheDocument();
    });

    it('should render column header labels', () => {
      render(<ImportColumnMapper {...defaultProps} />);

      expect(screen.getByText('Column Name')).toBeInTheDocument();
      expect(screen.getByText('Column Title')).toBeInTheDocument();
      expect(screen.getByText('Column Type')).toBeInTheDocument();
      expect(screen.getByText('Default Value')).toBeInTheDocument();
    });

    it('should render each column label in the grid', () => {
      render(<ImportColumnMapper {...defaultProps} />);

      expect(screen.getByTitle('Name')).toBeInTheDocument();
      expect(screen.getByTitle('Email')).toBeInTheDocument();
    });

    it('should render empty state when no columns are detected', () => {
      const preview: ImportPreview = { columns: [], rows: [], totalRows: 0 };

      render(<ImportColumnMapper {...defaultProps} preview={preview} mappings={{}} />);

      expect(screen.getByText('No columns detected.')).toBeInTheDocument();
    });
  });

  describe('Include checkbox', () => {
    it('should call onChange with include false when column is unchecked', async () => {
      const user = userEvent.setup();
      render(<ImportColumnMapper {...defaultProps} />);

      await user.click(screen.getByLabelText('Exclude Name'));

      expect(mockOnChange).toHaveBeenCalledWith('name', { include: false });
    });

    it('should call onChange with include true when excluded column is checked', async () => {
      const user = userEvent.setup();
      const mappings = createMappings();
      mappings.name = { ...mappings.name, include: false };

      render(<ImportColumnMapper {...defaultProps} mappings={mappings} />);

      await user.click(screen.getByLabelText('Include Name'));

      expect(mockOnChange).toHaveBeenCalledWith('name', { include: true });
    });
  });

  describe('Source name input', () => {
    it('should call onChange when source name is edited', async () => {
      const user = userEvent.setup();
      render(<ImportColumnMapper {...defaultProps} />);

      const [firstSourceInput] = screen.getAllByPlaceholderText('Column title');
      await user.clear(firstSourceInput);
      await user.type(firstSourceInput, 'Full Name');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should disable source name input when column is excluded', () => {
      const mappings = createMappings();
      mappings.name = { ...mappings.name, include: false };

      render(<ImportColumnMapper {...defaultProps} mappings={mappings} />);

      const sourceInputs = screen.getAllByPlaceholderText('Column title');
      expect(sourceInputs[0]).toBeDisabled();
    });
  });

  describe('Field type dropdown', () => {
    it('should call onChange when field type is changed', async () => {
      const user = userEvent.setup();
      render(<ImportColumnMapper {...defaultProps} />);

      const [firstFieldTypeDropdown] = screen.getAllByTestId('Select field type');
      await user.selectOptions(firstFieldTypeDropdown, FieldType.Number);

      expect(mockOnChange).toHaveBeenCalledWith('name', { fieldType: FieldType.Number });
    });

    it('should disable field type dropdown when column is excluded', () => {
      const mappings = createMappings();
      mappings.name = { ...mappings.name, include: false };

      render(<ImportColumnMapper {...defaultProps} mappings={mappings} />);

      const fieldTypeDropdowns = screen.getAllByTestId('Select field type');
      expect(fieldTypeDropdowns[0]).toBeDisabled();
    });
  });

  describe('Default value editor', () => {
    it('should call onChange when default value is changed', async () => {
      const user = userEvent.setup();
      render(<ImportColumnMapper {...defaultProps} />);

      const defaultInput = screen.getByTestId(`default-value-${FieldType.Text}`);
      await user.type(defaultInput, 'N/A');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should disable default value editor when column is excluded', () => {
      const mappings = createMappings();
      mappings.name = { ...mappings.name, include: false };

      render(<ImportColumnMapper {...defaultProps} mappings={mappings} />);

      const defaultInput = screen.getByTestId(`default-value-${FieldType.Text}`);
      expect(defaultInput).toBeDisabled();
    });
  });

  describe('Primary key', () => {
    it('should call onPrimaryKeyChange when primary key is selected', async () => {
      const user = userEvent.setup();
      render(<ImportColumnMapper {...defaultProps} />);

      await user.selectOptions(
        screen.getByTestId('Select primary key column'),
        'Name'
      );

      expect(mockOnPrimaryKeyChange).toHaveBeenCalledWith('Name');
    });

    it('should call onPrimaryKeyChange with null when primary key is cleared', async () => {
      const user = userEvent.setup();
      render(<ImportColumnMapper {...defaultProps} primaryKey="Name" />);

      await user.selectOptions(
        screen.getByTestId('Select primary key column'),
        'none'
      );

      expect(mockOnPrimaryKeyChange).toHaveBeenCalledWith(null);
    });

    it('should show key icon for primary column row', () => {
      render(<ImportColumnMapper {...defaultProps} primaryKey="Name" />);

      expect(screen.getByTestId('key-icon')).toBeInTheDocument();
    });

    it('should display primary column error message', () => {
      render(
        <ImportColumnMapper
          {...defaultProps}
          primaryKey="Name"
          primaryColumnError="Primary column has empty values"
        />
      );

      expect(screen.getByText('Primary column has empty values')).toBeInTheDocument();
    });

    it('should not display primary column error when primary key is not selected', () => {
      render(
        <ImportColumnMapper
          {...defaultProps}
          primaryKey={null}
          primaryColumnError="Primary column has empty values"
        />
      );

      expect(screen.queryByText('Primary column has empty values')).not.toBeInTheDocument();
    });
  });

  describe('Included count', () => {
    it('should show one selected column when one column is excluded', () => {
      const mappings = createMappings();
      mappings.email = { ...mappings.email, include: false };

      render(<ImportColumnMapper {...defaultProps} mappings={mappings} />);

      expect(screen.getByText(/1 columns selected for import/)).toBeInTheDocument();
    });
  });
});
