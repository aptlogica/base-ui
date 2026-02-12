import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SmartPopover from '../SmartPopover';

describe('SmartPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should not render when anchorEl is null', () => {
      const { container } = render(
        <SmartPopover anchorEl={null}>
          <div>Content</div>
        </SmartPopover>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render content when anchorEl is provided', () => {
      const anchorEl = document.createElement('div');
      document.body.appendChild(anchorEl);

      render(
        <SmartPopover anchorEl={anchorEl}>
          <div>Test Content</div>
        </SmartPopover>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();

      anchorEl.remove();
    });

    it('should apply custom className', () => {
      const anchorEl = document.createElement('div');
      document.body.appendChild(anchorEl);

      render(
        <SmartPopover anchorEl={anchorEl} className="custom-class">
          <div>Content</div>
        </SmartPopover>
      );

      const popover = document.body.querySelector('.custom-class');
      expect(popover).toBeInstanceOf(HTMLElement);
      expect(popover).toBeInTheDocument();

      anchorEl.remove();
    });
  });

  describe('positioning', () => {
    it('should position popover at top placement', () => {
      const anchorEl = document.createElement('div');
      Object.defineProperty(anchorEl, 'getBoundingClientRect', {
        value: () => ({
          top: 100,
          left: 50,
          bottom: 150,
          right: 100,
          width: 50,
          height: 50
        })
      });
      document.body.appendChild(anchorEl);

      render(
        <SmartPopover anchorEl={anchorEl} placement="top" offset={8}>
          <div>Content</div>
        </SmartPopover>
      );

      const popover = document.body.querySelector('div[style*="position"]') as HTMLElement;
      expect(popover).toBeInstanceOf(HTMLElement);
      expect(popover).toHaveStyle({ position: 'fixed' });

      anchorEl.remove();
    });

    it('should position popover at bottom placement', () => {
      const anchorEl = document.createElement('div');
      Object.defineProperty(anchorEl, 'getBoundingClientRect', {
        value: () => ({
          top: 100,
          left: 50,
          bottom: 150,
          right: 100,
          width: 50,
          height: 50
        })
      });
      document.body.appendChild(anchorEl);

      render(
        <SmartPopover anchorEl={anchorEl} placement="bottom" offset={8}>
          <div>Content</div>
        </SmartPopover>
      );

      const popover = document.body.querySelector('div[style*="position"]') as HTMLElement;
      expect(popover).toBeInstanceOf(HTMLElement);
      expect(popover).toHaveStyle({ position: 'fixed' });

      anchorEl.remove();
    });

    it('should position popover at left placement', () => {
      const anchorEl = document.createElement('div');
      Object.defineProperty(anchorEl, 'getBoundingClientRect', {
        value: () => ({
          top: 100,
          left: 50,
          bottom: 150,
          right: 100,
          width: 50,
          height: 50
        })
      });
      document.body.appendChild(anchorEl);

      render(
        <SmartPopover anchorEl={anchorEl} placement="left" offset={8}>
          <div>Content</div>
        </SmartPopover>
      );

      const popover = document.body.querySelector('div[style*="position"]') as HTMLElement;
      expect(popover).toBeInstanceOf(HTMLElement);
      expect(popover).toHaveStyle({ position: 'fixed' });

      anchorEl.remove();
    });

    it('should position popover at right placement', () => {
      const anchorEl = document.createElement('div');
      Object.defineProperty(anchorEl, 'getBoundingClientRect', {
        value: () => ({
          top: 100,
          left: 50,
          bottom: 150,
          right: 100,
          width: 50,
          height: 50
        })
      });
      document.body.appendChild(anchorEl);

      render(
        <SmartPopover anchorEl={anchorEl} placement="right" offset={8}>
          <div>Content</div>
        </SmartPopover>
      );

      const popover = document.body.querySelector('div[style*="position"]') as HTMLElement;
      expect(popover).toBeInstanceOf(HTMLElement);
      expect(popover).toHaveStyle({ position: 'fixed' });

      anchorEl.remove();
    });

    it('should apply custom offset', () => {
      const anchorEl = document.createElement('div');
      Object.defineProperty(anchorEl, 'getBoundingClientRect', {
        value: () => ({
          top: 100,
          left: 50,
          bottom: 150,
          right: 100,
          width: 50,
          height: 50
        })
      });
      document.body.appendChild(anchorEl);

      render(
        <SmartPopover anchorEl={anchorEl} placement="bottom" offset={20}>
          <div>Content</div>
        </SmartPopover>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();

      anchorEl.remove();
    });
  });

  describe('portal behavior', () => {
    it('should render into document.body', () => {
      const anchorEl = document.createElement('div');
      document.body.appendChild(anchorEl);

      render(
        <SmartPopover anchorEl={anchorEl}>
          <div data-testid="popover-content">Portal Content</div>
        </SmartPopover>
      );

      const content = screen.getByTestId('popover-content');
      expect(content.parentElement?.parentElement).toBe(document.body);

      anchorEl.remove();
    });
  });

  describe('cleanup', () => {
    it('should remove popover when anchorEl becomes null', () => {
      const anchorEl = document.createElement('div');
      document.body.appendChild(anchorEl);

      const { rerender } = render(
        <SmartPopover anchorEl={anchorEl}>
          <div>Content</div>
        </SmartPopover>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();

      rerender(
        <SmartPopover anchorEl={null}>
          <div>Content</div>
        </SmartPopover>
      );

      expect(screen.queryByText('Content')).not.toBeInTheDocument();

      anchorEl.remove();
    });
  });

  describe('children rendering', () => {
    it('should render complex children', () => {
      const anchorEl = document.createElement('div');
      document.body.appendChild(anchorEl);

      render(
        <SmartPopover anchorEl={anchorEl}>
          <div>
            <h1>Title</h1>
            <p>Description</p>
            <button>Action</button>
          </div>
        </SmartPopover>
      );

      expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();

      anchorEl.remove();
    });
  });
});
