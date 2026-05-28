// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import Papa from 'papaparse';
import { FieldType } from '../../../types/fieldTypes';
import type { ImportColumnMapping, ImportPreview, ImportPreviewColumn } from './ImportTypes';
import { normalizeImportFieldType } from './importFieldConfig';

const EMPTY_VALUE = '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const URL_RE = /^(https?:\/\/|www\.)[^\s/$.?#].[^\s]*$/i;
const PHONE_RE = /^[+]?[0-9()\-\s]{7,}$/;
const INTEGER_RE = /^-?\d+$/;
const DECIMAL_RE = /^-?\d+\.\d+$/;
const PERCENT_RE = /^-?\d+(\.\d+)?%$/;
const CURRENCY_RE = /^\p{Sc}?\s?-?\d{1,3}(,\d{3})*(\.\d+)?$/u;
const BOOLEAN_TRUE = new Set(['true', 'yes', 'y', '1', 'checked']);
const BOOLEAN_FALSE = new Set(['false', 'no', 'n', '0', 'unchecked']);

const slugifyColumnName = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

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

const normalizeCellValue = (value: unknown): string => {
  if (value == null) return EMPTY_VALUE;
  return String(value).trim();
};

const isDateLike = (value: string): boolean => {
  if (!value) return false;
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
};

const isDateOnlyLike = (value: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{2}\/\d{2}\/\d{4}$/.test(value);
};

const includesAny = (name: string, terms: string[]): boolean => {
  return terms.some((term) => name.includes(term));
};

const startsWithAny = (name: string, terms: string[]): boolean => {
  return terms.some((term) => name.startsWith(term));
};

const allSamplesMatch = (samples: string[], predicate: (value: string) => boolean): boolean => {
  return samples.every(predicate);
};

const isBooleanValue = (value: string): boolean => {
  const normalized = value.toLowerCase();
  return BOOLEAN_TRUE.has(normalized) || BOOLEAN_FALSE.has(normalized);
};

interface TypeInferenceRule {
  match: (name: string, samples: string[]) => boolean;
  fieldType: string;
}

const TYPE_INFERENCE_RULES: TypeInferenceRule[] = [
  {
    match: (_name, samples) => allSamplesMatch(samples, (value) => INTEGER_RE.test(value)),
    fieldType: FieldType.Number,
  },
  {
    match: (name, samples) => name.includes('email') || allSamplesMatch(samples, (value) => EMAIL_RE.test(value)),
    fieldType: FieldType.Email,
  },
  {
    match: (name, samples) => includesAny(name, ['url', 'website']) || allSamplesMatch(samples, (value) => URL_RE.test(value)),
    fieldType: FieldType.URL,
  },
  {
    match: (name, samples) => includesAny(name, ['phone', 'mobile']) || allSamplesMatch(samples, (value) => PHONE_RE.test(value)),
    fieldType: FieldType.PhoneNumber,
  },
  {
    match: (name, samples) =>
      startsWithAny(name, ['is_', 'has_']) ||
      includesAny(name, ['enabled', 'active']) ||
      allSamplesMatch(samples, isBooleanValue),
    fieldType: FieldType.Boolean,
  },
  {
    match: (name, samples) => name.includes('date') || allSamplesMatch(samples, isDateOnlyLike),
    fieldType: FieldType.Date,
  },
  {
    match: (name, samples) =>
      (name.includes('time') || name.includes('timestamp')) && allSamplesMatch(samples, isDateLike),
    fieldType: FieldType.DateTime,
  },
  {
    match: (name) => name.includes('time') || name.includes('timestamp'),
    fieldType: FieldType.Time,
  },
  {
    match: (name, samples) => name.includes('year') && allSamplesMatch(samples, (value) => /^\d{4}$/.test(value)),
    fieldType: FieldType.Year,
  },
  {
    match: (name, samples) =>
      includesAny(name, ['amount', 'price', 'cost']) || allSamplesMatch(samples, (value) => CURRENCY_RE.test(value)),
    fieldType: FieldType.Currency,
  },
  {
    match: (name, samples) =>
      includesAny(name, ['percent', 'ratio']) || allSamplesMatch(samples, (value) => PERCENT_RE.test(value)),
    fieldType: FieldType.Percent,
  },
  {
    match: (_name, samples) => allSamplesMatch(samples, (value) => INTEGER_RE.test(value) || DECIMAL_RE.test(value)),
    fieldType: FieldType.Decimal,
  },
  {
    match: (_name, samples) => allSamplesMatch(samples, (value) => value.startsWith('{') || value.startsWith('[')),
    fieldType: FieldType.JSON,
  },
];

