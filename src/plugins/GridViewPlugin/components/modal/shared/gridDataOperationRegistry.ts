// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import {
  buildGridDataOperationPreview,
  buildGridDataOperationPreviewAsync,
  applyGridDataOperationToRecords,
  normalizeCustomFormattingPattern,
} from './gridDataOperationTransforms';
import type {
  GridDataOperationAdapter,
  GridDataOperationApplyPlan,
  GridDataOperationContext,
  GridDataOperationPreviewResult,
  GridExtractType,
  GridTrimWhitespaceMode,
} from './gridDataOperation.types';
import type { GridActionId } from '../../toolbar/gridActionCatalog';
import { getGridColumnIdentity, getGridColumnValueKey } from './gridColumnIdentity';

const matchesSelectedColumn = (
  column: { id?: string; key?: string; column_name?: string; title?: string },
  selectedId: string,
) => {
  const normalizedSelectedId = String(selectedId || '');
  if (!normalizedSelectedId) return false;

  return [
    column.id,
    column.key,
    column.column_name,
    column.title,
  ]
    .map((value) => String(value || ''))
    .includes(normalizedSelectedId);
};

const trimModeMap: Record<string, GridTrimWhitespaceMode> = {
  both: 'trim_both',
  leading: 'trim_leading',
  trailing: 'trim_trailing',
  extra: 'collapse_spaces',
};

const buildTrimWhitespacePlan = (
  context: GridDataOperationContext,
  preview: GridDataOperationPreviewResult,
): GridDataOperationApplyPlan | null => {
  const selectedColumns = context.columns
    .filter((column) => {
      const columnId = String(column.id || column.key || column.column_name || column.title || '');
      return context.state.selectedColumnIds.includes(columnId);
    })
    .map((column) => String(column.id || column.key || column.column_name || column.title || ''))
    .filter(Boolean);

  if (!selectedColumns.length) return null;

  return {
    supported: true,
    kind: 'trim_whitespace',
    columnUpdates: [],
    trimWhitespace: {
      modelId: String(context.tableData?.model?.id ?? ''),
      columns: selectedColumns,
      trimMode: trimModeMap[context.state.spaceMode] ?? 'trim_both',
    },
    optimisticRecords: applyGridDataOperationToRecords(
      Array.isArray(context.tableData?.records) ? context.tableData.records : [],
      preview
    ),
  };
};

const buildCaseNormalizationPlan = (
  context: GridDataOperationContext,
  preview: GridDataOperationPreviewResult,
): GridDataOperationApplyPlan | null => {
  const selectedColumns = context.columns
    .filter((column) => {
      const columnId = String(column.id || column.key || column.column_name || column.title || '');
      return context.state.selectedColumnIds.includes(columnId);
    })
    .map((column) => String(column.id || column.key || column.column_name || column.title || ''))
    .filter(Boolean);

  if (!selectedColumns.length) return null;

  return {
    supported: true,
    kind: 'case_normalization',
    columnUpdates: [],
    caseNormalization: {
      modelId: String(context.tableData?.model?.id ?? ''),
      columns: selectedColumns,
      caseFormat: context.state.caseFormat,
    },
    optimisticRecords: applyGridDataOperationToRecords(
      Array.isArray(context.tableData?.records) ? context.tableData.records : [],
      preview
    ),
  };
};

