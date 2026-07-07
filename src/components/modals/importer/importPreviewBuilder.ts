// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import Papa, { type ParseError, type ParseResult } from 'papaparse';
import { FieldType } from '../../../types/fieldTypes';
import type { ImportColumnMapping, ImportPreview, ImportPreviewColumn } from './ImportTypes';
import { normalizeImportFieldType } from './importFieldConfig';
import { normalizeImportCellValue } from './importCellValue';
import { inferImportDefaultValue, inferImportFieldType } from './importTypeInference';

const EMPTY_VALUE = '';

const slugifyColumnName = (value: string): string => {
  const chars: string[] = [];
  let lastWasUnderscore = false;

  for (const ch of value.trim().toLowerCase()) {
    const isAlnum = (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9');
    if (isAlnum) {
      chars.push(ch);
      lastWasUnderscore = false;
    } else if (!lastWasUnderscore) {
      chars.push('_');
      lastWasUnderscore = true;
    }
  }

  let normalized = chars.join('');
  while (normalized.startsWith('_')) {
    normalized = normalized.slice(1);
  }
  while (normalized.endsWith('_')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || 'column';
};

const makeUniqueKey = (label: string, seen: Set<string>, fallbackIndex: number): string => {
  const base = slugifyColumnName(label || `column_${fallbackIndex + 1}`);
  let next = base;
  let count = 2;

  while (seen.has(next)) {
    next = `${base}_${count}`;
    count += 1;
  }

  seen.add(next);
  return next;
};

const isJsonPreviewEnvelope = (value: unknown): value is { data: unknown[] } => {
  return Boolean(value) && typeof value === 'object' && Array.isArray((value as { data?: unknown[] }).data);
};

const buildPreviewFromRows = (rawRows: Record<string, unknown>[], preferredLabels?: string[]): ImportPreview => {
  const seenKeys = new Set<string>();
  const discoveredLabels = preferredLabels?.length
    ? preferredLabels
    : Array.from(new Set(rawRows.flatMap((row) => Object.keys(row || {}))));

  const columns: ImportPreviewColumn[] = discoveredLabels.map((label, index) => {
    const key = makeUniqueKey(label, seenKeys, index);
    const values = rawRows.map((row) => normalizeImportCellValue(row[label])).filter(Boolean);
    const inferredFieldType = inferImportFieldType(label, values);

    return {
      key,
      label,
      sampleValue: values[0] || EMPTY_VALUE,
      inferredFieldType,
      inferredDefaultValue: inferImportDefaultValue(inferredFieldType),
    };
  });

  const rows = rawRows.map((row) => {
    const mapped: Record<string, string> = {};
    columns.forEach((column) => {
      mapped[column.key] = normalizeImportCellValue(row[column.label]);
    });
    return mapped;
  });

  return {
    columns,
    rows,
    totalRows: rows.length,
  };
};

const parseJsonPreview = async (file: File): Promise<ImportPreview> => {
  const text = await file.text();
  const parsed: unknown = JSON.parse(text);

  let data: unknown[];
  if (Array.isArray(parsed)) {
    data = parsed;
  } else if (isJsonPreviewEnvelope(parsed)) {
    data = parsed.data;
  } else {
    data = [];
  }

  if (data.length === 0) {
    return { columns: [], rows: [], totalRows: 0 };
  }

  const normalizedRows = data
    .filter((row): row is Record<string, unknown> => row !== null && typeof row === 'object' && !Array.isArray(row));

  const labels = Array.from(new Set(normalizedRows.flatMap((row) => Object.keys(row))));
  return buildPreviewFromRows(normalizedRows, labels);
};

const parseCsvPreview = (file: File): Promise<ImportPreview> => {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: false,
      dynamicTyping: false,
      transformHeader: (header: string) => header.trim(),
      complete: (results: ParseResult<Record<string, unknown>>) => {
        const fatalError = results.errors.find(
          (err: ParseError) => typeof err.message === 'string' && !err.message.toLowerCase().includes('too few fields')
        );
        if (fatalError) {
          reject(new Error(fatalError.message || 'Failed to parse CSV file'));
          return;
        }

        const rows = results.data.filter(
          (row): row is Record<string, unknown> => row !== null && typeof row === 'object'
        );

        resolve(buildPreviewFromRows(rows, results.meta.fields || undefined));
      },
      error: (error: Error) => reject(error),
    });
  });
};

export const buildImportPreview = async (file: File): Promise<ImportPreview> => {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.json')) {
    return parseJsonPreview(file);
  }

  if (lowerName.endsWith('.csv')) {
    return parseCsvPreview(file);
  }

  throw new Error('Preview is currently available for CSV and JSON files only.');
};

export const buildInitialMappings = (preview: ImportPreview): Record<string, ImportColumnMapping> => {
  const mappings: Record<string, ImportColumnMapping> = {};

  preview.columns.forEach((column) => {
    const normalizedType = normalizeImportFieldType(column.inferredFieldType || FieldType.Text);
    mappings[column.key] = {
      sourceName: column.label,
      include: true,
      fieldType: normalizedType,
      defaultValue: column.inferredDefaultValue || EMPTY_VALUE,
    };
  });

  return mappings;
};
