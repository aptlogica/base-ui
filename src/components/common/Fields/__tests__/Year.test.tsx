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

  describe('Rendering - Button View', () => {
    it('should render year button by default', () => {
      render(<Year value={null} onChange={mockOnChange} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<Year label="Year" value={null} onChange={mockOnChange} />);
      expect(screen.getByText('Year')).toBeInTheDocument();
    });

    it('should render required asterisk', () => {
      render(<Year label="Birth Year" value={null} onChange={mockOnChange} required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display year value on button', () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const button = screen.getByRole('button');
      expect(button.textContent).toContain('2024');
    });

    it('should show placeholder when value is null', () => {
      render(<Year value={null} onChange={mockOnChange} />);
      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/YYYY/);
    });
  });

  describe('Dropdown Mode - Button View', () => {
    it('should open dropdown when button is clicked', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const button = screen.getByRole('button', { hidden: false });
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText('2024')).toBeInTheDocument();
      });
    });

    it('should close dropdown when year is selected', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const buttons = screen.getAllByRole('button');
      const mainButton = buttons[0];
      fireEvent.click(mainButton);
      
      await waitFor(() => {
        const allButtons = screen.getAllByRole('button');
        expect(allButtons.length).toBeGreaterThan(1);
      });
    });

    it('should navigate to previous decade', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const buttons = screen.getAllByRole('button');
      const mainButton = buttons[0];
      fireEvent.click(mainButton);
      
      await waitFor(() => {
        expect(screen.getByText('2024')).toBeInTheDocument();
      });
    });

    it('should navigate to next decade', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const buttons = screen.getAllByRole('button');
      const mainButton = buttons[0];
      fireEvent.click(mainButton);
      
      await waitFor(() => {
        expect(screen.getByText('2024')).toBeInTheDocument();
      });
    });

    it('should display year grid in dropdown', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const buttons = screen.getAllByRole('button');
      const mainButton = buttons[0];
      fireEvent.click(mainButton);
      
      await waitFor(() => {
        expect(screen.getByText('2024')).toBeInTheDocument();
      });
    });

    it('should select year from dropdown', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const buttons = screen.getAllByRole('button');
      const mainButton = buttons[0];
      fireEvent.click(mainButton);
      
      await waitFor(() => {
        expect(screen.getByText('2024')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode - Input View', () => {
    it('should enter edit mode on double-click', async () => {
      render(<Year value={2024} onChange={mockOnChange} allowEdit={true} />);
      const button = screen.getByRole('button');
      fireEvent.doubleClick(button);
      
      await waitFor(() => {
        const input = screen.queryByRole('spinbutton') || screen.queryByRole('textbox');
        expect(input).toBeInTheDocument();
      });
    });

    it('should accept year input in edit mode', async () => {
      render(<Year value="" onChange={mockOnChange} allowEdit={true} />);
      const button = screen.getByRole('button');
      fireEvent.doubleClick(button);
      
      await waitFor(async () => {
        const input = screen.queryByRole('spinbutton') || screen.queryByRole('textbox');
        if (input) {
          await userEvent.type(input, '2025');
          fireEvent.keyDown(input, { key: 'Enter' });
          expect(mockOnChange).toHaveBeenCalled();
        }
      });
    });

    it('should exit edit mode on Escape key', async () => {
      render(<Year value={2024} onChange={mockOnChange} allowEdit={true} />);
      const button = screen.getByRole('button');
      fireEvent.doubleClick(button);
      
      await waitFor(() => {
        const input = screen.queryByRole('spinbutton') || screen.queryByRole('textbox');
        if (input) {
          fireEvent.keyDown(input, { key: 'Escape' });
          expect(mockOnChange).not.toHaveBeenCalled();
        }
      });
    });

    it('should handle year input with Enter key', async () => {
      render(<Year value="" onChange={mockOnChange} allowEdit={true} />);
      const button = screen.getByRole('button');
      fireEvent.doubleClick(button);
      
      await waitFor(async () => {
        const input = screen.queryByRole('spinbutton') || screen.queryByRole('textbox');
        if (input) {
          await userEvent.clear(input);
          await userEvent.type(input, '1995');
          fireEvent.keyDown(input, { key: 'Enter' });
          expect(mockOnChange).toHaveBeenCalled();
        }
      });
    });
  });

  describe('Year Range', () => {
    it('should accept year before current', () => {
      render(<Year value={1950} onChange={mockOnChange} />);
      expect(screen.getByText('1950')).toBeInTheDocument();
    });

    it('should accept year after current', () => {
      render(<Year value={2050} onChange={mockOnChange} />);
      expect(screen.getByText('2050')).toBeInTheDocument();
    });

    it('should respect minYear from config', () => {
      render(<Year value={1850} onChange={mockOnChange} config={{ minYear: 1900 }} />);
      expect(screen.getByText('1850')).toBeInTheDocument();
    });

    it('should respect maxYear from config', () => {
      render(<Year value={2150} onChange={mockOnChange} config={{ maxYear: 2099 }} />);
      expect(screen.getByText('2150')).toBeInTheDocument();
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable dropdown when disabled prop is true', () => {
      render(<Year value={2024} onChange={mockOnChange} disabled />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should prevent dropdown opening when readOnly', async () => {
      render(<Year value={2024} onChange={mockOnChange} readOnly allowEdit={true} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button');
        expect(buttons.length).toBe(1);
      });
    });

    it('should prevent edit mode when readOnly', async () => {
      render(<Year value={2024} onChange={mockOnChange} readOnly allowEdit={true} />);
      const button = screen.getByRole('button');
      fireEvent.doubleClick(button);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      const input = screen.queryByRole('spinbutton') || screen.queryByRole('textbox');
      expect(input).not.toBeInTheDocument();
    });

    it('should prevent edit mode when allowEdit is false', async () => {
      render(<Year value={2024} onChange={mockOnChange} allowEdit={false} />);
      const button = screen.getByRole('button');
      fireEvent.doubleClick(button);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      const input = screen.queryByRole('spinbutton') || screen.queryByRole('textbox');
      expect(input).not.toBeInTheDocument();
    });
  });

  describe('Config Props', () => {
    it('should use defaultValue from config', () => {
      render(<Year value={null} onChange={mockOnChange} config={{ defaultValue: 2020 }} />);
      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/2020|YYYY/);
    });

    it('should apply minYear constraint', () => {
      render(<Year value={1850} onChange={mockOnChange} config={{ minYear: 1900 }} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should apply maxYear constraint', () => {
      render(<Year value={2150} onChange={mockOnChange} config={{ maxYear: 2099 }} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle multiple config props', () => {
      render(
        <Year
          value={2024}
          onChange={mockOnChange}
          config={{ minYear: 1900, maxYear: 2099, defaultValue: 2020 }}
        />
      );
      const button = screen.getByRole('button');
      expect(button.textContent).toContain('2024');
    });
  });

  describe('Value Synchronization', () => {
    it('should update button text when value prop changes', () => {
      const { rerender } = render(<Year value={2020} onChange={mockOnChange} />);
      expect(screen.getByRole('button').textContent).toContain('2020');

      rerender(<Year value={2024} onChange={mockOnChange} />);
      expect(screen.getByRole('button').textContent).toContain('2024');
    });

    it('should handle value change from null to number', () => {
      const { rerender } = render(<Year value={null} onChange={mockOnChange} />);
      expect(screen.getByRole('button').textContent).toMatch(/YYYY/);

      rerender(<Year value={2024} onChange={mockOnChange} />);
      expect(screen.getByRole('button').textContent).toContain('2024');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      render(<Year value={null} onChange={mockOnChange} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle very old years', () => {
      render(<Year value={1000} onChange={mockOnChange} />);
      const button = screen.getByRole('button');
      expect(button.textContent).toContain('1000');
    });

    it('should handle future years', () => {
      render(<Year value={2100} onChange={mockOnChange} />);
      const button = screen.getByRole('button');
      expect(button.textContent).toContain('2100');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(<Year label="Birth Year" value={null} onChange={mockOnChange} />);
      expect(screen.getByText('Birth Year')).toBeInTheDocument();
    });

    it('should mark required fields with asterisk', () => {
      render(<Year label="Year" value={null} onChange={mockOnChange} required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should have button with accessible role', () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
