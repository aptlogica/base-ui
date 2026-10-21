// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import type { Column } from '../../../types/api.types';
import type { CheckExample, FieldKind, ValueKind } from './checkCategories';
import { CHECK_CATEGORIES } from './checkCategories';

// Field types with no plain column a condition can use
const COMPUTED_TYPES = new Set(['links', 'lookup', 'rollup', 'formula', 'button', 'attachment']);

// Fields a condition can use: Title and ordinary fields, not system or computed ones
export const checkableColumns = (columns: Column[]): Column[] =>
  columns.filter(c =>
    !c.deleted && (!c.system || c.column_name === 'title') && !COMPUTED_TYPES.has((c.uidt || '').toLowerCase()));

const RESERVED = new Set([
  'all', 'and', 'any', 'array', 'as', 'asc', 'between', 'case', 'check', 'column', 'constraint', 'create', 'default',
  'desc', 'distinct', 'do', 'else', 'end', 'false', 'for', 'foreign', 'from', 'group', 'having', 'in', 'is', 'key',
  'limit', 'not', 'null', 'offset', 'on', 'or', 'order', 'primary', 'references', 'select', 'table', 'then', 'to',
  'true', 'union', 'unique', 'user', 'using', 'when', 'where', 'with',
]);

// A column name as SQL, quoted only when it has to be (mixed case, spaces, reserved words)
export const quoteIdent = (name: string): string =>
  /^[a-z_][a-z0-9_]*$/.test(name) && !RESERVED.has(name) ? name : `"${name.replaceAll('"', '""')}"`;

// Fills an example's {c} and {c2} with the chosen fields; a missing field stays a placeholder
export const fillExample = (sql: string, columnNames: (string | undefined)[]): string =>
  sql.replace(/\{c([23]?)\}/g, (_, n: string) => {
    const name = columnNames[n ? Number(n) - 1 : 0];
    return name ? quoteIdent(name) : '<field>';
  });

const NUMBER = /^-?\d+(\.\d+)?$/;
const quoteText = (v: string) => `'${v.replaceAll("'", "''")}'`;
const items = (v: string) => v.split(',').map(i => i.trim()).filter(Boolean);

