// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { GridColumn } from '../../types/grid.types';
import type { TableData } from '../../../../types/api.types';
import type { GridActionDefinition, GridActionId } from '../toolbar/gridActionCatalog';
import { GridDataOperationPanel } from './shared/GridDataOperationPanel';
import { GridDataOperationPreviewGrid } from './preview/GridDataOperationPreviewGrid';
import { getGridDataOperationAdapter } from './shared/gridDataOperationRegistry';
import type { GridDataOperationState, GridExtractMethod, GridExtractType } from './shared/gridDataOperation.types';
import { getGridColumnIdentity } from './shared/gridColumnIdentity';
import { useToast } from '../../../../components/common/Toast';
import { bulkUpdateFieldService } from '../../../../service/clientService';
import { useCaseNormalize, useFindReplace, useMergeColumns, useRemoveDuplicates, useTrimWhitespace, useRemoveSpecialCharacters, useExtractSubstring, useRemoveFormatting, useSplitColumn } from '../../../../hooks/useApi';

const DEFAULT_SELECTED_COUNT = 1;

const buildInitialSelectedColumns = (columns: GridColumn[]) =>
  columns
    .filter((column) => getGridColumnIdentity(column))
    .slice(0, DEFAULT_SELECTED_COUNT)
    .map((column) => getGridColumnIdentity(column));

const buildInitialState = (columns: GridColumn[], actionId?: GridActionId): GridDataOperationState => ({
  scope: 'all',
  selectedColumnIds: buildInitialSelectedColumns(columns),
  caseFormat: 'title_case',
  spaceMode: 'both',
  formatting: 'currency',
  formattingPattern: '',
  findText: '',
  replaceText: '',
  matchingCase: 'match_case',
  duplicateAction: 'remove_row',
  duplicateKeepRule: 'keep_first',
  splitSourceColumnId: buildInitialSelectedColumns(columns)[0] ?? '',
  splitMode: 'separator',
  splitSeparatorType: 'space',
  splitCustomSeparator: '',
  splitMaxColumns: '10',
  splitFixedDirection: 'after',
  splitCharacterCount: '',
  splitPattern: '',
  splitOutputMode: 'keep_original',
  splitPlacement: 'next_to_original',
  mergeFormat: 'space',
  mergeCustomSeparator: '',
  mergeColumnTitle: '',
  mergeKeepOriginalColumns: true,
  mergePlacement: 'next_to_original',
  charRemovalMode: 'symbols',
  customChar: '',
  extractMethod: 'extraction_type',
  extractType: 'email',
  extractStartAfter: '',
  extractEndBefore: '',
  extractKeepOriginalColumn: true,
  extractPlacement: 'next_to_original',
});

const getColumnValueKey = (column: GridColumn) =>
  String(column.key || column.column_name || column.id || column.title || '');

const getColumnOrderIndex = (column: GridColumn, fallback = 0) =>
  typeof column.order_index === 'number'
    ? column.order_index
    : typeof column.position === 'number'
      ? column.position
      : fallback;

const buildVirtualGridColumn = (column: GridColumn, id: string, title: string): GridColumn => ({
  ...column,
  id,
  key: id,
  column_name: id,
  title,
  type: column.type ?? 'text',
  uidt: column.uidt ?? 'text',
  width: column.width ?? 235,
  hidden: false,
  is_hidden: false,
  system: false,
  isSystem: false,
});

const extractCreatedFieldId = (response: any) =>
  String(response?.data?.id ?? response?.id ?? response?.data?.data?.id ?? '');

