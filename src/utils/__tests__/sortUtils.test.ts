import { describe, it, expect } from 'vitest';
import {
  compareValues,
  buildComparator,
  filterValidSorts,
  filterValidGroups,
  sortRowsByDataKey,
  type SortItem,
  type MinimalColumn
} from '../sortUtils';

describe('compareValues', () => {
  describe('null/undefined/empty handling', () => {
    it('should return 0 when both values are null', () => {
      expect(compareValues(null, null, 'text')).toBe(0);
    });

    it('should return 0 when both values are undefined', () => {
      expect(compareValues(undefined, undefined, 'text')).toBe(0);
    });

    it('should return 0 when both values are empty strings', () => {
      expect(compareValues('', '', 'text')).toBe(0);
    });

    it('should put null values last (return 1 when a is null)', () => {
      expect(compareValues(null, 'value', 'text')).toBe(1);
    });

    it('should put null values last (return -1 when b is null)', () => {
      expect(compareValues('value', null, 'text')).toBe(-1);
    });
  });

  describe('number types', () => {
    const numberTypes = ['number', 'decimal', 'currency', 'percent', 'year', 'rating'];

    numberTypes.forEach(type => {
      describe(`type: ${type}`, () => {
        it('should compare numbers correctly (a < b)', () => {
          expect(compareValues(5, 10, type)).toBe(-1);
        });

        it('should compare numbers correctly (a > b)', () => {
          expect(compareValues(10, 5, type)).toBe(1);
        });

        it('should compare numbers correctly (a === b)', () => {
          expect(compareValues(5, 5, type)).toBe(0);
        });

        it('should handle string numbers', () => {
          expect(compareValues('5', '10', type)).toBe(-1);
          expect(compareValues('10', '5', type)).toBe(1);
        });

        it('should handle NaN values', () => {
          expect(compareValues(NaN, NaN, type)).toBe(0);
          expect(compareValues(NaN, 5, type)).toBe(1);
          expect(compareValues(5, NaN, type)).toBe(-1);
        });

        it('should handle negative numbers', () => {
          expect(compareValues(-10, -5, type)).toBe(-1);
          expect(compareValues(-5, -10, type)).toBe(1);
        });

        it('should handle decimal numbers', () => {
          expect(compareValues(5.5, 10.2, type)).toBe(-1);
          expect(compareValues(10.2, 5.5, type)).toBe(1);
        });
      });
    });
  });

  describe('date types', () => {
    const dateTypes = ['date', 'datetime', 'time'];

    dateTypes.forEach(type => {
      describe(`type: ${type}`, () => {
        it('should compare dates correctly (earlier < later)', () => {
          expect(compareValues('2024-01-01', '2024-01-02', type)).toBe(-1);
        });

        it('should compare dates correctly (later > earlier)', () => {
          expect(compareValues('2024-01-02', '2024-01-01', type)).toBe(1);
        });

        it('should compare dates correctly (equal)', () => {
          expect(compareValues('2024-01-01', '2024-01-01', type)).toBe(0);
        });

        it('should handle ISO date strings', () => {
          expect(compareValues('2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z', type)).toBe(-1);
        });

        it('should handle invalid dates (NaN)', () => {
          expect(compareValues('invalid', 'invalid', type)).toBe(0);
          expect(compareValues('invalid', '2024-01-01', type)).toBe(1);
          expect(compareValues('2024-01-01', 'invalid', type)).toBe(-1);
        });
      });
    });
  });

  describe('boolean type', () => {
    it('should compare booleans (true > false)', () => {
      expect(compareValues(true, false, 'boolean')).toBe(-1);
      expect(compareValues(false, true, 'boolean')).toBe(1);
    });

    it('should compare equal booleans', () => {
      expect(compareValues(true, true, 'boolean')).toBe(0);
      expect(compareValues(false, false, 'boolean')).toBe(0);
    });

    it('should handle string booleans', () => {
      expect(compareValues('true', 'false', 'boolean')).toBe(-1);
      expect(compareValues('True', 'False', 'boolean')).toBe(-1);
    });

    it('should handle numeric booleans', () => {
      expect(compareValues('1', '0', 'boolean')).toBe(-1);
      expect(compareValues(1, 0, 'boolean')).toBe(-1);
    });
  });

  describe('multiSelect type', () => {
    it('should compare arrays by joining values', () => {
      expect(compareValues(['a', 'b'], ['a', 'c'], 'multiSelect')).toBe(-1);
      expect(compareValues(['a', 'c'], ['a', 'b'], 'multiSelect')).toBe(1);
    });

    it('should compare equal arrays', () => {
      expect(compareValues(['a', 'b'], ['a', 'b'], 'multiSelect')).toBe(0);
    });

    it('should handle non-array values', () => {
      expect(compareValues('a,b', 'a,c', 'multiSelect')).toBe(-1);
    });

    it('should handle null/undefined in multiSelect', () => {
      expect(compareValues(null, ['a'], 'multiSelect')).toBe(1);
      expect(compareValues(['a'], null, 'multiSelect')).toBe(-1);
    });
  });

  describe('default (text) type', () => {
    it('should compare strings alphabetically', () => {
      expect(compareValues('apple', 'banana', 'text')).toBe(-1);
      expect(compareValues('banana', 'apple', 'text')).toBe(1);
      expect(compareValues('apple', 'apple', 'text')).toBe(0);
    });

    it('should be case-insensitive', () => {
      expect(compareValues('Apple', 'apple', 'text')).toBe(0);
      expect(compareValues('APPLE', 'banana', 'text')).toBe(-1);
    });

    it('should handle numbers as strings (lexicographic comparison)', () => {
      expect(compareValues('10', '2', 'text')).toBe(-1); // String comparison: '1' < '2'
      expect(compareValues('2', '10', 'text')).toBe(1); // String comparison: '2' > '1'
    });
  });
});

