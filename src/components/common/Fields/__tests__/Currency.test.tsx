import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Currency } from '../Currency';

describe('Currency Component', () => {
  const mockOnChange = vi.fn();

  const getDisplay = () =>
    document.querySelector('.field-component') as HTMLElement;

  const enterEditMode = async () => {
    fireEvent.click(getDisplay());
    const input = await screen.findByRole('textbox', { hidden: true });
    return input as HTMLInputElement;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Input Interaction', () => {
    it('should update local value on input change', async () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      const input = await enterEditMode();

      await userEvent.type(input, '100.50');
      expect(input.value).toBe('100.50');
    });

    it('should call onChange on blur with valid amount', async () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      const input = await enterEditMode();

      await userEvent.type(input, '99.99');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should handle Enter key to blur', async () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      const input = await enterEditMode();

      await userEvent.type(input, '50');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should not revert value on Escape key', async () => {
      render(<Currency value={100} onChange={mockOnChange} />);
      const input = await enterEditMode();

      await userEvent.clear(input);
      await userEvent.type(input, '200');
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(input.value).toBe('200');
    });

    it('filters invalid characters and limits decimals', async () => {
      render(<Currency value={null} onChange={mockOnChange} config={{ precision: 2 }} />);
      const input = await enterEditMode();

      fireEvent.change(input, { target: { value: '12.3456' } });
      expect(input.value).toBe('12.34');

      fireEvent.change(input, { target: { value: '-1-2' } });
      expect(input.value).toBe('-12');
    });

    it('rejects values beyond max safe amount', async () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      const input = await enterEditMode();

      fireEvent.change(input, { target: { value: '9999999999999' } });
      expect(input.value).toBe('');
    });
  });

  describe('Validation', () => {
    it('should clear invalid currency input on blur', async () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      const input = await enterEditMode();

      await userEvent.type(input, 'abc');
      fireEvent.blur(input);

      expect(input.value).toBe('');
    });

    it('should accept zero value', async () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      const input = await enterEditMode();

      await userEvent.type(input, '0');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept negative amounts', async () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      const input = await enterEditMode();

      await userEvent.type(input, '-50.00');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should call onChange with null for required empty field', async () => {
      render(<Currency value={null} onChange={mockOnChange} required />);
      const input = await enterEditMode();

      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should not enter edit mode when disabled', async () => {
      render(<Currency value={100} onChange={mockOnChange} disabled />);
      fireEvent.click(getDisplay());

      await waitFor(() => {
        expect(
          screen.queryByRole('textbox', { hidden: true })
        ).not.toBeInTheDocument();
      });
    });

    it('should not enter edit mode when readOnly', async () => {
      render(
        <Currency value={100} onChange={mockOnChange} readOnly allowEdit />
      );
      fireEvent.click(getDisplay());

      await waitFor(() => {
        expect(
          screen.queryByRole('textbox', { hidden: true })
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      expect(getDisplay()).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(<Currency value={undefined} onChange={mockOnChange} />);
      expect(getDisplay()).toBeInTheDocument();
    });

    it('should handle zero value', () => {
      render(<Currency value={0} onChange={mockOnChange} />);
      expect(getDisplay().textContent).toContain('0');
    });

    it('should handle very large numbers', () => {
      render(<Currency value={999999999.99} onChange={mockOnChange} />);
      expect(getDisplay().textContent).toContain('999');
    });

    it('should handle negative zero', () => {
      render(<Currency value={-0} onChange={mockOnChange} />);
      expect(getDisplay()).toBeInTheDocument();
    });

    it('formats currency using locale and precision', () => {
      render(
        <Currency
          value={1234.5}
          onChange={mockOnChange}
          config={{ currencyType: 'EUR', currencyLocale: 'de-DE', precision: 1 }}
        />
      );
      expect(getDisplay().textContent).toContain('€');
    });
  });
});
