import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { URL } from '../URL';

describe('URL Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render URL input component', () => {
      render(<URL value="" onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<URL label="Website" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Website')).toBeInTheDocument();
    });

    it('should display URL value', () => {
      render(<URL value="https://example.com" onChange={mockOnChange} />);
      expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
    });
  });

  describe('Input Interaction', () => {
    it('should accept valid URLs', async () => {
      render(<URL value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'https://example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept URLs without protocol', async () => {
      render(<URL value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept URLs with paths and query params', async () => {
      render(<URL value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'https://example.com/path?query=value');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Validation', () => {
    it('should validate required field', async () => {
      render(<URL value="" onChange={mockOnChange} required />);
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should accept valid URL formats', async () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://example.com/path',
        'https://sub.example.com'
      ];

      for (const url of validUrls) {
        vi.clearAllMocks();
        render(<URL value="" onChange={mockOnChange} />);
        const input = screen.getByRole('textbox');

        await userEvent.type(input, url);
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable input when disabled', () => {
      render(
        <URL value="https://example.com" onChange={mockOnChange} disabled />
      );
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should prevent editing when readOnly', async () => {
      const { container } = render(
        <URL
          value="https://example.com"
          onChange={mockOnChange}
          readOnly
          allowEdit={true}
        />
      );
      const editable = container.querySelector('.field-component');

      fireEvent.click(editable!);
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<URL value="" onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should handle very long URLs', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      render(<URL value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, longUrl);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should handle URLs with fragments', async () => {
      render(<URL value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'https://example.com#section');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should handle relative URLs', async () => {
      render(<URL value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '/path/to/page');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });
});