describe('buildComparator', () => {
  const mockColumns: MinimalColumn[] = [
    { key: 'name', type: 'text' },
    { key: 'age', type: 'number' },
    { key: 'active', type: 'boolean' }
  ];

  const mockRows = [
    { name: 'Bob', age: 30, active: true },
    { name: 'Alice', age: 25, active: false },
    { name: 'Charlie', age: 35, active: true }
  ];

  it('should sort by single column ascending', () => {
    const sorts: SortItem[] = [{ column: 'name', direction: 'asc' }];
    const getValue = (row: any, key: string) => row[key];
    const comparator = buildComparator(mockColumns, sorts, getValue);

    const sorted = [...mockRows].sort(comparator);
    expect(sorted[0].name).toBe('Alice');
    expect(sorted[1].name).toBe('Bob');
    expect(sorted[2].name).toBe('Charlie');
  });

  it('should sort by single column descending', () => {
    const sorts: SortItem[] = [{ column: 'name', direction: 'desc' }];
    const getValue = (row: any, key: string) => row[key];
    const comparator = buildComparator(mockColumns, sorts, getValue);

    const sorted = [...mockRows].sort(comparator);
    expect(sorted[0].name).toBe('Charlie');
    expect(sorted[1].name).toBe('Bob');
    expect(sorted[2].name).toBe('Alice');
  });

  it('should sort by number column', () => {
    const sorts: SortItem[] = [{ column: 'age', direction: 'asc' }];
    const getValue = (row: any, key: string) => row[key];
    const comparator = buildComparator(mockColumns, sorts, getValue);

    const sorted = [...mockRows].sort(comparator);
    expect(sorted[0].age).toBe(25);
    expect(sorted[1].age).toBe(30);
    expect(sorted[2].age).toBe(35);
  });

  it('should sort by multiple columns (primary and secondary)', () => {
    const rows = [
      { name: 'Bob', age: 30 },
      { name: 'Alice', age: 30 },
      { name: 'Charlie', age: 25 }
    ];
    const sorts: SortItem[] = [
      { column: 'age', direction: 'asc' },
      { column: 'name', direction: 'asc' }
    ];
    const getValue = (row: any, key: string) => row[key];
    const comparator = buildComparator(mockColumns, sorts, getValue);

    const sorted = [...rows].sort(comparator);
    expect(sorted[0].name).toBe('Charlie'); // age 25
    expect(sorted[1].name).toBe('Alice'); // age 30, name 'Alice'
    expect(sorted[2].name).toBe('Bob'); // age 30, name 'Bob'
  });

  it('should ignore sorts for non-existent columns', () => {
    const sorts: SortItem[] = [{ column: 'nonexistent', direction: 'asc' }];
    const getValue = (row: any, key: string) => row[key];
    const comparator = buildComparator(mockColumns, sorts, getValue);

    const sorted = [...mockRows].sort(comparator);
    // Should remain in original order since no valid sort
    expect(sorted).toEqual(mockRows);
  });

  it('should return 0 when all sort values are equal', () => {
    const rows = [
      { name: 'Alice', age: 30 },
      { name: 'Alice', age: 30 }
    ];
    const sorts: SortItem[] = [{ column: 'name', direction: 'asc' }];
    const getValue = (row: any, key: string) => row[key];
    const comparator = buildComparator(mockColumns, sorts, getValue);

    const result = comparator(rows[0], rows[1]);
    expect(result).toBe(0);
  });
});

