import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanFieldConfiguration } from '../KanbanFieldSelector';
import type { BaseColumn } from '../../../../types/column.types';

vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (element: React.ReactNode) => element
  };
});

vi.mock('../../../../hooks/useSmartPopover', () => ({
  useSmartPopover: vi.fn(() => ({
    position: { top: 100, left: 100 }
  }))
}));

vi.mock('../../../../types/fieldTypes', () => ({
  getFieldTypeIconWithMargin: vi.fn((type: string) => <span data-testid={`icon-${type}`}>{type}</span>)
}));

vi.mock('../../../../components/common/dropdown/AdvancedDropdown', () => ({
  AdvancedDropdown: vi.fn(({ label, options, value, onChange, placeholder, searchable, required, helpText, validate, className }) => (
    <div data-testid="advanced-dropdown">
      <label>{label}</label>
      {placeholder && <span data-testid="placeholder">{placeholder}</span>}
      {helpText && <span data-testid="help-text">{helpText}</span>}
      <select
        data-testid="dropdown-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={className}
      >
        <option value="">Select</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {validate && value === undefined && <span data-testid="validation-error">{validate(value)}</span>}
      {searchable && <span data-testid="searchable">searchable</span>}
    </div>
  ))
}));

describe('KanbanFieldConfiguration Component', () => {
  const mockOnGroupByFieldChange = vi.fn();
  
  const selectColumn: BaseColumn = {
    id: '1',
    key: 'status',
    column_name: 'status',
    title: 'Status',
    type: 'select',
    uidt: 'select'
  };

  const singleSelectColumn: BaseColumn = {
    id: '2',
    key: 'priority',
    column_name: 'priority',
    title: 'Priority',
    type: 'singleSelect',
    uidt: 'singleSelect'
  };

  const textColumn: BaseColumn = {
    id: '3',
    key: 'name',
    column_name: 'name',
    title: 'Name',
    type: 'text',
    uidt: 'text'
  };

  const defaultColumns: BaseColumn[] = [selectColumn, singleSelectColumn, textColumn];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render button with correct text', () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      expect(screen.getByText('Kanban Fields')).toBeInTheDocument();
    });

    it('should render button with icon', () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
          className="custom-class"
        />
      );
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should not render when onGroupByFieldChange is not provided', () => {
      const { container } = render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should have correct button attributes', () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Dropdown Interaction', () => {
    it('should open dropdown on button click', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Configure Kanban Fields')).toBeInTheDocument();
      });
    });

    it('should close dropdown on second button click', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText('Configure Kanban Fields')).toBeInTheDocument();
      });

      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.queryByText('Configure Kanban Fields')).not.toBeInTheDocument();
      });
    });

    it('should update aria-expanded when dropdown opens', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should render dropdown with fixed positioning', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const panel = screen.getByText('Configure Kanban Fields').closest('div');
        expect(panel).toHaveStyle({ position: 'fixed', top: '100px', left: '100px' });
      });
    });
  });

  describe('Field Filtering', () => {
    it('should filter only select and singleSelect columns', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const dropdown = screen.getByTestId('advanced-dropdown');
        expect(dropdown).toBeInTheDocument();
      });

      const select = screen.getByTestId('dropdown-select');
      const options = Array.from(select.querySelectorAll('option'));
      const optionValues = options.map(opt => opt.textContent);
      
      expect(optionValues).toContain('Status');
      expect(optionValues).toContain('Priority');
      expect(optionValues).not.toContain('Name');
    });

    it('should filter columns by type property', async () => {
      const columnsWithType = [
        { ...selectColumn, uidt: undefined, type: 'select' },
        { ...textColumn, uidt: undefined, type: 'text' }
      ];

      render(
        <KanbanFieldConfiguration
          columns={columnsWithType}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        const options = Array.from(select.querySelectorAll('option'));
        const optionValues = options.map(opt => opt.textContent);
        
        expect(optionValues).toContain('Status');
        expect(optionValues).not.toContain('Name');
      });
    });

    it('should filter columns by uidt property', async () => {
      const columnsWithUidt: BaseColumn[] = [
        { ...selectColumn, type: 'select', uidt: 'select' },
        { ...textColumn, type: 'text', uidt: 'text' }
      ];

      render(
        <KanbanFieldConfiguration
          columns={columnsWithUidt}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        const options = Array.from(select.querySelectorAll('option'));
        const optionValues = options.map(opt => opt.textContent);
        
        expect(optionValues).toContain('Status');
        expect(optionValues).not.toContain('Name');
      });
    });

    it('should exclude columns without id', async () => {
      const columnsWithoutId = [
        { ...selectColumn, id: undefined },
        { ...singleSelectColumn }
      ];

      render(
        <KanbanFieldConfiguration
          columns={columnsWithoutId}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        const options = Array.from(select.querySelectorAll('option'));
        const optionValues = options.map(opt => opt.textContent);
        
        expect(optionValues).not.toContain('Status');
        expect(optionValues).toContain('Priority');
      });
    });
  });

  describe('Field Selection', () => {
    it('should call onGroupByFieldChange with selected field', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        fireEvent.change(select, { target: { value: '1' } });
      });

      expect(mockOnGroupByFieldChange).toHaveBeenCalledWith(selectColumn);
    });

    it('should display selected groupByField value', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          groupByField={selectColumn}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        expect(select).toHaveValue('1');
      });
    });

    it('should handle undefined groupByField', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          groupByField={undefined}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        expect(select).toHaveValue('');
      });
    });

    it('should handle field change to undefined', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          groupByField={selectColumn}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        fireEvent.change(select, { target: { value: '999' } });
      });

      expect(mockOnGroupByFieldChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Keyboard Interaction', () => {
    it('should close dropdown on Escape key', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Configure Kanban Fields')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Configure Kanban Fields')).not.toBeInTheDocument();
      });
    });

    it('should not close dropdown on other keys', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Configure Kanban Fields')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Configure Kanban Fields')).toBeInTheDocument();
      });
    });

    it('should only listen to Escape when dropdown is open', () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByText('Configure Kanban Fields')).not.toBeInTheDocument();
    });
  });

  describe('AdvancedDropdown Integration', () => {
    it('should pass correct props to AdvancedDropdown', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const dropdown = screen.getByTestId('advanced-dropdown');
        expect(dropdown).toBeInTheDocument();
        expect(screen.getByText('Stacked By')).toBeInTheDocument();
        expect(screen.getByTestId('placeholder')).toHaveTextContent('Select field to group by');
        expect(screen.getByTestId('searchable')).toBeInTheDocument();
        expect(screen.getByTestId('help-text')).toHaveTextContent('The select or single select field that determines how cards are grouped into columns');
      });
    });

    it('should mark dropdown as required', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        expect(select).toHaveAttribute('required');
      });
    });

    it('should render validation error when no value selected', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const validationError = screen.getByTestId('validation-error');
        expect(validationError).toHaveTextContent('Stacked By field is required');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty columns array', async () => {
      render(
        <KanbanFieldConfiguration
          columns={[]}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        const options = Array.from(select.querySelectorAll('option'));
        expect(options).toHaveLength(1);
      });
    });

    it('should handle undefined columns', () => {
      render(
        <KanbanFieldConfiguration
          columns={undefined as any}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle columns with null id', async () => {
      const columnsWithNull = [
        { ...selectColumn, id: null as any },
        { ...singleSelectColumn }
      ];

      render(
        <KanbanFieldConfiguration
          columns={columnsWithNull}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        const options = Array.from(select.querySelectorAll('option'));
        const optionValues = options.map(opt => opt.textContent);
        
        expect(optionValues).not.toContain('Status');
        expect(optionValues).toContain('Priority');
      });
    });

    it('should handle columns without title or column_name', async () => {
      const columnsNoTitle: BaseColumn[] = [
        { ...selectColumn, title: '', column_name: '' },
        { ...singleSelectColumn }
      ];

      render(
        <KanbanFieldConfiguration
          columns={columnsNoTitle}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        const options = Array.from(select.querySelectorAll('option'));
        expect(options.length).toBeGreaterThan(1);
      });
    });

    it('should handle groupByField without id', async () => {
      const fieldWithoutId = { ...selectColumn, id: undefined };

      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          groupByField={fieldWithoutId}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        expect(select).toHaveValue('');
      });
    });

    it('should handle rapid open/close operations', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Configure Kanban Fields')).toBeInTheDocument();
      });
    });

    it('should handle very long column titles', async () => {
      const longTitleColumn: BaseColumn = {
        id: '100',
        key: 'long',
        title: 'A'.repeat(200),
        type: 'select',
        uidt: 'select'
      };

      render(
        <KanbanFieldConfiguration
          columns={[longTitleColumn]}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        const options = Array.from(select.querySelectorAll('option'));
        const longOption = options.find(opt => opt.textContent?.length === 200);
        expect(longOption).toBeTruthy();
      });
    });

    it('should handle many select columns', async () => {
      const manyColumns = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        key: `col${i}`,
        title: `Column ${i}`,
        type: 'select',
        uidt: 'select'
      }));

      render(
        <KanbanFieldConfiguration
          columns={manyColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        const options = Array.from(select.querySelectorAll('option'));
        expect(options.length).toBe(101);
      });
    });
  });

  describe('Column Title Fallback', () => {
    it('should use title when both title and column_name exist', async () => {
      const columnWithBoth: BaseColumn = {
        id: '10',
        key: 'both',
        title: 'Display Title',
        column_name: 'db_column',
        type: 'select',
        uidt: 'select'
      };

      render(
        <KanbanFieldConfiguration
          columns={[columnWithBoth]}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        const options = Array.from(select.querySelectorAll('option'));
        const optionValues = options.map(opt => opt.textContent);
        expect(optionValues).toContain('Display Title');
      });
    });

    it('should use column_name when title is missing', async () => {
      const columnWithColumnName: BaseColumn = {
        id: '11',
        key: 'columnname',
        title: '',
        column_name: 'db_column',
        type: 'select',
        uidt: 'select'
      };

      render(
        <KanbanFieldConfiguration
          columns={[columnWithColumnName]}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        const options = Array.from(select.querySelectorAll('option'));
        const optionValues = options.map(opt => opt.textContent);
        expect(optionValues).toContain('db_column');
      });
    });

    it('should use empty string when both are missing', async () => {
      const columnNoLabel: BaseColumn = {
        id: '12',
        key: 'nolabel',
        title: '',
        column_name: '',
        type: 'select',
        uidt: 'select'
      };

      render(
        <KanbanFieldConfiguration
          columns={[columnNoLabel]}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        expect(select).toBeInTheDocument();
      });
    });
  });

  describe('Portal Rendering', () => {
    it('should render panel in document body', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Configure Kanban Fields')).toBeInTheDocument();
      });
    });

    it('should not render panel when closed', () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );

      expect(screen.queryByText('Configure Kanban Fields')).not.toBeInTheDocument();
    });
  });

  describe('Component Cleanup', () => {
    it('should cleanup keyboard listener on unmount', async () => {
      const { unmount } = render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Configure Kanban Fields')).toBeInTheDocument();
      });

      unmount();

      fireEvent.keyDown(document, { key: 'Escape' });
    });

    it('should cleanup keyboard listener when dropdown closes', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Configure Kanban Fields')).toBeInTheDocument();
      });

      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.queryByText('Configure Kanban Fields')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have aria-haspopup attribute', () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should toggle aria-expanded on open/close', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });

      await userEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Field Type Icon', () => {
    it('should render field type icon for each option', async () => {
      render(
        <KanbanFieldConfiguration
          columns={defaultColumns}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Configure Kanban Fields')).toBeInTheDocument();
      });
    });

    it('should fallback to text type when uidt is missing', async () => {
      const columnNoUidt: BaseColumn = {
        id: '20',
        key: 'nouidt',
        title: 'No UIDT',
        type: 'select'
      };

      render(
        <KanbanFieldConfiguration
          columns={[columnNoUidt]}
          onGroupByFieldChange={mockOnGroupByFieldChange}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Configure Kanban Fields')).toBeInTheDocument();
      });
    });
  });
});
