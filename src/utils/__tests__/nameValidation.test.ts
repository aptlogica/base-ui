import { describe, it, expect } from 'vitest';
import {
  isNameDuplicate,
  generateUniqueName,
  validateTableName,
  validateViewName,
  getDefaultTableName,
  validateBaseName,
  getDefaultViewName
} from '../nameValidation';
import type { ExistingItem } from '../nameValidation';

describe('isNameDuplicate', () => {
  const mockItems: ExistingItem[] = [
    { id: '1', name: 'Table 1' },
    { id: '2', title: 'Table 2' },
    { id: '3', key: 'table-3' },
    { id: '4', model: { id: '4', title: 'Table 4' } }
  ];

  it('should return false for empty array', () => {
    expect(isNameDuplicate('Table 1', [])).toBe(false);
  });

  it('should return false for non-array input', () => {
    expect(isNameDuplicate('Table 1', null as any)).toBe(false);
  });

  it('should detect duplicate by name', () => {
    expect(isNameDuplicate('Table 1', mockItems)).toBe(true);
  });

  it('should detect duplicate by title', () => {
    expect(isNameDuplicate('Table 2', mockItems)).toBe(true);
  });

  it('should detect duplicate by key', () => {
    expect(isNameDuplicate('table-3', mockItems)).toBe(true);
  });

  it('should detect duplicate by model.title', () => {
    expect(isNameDuplicate('Table 4', mockItems)).toBe(true);
  });

  it('should be case-insensitive', () => {
    expect(isNameDuplicate('table 1', mockItems)).toBe(true);
    expect(isNameDuplicate('TABLE 1', mockItems)).toBe(true);
  });

  it('should ignore whitespace', () => {
    expect(isNameDuplicate('  Table 1  ', mockItems)).toBe(true);
  });

  it('should return false for unique name', () => {
    expect(isNameDuplicate('Unique Table', mockItems)).toBe(false);
  });

  it('should skip current item when editing', () => {
    expect(isNameDuplicate('Table 1', mockItems, '1')).toBe(false);
  });

  it('should skip current item by key', () => {
    expect(isNameDuplicate('table-3', mockItems, 'table-3')).toBe(false);
  });

  it('should skip current item by model.id', () => {
    expect(isNameDuplicate('Table 4', mockItems, '4')).toBe(false);
  });

  it('should handle items with no name fields', () => {
    const items: ExistingItem[] = [{ id: '1' }];
    expect(isNameDuplicate('test', items)).toBe(false);
  });
});

describe('generateUniqueName', () => {
  const mockItems: ExistingItem[] = [
    { id: '1', name: 'Table' },
    { id: '2', name: 'Table 1' },
    { id: '3', name: 'Table 2' }
  ];

  it('should return base name if no existing items', () => {
    expect(generateUniqueName('Table', [])).toBe('Table');
  });

  it('should return base name if unique', () => {
    expect(generateUniqueName('Unique', mockItems)).toBe('Unique');
  });

  it('should append number if name exists', () => {
    expect(generateUniqueName('Table', mockItems)).toBe('Table 3');
  });

  it('should find next available number', () => {
    const items: ExistingItem[] = [
      { id: '1', name: 'Table' },
      { id: '2', name: 'Table 1' },
      { id: '3', name: 'Table 3' } // Missing Table 2
    ];
    expect(generateUniqueName('Table', items)).toBe('Table 2');
  });

  it('should handle case-insensitive comparison', () => {
    const items: ExistingItem[] = [{ id: '1', name: 'table' }];
    expect(generateUniqueName('Table', items)).toBe('Table 1');
  });

  it('should handle whitespace in base name', () => {
    expect(generateUniqueName('  Table  ', mockItems)).toBe('Table 3');
  });

  it('should increment until unique name found', () => {
    const items: ExistingItem[] = [
      { id: '1', name: 'Table' },
      { id: '2', name: 'Table 1' },
      { id: '3', name: 'Table 2' },
      { id: '4', name: 'Table 3' },
      { id: '5', name: 'Table 4' }
    ];
    expect(generateUniqueName('Table', items)).toBe('Table 5');
  });
});