describe('filterValidSorts', () => {
  it('should return empty array for non-array input', () => {
    expect(filterValidSorts(null as any)).toEqual([]);
    expect(filterValidSorts(undefined as any)).toEqual([]);
    expect(filterValidSorts('not-array' as any)).toEqual([]);
  });

  it('should return empty array for empty array', () => {
    expect(filterValidSorts([])).toEqual([]);
  });

  it('should filter out sorts with empty column', () => {
    const sorts: SortItem[] = [
      { column: '', direction: 'asc' },
      { column: 'name', direction: 'asc' }
    ];
    expect(filterValidSorts(sorts)).toEqual([{ column: 'name', direction: 'asc' }]);
  });

  it('should filter out sorts with whitespace-only column', () => {
    const sorts: SortItem[] = [
      { column: '   ', direction: 'asc' },
      { column: 'name', direction: 'asc' }
    ];
    expect(filterValidSorts(sorts)).toEqual([{ column: 'name', direction: 'asc' }]);
  });

  it('should filter out sorts with missing direction', () => {
    const sorts: SortItem[] = [
      { column: 'name', direction: 'asc' },
      { column: 'age', direction: '' as any }
    ];
    expect(filterValidSorts(sorts)).toEqual([{ column: 'name', direction: 'asc' }]);
  });

  it('should keep valid sorts', () => {
    const sorts: SortItem[] = [
      { column: 'name', direction: 'asc' },
      { column: 'age', direction: 'desc' }
    ];
    expect(filterValidSorts(sorts)).toEqual(sorts);
  });

  it('should handle mixed valid and invalid sorts', () => {
    const sorts: SortItem[] = [
      { column: 'name', direction: 'asc' },
      { column: '', direction: 'desc' },
      { column: 'age', direction: 'desc' },
      { column: '   ', direction: 'asc' }
    ];
    const result = filterValidSorts(sorts);
    expect(result).toEqual([
      { column: 'name', direction: 'asc' },
      { column: 'age', direction: 'desc' }
    ]);
  });
});

describe('filterValidGroups', () => {
  it('should return empty array for non-array input', () => {
    expect(filterValidGroups(null as any)).toEqual([]);
    expect(filterValidGroups(undefined as any)).toEqual([]);
  });

  it('should return empty array for empty array', () => {
    expect(filterValidGroups([])).toEqual([]);
  });

  it('should filter out groups with empty column', () => {
    const groups = [
      { column: '', direction: 'asc' },
      { column: 'name', direction: 'asc' }
    ];
    expect(filterValidGroups(groups)).toEqual([{ column: 'name', direction: 'asc' }]);
  });

  it('should filter out groups with whitespace-only column', () => {
    const groups = [
      { column: '   ', direction: 'asc' },
      { column: 'name', direction: 'asc' }
    ];
    expect(filterValidGroups(groups)).toEqual([{ column: 'name', direction: 'asc' }]);
  });

  it('should filter out groups with undefined direction', () => {
    const groups = [
      { column: 'name', direction: 'asc' },
      { column: 'age', direction: undefined }
    ];
    expect(filterValidGroups(groups)).toEqual([{ column: 'name', direction: 'asc' }]);
  });

  it('should filter out groups with null direction', () => {
    const groups = [
      { column: 'name', direction: 'asc' },
      { column: 'age', direction: null as any }
    ];
    expect(filterValidGroups(groups)).toEqual([{ column: 'name', direction: 'asc' }]);
  });

  it('should keep valid groups', () => {
    const groups = [
      { column: 'name', direction: 'asc' },
      { column: 'age', direction: 'desc' }
    ];
    expect(filterValidGroups(groups)).toEqual(groups);
  });
});

describe('sortRowsByDataKey', () => {
  const columns: MinimalColumn[] = [
    { key: 'name', type: 'text' },
    { key: 'age', type: 'number' }
  ];

  const rows = [
    { data: { name: 'Bob', age: 30 } },
    { data: { name: 'Alice', age: 25 } },
    { data: { name: 'Charlie', age: 35 } }
  ];

  it('should sort rows by single column', () => {
    const sorts: SortItem[] = [{ column: 'name', direction: 'asc' }];
    const result = sortRowsByDataKey(columns, sorts, rows);

    expect(result[0].data.name).toBe('Alice');
    expect(result[1].data.name).toBe('Bob');
    expect(result[2].data.name).toBe('Charlie');
  });

  it('should sort rows by number column', () => {
    const sorts: SortItem[] = [{ column: 'age', direction: 'asc' }];
    const result = sortRowsByDataKey(columns, sorts, rows);

    expect(result[0].data.age).toBe(25);
    expect(result[1].data.age).toBe(30);
    expect(result[2].data.age).toBe(35);
  });

  it('should return original array when no valid sorts', () => {
    const sorts: SortItem[] = [];
    const result = sortRowsByDataKey(columns, sorts, rows);
    expect(result).toEqual(rows);
  });

  it('should return original array when all sorts are invalid', () => {
    const sorts: SortItem[] = [
      { column: '', direction: 'asc' },
      { column: '   ', direction: 'desc' }
    ];
    const result = sortRowsByDataKey(columns, sorts, rows);
    expect(result).toEqual(rows);
  });

  it('should not mutate original array', () => {
    const sorts: SortItem[] = [{ column: 'name', direction: 'asc' }];
    const original = [...rows];
    sortRowsByDataKey(columns, sorts, rows);
    expect(rows).toEqual(original);
  });

  it('should handle rows with missing data property', () => {
    const rowsWithMissing = [
      { data: { name: 'Bob', age: 30 } },
      { data: undefined as any },
      { data: { name: 'Alice', age: 25 } }
    ];
    const sorts: SortItem[] = [{ column: 'name', direction: 'asc' }];
    const result = sortRowsByDataKey(columns, sorts, rowsWithMissing);
    // Should not crash and should handle undefined data
    expect(result).toHaveLength(3);
  });
});