const buildRemoveDuplicatesPlan = (
  context: GridDataOperationContext,
  preview: GridDataOperationPreviewResult,
): GridDataOperationApplyPlan | null => {
  const selectedColumnEntries = context.columns
    .filter((column) => context.state.selectedColumnIds.includes(getGridColumnIdentity(column)))
    .map((column) => ({
      columnId: getGridColumnIdentity(column),
      valueKey: getGridColumnValueKey(column),
    }))
    .filter((entry) => entry.columnId && entry.valueKey);

  const selectedColumns = selectedColumnEntries.map((entry) => entry.columnId);

  const rowIdsToDelete = preview.previewRows
    .filter((row) => row.rowState === 'removed')
    .map((row) => Number(row.id))
    .filter((id) => Number.isFinite(id));

  const duplicateAction = context.state.duplicateAction ?? 'remove_row';

  if (!selectedColumns.length) return null;

  const optimisticRecords = applyGridDataOperationToRecords(
    Array.isArray(context.tableData?.records) ? context.tableData.records : [],
    preview
  );

  if (duplicateAction === 'remove_duplicates') {
    const columnUpdates = selectedColumnEntries
      .map(({ columnId, valueKey }) => {
        const updates = preview.previewRows
          .filter((row) => row.changedColumns.includes(valueKey))
          .map((row) => ({
            id: row.id,
            value: row.values[valueKey],
          }));

        if (!updates.length) return null;

        return {
          columnId,
          updates,
        };
      })
      .filter(Boolean) as Array<{ columnId: string; updates: Array<{ id: string; value: any }> }>;

    if (!columnUpdates.length) return null;

    return {
      supported: true,
      kind: 'remove_duplicates',
      columnUpdates,
      removeDuplicates: {
        modelId: String(context.tableData?.model?.id ?? ''),
        columns: selectedColumns,
        rowIdsToDelete: [],
        duplicateAction,
        keepRule: context.state.duplicateKeepRule ?? 'keep_first',
      },
      optimisticRecords,
    };
  }

  return {
    supported: true,
    kind: 'remove_duplicates',
    columnUpdates: [],
    removeDuplicates: {
      modelId: String(context.tableData?.model?.id ?? ''),
      columns: selectedColumns,
      rowIdsToDelete,
      duplicateAction,
      keepRule: context.state.duplicateKeepRule ?? 'keep_first',
    },
    optimisticRecords,
  };
};

const buildFuzzyDeduplicationPlan = (
  context: GridDataOperationContext,
  preview: GridDataOperationPreviewResult,
): GridDataOperationApplyPlan | null => {
  const selectedColumns = context.columns
    .filter((column) => context.state.selectedColumnIds.includes(getGridColumnIdentity(column)))
    .map((column) => getGridColumnIdentity(column))
    .filter(Boolean);

  if (!selectedColumns.length) return null;

  const duplicateAction = context.state.duplicateAction === 'remove_duplicates' ? 'remove_duplicates' : 'remove_row';

  const keepRule = context.state.duplicateKeepRule === 'keep_last'
    ? 'keep_last'
    : context.state.duplicateKeepRule === 'keep_latest_updated'
      ? 'keep_latest_updated'
      : 'keep_first';

  const threshold = context.state.fuzzySensitivity || 'medium';

  const optimisticRecords = applyGridDataOperationToRecords(
    Array.isArray(context.tableData?.records) ? context.tableData.records : [],
    preview
  );

  return {
    supported: true,
    kind: 'fuzzy_deduplication',
    columnUpdates: [],
    fuzzyDeduplication: {
      modelId: String(context.tableData?.model?.id ?? ''),
      columns: selectedColumns,
      threshold,
      duplicateAction,
      keepRule,
      deduplicationMode: context.state.deduplicationMode || 'automatic',
      rowActions: (() => {
        if (context.state.deduplicationMode !== 'manual') {
          return undefined;
        }
        // Build the actionable map: start from preview row defaults then apply user overrides.
        // Only 'delete' and 'clear' are sent to the backend; 'keep'/'none' means skip the row.
        const actions: Record<string, 'delete' | 'clear'> = {};
        for (const row of preview.previewRows) {
          if (row.rowState === 'removed') {
            actions[row.id] = 'delete';
          } else if (row.rowState === 'changed') {
            actions[row.id] = 'clear';
          }
        }
        // Apply user overrides from state.rowActions
        if (context.state.rowActions) {
          for (const [rowId, action] of Object.entries(context.state.rowActions)) {
            if (action === 'delete') {
              actions[rowId] = 'delete';
            } else if (action === 'clear') {
              actions[rowId] = 'clear';
            } else {
              // 'keep' or 'none' — remove from the actionable map
              delete actions[rowId];
            }
          }
        }
        return actions;
      })(),
    },
    optimisticRecords,
  };
};

