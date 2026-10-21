// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

// Kinds of field an example suits, by lower-cased uidt
export type FieldKind = 'number' | 'text' | 'date' | 'boolean' | 'json' | 'any';

export interface CheckExample {
  label: string;
  // {c} and {c2} become the chosen fields' column names
  sql: string;
}

export interface CheckCategory {
  // Saved with the constraint; must match the backend's list
  key: string;
  label: string;
  // Short line under the label on the category card
  hint: string;
  description: string;
  // Fields listed first in the pickers
  suits: FieldKind[];
  // How many fields the examples use
  fields: 1 | 2;
  examples: CheckExample[];
  note?: string;
}

export const CUSTOM_CATEGORY = 'custom';

// The categories of the Add check constraint popup. A category is only a starting point: the
// condition stays editable, so any condition can be written in any category.
export const CHECK_CATEGORIES: CheckCategory[] = [
  {
    key: 'text', label: 'Text', hint: 'Allowed values, length', suits: ['text'], fields: 1,
    description: 'Allowed values and the length of text.',
    examples: [
      { label: 'Only these', sql: "{c} IN ('active', 'inactive')" },
      { label: 'Not these', sql: "{c} NOT IN ('blocked', 'deleted')" },
      { label: 'Minimum length', sql: 'char_length({c}) >= 3' },
      { label: 'Maximum length', sql: 'char_length({c}) <= 100' },
    ],
  },
  {
    key: 'number_date', label: 'Number / Date', hint: 'Range, minimum, maximum', suits: ['number', 'date'], fields: 1,
    description: 'Limit a number or a date: a range, a minimum or a maximum.',
    examples: [
      { label: 'Between two values', sql: '{c} BETWEEN 0 AND 100' },
      { label: 'Between, empty allowed', sql: '{c} IS NULL OR {c} BETWEEN 1 AND 5' },
      { label: 'Minimum', sql: '{c} >= 18' },
      { label: 'Maximum', sql: '{c} <= 100' },
      { label: 'Greater than zero', sql: '{c} > 0' },
    ],
  },
  {
    key: 'compare', label: 'Compare Two Fields', hint: 'One field against another', suits: ['number', 'date'], fields: 2,
    description: 'Compare two number or date fields of the same record.',
    examples: [
      { label: 'First ≤ second', sql: '{c} <= {c2}' },
      { label: 'First < second', sql: '{c} < {c2}' },
      { label: 'Different', sql: '{c} <> {c2}' },
    ],
    note: "Works for numbers and dates (e.g. start date ≤ end date). It can't compare with today's date (CURRENT_DATE, now()): a record would start failing as time passes. Use a trigger for that.",
  },
  {
    key: CUSTOM_CATEGORY, label: 'Custom SQL Expression', hint: 'Write the full statement', suits: ['any'], fields: 1,
    description: 'Write the full SQL statement yourself. It is validated when you apply.',
    examples: [],
  },
];

// Unknown keys (e.g. constraints added outside the app) are shown as Custom SQL Expression
export const categoryByKey = (key?: string): CheckCategory =>
  CHECK_CATEGORIES.find(c => c.key === key) ?? CHECK_CATEGORIES.find(c => c.key === CUSTOM_CATEGORY)!;

const KIND_BY_UIDT: Record<string, FieldKind> = {
  number: 'number', decimal: 'number', currency: 'number', percent: 'number', duration: 'number',
  rating: 'number', year: 'number', autonumber: 'number',
  text: 'text', singlelinetext: 'text', longtext: 'text', email: 'text', phonenumber: 'text', phone: 'text',
  url: 'text', select: 'text', singleselect: 'text',
  date: 'date', datetime: 'date', time: 'date', createdtime: 'date', lastmodifiedtime: 'date',
  checkbox: 'boolean', boolean: 'boolean',
  json: 'json',
};

export const fieldKind = (uidt?: string): FieldKind => KIND_BY_UIDT[(uidt || '').toLowerCase()] ?? 'any';
