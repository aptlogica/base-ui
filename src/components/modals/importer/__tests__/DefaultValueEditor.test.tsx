import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldType } from '../../../../types/fieldTypes';
import { DefaultValueEditor } from '../DefaultValueEditor';

describe('DefaultValueEditor', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Text field type', () => {
    it('should render a text input for text field type', () => {
      render(
        <DefaultValueEditor fieldType={FieldType.Text} value="" onChange={mockOnChange} />
      );

      expect(screen.getByPlaceholderText('default value')).toBeInTheDocument();
    });

    it('should call onChange when text value changes', async () => {
      const user = userEvent.setup();
      render(
        <DefaultValueEditor fieldType={FieldType.Text} value="" onChange={mockOnChange} />
      );

      await user.type(screen.getByPlaceholderText('default value'), 'hello');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should disable text input when disabled prop is true', () => {
      render(
        <DefaultValueEditor fieldType={FieldType.Text} value="" onChange={mockOnChange} disabled />
      );

      expect(screen.getByPlaceholderText('default value')).toBeDisabled();
    });
  });

  describe('Boolean field type', () => {
    it('should render checkbox as checked when value is true', () => {
      render(
        <DefaultValueEditor fieldType={FieldType.Boolean} value="true" onChange={mockOnChange} />
      );

      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('should render checkbox as checked when value is yes', () => {
      render(
        <DefaultValueEditor fieldType={FieldType.Boolean} value="yes" onChange={mockOnChange} />
      );

      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('should render checkbox as unchecked when value is false', () => {
      render(
        <DefaultValueEditor fieldType={FieldType.Boolean} value="false" onChange={mockOnChange} />
      );

      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('should call onChange with true when checkbox is checked', async () => {
      const user = userEvent.setup();
      render(
        <DefaultValueEditor fieldType={FieldType.Boolean} value="false" onChange={mockOnChange} />
      );

      await user.click(screen.getByRole('checkbox'));

      expect(mockOnChange).toHaveBeenCalledWith('true');
    });

    it('should call onChange with false when checkbox is unchecked', async () => {
      const user = userEvent.setup();
      render(
        <DefaultValueEditor fieldType={FieldType.Boolean} value="true" onChange={mockOnChange} />
      );

      await user.click(screen.getByRole('checkbox'));

      expect(mockOnChange).toHaveBeenCalledWith('false');
    });
  });

  describe('Date field type', () => {
    it('should render date input for date field type', () => {
      render(
        <DefaultValueEditor fieldType={FieldType.Date} value="2024-01-15" onChange={mockOnChange} />
      );

      expect(screen.getByDisplayValue('2024-01-15')).toHaveAttribute('type', 'date');
    });

    it('should call onChange when date value changes', async () => {
      const user = userEvent.setup();
      render(
        <DefaultValueEditor fieldType={FieldType.Date} value="" onChange={mockOnChange} />
      );

      await user.type(screen.getByDisplayValue(''), '2024-06-01');

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('DateTime field type', () => {
    it('should render datetime-local input for datetime field type', () => {
      render(
        <DefaultValueEditor
          fieldType={FieldType.DateTime}
          value="2024-01-15T10:30"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByDisplayValue('2024-01-15T10:30')).toHaveAttribute('type', 'datetime-local');
    });
  });

  describe('Time field type', () => {
    it('should render time input for time field type', () => {
      render(
        <DefaultValueEditor fieldType={FieldType.Time} value="14:30" onChange={mockOnChange} />
      );

      expect(screen.getByDisplayValue('14:30')).toHaveAttribute('type', 'time');
    });
  });

  describe('Number-like field types', () => {
    it('should render number input for number field type', () => {
      render(
        <DefaultValueEditor fieldType={FieldType.Number} value="42" onChange={mockOnChange} />
      );

      expect(screen.getByDisplayValue('42')).toHaveAttribute('type', 'number');
    });

    it('should use step 0.01 for decimal field type', () => {
      render(
        <DefaultValueEditor fieldType={FieldType.Decimal} value="1.5" onChange={mockOnChange} />
      );

      expect(screen.getByDisplayValue('1.5')).toHaveAttribute('step', '0.01');
    });

    it('should use step 0.01 for currency field type', () => {
      render(
        <DefaultValueEditor fieldType={FieldType.Currency} value="100" onChange={mockOnChange} />
      );

      expect(screen.getByDisplayValue('100')).toHaveAttribute('step', '0.01');
    });

    it('should use step 1 for year field type', () => {
      render(
        <DefaultValueEditor fieldType={FieldType.Year} value="2024" onChange={mockOnChange} />
      );

      expect(screen.getByDisplayValue('2024')).toHaveAttribute('step', '1');
    });

    it('should set min and max for rating field type', () => {
      render(
        <DefaultValueEditor fieldType={FieldType.Rating} value="3" onChange={mockOnChange} />
      );

      const input = screen.getByDisplayValue('3');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '5');
    });

    it('should render number input for duration field type', () => {
      render(
        <DefaultValueEditor fieldType={FieldType.Duration} value="60" onChange={mockOnChange} />
      );

      expect(screen.getByDisplayValue('60')).toHaveAttribute('type', 'number');
    });

    it('should call onChange when number value changes', async () => {
      const user = userEvent.setup();
      render(
        <DefaultValueEditor fieldType={FieldType.Number} value="" onChange={mockOnChange} />
      );

      await user.type(screen.getByPlaceholderText('0'), '7');

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should treat empty field type as text input', () => {
      render(
        <DefaultValueEditor fieldType="" value="" onChange={mockOnChange} />
      );

      expect(screen.getByPlaceholderText('default value')).toBeInTheDocument();
    });

    it('should treat unknown field type as text input', () => {
      render(
        <DefaultValueEditor fieldType="unknownType" value="" onChange={mockOnChange} />
      );

      expect(screen.getByPlaceholderText('default value')).toBeInTheDocument();
    });
  });
});
