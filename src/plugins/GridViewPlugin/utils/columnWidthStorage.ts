// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

const STORAGE_KEY_PREFIX = 'serenibase_col_widths';

const getStorageKey = (tableId: string, viewId: string): string => {
  return `${STORAGE_KEY_PREFIX}_${tableId}_${viewId}`;
};

export const getColumnWidths = (tableId: string, viewId: string): Record<string, number> => {
  try {
    const key = getStorageKey(tableId, viewId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as Record<string, number>;
      }
    }
  } catch (error) {
    console.error('[columnWidthStorage] Failed to read column widths:', error);
  }
  return {};
};

export const saveColumnWidths = (tableId: string, viewId: string, widths: Record<string, number>): void => {
  try {
    const key = getStorageKey(tableId, viewId);
    localStorage.setItem(key, JSON.stringify(widths));
  } catch (error) {
    console.error('[columnWidthStorage] Failed to save column widths:', error);
  }
};

export const clearColumnWidths = (tableId: string, viewId: string): void => {
  try {
    const key = getStorageKey(tableId, viewId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[columnWidthStorage] Failed to clear column widths:', error);
  }
};
