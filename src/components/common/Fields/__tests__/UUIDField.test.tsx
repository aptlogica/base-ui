import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UUIDField } from '../UUIDField';

const AUTO = { idGeneration: { mode: 'auto' as const, version: 'v7' as const } };
const MANUAL = { idGeneration: { mode: 'manual' as const } };
const V4 = '3f6c2a9e-1b47-4d8a-9e05-7c2b4f1a8d63';

describe('UUIDField', () => {
  const onChange = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  describe('auto-generated', () => {
    it('shows the value read-only with a copy button', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      render(<UUIDField value={V4} onChange={onChange} config={AUTO} />);
      expect(screen.getByDisplayValue(V4)).toHaveAttribute('readonly');

      fireEvent.click(screen.getByRole('button', { name: 'Copy UUID' }));
      await waitFor(() => expect(writeText).toHaveBeenCalledWith(V4));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('explains that typing does nothing', () => {
      render(<UUIDField value={V4} onChange={onChange} config={AUTO} />);
      fireEvent.keyDown(screen.getByDisplayValue(V4),{ key: 'a' });
      expect(screen.getByRole('status')).toHaveTextContent('Generated automatically. This field is read-only.');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('shows "Generated on save" when there is no value yet', () => {
      render(<UUIDField value={null} onChange={onChange} config={AUTO} />);
      expect(screen.getByPlaceholderText('Generated on save')).toBeInTheDocument();
    });
  });

  describe('manual', () => {
    const startEditing = () => {
      fireEvent.click(screen.getByRole('button', { name: 'Edit UUID' }));
      return screen.getByRole('textbox');
    };

    it('saves a valid UUID in canonical form', () => {
      render(<UUIDField value="" onChange={onChange} config={MANUAL} />);
      const input = startEditing();
      fireEvent.change(input, { target: { value: `{${V4.toUpperCase()}}` } });
      fireEvent.blur(input);
      expect(onChange).toHaveBeenCalledWith(V4);
    });

    it('keeps an invalid value open with an error in a form field', () => {
      render(<UUIDField value="" onChange={onChange} config={MANUAL} isBorder />);
      const input = startEditing();
      fireEvent.change(input, { target: { value: 'ORD-2291-A' } });
      fireEvent.blur(input);
      expect(screen.getByRole('alert')).toHaveTextContent('Not a valid UUID.');
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('in the grid, hands an invalid value to the grid and closes, without a border of its own', () => {
      render(<UUIDField value={V4} onChange={onChange} config={MANUAL} />);
      const input = startEditing();
      // The grid cell's outline is the only border
      expect(input.className).not.toMatch(/\bborder\b|field-component-focus/);
      fireEvent.change(input, { target: { value: 'ORD-2291-A' } });
      fireEvent.blur(input);
      // The grid refuses it with an error toast and a red cell outline
      expect(onChange).toHaveBeenCalledWith('ORD-2291-A');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText(V4)).toBeInTheDocument();
    });

    it('in a form field, draws its own focus and error border', () => {
      render(<UUIDField value="" onChange={onChange} config={MANUAL} isBorder />);
      const input = startEditing();
      fireEvent.change(input, { target: { value: 'ORD-2291-A' } });
      fireEvent.blur(input);
      expect(input.className).toContain('field-component-focus');
      expect(input.className).toContain('border-(--color-error-500)');
    });

    it('clears the value', () => {
      render(<UUIDField value={V4} onChange={onChange} config={MANUAL} />);
      const input = startEditing();
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('does not edit when read-only', () => {
      render(<UUIDField value={V4} onChange={onChange} config={MANUAL} readOnly />);
      expect(screen.queryByRole('button', { name: 'Edit UUID' })).not.toBeInTheDocument();
      expect(screen.getByText(V4)).toBeInTheDocument();
    });

    it('treats a field without settings as manual', () => {
      render(<UUIDField value="" onChange={onChange} />);
      expect(screen.getByRole('button', { name: 'Edit UUID' })).toBeInTheDocument();
    });

    it('saves on Enter and does not call onChange when the value is unchanged', () => {
      render(<UUIDField value={V4} onChange={onChange} config={MANUAL} />);
      const input = startEditing();
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('cancels on Escape and shows the saved value again', () => {
      render(<UUIDField value={V4} onChange={onChange} config={MANUAL} />);
      const input = startEditing();
      fireEvent.change(input, { target: { value: 'something else' } });
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText(V4)).toBeInTheDocument();
    });

    it('hides the error once the value is edited', () => {
      render(<UUIDField value="" onChange={onChange} config={MANUAL} isBorder />);
      const input = startEditing();
      fireEvent.change(input, { target: { value: 'ORD-2291-A' } });
      fireEvent.blur(input);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      fireEvent.change(screen.getByRole('textbox'), { target: { value: V4 } });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('manual display', () => {
    it('shows the placeholder and no copy button when empty', () => {
      render(<UUIDField value="" onChange={onChange} config={MANUAL} placeholder="Enter id" />);
      expect(screen.getByRole('button', { name: 'Edit UUID' })).toHaveTextContent('Enter id');
      expect(screen.queryByRole('button', { name: 'Copy UUID' })).not.toBeInTheDocument();
    });

    it('copies the value without starting to edit', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      render(<UUIDField value={V4} onChange={onChange} config={MANUAL} />);
      fireEvent.click(screen.getByRole('button', { name: 'Copy UUID' }));
      await waitFor(() => expect(writeText).toHaveBeenCalledWith(V4));
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('starts editing on double click when allowEdit is false', () => {
      render(<UUIDField value={V4} onChange={onChange} config={MANUAL} allowEdit={false} />);
      const button = screen.getByRole('button', { name: 'Edit UUID' });
      fireEvent.click(button);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      fireEvent.doubleClick(button);
      expect(screen.getByRole('textbox')).toHaveValue(V4);
    });

    it('shows a not-allowed cursor when disabled', () => {
      const { container } = render(<UUIDField value={V4} onChange={onChange} config={MANUAL} disabled />);
      expect(screen.queryByRole('button', { name: 'Edit UUID' })).not.toBeInTheDocument();
      expect(container.querySelector('.field-component')).toHaveClass('cursor-not-allowed');
    });
  });
});
