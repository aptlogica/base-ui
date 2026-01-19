import { useState, useCallback } from 'react';

export interface SearchField {
  key: string;
  title: string;
  type: string;
  icon?: React.ReactNode;
}

// Hook for managing search state
export const useSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState<SearchField | null>(null);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  const handleSearch = useCallback((term: string, field: SearchField | null) => {
    setSearchTerm(term);
    setSelectedField(field);
  }, []);

  const filterData = useCallback((data: any[], fields: SearchField[]) => {
    if (!searchTerm.trim()) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(item => {
      if (selectedField?.key) {
        // Search in specific field
        const value = item.data?.[selectedField.key] ?? item[selectedField.key];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      } else {
        // Search across all fields
        return fields.some(field => {
          const value = item.data?.[field.key] ?? item[field.key];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
      }
    });

    setFilteredData(filtered);
  }, [searchTerm, selectedField]);

  return {
    searchTerm,
    selectedField,
    filteredData,
    handleSearch,
    filterData,
    setSearchTerm,
    setSelectedField
  };
}; 