const buildMergePlan = (
  context: GridDataOperationContext,
  preview: GridDataOperationPreviewResult,
): GridDataOperationApplyPlan | null => {
  const selectedColumnIds = context.state.selectedColumnIds
    .map(String)
    .filter(Boolean);

  if (selectedColumnIds.length < 2) return null;

  const uniqueSelectedIds = new Set(selectedColumnIds);
  if (uniqueSelectedIds.size < 2) return null;

  const columnById = new Map(
    context.columns.map((column) => [
      String(column.id || column.key || column.column_name || column.title || ''),
      column,
    ] as const)
  );
  const selectedColumns = selectedColumnIds
    .map((columnId) => columnById.get(columnId))
    .filter(Boolean) as typeof context.columns;

  if (selectedColumns.length < 2) return null;

  const mergedColumnTitle = context.state.mergeColumnTitle.trim()
    || selectedColumns
      .map((column) => String(column.title || column.column_name || ''))
      .filter(Boolean)
      .join(' ');

  if (!mergedColumnTitle) return null;

  const customSeparator = context.state.mergeCustomSeparator.trim();
  if (context.state.mergeFormat === 'custom' && !customSeparator) return null;

  const sourceColumnIds = selectedColumns.map((column) =>
    String(column.id || column.key || column.column_name || column.title || '')
  );

  return {
    supported: true,
    kind: 'merge_column',
    columnUpdates: [],
    mergeColumn: {
      modelId: String(context.tableData?.model?.id ?? ''),
      sourceColumnIds,
      mergedColumnTitle,
      mergeFormat: context.state.mergeFormat,
      mergeCustomSeparator: customSeparator,
      mergeKeepOriginalColumns: context.state.mergeKeepOriginalColumns,
      mergePlacement: context.state.mergePlacement,
      outputColumnId: '',
    },
    optimisticRecords: applyGridDataOperationToRecords(
      Array.isArray(context.tableData?.records) ? context.tableData.records : [],
      preview
    ),
  };
};

const buildSplitPlan = (
  context: GridDataOperationContext,
  preview: GridDataOperationPreviewResult,
): GridDataOperationApplyPlan | null => {
  const sourceColumn = context.columns.find((column) => {
    const columnId = String(column.id || column.key || column.column_name || column.title || '');
    return columnId === context.state.splitSourceColumnId;
  });

  if (!sourceColumn || !preview.previewRows.length) return null;

  const sourceColumnId = String(sourceColumn.id || sourceColumn.key || sourceColumn.column_name || sourceColumn.title || '');
  const sourceColumnTitle = String(sourceColumn.title || sourceColumn.column_name || sourceColumnId);
  const outputColumnTitles = preview.virtualColumns?.map((column) => column.title) ?? [];
  const outputColumnIds = preview.virtualColumns?.map((column) => column.id) ?? [];

  return {
    supported: true,
    kind: 'split_column',
    columnUpdates: [],
    splitColumn: {
      modelId: String(context.tableData?.model?.id ?? ''),
      sourceColumnId,
      sourceColumnTitle,
      outputColumnTitles,
      splitMode: context.state.splitMode,
      splitSeparatorType: context.state.splitSeparatorType,
      splitCustomSeparator: context.state.splitCustomSeparator,
      splitMaxColumns: Number.parseInt(context.state.splitMaxColumns, 10) || 10,
      splitFixedDirection: context.state.splitFixedDirection,
      splitCharacterCount: context.state.splitCharacterCount,
      splitPattern: context.state.splitPattern,
      splitOutputMode: context.state.splitOutputMode,
      splitPlacement: context.state.splitPlacement,
      outputColumnIds,
    },
    optimisticRecords: applyGridDataOperationToRecords(
      Array.isArray(context.tableData?.records) ? context.tableData.records : [],
      preview
    ),
  };
};

