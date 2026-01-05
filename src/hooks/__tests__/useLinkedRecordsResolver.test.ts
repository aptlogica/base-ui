import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLinkedRecordsForField } from '../useLinkedRecordsResolver';
import * as useApi from '../useApi';

// Mock dependencies
vi.mock('../useApi');

describe('useLinkedRecordsForField', () => {
  const mockUseTable = vi.mocked(useApi.useTable);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTable.mockReturnValue({ 
      data: null, 
      isLoading: false, 
      error: null 
    } as any);
  });

  describe('linked ID extraction', () => {
    it('should extract IDs from array link values in data property', () => {
      const allRecords = [
        { id: 1, data: { contacts: [101, 102] } },
        { id: 2, data: { contacts: [103] } }
      ];

      const mockTargetData = {
        data: {
          records: [
            { id: 101, name: 'Contact 1' },
            { id: 102, name: 'Contact 2' },
            { id: 103, name: 'Contact 3' }
          ]
        }
      };

      mockUseTable.mockReturnValue({ 
        data: mockTargetData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => 
        useLinkedRecordsForField(allRecords, 'contacts', 'table-contacts')
      );

      expect(result.current.size).toBeGreaterThan(0);
      expect(result.current.get(101)).toEqual({ id: 101, name: 'Contact 1' });
      expect(result.current.get(102)).toEqual({ id: 102, name: 'Contact 2' });
      expect(result.current.get(103)).toEqual({ id: 103, name: 'Contact 3' });
    });

    it('should extract IDs from direct property access', () => {
      const allRecords = [
        { id: 1, contacts: [101, 102] },
        { id: 2, contacts: [103] }
      ];

      const mockTargetData = {
        data: {
          records: [
            { id: 101, name: 'Contact 1' },
            { id: 103, name: 'Contact 3' }
          ]
        }
      };

      mockUseTable.mockReturnValue({ 
        data: mockTargetData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => 
        useLinkedRecordsForField(allRecords, 'contacts', 'table-contacts')
      );

      expect(result.current.get(101)).toBeDefined();
      expect(result.current.get(103)).toBeDefined();
    });

    it('should extract single ID values', () => {
      const allRecords = [
        { id: 1, data: { owner: 201 } },
        { id: 2, data: { owner: 202 } }
      ];

      const mockTargetData = {
        data: {
          records: [
            { id: 201, name: 'User 1' },
            { id: 202, name: 'User 2' }
          ]
        }
      };

      mockUseTable.mockReturnValue({ 
        data: mockTargetData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => 
        useLinkedRecordsForField(allRecords, 'owner', 'table-users')
      );

      expect(result.current.get(201)).toEqual({ id: 201, name: 'User 1' });
      expect(result.current.get(202)).toEqual({ id: 202, name: 'User 2' });
    });

    it('should skip null and undefined values', () => {
      const allRecords = [
        { id: 1, data: { contacts: [101, null, undefined, 102] } },
        { id: 2, data: { contacts: null } },
        { id: 3, data: { contacts: undefined } }
      ];

      const mockTargetData = {
        data: {
          records: [
            { id: 101, name: 'Contact 1' },
            { id: 102, name: 'Contact 2' }
          ]
        }
      };

      mockUseTable.mockReturnValue({ 
        data: mockTargetData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => 
        useLinkedRecordsForField(allRecords, 'contacts', 'table-contacts')
      );

      expect(result.current.get(101)).toBeDefined();
      expect(result.current.get(102)).toBeDefined();
    });

    it('should skip empty string values', () => {
      const allRecords = [
        { id: 1, data: { contacts: [101, '', 102] } }
      ];

      const mockTargetData = {
        data: {
          records: [
            { id: 101, name: 'Contact 1' },
            { id: 102, name: 'Contact 2' }
          ]
        }
      };

      mockUseTable.mockReturnValue({ 
        data: mockTargetData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => 
        useLinkedRecordsForField(allRecords, 'contacts', 'table-contacts')
      );

      expect(result.current.get(101)).toBeDefined();
      expect(result.current.get(102)).toBeDefined();
    });
  });

  describe('ID mapping', () => {
    it('should map IDs as number, string, and Number', () => {
      const allRecords = [
        { id: 1, data: { contact: 101 } }
      ];

      const mockTargetData = {
        data: {
          records: [
            { id: 101, name: 'Contact 1' }
          ]
        }
      };

      mockUseTable.mockReturnValue({ 
        data: mockTargetData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => 
        useLinkedRecordsForField(allRecords, 'contact', 'table-contacts')
      );

      const record = { id: 101, name: 'Contact 1' };
      expect(result.current.get(101)).toEqual(record);
      expect(result.current.get('101')).toEqual(record);
      expect(result.current.get(Number(101))).toEqual(record);
    });

    it('should handle string IDs from target table', () => {
      const allRecords = [
        { id: 1, data: { item: 'abc-123' } }
      ];

      const mockTargetData = {
        data: {
          records: [
            { id: 'abc-123', name: 'Item 1' }
          ]
        }
      };

      mockUseTable.mockReturnValue({ 
        data: mockTargetData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => 
        useLinkedRecordsForField(allRecords, 'item', 'table-items')
      );

      expect(result.current.get('abc-123')).toBeDefined();
    });
  });

  describe('empty states', () => {
    it('should return empty map when no target data', () => {
      const allRecords = [
        { id: 1, data: { contacts: [101, 102] } }
      ];

      mockUseTable.mockReturnValue({ 
        data: null, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => 
        useLinkedRecordsForField(allRecords, 'contacts', 'table-contacts')
      );

      expect(result.current.size).toBe(0);
    });

    it('should return empty map when no records in target table', () => {
      const allRecords = [
        { id: 1, data: { contacts: [101, 102] } }
      ];

      mockUseTable.mockReturnValue({ 
        data: { data: { records: [] } }, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => 
        useLinkedRecordsForField(allRecords, 'contacts', 'table-contacts')
      );

      expect(result.current.size).toBe(0);
    });

    it('should return empty map when no linked IDs in source records', () => {
      const allRecords = [
        { id: 1, data: {} },
        { id: 2, data: { contacts: [] } }
      ];

      mockUseTable.mockReturnValue({ 
        data: { 
          data: { 
            records: [
              { id: 101, name: 'Contact 1' }
            ] 
          } 
        }, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => 
        useLinkedRecordsForField(allRecords, 'contacts', 'table-contacts')
      );

      expect(result.current.size).toBe(0);
    });

    it('should return empty map for empty allRecords', () => {
      mockUseTable.mockReturnValue({ 
        data: { 
          data: { 
            records: [
              { id: 101, name: 'Contact 1' }
            ] 
          } 
        }, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => 
        useLinkedRecordsForField([], 'contacts', 'table-contacts')
      );

      expect(result.current.size).toBe(0);
    });
  });

  describe('multiple records with same links', () => {
    it('should deduplicate linked IDs across records', () => {
      const allRecords = [
        { id: 1, data: { contacts: [101, 102] } },
        { id: 2, data: { contacts: [102, 103] } },
        { id: 3, data: { contacts: [101] } }
      ];

      const mockTargetData = {
        data: {
          records: [
            { id: 101, name: 'Contact 1' },
            { id: 102, name: 'Contact 2' },
            { id: 103, name: 'Contact 3' }
          ]
        }
      };

      mockUseTable.mockReturnValue({ 
        data: mockTargetData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => 
        useLinkedRecordsForField(allRecords, 'contacts', 'table-contacts')
      );

      // Should have all three unique contacts
      expect(result.current.get(101)).toBeDefined();
      expect(result.current.get(102)).toBeDefined();
      expect(result.current.get(103)).toBeDefined();
    });
  });

  describe('data property variations', () => {
    it('should handle records without data wrapper', () => {
      const allRecords = [
        { id: 1, contacts: [101] }
      ];

      const mockTargetData = {
        data: {
          records: [
            { id: 101, name: 'Contact 1' }
          ]
        }
      };

      mockUseTable.mockReturnValue({ 
        data: mockTargetData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => 
        useLinkedRecordsForField(allRecords, 'contacts', 'table-contacts')
      );

      expect(result.current.get(101)).toBeDefined();
    });
  });

  describe('missing linked records', () => {
    it('should not include linked IDs that are not in target table', () => {
      const allRecords = [
        { id: 1, data: { contacts: [101, 102, 999] } }
      ];

      const mockTargetData = {
        data: {
          records: [
            { id: 101, name: 'Contact 1' },
            { id: 102, name: 'Contact 2' }
          ]
        }
      };

      mockUseTable.mockReturnValue({ 
        data: mockTargetData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => 
        useLinkedRecordsForField(allRecords, 'contacts', 'table-contacts')
      );

      expect(result.current.get(101)).toBeDefined();
      expect(result.current.get(102)).toBeDefined();
      expect(result.current.get(999)).toBeUndefined();
    });
  });
});
