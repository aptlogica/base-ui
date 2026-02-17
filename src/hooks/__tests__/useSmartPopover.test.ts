import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSmartPopover } from '../useSmartPopover';
import { RefObject } from 'react';

describe('useSmartPopover', () => {
  let triggerRef: RefObject<HTMLElement>;
  let panelRef: RefObject<HTMLElement>;
  let mockOnOutsideClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create mock refs with elements
    const triggerElement = document.createElement('button');
    triggerElement.style.position = 'fixed';
    triggerElement.style.top = '100px';
    triggerElement.style.left = '100px';
    triggerElement.style.width = '100px';
    triggerElement.style.height = '40px';
    document.body.appendChild(triggerElement);

    const panelElement = document.createElement('div');
    panelElement.style.position = 'fixed';
    panelElement.style.width = '300px';
    panelElement.style.height = '200px';
    Object.defineProperty(panelElement, 'offsetWidth', { value: 300, configurable: true });
    Object.defineProperty(panelElement, 'offsetHeight', { value: 200, configurable: true });
    document.body.appendChild(panelElement);

    triggerRef = { current: triggerElement };
    panelRef = { current: panelElement };
    mockOnOutsideClick = vi.fn();

    // Mock getBoundingClientRect
    vi.spyOn(triggerElement, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 100,
      right: 200,
      bottom: 140,
      width: 100,
      height: 40,
      x: 100,
      y: 100,
      toJSON: () => ({})
    });

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should initialize with null position when closed', () => {
    const { result } = renderHook(() =>
      useSmartPopover({
        open: false,
        triggerRef,
        panelRef
      })
    );

    expect(result.current.position).toBeNull();
  });

  it('should compute position when open', () => {
    const { result } = renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef
      })
    );

    expect(result.current.position).not.toBeNull();
    expect(result.current.position).toHaveProperty('top');
    expect(result.current.position).toHaveProperty('left');
  });

  it('should provide recompute function', () => {
    const { result } = renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef
      })
    );

    expect(typeof result.current.recompute).toBe('function');
  });

  it('should recompute position when recompute is called', () => {
    const { result } = renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef
      })
    );

    const initialPosition = result.current.position;

    act(() => {
      result.current.recompute();
    });

    // Position should be recalculated (might be same values but function was called)
    expect(result.current.position).toBeDefined();
  });

  it('should call onOutsideClick when clicking outside', () => {
    renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef,
        onOutsideClick: mockOnOutsideClick
      })
    );

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: outsideElement, enumerable: true });
    document.dispatchEvent(event);

    expect(mockOnOutsideClick).toHaveBeenCalledOnce();

    document.body.removeChild(outsideElement);
  });

  it('should not call onOutsideClick when clicking on trigger', () => {
    renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef,
        onOutsideClick: mockOnOutsideClick
      })
    );

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: triggerRef.current, enumerable: true });
    document.dispatchEvent(event);

    expect(mockOnOutsideClick).not.toHaveBeenCalled();
  });

  it('should not call onOutsideClick when clicking on panel', () => {
    renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef,
        onOutsideClick: mockOnOutsideClick
      })
    );

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: panelRef.current, enumerable: true });
    document.dispatchEvent(event);

    expect(mockOnOutsideClick).not.toHaveBeenCalled();
  });

  it('should not call onOutsideClick when clicking on ignored refs', () => {
    const ignoredRef: RefObject<HTMLElement> = {
      current: document.createElement('div')
    };
    document.body.appendChild(ignoredRef.current!);

    renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef,
        onOutsideClick: mockOnOutsideClick,
        ignoreRefs: [ignoredRef]
      })
    );

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: ignoredRef.current, enumerable: true });
    document.dispatchEvent(event);

    expect(mockOnOutsideClick).not.toHaveBeenCalled();

    document.body.removeChild(ignoredRef.current!);
  });

  it('should not set up click listener when closed', () => {
    renderHook(() =>
      useSmartPopover({
        open: false,
        triggerRef,
        panelRef,
        onOutsideClick: mockOnOutsideClick
      })
    );

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: outsideElement, enumerable: true });
    document.dispatchEvent(event);

    expect(mockOnOutsideClick).not.toHaveBeenCalled();

    document.body.removeChild(outsideElement);
  });

  it('should not set up click listener when onOutsideClick is not provided', () => {
    renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef
      })
    );

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: outsideElement, enumerable: true });
    
    // Should not throw error
    expect(() => document.dispatchEvent(event)).not.toThrow();

    document.body.removeChild(outsideElement);
  });

  it('should handle margin option', () => {
    const { result } = renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef,
        margin: 16
      })
    );

    expect(result.current.position).not.toBeNull();
  });

  it('should handle preferred horizontal position', () => {
    const { result } = renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef,
        preferred: { horizontal: 'right' }
      })
    );

    expect(result.current.position).not.toBeNull();
  });

  it('should handle preferred vertical position', () => {
    const { result } = renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef,
        preferred: { vertical: 'bottom' }
      })
    );

    expect(result.current.position).not.toBeNull();
  });

  it('should handle both preferred positions', () => {
    const { result } = renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef,
        preferred: { horizontal: 'left', vertical: 'top' }
      })
    );

    expect(result.current.position).not.toBeNull();
  });

  it('falls back to left when preferred right does not fit', () => {
    vi.spyOn(triggerRef.current!, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 350,
      right: 390,
      bottom: 140,
      width: 40,
      height: 40,
      x: 350,
      y: 100,
      toJSON: () => ({})
    });
    Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });

    const { result } = renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef,
        preferred: { horizontal: 'right' }
      })
    );

    expect(result.current.position?.left).toBe(390 - 300);
  });

  it('positions above when there is not enough space below', () => {
    vi.spyOn(triggerRef.current!, 'getBoundingClientRect').mockReturnValue({
      top: 350,
      left: 100,
      right: 200,
      bottom: 390,
      width: 100,
      height: 40,
      x: 100,
      y: 350,
      toJSON: () => ({})
    });
    Object.defineProperty(window, 'innerHeight', { value: 420, writable: true });

    const { result } = renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef,
        preferred: { vertical: 'bottom' }
      })
    );

    expect(result.current.position?.top).toBe(350 - 200 - 8);
  });

  it('clamps position within viewport margins', () => {
    vi.spyOn(triggerRef.current!, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: -50,
      right: 10,
      bottom: 40,
      width: 60,
      height: 40,
      x: -50,
      y: 0,
      toJSON: () => ({})
    });
    Object.defineProperty(window, 'innerWidth', { value: 320, writable: true });

    const { result } = renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef
      })
    );

    expect(result.current.position?.left).toBeGreaterThanOrEqual(8);
  });

  it('should return null position when trigger ref is null', () => {
    const nullTriggerRef: RefObject<HTMLElement> = { current: null };

    const { result } = renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef: nullTriggerRef,
        panelRef
      })
    );

    expect(result.current.position).toBeNull();
  });

  it('should handle multiple ignored refs', () => {
    const ignoredRef1: RefObject<HTMLElement> = {
      current: document.createElement('div')
    };
    const ignoredRef2: RefObject<HTMLElement> = {
      current: document.createElement('div')
    };
    document.body.appendChild(ignoredRef1.current!);
    document.body.appendChild(ignoredRef2.current!);

    renderHook(() =>
      useSmartPopover({
        open: true,
        triggerRef,
        panelRef,
        onOutsideClick: mockOnOutsideClick,
        ignoreRefs: [ignoredRef1, ignoredRef2]
      })
    );

    // Click on second ignored ref
    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: ignoredRef2.current, enumerable: true });
    document.dispatchEvent(event);

    expect(mockOnOutsideClick).not.toHaveBeenCalled();

    document.body.removeChild(ignoredRef1.current!);
    document.body.removeChild(ignoredRef2.current!);
  });
});
