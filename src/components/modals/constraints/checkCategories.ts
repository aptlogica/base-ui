// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

// Kinds of field an example suits, by lower-cased uidt
export type FieldKind = 'number' | 'text' | 'date' | 'boolean' | 'json' | 'any';

// How a typed value becomes SQL: by the field's type ('value'), a number, text, or a comma list of text
export type ValueKind = 'value' | 'text' | 'number' | 'list';

export interface ValueSpec {
  kind: ValueKind;
  // Hint in the empty input, also its label
  placeholder: string;
}

export interface CheckExample {
  label: string;
  // {c} and {c2} become the chosen fields' column names, {v1} and {v2} the typed values as SQL
  sql: string;
  values?: ValueSpec[];
  // Field types it is offered for; all fields when missing
  kinds?: FieldKind[];
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
    key: 'field', label: 'Single Field', hint: 'Values, length, range', suits: ['text', 'number', 'date'], fields: 1,
    description: 'Limit one field. The conditions offered follow the field type: text or number / date.',
    examples: [
      // Text
      { label: 'Only these', sql: '{c} IN ({v1})', values: [{ kind: 'list', placeholder: 'e.g. active, inactive' }], kinds: ['text'] },
      { label: 'Not these', sql: '{c} NOT IN ({v1})', values: [{ kind: 'list', placeholder: 'e.g. blocked, deleted' }], kinds: ['text'] },
      { label: 'Minimum length', sql: 'char_length({c}) >= {v1}', values: [{ kind: 'number', placeholder: 'e.g. 3' }], kinds: ['text'] },
      { label: 'Maximum length', sql: 'char_length({c}) <= {v1}', values: [{ kind: 'number', placeholder: 'e.g. 100' }], kinds: ['text'] },
      {
        label: 'Length between', sql: 'char_length({c}) BETWEEN {v1} AND {v2}',
        values: [{ kind: 'number', placeholder: 'Min' }, { kind: 'number', placeholder: 'Max' }], kinds: ['text'],
      },
      // Number / Date
      {
        label: 'Between two values', sql: '{c} BETWEEN {v1} AND {v2}',
        values: [{ kind: 'value', placeholder: 'From' }, { kind: 'value', placeholder: 'To' }], kinds: ['number', 'date'],
      },
      {
        label: 'Between, empty allowed', sql: '{c} IS NULL OR {c} BETWEEN {v1} AND {v2}',
        values: [{ kind: 'value', placeholder: 'From' }, { kind: 'value', placeholder: 'To' }], kinds: ['number', 'date'],
      },
      { label: 'Minimum', sql: '{c} >= {v1}', values: [{ kind: 'value', placeholder: 'Value' }], kinds: ['number', 'date'] },
      { label: 'Maximum', sql: '{c} <= {v1}', values: [{ kind: 'value', placeholder: 'Value' }], kinds: ['number', 'date'] },
      { label: 'Greater than zero', sql: '{c} > 0', kinds: ['number'] },
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

// Text and Number / Date were one category each; constraints saved with those keys show as Single Field
const SAVED_AS_FIELD = new Set(['text', 'number_date']);

// Unknown keys (e.g. constraints added outside the app) are shown as Custom SQL Expression
export const categoryByKey = (key?: string): CheckCategory => {
  const wanted = SAVED_AS_FIELD.has(key ?? '') ? 'field' : key;
  return CHECK_CATEGORIES.find(c => c.key === wanted) ?? CHECK_CATEGORIES.find(c => c.key === CUSTOM_CATEGORY)!;
};

// The key a constraint is saved with: the backend lists Text and Number / Date, so Single Field is
// saved as one of them by the field's type
export const savedCategoryKey = (key: string, field: FieldKind): string => {
  if (key !== 'field') return key;
  return field === 'number' || field === 'date' ? 'number_date' : 'text';
};

// Conditions offered for a field type; all of them until a field is chosen or for types with none of their own
export const examplesFor = (category: CheckCategory, field?: FieldKind): CheckExample[] => {
  const own = category.examples.filter(e => field && e.kinds?.includes(field));
  return own.length ? own : category.examples;
};

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
