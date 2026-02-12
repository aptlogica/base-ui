import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableSort } from '../useTableSort';

describe('useTableSort', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default sort state', () => {
      const { result } = renderHook(() => useTableSort());

      expect(result.current.sortConfig).toEqual({
        column: null,
        direction: 'asc',
      });
      expect(typeof result.current.handleSort).toBe('function');
    });
  });

  describe('handleSort functionality', () => {
    it('should set initial sort for new column', () => {
      const { result } = renderHook(() => useTableSort());

      act(() => {
        result.current.handleSort('name');
      });

      expect(result.current.sortConfig).toEqual({
        column: 'name',
        direction: 'asc',
      });
    });

    it('should toggle direction for same column', () => {
      const { result } = renderHook(() => useTableSort());

      // First sort on 'name' column
      act(() => {
        result.current.handleSort('name');
      });

      expect(result.current.sortConfig).toEqual({
        column: 'name',
        direction: 'asc',
      });

      // Second sort on same column should toggle to desc
      act(() => {
        result.current.handleSort('name');
      });

      expect(result.current.sortConfig).toEqual({
        column: 'name',
        direction: 'desc',
      });

      // Third sort on same column should toggle back to asc
      act(() => {
        result.current.handleSort('name');
      });

      expect(result.current.sortConfig).toEqual({
        column: 'name',
        direction: 'asc',
      });
    });

    it('should reset to asc when switching columns', () => {
      const { result } = renderHook(() => useTableSort());

      // Sort by 'name' column desc
      act(() => {
        result.current.handleSort('name');
      });
      act(() => {
        result.current.handleSort('name');
      });

      expect(result.current.sortConfig).toEqual({
        column: 'name',
        direction: 'desc',
      });

      // Switch to 'email' column should start with asc
      act(() => {
        result.current.handleSort('email');
      });

      expect(result.current.sortConfig).toEqual({
        column: 'email',
        direction: 'asc',
      });
    });

    it('should handle multiple column switches correctly', () => {
      const { result } = renderHook(() => useTableSort());

      // Sort by multiple columns in sequence
      const columns = ['name', 'email', 'age', 'status'];
      
      columns.forEach(column => {
        act(() => {
          result.current.handleSort(column);
        });

        expect(result.current.sortConfig).toEqual({
          column,
          direction: 'asc',
        });
      });
    });

    it('should maintain sort direction when called rapidly', () => {
      const { result } = renderHook(() => useTableSort());

      // Rapidly toggle same column
      act(() => {
        result.current.handleSort('name');
        result.current.handleSort('name');
        result.current.handleSort('name');
        result.current.handleSort('name');
      });

      // Starting from null, 4 toggles: null->asc->desc->asc->desc
      expect(result.current.sortConfig).toEqual({
        column: 'name',
        direction: 'desc',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string column name', () => {
      const { result } = renderHook(() => useTableSort());

      act(() => {
        result.current.handleSort('');
      });

      expect(result.current.sortConfig).toEqual({
        column: '',
        direction: 'asc',
      });
    });

    it('should handle numeric column names as strings', () => {
      const { result } = renderHook(() => useTableSort());

      act(() => {
        result.current.handleSort('123');
      });

      expect(result.current.sortConfig).toEqual({
        column: '123',
        direction: 'asc',
      });
    });

    it('should handle column names with special characters', () => {
      const { result } = renderHook(() => useTableSort());
      const specialColumn = 'column-with-dashes_and_underscores.and.dots';

      act(() => {
        result.current.handleSort(specialColumn);
      });

      expect(result.current.sortConfig).toEqual({
        column: specialColumn,
        direction: 'asc',
      });
    });

    it('should handle very long column names', () => {
      const { result } = renderHook(() => useTableSort());
      const longColumn = 'a'.repeat(1000);

      act(() => {
        result.current.handleSort(longColumn);
      });

      expect(result.current.sortConfig).toEqual({
        column: longColumn,
        direction: 'asc',
      });
    });

    it('should handle column names with unicode characters', () => {
      const { result } = renderHook(() => useTableSort());
      const unicodeColumn = '名前_😀_тест';

      act(() => {
        result.current.handleSort(unicodeColumn);
      });

      expect(result.current.sortConfig).toEqual({
        column: unicodeColumn,
        direction: 'asc',
      });
    });
  });

  describe('callback stability', () => {
    it('should maintain handleSort reference across renders', () => {
      const { result, rerender } = renderHook(() => useTableSort());

      const initialHandleSort = result.current.handleSort;

      rerender();

      expect(result.current.handleSort).toBe(initialHandleSort);
    });

    it('should maintain handleSort reference after state changes', () => {
      const { result } = renderHook(() => useTableSort());

      const initialHandleSort = result.current.handleSort;

      act(() => {
        result.current.handleSort('name');
      });

      expect(result.current.handleSort).toBe(initialHandleSort);
    });
  });

  describe('state consistency', () => {
    it('should maintain consistent state through multiple operations', () => {
      const { result } = renderHook(() => useTableSort());

      // Test sequence: null -> name:asc -> name:desc -> email:asc -> email:desc
      const expectedStates = [
        { column: null, direction: 'asc' }, // initial
        { column: 'name', direction: 'asc' }, // sort by name
        { column: 'name', direction: 'desc' }, // toggle name
        { column: 'email', direction: 'asc' }, // sort by email
        { column: 'email', direction: 'desc' }, // toggle email
      ];

      // Initial state
      expect(result.current.sortConfig).toEqual(expectedStates[0]);

      // Sort by name
      act(() => {
        result.current.handleSort('name');
      });
      expect(result.current.sortConfig).toEqual(expectedStates[1]);

      // Toggle name to desc
      act(() => {
        result.current.handleSort('name');
      });
      expect(result.current.sortConfig).toEqual(expectedStates[2]);

      // Sort by email
      act(() => {
        result.current.handleSort('email');
      });
      expect(result.current.sortConfig).toEqual(expectedStates[3]);

      // Toggle email to desc
      act(() => {
        result.current.handleSort('email');
      });
      expect(result.current.sortConfig).toEqual(expectedStates[4]);
    });

    it('should not mutate previous state objects', () => {
      const { result } = renderHook(() => useTableSort());

      const initialState = result.current.sortConfig;

      act(() => {
        result.current.handleSort('name');
      });

      const afterFirstSort = result.current.sortConfig;

      act(() => {
        result.current.handleSort('name');
      });

      const afterSecondSort = result.current.sortConfig;

      // Each state should be a different object
      expect(initialState).not.toBe(afterFirstSort);
      expect(afterFirstSort).not.toBe(afterSecondSort);
      expect(initialState).not.toBe(afterSecondSort);

      // Original states should be unchanged
      expect(initialState).toEqual({ column: null, direction: 'asc' });
      expect(afterFirstSort).toEqual({ column: 'name', direction: 'asc' });
      expect(afterSecondSort).toEqual({ column: 'name', direction: 'desc' });
    });
  });
});