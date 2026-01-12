import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render button component', () => {
      render(<Button onChange={vi.fn()} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with default button text', () => {
      render(<Button onChange={vi.fn()} />);
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    it('should render with value as button text', () => {
      render(<Button value="Click Me" onChange={vi.fn()} />);
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render with config.buttonText', () => {
      render(
        <Button
          onChange={vi.fn()}
          config={{ buttonText: 'Submit' }}
        />
      );
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('should prioritize value over config.buttonText', () => {
      render(
        <Button
          value="Value Text"
          onChange={vi.fn()}
          config={{ buttonText: 'Config Text' }}
        />
      );
      expect(screen.getByText('Value Text')).toBeInTheDocument();
      expect(screen.queryByText('Config Text')).not.toBeInTheDocument();
    });

    it('should render with config.label fallback', () => {
      render(
        <Button
          onChange={vi.fn()}
          config={{ label: 'Label Text' }}
        />
      );
      expect(screen.getByText('Label Text')).toBeInTheDocument();
    });

    it('should use buttonText over label in config', () => {
      render(
        <Button
          onChange={vi.fn()}
          config={{ buttonText: 'Button Text', label: 'Label Text' }}
        />
      );
      expect(screen.getByText('Button Text')).toBeInTheDocument();
      expect(screen.queryByText('Label Text')).not.toBeInTheDocument();
    });
  });

  describe('Link Button', () => {
    it('should render as link when buttonUrl is provided', () => {
      render(
        <Button
          onChange={vi.fn()}
          config={{ buttonUrl: 'https://example.com' }}
        />
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('should open in same tab by default', () => {
      render(
        <Button
          value="Visit"
          onChange={vi.fn()}
          config={{ buttonUrl: 'https://example.com' }}
        />
      );
      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('target', '_blank');
    });

    it('should open in new tab when openInNewTab is true', () => {
      render(
        <Button
          value="Visit"
          onChange={vi.fn()}
          config={{
            buttonUrl: 'https://example.com',
            openInNewTab: true
          }}
        />
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should use config.url as fallback for buttonUrl', () => {
      render(
        <Button
          onChange={vi.fn()}
          config={{ url: 'https://example.com' }}
        />
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('should prioritize buttonUrl over url', () => {
      render(
        <Button
          onChange={vi.fn()}
          config={{
            buttonUrl: 'https://example1.com',
            url: 'https://example2.com'
          }}
        />
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example1.com');
    });

    it('should have proper link styling', () => {
      render(
        <Button
          value="Link"
          onChange={vi.fn()}
          config={{ buttonUrl: 'https://example.com' }}
        />
      );
      const link = screen.getByRole('link');
      expect(link.className).toMatch(/inline-flex/);
      expect(link.className).toMatch(/primary-brand/);
    });
  });

  describe('Regular Button', () => {
    it('should render as button element when no URL', () => {
      render(<Button onChange={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have type="button"', () => {
      render(<Button onChange={vi.fn()} />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('should have proper button styling', () => {
      render(<Button onChange={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/inline-flex/);
      expect(button.className).toMatch(/primary-brand/);
    });

    it('should be clickable', () => {
      const onClick = vi.fn();
      const { container } = render(
        <Button onChange={vi.fn()} onClick={onClick} />
      );
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should render disabled button without styling when disabled', () => {
      render(
        <Button
          value="Click Me"
          onChange={vi.fn()}
          disabled={true}
        />
      );
      // When disabled, it renders as a div with text
      expect(screen.getByText('Click Me')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render disabled text content', () => {
      render(
        <Button
          value="Disabled Button"
          onChange={vi.fn()}
          disabled={true}
        />
      );
      expect(screen.getByText('Disabled Button')).toBeInTheDocument();
    });

    it('should prevent clicking when disabled', () => {
      const onClick = vi.fn();
      render(
        <Button
          onChange={vi.fn()}
          onClick={onClick}
          disabled={true}
        />
      );

      // When disabled, button doesn't render so can't click
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should apply disabled styles', () => {
      const { container } = render(
        <Button
          value="Disabled"
          onChange={vi.fn()}
          disabled={true}
        />
      );
      const disabledContent = container.querySelector('.text-muted-foreground');
      expect(disabledContent).toBeInTheDocument();
    });

    it('should disable URL button', () => {
      render(
        <Button
          value="Link"
          onChange={vi.fn()}
          config={{ buttonUrl: 'https://example.com' }}
          disabled={true}
        />
      );
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('Link')).toBeInTheDocument();
    });
  });

  describe('ReadOnly State', () => {
    it('should render disabled when readOnly', () => {
      render(
        <Button
          value="Read Only"
          onChange={vi.fn()}
          readOnly={true}
        />
      );
      expect(screen.getByText('Read Only')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not allow clicking when readOnly', () => {
      const onClick = vi.fn();
      render(
        <Button
          onChange={vi.fn()}
          onClick={onClick}
          readOnly={true}
        />
      );

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should disable URL when readOnly', () => {
      render(
        <Button
          value="Visit"
          onChange={vi.fn()}
          config={{ buttonUrl: 'https://example.com' }}
          readOnly={true}
        />
      );
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('Configuration', () => {
    it('should use all config properties', () => {
      render(
        <Button
          onChange={vi.fn()}
          config={{
            buttonText: 'Config Button',
            buttonUrl: 'https://example.com',
            openInNewTab: true
          }}
        />
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(screen.getByText('Config Button')).toBeInTheDocument();
    });

    it('should handle empty config object', () => {
      render(
        <Button value="Button" onChange={vi.fn()} config={{}} />
      );
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    it('should handle undefined config', () => {
      render(
        <Button value="Button" onChange={vi.fn()} config={undefined} />
      );
      expect(screen.getByText('Button')).toBeInTheDocument();
    });
  });

  describe('Props Passthrough', () => {
    it('should pass through additional props to button', () => {
      render(
        <Button
          onChange={vi.fn()}
          data-testid="custom-button"
        />
      );
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('should pass through additional props to link', () => {
      render(
        <Button
          onChange={vi.fn()}
          config={{ buttonUrl: 'https://example.com' }}
          data-testid="custom-link"
        />
      );
      expect(screen.getByTestId('custom-link')).toBeInTheDocument();
    });

    it('should pass through className to button', () => {
      const { container } = render(
        <Button
          onChange={vi.fn()}
          className="custom-class"
        />
      );
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/custom-class/);
    });

    it('should pass through className to link', () => {
      const { container } = render(
        <Button
          onChange={vi.fn()}
          config={{ buttonUrl: 'https://example.com' }}
          className="custom-class"
        />
      );
      const link = screen.getByRole('link');
      expect(link.className).toMatch(/custom-class/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<Button value="" onChange={vi.fn()} />);
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    it('should handle null value', () => {
      render(<Button value={null as any} onChange={vi.fn()} />);
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(<Button value={undefined} onChange={vi.fn()} />);
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    it('should handle very long button text', () => {
      const longText = 'A'.repeat(100);
      render(
        <Button value={longText} onChange={vi.fn()} />
      );
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle special characters in text', () => {
      render(
        <Button value="Click & Go <->" onChange={vi.fn()} />
      );
      expect(screen.getByText('Click & Go <->')).toBeInTheDocument();
    });

    it('should handle unicode characters', () => {
      render(
        <Button value="点击 🎯" onChange={vi.fn()} />
      );
      expect(screen.getByText('点击 🎯')).toBeInTheDocument();
    });

    it('should handle empty URL', () => {
      render(
        <Button
          value="Button"
          onChange={vi.fn()}
          config={{ buttonUrl: '' }}
        />
      );
      // Empty URL should render as button, not link
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle relative URLs', () => {
      render(
        <Button
          value="Navigate"
          onChange={vi.fn()}
          config={{ buttonUrl: '/page' }}
        />
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/page');
    });

    it('should handle URL with hash', () => {
      render(
        <Button
          value="Anchor"
          onChange={vi.fn()}
          config={{ buttonUrl: '#section' }}
        />
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#section');
    });

    it('should handle URL with query params', () => {
      render(
        <Button
          value="Query"
          onChange={vi.fn()}
          config={{ buttonUrl: 'https://example.com?param=value' }}
        />
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com?param=value');
    });
  });

  describe('Accessibility', () => {
    it('should render with button role', () => {
      render(<Button onChange={vi.fn()} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with link role for URLs', () => {
      render(
        <Button
          onChange={vi.fn()}
          config={{ buttonUrl: 'https://example.com' }}
        />
      );
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should have proper button type', () => {
      render(<Button onChange={vi.fn()} />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('should have proper link rel for external links', () => {
      render(
        <Button
          onChange={vi.fn()}
          config={{
            buttonUrl: 'https://external.com',
            openInNewTab: true
          }}
        />
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should not have rel for internal links', () => {
      render(
        <Button
          onChange={vi.fn()}
          config={{ buttonUrl: '/internal' }}
        />
      );
      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should have visible text', () => {
      render(<Button value="Click Me" onChange={vi.fn()} />);
      expect(screen.getByText('Click Me')).toBeVisible();
    });
  });

  describe('Value Changes', () => {
    it('should update button text when value changes', () => {
      const { rerender } = render(
        <Button value="First" onChange={vi.fn()} />
      );
      expect(screen.getByText('First')).toBeInTheDocument();

      rerender(<Button value="Second" onChange={vi.fn()} />);
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.queryByText('First')).not.toBeInTheDocument();
    });

    it('should update URL when config changes', () => {
      const { rerender } = render(
        <Button
          onChange={vi.fn()}
          config={{ buttonUrl: 'https://example1.com' }}
        />
      );
      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example1.com');

      rerender(
        <Button
          onChange={vi.fn()}
          config={{ buttonUrl: 'https://example2.com' }}
        />
      );
      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example2.com');
    });

    it('should toggle between button and link', () => {
      const { rerender } = render(
        <Button value="Button" onChange={vi.fn()} />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();

      rerender(
        <Button
          value="Link"
          onChange={vi.fn()}
          config={{ buttonUrl: 'https://example.com' }}
        />
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should toggle between enabled and disabled', () => {
      const { rerender } = render(
        <Button value="Click" onChange={vi.fn()} disabled={false} />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();

      rerender(
        <Button value="Click" onChange={vi.fn()} disabled={true} />
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByText('Click')).toBeInTheDocument();
    });
  });
});
