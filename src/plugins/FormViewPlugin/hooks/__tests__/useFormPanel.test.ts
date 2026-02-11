import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormPanel } from '../useFormPanel';

describe('useFormPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have sidebarOpen false initially', () => {
      const { result } = renderHook(() => useFormPanel());

      expect(result.current.sidebarOpen).toBe(false);
    });

    it('should have selectedFieldId null initially', () => {
      const { result } = renderHook(() => useFormPanel());

      expect(result.current.selectedFieldId).toBeNull();
    });
  });

  describe('toggleSidebar', () => {
    it('should set sidebarOpen to true when toggleSidebar is called from false', () => {
      const { result } = renderHook(() => useFormPanel());

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarOpen).toBe(true);
    });

    it('should set sidebarOpen to false when toggleSidebar is called from true', () => {
      const { result } = renderHook(() => useFormPanel());

      act(() => {
        result.current.toggleSidebar();
      });
      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarOpen).toBe(false);
    });
  });

  describe('closeSidebar', () => {
    it('should set sidebarOpen to false when closeSidebar is called', () => {
      const { result } = renderHook(() => useFormPanel());

      act(() => {
        result.current.toggleSidebar();
      });
      act(() => {
        result.current.closeSidebar();
      });

      expect(result.current.sidebarOpen).toBe(false);
    });
  });

  describe('openSidebar', () => {
    it('should set sidebarOpen to true when openSidebar is called', () => {
      const { result } = renderHook(() => useFormPanel());

      act(() => {
        result.current.openSidebar();
      });

      expect(result.current.sidebarOpen).toBe(true);
    });
  });

  describe('setSelectedFieldId', () => {
    it('should set selectedFieldId when setSelectedFieldId is called', () => {
      const { result } = renderHook(() => useFormPanel());

      act(() => {
        result.current.setSelectedFieldId('field-1');
      });

      expect(result.current.selectedFieldId).toBe('field-1');
    });

    it('should clear selectedFieldId when setSelectedFieldId is called with null', () => {
      const { result } = renderHook(() => useFormPanel());

      act(() => {
        result.current.setSelectedFieldId('field-1');
      });
      act(() => {
        result.current.setSelectedFieldId(null);
      });

      expect(result.current.selectedFieldId).toBeNull();
    });
  });

  describe('handleBackToFieldsList', () => {
    it('should set selectedFieldId to null when handleBackToFieldsList is called', () => {
      const { result } = renderHook(() => useFormPanel());

      act(() => {
        result.current.setSelectedFieldId('field-1');
      });
      act(() => {
        result.current.handleBackToFieldsList();
      });

      expect(result.current.selectedFieldId).toBeNull();
    });
  });
});
