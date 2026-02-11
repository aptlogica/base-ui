/**
 * Simple and reliable name validation utilities
 */

export interface ExistingItem {
  id?: string;
  name?: string;
  title?: string;
  key?: string;
  model?: {
    id?: string;
    title?: string;
  };
}

/**
 * Checks if a name already exists in a list of items
 */
export const isNameDuplicate = (
  name: string,
  existingItems: ExistingItem[],
  currentItemId?: string
): boolean => {
  if (!Array.isArray(existingItems) || existingItems.length === 0) {
    return false;
  }

  const trimmedName = name.trim().toLowerCase();
  
  return existingItems.some(item => {
    // For baseTables structure: item.model.title
    // For other structures: item.name, item.title, item.key
    const itemName = (
      item.model?.title ||  // Primary for baseTables
      item.name || 
      item.title || 
      item.key || 
      ''
    ).trim().toLowerCase();
    
    // Skip if it's the same item (for editing)
    const isSameItem = currentItemId && (
      item.id === currentItemId || 
      item.key === currentItemId || 
      item.model?.id === currentItemId
    );
    
    return itemName === trimmedName && !isSameItem;
  });
};

/**
 * Generates a unique name by appending a number
 */
export const generateUniqueName = (
  baseName: string,
  existingItems: ExistingItem[],
): string => {
  const trimmedName = baseName.trim();
  
  if (!Array.isArray(existingItems) || existingItems.length === 0) {
    return trimmedName;
  }

  // Get all existing names (case-insensitive)
  const existingNames = new Set(
    existingItems.map(item =>
      (item.model?.title || item.name || item.title || item.key || '').trim().toLowerCase()
    )
  );

  // If the base name is unique, return it
  if (!existingNames.has(trimmedName.toLowerCase())) {
    return trimmedName;
  }

  // Find the next available number
  let counter = 1;
  let candidateName = `${trimmedName} ${counter}`;
  
  while (existingNames.has(candidateName.toLowerCase())) {
    counter++;
    candidateName = `${trimmedName} ${counter}`;
  }

  return candidateName;
};

/**
 * Validates table name
 */
export const validateTableName = (
  name: string,
  existingTables: ExistingItem[],
  currentItemId?: string
): { isValid: boolean; error?: string } => {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, error: 'Table name is required' };
  }

  if (trimmedName.length < 3) {
    return { isValid: false, error: 'Table name must be at least 3 characters' };
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Table name must be less than 50 characters' };
  }

  if (isNameDuplicate(trimmedName, existingTables, currentItemId)) {
    return { 
      isValid: false, 
      error: 'Table name already exists'
    };
  }

  return { isValid: true };
};

/**
 * Validates view name
 */
export const validateViewName = (
  name: string,
  existingViews: ExistingItem[],
  currentItemId?: string
): { isValid: boolean; error?: string } => {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, error: 'View name is required' };
  }

  if (trimmedName.length < 3) {
    return { isValid: false, error: 'View name must be at least 3 characters' };
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: 'View name must be less than 50 characters' };
  }

  if (isNameDuplicate(trimmedName, existingViews, currentItemId)) {
    return { 
      isValid: false, 
      error: 'View name already exists'
    };
  }

  return { isValid: true };
};

/**
 * Generates default table name
 */
export const getDefaultTableName = (existingTables: ExistingItem[] = []): string => {
  return generateUniqueName('New Table', existingTables);
};

/**
 * Validates base name
 */
export const validateBaseName = (
  name: string,
  existingBases: ExistingItem[] = [],
  currentItemId?: string
): { isValid: boolean; error?: string } => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { isValid: false, error: 'Base name is required' };
  }

  if (trimmedName.length < 3) {
    return { isValid: false, error: 'Base name must be at least 3 characters' };
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Base name must be less than 50 characters' };
  }

  if (isNameDuplicate(trimmedName, existingBases, currentItemId)) {
    return {
      isValid: false,
      error: 'Base name already exists'
    };
  }

  return { isValid: true };
};

/**
 * Validates workspace name
 */
export const validateWorkspaceName = (
  name: string,
  existingWorkspaces: ExistingItem[] = [],
  currentItemId?: string
): { isValid: boolean; error?: string } => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { isValid: false, error: 'Workspace name is required' };
  }

  if (trimmedName.length < 3) {
    return { isValid: false, error: 'Workspace name must be at least 3 characters' };
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Workspace name must be less than 50 characters' };
  }

  if (isNameDuplicate(trimmedName, existingWorkspaces, currentItemId)) {
    return {
      isValid: false,
      error: 'Workspace name already exists'
    };
  }

  return { isValid: true };
};

/**
 * Generates default view name based on type
 */
export const getDefaultViewName = (viewType: string, existingViews: ExistingItem[] = []): string => {
  const typeName = viewType.charAt(0).toUpperCase() + viewType.slice(1).replaceAll(/([A-Z])/g, ' $1');
  const baseName = `${typeName} View`;
  return generateUniqueName(baseName, existingViews);
};
