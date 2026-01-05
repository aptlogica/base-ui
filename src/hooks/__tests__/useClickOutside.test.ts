import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClickOutside } from '../useClickOutside';
import { RefObject } from 'react';

describe('useClickOutside', () => {
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose = vi.fn();
  });

  it('should return a ref', () => {
    const { result } = renderHook(() =>
      useClickOutside({ isOpen: true, onClose: mockOnClose })
    );

    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });

  it('should not call onClose when isOpen is false', () => {
    renderHook(() =>
      useClickOutside({ isOpen: false, onClose: mockOnClose })
    );

    const event = new MouseEvent('mousedown', { bubbles: true });
    document.dispatchEvent(event);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when clicking outside', () => {
    const { result } = renderHook(() =>
      useClickOutside({ isOpen: true, onClose: mockOnClose })
    );

    // Create a div element to simulate clicking outside
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: outsideElement, enumerable: true });
    document.dispatchEvent(event);

    expect(mockOnClose).toHaveBeenCalledOnce();

    document.body.removeChild(outsideElement);
  });

  it('should not call onClose when clicking inside the ref', () => {
    const { result } = renderHook(() =>
      useClickOutside({ isOpen: true, onClose: mockOnClose })
    );

    // Create and attach an element to the ref
    const insideElement = document.createElement('div');
    document.body.appendChild(insideElement);
    (result.current as any).current = insideElement;

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: insideElement, enumerable: true });
    document.dispatchEvent(event);

    expect(mockOnClose).not.toHaveBeenCalled();

    document.body.removeChild(insideElement);
  });

  it('should not call onClose when clicking inside excluded refs', () => {
    const excludedRef: RefObject<HTMLElement> = {
      current: document.createElement('div')
    };
    document.body.appendChild(excludedRef.current!);

    renderHook(() =>
      useClickOutside({
        isOpen: true,
        onClose: mockOnClose,
        excludeRefs: [excludedRef]
      })
    );

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: excludedRef.current, enumerable: true });
    document.dispatchEvent(event);

    expect(mockOnClose).not.toHaveBeenCalled();

    document.body.removeChild(excludedRef.current!);
  });

  it('should not call onClose when clicking inside functions modal', () => {
    renderHook(() =>
      useClickOutside({ isOpen: true, onClose: mockOnClose })
    );

    // Create modal element
    const modalElement = document.createElement('div');
    modalElement.className = 'all-functions-modal';
    document.body.appendChild(modalElement);

    const childElement = document.createElement('span');
    modalElement.appendChild(childElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: childElement, enumerable: true });
    
    // Mock closest method
    (childElement as any).closest = vi.fn().mockReturnValue(modalElement);
    
    document.dispatchEvent(event);

    expect(mockOnClose).not.toHaveBeenCalled();

    document.body.removeChild(modalElement);
  });

  it('should handle multiple excluded refs', () => {
    const excludedRef1: RefObject<HTMLElement> = {
      current: document.createElement('div')
    };
    const excludedRef2: RefObject<HTMLElement> = {
      current: document.createElement('div')
    };
    
    document.body.appendChild(excludedRef1.current!);
    document.body.appendChild(excludedRef2.current!);

    renderHook(() =>
      useClickOutside({
        isOpen: true,
        onClose: mockOnClose,
        excludeRefs: [excludedRef1, excludedRef2]
      })
    );

    // Click on second excluded ref
    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: excludedRef2.current, enumerable: true });
    document.dispatchEvent(event);

    expect(mockOnClose).not.toHaveBeenCalled();

    document.body.removeChild(excludedRef1.current!);
    document.body.removeChild(excludedRef2.current!);
  });
});
