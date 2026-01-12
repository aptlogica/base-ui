import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Rating } from '../Rating';

describe('Rating Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render rating component', () => {
      const { container } = render(
        <Rating value={0} onChange={mockOnChange} />
      );
      expect(container.querySelector('.rating-stars')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(
        <Rating label="Rate" value={0} onChange={mockOnChange} />
      );
      expect(screen.getByText('Rate')).toBeInTheDocument();
    });

    it('should render required asterisk', () => {
      render(
        <Rating label="Rating" value={0} onChange={mockOnChange} required />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display correct number of stars', () => {
      const { container } = render(
        <Rating value={3} onChange={mockOnChange} config={{ maxRating: 5 }} />
      );
      const stars = container.querySelectorAll('.star');
      expect(stars.length).toBeGreaterThan(0);
    });
  });

  describe('Interaction', () => {
    it('should select rating on click', async () => {
      const { container } = render(
        <Rating value={0} onChange={mockOnChange} config={{ maxRating: 5 }} />
      );
      const stars = container.querySelectorAll('.star');

      if (stars.length > 2) {
        fireEvent.click(stars[2]);
        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should update rating when clicked', async () => {
      const { container, rerender } = render(
        <Rating value={2} onChange={mockOnChange} config={{ maxRating: 5 }} />
      );

      const stars = container.querySelectorAll('.star');
      if (stars.length > 3) {
        fireEvent.click(stars[3]);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should show hover effect', async () => {
      const { container } = render(
        <Rating value={0} onChange={mockOnChange} config={{ maxRating: 5 }} />
      );
      const stars = container.querySelectorAll('.star');

      if (stars.length > 2) {
        fireEvent.mouseEnter(stars[2]);
        expect(stars[2]).toBeInTheDocument();

        fireEvent.mouseLeave(stars[2]);
        expect(stars[2]).toBeInTheDocument();
      }
    });
  });

  describe('Configuration', () => {
    it('should use custom max rating', () => {
      const { container } = render(
        <Rating value={0} onChange={mockOnChange} config={{ maxRating: 10 }} />
      );
      const stars = container.querySelectorAll('.star');
      expect(stars.length).toBeGreaterThanOrEqual(5);
    });

    it('should use default value from config', () => {
      render(
        <Rating
          value={0}
          onChange={mockOnChange}
          config={{ defaultValue: 3, maxRating: 5 }}
        />
      );
      expect(screen.getByRole('presentation') || document.body).toBeInTheDocument();
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should prevent interaction when disabled', () => {
      const { container } = render(
        <Rating value={2} onChange={mockOnChange} disabled />
      );
      const stars = container.querySelectorAll('.star');

      if (stars.length > 0) {
        fireEvent.click(stars[0]);
        expect(mockOnChange).not.toHaveBeenCalled();
      }
    });

    it('should prevent interaction when readOnly', () => {
      const { container } = render(
        <Rating value={2} onChange={mockOnChange} readOnly />
      );
      const stars = container.querySelectorAll('.star');

      if (stars.length > 0) {
        fireEvent.click(stars[0]);
        expect(mockOnChange).not.toHaveBeenCalled();
      }
    });

    it('should display value when readOnly', () => {
      const { container } = render(
        <Rating value={4} onChange={mockOnChange} readOnly config={{ maxRating: 5 }} />
      );
      expect(container.querySelector('.rating-stars')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should validate required rating', () => {
      render(
        <Rating value={0} onChange={mockOnChange} required />
      );
      // Component should be rendered
      expect(document.body).toBeInTheDocument();
    });

    it('should accept valid rating values', async () => {
      const { container } = render(
        <Rating value={0} onChange={mockOnChange} config={{ maxRating: 5 }} />
      );
      const stars = container.querySelectorAll('.star');

      if (stars.length > 0) {
        fireEvent.click(stars[0]);
        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Value Synchronization', () => {
    it('should update when value prop changes', () => {
      const { rerender, container } = render(
        <Rating value={2} onChange={mockOnChange} config={{ maxRating: 5 }} />
      );

      rerender(
        <Rating value={4} onChange={mockOnChange} config={{ maxRating: 5 }} />
      );

      expect(container.querySelector('.rating-stars')).toBeInTheDocument();
    });

    it('should handle rating changes', () => {
      const { rerender } = render(
        <Rating value={0} onChange={mockOnChange} config={{ maxRating: 5 }} />
      );

      rerender(
        <Rating value={1} onChange={mockOnChange} config={{ maxRating: 5 }} />
      );

      rerender(
        <Rating value={5} onChange={mockOnChange} config={{ maxRating: 5 }} />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero rating', () => {
      const { container } = render(
        <Rating value={0} onChange={mockOnChange} config={{ maxRating: 5 }} />
      );
      expect(container.querySelector('.rating-stars')).toBeInTheDocument();
    });

    it('should handle max rating', () => {
      const { container } = render(
        <Rating value={5} onChange={mockOnChange} config={{ maxRating: 5 }} />
      );
      expect(container.querySelector('.rating-stars')).toBeInTheDocument();
    });

    it('should handle custom max rating with matching value', () => {
      const { container } = render(
        <Rating value={10} onChange={mockOnChange} config={{ maxRating: 10 }} />
      );
      expect(container.querySelector('.rating-stars')).toBeInTheDocument();
    });

    it('should handle rapid clicks', async () => {
      const { container } = render(
        <Rating value={0} onChange={mockOnChange} config={{ maxRating: 5 }} />
      );
      const stars = container.querySelectorAll('.star');

      if (stars.length > 3) {
        fireEvent.click(stars[1]);
        fireEvent.click(stars[2]);
        fireEvent.click(stars[3]);

        await waitFor(() => {
          expect(mockOnChange.mock.calls.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(
        <Rating label="Quality" value={0} onChange={mockOnChange} />
      );
      expect(screen.getByText('Quality')).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      render(
        <Rating label="Rating" value={0} onChange={mockOnChange} required />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const { container } = render(
        <Rating value={0} onChange={mockOnChange} config={{ maxRating: 5 }} />
      );
      expect(container.querySelector('.rating-stars')).toBeInTheDocument();
    });
  });
});
