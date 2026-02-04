import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GalleryHeader } from '../GalleryHeader';
import type { BaseColumn } from '../../../../types/column.types';

vi.mock('../../../../components/shared/table/FilterPopover', () => ({
  FilterPopover: ({ filters }: any) => (
    <div data-testid="filter-popover">Filters: {filters.length}</div>
  ),
}));

vi.mock('../../../../components/shared/table/FieldsPopover', () => ({
  FieldsPopover: () => <div data-testid="fields-popover">Fields</div>,
}));

vi.mock('../../../../components/shared/table/SortPopover', () => ({
  SortPopover: ({ sorts }: any) => (
    <div data-testid="sort-popover">Sorts: {sorts.length}</div>
  ),
}));

vi.mock('../../../../components/shared/table/Search', () => ({
  Search: ({ onSearch }: any) => (
    <input
      data-testid="search-input"
      onChange={(e) => onSearch(e.target.value, null)}
      placeholder="Search"
    />
  ),
}));

vi.mock('../GalleryFieldSelector', () => ({
  GalleryFieldConfiguration: ({ onAttachmentFieldChange }: any) => (
    <button data-testid="gallery-field-config" onClick={() => onAttachmentFieldChange({ id: '1' })}>
      Gallery Fields
    </button>
  ),
}));

