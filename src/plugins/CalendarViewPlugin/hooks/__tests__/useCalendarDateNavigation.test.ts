import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendarDateNavigation } from '../useCalendarDateNavigation';

describe('useCalendarDateNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useCalendarDateNavigation());

      expect(result.current.currentView).toBe('month');
      expect(result.current.selectedDate).toBeNull();
      expect(result.current.sidebarCollapsed).toBe(false);
      expect(result.current.currentDate).toBeInstanceOf(Date);
    });

    it('should initialize with custom initial date', () => {
      const customDate = new Date('2026-06-15');
      const { result } = renderHook(() =>
        useCalendarDateNavigation({ initialDate: customDate })
      );

      expect(result.current.currentDate.toDateString()).toBe(customDate.toDateString());
    });

    it('should initialize with custom initial view', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({ initialView: 'week' })
      );

      expect(result.current.currentView).toBe('week');
    });
  });

  describe('goToPrevious', () => {
    it('should navigate to previous month in month view', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({
          initialDate: new Date('2026-06-15'),
          initialView: 'month'
        })
      );

      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.currentDate.getMonth()).toBe(4);
      expect(result.current.currentDate.getFullYear()).toBe(2026);
    });

    it('should navigate to previous year when going back from January', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({
          initialDate: new Date('2026-01-15'),
          initialView: 'month'
        })
      );

      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.currentDate.getMonth()).toBe(11);
      expect(result.current.currentDate.getFullYear()).toBe(2025);
    });

    it('should navigate to previous week in week view', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({
          initialDate: new Date('2026-06-15'),
          initialView: 'week'
        })
      );

      const initialDate = result.current.currentDate.getDate();

      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.currentDate.getDate()).toBe(initialDate - 7);
    });

    it('should navigate to previous day in day view', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({
          initialDate: new Date('2026-06-15'),
          initialView: 'day'
        })
      );

      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.currentDate.getDate()).toBe(14);
    });

    it('should navigate to previous year in year view', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({
          initialDate: new Date('2026-06-15'),
          initialView: 'year'
        })
      );

      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.currentDate.getFullYear()).toBe(2025);
    });
  });

  describe('goToNext', () => {
    it('should navigate to next month in month view', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({
          initialDate: new Date('2026-06-15'),
          initialView: 'month'
        })
      );

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.currentDate.getMonth()).toBe(6);
      expect(result.current.currentDate.getFullYear()).toBe(2026);
    });

    it('should navigate to next year when going forward from December', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({
          initialDate: new Date('2026-12-15'),
          initialView: 'month'
        })
      );

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.currentDate.getMonth()).toBe(0);
      expect(result.current.currentDate.getFullYear()).toBe(2027);
    });

    it('should navigate to next week in week view', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({
          initialDate: new Date('2026-06-15'),
          initialView: 'week'
        })
      );

      const initialDate = result.current.currentDate.getDate();

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.currentDate.getDate()).toBe(initialDate + 7);
    });

    it('should navigate to next day in day view', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({
          initialDate: new Date('2026-06-15'),
          initialView: 'day'
        })
      );

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.currentDate.getDate()).toBe(16);
    });

    it('should navigate to next year in year view', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({
          initialDate: new Date('2026-06-15'),
          initialView: 'year'
        })
      );

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.currentDate.getFullYear()).toBe(2027);
    });
  });

  describe('goToToday', () => {
    it('should reset to today', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({
          initialDate: new Date('2025-01-01'),
          initialView: 'month'
        })
      );

      act(() => {
        result.current.goToToday();
      });

      const today = new Date();
      expect(result.current.currentDate.toDateString()).toBe(today.toDateString());
    });

    it('should clear selected date', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({
          initialDate: new Date('2026-06-15')
        })
      );

      act(() => {
        result.current.setSelectedDate(new Date('2026-06-20'));
      });

      expect(result.current.selectedDate).not.toBeNull();

      act(() => {
        result.current.goToToday();
      });

      expect(result.current.selectedDate).toBeNull();
    });
  });

  describe('changeView', () => {
    it('should change to month view', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({ initialView: 'week' })
      );

      act(() => {
        result.current.changeView('month');
      });

      expect(result.current.currentView).toBe('month');
    });

    it('should change to week view', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({ initialView: 'month' })
      );

      act(() => {
        result.current.changeView('week');
      });

      expect(result.current.currentView).toBe('week');
    });

    it('should change to day view', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({ initialView: 'month' })
      );

      act(() => {
        result.current.changeView('day');
      });

      expect(result.current.currentView).toBe('day');
    });

    it('should change to year view', () => {
      const { result } = renderHook(() =>
        useCalendarDateNavigation({ initialView: 'month' })
      );

      act(() => {
        result.current.changeView('year');
      });

      expect(result.current.currentView).toBe('year');
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar from collapsed to expanded', () => {
      const { result } = renderHook(() => useCalendarDateNavigation());

      expect(result.current.sidebarCollapsed).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarCollapsed).toBe(true);
    });

    it('should toggle sidebar from expanded to collapsed', () => {
      const { result } = renderHook(() => useCalendarDateNavigation());

      act(() => {
        result.current.setSidebarCollapsed(true);
      });

      expect(result.current.sidebarCollapsed).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarCollapsed).toBe(false);
    });
  });

  describe('setCurrentDate', () => {
    it('should update current date', () => {
      const { result } = renderHook(() => useCalendarDateNavigation());

      const newDate = new Date('2026-12-25');

      act(() => {
        result.current.setCurrentDate(newDate);
      });

      expect(result.current.currentDate).toEqual(newDate);
    });
  });

  describe('setSelectedDate', () => {
    it('should set selected date', () => {
      const { result } = renderHook(() => useCalendarDateNavigation());

      const selectedDate = new Date('2026-06-20');

      act(() => {
        result.current.setSelectedDate(selectedDate);
      });

      expect(result.current.selectedDate).toEqual(selectedDate);
    });

    it('should clear selected date when set to null', () => {
      const { result } = renderHook(() => useCalendarDateNavigation());

      act(() => {
        result.current.setSelectedDate(new Date('2026-06-20'));
        result.current.setSelectedDate(null);
      });

      expect(result.current.selectedDate).toBeNull();
    });
  });

  describe('setCurrentView', () => {
    it('should update current view', () => {
      const { result } = renderHook(() => useCalendarDateNavigation());

      act(() => {
        result.current.setCurrentView('week');
      });

      expect(result.current.currentView).toBe('week');
    });
  });

  describe('setSidebarCollapsed', () => {
    it('should set sidebar collapsed state', () => {
      const { result } = renderHook(() => useCalendarDateNavigation());

      act(() => {
        result.current.setSidebarCollapsed(true);
      });

      expect(result.current.sidebarCollapsed).toBe(true);

      act(() => {
        result.current.setSidebarCollapsed(false);
      });

      expect(result.current.sidebarCollapsed).toBe(false);
    });
  });
});