const buildFindReplacePlan = (
  context: GridDataOperationContext,
  preview: GridDataOperationPreviewResult,
): GridDataOperationApplyPlan | null => {
  const selectedColumns = context.columns
    .filter((column) => {
      const columnId = String(column.id || column.key || column.column_name || column.title || '');
      return context.state.selectedColumnIds.includes(columnId);
    })
    .map((column) => String(column.id || column.key || column.column_name || column.title || ''))
    .filter(Boolean);

  if (!selectedColumns.length || !context.state.findText) return null;

  return {
    supported: true,
    kind: 'find_replace',
    columnUpdates: [],
    findReplace: {
      modelId: String(context.tableData?.model?.id ?? ''),
      columns: selectedColumns,
      findValue: context.state.findText,
      replaceValue: context.state.replaceText,
      matchType: context.state.matchingCase,
    },
    optimisticRecords: applyGridDataOperationToRecords(
      Array.isArray(context.tableData?.records) ? context.tableData.records : [],
      preview
    ),
  };
};


const buildRemoveSpecialCharactersPlan = (
  context: GridDataOperationContext,
  preview: GridDataOperationPreviewResult,
): GridDataOperationApplyPlan | null => {
  const selectedColumns = context.columns
    .filter((column) => {
      const columnId = String(column.id || column.key || column.column_name || column.title || '');
      return context.state.selectedColumnIds.includes(columnId);
    })
    .map((column) => String(column.id || column.key || column.column_name || column.title || ''))
    .filter(Boolean);

  if (!selectedColumns.length) return null;

  return {
    supported: true,
    kind: 'remove_special_characters',
    columnUpdates: [],
    removeSpecialCharacters: {
      modelId: String(context.tableData?.model?.id ?? ''),
      columns: selectedColumns,
      specialCharactersType: context.state.charRemovalMode,
      custom: context.state.charRemovalMode === 'custom' && context.state.customChar
        ? [...new Set(context.state.customChar.split(''))]
        : undefined,
    },
    optimisticRecords: applyGridDataOperationToRecords(
      Array.isArray(context.tableData?.records) ? context.tableData.records : [],
      preview
    ),
  };
};

const extractSupportedTypes = new Set<GridExtractType>(['email', 'keywords', 'mentions', 'tags', 'url', 'domain', 'emoji', 'phone', 'prefix']);

const extractTypeTitles: Record<string, string> = {
  email: 'Extracted Email',
  url: 'Extracted URL',
  domain: 'Extracted Domain',
  keywords: 'Extracted Keywords',
  mentions: 'Extracted Mentions',
  tags: 'Extracted Tags',
  emoji: 'Extracted Emoji',
  phone: 'Extracted Phone',
  prefix: 'Extracted Prefix',
};

const buildExtractPlan = (
  context: GridDataOperationContext,
  preview: GridDataOperationPreviewResult,
): GridDataOperationApplyPlan | null => {
  if (preview.affectedRows === 0) return null;

  const sourceColumn = context.columns.find((column) => {
    return matchesSelectedColumn(column, context.state.selectedColumnIds[0]);
  });

  if (!sourceColumn || !preview.previewRows.length) return null;

  if (context.state.extractMethod === 'extraction_type' && !extractSupportedTypes.has(context.state.extractType)) {
    return null;
  }

  const sourceColumnId = String(sourceColumn.id || sourceColumn.key || sourceColumn.column_name || sourceColumn.title || '');
  const sourceColumnTitle = String(sourceColumn.title || sourceColumn.column_name || sourceColumnId);
  const outputColumnTitle = context.state.extractMethod === 'between_characters'
    ? 'Extracted value'
    : extractTypeTitles[context.state.extractType] ?? 'Extracted Prefix';

  return {
    supported: true,
    kind: 'extract_substring',
    columnUpdates: [],
    extractSubstring: {
      modelId: String(context.tableData?.model?.id ?? ''),
      sourceColumnId,
      sourceColumnTitle,
      extractionMethod: context.state.extractMethod,
      extractionType: context.state.extractType,
      startAfter: context.state.extractStartAfter,
      endBefore: context.state.extractEndBefore,
      keepOriginalColumn: context.state.extractKeepOriginalColumn,
      placement: context.state.extractPlacement,
      outputColumnId: context.state.extractKeepOriginalColumn
        ? `${sourceColumnId}__extracted`
        : sourceColumnId,
      outputColumnTitle,
    },
    optimisticRecords: applyGridDataOperationToRecords(
      Array.isArray(context.tableData?.records) ? context.tableData.records : [],
      preview
    ),
  };
};


