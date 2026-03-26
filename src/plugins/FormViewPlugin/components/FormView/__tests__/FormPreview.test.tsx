import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormPreview } from '../FormPreview';
import type { FormConfig, FormField } from '../../../../../types/form';

vi.mock('../SortableFormField', () => ({
  SortableFormField: ({ field, onDragStart, onDragOver, onDrop, onDragEnd, onDelete, onEdit, onChange, isReadOnly }: any) => (
    <div data-testid={`field-${field.id}`}>
      <button type="button" onClick={() => onDragStart?.()}>drag-start-{field.id}</button>
      <button type="button" onClick={() => onDragOver?.()}>drag-over-{field.id}</button>
      <button type="button" onClick={() => onDrop?.()}>drop-{field.id}</button>
      <button type="button" onClick={() => onDragEnd?.()}>drag-end-{field.id}</button>
      <button type="button" onClick={() => onDelete?.(field.id)}>delete-{field.id}</button>
      <button type="button" onClick={() => onEdit?.(field.id)}>edit-{field.id}</button>
      <button type="button" onClick={() => onChange?.('value')}>change-{field.id}</button>
      <span>{field.title}</span>
      <span>{isReadOnly ? 'readonly' : 'editable'}</span>
    </div>
  ),
}));

vi.mock('../../../../../utils/fieldUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../utils/fieldUtils')>();
  return {
    ...actual,
    isFormulaField: (field: any) => field?.type === 'formula',
  };
});