describe('validateTableName', () => {
  const existingTables: ExistingItem[] = [
    { id: '1', name: 'Existing Table' }
  ];

  it('should return error for empty name', () => {
    const result = validateTableName('', existingTables);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Table name is required');
  });

  it('should return error for whitespace-only name', () => {
    const result = validateTableName('   ', existingTables);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Table name is required');
  });

  it('should return error for name too short', () => {
    const result = validateTableName('ab', existingTables);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Table name must be at least 3 characters');
  });

  it('should return error for name too long', () => {
    const longName = 'a'.repeat(51);
    const result = validateTableName(longName, existingTables);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Table name must be less than 50 characters');
  });

  it('should return error for duplicate name', () => {
    const result = validateTableName('Existing Table', existingTables);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Table name already exists');
  });

  it('should return valid for unique name', () => {
    const result = validateTableName('New Table', existingTables);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should allow editing same item', () => {
    const result = validateTableName('Existing Table', existingTables, '1');
    expect(result.isValid).toBe(true);
  });

  it('should accept minimum length name', () => {
    const result = validateTableName('abc', existingTables);
    expect(result.isValid).toBe(true);
  });

  it('should accept maximum length name', () => {
    const longName = 'a'.repeat(50);
    const result = validateTableName(longName, existingTables);
    expect(result.isValid).toBe(true);
  });
});

describe('validateViewName', () => {
  const existingViews: ExistingItem[] = [
    { id: '1', name: 'Existing View' }
  ];

  it('should return error for empty name', () => {
    const result = validateViewName('', existingViews);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('View name is required');
  });

  it('should return error for name too short', () => {
    const result = validateViewName('ab', existingViews);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('View name must be at least 3 characters');
  });

  it('should return error for name too long', () => {
    const longName = 'a'.repeat(51);
    const result = validateViewName(longName, existingViews);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('View name must be less than 50 characters');
  });

  it('should return error for duplicate name', () => {
    const result = validateViewName('Existing View', existingViews);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('View name already exists');
  });

  it('should return valid for unique name', () => {
    const result = validateViewName('New View', existingViews);
    expect(result.isValid).toBe(true);
  });

  it('should allow editing same item', () => {
    const result = validateViewName('Existing View', existingViews, '1');
    expect(result.isValid).toBe(true);
  });
});

describe('getDefaultTableName', () => {
  it('should return "New Table" when no existing tables', () => {
    expect(getDefaultTableName([])).toBe('New Table');
  });

  it('should return "New Table 1" when "New Table" exists', () => {
    const existing: ExistingItem[] = [{ id: '1', name: 'New Table' }];
    expect(getDefaultTableName(existing)).toBe('New Table 1');
  });

  it('should find next available number', () => {
    const existing: ExistingItem[] = [
      { id: '1', name: 'New Table' },
      { id: '2', name: 'New Table 1' }
    ];
    expect(getDefaultTableName(existing)).toBe('New Table 2');
  });
});

describe('validateBaseName', () => {
  const existingBases: ExistingItem[] = [
    { id: '1', name: 'Existing Base' }
  ];

  it('should return error for empty name', () => {
    const result = validateBaseName('', existingBases);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Base name is required');
  });

  it('should return error for name too short', () => {
    const result = validateBaseName('ab', existingBases);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Base name must be at least 3 characters');
  });

  it('should return error for name too long', () => {
    const longName = 'a'.repeat(51);
    const result = validateBaseName(longName, existingBases);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Base name must be less than 50 characters');
  });

  it('should return error for duplicate name', () => {
    const result = validateBaseName('Existing Base', existingBases);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Base name already exists');
  });

  it('should return valid for unique name', () => {
    const result = validateBaseName('New Base', existingBases);
    expect(result.isValid).toBe(true);
  });

  it('should allow editing same item', () => {
    const result = validateBaseName('Existing Base', existingBases, '1');
    expect(result.isValid).toBe(true);
  });
});

describe('getDefaultViewName', () => {
  it('should generate name for grid view', () => {
    const result = getDefaultViewName('grid', []);
    expect(result).toBe('Grid View');
  });

  it('should generate name for kanban view', () => {
    const result = getDefaultViewName('kanban', []);
    expect(result).toBe('Kanban View');
  });

  it('should handle camelCase view types', () => {
    const result = getDefaultViewName('ganttChart', []);
    expect(result).toContain('View');
  });

  it('should append number when name exists', () => {
    const existing: ExistingItem[] = [{ id: '1', name: 'Grid View' }];
    const result = getDefaultViewName('grid', existing);
    expect(result).toBe('Grid View 1');
  });

  it('should find next available number', () => {
    const existing: ExistingItem[] = [
      { id: '1', name: 'Grid View' },
      { id: '2', name: 'Grid View 1' }
    ];
    const result = getDefaultViewName('grid', existing);
    expect(result).toBe('Grid View 2');
  });
});

