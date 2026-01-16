import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Duration } from '../Duration';

const enterEditMode = async (container: HTMLElement) => {
  const wrapper = container.querySelector('.field-component')?.parentElement;
  fireEvent.click(wrapper!);
  await new Promise((r) => setTimeout(r, 200));
};

describe('Duration Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Duration Formatting', () => {
    it('should support h:mm format', () => {
      render(<Duration value={150} onChange={mockOnChange} />);
      expect(screen.getByText(/^02:30$/)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should accept zero duration', () => {
      render(<Duration value={0} onChange={mockOnChange} />);
      expect(screen.getByText(/^00:00$/)).toBeInTheDocument();
    });

    it('should render negative duration gracefully', () => {
      render(<Duration value={-90} onChange={mockOnChange} />);
      // Component normalizes negatives to absolute display
      expect(screen.getByText(/^01:30$/)).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should not enter edit mode when allowEdit is false', async () => {
      const { container } = render(
        <Duration value={90} onChange={mockOnChange} allowEdit={false} />
      );

      const wrapper = container.querySelector('.field-component')?.parentElement!;
      fireEvent.click(wrapper);
      fireEvent.doubleClick(wrapper);

      await waitFor(() => {
        expect(container.querySelector('input')).not.toBeInTheDocument();
      });
    });
  });

  describe('Configuration Props', () => {
    it('should show placeholder when defaultValue is provided but value is null', () => {
      render(
        <Duration
          value={null}
          onChange={mockOnChange}
          config={{ defaultValue: '1:30', durationFormat: 'h:mm' }}
        />
      );

      expect(screen.getByText('h:mm')).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should sync external value changes', () => {
      const { rerender } = render(<Duration value={60} onChange={mockOnChange} />);
      rerender(<Duration value={120} onChange={mockOnChange} />);
      expect(screen.getByText(/^02:00$/)).toBeInTheDocument();
    });
  });
});
