// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useMemo } from 'react';
import { usePrimaryKey } from './useApi';
import { KeyColumnRef, requiredKeyColumnIds } from '../utils/primaryKeyFields';

// The key fields a record must have filled in (empty for tables keyed by Id alone), in key order
export const useRequiredKeyFields = (tableId: string | number | undefined, columns: KeyColumnRef[] | undefined): string[] => {
  const { data: primaryKey } = usePrimaryKey(tableId ? String(tableId) : '');
  return useMemo(
    () => requiredKeyColumnIds(primaryKey?.column_ids, columns ?? []),
    [primaryKey, columns],
  );
};
