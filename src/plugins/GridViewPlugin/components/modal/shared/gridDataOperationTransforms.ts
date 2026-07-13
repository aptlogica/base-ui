// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { DateTime } from 'luxon';
import type { GridColumn } from '../../../types/grid.types';
import type {
  GridActionId,
} from '../../toolbar/gridActionCatalog';
import type {
  GridCaseFormat,
  GridExtractMethod,
  GridExtractType,
  GridFormattingMode,
  GridFindReplaceMatchMode,
  GridSplitFixedDirection,
  GridSplitSeparatorType,
  GridMergeFormat,
  GridCharRemovalMode,
  GridDataOperationContext,
  GridDataOperationPreviewResult,
  GridDataOperationPreviewRow,
  GridDataOperationState,
  GridSpaceMode,
} from './gridDataOperation.types';

const PREVIEW_ROW_LIMIT = 100;

const previewSupportedActions = new Set<GridActionId>([
  'case_normalization',
  'remove_extra_spaces',
  'find_replace',
  'remove_special_characters',
  'remove_formatting',
  'remove_duplicates',
  'split_column',
  'merge_column',
  'extract_substring',
]);

const CHAR_REMOVAL_PATTERNS: Record<Exclude<GridCharRemovalMode, 'custom'>, RegExp> = {
  symbols: /[@#%&*!~^+=|\\/_`-]/g,
  currency_symbols: /[₹$€£¥¢₩₽₿]/gu,
  brackets: /[[\](){}]/g,
  punctuation: /[,.:;]/g,
};

const getRowId = (row: Record<string, any>, index: number) => {
  const directId = row?.id ?? row?._meta?.id ?? row?.meta?.id;
  return String(directId ?? index + 1);
};

const normalizeRow = (row: Record<string, any>) => {
  if (!row || typeof row !== 'object') {
    return {};
  }

  const rawData = row.data && typeof row.data === 'object' && !Array.isArray(row.data)
    ? row.data
    : row;

  const normalized: Record<string, any> = { ...rawData };
  delete normalized.data;
  delete normalized.meta;
  delete normalized._meta;
  return normalized;
};

const normalizeDuplicateText = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const getDuplicateValueToken = (value: unknown, looseMatch = true) => {
  if (typeof value === 'string') {
    return JSON.stringify(looseMatch ? normalizeDuplicateText(value) : value);
  }
  return JSON.stringify(value ?? null);
};

const extractSupportedTypes = new Set<GridExtractType>([
  'email',
  'keywords',
  'mentions',
  'tags',
  'url',
  'domain',
  'emoji',
  'phone',
  'prefix',
]);
const extractEmailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu;
const extractUrlPattern = /\b(?:https?:\/\/|www\.)[^\s<>()]+/giu;
const extractMentionPattern = /(?:^|\s)(@[\w.-]+)/gu;
const extractTagPattern = /(?:^|\s)(#\w+)/gu;
const extractEmojiPattern = /\p{Extended_Pictographic}/gu;
const extractPhonePattern = /(?:^|[^\d])(\+?\d[\d\s().-]{7,}\d)(?=$|[^\d])/gu;
const keywordStopWords = new Set([
  'a', 'an', 'and', 'the', 'or', 'but', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'from', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'it', 'this', 'that', 'these', 'those', 'as', 'into',
  'over', 'under', 'about', 'after', 'before', 'between', 'through', 'during', 'without', 'within',
]);

const trailingPunctuation = new Set(['.', ',', ';', ':', '!', '?', ')']);

const cleanMatch = (value: string) => {
  let end = value.length;
  while (end > 0 && trailingPunctuation.has(value[end - 1]!)) {
    end -= 1;
  }
  return end === value.length ? value : value.slice(0, end);
};

const getExtractionTitle = (type: GridExtractType, method: GridExtractMethod) => {
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
};

const extractBetweenCharacters = (value: string, startAfter: string, endBefore: string) => {
  if (!startAfter.trim() || !endBefore.trim()) return '';

  const startIndex = value.indexOf(startAfter);
  if (startIndex < 0) return '';

  const contentStart = startIndex + startAfter.length;
  const endIndex = value.indexOf(endBefore, contentStart);
  if (endIndex < 0 || endIndex < contentStart) return '';

  return value.slice(contentStart, endIndex);
};

const extractDomainFromValue = (value: string) => {
  const domains: string[] = [];

  for (const match of value.matchAll(extractEmailPattern)) {
    const domain = match[0].split('@')[1] ?? '';
    const cleaned = cleanMatch(domain);
    if (cleaned) domains.push(cleaned);
  }

  for (const match of value.matchAll(extractUrlPattern)) {
    const urlValue = cleanMatch(match[0]);
    if (!urlValue) continue;

    try {
      const normalizedUrl = /^https?:\/\//i.test(urlValue) ? urlValue : `https://${urlValue}`;
      const hostname = new URL(normalizedUrl).hostname.replace(/^www\./i, '');
      if (hostname) domains.push(hostname);
    } catch {
      continue;
    }
  }

  return domains.join(', ');
};

const extractValueByType = (value: string, type: GridExtractType) => {
  switch (type) {
    case 'email':
      return Array.from(value.matchAll(extractEmailPattern), (match) => match[0]).join(', ');
    case 'url':
      return Array.from(value.matchAll(extractUrlPattern), (match) => cleanMatch(match[0])).filter(Boolean).join(', ');
    case 'domain':
      return extractDomainFromValue(value);
    case 'keywords': {
      const words = value.toLowerCase().match(/\b[\p{L}\p{N}']+\b/gu) ?? [];
      const tokens = words.filter((word) => word.length > 2 && !keywordStopWords.has(word));
      const unique = Array.from(new Set(tokens));
      return unique.slice(0, 20).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(', ');
    }
    case 'mentions':
      return Array.from(value.matchAll(extractMentionPattern), (match) => match[1]).filter(Boolean).join(', ');
    case 'tags':
      return Array.from(value.matchAll(extractTagPattern), (match) => match[1]).filter(Boolean).join(', ');
    case 'emoji':
      return Array.from(value.matchAll(extractEmojiPattern), (match) => match[0]).join(', ');
    case 'phone':
      return Array.from(value.matchAll(extractPhonePattern), (match) => match[1]).map((item) => item.trim()).filter(Boolean).join(', ');
    case 'prefix': {
      const prefixes = Array.from(value.matchAll(extractEmailPattern), (match) => match[0].split('@')[0] ?? '').filter(Boolean);
      return prefixes.join(', ');
    }
    default:
      return '';
  }
};

const getSplitMaxColumns = (state: GridDataOperationState) =>
  Math.max(2, Number.parseInt(state.splitMaxColumns, 10) || 10);

const buildSplitOutputTitles = (sourceTitle: string, count: number) =>
  Array.from({ length: count }, (_, index) => `${sourceTitle} Part ${index + 1}`);

const splitBySeparator = (
  value: string,
  separatorType: GridSplitSeparatorType,
  customSeparator: string,
) => {
  const separatorMap: Record<Exclude<GridSplitSeparatorType, 'custom'>, { regex: RegExp; joiner: string }> = {
    space: { regex: /\s+/g, joiner: ' ' },
    comma: { regex: /,/g, joiner: ',' },
    dash: { regex: /-/g, joiner: '-' },
  };

  const customConfig = customSeparator
    ? { regex: new RegExp(escapeRegExp(customSeparator), 'g'), joiner: customSeparator }
    : null;

  const config = separatorType === 'custom'
    ? customConfig
    : separatorMap[separatorType];

  if (!config) {
    return { parts: [value], joiner: '' };
  }

  return {
    parts: value
      .split(config.regex)
      .map((part) => part.trim())
      .filter(Boolean),
    joiner: config.joiner,
  };
};

const splitByFixedLength = (
  value: string,
  direction: GridSplitFixedDirection,
  characterCount: string,
) => {
  const count = Math.max(0, Number.parseInt(characterCount, 10) || 0);
  if (!count) return { parts: [value], joiner: '' };

  const parts: string[] = [];

  if (direction === 'before') {
    for (let end = value.length; end > 0; end -= count) {
      const start = Math.max(0, end - count);
      parts.unshift(value.slice(start, end));
      if (start === 0) break;
    }
  } else {
    for (let start = 0; start < value.length; start += count) {
      parts.push(value.slice(start, start + count));
    }
  }

  return {
    parts: parts.filter(Boolean),
    joiner: '',
  };
};

const splitByPattern = (value: string, pattern: string) => {
  if (!pattern.trim()) return { parts: [value], joiner: '' };

  try {
    const regex = new RegExp(pattern, 'g');
    return {
      parts: value.split(regex).map((part) => part.trim()).filter(Boolean),
      joiner: '',
    };
  } catch {
    return { parts: [value], joiner: '' };
  }
};

const splitValue = (
  value: unknown,
  state: GridDataOperationState,
) => {
  if (typeof value !== 'string') {
    return { parts: [''], joiner: '' };
  }

  switch (state.splitMode) {
    case 'fixed_length':
      return splitByFixedLength(value, state.splitFixedDirection, state.splitCharacterCount);
    case 'pattern':
      return splitByPattern(value, state.splitPattern);
    case 'separator':
    default:
      return splitBySeparator(value, state.splitSeparatorType, state.splitCustomSeparator);
  }
};

const fitSplitPartsToLimit = (parts: string[], maxColumns: number, joiner: string) => {
  const normalizedParts = parts.length > 0 ? [...parts] : [''];
  const effectiveMaxColumns = Math.max(2, maxColumns);
  const outputCount = Math.max(2, Math.min(effectiveMaxColumns, normalizedParts.length));

  if (normalizedParts.length > outputCount) {
    const nextParts = normalizedParts.slice(0, outputCount - 1);
    nextParts.push(normalizedParts.slice(outputCount - 1).join(joiner));
    return nextParts;
  }

  while (normalizedParts.length < outputCount) {
    normalizedParts.push('');
  }

  return normalizedParts;
};

const extractValue = (
  value: unknown,
  state: GridDataOperationState,
) => {
  if (typeof value !== 'string') {
    return '';
  }

  if (state.extractMethod === 'between_characters') {
    return extractBetweenCharacters(value, state.extractStartAfter, state.extractEndBefore);
  }

  if (!extractSupportedTypes.has(state.extractType)) {
    return '';
  }

  return extractValueByType(value, state.extractType);
}

const getColumnIdentity = (column: { id?: string; key?: string; column_name?: string; title?: string }) =>
  String(column.id || column.key || column.column_name || column.title || '');

const getColumnValueKey = (column: { id?: string; key?: string; column_name?: string; title?: string }) =>
  String(column.key || column.column_name || column.id || column.title || '');

const getMergeSeparator = (format: GridMergeFormat, customSeparator: string) => {
  const separatorMap: Record<Exclude<GridMergeFormat, 'custom'>, string> = {
    space: ' ',
    comma: ',',
    dash: '-',
  };

  return format === 'custom' ? customSeparator : separatorMap[format];
};

const stringifyMergeValue = (value: unknown) => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();

  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};

export const mergeColumnValues = (values: unknown[], separator: string) =>
  values
    .map((value) => stringifyMergeValue(value))
    .filter((value) => value !== '')
    .join(separator);

const buildMergePreview = (
  columns: GridColumn[],
  records: Record<string, any>[],
  state: GridDataOperationState,
): GridDataOperationPreviewResult => {
  const previewRows: GridDataOperationPreviewRow[] = [];
  const changedRowIds: string[] = [];
  const affectedColumnsSet = new Set<string>();
  let affectedRows = 0;
  let affectedCells = 0;

  const columnById = new Map(columns.map((column) => [getColumnIdentity(column), column] as const));
  const selectedColumns = state.selectedColumnIds
    .map((columnId) => columnById.get(String(columnId)))
    .filter(Boolean) as GridColumn[];

  const emptyPreview = records.slice(0, PREVIEW_ROW_LIMIT).map((row, index) => ({
    id: getRowId(row, index),
    original: normalizeRow(row),
    values: normalizeRow(row),
    changedColumns: [] as string[],
    rowState: 'unchanged' as const,
  }));

  if (selectedColumns.length < 2) {
    return {
      supported: true,
      previewRows: emptyPreview,
      changedRowIds,
      totalRows: records.length,
      previewCount: emptyPreview.length,
      affectedRows: 0,
      affectedCells: 0,
      affectedColumns: 0,
      actionId: 'merge_column',
      virtualColumns: [],
    };
  }

  const separator = getMergeSeparator(state.mergeFormat, state.mergeCustomSeparator);
  const sourceKeys = selectedColumns.map((column) => getColumnValueKey(column));
  const mergedColumnTitle = state.mergeColumnTitle.trim()
    || selectedColumns.map((column) => String(column.title || column.column_name || '')).filter(Boolean).join(' ');
  const mergedOutputId = mergedColumnTitle;

  records.slice(0, PREVIEW_ROW_LIMIT).forEach((row, index) => {
    const original = normalizeRow(row);
    const values = { ...original };
    const changedColumns: string[] = [];
    let rowChanged = false;

    const mergedValue = mergeColumnValues(sourceKeys.map((key) => values[key]), separator);
    values[mergedOutputId] = mergedValue;
    changedColumns.push(mergedOutputId);
    affectedCells += 1;
    affectedColumnsSet.add(mergedOutputId);
    rowChanged = true;

    if (!state.mergeKeepOriginalColumns) {
      sourceKeys.forEach((key) => {
        if (values[key] === '' || values[key] == null) return;
        values[key] = '';
        changedColumns.push(key);
        affectedCells += 1;
        affectedColumnsSet.add(key);
      });
    }

    if (rowChanged) {
      affectedRows += 1;
      changedRowIds.push(getRowId(row, index));
    }

    previewRows.push({
      id: getRowId(row, index),
      original,
      values,
      changedColumns,
      rowState: rowChanged ? 'changed' : 'unchanged',
    });
  });

  return {
    supported: true,
    previewRows,
    changedRowIds,
    totalRows: records.length,
    previewCount: previewRows.length,
    affectedRows,
    affectedCells,
    affectedColumns: affectedColumnsSet.size,
    actionId: 'merge_column',
    virtualColumns: [{ id: mergedOutputId, title: mergedColumnTitle }],
  };
};

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
    getColumnIdentity(column),
    getColumnValueKey(column),
  ]
    .map((value) => String(value || ''))
    .includes(normalizedSelectedId);
}

const buildSplitPreview = (
  columns: GridColumn[],
  records: Record<string, any>[],
  state: GridDataOperationState,
): GridDataOperationPreviewResult => {
  const previewRows: GridDataOperationPreviewRow[] = [];
  const changedRowIds: string[] = [];
  const affectedColumnsSet = new Set<string>();
  let affectedRows = 0;
  let affectedCells = 0;

  const sourceColumn = columns.find((column) => {
    const columnId = getColumnIdentity(column);
    return columnId === state.splitSourceColumnId;
  });

  if (!sourceColumn) {
    return {
      supported: true,
      previewRows: records.slice(0, PREVIEW_ROW_LIMIT).map((row, index) => ({
        id: getRowId(row, index),
        original: normalizeRow(row),
        values: normalizeRow(row),
        changedColumns: [],
        rowState: 'unchanged',
      })),
      changedRowIds,
      totalRows: records.length,
      previewCount: Math.min(records.length, PREVIEW_ROW_LIMIT),
      affectedRows: 0,
      affectedCells: 0,
      affectedColumns: 0,
      actionId: 'split_column',
      virtualColumns: [],
    };
  }

  const sourceKey = getColumnValueKey(sourceColumn);
  const sourceIdentity = getColumnIdentity(sourceColumn);
  const sourceTitle = String(sourceColumn.title || sourceColumn.column_name || sourceIdentity);
  const maxColumns = getSplitMaxColumns(state);

  records.slice(0, PREVIEW_ROW_LIMIT).forEach((row, index) => {
    const original = normalizeRow(row);
    const values = { ...original };
    const sourceValue = values[sourceKey];
    const splitResult = splitValue(sourceValue, state);
    const splitParts = fitSplitPartsToLimit(splitResult.parts, maxColumns, splitResult.joiner);
    const outputTitles = buildSplitOutputTitles(sourceTitle, splitParts.length);
    const virtualColumns = state.splitOutputMode === 'replace_original'
      ? [
        { id: sourceIdentity, title: outputTitles[0] },
        ...outputTitles.slice(1).map((title, partIndex) => ({
          id: `${sourceIdentity}__split_${partIndex + 2}`,
          title,
        })),
      ]
      : outputTitles.map((title, partIndex) => ({
        id: `${sourceIdentity}__split_${partIndex + 1}`,
        title,
      }));

    const changedColumns: string[] = [];
    let rowChanged = false;

    if (typeof sourceValue === 'string') {
      if (state.splitOutputMode === 'replace_original') {
        const nextSourceValue = splitParts[0] ?? '';
        if (values[sourceKey] !== nextSourceValue) {
          values[sourceKey] = nextSourceValue;
          changedColumns.push(sourceKey);
          if (sourceIdentity !== sourceKey) {
            changedColumns.push(sourceIdentity);
          }
          affectedCells += 1;
          affectedColumnsSet.add(sourceKey);
          affectedColumnsSet.add(sourceIdentity);
          rowChanged = true;
        }

        virtualColumns.slice(1).forEach((column, partIndex) => {
          const nextValue = splitParts[partIndex + 1] ?? '';
          if (values[column.id] !== nextValue) {
            values[column.id] = nextValue;
            changedColumns.push(column.id);
            affectedCells += 1;
            affectedColumnsSet.add(column.id);
            rowChanged = true;
          }
        });
      } else {
        virtualColumns.forEach((column, partIndex) => {
          const nextValue = splitParts[partIndex] ?? '';
          if (values[column.id] !== nextValue) {
            values[column.id] = nextValue;
            changedColumns.push(column.id);
            affectedCells += 1;
            affectedColumnsSet.add(column.id);
            rowChanged = true;
          }
        });
      }
    }

    if (rowChanged) {
      affectedRows += 1;
      changedRowIds.push(getRowId(row, index));
    }

    previewRows.push({
      id: getRowId(row, index),
      original,
      values,
      changedColumns,
      rowState: rowChanged ? 'changed' : 'unchanged',
    });
  });

  const sampleSplitResult = splitValue(records[0]?.[sourceKey], state);
  const sampleOutputTitles = buildSplitOutputTitles(
    sourceTitle,
    fitSplitPartsToLimit(sampleSplitResult.parts, maxColumns, sampleSplitResult.joiner).length,
  );
  const virtualColumns = state.splitOutputMode === 'replace_original'
    ? [
      { id: sourceIdentity, title: sampleOutputTitles[0] },
      ...sampleOutputTitles.slice(1).map((title, index) => ({
        id: `${sourceIdentity}__split_${index + 2}`,
        title,
      })),
    ]
    : sampleOutputTitles.map((title, index) => ({
      id: `${sourceIdentity}__split_${index + 1}`,
      title,
    }));

  return {
    supported: true,
    previewRows,
    changedRowIds,
    totalRows: records.length,
    previewCount: previewRows.length,
    affectedRows,
    affectedCells,
    affectedColumns: affectedColumnsSet.size,
    actionId: 'split_column',
    virtualColumns,
  };
};

const buildExtractPreview = (
  columns: GridColumn[],
  records: Record<string, any>[],
  state: GridDataOperationState,
): GridDataOperationPreviewResult => {
  const previewRows: GridDataOperationPreviewRow[] = [];
  const changedRowIds: string[] = [];
  const affectedColumnsSet = new Set<string>();
  let affectedRows = 0;
  let affectedCells = 0;

  const sourceColumn = columns.find((column) => matchesSelectedColumn(column, state.selectedColumnIds[0]));
  if (!sourceColumn) {
    return {
      supported: true,
      previewRows: records.slice(0, PREVIEW_ROW_LIMIT).map((row, index) => ({
        id: getRowId(row, index),
        original: normalizeRow(row),
        values: normalizeRow(row),
        changedColumns: [],
        rowState: 'unchanged',
      })),
      changedRowIds,
      totalRows: records.length,
      previewCount: Math.min(records.length, PREVIEW_ROW_LIMIT),
      affectedRows: 0,
      affectedCells: 0,
      affectedColumns: 0,
      actionId: 'extract_substring',
      virtualColumns: [],
    };
  }

  const sourceKey = getColumnValueKey(sourceColumn);
  const sourceIdentity = getColumnIdentity(sourceColumn);
  const outputTitle = getExtractionTitle(state.extractType, state.extractMethod);
  const outputId = state.extractKeepOriginalColumn ? outputTitle : sourceKey;

  records.slice(0, PREVIEW_ROW_LIMIT).forEach((row, index) => {
    const original = normalizeRow(row);
    const values = { ...original };
    const sourceValue = values[sourceKey];
    const extractedValue = extractValue(sourceValue, state);
    const hasExtraction = extractedValue !== '';
    const changedColumns: string[] = [];
    let rowChanged = false;

    if (state.extractKeepOriginalColumn && hasExtraction) {
      if (values[outputId] !== extractedValue) {
        values[outputId] = extractedValue;
        changedColumns.push(outputId);
        affectedCells += 1;
        affectedColumnsSet.add(outputId);
        rowChanged = true;
      }
    } else if (!state.extractKeepOriginalColumn && hasExtraction && typeof sourceValue === 'string' && sourceValue !== extractedValue) {
      values[sourceKey] = extractedValue;
      changedColumns.push(sourceKey);
      affectedCells += 1;
      affectedColumnsSet.add(sourceKey);
      rowChanged = true;
    }

    if (rowChanged) {
      affectedRows += 1;
      changedRowIds.push(getRowId(row, index));
    }

    previewRows.push({
      id: getRowId(row, index),
      original,
      values,
      changedColumns,
      rowState: rowChanged ? 'changed' : 'unchanged',
    });
  });

  const virtualColumnId = outputId === sourceKey ? sourceIdentity : outputId;
  const virtualColumns = state.extractKeepOriginalColumn
    ? [{ id: virtualColumnId, title: outputTitle }]
    : [{ id: sourceIdentity, title: outputTitle }];

  return {
    supported: true,
    previewRows,
    changedRowIds,
    totalRows: records.length,
    previewCount: previewRows.length,
    affectedRows,
    affectedCells,
    affectedColumns: affectedColumnsSet.size,
    actionId: 'extract_substring',
    virtualColumns,
  };
};

const capitalizeWords = (value: string) =>
  value
    .toLowerCase()
    .split(/(\s+)/)
    .map((part) => {
      if (!part.trim()) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');

const capitalizeSentences = (value: string) =>
  value
    .toLowerCase()
    .split(/([.!?]\s+)/)
    .map((part, index) => {
      if (index % 2 === 1) return part;
      const trimmed = part.trimStart();
      if (!trimmed) return part;
      const leading = part.slice(0, part.length - trimmed.length);
      return `${leading}${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
    })
    .join('');

export const normalizeCaseValue = (value: unknown, format: GridCaseFormat) => {
  if (typeof value !== 'string') return value;

  switch (format) {
    case 'lowercase':
      return value.toLowerCase();
    case 'uppercase':
      return value.toUpperCase();
    case 'title_case':
      return capitalizeWords(value);
    case 'sentence_case':
      return capitalizeSentences(value);
    default:
      return value;
  }
};

export const normalizeWhitespaceValue = (value: unknown, mode: GridSpaceMode) => {
  if (typeof value !== 'string') return value;

  switch (mode) {
    case 'leading':
      return value.replace(/^\s+/g, '');
    case 'trailing':
      return value.trimEnd();
    case 'extra':
      return value.replace(/\s+/g, ' ').trim();
    case 'both':
    default:
      return value.trim();
  }
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

export const replaceTextValue = (
  value: unknown,
  findText: string,
  replaceText: string,
  matchingCase: GridFindReplaceMatchMode,
) => {
  if (typeof value !== 'string') return value;
  if (!findText) return value;

  if (matchingCase === 'match_entire_value') {
    return value === findText ? replaceText : value;
  }

  const flags = matchingCase === 'ignore_case' ? 'gi' : 'g';
  const regex = new RegExp(escapeRegExp(findText), flags);
  return value.replace(regex, replaceText);
};

export const removeSpecialCharsValue = (
  value: unknown,
  mode: GridCharRemovalMode,
  customChar: string,
) => {
  if (typeof value !== 'string' || value.length === 0) return value;

  if (mode === 'custom') {
    if (!customChar) return value;
    const pattern = new RegExp(
      [...new Set(customChar.split(''))].map(escapeRegExp).join('|'),
      'g',
    );
    return value.replace(pattern, '');
  }

  return value.replace(CHAR_REMOVAL_PATTERNS[mode], '');
}

const stripFormattingCharacters = (value: string, characters: RegExp) => value.replace(characters, '');

const DATE_INPUT_FORMATS = [
  'yyyy-MM-dd',
  'yyyy/MM/dd',
  'yyyy.MM.dd',
  'yyyy MM dd',
  'dd-MM-yyyy',
  'dd/MM/yyyy',
  'dd.MM.yyyy',
  'dd MM yyyy',
  'MM-dd-yyyy',
  'MM/dd/yyyy',
  'MM.dd.yyyy',
  'MM dd yyyy',
  'd-M-yyyy',
  'd/M/yyyy',
  'd.M.yyyy',
  'd M yyyy',
  'M-d-yyyy',
  'M/d/yyyy',
  'M.d.yyyy',
  'M d yyyy',
  'ddMMyyyy',
  'MMddyyyy',
  'yyyyMMdd',
];

const buildDateTime = (year: number, month: number, day: number) => {
  const date = DateTime.fromObject({ year, month, day }, { zone: 'utc' });
  return date.isValid ? date : null;
};

const parseCompactDate = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const yearFirst = buildDateTime(
    Number(digits.slice(0, 4)),
    Number(digits.slice(4, 6)),
    Number(digits.slice(6, 8)),
  );
  if (yearFirst) return yearFirst;

  const dayFirst = buildDateTime(
    Number(digits.slice(4, 8)),
    Number(digits.slice(2, 4)),
    Number(digits.slice(0, 2)),
  );
  if (dayFirst) return dayFirst;

  const monthFirst = buildDateTime(
    Number(digits.slice(4, 8)),
    Number(digits.slice(0, 2)),
    Number(digits.slice(2, 4)),
  );
  if (monthFirst) return monthFirst;

  return null;
};

const parseDateValue = (rawValue: string) => {
  const value = rawValue.trim();
  if (!value) return null;

  const compactValue = value.replace(/\s+/g, ' ');

  const isoDate = DateTime.fromISO(compactValue, { zone: 'utc' });
  if (isoDate.isValid) return isoDate;

  for (const format of DATE_INPUT_FORMATS) {
    const parsed = DateTime.fromFormat(compactValue, format, { zone: 'utc' });
    if (parsed.isValid) return parsed;
  }

  return parseCompactDate(compactValue);
};

const splitCustomPatterns = (pattern: string) =>
  pattern
    .split(/[\n,;]+/g)
    .map((part) => part.trim())
    .filter(Boolean);

const buildCustomPatternRegex = (pattern: string) => {
  const patterns = splitCustomPatterns(pattern);
  if (!patterns.length) return null;

  const source = patterns.length === 1
    ? escapeRegExp(patterns[0])
    : patterns.map((part) => escapeRegExp(part)).join('|');

  return new RegExp(source, 'g');
};

export const normalizeCustomFormattingPattern = (pattern: string) => {
  const patterns = splitCustomPatterns(pattern);
  return patterns;
};

export const removeFormattingValue = (
  value: unknown,
  mode: GridFormattingMode,
  pattern = '',
) => {
  if (typeof value !== 'string') return value;

  switch (mode) {
    case 'currency':
      return stripFormattingCharacters(value, /[$€£₹¥₩₽₺₫₱,]/g);
    case 'percentage':
      return stripFormattingCharacters(value, /%/g);
    case 'separator':
      return stripFormattingCharacters(value, /,/g);
    case 'phone':
      return stripFormattingCharacters(value, /[\s().-]/g);
    case 'date':
      return parseDateValue(value)?.toFormat('yyyy-MM-dd') ?? value;
    case 'custom':
      {
        const regex = buildCustomPatternRegex(pattern);
        return regex ? stripFormattingCharacters(value, regex) : value;
      }
    default:
      return value;
  }
};

const applyActionToValue = (
  actionId: GridActionId,
  value: unknown,
  state: GridDataOperationState,
) => {
  switch (actionId) {
    case 'case_normalization':
      return normalizeCaseValue(value, state.caseFormat);
    case 'remove_extra_spaces':
      return normalizeWhitespaceValue(value, state.spaceMode);
    case 'find_replace':
      return replaceTextValue(value, state.findText, state.replaceText, state.matchingCase);
    case 'remove_special_characters':
      return removeSpecialCharsValue(value, state.charRemovalMode, state.customChar);
    case 'remove_formatting':
      return removeFormattingValue(value, state.formatting, state.formattingPattern);
    default:
      return value;
  }
};

export const buildGridDataOperationPreview = ({
  actionId,
  columns,
  tableData,
  state,
}: GridDataOperationContext): GridDataOperationPreviewResult => {
  const records = Array.isArray(tableData?.records) ? tableData.records : [];
  const supported = previewSupportedActions.has(actionId);
  const previewRows: GridDataOperationPreviewRow[] = [];
  const changedRowIds: string[] = [];
  let affectedRows = 0;
  let affectedCells = 0;
  const affectedColumnsSet = new Set<string>();

  const selectedColumnIdSet = new Set(state.selectedColumnIds.map(String));
  const previewColumns = columns.filter((column) => column.id || column.key);
  const sourceEntries = records.slice(0, PREVIEW_ROW_LIMIT).map((row, index) => {
    const original = normalizeRow(row);
    const values = { ...original };
    return {
      row,
      index,
      id: getRowId(row, index),
      original,
      values,
      changedColumns: [] as string[],
      rowState: 'unchanged',
    };
  });

  if (actionId === 'remove_duplicates' && supported) {
    const selectedColumns = previewColumns.filter((column) => {
      const columnKey = String(column.key || column.column_name || column.id || column.title || '');
      const columnIdentity = String(column.id || columnKey);
      return selectedColumnIdSet.has(columnIdentity) || selectedColumnIdSet.has(columnKey);
    });
    const duplicateAction = state.duplicateAction ?? 'remove_row';

    if (selectedColumns.length === 0) {
      sourceEntries.forEach((entry) => {
        previewRows.push({
          id: entry.id,
          original: entry.original,
          values: entry.values,
          changedColumns: [],
          rowState: 'unchanged',
        });
      });

      return {
        supported,
        previewRows,
        changedRowIds,
        totalRows: records.length,
        previewCount: previewRows.length,
        affectedRows,
        affectedCells: 0,
        affectedColumns: 0,
        actionId,
      };
    }

    const looseMatch = duplicateAction !== 'remove_duplicates_matchCase';
    const groupMap = new Map<string, typeof sourceEntries>();
    sourceEntries.forEach((entry) => {
      const groupKey = selectedColumns
        .map((column) => {
          const columnKey = String(column.key || column.column_name || column.id || column.title || '');
          return `${columnKey}:${getDuplicateValueToken(entry.values[columnKey], looseMatch)}`;
        })
        .join('|');

      const current = groupMap.get(groupKey) ?? [];
      current.push(entry);
      groupMap.set(groupKey, current);
    });

    const keepRule = state.duplicateKeepRule ?? 'keep_first';
    groupMap.forEach((group) => {
      if (group.length <= 1) return;

      const keeper = keepRule === 'keep_last' ? group.at(-1) : group[0];
      keeper!.rowState = 'kept';

      group.forEach((entry) => {
        if (entry === keeper) return;
        if (duplicateAction === 'remove_duplicates') {
          selectedColumns.forEach((column) => {
            const columnKey = String(column.key || column.column_name || column.id || column.title || '');
            if (!columnKey) return;
            if (entry.values[columnKey] === '' || entry.values[columnKey] === null || entry.values[columnKey] === undefined) {
              return;
            }
            entry.values[columnKey] = '';
            entry.changedColumns.push(columnKey);
            affectedCells += 1;
            affectedColumnsSet.add(columnKey);
          });

          if (entry.changedColumns.length > 0) {
            entry.rowState = 'changed';
            affectedRows += 1;
            changedRowIds.push(entry.id);
          }
          return;
        }

        entry.rowState = 'removed';
        affectedRows += 1;
        changedRowIds.push(entry.id);
      });
    });

    sourceEntries.forEach((entry) => {
      previewRows.push({
        id: entry.id,
        original: entry.original,
        values: entry.values,
        changedColumns: entry.changedColumns,
        rowState: entry.rowState as GridDataOperationPreviewRow['rowState'],
      });
    });

    return {
      supported,
      previewRows,
      changedRowIds,
      totalRows: records.length,
      previewCount: previewRows.length,
      affectedRows,
      affectedCells,
      affectedColumns: selectedColumns.length,
      actionId,
    };
  }

  if (actionId === 'split_column' && supported) {
    return buildSplitPreview(columns, records, state);
  }

  if (actionId === 'merge_column' && supported) {
    return buildMergePreview(columns, records, state);
  }

  if (actionId === 'extract_substring' && supported) {
    return buildExtractPreview(columns, records, state);
  }

  sourceEntries.forEach((entry) => {
    const { row, index, original, values } = entry;
    const changedColumns: string[] = [];

    if (supported) {
      previewColumns.forEach((column) => {
        const columnKey = String(column.key || column.column_name || column.id || column.title || '');
        const columnIdentity = String(column.id || columnKey);
        if (!columnKey) return;
        if (!selectedColumnIdSet.has(columnIdentity) && !selectedColumnIdSet.has(columnKey)) return;

        const nextValue = applyActionToValue(actionId, values[columnKey], state);
        if (nextValue !== values[columnKey]) {
          values[columnKey] = nextValue;
          changedColumns.push(columnKey);
          affectedCells += 1;
          affectedColumnsSet.add(columnKey);
        }
      });
    }

    if (changedColumns.length > 0) {
      affectedRows += 1;
      changedRowIds.push(String(getRowId(row, index)));
    }

    previewRows.push({
      id: getRowId(row, index),
      original,
      values,
      changedColumns,
      rowState: changedColumns.length > 0 ? 'changed' : 'unchanged',
    });
  });

  return {
    supported,
    previewRows,
    changedRowIds,
    totalRows: records.length,
    previewCount: previewRows.length,
    affectedRows,
    affectedCells,
    affectedColumns: affectedColumnsSet.size,
    actionId,
  };
};

export const applyGridDataOperationToRecords = (
  records: Record<string, any>[],
  preview: GridDataOperationPreviewResult,
) => {
  const rowById = new Map(preview.previewRows.map((row) => [row.id, row]));
  const nextRecords: Record<string, any>[] = [];

  records.forEach((record, index) => {
    const rowId = getRowId(record, index);
    const previewRow = rowById.get(rowId);
    if (!previewRow) {
      nextRecords.push(record);
      return;
    }

    if (previewRow.rowState === 'removed') {
      return;
    }

    const nextRecord = { ...record };
    const isStructured = nextRecord.data && typeof nextRecord.data === 'object' && !Array.isArray(nextRecord.data);
    const target = isStructured ? { ...nextRecord.data } : nextRecord;

    previewRow.changedColumns.forEach((columnKey) => {
      target[columnKey] = previewRow.values[columnKey];
    });

    if (isStructured) {
      nextRecord.data = target;
      nextRecords.push(nextRecord);
      return;
    }

    nextRecords.push(target);
  });

  return nextRecords;
};
