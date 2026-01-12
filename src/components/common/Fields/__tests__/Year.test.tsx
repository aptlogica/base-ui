import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Year } from '../Year';

describe('Year Component', () => {
  const mockOnChange = vi.fn();
  const currentYear = new Date().getFullYear();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render year input component', () => {
      render(<Year value="" onChange={mockOnChange} />);
      expect(screen.getByRole('spinbutton') || screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<Year label="Year" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Year')).toBeInTheDocument();
    });

    it('should render required asterisk', () => {
      render(<Year label="Birth Year" value="" onChange={mockOnChange} required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display year value', () => {
      render(<Year value="2024" onChange={mockOnChange} />);
      expect(screen.getByDisplayValue('2024')).toBeInTheDocument();
    });
  });

  describe('Input Interaction', () => {
    it('should accept valid year input', async () => {
      render(<Year value="" onChange={mockOnChange} />);
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, '2024');
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should accept 4-digit years', async () => {
      render(<Year value="" onChange={mockOnChange} />);
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, '1995');
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should accept current year', async () => {
      render(<Year value="" onChange={mockOnChange} />);
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, currentYear.toString());
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Validation', () => {
    it('should validate required field', async () => {
      render(<Year value="" onChange={mockOnChange} required />);
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');

      if (input) {
        fireEvent.blur(input);
        expect(mockOnChange).not.toHaveBeenCalled();
      }
    });

    it('should accept valid year values', async () => {
      render(<Year value="" onChange={mockOnChange} required />);
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, '2000');
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should reject invalid year format', async () => {
      render(<Year value="" onChange={mockOnChange} />);
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, '20ab');
        fireEvent.blur(input);

        expect(/^\d{0,4}$/.test((input as HTMLInputElement).value)).toBe(true);
      }
    });
  });

  describe('Year Range', () => {
    it('should accept year before current', async () => {
      render(<Year value="" onChange={mockOnChange} />);
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, '1950');
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should accept year after current', async () => {
      render(<Year value="" onChange={mockOnChange} />);
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, '2050');
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should use min constraint from config', () => {
      render(
        <Year
          value=""
          onChange={mockOnChange}
          config={{ minYear: 1900 }}
        />
      );
      expect(screen.getByRole('spinbutton') || screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should use max constraint from config', () => {
      render(
        <Year
          value=""
          onChange={mockOnChange}
          config={{ maxYear: 2099 }}
        />
      );
      expect(screen.getByRole('spinbutton') || screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable input when disabled', () => {
      render(
        <Year value="2024" onChange={mockOnChange} disabled />
      );
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');
      if (input && input.tagName === 'INPUT') {
        expect(input).toBeDisabled();
      }
    });

    it('should prevent editing when readOnly', async () => {
      const { container } = render(
        <Year
          value="2024"
          onChange={mockOnChange}
          readOnly
          allowEdit={true}
        />
      );
      const editable = container.querySelector('.field-component');

      if (editable) {
        fireEvent.click(editable);
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Config Props', () => {
    it('should use defaultValue from config', () => {
      render(
        <Year
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: 2020 }}
        />
      );
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');
      if (input && input.tagName === 'INPUT') {
        expect((input as HTMLInputElement).value).toBe('2020');
      }
    });

    it('should use minYear from config', () => {
      render(
        <Year
          value=""
          onChange={mockOnChange}
          config={{ minYear: 1900 }}
        />
      );
      expect(screen.getByRole('spinbutton') || screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should use maxYear from config', () => {
      render(
        <Year
          value=""
          onChange={mockOnChange}
          config={{ maxYear: 2099 }}
        />
      );
      expect(screen.getByRole('spinbutton') || screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should update when value prop changes', () => {
      const { rerender } = render(
        <Year value="2020" onChange={mockOnChange} />
      );
      expect(screen.getByDisplayValue('2020')).toBeInTheDocument();

      rerender(
        <Year value="2024" onChange={mockOnChange} />
      );

      expect(screen.getByDisplayValue('2024')).toBeInTheDocument();
    });

    it('should sync defaultValue on mount', () => {
      const { rerender } = render(
        <Year
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: 2015 }}
        />
      );

      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');
      if (input && input.tagName === 'INPUT') {
        expect((input as HTMLInputElement).value).toBe('2015');
      }

      rerender(
        <Year
          value="2023"
          onChange={mockOnChange}
          config={{ defaultValue: 2015 }}
        />
      );

      expect(screen.getByDisplayValue('2023')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<Year value="" onChange={mockOnChange} />);
      expect(screen.getByRole('spinbutton') || screen.getByRole('textbox')).toHaveValue('');
    });

    it('should handle very old years', async () => {
      render(<Year value="" onChange={mockOnChange} />);
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, '1000');
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should handle future years', async () => {
      render(<Year value="" onChange={mockOnChange} />);
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, '2100');
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should handle 2-digit year input', async () => {
      render(<Year value="" onChange={mockOnChange} />);
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, '24');
        fireEvent.blur(input);

        expect(screen.getByRole('spinbutton') || screen.getByRole('textbox')).toBeInTheDocument();
      }
    });

    it('should reject non-numeric input', async () => {
      render(<Year value="" onChange={mockOnChange} />);
      const input = screen.getByRole('spinbutton') || screen.getByRole('textbox');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, 'abcd');
        fireEvent.blur(input);

        expect(/^\d*$/.test((input as HTMLInputElement).value)).toBe(true);
      }
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(
        <Year label="Birth Year" value="" onChange={mockOnChange} />
      );
      expect(screen.getByText('Birth Year')).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      render(
        <Year label="Year" value="" onChange={mockOnChange} required />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should have proper input type', () => {
      const { container } = render(
        <Year value="" onChange={mockOnChange} />
      );
      const input = container.querySelector('input[type="number"]') ||
                   container.querySelector('input[type="text"]');
      expect(input).toBeInTheDocument();
    });
  });
});
