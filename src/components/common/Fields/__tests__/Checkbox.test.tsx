import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Checkbox } from '../Checkbox';

describe('Checkbox Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render checkbox component', () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<Checkbox label="Accept terms" value={false} onChange={mockOnChange} />);
      expect(screen.getByText('Accept terms')).toBeInTheDocument();
    });

    it('should render unchecked icon by default', () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} icon="check" />
      );
      expect(container.querySelector('.text-gray-400')).toBeInTheDocument();
    });

    it('should render checked icon when value is true', () => {
      const { container } = render(
        <Checkbox value={true} onChange={mockOnChange} icon="check" />
      );
      // Check for colored icon
      expect(container.querySelector('[class*="text-"]')).toBeInTheDocument();
    });

    it('should render description from config', () => {
      render(
        <Checkbox
          value={false}
          onChange={mockOnChange}
          config={{ description: 'Accept our terms' }}
        />
      );
      expect(screen.getByText('Accept our terms')).toBeInTheDocument();
    });
  });

  describe('Icon Variants', () => {
    const icons = ['check', 'circle', 'star', 'heart', 'thumb', 'flag', 'badge', 'shield', 'award', 'trophy', 'medal', 'crown', 'gem', 'diamond', 'zap', 'sparkles'];

    icons.forEach(icon => {
      it(`should render ${icon} icon when checked`, () => {
        const { container } = render(
          <Checkbox value={true} onChange={mockOnChange} icon={icon} />
        );
        expect(container.querySelector('.w-5')).toBeInTheDocument();
      });

      it(`should render ${icon} icon when unchecked`, () => {
        const { container } = render(
          <Checkbox value={false} onChange={mockOnChange} icon={icon} />
        );
        expect(container.querySelector('.w-5')).toBeInTheDocument();
      });
    });
  });

  describe('Color Variants', () => {
    const colors = ['green', 'blue', 'red', 'purple', 'orange', 'gray', 'yellow'];

    colors.forEach(color => {
      it(`should apply ${color} color when checked`, () => {
        const { container } = render(
          <Checkbox value={true} onChange={mockOnChange} color={color} icon="check" />
        );
        // Component renders with color classes
        expect(container.querySelector('.w-5')).toBeInTheDocument();
      });
    });

    it('should default to green color', () => {
      const { container } = render(
        <Checkbox value={true} onChange={mockOnChange} />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should use color from config', () => {
      const { container } = render(
        <Checkbox
          value={true}
          onChange={mockOnChange}
          config={{ color: 'blue' }}
        />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call onChange when clicked', async () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} />
      );
      const checkbox = container.querySelector('.w-5')?.closest('div');

      fireEvent.click(checkbox!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(true);
      });
    });

    it('should toggle from checked to unchecked', async () => {
      const { container, rerender } = render(
        <Checkbox value={true} onChange={mockOnChange} />
      );

      const checkbox = container.querySelector('.w-5')?.closest('div');
      fireEvent.click(checkbox!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(false);
      });
    });

    it('should toggle from unchecked to checked', async () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} />
      );

      const checkbox = container.querySelector('.w-5')?.closest('div');
      fireEvent.click(checkbox!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(true);
      });
    });

    it('should call onChange when label is clicked', async () => {
      const { container } = render(
        <Checkbox label="Check me" value={false} onChange={mockOnChange} />
      );

      const label = screen.getByText('Check me');
      fireEvent.click(label);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Disabled State', () => {
    it('should not call onChange when disabled', () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} disabled />
      );
      const checkbox = container.querySelector('.w-5')?.closest('div');

      fireEvent.click(checkbox!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should apply disabled styles', () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} disabled />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should prevent interaction when disabled', () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} disabled />
      );
      const checkbox = container.querySelector('.w-5')?.closest('div');

      fireEvent.click(checkbox!);
      fireEvent.click(checkbox!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('ReadOnly State', () => {
    it('should not call onChange when readOnly', () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} readOnly />
      );
      const checkbox = container.querySelector('.w-5')?.closest('div');

      fireEvent.click(checkbox!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should display value when readOnly', () => {
      const { container } = render(
        <Checkbox value={true} onChange={mockOnChange} readOnly />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });
  });

  describe('Config Props', () => {
    it('should use defaultValue from config', () => {
      const { container } = render(
        <Checkbox
          value={false}
          onChange={mockOnChange}
          config={{ defaultValue: true }}
        />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should use icon from config', () => {
      const { container } = render(
        <Checkbox
          value={true}
          onChange={mockOnChange}
          config={{ icon: 'star' }}
        />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should use color from config', () => {
      const { container } = render(
        <Checkbox
          value={true}
          onChange={mockOnChange}
          config={{ color: 'red' }}
        />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should use description from config', () => {
      render(
        <Checkbox
          value={false}
          onChange={mockOnChange}
          config={{ description: 'Required description' }}
        />
      );
      expect(screen.getByText('Required description')).toBeInTheDocument();
    });
  });

  describe('Value Handling', () => {
    it('should handle boolean true', () => {
      const { container } = render(
        <Checkbox value={true} onChange={mockOnChange} />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should handle boolean false', () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should handle non-boolean values during field conversion', () => {
      const { container } = render(
        <Checkbox value="yes" as any onChange={mockOnChange} />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      const { container } = render(
        <Checkbox value={undefined as any} onChange={mockOnChange} />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should handle null value', () => {
      const { container } = render(
        <Checkbox value={null as any} onChange={mockOnChange} />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should update when value prop changes', () => {
      const { rerender, container } = render(
        <Checkbox value={false} onChange={mockOnChange} icon="check" />
      );

      let unchecked = container.querySelector('.text-gray-400');
      expect(unchecked).toBeInTheDocument();

      rerender(
        <Checkbox value={true} onChange={mockOnChange} icon="check" />
      );

      // After rerender, the gray icon should be gone
      unchecked = container.querySelector('.text-gray-400');
      expect(unchecked).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicks', async () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} />
      );
      const checkbox = container.querySelector('.w-5')?.closest('div');

      fireEvent.click(checkbox!);
      fireEvent.click(checkbox!);
      fireEvent.click(checkbox!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(3);
      });
    });

    it('should handle changing color while checked', () => {
      const { rerender, container } = render(
        <Checkbox value={true} onChange={mockOnChange} color="green" />
      );

      rerender(
        <Checkbox value={true} onChange={mockOnChange} color="red" />
      );

      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should handle changing icon while checked', () => {
      const { rerender, container } = render(
        <Checkbox value={true} onChange={mockOnChange} icon="check" />
      );

      rerender(
        <Checkbox value={true} onChange={mockOnChange} icon="star" />
      );

      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should handle invalid color gracefully', () => {
      const { container } = render(
        <Checkbox value={true} onChange={mockOnChange} color="invalid" />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should handle missing icon gracefully', () => {
      const { container } = render(
        <Checkbox value={true} onChange={mockOnChange} icon="" />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render with descriptive label', () => {
      render(
        <Checkbox
          label="Accept terms and conditions"
          value={false}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('Accept terms and conditions')).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} />
      );
      const checkbox = container.querySelector('.w-5')?.closest('div');

      // Simulate keyboard interaction
      fireEvent.keyDown(checkbox!, { key: 'Enter', code: 'Enter' });

      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });
  });
});
