import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableModals } from '../useTableModals';

describe('useTableModals', () => {
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useTableModals());

      expect(result.current.contextMenu).toEqual({
        open: false,
        x: 0,
        y: 0,
        rowId: null,
      });

      expect(result.current.colMenu).toEqual({
        open: false,
        x: 0,
        y: 0,
        colIndex: null,
      });
    });
  });

  describe('context menu handling', () => {
    it('should open context menu with correct position and rowId', () => {
      const { result } = renderHook(() => useTableModals());

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        clientX: 100,
        clientY: 200,
        target: document.createElement('div'),
      } as any;

      act(() => {
        result.current.handleContextMenu(mockEvent, 'row-123');
      });

      expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
      expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
      expect(result.current.contextMenu).toEqual({
        open: true,
        x: 100,
        y: 200,
        rowId: 'row-123',
      });
    });

    it('should not open context menu when clicked inside modal', () => {
      const { result } = renderHook(() => useTableModals());

      const modalElement = document.createElement('div');
      modalElement.className = 'z-50';
      const targetElement = document.createElement('span');
      modalElement.appendChild(targetElement);
      document.body.appendChild(modalElement);

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        clientX: 100,
        clientY: 200,
        target: targetElement,
      } as any;

      act(() => {
        result.current.handleContextMenu(mockEvent, 'row-123');
      });

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(result.current.contextMenu.open).toBe(false);

      modalElement.remove();
    });

    it('should not open context menu when clicked inside dialog', () => {
      const { result } = renderHook(() => useTableModals());

      const dialogElement = document.createElement('div');
      dialogElement.setAttribute('role', 'dialog');
      const targetElement = document.createElement('span');
      dialogElement.appendChild(targetElement);
      document.body.appendChild(dialogElement);

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        clientX: 100,
        clientY: 200,
        target: targetElement,
      } as any;

      act(() => {
        result.current.handleContextMenu(mockEvent, 'row-123');
      });

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(result.current.contextMenu.open).toBe(false);

      dialogElement.remove();
    });

    it('should close context menu', () => {
      const { result } = renderHook(() => useTableModals());

      // First open the context menu
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        clientX: 100,
        clientY: 200,
        target: document.createElement('div'),
      } as any;

      act(() => {
        result.current.handleContextMenu(mockEvent, 'row-123');
      });

      expect(result.current.contextMenu.open).toBe(true);

      // Then close it
      act(() => {
        result.current.handleCloseContextMenu();
      });

      expect(result.current.contextMenu.open).toBe(false);
    });
  });

  describe('column context menu handling', () => {
    it('should open column context menu with correct position and index', () => {
      const { result } = renderHook(() => useTableModals());

      const mockEvent = {
        preventDefault: vi.fn(),
        clientX: 150,
        clientY: 250,
      } as any;

      act(() => {
        result.current.handleColContextMenu(mockEvent, 2);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
      expect(result.current.colMenu).toEqual({
        open: true,
        x: 150,
        y: 250,
        colIndex: 2,
      });
    });

    it('should close column context menu', () => {
      const { result } = renderHook(() => useTableModals());

      // First open the column menu
      const mockEvent = {
        preventDefault: vi.fn(),
        clientX: 150,
        clientY: 250,
      } as any;

      act(() => {
        result.current.handleColContextMenu(mockEvent, 2);
      });

      expect(result.current.colMenu.open).toBe(true);

      // Then close it
      act(() => {
        result.current.handleCloseColMenu();
      });

      expect(result.current.colMenu.open).toBe(false);
    });
  });

  describe('document event listeners', () => {
    it('should add click listener when context menu is open', () => {
      const { result } = renderHook(() => useTableModals());

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        clientX: 100,
        clientY: 200,
        target: document.createElement('div'),
      } as any;

      act(() => {
        result.current.handleContextMenu(mockEvent, 'row-123');
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should always add contextmenu listener', () => {
      renderHook(() => useTableModals());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'contextmenu', 
        expect.any(Function), 
        true
      );
    });

    it('should remove event listeners on cleanup', () => {
      const { unmount } = renderHook(() => useTableModals());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'contextmenu', 
        expect.any(Function), 
        true
      );
    });

    it('should close context menu on outside click', () => {
      const { result } = renderHook(() => useTableModals());

      // Open context menu
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        clientX: 100,
        clientY: 200,
        target: document.createElement('div'),
      } as any;

      act(() => {
        result.current.handleContextMenu(mockEvent, 'row-123');
      });

      expect(result.current.contextMenu.open).toBe(true);

      // Simulate click outside
      const clickHandler = addEventListenerSpy.mock.calls.find(
        (call: [string, Function]) => call[0] === 'click'
      )?.[1];

      if (clickHandler) {
        act(() => {
          clickHandler(new MouseEvent('click'));
        });
      }

      expect(result.current.contextMenu.open).toBe(false);
    });
  });

  describe('modal detection for contextmenu prevention', () => {
    it('should prevent contextmenu in modal elements', () => {
      renderHook(() => useTableModals());

      const modalElement = document.createElement('div');
      modalElement.className = 'z-50';
      const targetElement = document.createElement('span');
      modalElement.appendChild(targetElement);
      document.body.appendChild(modalElement);

      // Get the contextmenu handler
      const contextmenuHandler = addEventListenerSpy.mock.calls.find(
        (call: [string, EventListener]) => call[0] === 'contextmenu'
      )?.[1];

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: targetElement,
      } as any;

      if (contextmenuHandler) {
        contextmenuHandler(mockEvent);
      }

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();

      modalElement.remove();
    });

    it('should prevent contextmenu in fixed overlay elements', () => {
      renderHook(() => useTableModals());

      const overlayElement = document.createElement('div');
      overlayElement.className = 'fixed inset-0 z-50';
      const targetElement = document.createElement('span');
      overlayElement.appendChild(targetElement);
      document.body.appendChild(overlayElement);

      // Get the contextmenu handler
      const contextmenuHandler = addEventListenerSpy.mock.calls.find(
        (call: [string, EventListener]) => call[0] === 'contextmenu'
      )?.[1];

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: targetElement,
      } as any;

      if (contextmenuHandler) {
        contextmenuHandler(mockEvent);
      }

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();

      overlayElement.remove();
    });

    it('should allow contextmenu in normal elements', () => {
      renderHook(() => useTableModals());

      const normalElement = document.createElement('div');
      const targetElement = document.createElement('span');
      normalElement.appendChild(targetElement);
      document.body.appendChild(normalElement);

      // Get the contextmenu handler
      const contextmenuHandler = addEventListenerSpy.mock.calls.find(
        (call: [string, EventListener]) => call[0] === 'contextmenu'
      )?.[1];

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: targetElement,
      } as any;

      if (contextmenuHandler) {
        contextmenuHandler(mockEvent);
      }

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();

      normalElement.remove();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple context menu state changes', () => {
      const { result } = renderHook(() => useTableModals());

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        clientX: 100,
        clientY: 200,
        target: document.createElement('div'),
      } as any;

      // Open first context menu
      act(() => {
        result.current.handleContextMenu(mockEvent, 'row-1');
      });

      expect(result.current.contextMenu.rowId).toBe('row-1');

      // Open second context menu (should replace first)
      act(() => {
        result.current.handleContextMenu(mockEvent, 'row-2');
      });

      expect(result.current.contextMenu.rowId).toBe('row-2');
      expect(result.current.contextMenu.open).toBe(true);
    });

    it('should handle closing already closed context menu', () => {
      const { result } = renderHook(() => useTableModals());

      expect(result.current.contextMenu.open).toBe(false);

      act(() => {
        result.current.handleCloseContextMenu();
      });

      expect(result.current.contextMenu.open).toBe(false);
    });

    it('should handle zero coordinates', () => {
      const { result } = renderHook(() => useTableModals());

      const mockEvent = {
        preventDefault: vi.fn(),
        clientX: 0,
        clientY: 0,
      } as any;

      act(() => {
        result.current.handleColContextMenu(mockEvent, 0);
      });

      expect(result.current.colMenu).toEqual({
        open: true,
        x: 0,
        y: 0,
        colIndex: 0,
      });
    });

    it('should handle negative column index', () => {
      const { result } = renderHook(() => useTableModals());

      const mockEvent = {
        preventDefault: vi.fn(),
        clientX: 100,
        clientY: 200,
      } as any;

      act(() => {
        result.current.handleColContextMenu(mockEvent, -1);
      });

      expect(result.current.colMenu.colIndex).toBe(-1);
    });
  });
});