describe('FormPreview', () => {
  const mockFields: FormField[] = [
    {
      id: 'f1',
      name: 'Title',
      type: 'text',
      label: 'Title',
      title: 'Title',
      column_name: 'title',
      is_hidden: false,
      system: false,
      isSystem: false,
    },
    {
      id: 'f2',
      name: 'Description',
      type: 'longText',
      label: 'Description',
      title: 'Description',
      column_name: 'description',
      is_hidden: false,
      system: false,
      isSystem: false,
    },
  ];

  const defaultConfig: FormConfig = {
    title: 'Test Form',
    description: 'Form description',
    fields: mockFields,
    appearance: {
      backgroundColor: '#f8fafc',
      layoutWidth: 'medium',
      fieldLayout: 'list',
    },
  };

  const mockOnRowDataChange = vi.fn();
  const mockOnFieldOrderChange = vi.fn();
  const mockOnDeleteField = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render form title from config', () => {
      render(
        <FormPreview
          config={defaultConfig}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
        />
      );
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });

    it('should render form description when provided', () => {
      render(
        <FormPreview
          config={defaultConfig}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
        />
      );
      expect(screen.getByText('Form description')).toBeInTheDocument();
    });

    it('should render Add form description when description is empty', () => {
      const configWithoutDescription: FormConfig = {
        ...defaultConfig,
        description: '',
      };
      render(
        <FormPreview
          config={configWithoutDescription}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
        />
      );
      expect(screen.getByText('Add form description')).toBeInTheDocument();
    });

    it('should render Submit button when onSubmit is provided', () => {
      render(
        <FormPreview
          config={defaultConfig}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onSubmit={() => {}}
          onDeleteField={mockOnDeleteField}
        />
      );
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('should render Clear button when onClear is provided', () => {
      render(
        <FormPreview
          config={defaultConfig}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onSubmit={() => {}}
          onClear={() => {}}
          onDeleteField={mockOnDeleteField}
        />
      );
      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });

    it('should render SereniBase branding when hideNocoBranding is false', () => {
      render(
        <FormPreview
          config={defaultConfig}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
        />
      );
      expect(screen.getByText('Powered by SereniBase')).toBeInTheDocument();
    });

    it('should not render SereniBase branding when hideNocoBranding is true', () => {
      const configNoBranding: FormConfig = {
        ...defaultConfig,
        appearance: {
          ...defaultConfig.appearance,
          hideNocoBranding: true,
        },
      };
      render(
        <FormPreview
          config={configNoBranding}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
        />
      );
      expect(screen.queryByText('Powered by SereniBase')).not.toBeInTheDocument();
    });

    it('renders banner and logo when provided', () => {
      const configWithBranding: FormConfig = {
        ...defaultConfig,
        appearance: {
          ...defaultConfig.appearance,
          bannerUrl: '/banner.png',
          logoUrl: '/logo.png',
        },
      };

      render(
        <FormPreview
          config={configWithBranding}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
        />
      );

      expect(screen.getByAltText('Banner')).toBeInTheDocument();
      expect(screen.getByAltText('Logo')).toBeInTheDocument();
    });

    it('omits banner when hideBanner is true', () => {
      const configNoBanner: FormConfig = {
        ...defaultConfig,
        appearance: {
          ...defaultConfig.appearance,
          bannerUrl: '/banner.png',
          hideBanner: true,
        },
      };

      render(
        <FormPreview
          config={configNoBanner}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
        />
      );

      expect(screen.queryByAltText('Banner')).not.toBeInTheDocument();
    });
  });

  describe('Form error', () => {
    it('should display formError when provided', () => {
      render(
        <FormPreview
          config={defaultConfig}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
          formError="Required field is missing"
        />
      );
      expect(screen.getByText('Required field is missing')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should render with empty fields array', () => {
      const configEmptyFields: FormConfig = {
        ...defaultConfig,
        fields: [],
      };
      render(
        <FormPreview
          config={configEmptyFields}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
        />
      );
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });

    it('should apply backgroundColor from appearance', () => {
      const configWithBg: FormConfig = {
        ...defaultConfig,
        appearance: {
          ...defaultConfig.appearance,
          backgroundColor: '#eff6ff',
        },
      };
      const { container } = render(
        <FormPreview
          config={configWithBg}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
        />
      );
      const minHeightEl = container.querySelector('.min-h-screen');
      expect(minHeightEl).toBeInTheDocument();
      expect((minHeightEl as HTMLElement).style.backgroundColor).toBe('rgb(239, 246, 255)');
    });

    it('filters out audit, formula, system, and hidden title fields', () => {
      const configFiltered: FormConfig = {
        ...defaultConfig,
        fields: [
          {
            id: 'title',
            name: 'Title',
            type: 'text',
            label: 'Title',
            title: 'Title',
            column_name: 'title',
            is_hidden: true,
            system: false,
            isSystem: false,
          },
          {
            id: 'created',
            name: 'Created Time',
            type: 'date',
            label: 'Created Time',
            title: 'Created Time',
            column_name: 'created_time',
            is_hidden: false,
            system: false,
            isSystem: false,
          },
          {
            id: 'formula',
            name: 'Formula',
            type: 'formula',
            label: 'Formula',
            title: 'Formula',
            column_name: 'formula',
            is_hidden: false,
            system: false,
            isSystem: false,
          },
          {
            id: 'system-id',
            name: 'System Id',
            type: 'text',
            label: 'System Id',
            title: 'System Id',
            column_name: 'id',
            is_hidden: false,
            system: true,
            isSystem: true,
          },
          {
            id: 'name',
            name: 'Name',
            type: 'text',
            label: 'Name',
            title: 'Name',
            column_name: 'name',
            is_hidden: false,
            system: false,
            isSystem: false,
          },
        ],
      };

      render(
        <FormPreview
          config={configFiltered}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
        />
      );

      expect(screen.queryByText('Title')).not.toBeInTheDocument();
      expect(screen.queryByText('Created Time')).not.toBeInTheDocument();
      expect(screen.queryByText('Formula')).not.toBeInTheDocument();
      expect(screen.queryByText('System Id')).not.toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
  });

  describe('Editing title and description', () => {
    it('allows editing title and description when editable', () => {
      const onConfigChange = vi.fn();
      render(
        <FormPreview
          config={defaultConfig}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
          onConfigChange={onConfigChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /click to edit title/i }));
      const titleInput = screen.getByDisplayValue('Test Form');
      fireEvent.change(titleInput, { target: { value: 'New Title' } });
      fireEvent.blur(titleInput);
      expect(onConfigChange).toHaveBeenCalledWith({ title: 'New Title' });

      fireEvent.click(screen.getByRole('button', { name: /click to edit description/i }));
      const descInput = screen.getByDisplayValue('Form description');
      fireEvent.change(descInput, { target: { value: 'New Desc' } });
      fireEvent.blur(descInput);
      expect(onConfigChange).toHaveBeenCalledWith({ description: 'New Desc' });
    });

    it('cancels edit on escape without saving', () => {
      const onConfigChange = vi.fn();
      render(
        <FormPreview
          config={defaultConfig}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
          onConfigChange={onConfigChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /click to edit title/i }));
      const titleInput = screen.getByDisplayValue('Test Form');
      fireEvent.keyDown(titleInput, { key: 'Escape' });
      expect(onConfigChange).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: /click to edit description/i }));
      const descInput = screen.getByDisplayValue('Form description');
      fireEvent.keyDown(descInput, { key: 'Escape' });
      expect(onConfigChange).not.toHaveBeenCalled();
    });

    it('renders static title and description when read-only', () => {
      render(
        <FormPreview
          config={defaultConfig}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
          onConfigChange={vi.fn()}
          isReadOnly={true}
        />
      );

      expect(screen.queryByRole('button', { name: /click to edit title/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /click to edit description/i })).not.toBeInTheDocument();
      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByText('Form description')).toBeInTheDocument();
    });
  });

  describe('Actions and drag handling', () => {
    it('disables actions when submitting', () => {
      render(
        <FormPreview
          config={defaultConfig}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
          onSubmit={() => {}}
          onClear={() => {}}
          isSubmitting={true}
        />
      );

      expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
    });

    it('reorders fields on drag and drop', () => {
      const fields: FormField[] = [
        {
          id: 'a',
          name: 'Field A',
          type: 'text',
          label: 'Field A',
          title: 'Field A',
          column_name: 'a',
          is_hidden: false,
          system: false,
          isSystem: false,
        },
        {
          id: 'b',
          name: 'Field B',
          type: 'text',
          label: 'Field B',
          title: 'Field B',
          column_name: 'b',
          is_hidden: false,
          system: false,
          isSystem: false,
        },
      ];

      const onFieldOrderChange = vi.fn();
      render(
        <FormPreview
          config={{ ...defaultConfig, fields }}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={onFieldOrderChange}
          onDeleteField={mockOnDeleteField}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'drag-start-a' }));
      fireEvent.click(screen.getByRole('button', { name: 'drag-over-b' }));
      fireEvent.click(screen.getByRole('button', { name: 'drop-b' }));

      expect(onFieldOrderChange).toHaveBeenCalledWith([
        fields[1],
        fields[0],
      ]);
    });

    it('ignores drag handlers when read-only', () => {
      const onFieldOrderChange = vi.fn();
      render(
        <FormPreview
          config={defaultConfig}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={onFieldOrderChange}
          onDeleteField={mockOnDeleteField}
          isReadOnly={true}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'drag-start-f1' }));
      fireEvent.click(screen.getByRole('button', { name: 'drop-f2' }));

      expect(onFieldOrderChange).not.toHaveBeenCalled();
    });
  });
});