const buildCreatedApiColumn = (
  tableData: TableData | undefined,
  title: string,
  columnId: string,
  orderIndex: number,
) => ({
  id: columnId,
  model_id: String(tableData?.model?.id ?? ''),
  base_id: String(tableData?.model?.base_id ?? ''),
  column_name: title,
  title,
  uidt: 'text',
  dt: 'text',
  description: '',
  meta: {},
  virtual: false,
  system: false,
  deleted: false,
  order_index: orderIndex,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const getOperationErrorMessage = (error: unknown, fallback: string) => {
  const typedError = error as { response?: { data?: { message?: string; error?: { message?: string } } }; message?: string };
  return typedError?.response?.data?.error?.message
    || typedError?.response?.data?.message
    || typedError?.message
    || fallback;
};

const matchesSelectedColumn = (
  column: GridColumn,
  selectedId: string,
) => {
  const normalizedSelectedId = String(selectedId || '');
  if (!normalizedSelectedId) return false;

  return [
    column.id,
    column.key,
    column.column_name,
    column.title,
    getGridColumnIdentity(column),
    getColumnValueKey(column),
  ]
    .map((value) => String(value || ''))
    .includes(normalizedSelectedId);
};

const getExtractOutputTitle = (method: GridExtractMethod, type: GridExtractType) => {
  if (method === 'between_characters') return 'Extracted value';

  switch (type) {
    case 'email':
      return 'Extracted Email';
    case 'url':
      return 'Extracted URL';
    case 'domain':
      return 'Extracted Domain';
    case 'keywords':
      return 'Extracted Keywords';
    case 'mentions':
      return 'Extracted Mentions';
    case 'tags':
      return 'Extracted Tags';
    case 'emoji':
      return 'Extracted Emoji';
    case 'phone':
      return 'Extracted Phone';
    case 'prefix':
      return 'Extracted Prefix';
    default:
      return 'Extracted value';
  }
}

interface GridDataOperationModalProps {
  isOpen: boolean;
  action: GridActionDefinition | null;
  columns: GridColumn[];
  tableData?: TableData;
  onClose: () => void;
}

export const GridDataOperationModal: React.FC<GridDataOperationModalProps> = ({
  isOpen,
  action,
  columns,
  tableData,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const caseNormalizeMutation = useCaseNormalize();
  const extractSubstringMutation = useExtractSubstring();
  const findReplaceMutation = useFindReplace();
  const mergeColumnsMutation = useMergeColumns();
  const removeDuplicatesMutation = useRemoveDuplicates();
  const removeSpecialCharactersMutation = useRemoveSpecialCharacters();
  const removeFormattingMutation = useRemoveFormatting();
  const trimWhitespaceMutation = useTrimWhitespace();
  const splitColumnMutation = useSplitColumn();
  const [isApplying, setIsApplying] = useState(false);
  const [state, setState] = useState<GridDataOperationState>(() => buildInitialState(columns, action?.id));
  const tableId = String(tableData?.model?.id ?? '');
  const adapter = useMemo(() => {
    if (!action) return null;
    return getGridDataOperationAdapter(action.id);
  }, [action]);

  useEffect(() => {
    if (!isOpen || !action) return;
    setState(buildInitialState(columns, action.id));
  }, [action?.id, columns, isOpen]);

  const preview = useMemo(() => {
    if (!action || !adapter) return null;
    return adapter.buildPreview({
      actionId: action.id,
      columns,
      tableData,
      state,
    });
  }, [action, adapter, columns, state, tableData]);

  const applyPlan = useMemo(() => {
    if (!action || !adapter || !preview) return null;
    return adapter.buildApplyPlan({
      actionId: action.id,
      columns,
      tableData,
      state,
    }, preview);
  }, [action, adapter, columns, preview, state, tableData]);

  const previewColumns = useMemo(() => {
    if (!preview?.virtualColumns?.length) {
      return columns;
    }

    const sourceColumnIdentity = action?.id === 'extract_substring'
      ? columns.find((column) => matchesSelectedColumn(column, state.selectedColumnIds[0]))
        ? getGridColumnIdentity(columns.find((column) => matchesSelectedColumn(column, state.selectedColumnIds[0])) as GridColumn)
        : state.selectedColumnIds[0]
      : action?.id === 'split_column'
        ? state.splitSourceColumnId
        : action?.id === 'merge_column'
          ? (() => {
            const lastSelectedId = state.selectedColumnIds[state.selectedColumnIds.length - 1] || '';
            if (lastSelectedId) {
              const selectedColumn = columns.find((column) => matchesSelectedColumn(column, lastSelectedId));
              return selectedColumn ? getGridColumnIdentity(selectedColumn) : String(lastSelectedId);
            }
            return '';
          })()
          : '';
    const placement = action?.id === 'extract_substring'
      ? state.extractPlacement
      : action?.id === 'split_column'
        ? state.splitPlacement
        : action?.id === 'merge_column'
          ? state.mergePlacement
          : 'end_of_table';
    const virtualById = new Map(preview.virtualColumns.map((column) => [column.id, column.title]));
    const replacedColumns = columns.map((column) => {
      const identity = getGridColumnIdentity(column);
      const virtualTitle = virtualById.get(identity);
      if (!virtualTitle) return column;
      return {
        ...column,
        title: virtualTitle,
      };
    });

    const existingIdentities = new Set(replacedColumns.map((column) => getGridColumnIdentity(column)));
    const additions = preview.virtualColumns
      .filter((column) => !existingIdentities.has(column.id))
      .map((column) => {
        const sourceColumn = columns.find((item) => getGridColumnIdentity(item) === sourceColumnIdentity)
          ?? columns.find((item) => matchesSelectedColumn(item, state.selectedColumnIds[state.selectedColumnIds.length - 1] || ''))
          ?? columns.find((item) => matchesSelectedColumn(item, state.selectedColumnIds[0]))
          ?? columns[0];
        return buildVirtualGridColumn(sourceColumn ?? ({} as GridColumn), column.id, column.title);
      });

    if (!additions.length) {
      return replacedColumns;
    }

    if (placement === 'next_to_original' && sourceColumnIdentity) {
      const sourceIndex = replacedColumns.findIndex((column) => getGridColumnIdentity(column) === sourceColumnIdentity);
      if (sourceIndex >= 0) {
        return [
          ...replacedColumns.slice(0, sourceIndex + 1),
          ...additions,
          ...replacedColumns.slice(sourceIndex + 1),
        ];
      }
    }

    return [...replacedColumns, ...additions];
  }, [action?.id, columns, preview, state.extractPlacement, state.mergePlacement, state.selectedColumnIds, state.splitPlacement, state.splitSourceColumnId]);

  const updateTableCache = useCallback((updater: (tableSection: any) => void) => {
    queryClient.setQueryData(['tables', tableId], (oldData: any) => {
      if (!oldData) return oldData;

      const nextRoot = oldData?.data ? { ...oldData, data: { ...oldData.data } } : { ...oldData };
      const tableSection = nextRoot.data ?? nextRoot;
      updater(tableSection);
      return nextRoot;
    });
  }, [queryClient, tableId]);

  const handleStateChange = useCallback((patch: Partial<GridDataOperationState>) => {
    setState((current) => ({
      ...current,
      ...patch,
      selectedColumnIds: Array.isArray(patch.selectedColumnIds)
        ? Array.from(new Set(patch.selectedColumnIds.filter(Boolean)))
        : current.selectedColumnIds,
    }));
  }, []);

  const mergeValidationError = useMemo(() => {
    if (action?.id !== 'merge_column') return null;

    const uniqueSelectedIds = Array.from(new Set(state.selectedColumnIds.filter(Boolean)));
    if (uniqueSelectedIds.length < 2) {
      return 'Select at least two unique columns to merge.';
    }

    if (state.mergeFormat === 'custom' && !state.mergeCustomSeparator.trim()) {
      return 'Enter a custom separator before applying the merge.';
    }

    return null;
  }, [action?.id, state.mergeCustomSeparator, state.mergeFormat, state.selectedColumnIds]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !action) {
    return null;
  }

  const handleApply = async () => {
    if (!tableId) {
      toast.error('Table data is not available.', { title: 'Merge failed' });
      return;
    }

    if (!preview || !applyPlan) {
      if (mergeValidationError) {
        toast.error(mergeValidationError, { title: 'Invalid merge settings' });
      }
      return;
    }

    const previousData = applyPlan.kind === 'merge_column'
      ? undefined
      : queryClient.getQueryData(['tables', tableId]);

    try {
      setIsApplying(true);

      if (applyPlan.kind !== 'merge_column') {
        queryClient.setQueryData(['tables', tableId], (oldData: any) => {
          if (!oldData) return oldData;

          const nextRoot = oldData?.data ? { ...oldData, data: { ...oldData.data } } : { ...oldData };
          const tableSection = nextRoot.data ?? nextRoot;

          if (Array.isArray(tableSection.records)) {
            tableSection.records = applyPlan.optimisticRecords;
          }

          return nextRoot;
        });
      }

      if (applyPlan.kind === 'trim_whitespace' && applyPlan.trimWhitespace) {
        await trimWhitespaceMutation.mutateAsync({
          model_id: applyPlan.trimWhitespace.modelId,
          columns: applyPlan.trimWhitespace.columns,
          trim_mode: applyPlan.trimWhitespace.trimMode,
        });
      } else if (applyPlan.kind === 'case_normalization' && applyPlan.caseNormalization) {
        await caseNormalizeMutation.mutateAsync({
          model_id: applyPlan.caseNormalization.modelId,
          columns: applyPlan.caseNormalization.columns,
          case_format: applyPlan.caseNormalization.caseFormat,
        });
      } else if (applyPlan.kind === 'find_replace' && applyPlan.findReplace) {
        await findReplaceMutation.mutateAsync({
          model_id: applyPlan.findReplace.modelId,
          columns: applyPlan.findReplace.columns,
          find_value: applyPlan.findReplace.findValue,
          replace_value: applyPlan.findReplace.replaceValue,
          match_type: applyPlan.findReplace.matchType,
        });
      } else if (applyPlan.kind === 'remove_duplicates' && applyPlan.removeDuplicates) {
        await removeDuplicatesMutation.mutateAsync({
          model_id: applyPlan.removeDuplicates.modelId,
          columns: applyPlan.removeDuplicates.columns,
          duplicate: applyPlan.removeDuplicates.duplicateAction,
          keep_rule: applyPlan.removeDuplicates.keepRule,
        });
      } else if (applyPlan.kind === 'merge_column' && applyPlan.mergeColumn) {
        const mergePlan = applyPlan.mergeColumn;
        await mergeColumnsMutation.mutateAsync({
          model_id: mergePlan.modelId,
          columns: mergePlan.sourceColumnIds,
          new_column_title: mergePlan.mergedColumnTitle,
          merge_format: mergePlan.mergeFormat,
          custom_separator: mergePlan.mergeFormat === 'custom' ? mergePlan.mergeCustomSeparator : undefined,
          keep_original_column: mergePlan.mergeKeepOriginalColumns,
          add_at_end: mergePlan.mergePlacement === 'end_of_table',
        });
      } else if (applyPlan.kind === 'split_column' && applyPlan.splitColumn) {
        const splitPlan = applyPlan.splitColumn;
        const sourceColumn = columns.find((column) => getGridColumnIdentity(column) === splitPlan.sourceColumnId);
        if (!sourceColumn) {
          throw new Error('Source column not found for split operation');
        }

        const sourceColumnId = String(sourceColumn.id || '');

        // Map state parameters to useSplitColumn hook parameters
        let delimiter = '';
        if (state.splitMode === 'separator') {
          if (state.splitSeparatorType === 'custom') {
            delimiter = state.splitCustomSeparator;
          } else if (state.splitSeparatorType === 'space') {
            delimiter = ' ';
          } else if (state.splitSeparatorType === 'comma') {
            delimiter = ',';
          } else if (state.splitSeparatorType === 'dash') {
            delimiter = '-';
          }
        }

        // Call the useSplitColumn mutation
        await splitColumnMutation.mutateAsync({
          model_id: splitPlan.modelId,
          column_id: sourceColumnId,
          split_method: state.splitMode === 'separator' ? 'delimiter' : state.splitMode,
          delimiter: state.splitMode === 'separator' ? delimiter : undefined,
          fixed_length: state.splitMode === 'fixed_length' ? Number.parseInt(state.splitCharacterCount, 10) : undefined,
          fixed_length_action: state.splitMode === 'fixed_length' ? state.splitFixedDirection : undefined,
          pattern: state.splitMode === 'pattern' ? state.splitPattern : undefined,
          keep_original: state.splitOutputMode === 'keep_original',
          where: state.splitPlacement === 'next_to_original' ? 'next' : 'end',
        });
      }
      else if (applyPlan.kind === 'remove_special_characters' && applyPlan.removeSpecialCharacters) {
        await removeSpecialCharactersMutation.mutateAsync({
          model_id: applyPlan.removeSpecialCharacters.modelId,
          columns: applyPlan.removeSpecialCharacters.columns,
          special_characters_type: applyPlan.removeSpecialCharacters.specialCharactersType,
          custom: applyPlan.removeSpecialCharacters.custom,
        });
      }
      else if (applyPlan.kind === 'extract_substring' && applyPlan.extractSubstring) {
        const extractPlan = applyPlan.extractSubstring;
        const sourceColumn = columns.find((column) =>
          matchesSelectedColumn(column, extractPlan.sourceColumnId) || getGridColumnIdentity(column) === extractPlan.sourceColumnId
        );
        if (!sourceColumn) {
          throw new Error('Source column not found for extract operation');
        }

        const outputColumnTitle = extractPlan.outputColumnTitle.trim() || getExtractOutputTitle(extractPlan.extractionMethod, extractPlan.extractionType);
        const outputColumnId = extractPlan.outputColumnId || outputColumnTitle;
        const sourceColumnId = String(sourceColumn.id || '');
        const sourceOrderIndex = getColumnOrderIndex(sourceColumn, 0);
        const maxOrderIndex = Array.isArray(tableData?.columns)
          ? tableData!.columns.reduce((max, column: any) => {
            const value = Number(column?.order_index ?? 0);
            return Number.isFinite(value) && value > max ? value : max;
          }, sourceOrderIndex)
          : sourceOrderIndex;

        const createOrderBase = extractPlan.placement === 'next_to_original'
          ? sourceOrderIndex
          : maxOrderIndex;

        updateTableCache((tableSection) => {
          const nextColumns = Array.isArray(tableSection.columns) ? [...tableSection.columns] : [];
          const sourceIndex = nextColumns.findIndex((column: any) => String(column.id) === sourceColumnId);

          if (extractPlan.keepOriginalColumn) {
            const extractedColumnRecord = buildCreatedApiColumn(
              tableData,
              outputColumnTitle,
              outputColumnId,
              createOrderBase + 1,
            );

            if (extractPlan.placement === 'next_to_original' && sourceIndex >= 0) {
              nextColumns.splice(sourceIndex + 1, 0, extractedColumnRecord);
            } else {
              nextColumns.push(extractedColumnRecord);
            }
          } else if (sourceIndex >= 0) {
            nextColumns[sourceIndex] = {
              ...nextColumns[sourceIndex],
              title: outputColumnTitle,
              column_name: outputColumnTitle,
            };
          }

          tableSection.columns = nextColumns;
        });

        await extractSubstringMutation.mutateAsync({
          model_id: extractPlan.modelId,
          column_id: extractPlan.sourceColumnId,
          extraction_method: extractPlan.extractionMethod,
          extraction_type: extractPlan.extractionType,
          start_after: extractPlan.startAfter || undefined,
          end_before: extractPlan.endBefore || undefined,
          keep_original_column: extractPlan.keepOriginalColumn,
          add_at_end: extractPlan.placement === 'end_of_table',
        });
      } 
      else if (applyPlan.kind === 'remove_formatting' && applyPlan.removeFormatting) {
      await removeFormattingMutation.mutateAsync({
        model_id: applyPlan.removeFormatting.modelId,
        columns: applyPlan.removeFormatting.columns,
        formatting: applyPlan.removeFormatting.formatting,
        custom_pattern: applyPlan.removeFormatting.customPattern,
      });
    }
      else {
        await Promise.all(
          applyPlan.columnUpdates.map((updateGroup) =>
            bulkUpdateFieldService({
              model_id: tableId,
              column_id: updateGroup.columnId,
              updates: updateGroup.updates,
            })
          )
        );
      }

      if (applyPlan.kind === 'merge_column') {
        toast.success('Columns merged successfully.', { title: 'Success' });
      }

      onClose();
    } catch (error) {
      console.error('Failed to apply grid data operation:', error);
      if (previousData) {
        queryClient.setQueryData(['tables', tableId], previousData);
      }
      toast.error(getOperationErrorMessage(error, 'Failed to merge columns. Please try again.'), {
        title: applyPlan.kind === 'merge_column' ? 'Merge failed' : 'Action failed',
      });
    } finally {
      setIsApplying(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10040] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close grid action modal"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative z-[10041] flex h-[calc(100vh-2rem)] w-full max-w-full flex-col overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <action.icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{action.label}</h2>
              <p className="mt-1 text-sm text-secondary">{action.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-secondary transition-colors hover:bg-gray-100 hover:text-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 min-h-0 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1.8fr)_440px]">
          <div className="min-h-0 overflow-hidden border-r bg-muted/20 p-6">
            {preview ? (
              <GridDataOperationPreviewGrid columns={previewColumns} preview={preview} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-border/70 bg-background/60 px-6 text-center text-sm text-secondary">
                Preview will appear here once the data is ready.
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden bg-gray-50">
            <GridDataOperationPanel
              action={action}
              columns={columns}
              state={state}
              onStateChange={handleStateChange}
            />

            <div className="border-t bg-card px-5 py-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isApplying || !applyPlan || Boolean(mergeValidationError)}
                  className="flex-1 rounded-xl btn-primary px-4 py-2.5 text-sm font-medium"
                >
                  {isApplying ? 'Applying...' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
