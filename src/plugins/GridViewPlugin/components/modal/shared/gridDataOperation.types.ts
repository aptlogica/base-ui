// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import type { TableData } from '../../../../../types/api.types';
import type { GridColumn } from '../../../types/grid.types';
import type { GridActionId } from '../../toolbar/gridActionCatalog';

export type GridDataOperationScope = 'all' | 'filtered' | 'selected';
export type GridCaseFormat = 'lowercase' | 'uppercase' | 'title_case' | 'sentence_case';
export type GridSpaceMode = 'both' | 'leading' | 'trailing' | 'extra';
export type GridTrimWhitespaceMode = 'trim_both' | 'trim_leading' | 'trim_trailing' | 'collapse_spaces';
export type GridFindReplaceMatchMode = 'match_case' | 'ignore_case' | 'match_entire_value';
export type GridCharRemovalMode =
  | 'symbols'
  | 'currency_symbols'
  | 'brackets'
  | 'punctuation'
  | 'custom';
export type GridFormattingMode = 'currency' | 'percentage' | 'separator' | 'phone' | 'date' | 'custom';
export type GridDuplicateKeepRule = 'keep_first' | 'keep_last' | 'keep_latest_updated' | 'keep_highest' | 'keep_lowest';
export type GridSplitMode = 'separator' | 'fixed_length' | 'pattern';
export type GridSplitSeparatorType = 'space' | 'comma' | 'dash' | 'custom';
export type GridSplitFixedDirection = 'after' | 'before';
export type GridSplitOutputMode = 'keep_original' | 'replace_original';
export type GridSplitPlacement = 'next_to_original' | 'end_of_table';
export type GridMergeFormat = 'space' | 'comma' | 'dash' | 'custom';
export type GridMergePlacement = 'next_to_original' | 'end_of_table';
export type GridDuplicateAction = 'remove_row' | 'remove_duplicates' | 'remove_duplicates_matchCase';
export type GridExtractMethod = 'extraction_type' | 'between_characters';
export type GridExtractType = 'email' | 'keywords' | 'mentions' | 'tags' | 'url' | 'domain' | 'emoji' | 'phone' | 'prefix';
export type GridExtractPlacement = 'next_to_original' | 'end_of_table';

export interface GridDataOperationState {
  scope: GridDataOperationScope;
  selectedColumnIds: string[];
  caseFormat: GridCaseFormat;
  spaceMode: GridSpaceMode;
  formatting: GridFormattingMode;
  formattingPattern: string;
  findText: string;
  replaceText: string;
  matchingCase: GridFindReplaceMatchMode;
  duplicateAction: GridDuplicateAction;
  duplicateKeepRule: GridDuplicateKeepRule;
  splitSourceColumnId: string;
  splitMode: GridSplitMode;
  splitSeparatorType: GridSplitSeparatorType;
  splitCustomSeparator: string;
  splitMaxColumns: string;
  splitFixedDirection: GridSplitFixedDirection;
  splitCharacterCount: string;
  splitPattern: string;
  splitOutputMode: GridSplitOutputMode;
  splitPlacement: GridSplitPlacement;
  mergeFormat: GridMergeFormat;
  mergeCustomSeparator: string;
  mergeColumnTitle: string;
  mergeKeepOriginalColumns: boolean;
  mergePlacement: GridMergePlacement;
  charRemovalMode: GridCharRemovalMode;
  customChar: string;
  extractMethod: GridExtractMethod;
  extractType: GridExtractType;
  extractStartAfter: string;
  extractEndBefore: string;
  extractKeepOriginalColumn: boolean;
  extractPlacement: GridExtractPlacement;
  fuzzySensitivity: 'low' | 'medium' | 'high';
  rowActions?: Record<string, 'keep' | 'delete' | 'clear' | 'none'>;
  deduplicationMode?: 'automatic' | 'manual';
}

export interface GridDataOperationPreviewRow {
  id: string;
  original: Record<string, any>;
  values: Record<string, any>;
  changedColumns: string[];
  rowState?: 'unchanged' | 'changed' | 'removed' | 'kept';
  groupId?: string;
}

export interface GridDataOperationPreviewResult {
  supported: boolean;
  previewRows: GridDataOperationPreviewRow[];
  changedRowIds: string[];
  virtualColumns?: Array<{ id: string; title: string }>;
  totalRows: number;
  previewCount: number;
  affectedRows: number;
  affectedCells: number;
  affectedColumns: number;
  actionId: GridActionId;
  deduplicationMode?: 'automatic' | 'manual';
  duplicateAction?: 'remove_row' | 'remove_duplicates';
}

