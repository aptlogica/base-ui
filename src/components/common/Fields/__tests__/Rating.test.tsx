import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Rating } from '../Rating';

describe('Rating Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render default number of rating icons', () => {
      render(<Rating value={0} onChange={mockOnChange} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(6);
    });

    it('should render custom max rating', () => {
      render(<Rating value={0} onChange={mockOnChange} max={3} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(4);
    });

    it('should use ratingMax from config over max prop', () => {
      render(
        <Rating
          value={0}
          onChange={mockOnChange}
          max={5}
          config={{ ratingMax: 7 }}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(8);
    });
  });

  describe('Value Display Logic', () => {
    it('should display filled icons based on value', () => {
      render(<Rating value={3} onChange={mockOnChange} />);
      const stars = screen.getAllByRole('button').slice(1);
      expect(stars[0].querySelector('svg')).toHaveAttribute('fill', 'currentColor');
      expect(stars[2].querySelector('svg')).toHaveAttribute('fill', 'currentColor');
      expect(stars[4].querySelector('svg')).toHaveAttribute('fill', 'none');
    });

    it('should use ratingDefault when value is zero', () => {
      render(
        <Rating
          value={0}
          onChange={mockOnChange}
          config={{ ratingDefault: 2 }}
        />
      );
      const stars = screen.getAllByRole('button').slice(1);
      expect(stars[1].querySelector('svg')).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('Interaction', () => {
    it('should call onChange with selected value on click', async () => {
      render(<Rating value={0} onChange={mockOnChange} />);
      const star = screen.getAllByRole('button')[2];
      await userEvent.click(star);
      expect(mockOnChange).toHaveBeenCalledWith(2);
    });

    it('should toggle value to zero when clicking same value', async () => {
      render(<Rating value={2} onChange={mockOnChange} />);
      const star = screen.getAllByRole('button')[2];
      await userEvent.click(star);
      expect(mockOnChange).toHaveBeenCalledWith(0);
    });

    it('should not call onChange when disabled', async () => {
      render(<Rating value={0} onChange={mockOnChange} disabled />);
      const star = screen.getAllByRole('button')[1];
      await userEvent.click(star);
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should not call onChange when readOnly', async () => {
      render(<Rating value={0} onChange={mockOnChange} readOnly />);
      const star = screen.getAllByRole('button')[1];
      await userEvent.click(star);
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should show error when required and value is toggled to zero', async () => {
      render(<Rating value={1} onChange={mockOnChange} required />);
      const star = screen.getAllByRole('button')[1];
      await userEvent.click(star);
      expect(screen.getByText('Please provide a rating')).toBeInTheDocument();
    });

    it('should not render range error for valid user interaction', async () => {
      render(
        <Rating
          value={0}
          onChange={mockOnChange}
          config={{ ratingMax: 3 }}
        />
      );
      const star = screen.getAllByRole('button')[3];
      await userEvent.click(star);
      expect(
        screen.queryByText('Rating must be between 0 and 3')
      ).not.toBeInTheDocument();
    });
  });

  describe('Config Options', () => {
    it('should render custom icon from config', () => {
      render(
        <Rating
          value={1}
          onChange={mockOnChange}
          config={{ ratingIcon: 'heart' }}
        />
      );
      const svg = screen.getAllByRole('button')[1].querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply custom color class', () => {
      render(
        <Rating
          value={1}
          onChange={mockOnChange}
          config={{ ratingColor: 'red' }}
        />
      );
      const span = screen.getAllByRole('button')[1].querySelector('span');
      expect(span?.className).toContain('text-red-400');
    });
  });

  describe('Edge Cases', () => {
    it('should handle value greater than max gracefully', () => {
      render(<Rating value={10} onChange={mockOnChange} max={5} />);
      const stars = screen.getAllByRole('button').slice(1);
      expect(stars[4].querySelector('svg')).toHaveAttribute('fill', 'currentColor');
    });

    it('should handle negative value', () => {
      render(<Rating value={-1} onChange={mockOnChange} />);
      const stars = screen.getAllByRole('button').slice(1);
      expect(stars[0].querySelector('svg')).toHaveAttribute('fill', 'none');
    });
  });

  describe('Accessibility', () => {
    it('should render all stars as buttons', () => {
      render(<Rating value={0} onChange={mockOnChange} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(1);
    });

    it('should disable star buttons when disabled', () => {
      render(<Rating value={0} onChange={mockOnChange} disabled />);
      const star = screen.getAllByRole('button')[1];
      expect(star).toBeDisabled();
    });
  });
});
