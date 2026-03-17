// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
export interface FieldConfigLike {
  id?: string | number;
  position?: number;
  isHidden?: boolean;
  hidden?: boolean;
  is_hidden?: boolean;
  [key: string]: unknown;
}

export const sortByPosition = <T extends { position?: number }>(items: T[]): T[] => {
  return items.toSorted((a, b) => (a.position || 0) - (b.position || 0));
};

export const buildPositionSignature = (items: Array<{ position?: number }>): string => {
  return JSON.stringify(sortByPosition(items));
};

export const resolveColumnHiddenState = (column: FieldConfigLike | undefined, fallback: boolean): boolean => {
  if (typeof column?.hidden === 'boolean') {
    return Boolean(column.hidden);
  }
  if (typeof column?.isHidden === 'boolean') {
    return Boolean(column.isHidden);
  }
  if (typeof column?.is_hidden === 'boolean') {
    return Boolean(column.is_hidden);
  }
  return fallback;
};

export const buildReorderedFieldConfig = (
  existingFieldConfig: FieldConfigLike[],
  newColumns: FieldConfigLike[]
): FieldConfigLike[] => {
  const newColumnMap = new Map<string, number>();
  const newColumnDataMap = new Map<string, FieldConfigLike>();

  newColumns.forEach((column, index) => {
    if (column.id != null) {
      const id = String(column.id);
      newColumnMap.set(id, index);
      newColumnDataMap.set(id, column);
    }
  });

  const updatedFieldConfig = existingFieldConfig.map((fieldConfig) => {
    const fieldConfigId = String(fieldConfig.id);
    const newPosition = newColumnMap.get(fieldConfigId);
    if (newPosition === undefined) {
      return fieldConfig;
    }

    const column = newColumnDataMap.get(fieldConfigId);
    const isHidden = resolveColumnHiddenState(column, Boolean(fieldConfig.isHidden));

    return {
      ...fieldConfig,
      position: newPosition,
      isHidden,
    };
  });

  const existingIds = new Set(existingFieldConfig.map((fieldConfig) => String(fieldConfig.id)));
  newColumns.forEach((column, index) => {
    if (column.id != null && !existingIds.has(String(column.id))) {
      updatedFieldConfig.push({
        id: column.id,
        position: index,
        isHidden: Boolean(column.hidden || column.isHidden || column.is_hidden),
      });
    }
  });

  const sortedFieldConfig = sortByPosition(updatedFieldConfig);
  return sortedFieldConfig.map((fieldConfig, index) => ({
    ...fieldConfig,
    position: index,
  }));
};
