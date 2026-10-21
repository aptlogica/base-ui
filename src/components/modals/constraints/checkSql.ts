// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import type { Column } from '../../../types/api.types';

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
  /^[a-z_][a-z0-9_]*$/.test(name) && !RESERVED.has(name) ? name : `"${name.replace(/"/g, '""')}"`;

// Fills an example's {c} and {c2} with the chosen fields; a missing field stays a placeholder
export const fillExample = (sql: string, columnNames: (string | undefined)[]): string =>
  sql.replace(/\{c([23]?)\}/g, (_, n: string) => {
    const name = columnNames[n ? Number(n) - 1 : 0];
    return name ? quoteIdent(name) : '<field>';
  });

// Postgres name of a new check constraint, as the backend makes it: ck_<alias, max 50>_<8 hex of the id>
export const checkConstraintName = (alias: string, id: string): string =>
  `ck_${alias.slice(0, 50)}_${id.replace(/-/g, '').slice(0, 8)}`;

const quoteName = (name: string) => `"${name.replace(/"/g, '""')}"`;

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
    part.startsWith('"') ? part.slice(1, -1).replace(/""/g, '"') : part.toLowerCase());

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
  const sameTable = target[target.length - 1] === expected[expected.length - 1] &&
    (target.length === 1 || expected.length === 1 || target[0] === expected[0]);
  if (!sameTable) return { error: TABLE_ERROR };
  const condition = match[2].trim();
  if (!condition) return { error: 'Condition is required.' };
  return { condition };
};

export const FIELD_PLACEHOLDER = '<field>';

// Puts a column name into the condition: in place of the first <field> placeholder if there is one,
// otherwise at the cursor (the end when the box hasn't been clicked), with spaces around it when
// it would touch other words. Returns the new condition and the cursor position after the name.
export const insertColumn = (
  condition: string, name: string, cursor?: { start: number; end: number } | null,
): { condition: string; cursor: number } => {
  const placeholder = condition.indexOf(FIELD_PLACEHOLDER);
  const start = placeholder >= 0 ? placeholder : cursor?.start ?? condition.length;
  const end = placeholder >= 0 ? placeholder + FIELD_PLACEHOLDER.length : cursor?.end ?? condition.length;
  const before = condition.slice(0, start);
  const after = condition.slice(end);
  const lead = before && !/[\s(]$/.test(before) ? ' ' : '';
  const trail = after && !/^[\s),]/.test(after) ? ' ' : '';
  const inserted = lead + quoteIdent(name) + trail;
  return { condition: before + inserted + after, cursor: before.length + lead.length + quoteIdent(name).length };
};