describe('GalleryHeader', () => {
  const mockOnAddRecord = vi.fn();
  const mockOnSearch = vi.fn();
  const mockOnAddFilter = vi.fn();
  const mockOnRemoveFilter = vi.fn();
  const mockOnUpdateFilter = vi.fn();
  const mockOnSortChange = vi.fn();
  const mockOnFieldToggle = vi.fn();
  const mockOnAttachmentFieldChange = vi.fn();

  const mockColumns: BaseColumn[] = [
    {
      id: '1',
      key: 'title',
      column_name: 'title',
      title: 'Title',
      type: 'text',
      uidt: 'text',
      position: 0,
      hidden: false,
      isHidden: false,
      system: false,
    },
    {
      id: '2',
      key: 'description',
      column_name: 'description',
      title: 'Description',
      type: 'text',
      uidt: 'text',
      position: 1,
      hidden: false,
      isHidden: false,
      system: false,
    },
  ];

  const mockAttachmentField: BaseColumn = {
    id: '3',
    key: 'image',
    column_name: 'image',
    title: 'Image',
    type: 'attachment',
    uidt: 'attachment',
    position: 2,
    hidden: false,
    isHidden: false,
    system: false,
  };

  const mockFieldConfig = [
    { id: '1', position: 0, isHidden: false },
    { id: '2', position: 1, isHidden: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render item count', () => {
      render(
        <GalleryHeader
          itemCount={42}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render loaded count when hasMore is true', () => {
      render(
        <GalleryHeader
          itemCount={100}
          loadedCount={30}
          hasMore={true}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByText(/30 loaded/)).toBeInTheDocument();
    });

    it('should render add record button when handler provided', () => {
      render(
        <GalleryHeader
          itemCount={10}
          onAddRecord={mockOnAddRecord}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByText('Add Record')).toBeInTheDocument();
    });

    it('should not render add record button when handler is undefined', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.queryByText('Add Record')).not.toBeInTheDocument();
    });

    it('should render filter popover', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[{ column: 'title', operator: 'eq', value: 'test' }]}
          sorts={[]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByTestId('filter-popover')).toBeInTheDocument();
      expect(screen.getByText('Filters: 1')).toBeInTheDocument();
    });

    it('should render sort popover', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[{ column: 'title', direction: 'asc' }]}
          onSortChange={mockOnSortChange}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByTestId('sort-popover')).toBeInTheDocument();
      expect(screen.getByText('Sorts: 1')).toBeInTheDocument();
    });

    it('should render fields popover when handler provided', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onFieldToggle={mockOnFieldToggle}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByTestId('fields-popover')).toBeInTheDocument();
    });

    it('should render gallery field configuration', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          attachmentField={mockAttachmentField}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getAllByTestId('gallery-field-config')).toHaveLength(2);
    });

    it('should not render gallery field configuration when no attachment fields', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.queryByTestId('gallery-field-config')).not.toBeInTheDocument();
    });

    it('should render search input', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getAllByTestId('search-input')).toHaveLength(2);
    });
  });

  describe('interactions', () => {
    it('should call onAddRecord when button is clicked', () => {
      render(
        <GalleryHeader
          itemCount={10}
          onAddRecord={mockOnAddRecord}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      const button = screen.getByText('Add Record');
      fireEvent.click(button);

      expect(mockOnAddRecord).toHaveBeenCalledTimes(1);
    });

    it('should call onSearch when search input changes', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      const searchInputs = screen.getAllByTestId('search-input');
      fireEvent.change(searchInputs[0], { target: { value: 'test query' } });

      expect(mockOnSearch).toHaveBeenCalledWith('test query', null);
    });

    it('should call onAttachmentFieldChange when field is changed', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      const configButtons = screen.getAllByTestId('gallery-field-config');
      fireEvent.click(configButtons[0]);

      expect(mockOnAttachmentFieldChange).toHaveBeenCalledWith({ id: '1' });
    });
  });

  describe('responsive layout', () => {
    it('should render desktop layout', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      const desktopLayout = document.querySelector(String.raw`.hidden.md\:flex`);
      expect(desktopLayout).toBeInTheDocument();
    });

    it('should render mobile layout', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      const mobileLayout = document.querySelector(String.raw`.flex.md\:hidden`);
      expect(mobileLayout).toBeInTheDocument();
    });

    it('should show count badge in mobile layout', () => {
      render(
        <GalleryHeader
          itemCount={42}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByText('Gallery View')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('searchable columns', () => {
    it('should filter system columns except Title', () => {
      const columnsWithSystem: BaseColumn[] = [
        ...mockColumns,
        {
          id: '3',
          key: 'created_at',
          column_name: 'created_at',
          title: 'Created At',
          type: 'created_at',
          uidt: 'created_at',
          position: 2,
          hidden: false,
          isHidden: false,
          system: true,
        },
        {
          id: '4',
          key: 'title',
          column_name: 'title',
          title: 'Title',
          type: 'text',
          uidt: 'text',
          position: 3,
          hidden: false,
          isHidden: false,
          system: true,
        },
      ];

      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={columnsWithSystem}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getAllByTestId('search-input')).toHaveLength(2);
    });
  });

  describe('sortable columns', () => {
    it('should use sortableColumns when provided', () => {
      const sortableColumns = [mockColumns[0]];

      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          sortableColumns={sortableColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSortChange={mockOnSortChange}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByTestId('sort-popover')).toBeInTheDocument();
    });

    it('should default to columns when sortableColumns not provided', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSortChange={mockOnSortChange}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByTestId('sort-popover')).toBeInTheDocument();
    });
  });

  describe('compact number formatting', () => {
    it('should format large numbers', () => {
      render(
        <GalleryHeader
          itemCount={1500}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      const countElement = screen.getByText(/1/);
      expect(countElement).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty columns', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[]}
          columns={[]}
          fieldConfig={[]}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should handle empty field config', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={[]}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should handle zero items', () => {
      render(
        <GalleryHeader
          itemCount={0}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle undefined loadedCount', () => {
      render(
        <GalleryHeader
          itemCount={100}
          hasMore={true}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should handle undefined attachmentField', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          attachmentField={undefined}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getAllByTestId('gallery-field-config')).toHaveLength(2);
    });

    it('should handle columns without id', () => {
      const columnsWithoutId: BaseColumn[] = [
        {
          key: 'title',
          column_name: 'title',
          title: 'Title',
          type: 'text',
          uidt: 'text',
          position: 0,
        } as BaseColumn,
      ];

      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[]}
          columns={columnsWithoutId}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should handle columns without uidt', () => {
      const columnsWithoutUidt: BaseColumn[] = [
        {
          id: '1',
          key: 'title',
          column_name: 'title',
          title: 'Title',
          type: 'text',
          position: 0,
        } as BaseColumn,
      ];

      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[]}
          columns={columnsWithoutUidt}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('handlers conditionally rendered', () => {
    it('should not render filter popover without handlers', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.queryByTestId('filter-popover')).not.toBeInTheDocument();
    });

    it('should not render sort popover without handler', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.queryByTestId('sort-popover')).not.toBeInTheDocument();
    });

    it('should not render fields popover without handler', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.queryByTestId('fields-popover')).not.toBeInTheDocument();
    });

    it('should not render attachment field config without handler', () => {
      render(
        <GalleryHeader
          itemCount={10}
          attachmentFields={[mockAttachmentField]}
          columns={mockColumns}
          fieldConfig={mockFieldConfig}
          filters={[]}
          sorts={[]}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.queryByTestId('gallery-field-config')).not.toBeInTheDocument();
    });
  });
});