const buildRemoveFormattingPlan = (
  context: GridDataOperationContext,
  preview: GridDataOperationPreviewResult,
): GridDataOperationApplyPlan | null => {
  const customPatterns = context.state.formatting === 'custom'
    ? normalizeCustomFormattingPattern(context.state.formattingPattern)
    : [];

  const selectedColumns = context.columns
    .filter((column) => {
      const columnId = String(column.id || column.key || column.column_name || column.title || '');
      return context.state.selectedColumnIds.includes(columnId);
    })
    .map((column) => String(column.id || column.key || column.column_name || column.title || ''))
    .filter(Boolean);

  if (!selectedColumns.length) return null;

  return {
    supported: true,
    kind: 'remove_formatting',
    columnUpdates: [],
    removeFormatting: {
      modelId: String(context.tableData?.model?.id ?? ''),
      columns: selectedColumns,
      formatting: context.state.formatting,
      customPattern: customPatterns.length ? customPatterns : undefined,
    },
    optimisticRecords: applyGridDataOperationToRecords(
      Array.isArray(context.tableData?.records) ? context.tableData.records : [],
      preview
    ),
  };
};

const createNoopAdapter = (): GridDataOperationAdapter => ({
  buildPreview: buildGridDataOperationPreview,
  buildApplyPlan: () => null,
});

const ACTION_ADAPTERS: Partial<Record<GridActionId, GridDataOperationAdapter>> = {
  case_normalization: {
    buildPreview: buildGridDataOperationPreview,
    buildApplyPlan: (context, preview) => {
      if (!preview.supported) return null;
      return buildCaseNormalizationPlan(context, preview);
    },
  },
  remove_extra_spaces: {
    buildPreview: buildGridDataOperationPreview,
    buildApplyPlan: (context, preview) => {
      if (!preview.supported) return null;
      return buildTrimWhitespacePlan(context, preview);
    },
  },
  find_replace: {
    buildPreview: buildGridDataOperationPreview,
    buildApplyPlan: (context, preview) => {
      if (!preview.supported) return null;
      return buildFindReplacePlan(context, preview);
    },
  },
  remove_formatting: {
    buildPreview: buildGridDataOperationPreview,
    buildApplyPlan: (context, preview) => {
      if (!preview.supported) return null;
      return buildRemoveFormattingPlan(context, preview);
    },
  },
  remove_duplicates: {
    buildPreview: buildGridDataOperationPreview,
    buildApplyPlan: (context, preview) => {
      if (!preview.supported) return null;
      return buildRemoveDuplicatesPlan(context, preview);
    },
  },
  fuzzy_deduplication: {
    buildPreview: buildGridDataOperationPreview,
    buildPreviewAsync: buildGridDataOperationPreviewAsync,
    buildApplyPlan: (context, preview) => {
      if (!preview.supported) return null;
      return buildFuzzyDeduplicationPlan(context, preview);
    },
  },
  remove_special_characters: {
    buildPreview: buildGridDataOperationPreview,
    buildApplyPlan: (context, preview) => {
      if (!preview.supported) return null;
      return buildRemoveSpecialCharactersPlan(context, preview);
    },
  },
  split_column: {
    buildPreview: buildGridDataOperationPreview,
    buildApplyPlan: (context, preview) => {
      if (!preview.supported) return null;
      return buildSplitPlan(context, preview);
    },
  },
  merge_column: {
    buildPreview: buildGridDataOperationPreview,
    buildApplyPlan: (context, preview) => {
      if (!preview.supported) return null;
      return buildMergePlan(context, preview);
    },
  },
  extract_substring: {
    buildPreview: buildGridDataOperationPreview,
    buildApplyPlan: (context, preview) => {
      if (!preview.supported) return null;
      return buildExtractPlan(context, preview);
    },
  },
};

const FALLBACK_ADAPTER = createNoopAdapter();

export const getGridDataOperationAdapter = (actionId: GridActionId): GridDataOperationAdapter => {
  return ACTION_ADAPTERS[actionId] ?? FALLBACK_ADAPTER;
};
