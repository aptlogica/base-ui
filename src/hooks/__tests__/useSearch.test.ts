import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch, SearchField } from '../useSearch';

describe('useSearch', () => {
  const mockFields: SearchField[] = [
    { key: 'name', title: 'Name', type: 'text' },
    { key: 'email', title: 'Email', type: 'text' },
    { key: 'age', title: 'Age', type: 'number' }
  ];

  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', age: 35 }
  ];

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSearch());
    
    expect(result.current.searchTerm).toBe('');
    expect(result.current.selectedField).toBeNull();
    expect(result.current.filteredData).toEqual([]);
  });

  it('should initialize with provided fields', () => {
    const { result } = renderHook(() => useSearch());
    
    expect(result.current.searchTerm).toBe('');
    expect(result.current.selectedField).toBeNull();
  });

  it('should handle search with term and field', () => {
    const { result } = renderHook(() => useSearch());
    
    act(() => {
      result.current.handleSearch('John', mockFields[0]);
    });
    
    expect(result.current.searchTerm).toBe('John');
    expect(result.current.selectedField).toEqual(mockFields[0]);
  });

  it('should handle search with term and null field', () => {
    const { result } = renderHook(() => useSearch());
    
    act(() => {
      result.current.handleSearch('test', null);
    });
    
    expect(result.current.searchTerm).toBe('test');
    expect(result.current.selectedField).toBeNull();
  });

  it('should return all data when search term is empty', () => {
    const { result } = renderHook(() => useSearch());
    
    act(() => {
      result.current.filterData(mockData, mockFields);
    });
    
    expect(result.current.filteredData).toEqual(mockData);
  });

  it('should filter data by specific field', () => {
    const { result } = renderHook(() => useSearch());
    
    act(() => {
      result.current.setSearchTerm('John');
      result.current.setSelectedField(mockFields[0]);
    });
    
    act(() => {
      result.current.filterData(mockData, mockFields);
    });
    
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].name).toBe('John Doe');
  });

  it('should filter data across all fields when no specific field is selected', () => {
    const { result } = renderHook(() => useSearch());
    
    act(() => {
      result.current.handleSearch('example', null);
      result.current.filterData(mockData, mockFields);
    });
    
    expect(result.current.filteredData).toHaveLength(3);
  });

  it('should filter data case-insensitively', () => {
    const { result } = renderHook(() => useSearch());
    
    act(() => {
      result.current.setSearchTerm('JOHN');
      result.current.setSelectedField(mockFields[0]);
    });
    
    act(() => {
      result.current.filterData(mockData, mockFields);
    });
    
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].name).toBe('John Doe');
  });

  it('should handle data with nested data property', () => {
    const nestedData = [
      { id: 1, data: { name: 'John Doe', email: 'john@example.com' } },
      { id: 2, data: { name: 'Jane Smith', email: 'jane@example.com' } }
    ];
    
    const { result } = renderHook(() => useSearch());
    
    act(() => {
      result.current.handleSearch('John', mockFields[0]);
    });
    
    act(() => {
      result.current.filterData(nestedData, mockFields);
    });
    
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].data.name).toBe('John Doe');
  });

  it('should return empty array when no matches found', () => {
    const { result } = renderHook(() => useSearch());
    
    act(() => {
      result.current.handleSearch('NonExistent', mockFields[0]);
    });
    
    act(() => {
      result.current.filterData(mockData, mockFields);
    });
    
    expect(result.current.filteredData).toHaveLength(0);
  });

  it('should handle numeric search values', () => {
    const { result } = renderHook(() => useSearch());
    
    act(() => {
      result.current.handleSearch('30', mockFields[2]);
    });
    
    act(() => {
      result.current.filterData(mockData, mockFields);
    });
    
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].age).toBe(30);
  });

  it('should update search term directly', () => {
    const { result } = renderHook(() => useSearch());
    
    act(() => {
      result.current.setSearchTerm('test');
    });
    
    expect(result.current.searchTerm).toBe('test');
  });

  it('should update selected field directly', () => {
    const { result } = renderHook(() => useSearch());
    
    act(() => {
      result.current.setSelectedField(mockFields[1]);
    });
    
    expect(result.current.selectedField).toEqual(mockFields[1]);
  });

  it('should handle search with whitespace-only term', () => {
    const { result } = renderHook(() => useSearch());
    
    act(() => {
      result.current.handleSearch('   ', null);
      result.current.filterData(mockData, mockFields);
    });
    
    expect(result.current.filteredData).toEqual(mockData);
  });

  it('should return all data when search term is whitespace even with selected field', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSelectedField(mockFields[0]);
      result.current.setSearchTerm('   ');
      result.current.filterData(mockData, mockFields);
    });

    expect(result.current.filteredData).toEqual(mockData);
  });

  it('should exclude items when selected field value is missing', () => {
    const dataWithMissing = [
      { id: 1, name: 'Alice' },
      { id: 2, data: {} },
    ];
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.handleSearch('alice', mockFields[0]);
    });

    act(() => {
      result.current.filterData(dataWithMissing, mockFields);
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].name).toBe('Alice');
  });
});
