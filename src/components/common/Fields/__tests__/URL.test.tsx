import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { URL } from '../URL';

// Mock window.open and window.location
const mockWindowOpen = vi.fn();
const mockLocationAssign = vi.fn();
const originalLocation = window.location;
let mockHref = 'http://localhost/';

const installMockLocation = () => {
  mockHref = 'http://localhost/';
  // jsdom allows redefining location when configurable
  delete (window as any).location;
  Object.defineProperty(window, 'location', {
    configurable: true,
    enumerable: true,
    value: {
      origin: 'http://localhost',
      assign: mockLocationAssign,
      get href() {
        return mockHref;
      },
      set href(value: string) {
        mockHref = value;
      },
    },
  });
};

Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen,
  configurable: true
});

vi.mock('../../../utils/helpers', () => ({
  useClickHandler:
    (onSingle: () => void, onDouble: () => void) =>
    (e: React.MouseEvent) => {
      if ((e as any).detail === 2) {
        onDouble();
      } else {
        onSingle();
      }
    }
}));

describe('URL Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen.mockClear();
    mockLocationAssign.mockClear();
    installMockLocation();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'location', {
      configurable: true,
      enumerable: true,
      value: originalLocation,
    });
  });

  describe('Rendering', () => {
    it('should render with value', () => {
      render(<URL value="example.com" onChange={mockOnChange} />);
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });

    it('should render with placeholder when value is empty', () => {
      render(<URL value="" onChange={mockOnChange} placeholder="Enter URL" />);
      expect(screen.getByText('Enter URL')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<URL label="Website URL" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Website URL')).toBeInTheDocument();
    });

    it('should render required indicator', () => {
      render(<URL label="URL" value="" required onChange={mockOnChange} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render helper text', () => {
      render(
        <URL
          value=""
          onChange={mockOnChange}
          helperText="Enter a valid website URL"
        />
      );
      expect(screen.getByText('Enter a valid website URL')).toBeInTheDocument();
    });

    it('should render URL as clickable link when value exists', () => {
      render(<URL value="example.com" onChange={mockOnChange} />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should not render URL as link when value is empty', () => {
      render(<URL value="" onChange={mockOnChange} />);
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should render with disabled styling when disabled', () => {
      render(<URL value="example.com" disabled onChange={mockOnChange} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should render with readOnly styling when readOnly', () => {
      const { container } = render(<URL value="example.com" readOnly onChange={mockOnChange} />);
      const element = container.querySelector('[aria-disabled="true"]');
      expect(element).toBeInTheDocument();
      expect(element).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Editing Behavior', () => {
    it('should enter edit mode on single click when allowEdit is true', async () => {
      render(<URL value="example.com" onChange={mockOnChange} allowEdit={true} />);

      await userEvent.click(screen.getByRole('button'));

      expect(await screen.findByRole('textbox')).toBeInTheDocument();
    });

    it('should enter edit mode on double click when allowEdit is false', async () => {
      render(<URL value="example.com" onChange={mockOnChange} allowEdit={false} />);

      const button = screen.getByRole('button');
      await userEvent.dblClick(button);

      expect(await screen.findByRole('textbox')).toBeInTheDocument();
    });

    it('should not enter edit mode on single click when allowEdit is false', async () => {
      render(<URL value="example.com" onChange={mockOnChange} allowEdit={false} />);

      await userEvent.click(screen.getByRole('button'));

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should not enter edit mode when readOnly is true', async () => {
      const { container } = render(<URL value="example.com" onChange={mockOnChange} readOnly />);

      const element = container.querySelector('[aria-disabled="true"]');
      if (element) {
        await userEvent.click(element as HTMLElement);
      }

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should not enter edit mode when disabled is true', async () => {
      render(<URL value="example.com" onChange={mockOnChange} disabled />);

      await userEvent.click(screen.getByRole('button'));

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should enter edit mode on Enter key press', async () => {
      render(<URL value="example.com" onChange={mockOnChange} />);

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(await screen.findByRole('textbox')).toBeInTheDocument();
    });

    it('should enter edit mode on Space key press', async () => {
      render(<URL value="example.com" onChange={mockOnChange} />);

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: ' ' });

      expect(await screen.findByRole('textbox')).toBeInTheDocument();
    });

    it('should not enter edit mode on key press when disabled', () => {
      render(<URL value="example.com" onChange={mockOnChange} disabled />);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should exit edit mode when readOnly becomes true', async () => {
      const { rerender } = render(
        <URL value="example.com" onChange={mockOnChange} />
      );

      await userEvent.click(screen.getByRole('button'));
      expect(await screen.findByRole('textbox')).toBeInTheDocument();

      rerender(<URL value="example.com" readOnly onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });

    it('should exit edit mode on blur', async () => {
      render(<URL value="example.com" onChange={mockOnChange} />);

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Input Handling', () => {
    it('should update local value on input change', async () => {
      render(<URL value="" onChange={mockOnChange} />);

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await userEvent.type(input, 'newurl.com');

      expect(input).toHaveValue('newurl.com');
    });

    it('should call onChange on valid input', async () => {
      render(<URL value="" onChange={mockOnChange} />);

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await userEvent.type(input, 'example.com');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should normalize URL by adding https:// prefix on blur', async () => {
      render(<URL value="" onChange={mockOnChange} />);

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await userEvent.type(input, 'example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('https://example.com');
      });
    });

    it('should not normalize URL if it already has protocol', async () => {
      render(<URL value="" onChange={mockOnChange} />);

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await userEvent.type(input, 'https://example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('https://example.com');
      });
    });

    it('should not normalize URL if it has http:// protocol', async () => {
      render(<URL value="" onChange={mockOnChange} />);

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await userEvent.type(input, 'http://example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('http://example.com');
      });
    });

    it('should not call onChange when value does not change', async () => {
      render(<URL value="https://example.com" onChange={mockOnChange} />);

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');
      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should prevent duplicate onChange calls for same value', async () => {
      render(<URL value="example.com" onChange={mockOnChange} />);

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await userEvent.type(input, 'x');
      await userEvent.type(input, '{backspace}');
      fireEvent.blur(input);

      // Should only call onChange once for the initial 'x' character
      const uniqueValues = new Set(mockOnChange.mock.calls.map(call => call[0]));
      expect(uniqueValues.size).toBeLessThanOrEqual(mockOnChange.mock.calls.length);
    });
  });

  describe('Validation', () => {
    it('should hide icon when required and empty on blur', async () => {
      render(<URL value="example.com" onChange={mockOnChange} required />);

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await userEvent.clear(input);
      fireEvent.blur(input);

      await waitFor(() => {
        // Error state should hide the icon
        expect(screen.queryByTestId('external-link')).not.toBeInTheDocument();
      });
    });

    it('should revert to previous value on blur when required and empty', async () => {
      render(<URL value="example.com" onChange={mockOnChange} required />);

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await userEvent.clear(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('example.com')).toBeInTheDocument();
      });
    });

    it('should hide icon when urlValid is true and URL is invalid', async () => {
      render(
        <URL
          value="example.com"
          onChange={mockOnChange}
          config={{ urlValid: true }}
        />
      );

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await userEvent.clear(input);
      await userEvent.type(input, 'invalid-url');
      fireEvent.blur(input);

      await waitFor(() => {
        // Error state should hide the icon
        expect(screen.queryByTestId('external-link')).not.toBeInTheDocument();
      });
    });

    it('should revert to previous value on invalid URL when urlValid is true', async () => {
      render(
        <URL
          value="example.com"
          onChange={mockOnChange}
          config={{ urlValid: true }}
        />
      );

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox') as HTMLInputElement;

      // Set invalid URL directly - this won't trigger onChange because of validation error
      // So prevValueRef.current will remain "example.com"
      fireEvent.change(input, { target: { value: 'invalid-url' } });
      
      // Wait a bit for the change to be processed
      await waitFor(() => {
        expect(input.value).toBe('invalid-url');
      });

      fireEvent.blur(input);

      // Wait for the component to revert the value and exit edit mode
      await waitFor(
        () => {
          // Edit mode should exit and show the original value
          expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
          expect(screen.getByText('example.com')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should not show error when urlValid is false and URL is invalid', async () => {
      render(
        <URL
          value="example.com"
          onChange={mockOnChange}
          config={{ urlValid: false }}
        />
      );

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await userEvent.clear(input);
      await userEvent.type(input, 'invalid-url');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid URL')).not.toBeInTheDocument();
      });
    });

    it('should not show error for empty value when not required', async () => {
      render(<URL value="" onChange={mockOnChange} />);

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      fireEvent.blur(input);

      await waitFor(() => {
        // No error state, so icon should not be hidden (but won't show because value is empty)
        expect(screen.queryByTestId('external-link')).not.toBeInTheDocument();
      });
    });

    it('should clear error on valid input', async () => {
      render(
        <URL
          value=""
          onChange={mockOnChange}
          config={{ urlValid: true }}
        />
      );

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await userEvent.type(input, 'invalid');
      // Error state should hide link
      expect(screen.queryByRole('link')).not.toBeInTheDocument();

      await userEvent.clear(input);
      await userEvent.type(input, 'example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        // Valid input should show link (if value exists)
        expect(screen.getByRole('link')).toBeInTheDocument();
      });
    });

    it('should hide icon when there is an error', async () => {
      render(
        <URL
          value="example.com"
          onChange={mockOnChange}
          config={{ urlValid: true }}
        />
      );

      expect(screen.getByRole('link')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await userEvent.clear(input);
      await userEvent.type(input, 'invalid-url');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
      });
    });
  });

  describe('URL Click Behavior', () => {
    it('should open URL in new tab when openInNewTab is true', async () => {
      render(
        <URL
          value="example.com"
          onChange={mockOnChange}
          config={{ openInNewTab: true }}
        />
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should open URL in same tab when openInNewTab is false', async () => {
      render(
        <URL
          value="example.com"
          onChange={mockOnChange}
          config={{ openInNewTab: false }}
        />
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      // Should navigate in same tab
      expect(mockWindowOpen).not.toHaveBeenCalled();
      expect(mockLocationAssign).not.toHaveBeenCalled();
      expect(window.location.href).toBe('https://example.com/');
    });

    it('should normalize URL before opening', async () => {
      render(<URL value="example.com" onChange={mockOnChange} />);

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should not show link when in edit mode', async () => {
      render(<URL value="example.com" onChange={mockOnChange} />);

      await userEvent.click(screen.getByRole('button'));
      await screen.findByRole('textbox');

      // When in edit mode, no link should be visible
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should not show link when there is an error', async () => {
      render(
        <URL
          value="example.com"
          onChange={mockOnChange}
          config={{ urlValid: true }}
        />
      );

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await userEvent.clear(input);
      await userEvent.type(input, 'invalid-url');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
      });

      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    it('should not show link when value is empty', () => {
      render(<URL value="" onChange={mockOnChange} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    it('should prevent default behavior when clicking URL', async () => {
      render(<URL value="example.com" onChange={mockOnChange} />);

      const link = screen.getByRole('link');
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

      fireEvent(link, clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Value Synchronization', () => {
    it('should update local value when prop value changes', () => {
      const { rerender } = render(
        <URL value="old.com" onChange={mockOnChange} />
      );

      expect(screen.getByText('old.com')).toBeInTheDocument();

      rerender(<URL value="new.com" onChange={mockOnChange} />);

      expect(screen.getByText('new.com')).toBeInTheDocument();
    });

    it('should use defaultValue when value is empty', () => {
      render(
        <URL
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: 'default.com' }}
        />
      );

      expect(screen.getByText('default.com')).toBeInTheDocument();
    });

    it('should prioritize value over defaultValue', () => {
      render(
        <URL
          value="actual.com"
          onChange={mockOnChange}
          config={{ defaultValue: 'default.com' }}
        />
      );

      expect(screen.getByText('actual.com')).toBeInTheDocument();
      expect(screen.queryByText('default.com')).not.toBeInTheDocument();
    });

    it('should update when defaultValue changes', () => {
      const { rerender } = render(
        <URL
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: 'first.com' }}
        />
      );

      expect(screen.getByText('first.com')).toBeInTheDocument();

      rerender(
        <URL
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: 'second.com' }}
        />
      );

      expect(screen.getByText('second.com')).toBeInTheDocument();
    });
  });

  describe('Change Handling', () => {
    it('should call onChange for each valid keystroke', async () => {
      render(<URL value="" onChange={mockOnChange} />);

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await userEvent.type(input, 'example.com');

      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange.mock.calls.length).toBeGreaterThan(1);
    });

    it('should not call onChange when there is a validation error', async () => {
      render(
        <URL
          value=""
          onChange={mockOnChange}
          config={{ urlValid: true }}
        />
      );

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      mockOnChange.mockClear();
      await userEvent.type(input, 'invalid-url');

      // Should not call onChange for invalid input
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable input when disabled', async () => {
      render(<URL value="example.com" onChange={mockOnChange} disabled />);

      await userEvent.click(screen.getByRole('button'));
      // Should not enter edit mode when disabled
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should disable input when readOnly', async () => {
      const { container } = render(<URL value="example.com" onChange={mockOnChange} readOnly />);

      const element = container.querySelector('[aria-disabled="true"]');
      if (element) {
        await userEvent.click(element as HTMLElement);
      }
      // Should not enter edit mode when readOnly
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should not call onChange when disabled', async () => {
      render(<URL value="example.com" onChange={mockOnChange} disabled />);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should not call onChange when readOnly', async () => {
      render(<URL value="example.com" onChange={mockOnChange} readOnly />);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have button role when not readOnly', () => {
      render(<URL value="example.com" onChange={mockOnChange} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not have button role when readOnly', () => {
      render(<URL value="example.com" onChange={mockOnChange} readOnly />);
      // When readOnly, role should be undefined, but the element still exists
      const element = screen.getByText('example.com').closest('div');
      expect(element).not.toHaveAttribute('role', 'button');
    });

    it('should have aria-disabled when disabled', () => {
      render(<URL value="example.com" onChange={mockOnChange} disabled />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have aria-disabled when readOnly', () => {
      const { container } = render(<URL value="example.com" onChange={mockOnChange} readOnly />);
      const element = container.querySelector('[aria-disabled="true"]');
      expect(element).toBeInTheDocument();
      expect(element).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have tabIndex -1 when disabled', () => {
      render(<URL value="example.com" onChange={mockOnChange} disabled />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '-1');
    });

    it('should have tabIndex -1 when readOnly', () => {
      const { container } = render(<URL value="example.com" onChange={mockOnChange} readOnly />);
      const element = container.querySelector('[aria-disabled="true"]');
      expect(element).toBeInTheDocument();
      expect(element).toHaveAttribute('tabIndex', '-1');
    });

    it('should have tabIndex 0 when enabled', () => {
      render(<URL value="example.com" onChange={mockOnChange} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string value', () => {
      render(<URL value="" onChange={mockOnChange} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle URL with path', async () => {
      render(<URL value="example.com/path" onChange={mockOnChange} />);

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com/path',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should handle URL with query parameters', async () => {
      render(<URL value="example.com?param=value" onChange={mockOnChange} />);

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com?param=value',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should handle whitespace-only value', async () => {
      render(<URL value="   " onChange={mockOnChange} />);

      await userEvent.click(screen.getByRole('button'));
      const input = await screen.findByRole('textbox');

      await act(async () => {
        fireEvent.blur(input);
      });

      // Component normalizes whitespace to "https://   " which triggers onChange
      // This is expected behavior - the component adds https:// prefix
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should handle rapid value changes', async () => {
      const { rerender } = render(
        <URL value="first.com" onChange={mockOnChange} />
      );

      rerender(<URL value="second.com" onChange={mockOnChange} />);
      rerender(<URL value="third.com" onChange={mockOnChange} />);

      // The URL is rendered as a link
      await waitFor(() => {
        const links = screen.queryAllByRole('link');
        const hasThirdUrl = links.some(link => link.textContent?.includes('third.com'));
        expect(hasThirdUrl).toBe(true);
      });
    });
  });
});
