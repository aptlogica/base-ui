import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type React from 'react';
import { FormPreview } from '../FormPreview';
import type { FormConfig, FormField } from '../../../../../types/form';

vi.mock('../SortableFormField', () => ({
  SortableFormField: ({ field, onDragStart, onDragOver, onDrop, onDragEnd, onDelete, onEdit, onChange, isReadOnly }: any) => (
    <div data-testid={`field-${field.id}`}>
      <button type="button" onClick={() => onDragStart?.()}>drag-start-{field.id}</button>
      <button type="button" onClick={() => onDragOver?.()}>drag-over-{field.id}</button>
      <button type="button" onClick={() => onDrop?.()}>drop-{field.id}</button>
      <button type="button" onClick={() => onDragOver?.('right')}>drag-over-right-{field.id}</button>
      <button type="button" onClick={() => onDrop?.('right')}>drop-right-{field.id}</button>
      <button type="button" onClick={() => onDragEnd?.()}>drag-end-{field.id}</button>
      <button type="button" onClick={() => onDelete?.(field.id)}>delete-{field.id}</button>
      <button type="button" onClick={() => onEdit?.(field.id)}>edit-{field.id}</button>
      <button type="button" onClick={() => onChange?.('value')}>change-{field.id}</button>
      <span>{field.title}</span>
      <span>{isReadOnly ? 'readonly' : 'editable'}</span>
    </div>
  ),
}));

const mutateAsyncMock = vi.fn();
vi.mock('../../../../../hooks/useApi', () => ({
  useAddImage: () => ({ mutateAsync: mutateAsyncMock }),
}));

