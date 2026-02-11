import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExtensionPoint } from '../ExtensionPoint';
import * as PluginFrameworkContext from '../PluginFrameworkContext';

vi.mock('../PluginFrameworkContext', () => ({
  useExtensions: vi.fn(),
}));

vi.mock('../../components/ui/Loader', () => ({
  Loader: ({ size }: { size: number }) => (
    <div data-testid="loader" data-size={size}>
      Loading...
    </div>
  ),
}));

describe('ExtensionPoint', () => {
  const mockUseExtensions = vi.mocked(PluginFrameworkContext.useExtensions);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseExtensions.mockReturnValue([]);
  });

  describe('Rendering', () => {
    it('should render nothing when no extensions are registered', () => {
      mockUseExtensions.mockReturnValue([]);

      const { container } = render(<ExtensionPoint id="test:point" />);

      expect(container.innerHTML).toBe('');
    });

    it('should call useExtensions with the correct point id', () => {
      mockUseExtensions.mockReturnValue([]);

      render(<ExtensionPoint id="layout:header" />);

      expect(mockUseExtensions).toHaveBeenCalledWith('layout:header');
    });

    it('should render extensions in order', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'ext-1', order: 1, render: () => <div data-testid="ext-1">First</div> },
        { id: 'ext-2', order: 2, render: () => <div data-testid="ext-2">Second</div> },
      ]);

      render(<ExtensionPoint id="test:point" />);

      expect(screen.getByTestId('ext-1')).toBeInTheDocument();
      expect(screen.getByTestId('ext-2')).toBeInTheDocument();
    });

    it('should sort extensions by order property', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'ext-high', order: 200, render: () => <span data-testid="high">High</span> },
        { id: 'ext-low', order: 50, render: () => <span data-testid="low">Low</span> },
        { id: 'ext-mid', order: 100, render: () => <span data-testid="mid">Mid</span> },
      ]);

      const { container } = render(<ExtensionPoint id="test:point" />);

      const spans = container.querySelectorAll('span');
      expect(spans[0]).toHaveAttribute('data-testid', 'low');
      expect(spans[1]).toHaveAttribute('data-testid', 'mid');
      expect(spans[2]).toHaveAttribute('data-testid', 'high');
    });

    it('should use default order 100 when order is not specified', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'ext-1', order: 50, render: () => <span data-testid="first">First</span> },
        { id: 'ext-2', render: () => <span data-testid="default">Default</span> },
        { id: 'ext-3', order: 150, render: () => <span data-testid="last">Last</span> },
      ]);

      const { container } = render(<ExtensionPoint id="test:point" />);

      const spans = container.querySelectorAll('span');
      expect(spans[0]).toHaveAttribute('data-testid', 'first');
      expect(spans[1]).toHaveAttribute('data-testid', 'default');
      expect(spans[2]).toHaveAttribute('data-testid', 'last');
    });

    it('should skip extensions without render function', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'ext-1', order: 1, render: () => <div data-testid="ext-1">Valid</div> },
        { id: 'ext-2', order: 2, data: 'no-render' },
        { id: 'ext-3', order: 3, render: () => <div data-testid="ext-3">Valid</div> },
      ]);

      render(<ExtensionPoint id="test:point" />);

      expect(screen.getByTestId('ext-1')).toBeInTheDocument();
      expect(screen.getByTestId('ext-3')).toBeInTheDocument();
      expect(screen.queryByText('no-render')).not.toBeInTheDocument();
    });
  });

  describe('Replace Extension Behavior', () => {
    it('should render only replace extension when replace is true', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'ext-1', order: 1, render: () => <div data-testid="normal">Normal</div> },
        {
          id: 'ext-replace',
          order: 2,
          replace: true,
          render: () => <div data-testid="replacement">Replacement</div>,
        },
        { id: 'ext-3', order: 3, render: () => <div data-testid="other">Other</div> },
      ]);

      render(<ExtensionPoint id="test:point" />);

      expect(screen.getByTestId('replacement')).toBeInTheDocument();
      expect(screen.queryByTestId('normal')).not.toBeInTheDocument();
      expect(screen.queryByTestId('other')).not.toBeInTheDocument();
    });

    it('should render nothing when replace extension has no render function', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'ext-1', order: 1, render: () => <div data-testid="normal">Normal</div> },
        { id: 'ext-replace', order: 2, replace: true },
      ]);

      const { container } = render(<ExtensionPoint id="test:point" />);

      expect(container.innerHTML).toBe('');
    });

    it('should use first replace extension when multiple have replace true', () => {
      mockUseExtensions.mockReturnValue([
        {
          id: 'ext-replace-1',
          replace: true,
          render: () => <div data-testid="first-replace">First</div>,
        },
        {
          id: 'ext-replace-2',
          replace: true,
          render: () => <div data-testid="second-replace">Second</div>,
        },
      ]);

      render(<ExtensionPoint id="test:point" />);

      expect(screen.getByTestId('first-replace')).toBeInTheDocument();
      expect(screen.queryByTestId('second-replace')).not.toBeInTheDocument();
    });
  });

  describe('Hide Extension Behavior', () => {
    it('should render nothing when hide extension is present', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'ext-1', order: 1, render: () => <div data-testid="normal">Normal</div> },
        { id: 'ext-hide', order: 2, hide: true },
        { id: 'ext-3', order: 3, render: () => <div data-testid="other">Other</div> },
      ]);

      const { container } = render(<ExtensionPoint id="test:point" />);

      expect(container.innerHTML).toBe('');
    });

    it('should prioritize replace over hide', () => {
      mockUseExtensions.mockReturnValue([
        {
          id: 'ext-replace',
          replace: true,
          render: () => <div data-testid="replacement">Replacement</div>,
        },
        { id: 'ext-hide', hide: true },
      ]);

      render(<ExtensionPoint id="test:point" />);

      expect(screen.getByTestId('replacement')).toBeInTheDocument();
    });
  });

  describe('View Extension Point', () => {
    it('should render first view extension that returns content', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'view-1', order: 100, render: () => null },
        { id: 'view-2', order: 200, render: () => <div data-testid="view-2">View 2</div> },
        { id: 'view-3', order: 300, render: () => <div data-testid="view-3">View 3</div> },
      ]);

      render(<ExtensionPoint id="view" />);

      expect(screen.getByTestId('view-2')).toBeInTheDocument();
      expect(screen.queryByTestId('view-3')).not.toBeInTheDocument();
    });

    it('should respect order when selecting view extension', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'view-high', order: 300, render: () => <div data-testid="high">High</div> },
        { id: 'view-low', order: 50, render: () => <div data-testid="low">Low</div> },
        { id: 'view-mid', order: 150, render: () => <div data-testid="mid">Mid</div> },
      ]);

      render(<ExtensionPoint id="view" />);

      expect(screen.getByTestId('low')).toBeInTheDocument();
      expect(screen.queryByTestId('mid')).not.toBeInTheDocument();
      expect(screen.queryByTestId('high')).not.toBeInTheDocument();
    });

    it('should render fallback for view extension when no extension returns content', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'view-1', order: 100, render: () => null },
        { id: 'view-2', order: 200, render: () => null },
      ]);

      render(
        <ExtensionPoint
          id="view"
          fallback={<div data-testid="fallback">Fallback Content</div>}
        />
      );

      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('should render fallback function for view extension', () => {
      mockUseExtensions.mockReturnValue([]);

      render(
        <ExtensionPoint
          id="view"
          fallback={() => <div data-testid="fallback-fn">Fallback Function</div>}
        />
      );

      expect(screen.getByTestId('fallback-fn')).toBeInTheDocument();
    });

    it('should render nothing for view when no extensions and no fallback', () => {
      mockUseExtensions.mockReturnValue([]);

      const { container } = render(<ExtensionPoint id="view" />);

      expect(container.innerHTML).toBe('');
    });

    it('should skip view extensions without render function', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'view-no-render', order: 50, data: 'test' },
        { id: 'view-valid', order: 100, render: () => <div data-testid="valid">Valid</div> },
      ]);

      render(<ExtensionPoint id="view" />);

      expect(screen.getByTestId('valid')).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should pass props to extension render function', () => {
      const renderFn = vi.fn().mockReturnValue(<div data-testid="ext">Content</div>);
      mockUseExtensions.mockReturnValue([{ id: 'ext-1', order: 1, render: renderFn }]);

      render(<ExtensionPoint id="test:point" props={{ foo: 'bar', count: 42 }} />);

      expect(renderFn).toHaveBeenCalledWith({ foo: 'bar', count: 42 });
    });

    it('should pass empty props object by default', () => {
      const renderFn = vi.fn().mockReturnValue(<div>Content</div>);
      mockUseExtensions.mockReturnValue([{ id: 'ext-1', order: 1, render: renderFn }]);

      render(<ExtensionPoint id="test:point" />);

      expect(renderFn).toHaveBeenCalledWith({});
    });

    it('should pass props to replace extension render function', () => {
      const renderFn = vi.fn().mockReturnValue(<div data-testid="replace">Replace</div>);
      mockUseExtensions.mockReturnValue([
        { id: 'ext-replace', replace: true, render: renderFn },
      ]);

      render(<ExtensionPoint id="test:point" props={{ key: 'value' }} />);

      expect(renderFn).toHaveBeenCalledWith({ key: 'value' });
    });

    it('should pass props to view extension render function', () => {
      const renderFn = vi.fn().mockReturnValue(<div data-testid="view">View</div>);
      mockUseExtensions.mockReturnValue([
        { id: 'view-ext', order: 100, render: renderFn },
      ]);

      render(<ExtensionPoint id="view" props={{ viewProp: 'test' }} />);

      expect(renderFn).toHaveBeenCalledWith({ viewProp: 'test' });
    });
  });

  describe('Custom Render Function', () => {
    it('should call custom render function with extensions', () => {
      const extensions = [
        { id: 'ext-1', order: 1, data: 'first' },
        { id: 'ext-2', order: 2, data: 'second' },
      ];
      mockUseExtensions.mockReturnValue(extensions);
      const customRender = vi.fn().mockReturnValue(<div data-testid="custom">Custom</div>);

      render(<ExtensionPoint id="test:point" render={customRender} />);

      expect(customRender).toHaveBeenCalledWith(expect.arrayContaining(extensions));
      expect(screen.getByTestId('custom')).toBeInTheDocument();
    });

    it('should render both extensions and custom render output', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'ext-1', order: 1, render: () => <div data-testid="ext">Extension</div> },
      ]);

      render(
        <ExtensionPoint
          id="test:point"
          render={() => <div data-testid="custom">Custom</div>}
        />
      );

      expect(screen.getByTestId('ext')).toBeInTheDocument();
      expect(screen.getByTestId('custom')).toBeInTheDocument();
    });

    it('should not call custom render when replace extension present', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'ext-replace', replace: true, render: () => <div>Replace</div> },
      ]);
      const customRender = vi.fn().mockReturnValue(<div>Custom</div>);

      render(<ExtensionPoint id="test:point" render={customRender} />);

      expect(customRender).not.toHaveBeenCalled();
    });

    it('should not call custom render when hide extension present', () => {
      mockUseExtensions.mockReturnValue([{ id: 'ext-hide', hide: true }]);
      const customRender = vi.fn().mockReturnValue(<div>Custom</div>);

      render(<ExtensionPoint id="test:point" render={customRender} />);

      expect(customRender).not.toHaveBeenCalled();
    });
  });

  describe('Fallback Behavior', () => {
    it('should not render fallback for non-view extension points', () => {
      mockUseExtensions.mockReturnValue([]);

      render(
        <ExtensionPoint
          id="layout:header"
          fallback={<div data-testid="fallback">Fallback</div>}
        />
      );

      expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle extension returning undefined from render', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'ext-1', order: 1, render: () => undefined },
        { id: 'ext-2', order: 2, render: () => <div data-testid="ext-2">Valid</div> },
      ]);

      render(<ExtensionPoint id="test:point" />);

      expect(screen.getByTestId('ext-2')).toBeInTheDocument();
    });

    it('should handle empty string id', () => {
      mockUseExtensions.mockReturnValue([]);

      render(<ExtensionPoint id="" />);

      expect(mockUseExtensions).toHaveBeenCalledWith('');
    });

    it('should handle extensions array mutation between renders', () => {
      mockUseExtensions.mockReturnValueOnce([
        { id: 'ext-1', order: 1, render: () => <div data-testid="first">First</div> },
      ]);

      const { rerender } = render(<ExtensionPoint id="test:point" />);

      expect(screen.getByTestId('first')).toBeInTheDocument();

      mockUseExtensions.mockReturnValueOnce([
        { id: 'ext-2', order: 1, render: () => <div data-testid="second">Second</div> },
      ]);

      rerender(<ExtensionPoint id="test:point" />);

      expect(screen.getByTestId('second')).toBeInTheDocument();
      expect(screen.queryByTestId('first')).not.toBeInTheDocument();
    });

    it('should handle render function that returns React fragment', () => {
      mockUseExtensions.mockReturnValue([
        {
          id: 'ext-1',
          order: 1,
          render: () => (
            <>
              <span data-testid="frag-1">One</span>
              <span data-testid="frag-2">Two</span>
            </>
          ),
        },
      ]);

      render(<ExtensionPoint id="test:point" />);

      expect(screen.getByTestId('frag-1')).toBeInTheDocument();
      expect(screen.getByTestId('frag-2')).toBeInTheDocument();
    });

    it('should handle render function that returns string', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'ext-1', order: 1, render: () => 'Plain text content' },
      ]);

      render(<ExtensionPoint id="test:point" />);

      expect(screen.getByText('Plain text content')).toBeInTheDocument();
    });

    it('should handle render function that returns number', () => {
      mockUseExtensions.mockReturnValue([
        { id: 'ext-1', order: 1, render: () => 42 },
      ]);

      render(<ExtensionPoint id="test:point" />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });
});
