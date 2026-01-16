import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Decimal } from '../Decimal';

describe('Decimal Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const clickToEdit = async (container: HTMLElement) => {
    const display = container.querySelector('.field-component');
    expect(display).toBeTruthy();
    fireEvent.click(display!);
    await waitFor(() => {
      expect(container.querySelector('input')).toBeInTheDocument();
    });
    return container.querySelector('input') as HTMLInputElement;
  };

  describe('Rendering', () => {
    it('should render decimal display', () => {
      const { container } = render(<Decimal value={0} onChange={mockOnChange} />);
      expect(container.querySelector('.field-component')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<Decimal label="Rate" value={0} onChange={mockOnChange} />);
      expect(screen.getByText('Rate')).toBeInTheDocument();
    });

    it('should render required asterisk', () => {
      render(<Decimal label="Percentage" value={0} onChange={mockOnChange} required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display formatted decimal value', () => {
      const { container } = render(<Decimal value={3.14} onChange={mockOnChange} />);
      expect(container.textContent).toContain('3.14');
    });
  });

  describe('Input Interaction', () => {
    it('should accept decimal input', async () => {
      const { container } = render(<Decimal value={0} onChange={mockOnChange} />);
      const input = await clickToEdit(container);

      await userEvent.clear(input);
      await userEvent.type(input, '10.5');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(10.5);
      });
    });

    it('should accept negative decimals', async () => {
      const { container } = render(<Decimal value={0} onChange={mockOnChange} />);
      const input = await clickToEdit(container);

      await userEvent.clear(input);
      await userEvent.type(input, '-5.75');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(-5.75);
      });
    });

    it('should round to precision', async () => {
      const { container } = render(
        <Decimal value={0} onChange={mockOnChange} decimals={2} />
      );
      const input = await clickToEdit(container);

      await userEvent.clear(input);
      await userEvent.type(input, '3.14159');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(3.14);
      });
    });

    it('should clear invalid input to null', async () => {
      const { container } = render(<Decimal value={1.2} onChange={mockOnChange} />);
      const input = await clickToEdit(container);

      await userEvent.clear(input);
      await userEvent.type(input, 'abc');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Validation', () => {
    it('should not call onChange when required and empty', async () => {
      const { container } = render(
        <Decimal value={null} onChange={mockOnChange} required />
      );
      const input = await clickToEdit(container);

      await userEvent.clear(input);
      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should accept zero as valid value', async () => {
      const { container } = render(<Decimal value={0} onChange={mockOnChange} />);
      const input = await clickToEdit(container);

      // Value is already zero, no change should be committed
      fireEvent.blur(input);

      expect(input.value).toBe('0.00');
      expect(mockOnChange).not.toHaveBeenCalled();
    });



    it('should allow empty value when not required', async () => {
      const { container } = render(
        <Decimal value={1.5} onChange={mockOnChange} required={false} />
      );
      const input = await clickToEdit(container);

      await userEvent.clear(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should not enter edit mode when disabled', async () => {
      const { container } = render(
        <Decimal value={5.5} onChange={mockOnChange} disabled />
      );
      const display = container.querySelector('.field-component')!;
      fireEvent.click(display);

      expect(container.querySelector('input')).not.toBeInTheDocument();
    });

    it('should not enter edit mode when readOnly', async () => {
      const { container } = render(
        <Decimal value={5.5} onChange={mockOnChange} readOnly />
      );
      const display = container.querySelector('.field-component')!;
      fireEvent.click(display);

      expect(container.querySelector('input')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle defaultValue from config', () => {
      const { container } = render(
        <Decimal
          value={null}
          onChange={mockOnChange}
          config={{ defaultValue: 2.5 }}
        />
      );
      expect(container.textContent).toContain('2.50');
    });

    it('should support thousands formatting', () => {
      const { container } = render(
        <Decimal
          value={12345.67}
          onChange={mockOnChange}
          config={{ showThousands: true }}
        />
      );
      expect(container.textContent).toContain('12,345.67');
    });
  });
});