vi.mock('../../../../../components/common/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
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
      expect(screen.getByAltText('Sereni Base')).toBeInTheDocument();
      expect(screen.getByText('Sereni Base')).toBeInTheDocument();
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
      expect(screen.queryByAltText('Sereni Base')).not.toBeInTheDocument();
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

    it('puts two fields in the same row when dropped on the side of a field', () => {
      const onFieldOrderChange = vi.fn();
      const onConfigChange = vi.fn();
      render(
        <FormPreview
          config={defaultConfig}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={onFieldOrderChange}
          onDeleteField={mockOnDeleteField}
          onConfigChange={onConfigChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'drag-start-f2' }));
      fireEvent.click(screen.getByRole('button', { name: 'drag-over-right-f1' }));
      fireEvent.click(screen.getByRole('button', { name: 'drop-right-f1' }));

      expect(onFieldOrderChange).not.toHaveBeenCalled();
      expect(onConfigChange).toHaveBeenCalledWith({
        appearance: expect.objectContaining({ inlineFieldIds: ['f2'] }),
      });
    });

    it('renders fields that share a row side by side', () => {
      render(
        <FormPreview
          config={{ ...defaultConfig, appearance: { ...defaultConfig.appearance, inlineFieldIds: ['f2'] } }}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
        />
      );

      const row = screen.getByTestId('form-field-row');
      expect(row).toContainElement(screen.getByTestId('field-f1'));
      expect(row).toContainElement(screen.getByTestId('field-f2'));
    });

    it('does not pair fields in the two-column layout', () => {
      const onConfigChange = vi.fn();
      render(
        <FormPreview
          config={{ ...defaultConfig, appearance: { ...defaultConfig.appearance, fieldLayout: 'grid-2' } }}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
          onConfigChange={onConfigChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'drag-start-f2' }));
      fireEvent.click(screen.getByRole('button', { name: 'drop-right-f1' }));

      expect(onConfigChange).not.toHaveBeenCalled();
      expect(screen.queryByTestId('form-field-row')).not.toBeInTheDocument();
    });
  });

  describe('Appearance', () => {
    const renderWith = (appearance: FormConfig['appearance'], extra: Partial<React.ComponentProps<typeof FormPreview>> = {}) =>
      render(
        <FormPreview
          config={{ ...defaultConfig, appearance }}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
          {...extra}
        />
      );

    it.each([
      ['center', 'text-center'],
      ['right', 'text-right'],
      [undefined, 'text-left'],
    ] as const)('aligns only the title for align=%s', (align, className) => {
      renderWith({ align });
      expect(screen.getByRole('heading', { name: 'Test Form' }).parentElement).toHaveClass(className);
      expect(screen.getByText('Form description').closest('div')).not.toHaveClass(className);
    });

    it('applies width, rounded corners and elevated card style', () => {
      const { container } = renderWith({ layoutWidth: 'wide', rounded: 'xl', cardStyle: 'elevated' });
      const card = container.querySelector('.max-w-\\[72rem\\]');
      expect(card).toHaveClass('rounded-[1.75rem]', 'shadow-lg');
    });

    it.each([
      ['#ffffff', 'rgb(16, 24, 40)'],
      ['#000000', 'rgb(255, 255, 255)'],
      ['not-a-color', 'rgb(255, 255, 255)'],
    ])('picks a readable submit text color for %s', (primaryColor, color) => {
      renderWith({ primaryColor }, { onSubmit: vi.fn() });
      expect(screen.getByRole('button', { name: 'Submit' })).toHaveStyle({ color });
    });

    it('prevents native submit when no onSubmit handler is given', () => {
      const { container } = renderWith({});
      const event = new Event('submit', { bubbles: true, cancelable: true });
      container.querySelector('form')!.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('places the logo below the banner when configured', () => {
      renderWith({ logoUrl: '/logo.png', logoPosition: 'below' });
      expect(screen.getByAltText('Logo').parentElement?.parentElement).toHaveClass('mb-6', 'flex');
    });
  });

  describe('Keyboard editing', () => {
    const renderEditable = (onConfigChange = vi.fn()) => {
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
      return onConfigChange;
    };

    it('starts editing the title with Enter and saves it with Enter', () => {
      const onConfigChange = renderEditable();
      fireEvent.keyDown(screen.getByRole('button', { name: /click to edit title/i }), { key: 'Enter' });
      const input = screen.getByDisplayValue('Test Form');
      fireEvent.change(input, { target: { value: 'Renamed' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onConfigChange).toHaveBeenCalledWith({ title: 'Renamed' });
    });

    it('starts editing the description with Space and ignores other keys', () => {
      renderEditable();
      const button = screen.getByRole('button', { name: /click to edit description/i });
      fireEvent.keyDown(button, { key: 'a' });
      expect(screen.queryByDisplayValue('Form description')).not.toBeInTheDocument();
      fireEvent.keyDown(button, { key: ' ' });
      const textarea = screen.getByDisplayValue('Form description');
      fireEvent.keyDown(textarea, { key: 'a' });
      expect(textarea).toBeInTheDocument();
    });

    it('ignores non-submit keys while editing the title', () => {
      const onConfigChange = renderEditable();
      fireEvent.click(screen.getByRole('button', { name: /click to edit title/i }));
      fireEvent.keyDown(screen.getByDisplayValue('Test Form'), { key: 'a' });
      expect(screen.getByDisplayValue('Test Form')).toBeInTheDocument();
      expect(onConfigChange).not.toHaveBeenCalled();
    });
  });

  describe('Banner and logo upload', () => {
    const image = new File(['img'], 'img.png', { type: 'image/png' });
    const renderUploadable = (appearance: FormConfig['appearance'] = {}) => {
      const onConfigChange = vi.fn();
      const view = render(
        <FormPreview
          config={{ ...defaultConfig, appearance }}
          selectedFieldId={null}
          rowData={{}}
          onRowDataChange={mockOnRowDataChange}
          onFieldOrderChange={mockOnFieldOrderChange}
          onDeleteField={mockOnDeleteField}
          onConfigChange={onConfigChange}
        />
      );
      return { ...view, onConfigChange };
    };

    beforeEach(() => {
      mutateAsyncMock.mockResolvedValue({ data: { url: 'https://img/new.png' } });
    });

    it('uploads a banner from the file picker', async () => {
      const { container, onConfigChange } = renderUploadable();
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
      fireEvent.click(screen.getByRole('button', { name: 'Upload banner' }));
      fireEvent.click(screen.getByRole('button', { name: 'Click to add' }));
      expect(clickSpy).toHaveBeenCalledTimes(2);
      clickSpy.mockRestore();

      fireEvent.change(container.querySelectorAll('input[type="file"]')[0], { target: { files: [image] } });
      await waitFor(() => {
        expect(onConfigChange).toHaveBeenCalledWith({ appearance: { bannerUrl: 'https://img/new.png' } });
      });
    });

    it('uploads a banner dropped onto the drop zone', async () => {
      const { onConfigChange } = renderUploadable();
      const zone = screen.getByText(/a banner or drag and drop/).closest('div.border-b') as HTMLElement;

      fireEvent.dragOver(zone);
      expect(zone).toHaveClass('bg-[var(--color-gray-100)]');
      fireEvent.dragLeave(zone);
      expect(zone).toHaveClass('bg-[var(--color-gray-50)]');

      fireEvent.drop(zone, { dataTransfer: { files: [image] } });
      await waitFor(() => {
        expect(onConfigChange).toHaveBeenCalledWith({ appearance: { bannerUrl: 'https://img/new.png' } });
      });
    });

    it('disables the upload buttons while uploading', async () => {
      let resolveUpload: (value: unknown) => void = () => {};
      mutateAsyncMock.mockReturnValue(new Promise((resolve) => { resolveUpload = resolve; }));
      const { container } = renderUploadable();

      fireEvent.change(container.querySelectorAll('input[type="file"]')[0], { target: { files: [image] } });
      fireEvent.change(container.querySelectorAll('input[type="file"]')[1], { target: { files: [image] } });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Upload banner' })).toBeDisabled();
      });
      expect(screen.getByRole('button', { name: /Add a logo/ })).toBeDisabled();

      resolveUpload({ data: { url: 'https://img/new.png' } });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Upload banner' })).not.toBeDisabled();
      });
    });

    it('replaces an existing banner from the hover action', async () => {
      const { container, onConfigChange } = renderUploadable({ bannerUrl: '/banner.png' });
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
      fireEvent.click(screen.getByRole('button', { name: 'Change banner' }));
      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();

      fireEvent.change(container.querySelectorAll('input[type="file"]')[0], { target: { files: [image] } });
      await waitFor(() => {
        expect(onConfigChange).toHaveBeenCalledWith({ appearance: { bannerUrl: 'https://img/new.png' } });
      });
    });

    it('removes an existing banner from the hover action', () => {
      const { onConfigChange } = renderUploadable({ bannerUrl: '/banner.png' });
      fireEvent.click(screen.getByRole('button', { name: 'Remove banner' }));
      expect(onConfigChange).toHaveBeenCalledWith({ appearance: { bannerUrl: undefined } });
    });

    it('uploads a logo from the Add a logo button', async () => {
      const { container, onConfigChange } = renderUploadable({ hideBanner: true });
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
      fireEvent.click(screen.getByRole('button', { name: /Add a logo/ }));
      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();

      fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [image] } });
      await waitFor(() => {
        expect(onConfigChange).toHaveBeenCalledWith({ appearance: { hideBanner: true, logoUrl: 'https://img/new.png' } });
      });
    });

    it('removes an existing logo from the hover action', () => {
      const { onConfigChange } = renderUploadable({ logoUrl: '/logo.png' });
      fireEvent.click(screen.getByRole('button', { name: 'Remove logo' }));
      expect(onConfigChange).toHaveBeenCalledWith({ appearance: { logoUrl: undefined } });
    });
  });
});
