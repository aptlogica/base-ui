import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormPreview } from '../FormPreview';
import type { FormConfig, FormField } from '../../../../../types/form';

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
  });
});
