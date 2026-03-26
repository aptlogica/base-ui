import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Email } from '../Email';

describe('Email Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const enterEditMode = async () => {
    const display = screen.getByText((_, el) =>
      el?.classList.contains('field-component') ?? false
    );
    fireEvent.click(display);
    await waitFor(() => {
      expect(screen.queryByRole('textbox')).toBeInTheDocument();
    });
    return screen.getByRole('textbox');
  };

  describe('Rendering', () => {
    it('should render display value container', () => {
      render(<Email value="" onChange={mockOnChange} />);
      expect(
        screen.getByText((_, el) => el?.classList.contains('field-component') ?? false)
      ).toBeInTheDocument();
    });

    it('should display current value', () => {
      render(<Email value="test@example.com" onChange={mockOnChange} />);
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Input Interaction', () => {
    it('should update local value on input change', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = await enterEditMode();

      await userEvent.type(input, 'user@example.com');
      expect((input as HTMLInputElement).value).toBe('user@example.com');
    });

    it('should call onChange on blur with valid email', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = await enterEditMode();

      await userEvent.type(input, 'user@example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('user@example.com');
      });
    });

    it('should handle Escape key to revert changes', async () => {
      render(<Email value="original@example.com" onChange={mockOnChange} />);
      const input = await enterEditMode();

      await userEvent.clear(input);
      await userEvent.type(input, 'new@example.com');
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(
          screen.getByText((text, el) =>
            text === 'original@example.com' && (el?.classList.contains('field-component') ?? false)
          )
        ).toBeInTheDocument();
      });
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should reject invalid email', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = await enterEditMode();

      await userEvent.type(input, 'invalid');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should accept valid email', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = await enterEditMode();

      await userEvent.type(input, 'valid@mail.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('valid@mail.com');
      });
    });

    it('should skip validation when emailValid is false', async () => {
      render(
        <Email
          value=""
          onChange={mockOnChange}
          config={{ emailValid: false }}
        />
      );
      const input = await enterEditMode();

      await userEvent.type(input, 'not-an-email');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('not-an-email');
      });
    });
  });

  describe('Required', () => {
    it('should not save empty required value', async () => {
      render(<Email value="" onChange={mockOnChange} required />);
      const input = await enterEditMode();

      fireEvent.blur(input);
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Disabled and ReadOnly', () => {
    it('should not enter edit mode when disabled', async () => {
      render(
        <Email value="test@example.com" onChange={mockOnChange} disabled />
      );
      fireEvent.click(screen.getByText('test@example.com'));
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should not enter edit mode when readOnly', async () => {
      render(
        <Email value="test@example.com" onChange={mockOnChange} readOnly />
      );
      fireEvent.click(screen.getByText('test@example.com'));
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Config', () => {
    it('should use defaultValue from config', () => {
      render(
        <Email
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: 'default@example.com' }}
        />
      );
      expect(screen.getByText('default@example.com')).toBeInTheDocument();
    });
  });

  describe('Value sync', () => {
    it('should update display when value prop changes', () => {
      const { rerender } = render(
        <Email value="first@example.com" onChange={mockOnChange} />
      );

      expect(screen.getByText('first@example.com')).toBeInTheDocument();

      rerender(<Email value="second@example.com" onChange={mockOnChange} />);
      expect(screen.getByText('second@example.com')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined value', () => {
      render(<Email value={undefined} onChange={mockOnChange} />);
      expect(
        screen.getByText((_, el) => el?.classList.contains('field-component') ?? false)
      ).toBeInTheDocument();
    });
  });
});
