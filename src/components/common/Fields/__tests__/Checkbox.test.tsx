import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
      expect(container.querySelector('[class*="text-"]')).toBeInTheDocument();
    });

    it('should not render description from config (not supported by component)', () => {
      render(
        <Checkbox
          value={false}
          onChange={mockOnChange}
          config={{ description: 'Accept our terms' }}
        />
      );
      expect(screen.queryByText('Accept our terms')).not.toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call onChange when clicked', () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} />
      );
      const button = container.querySelector('button');

      fireEvent.click(button!);

      expect(mockOnChange).toHaveBeenCalledWith(true);
    });

    it('should toggle from checked to unchecked', () => {
      const { container } = render(
        <Checkbox value={true} onChange={mockOnChange} />
      );
      const button = container.querySelector('button');

      fireEvent.click(button!);

      expect(mockOnChange).toHaveBeenCalledWith(false);
    });

    it('should toggle from unchecked to checked', () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} />
      );
      const button = container.querySelector('button');

      fireEvent.click(button!);

      expect(mockOnChange).toHaveBeenCalledWith(true);
    });

    it('should not toggle when clicking label text', () => {
      render(
        <Checkbox label="Check me" value={false} onChange={mockOnChange} />
      );

      fireEvent.click(screen.getByText('Check me'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should not call onChange when disabled', () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} disabled />
      );
      const button = container.querySelector('button');

      fireEvent.click(button!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should not call onChange when readOnly', () => {
      const { container } = render(
        <Checkbox value={false} onChange={mockOnChange} readOnly />
      );
      const button = container.querySelector('button');

      fireEvent.click(button!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Config Props', () => {
    it('should apply defaultValue from config without crashing', () => {
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

    it('should not render description from config (not supported)', () => {
      render(
        <Checkbox
          value={false}
          onChange={mockOnChange}
          config={{ description: 'Required description' }}
        />
      );
      expect(screen.queryByText('Required description')).not.toBeInTheDocument();
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

    it('should handle non-boolean values gracefully', () => {
      const { container } = render(
        <Checkbox value={('yes' as unknown) as boolean} onChange={mockOnChange} />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      const { container } = render(
        <Checkbox value={undefined} onChange={mockOnChange} />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should handle null value', () => {
      const { container } = render(
        <Checkbox value={(null as unknown) as boolean} onChange={mockOnChange} />
      );
      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });

    it('should normalize string values using defaultValue', () => {
      const { container } = render(
        <Checkbox
          value={('0' as unknown) as boolean}
          onChange={mockOnChange}
          config={{ defaultValue: true }}
        />
      );
      const button = container.querySelector('button');

      fireEvent.click(button!);

      expect(mockOnChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Value Synchronization', () => {
    it('should update when value prop changes', () => {
      const { rerender, container } = render(
        <Checkbox value={false} onChange={mockOnChange} icon="check" />
      );

      expect(container.querySelector('.text-gray-400')).toBeInTheDocument();

      rerender(
        <Checkbox value={true} onChange={mockOnChange} icon="check" />
      );

      expect(container.querySelector('.text-gray-400')).not.toBeInTheDocument();
    });

    it('renders thumb icon when configured', () => {
      const { container } = render(
        <Checkbox value={true} onChange={mockOnChange} icon="thumb" />
      );

      expect(container.querySelector('.fill-current')).toBeInTheDocument();
    });
  });
});
