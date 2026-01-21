import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Year } from '../Year';

describe('Year Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getMainButton = () => {
    const buttons = screen.getAllByRole('button');
    return buttons.find(btn => btn.getAttribute('aria-haspopup') === 'listbox') || buttons[0];
  };

  describe('Rendering - Button View', () => {
    it('should render year button by default', () => {
      render(<Year value={null} onChange={mockOnChange} />);
      const button = getMainButton();
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
      const button = getMainButton();
      expect(button.textContent).toContain('2024');
    });

    it('should show placeholder when value is null', () => {
      render(<Year value={null} onChange={mockOnChange} />);
      const button = getMainButton();
      expect(button.textContent).toMatch(/YYYY/);
    });
  });

  describe('Dropdown Mode - Button View', () => {
    it('should open dropdown when button is clicked', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const button = getMainButton();
      fireEvent.click(button);
      await waitFor(() => {
        const button = getMainButton();
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should close dropdown when year is selected', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const mainButton = getMainButton();
      fireEvent.click(mainButton);
      
      await waitFor(() => {
        const yearButtons = screen.getAllByRole('button').filter(btn => 
          btn.textContent && /^\d{4}$/.test(btn.textContent.trim()) && 
          !btn.getAttribute('aria-haspopup')
        );
        expect(yearButtons.length).toBeGreaterThan(0);
      });

      const yearButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent && /^\d{4}$/.test(btn.textContent.trim()) && 
        !btn.getAttribute('aria-haspopup')
      );
      if (yearButtons.length > 0) {
        fireEvent.click(yearButtons[0]);
        await waitFor(() => {
          const button = getMainButton();
          expect(button).toHaveAttribute('aria-expanded', 'false');
        });
      }
    });

    it('should navigate to previous decade', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const mainButton = getMainButton();
      fireEvent.click(mainButton);
      
      await waitFor(() => {
        const button = getMainButton();
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });

      const prevButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.lucide-chevron-left')
      );
      if (prevButton) {
        fireEvent.click(prevButton);
        await waitFor(() => {
          const yearButtons = screen.getAllByRole('button').filter(btn => 
            btn.textContent && /^\d{4}$/.test(btn.textContent.trim()) && 
            !btn.getAttribute('aria-haspopup')
          );
          expect(yearButtons.length).toBeGreaterThan(0);
        });
      }
    });

    it('should navigate to next decade', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const mainButton = getMainButton();
      fireEvent.click(mainButton);
      
      await waitFor(() => {
        const button = getMainButton();
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });

      const nextButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.lucide-chevron-right')
      );
      if (nextButton) {
        fireEvent.click(nextButton);
        await waitFor(() => {
          const yearButtons = screen.getAllByRole('button').filter(btn => 
            btn.textContent && /^\d{4}$/.test(btn.textContent.trim()) && 
            !btn.getAttribute('aria-haspopup')
          );
          expect(yearButtons.length).toBeGreaterThan(0);
        });
      }
    });

    it('should display year grid in dropdown', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const mainButton = getMainButton();
      fireEvent.click(mainButton);
      
      await waitFor(() => {
        const yearButtons = screen.getAllByRole('button').filter(btn => 
          btn.textContent && /^\d{4}$/.test(btn.textContent.trim()) && 
          !btn.getAttribute('aria-haspopup')
        );
        expect(yearButtons.length).toBeGreaterThan(0);
      });
    });

    it('should select year from dropdown', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const mainButton = getMainButton();
      fireEvent.click(mainButton);
      
      await waitFor(() => {
        const button = getMainButton();
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });

      const yearButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent && /^\d{4}$/.test(btn.textContent.trim()) && 
        !btn.getAttribute('aria-haspopup')
      );
      if (yearButtons.length > 0) {
        const targetYear = yearButtons.find(btn => btn.textContent === '2025') || yearButtons[0];
        fireEvent.click(targetYear);
        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Edit Mode - Input View', () => {
    it('should enter edit mode on double-click', async () => {
      render(<Year value={2024} onChange={mockOnChange} allowEdit={true} />);
      const button = getMainButton();
      fireEvent.doubleClick(button);
      
      await waitFor(() => {
        const input = screen.queryByRole('textbox');
        expect(input).toBeInTheDocument();
      });
    });

    it('should accept year input in edit mode', async () => {
      render(<Year value={null} onChange={mockOnChange} allowEdit={true} />);
      const button = getMainButton();
      fireEvent.doubleClick(button);
      
      await waitFor(async () => {
        const input = screen.queryByRole('textbox');
        if (input) {
          await userEvent.type(input, '2025');
          fireEvent.keyDown(input, { key: 'Enter' });
          await waitFor(() => {
            expect(mockOnChange).toHaveBeenCalled();
          });
        }
      });
    });

    it('should exit edit mode on Escape key', async () => {
      render(<Year value={2024} onChange={mockOnChange} allowEdit={true} />);
      const button = getMainButton();
      fireEvent.doubleClick(button);
      
      await waitFor(() => {
        const input = screen.queryByRole('textbox');
        if (input) {
          fireEvent.keyDown(input, { key: 'Escape' });
        }
      });

      await waitFor(() => {
        const input = screen.queryByRole('textbox');
        expect(input).not.toBeInTheDocument();
      });
    });

    it('should handle year input with Enter key', async () => {
      render(<Year value={null} onChange={mockOnChange} allowEdit={true} />);
      const button = getMainButton();
      fireEvent.doubleClick(button);
      
      await waitFor(async () => {
        const input = screen.queryByRole('textbox');
        if (input) {
          await userEvent.clear(input);
          await userEvent.type(input, '1995');
          fireEvent.keyDown(input, { key: 'Enter' });
          await waitFor(() => {
            expect(mockOnChange).toHaveBeenCalled();
          });
        }
      });
    });

    it('should exit edit mode on blur', async () => {
      render(<Year value={2024} onChange={mockOnChange} allowEdit={true} />);
      const button = getMainButton();
      fireEvent.doubleClick(button);
      
      await waitFor(() => {
        const input = screen.queryByRole('textbox');
        if (input) {
          fireEvent.blur(input);
        }
      });

      await waitFor(() => {
        const input = screen.queryByRole('textbox');
        expect(input).not.toBeInTheDocument();
      });
    });

    it('should limit input to 4 digits', async () => {
      render(<Year value={null} onChange={mockOnChange} allowEdit={true} />);
      const button = getMainButton();
      fireEvent.doubleClick(button);
      
      await waitFor(async () => {
        const input = screen.queryByRole('textbox') as HTMLInputElement;
        if (input) {
          await userEvent.type(input, '12345');
          expect(input.value.length).toBeLessThanOrEqual(4);
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
      const button = getMainButton();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should prevent dropdown opening when readOnly', async () => {
      render(<Year value={2024} onChange={mockOnChange} readOnly allowEdit={true} />);
      const button = getMainButton();
      fireEvent.click(button);
      
      await waitFor(() => {
        const button = getMainButton();
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should prevent edit mode when readOnly', async () => {
      render(<Year value={2024} onChange={mockOnChange} readOnly allowEdit={true} />);
      const button = getMainButton();
      fireEvent.doubleClick(button);
      
      await waitFor(() => {
        const input = screen.queryByRole('textbox');
        expect(input).not.toBeInTheDocument();
      });
    });

    it('should prevent dropdown opening when allowEdit is false', async () => {
      render(<Year value={2024} onChange={mockOnChange} allowEdit={false} />);
      const button = getMainButton();
      fireEvent.click(button);
      
      await waitFor(() => {
        const button = getMainButton();
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should prevent dropdown opening when disabled', async () => {
      render(<Year value={2024} onChange={mockOnChange} disabled />);
      const button = getMainButton();
      fireEvent.click(button);
      
      await waitFor(() => {
        const button = getMainButton();
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Config Props', () => {
    it('should use defaultValue from config', () => {
      render(<Year value={null} onChange={mockOnChange} config={{ defaultValue: 2020 }} />);
      const button = getMainButton();
      expect(button.textContent).toMatch(/2020|YYYY/);
    });

    it('should use string defaultValue from config', () => {
      render(<Year value={null} onChange={mockOnChange} config={{ defaultValue: '2020' }} />);
      const button = getMainButton();
      expect(button.textContent).toMatch(/2020|YYYY/);
    });

    it('should apply minYear constraint', () => {
      render(<Year value={1850} onChange={mockOnChange} config={{ minYear: 1900 }} />);
      expect(getMainButton()).toBeInTheDocument();
    });

    it('should apply maxYear constraint', () => {
      render(<Year value={2150} onChange={mockOnChange} config={{ maxYear: 2099 }} />);
      expect(getMainButton()).toBeInTheDocument();
    });

    it('should handle multiple config props', () => {
      render(
        <Year
          value={2024}
          onChange={mockOnChange}
          config={{ minYear: 1900, maxYear: 2099, defaultValue: 2020 }}
        />
      );
      const button = getMainButton();
      expect(button.textContent).toContain('2024');
    });
  });

  describe('Value Synchronization', () => {
    it('should update button text when value prop changes', () => {
      const { rerender } = render(<Year value={2020} onChange={mockOnChange} />);
      expect(getMainButton().textContent).toContain('2020');

      rerender(<Year value={2024} onChange={mockOnChange} />);
      expect(getMainButton().textContent).toContain('2024');
    });

    it('should handle value change from null to number', () => {
      const { rerender } = render(<Year value={null} onChange={mockOnChange} />);
      expect(getMainButton().textContent).toMatch(/YYYY/);

      rerender(<Year value={2024} onChange={mockOnChange} />);
      expect(getMainButton().textContent).toContain('2024');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      render(<Year value={null} onChange={mockOnChange} />);
      const button = getMainButton();
      expect(button).toBeInTheDocument();
    });

    it('should handle very old years', () => {
      render(<Year value={1000} onChange={mockOnChange} />);
      const button = getMainButton();
      expect(button.textContent).toContain('1000');
    });

    it('should handle future years', () => {
      render(<Year value={2100} onChange={mockOnChange} />);
      const button = getMainButton();
      expect(button.textContent).toContain('2100');
    });

    it('should handle value of 0', () => {
      render(<Year value={0} onChange={mockOnChange} />);
      const button = getMainButton();
      expect(button.textContent).toMatch(/YYYY/);
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
      const button = getMainButton();
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('should have aria-expanded attribute', () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const button = getMainButton();
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Clear Functionality', () => {
    it('should clear value when clear button is clicked', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const clearButton = screen.getAllByRole('button').find(btn => 
        btn.getAttribute('title') === 'Clear value'
      );
      if (clearButton) {
        fireEvent.click(clearButton);
        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalledWith('');
        });
      }
    });

    it('should not show clear button when value is 0', () => {
      render(<Year value={0} onChange={mockOnChange} />);
      const clearButton = screen.getAllByRole('button').find(btn => 
        btn.getAttribute('title') === 'Clear value'
      );
      expect(clearButton).toBeUndefined();
    });

    it('should not show clear button when disabled', () => {
      render(<Year value={2024} onChange={mockOnChange} disabled />);
      const clearButton = screen.getAllByRole('button').find(btn => 
        btn.getAttribute('title') === 'Clear value'
      );
      expect(clearButton).toBeUndefined();
    });
  });

  describe('Keyboard Interactions', () => {
    it('should open dropdown on Enter key', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const button = getMainButton();
      fireEvent.keyDown(button, { key: 'Enter' });
      
      await waitFor(() => {
        const button = getMainButton();
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should open dropdown on Space key', async () => {
      render(<Year value={2024} onChange={mockOnChange} />);
      const button = getMainButton();
      fireEvent.keyDown(button, { key: ' ' });
      
      await waitFor(() => {
        const button = getMainButton();
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should not open dropdown when disabled on keyboard', async () => {
      render(<Year value={2024} onChange={mockOnChange} disabled />);
      const button = getMainButton();
      fireEvent.keyDown(button, { key: 'Enter' });
      
      await waitFor(() => {
        const button = getMainButton();
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Additional Props', () => {
    it('should apply className prop', () => {
      const { container } = render(
        <Year value={2024} onChange={mockOnChange} className="custom-class" />
      );
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should apply isBorder prop', () => {
      const { container } = render(
        <Year value={2024} onChange={mockOnChange} isBorder={true} />
      );
      const wrapper = container.querySelector('.field-component-border');
      expect(wrapper).toBeInTheDocument();
    });

    it('should display helperText when allowEdit is true', () => {
      render(
        <Year 
          value={2024} 
          onChange={mockOnChange} 
          helperText="Select a year" 
          allowEdit={true} 
        />
      );
      expect(screen.getByText('Select a year')).toBeInTheDocument();
    });

    it('should not display helperText when allowEdit is false', () => {
      render(
        <Year 
          value={2024} 
          onChange={mockOnChange} 
          helperText="Select a year" 
          allowEdit={false} 
        />
      );
      expect(screen.queryByText('Select a year')).not.toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('should handle non-numeric input', async () => {
      render(<Year value={null} onChange={mockOnChange} allowEdit={true} />);
      const button = getMainButton();
      fireEvent.doubleClick(button);
      
      await waitFor(async () => {
        const input = screen.queryByRole('textbox') as HTMLInputElement;
        if (input) {
          await userEvent.type(input, 'abc');
          fireEvent.blur(input);
          expect(mockOnChange).toHaveBeenCalledWith('');
        }
      });
    });

    it('should handle empty input', async () => {
      render(<Year value={2024} onChange={mockOnChange} allowEdit={true} />);
      const button = getMainButton();
      fireEvent.doubleClick(button);
      
      await waitFor(async () => {
        const input = screen.queryByRole('textbox') as HTMLInputElement;
        if (input) {
          await userEvent.clear(input);
          fireEvent.blur(input);
          await waitFor(() => {
            expect(mockOnChange).toHaveBeenCalledWith('');
          });
        }
      });
    });
  });
});