// A typed value as a SQL literal; null while it is empty or not valid for its kind
export const valueSql = (kind: ValueKind, raw: string, field?: FieldKind): string | null => {
  const v = raw.trim();
  if (!v) return null;
  switch (kind) {
    case 'number': return NUMBER.test(v) ? v : null;
    case 'text': return quoteText(v);
    case 'list': return items(v).map(quoteText).join(', ');
    default:
      if (!field) return null;
      if (field === 'number') return NUMBER.test(v) ? v : null;
      if (field === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(v) ? `DATE ${quoteText(v)}` : null;
      return quoteText(v);
  }
};

// A field title as the preview shows it: plain when it is one word, quoted otherwise
export const displayName = (title: string): string => (/^\w+$/.test(title) ? title : `"${title}"`);

// Fills an example's fields and values. Anything missing or invalid stays <field> or <value>, and
// `complete` is false.
export const buildCondition = (
  example: CheckExample, columnNames: (string | undefined)[], values: string[], fieldKind?: FieldKind,
  quote: (name: string) => string = quoteIdent,
): { condition: string; complete: boolean } => {
  let complete = true;
  const condition = example.sql.replace(/\{(c[23]?|v[12])\}/g, (_, token: string) => {
    if (token[0] === 'c') {
      const name = columnNames[token.length > 1 ? Number(token[1]) - 1 : 0];
      if (name) return quote(name);
      complete = false;
      return '<field>';
    }
    const index = Number(token[1]) - 1;
    const sql = valueSql(example.values?.[index]?.kind ?? 'text', values[index] ?? '', fieldKind);
    if (sql) return sql;
    complete = false;
    return '<value>';
  });
  return { condition, complete };
};

const unquote = (v: string) => (/^'.*'$/s.test(v) ? v.slice(1, -1).replaceAll("''", "'") : v);

// A saved condition as a typed value again, the reverse of valueSql
const rawValue = (kind: ValueKind, sql: string): string => {
  switch (kind) {
    case 'list': return sql.split(',').map(i => unquote(i.trim())).join(', ');
    case 'value': return unquote(/^DATE\s+('.*')$/is.exec(sql)?.[1] ?? sql);
    default: return unquote(sql);
  }
};

const squash = (sql: string) => sql.replaceAll(/\s+/g, ' ').trim();

export interface ExampleMatch {
  categoryKey: string;
  example: CheckExample;
  // Column names for {c}, {c2}
  columnNames: string[];
  values: string[];
}

// Finds the example a saved condition was made from (its saved category first), with its fields and
// values; null when it is none of them, so the condition is shown as custom SQL
export const matchExample = (
  condition: string, savedCategory: string | undefined, columnNames: string[], kindOf: (columnName: string) => FieldKind,
): ExampleMatch | null => {
  const IDENT = String.raw`("(?:[^"]|"")+"|[A-Za-z_][\w$]*)`;
  const categories = [...CHECK_CATEGORIES].sort((a, b) => Number(b.key === savedCategory) - Number(a.key === savedCategory));
  for (const category of categories) {
    for (const example of category.examples) {
      const slots: string[] = [];
      const pattern = example.sql.split(/(\{(?:c[23]?|v[12])\})/).map(part => {
        const token = /^\{(c[23]?|v[12])\}$/.exec(part)?.[1];
        if (!token) return part.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`).replaceAll(/\s+/g, String.raw`\s+`);
        slots.push(token);
        return token[0] === 'c' ? IDENT : '(.+?)';
      }).join('');
      const found = new RegExp(`^\\s*${pattern}\\s*$`, 'is').exec(condition);
      if (!found) continue;
      const names: string[] = [];
      const values: string[] = [];
      let known = true;
      slots.forEach((token, i) => {
        const text = found[i + 1];
        if (token[0] === 'c') {
          const name = text.startsWith('"') ? text.slice(1, -1).replaceAll('""', '"') : text;
          const index = token.length > 1 ? Number(token[1]) - 1 : 0;
          if (names[index] === undefined) names[index] = name;
          known &&= columnNames.includes(name);
        } else {
          const index = Number(token[1]) - 1;
          values[index] = rawValue(example.values?.[index]?.kind ?? 'text', text.trim());
        }
      });
      if (!known) continue;
      // The same condition again, or it is not really this example
      const again = buildCondition(example, names, values, kindOf(names[0]));
      if (again.complete && squash(again.condition) === squash(condition)) {
        return { categoryKey: category.key, example, columnNames: names, values };
      }
    }
  }
  return null;
};

// Postgres name of a new check constraint, as the backend makes it: ck_<alias, max 50>_<8 hex of the id>
export const checkConstraintName = (alias: string, id: string): string =>
  `ck_${alias.slice(0, 50)}_${id.replaceAll('-', '').slice(0, 8)}`;

const quoteName = (name: string) => `"${name.replaceAll('"', '""')}"`;

// The statements Save runs: ADD, or DROP then ADD when an existing constraint's condition changed
export const previewSql = (table: string, name: string, condition: string, replace = false): string => {
  const add = `ALTER TABLE ${table}\n  ADD CONSTRAINT ${quoteName(name)}\n  CHECK (${condition.trim()});`;
  return replace ? `ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${quoteName(name)};\n${add}` : add;
};

// The saved constraint as Postgres has it, e.g. from CHECK ((age >= 18))
export const installedSql = (table: string, name: string, definition: string): string =>
  `ALTER TABLE ${table}\n  ADD CONSTRAINT ${quoteName(name)}\n  ${definition};`;

const NAME = String.raw`(?:"(?:[^"]|"")+"|[A-Za-z_][\w$]*)`;
const STATEMENT = new RegExp(
  String.raw`^\s*ALTER\s+TABLE\s+(?:ONLY\s+)?(${NAME}(?:\s*\.\s*${NAME})?)\s+ADD\s+CONSTRAINT\s+${NAME}\s+CHECK\s*\(([\s\S]*)\)\s*;?\s*$`,
  'i',
);

// Parts of a possibly schema-qualified name, unquoted; unquoted parts are lower-cased like Postgres does
const nameParts = (name: string): string[] =>
  (name.match(new RegExp(NAME, 'g')) || []).map(part =>
    part.startsWith('"') ? part.slice(1, -1).replaceAll('""', '"') : part.toLowerCase());

export const STATEMENT_ERROR = 'Write one ALTER TABLE … ADD CONSTRAINT … CHECK (…) statement.';
export const TABLE_ERROR = 'The statement must target this table.';

// Reads the condition out of a Custom SQL Expression statement. Only one
// ALTER TABLE <this table> ADD CONSTRAINT <name> CHECK (<condition>) statement is accepted; the server
// builds the statement again itself, with its own name, and checks the condition.
export const parseCheckStatement = (sql: string, table: string): { condition: string } | { error: string } => {
  const match = STATEMENT.exec(sql);
  if (!match) return { error: STATEMENT_ERROR };
  const target = nameParts(match[1]);
  const expected = nameParts(table);
  const sameTable = target.at(-1) === expected.at(-1) &&
    (target.length === 1 || expected.length === 1 || target[0] === expected[0]);
  if (!sameTable) return { error: TABLE_ERROR };
  const condition = match[2].trim();
  if (!condition) return { error: 'Condition is required.' };
  return { condition };
};

// Swaps column names for field titles in a SQL text, or back, leaving string literals alone. Words
// are only swapped when they are exactly a name (a word before "(" is a function, so it stays).
const swapNames = (sql: string, lookup: Map<string, string>, write: (name: string) => string): string =>
  sql.replace(/'(?:[^']|'')*'|"(?:[^"]|"")+"|[A-Za-z_][\w$]*(?!\w|\s*\()/g, token => {
    if (token.startsWith("'")) return token;
    const name = token.startsWith('"') ? token.slice(1, -1).replaceAll('""', '"') : token;
    const found = lookup.get(name);
    return found === undefined ? token : write(found);
  });

// Custom SQL as the user reads it: column names become field titles (age_1792_368d -> age)
export const toTitles = (sql: string, columns: Column[]): string => {
  const lookup = new Map<string, string>();
  for (const c of columns) if (!lookup.has(c.column_name)) lookup.set(c.column_name, c.title);
  return swapNames(sql, lookup, displayName);
};

// Custom SQL as Postgres needs it: field titles become column names
export const toColumnNames = (sql: string, columns: Column[]): string => {
  const lookup = new Map<string, string>();
  for (const c of columns) if (!lookup.has(c.title)) lookup.set(c.title, c.column_name);
  return swapNames(sql, lookup, quoteIdent);
};

export const FIELD_PLACEHOLDER = '<field>';

// Puts a column name into the condition: in place of the first <field> placeholder if there is one,
// otherwise at the cursor (the end when the box hasn't been clicked), with spaces around it when
// it would touch other words. Returns the new condition and the cursor position after the name.
export const insertColumn = (
  condition: string, name: string, cursor?: { start: number; end: number } | null,
  quote: (name: string) => string = quoteIdent,
): { condition: string; cursor: number } => {
  const placeholder = condition.indexOf(FIELD_PLACEHOLDER);
  const start = placeholder >= 0 ? placeholder : cursor?.start ?? condition.length;
  const end = placeholder >= 0 ? placeholder + FIELD_PLACEHOLDER.length : cursor?.end ?? condition.length;
  const before = condition.slice(0, start);
  const after = condition.slice(end);
  const lead = before && !/[\s(]$/.test(before) ? ' ' : '';
  const trail = after && !/^[\s),]/.test(after) ? ' ' : '';
  const inserted = lead + quote(name) + trail;
  return { condition: before + inserted + after, cursor: before.length + lead.length + quote(name).length };
};