export interface GridDataOperationCellUpdate {
  id: string;
  value: any;
}

export interface GridDataOperationColumnUpdatePlan {
  columnId: string;
  updates: GridDataOperationCellUpdate[];
}

export interface GridRemoveFormattingApplyPlan {
  modelId: string;
  columns: string[];
  formatting: GridFormattingMode;
  customPattern?: string[];
}

export interface GridDataOperationApplyPlan {
  supported: boolean;
  kind: 'bulk_update' | 'trim_whitespace' | 'case_normalization' | 'find_replace' | 'remove_duplicates' | 'split_column' | 'merge_column' | 'remove_special_characters' | 'extract_substring' | 'remove_formatting' | 'fuzzy_deduplication';
  columnUpdates: GridDataOperationColumnUpdatePlan[];
  optimisticRecords: Record<string, any>[];
  trimWhitespace?: {
    modelId: string;
    columns: string[];
    trimMode: GridTrimWhitespaceMode;
  };
  caseNormalization?: {
    modelId: string;
    columns: string[];
    caseFormat: GridCaseFormat;
  };
  findReplace?: {
    modelId: string;
    columns: string[];
    findValue: string;
    replaceValue: string;
    matchType: GridFindReplaceMatchMode;
  };
  removeDuplicates?: {
    modelId: string;
    columns: string[];
    rowIdsToDelete: number[];
    duplicateAction: GridDuplicateAction;
    keepRule: GridDuplicateKeepRule;
  };
  splitColumn?: {
    modelId: string;
    sourceColumnId: string;
    sourceColumnTitle: string;
    outputColumnTitles: string[];
    outputColumnIds?: string[];
    splitMode: GridSplitMode;
    splitSeparatorType: GridSplitSeparatorType;
    splitCustomSeparator: string;
    splitMaxColumns: number;
    splitFixedDirection: GridSplitFixedDirection;
    splitCharacterCount: string;
    splitPattern: string;
    splitOutputMode: GridSplitOutputMode;
    splitPlacement: GridSplitPlacement;
  };
  extractSubstring?: {
    modelId: string;
    sourceColumnId: string;
    sourceColumnTitle: string;
    extractionMethod: GridExtractMethod;
    extractionType: GridExtractType;
    startAfter: string;
    endBefore: string;
    keepOriginalColumn: boolean;
    placement: GridExtractPlacement;
    outputColumnId?: string;
    outputColumnTitle: string;
  };
  mergeColumn?: {
    modelId: string;
    sourceColumnIds: string[];
    mergedColumnTitle: string;
    mergeFormat: GridMergeFormat;
    mergeCustomSeparator: string;
    mergeKeepOriginalColumns: boolean;
    mergePlacement: GridMergePlacement;
    outputColumnId: string;
  };
  removeSpecialCharacters?: {
    modelId: string;
    columns: string[];
    specialCharactersType: GridCharRemovalMode;
    custom?: string[];
  };
  removeFormatting?: GridRemoveFormattingApplyPlan;
  fuzzyDeduplication?: {
    modelId: string;
    columns: string[];
    threshold: 'low' | 'medium' | 'high';
    duplicateAction: 'remove_row' | 'remove_duplicates';
    keepRule: 'keep_first' | 'keep_last' | 'keep_latest_updated';
    deduplicationMode?: 'automatic' | 'manual';
    rowActions?: Record<string, 'keep' | 'delete' | 'clear' | 'none'>;
  };
}

export interface GridScanProgress {
  isScanning: boolean;
  scannedRows: number;
  totalRows: number;
  duplicatesDetected: number;
}

export interface GridDataOperationContext {
  actionId: GridActionId;
  columns: GridColumn[];
  tableData: TableData;
  state: GridDataOperationState;
  onProgress?: (progress: { scannedRows: number; totalRows: number; duplicatesDetected: number }) => void;
}

export interface GridDataOperationAdapter {
  buildPreview: (context: GridDataOperationContext) => GridDataOperationPreviewResult;
  buildPreviewAsync?: (context: GridDataOperationContext) => Promise<GridDataOperationPreviewResult>;
  buildApplyPlan: (
    context: GridDataOperationContext,
    preview: GridDataOperationPreviewResult,
  ) => GridDataOperationApplyPlan | null;
}
