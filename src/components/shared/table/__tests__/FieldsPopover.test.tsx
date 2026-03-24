import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldsPopover } from '../FieldsPopover';

const mockPosition = { top: 100, left: 200 };

vi.mock('../../../../hooks/useSmartPopover', () => ({
  useSmartPopover: vi.fn((opts: { open: boolean }) => ({
    position: opts.open ? mockPosition : null,
  })),
}));

vi.mock('../../../../types/fieldTypes', () => ({
  getFieldTypeIconComponent: vi.fn(() => null),
  getRelationTypeFromField: vi.fn(() => undefined),
}));

const defaultColumns = [
  { id: 'col1', title: 'Name', column_name: 'name', uidt: 'text', system: false },
  { id: 'col2', title: 'Email', column_name: 'email', uidt: 'email', system: false },
];

const defaultFieldConfig = [
  { id: 'col1', isHidden: false, position: 0 },
  { id: 'col2', isHidden: false, position: 1 },
];

describe('FieldsPopover', () => {
  const mockOnFieldToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render trigger button with default label Fields', () => {
      render(
        <FieldsPopover
          columns={defaultColumns}
          fieldConfig={defaultFieldConfig}
          onFieldToggle={mockOnFieldToggle}
        />
      );
      expect(screen.getByText('Fields')).toBeInTheDocument();
    });

    it('should render custom label when provided', () => {
      render(
        <FieldsPopover
          columns={defaultColumns}
          fieldConfig={defaultFieldConfig}
          onFieldToggle={mockOnFieldToggle}
          label="Columns"
        />
      );
      expect(screen.getByText('Columns')).toBeInTheDocument();
    });

    it('should render visible count badge', () => {
      render(
        <FieldsPopover
          columns={defaultColumns}
          fieldConfig={defaultFieldConfig}
          onFieldToggle={mockOnFieldToggle}
        />
      );
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should not show panel when closed', () => {
      render(
        <FieldsPopover
          columns={defaultColumns}
          fieldConfig={defaultFieldConfig}
          onFieldToggle={mockOnFieldToggle}
        />
      );
      expect(screen.queryByPlaceholderText('Search fields')).not.toBeInTheDocument();
    });
  });

  describe('Open and search', () => {
    it('should open panel and show search when trigger is clicked', async () => {
      render(
        <FieldsPopover
          columns={defaultColumns}
          fieldConfig={defaultFieldConfig}
          onFieldToggle={mockOnFieldToggle}
        />
      );
      const button = screen.getByRole('button', { name: /Fields/i });
      await userEvent.click(button);
      expect(screen.getByPlaceholderText('Search fields')).toBeInTheDocument();
    });

    it('should show column titles in panel when open', async () => {
      render(
        <FieldsPopover
          columns={defaultColumns}
          fieldConfig={defaultFieldConfig}
          onFieldToggle={mockOnFieldToggle}
        />
      );
      const button = screen.getByRole('button', { name: /Fields/i });
      await userEvent.click(button);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should filter columns by search term', async () => {
      render(
        <FieldsPopover
          columns={defaultColumns}
          fieldConfig={defaultFieldConfig}
          onFieldToggle={mockOnFieldToggle}
        />
      );
      const button = screen.getByRole('button', { name: /Fields/i });
      await userEvent.click(button);
      const searchInput = screen.getByPlaceholderText('Search fields');
      await userEvent.type(searchInput, 'Name');
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.queryByText('Email')).not.toBeInTheDocument();
    });
  });

  describe('Field toggle', () => {
    it('should call onFieldToggle when field visibility is toggled', async () => {
      render(
        <FieldsPopover
          columns={defaultColumns}
          fieldConfig={defaultFieldConfig}
          onFieldToggle={mockOnFieldToggle}
        />
      );
      const button = screen.getByRole('button', { name: /Fields/i });
      await userEvent.click(button);
      const toggleLabel = screen.getByLabelText('Toggle visibility for Name');
      expect(toggleLabel).toBeInTheDocument();
      fireEvent.click(toggleLabel);
      expect(mockOnFieldToggle).toHaveBeenCalledWith('col1');
    });
  });

  describe('System fields', () => {
    it('should show System fields button in footer when open', async () => {
      render(
        <FieldsPopover
          columns={defaultColumns}
          fieldConfig={defaultFieldConfig}
          onFieldToggle={mockOnFieldToggle}
        />
      );
      const button = screen.getByRole('button', { name: /Fields/i });
      await userEvent.click(button);
      expect(screen.getByText('System fields')).toBeInTheDocument();
    });

    it('should reveal system fields when toggled', async () => {
      const columnsWithSystem = [
        ...defaultColumns,
        { id: 'sys1', title: 'Created At', column_name: 'created_at', uidt: 'createdTime', system: true },
      ];
      const configWithSystem = [
        ...defaultFieldConfig,
        { id: 'sys1', isHidden: false, position: 2 },
      ];

      render(
        <FieldsPopover
          columns={columnsWithSystem as any}
          fieldConfig={configWithSystem}
          onFieldToggle={mockOnFieldToggle}
        />
      );

      const button = screen.getByRole('button', { name: /Fields/i });
      await userEvent.click(button);
      expect(screen.queryByText('Created At')).not.toBeInTheDocument();

      await userEvent.click(screen.getByText('System fields'));
      expect(screen.getByText('Created At')).toBeInTheDocument();
    });
  });

  describe('Visible count', () => {
    it('should show correct visible count when some fields are hidden', () => {
      const configWithHidden = [
        { id: 'col1', isHidden: true, position: 0 },
        { id: 'col2', isHidden: false, position: 1 },
      ];
      render(
        <FieldsPopover
          columns={defaultColumns}
          fieldConfig={configWithHidden}
          onFieldToggle={mockOnFieldToggle}
        />
      );
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });
});
