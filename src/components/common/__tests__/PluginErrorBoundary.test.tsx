import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PluginErrorBoundary } from '../PluginErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error from component');
  }
  return <div>Child component rendered successfully</div>;
};

// Suppress console.error for error boundary tests
const originalConsoleError = console.error;

describe('PluginErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('Normal Rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <PluginErrorBoundary pluginId="test-plugin">
          <div>Plugin content</div>
        </PluginErrorBoundary>
      );
      
      expect(screen.getByText('Plugin content')).toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      render(
        <PluginErrorBoundary pluginId="test-plugin">
          <div>First child</div>
          <div>Second child</div>
        </PluginErrorBoundary>
      );
      
      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });

    it('renders nested components correctly', () => {
      render(
        <PluginErrorBoundary pluginId="nested-plugin">
          <ThrowError shouldThrow={false} />
        </PluginErrorBoundary>
      );
      
      expect(screen.getByText('Child component rendered successfully')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays fallback UI when child throws an error', () => {
      render(
        <PluginErrorBoundary pluginId="error-plugin">
          <ThrowError shouldThrow={true} />
        </PluginErrorBoundary>
      );
      
      expect(screen.getByText('Plugin Error')).toBeInTheDocument();
    });

    it('displays the plugin ID in the error message', () => {
      const pluginId = 'my-custom-plugin';
      
      render(
        <PluginErrorBoundary pluginId={pluginId}>
          <ThrowError shouldThrow={true} />
        </PluginErrorBoundary>
      );
      
      expect(screen.getByText(`The plugin "${pluginId}" encountered an error and could not be rendered.`)).toBeInTheDocument();
    });

    it('includes technical details section', () => {
      render(
        <PluginErrorBoundary pluginId="tech-details-plugin">
          <ThrowError shouldThrow={true} />
        </PluginErrorBoundary>
      );
      
      expect(screen.getByText('Technical Details')).toBeInTheDocument();
      expect(screen.getByText('Check the browser console for more information.')).toBeInTheDocument();
    });

    it('logs error to console with plugin ID', () => {
      const pluginId = 'console-log-plugin';
      
      render(
        <PluginErrorBoundary pluginId={pluginId}>
          <ThrowError shouldThrow={true} />
        </PluginErrorBoundary>
      );
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('onPluginError Callback', () => {
    it('calls onPluginError when an error occurs', () => {
      const onPluginError = vi.fn();
      const pluginId = 'callback-plugin';
      
      render(
        <PluginErrorBoundary pluginId={pluginId} onPluginError={onPluginError}>
          <ThrowError shouldThrow={true} />
        </PluginErrorBoundary>
      );
      
      expect(onPluginError).toHaveBeenCalledTimes(1);
      expect(onPluginError).toHaveBeenCalledWith(
        pluginId,
        expect.any(Error)
      );
    });

    it('passes the correct error object to onPluginError', () => {
      const onPluginError = vi.fn();
      
      render(
        <PluginErrorBoundary pluginId="error-object-plugin" onPluginError={onPluginError}>
          <ThrowError shouldThrow={true} />
        </PluginErrorBoundary>
      );
      
      const [, passedError] = onPluginError.mock.calls[0];
      expect(passedError).toBeInstanceOf(Error);
      expect(passedError.message).toBe('Test error from component');
    });

    it('does not call onPluginError when no error occurs', () => {
      const onPluginError = vi.fn();
      
      render(
        <PluginErrorBoundary pluginId="no-error-plugin" onPluginError={onPluginError}>
          <ThrowError shouldThrow={false} />
        </PluginErrorBoundary>
      );
      
      expect(onPluginError).not.toHaveBeenCalled();
    });

    it('works correctly when onPluginError is not provided', () => {
      // Should not throw when onPluginError is undefined
      expect(() => {
        render(
          <PluginErrorBoundary pluginId="no-callback-plugin">
            <ThrowError shouldThrow={true} />
          </PluginErrorBoundary>
        );
      }).not.toThrow();
      
      expect(screen.getByText('Plugin Error')).toBeInTheDocument();
    });
  });

  describe('Fallback UI Structure', () => {
    it('renders with plugin-error class', () => {
      const { container } = render(
        <PluginErrorBoundary pluginId="ui-structure-plugin">
          <ThrowError shouldThrow={true} />
        </PluginErrorBoundary>
      );
      
      expect(container.querySelector('.plugin-error')).toBeInTheDocument();
    });

    it('has expandable details section', () => {
      render(
        <PluginErrorBoundary pluginId="details-plugin">
          <ThrowError shouldThrow={true} />
        </PluginErrorBoundary>
      );
      
      const details = screen.getByText('Technical Details').closest('details');
      expect(details).toBeInTheDocument();
    });
  });

  describe('Different Plugin IDs', () => {
    const testPluginIds = [
      'simple-plugin',
      'plugin-with-dashes',
      'plugin_with_underscores',
      'PluginWithCamelCase',
      'plugin.with.dots',
      'plugin/with/slashes',
      '123-numeric-plugin',
      '@scoped/plugin',
    ];

    testPluginIds.forEach((pluginId) => {
      it(`handles plugin ID: ${pluginId}`, () => {
        render(
          <PluginErrorBoundary pluginId={pluginId}>
            <ThrowError shouldThrow={true} />
          </PluginErrorBoundary>
        );
        
        expect(screen.getByText(`The plugin "${pluginId}" encountered an error and could not be rendered.`)).toBeInTheDocument();
      });
    });
  });
});