const inferFieldType = (label: string, values: string[]): string => {
  const name = label.toLowerCase();
  const samples = values.filter(Boolean).slice(0, 20);

  if (samples.length === 0) {
    return FieldType.Text;
  }

  for (const rule of TYPE_INFERENCE_RULES) {
    if (rule.match(name, samples)) {
      return rule.fieldType;
    }
  }

  return FieldType.Text;
};

const inferDefaultValue = (fieldType: string): string => {
  switch (fieldType) {
    case FieldType.Boolean:
      return 'false';
    case FieldType.Number:
    case FieldType.Decimal:
    case FieldType.Currency:
    case FieldType.Percent:
    case FieldType.Year:
      return '0';
    default:
      return EMPTY_VALUE;
  }
};

const buildPreviewFromRows = (rawRows: Record<string, unknown>[], preferredLabels?: string[]): ImportPreview => {
  const seenKeys = new Set<string>();
  const discoveredLabels = preferredLabels && preferredLabels.length > 0
    ? preferredLabels
    : Array.from(new Set(rawRows.flatMap((row) => Object.keys(row || {}))));

  const columns: ImportPreviewColumn[] = discoveredLabels.map((label, index) => {
    const key = makeUniqueKey(label, seenKeys, index);
    const values = rawRows.map((row) => normalizeCellValue(row[label])).filter(Boolean);
    const inferredFieldType = inferFieldType(label, values);

    return {
      key,
      label,
      sampleValue: values[0] || EMPTY_VALUE,
      inferredFieldType,
      inferredDefaultValue: inferDefaultValue(inferredFieldType),
    };
  });

  const rows = rawRows.map((row) => {
    const mapped: Record<string, string> = {};
    columns.forEach((column) => {
      mapped[column.key] = normalizeCellValue(row[column.label]);
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
  const parsed = JSON.parse(text);
  
  let data: unknown[];
  if (Array.isArray(parsed)) {
    data = parsed;
  } else if (Array.isArray(parsed?.data)) {
    data = parsed.data;
  } else {
    data = [];
  }

  if (!Array.isArray(data) || data.length === 0) {
    return { columns: [], rows: [], totalRows: 0 };
  }

  const normalizedRows = data
    .filter((row) => row && typeof row === 'object' && !Array.isArray(row))
    .map((row) => row as Record<string, unknown>);

  const labels = Array.from(new Set(normalizedRows.flatMap((row) => Object.keys(row))));
  return buildPreviewFromRows(normalizedRows, labels);
};

const parseCsvPreview = (file: File): Promise<ImportPreview> => {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      // Preserve empty rows like ",,," so the preview matches the source file.
      // (We still tolerate "Too few fields" warnings below for blank-ish lines.)
      skipEmptyLines: false,
      dynamicTyping: false,
      transformHeader: (header: string) => header.trim(),
      complete: (results: any) => {
        // PapaParse can report "Too few fields" for malformed/short lines (often blank-ish rows).
        // For preview we can still proceed with whatever rows were parsed.
        const fatalError = results.errors.find(
          (err: any) => err && typeof err.message === 'string' && !err.message.toLowerCase().includes('too few fields')
        );
        if (fatalError) {
          reject(new Error(fatalError.message || 'Failed to parse CSV file'));
          return;
        }

        // Keep rows even if all cells are empty; only drop non-object/null entries.
        const rows = results.data.filter((row: any) => row && typeof row === 'object');

        resolve(buildPreviewFromRows(rows, results.meta.fields || undefined));
      },
      error: (error: any) => reject(error),
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
