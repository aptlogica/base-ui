import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnDropdown } from '../components/ColumnDropdown';
import { useClickOutside } from '../../../../../hooks/useClickOutside';

vi.mock('../../../../../hooks/useClickOutside', () => ({
  useClickOutside: vi.fn(),
}));

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    createPortal: (children: ReactNode) => children,
  };
});

describe('ColumnDropdown', () => {
  const mockUseClickOutside = vi.mocked(useClickOutside);
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const clickOutsideRef: { current: HTMLDivElement | null } = { current: null };

  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
  const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
  const originalInnerWidth = globalThis.innerWidth;
  const originalInnerHeight = globalThis.innerHeight;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

  const renderDropdown = () => render(<ColumnDropdown onEdit={mockOnEdit} onDelete={mockOnDelete} />);

  const setBoundingClientRect = (rect: DOMRect) => {
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      ...rect,
      toJSON: () => undefined,
    }));
  };

  const setViewport = (width: number, height: number) => {
    Object.defineProperty(globalThis, 'innerWidth', { value: width, writable: true });
    Object.defineProperty(globalThis, 'innerHeight', { value: height, writable: true });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClickOutside.mockReturnValue(clickOutsideRef);

    setBoundingClientRect({
      top: 100,
      left: 200,
      right: 250,
      bottom: 150,
      width: 50,
      height: 50,
      x: 200,
      y: 100,
      toJSON: () => undefined,
    } as DOMRect);

    setViewport(1024, 768);

    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get: () => 192,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get: () => 200,
    });

    globalThis.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    globalThis.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    cleanup();
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;

    if (originalOffsetWidth) {
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
    } else {
      delete (HTMLElement.prototype as { offsetWidth?: number }).offsetWidth;
    }

    if (originalOffsetHeight) {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
    } else {
      delete (HTMLElement.prototype as { offsetHeight?: number }).offsetHeight;
    }

    Object.defineProperty(globalThis, 'innerWidth', { value: originalInnerWidth, writable: true });
    Object.defineProperty(globalThis, 'innerHeight', { value: originalInnerHeight, writable: true });

    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('renders the trigger button closed by default', () => {
    renderDropdown();

    const button = screen.getByRole('button', { name: /column options/i });
    expect(button).toBeInTheDocument();
    expect(screen.queryByTitle('Edit field')).not.toBeInTheDocument();
  });

  it('toggles the dropdown when clicking the button', async () => {
    const user = userEvent.setup();
    renderDropdown();

    const button = screen.getByRole('button', { name: /column options/i });
    await user.click(button);

    expect(await screen.findByTitle('Edit field')).toBeInTheDocument();

    await user.click(button);

    await waitFor(() => {
      expect(screen.queryByTitle('Edit field')).not.toBeInTheDocument();
    });
  });

  it('calls onEdit and closes when the edit option is clicked', async () => {
    const user = userEvent.setup();
    renderDropdown();

    const button = screen.getByRole('button', { name: /column options/i });
    await user.click(button);

    const editButton = await screen.findByTitle('Edit field');
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.queryByTitle('Edit field')).not.toBeInTheDocument();
    });
  });

  it('calls onDelete and closes when the delete option is clicked', async () => {
    const user = userEvent.setup();
    renderDropdown();

    const button = screen.getByRole('button', { name: /column options/i });
    await user.click(button);

    const deleteButton = await screen.findByTitle('Delete field');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.queryByTitle('Delete field')).not.toBeInTheDocument();
    });
  });

  it('closes the dropdown when useClickOutside triggers onClose', async () => {
    const user = userEvent.setup();
    renderDropdown();

    const button = screen.getByRole('button', { name: /column options/i });
    await user.click(button);

    expect(await screen.findByTitle('Edit field')).toBeInTheDocument();
    expect(mockUseClickOutside).toHaveBeenCalled();

    const onClose = mockUseClickOutside.mock.calls[0][0].onClose;
    act(() => {
      onClose();
    });

    await waitFor(() => {
      expect(screen.queryByTitle('Edit field')).not.toBeInTheDocument();
    });
  });

  it('positions the dropdown within left and top bounds when near the viewport edge', async () => {
    setBoundingClientRect({
      top: 200,
      left: 5,
      right: 100,
      bottom: 250,
      width: 95,
      height: 50,
      x: 5,
      y: 200,
      toJSON: () => undefined,
    } as DOMRect);
    setViewport(1024, 300);

    const user = userEvent.setup();
    renderDropdown();

    const button = screen.getByRole('button', { name: /column options/i });
    await user.click(button);

    const editButton = await screen.findByTitle('Edit field');
    const menu = editButton.closest('div');

    if (!menu) {
      throw new Error('Menu element not found');
    }

    expect(Number.parseFloat(menu.style.left)).toBe(5);
    expect(Number.parseFloat(menu.style.top)).toBe(10);
  });

  it('positions the dropdown within right and bottom bounds when overflowing', async () => {
    setBoundingClientRect({
      top: 650,
      left: 930,
      right: 980,
      bottom: 700,
      width: 50,
      height: 50,
      x: 930,
      y: 650,
      toJSON: () => undefined,
    } as DOMRect);
    setViewport(900, 900);

    const user = userEvent.setup();
    renderDropdown();

    const button = screen.getByRole('button', { name: /column options/i });
    await user.click(button);

    const editButton = await screen.findByTitle('Edit field');
    const menu = editButton.closest('div');

    if (!menu) {
      throw new Error('Menu element not found');
    }

    expect(Number.parseFloat(menu.style.left)).toBe(698);
    expect(Number.parseFloat(menu.style.top)).toBe(690);
  });
});
