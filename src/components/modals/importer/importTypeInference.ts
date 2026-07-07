// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { FieldType } from '../../../types/fieldTypes';

const PHONE_RE = /^[+]?[0-9()\-\s]{7,}$/;
const INTEGER_RE = /^-?\d+$/;
const DECIMAL_RE = /^-?\d+\.\d+$/;
const PERCENT_RE = /^-?\d+(\.\d+)?%$/;
const CURRENCY_RE = /^\p{Sc}?\s?-?\d{1,3}(,\d{3})*(\.\d+)?$/u;
const BOOLEAN_TRUE = new Set(['true', 'yes', 'y', '1', 'checked']);
const BOOLEAN_FALSE = new Set(['false', 'no', 'n', '0', 'unchecked']);

const isEmailLike = (value: string): boolean => {
  const at = value.indexOf('@');
  if (at <= 0 || at !== value.lastIndexOf('@')) return false;

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const dot = domain.indexOf('.');

  if (!local || !domain || dot <= 0 || dot >= domain.length - 1) return false;
  return !/\s/.test(value);
};

const getUrlRemainder = (value: string): string | null => {
  const lower = value.toLowerCase();

  if (lower.startsWith('https://')) return value.slice(8);
  if (lower.startsWith('http://')) return value.slice(7);
  if (lower.startsWith('www.')) return value.slice(4);

  return null;
};

const isUrlLike = (value: string): boolean => {
  const rest = getUrlRemainder(value);
  if (!rest || /\s/.test(rest)) return false;

  const first = rest[0];
  return Boolean(first) && !'/$.?#'.includes(first);
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
    match: (name, samples) => name.includes('email') || allSamplesMatch(samples, isEmailLike),
    fieldType: FieldType.Email,
  },
  {
    match: (name, samples) => includesAny(name, ['url', 'website']) || allSamplesMatch(samples, isUrlLike),
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

export const inferImportFieldType = (label: string, values: string[]): string => {
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

export const inferImportDefaultValue = (fieldType: string): string => {
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
      return '';
  }
};
