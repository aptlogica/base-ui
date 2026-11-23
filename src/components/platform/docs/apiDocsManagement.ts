// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

// Docs of the base management endpoints: create, change and delete tables, columns, constraints and the
// primary key. Same sample data as the rest of the docs (a base "CRM" with Orders and Customers). Responses and
// messages are what the server returns (internal/platform in the backend: schema_write.go, columns_write.go,
// constraints_api.go, primary_key_api.go).

import type { DocEndpoint, DocGroup } from './apiDocsContent';

const REQUEST_ID = 'req_6f1c2a9e4b7d4c3a8e5f1b2d9c7a4e6f';
const BASE_ID = 'bse_4f2a9c1e7b3d4a5f8e6c2b1d9a7f3e5c';

const ok = (data: unknown) => ({ data, error: null, meta: { request_id: REQUEST_ID } });
const fail = (code: string, message: string, details?: Record<string, unknown>[]) => ({
  data: null,
  error: { code, message, ...(details ? { details } : {}) },
  meta: { request_id: REQUEST_ID },
});

const TABLE = { name: 'table', in: 'path', description: 'Table name or ID (tbl_…).' } as const;
const COLUMN = { name: 'column', in: 'path', description: 'Column name or ID (fld_…).' } as const;
const IDEMPOTENCY = { name: 'Idempotency-Key', in: 'header', description: 'Optional. A retry with the same key and body replays the first response.' } as const;

const ORDERS_ID = 'tbl_7c1e0a4f9b2d4e6f8a3c5d7e9f1b2c4d';
const EMAIL_ID = 'fld_9a0b1c2d3e4f45a6b7c8d9e0f1a2b3c4';
const NOTES_ID = 'fld_0b1c2d3e4f5a46b7c8d9e0f1a2b3c4d5';
const CONSTRAINT_ID = 'con_5c6d7e8f9a0b41c2d3e4f5a6b7c8d9e0';

const FEATURE_OFF = fail('feature_disabled', 'Base management is off for this base. Turn it on in the Developer settings.');

const CREATE_TABLE: DocEndpoint = {
  id: 'create-table',
  title: 'Create a table',
  method: 'POST',
  path: '/tables',
  summary:
    'Creates a table, optionally with its first columns. Without columns the table gets the default Title column; with columns it does not. If a step fails, the half-built table is removed again.',
  params: [IDEMPOTENCY],
  notes: [
    'Base management is off by default. An owner or co-owner turns it on in Developer settings; until then every write on this page answers 403 feature_disabled.',
    'Every schema write is made in the name of the user who turned base management on (the base owner, if that user has left). There is no secret key check yet; it comes with the security work.',
    'A table name that is already used in the base answers 409 conflict. All validation problems are returned together as 422 validation_failed.',
  ],
  examples: [
    {
      title: 'A table with columns',
      method: 'POST',
      path: '/tables',
      body: {
        name: 'Invoices',
        description: 'Invoices sent to customers',
        columns: [
          { title: 'Number', uidt: 'text' },
          { title: 'Amount', uidt: 'decimal' },
        ],
      },
      status: 201,
      response: ok({
        id: 'tbl_a1b2c3d4e5f64a7b8c9d0e1f2a3b4c5d',
        name: 'Invoices',
        description: 'Invoices sent to customers',
        base_id: BASE_ID,
        columns: [
          { id: 'fld_b2c3d4e5f6a74b8c9d0e1f2a3b4c5d6e', name: 'Number', type: 'text', uidt: 'text', dt: 'VARCHAR(255)' },
          { id: 'fld_c3d4e5f6a7b84c9d0e1f2a3b4c5d6e7f', name: 'Amount', type: 'decimal', uidt: 'decimal', dt: 'NUMERIC' },
        ],
      }),
    },
    {
      title: 'The name is taken',
      method: 'POST',
      path: '/tables',
      body: { name: 'Orders' },
      status: 409,
      response: fail('conflict', 'This base already has a table named "Orders".'),
    },
    {
      title: 'A column type the API cannot use yet',
      description: 'formula, attachment and user columns are refused until the data API can read and write them.',
      method: 'POST',
      path: '/tables',
      body: { name: 'Files', columns: [{ title: 'Scan', uidt: 'attachment' }] },
      status: 422,
      response: fail('type_not_supported', 'The type "attachment" can\'t be used through the API yet. Attachments aren\'t supported by the data API yet.'),
    },
    {
      title: 'Base management is off',
      method: 'POST',
      path: '/tables',
      body: { name: 'Invoices' },
      status: 403,
      response: FEATURE_OFF,
    },
  ],
};

const UPDATE_TABLE: DocEndpoint = {
  id: 'update-table',
  title: 'Rename a table or change its description',
  method: 'PATCH',
  path: '/tables/{table}',
  summary: 'Changes the name or the description. IDs survive renames, so an app that uses IDs keeps working.',
  params: [TABLE],
  examples: [
    {
      title: 'Rename',
      method: 'PATCH',
      path: '/tables/Orders',
      body: { name: 'Sales orders' },
      status: 200,
      response: ok({ id: ORDERS_ID, name: 'Sales orders', base_id: BASE_ID }),
    },
    {
      title: 'The new name is taken',
      method: 'PATCH',
      path: '/tables/Orders',
      body: { name: 'Customers' },
      status: 409,
      response: fail('conflict', 'This base already has a table named "Customers".'),
    },
  ],
};

const DELETE_TABLE: DocEndpoint = {
  id: 'delete-table',
  title: 'Delete a table',
  method: 'DELETE',
  path: '/tables/{table}',
  summary: 'Deletes the table and all its records. If link columns in other tables point at it, the answer is 409 in_use and lists them, unless you send ?force=true.',
  params: [TABLE, { name: 'force', in: 'query', description: 'true: delete the table although other tables link to it.' }],
  examples: [
    {
      title: 'Delete a table',
      method: 'DELETE',
      path: '/tables/Invoices',
      status: 200,
      response: ok({ id: 'tbl_a1b2c3d4e5f64a7b8c9d0e1f2a3b4c5d', deleted: true }),
    },
    {
      title: 'Other tables link to it',
      method: 'DELETE',
      path: '/tables/Customers',
      status: 409,
      response: fail(
        'in_use',
        '1 link columns in other tables point at this table. Delete them first, or send ?force=true to delete the table anyway.',
        [{ id: 'fld_6f708192a3b44c53b4e5f6a7b8c9d0e1', field: 'Orders.Customer', issue: 'link_column' }]
      ),
    },
  ],
};

const CREATE_COLUMN: DocEndpoint = {
  id: 'create-column',
  title: 'Add a column',
  method: 'POST',
  path: '/tables/{table}/columns',
  summary:
    'Adds a column the way the app does: a title, the app\'s type (uidt) and meta for the type\'s options. Optional constraints are applied after the column exists; if one fails, the new column is removed again.',
  params: [TABLE, IDEMPOTENCY],
  notes: [
    'uidt is the app\'s type: text, longText, number, decimal, currency, percent, rating, boolean, date, datetime, time, duration, year, email, phoneNumber, url, select, multiSelect, json, uuid, links, lookup.',
    'select and multiSelect take their choices in meta.options. links take meta.relation: {"with": <table name or ID>, "type": "has-many" | "many-to-many" | "one-to-one"}. lookup takes meta.link_column_id (a links column of this table) and meta.lookup_column_id (a column of the linked table).',
    'constraints: default (not together with unique or check), id_generation (uuid columns), unique (not for links, lookups, JSON, multi select, rating or system columns) and check (a structured condition on this column). Links and lookups take no constraints.',
    'formula, attachment and user columns answer 422 type_not_supported.',
    'A check condition is JSON, never SQL: {"all" | "any" | "none": [{"column", "op", "value"}, ...]}. Operators: eq, neq, gt, gte, lt, lte, in, contains, starts_with, ends_with, is_null, is_not_null, not_empty. The server turns it into SQL. Existing data must already pass.',
  ],
  examples: [
    {
      title: 'An email column that must be unique and contain @',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Email',
        uidt: 'email',
        description: 'Customer email',
        constraints: {
          unique: true,
          check: { category: 'text', where: { all: [{ column: 'Email', op: 'contains', value: '@' }] } },
        },
      },
      status: 201,
      response: ok({ id: EMAIL_ID, name: 'Email', description: 'Customer email', type: 'email', uidt: 'email', dt: 'VARCHAR(255)' }),
    },
    {
      title: 'A single select with choices',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Priority', uidt: 'select', meta: { options: [{ option: 'Low', color: '#16a34a' }, { option: 'High', color: '#dc2626' }] } },
      status: 201,
      response: ok({ id: NOTES_ID, name: 'Priority', type: 'single_select', uidt: 'select', dt: 'TEXT' }),
    },
    {
      title: 'A link to another table',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Customer', uidt: 'links', meta: { relation: { with: 'Customers', type: 'has-many' } } },
      status: 201,
      response: ok({ id: 'fld_6f708192a3b44c53b4e5f6a7b8c9d0e1', name: 'Customer', type: 'links', uidt: 'links' }),
    },
    {
      title: 'The column name is taken',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Name', uidt: 'text' },
      status: 409,
      response: fail('conflict', 'This table already has a column named "Name".'),
    },
    {
      title: 'A default together with unique',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Code', uidt: 'text', constraints: { default: 'n/a', unique: true } },
      status: 422,
      response: fail(
        'validation_failed',
        'This column has a UNIQUE constraint. Its default value may be duplicated when inserting multiple rows. Remove the default value or the UNIQUE constraint to avoid duplicate-value errors.',
        [{ field: 'constraints.default', issue: 'can\'t be combined with unique' }]
      ),
    },
    {
      title: 'Constraints on a link',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Customer', uidt: 'links', meta: { relation: { with: 'Customers', type: 'has-many' } }, constraints: { unique: true } },
      status: 422,
      response: fail('validation_failed', 'Links and lookups take no constraints.', [{ field: 'constraints', issue: 'not allowed for links columns' }]),
    },
  ],
};

const UPDATE_COLUMN: DocEndpoint = {
  id: 'update-column',
  title: 'Change a column',
  method: 'PATCH',
  path: '/tables/{table}/columns/{column}',
  summary: 'Renames a column, changes its options, default or id generation, or changes its type.',
  params: [
    TABLE,
    COLUMN,
    { name: 'dry_run', in: 'query', description: 'true: report what a type change would do, without changing anything.' },
    { name: 'empty_first', in: 'body', description: 'true: empty the column before the type change, as the app does.' },
  ],
  notes: [
    'meta is merged into the column\'s current meta. default and id_generation go under constraints, as when adding a column. id_generation.backfill fills the empty cells of a uuid column that becomes auto-generated.',
    'A type change works as in the app: the new type must be allowed for the current one, otherwise the answer is 409 conversion_not_allowed and lists the allowed types. Values that cannot be cast become empty.',
    'dry_run reports filled_values and, for number targets, values_lost (exact: true). For other targets exact is false and filled_values is the most that can be lost.',
    'A type change is refused when a check constraint uses the column, or when the new type cannot be part of a unique key.',
    'System columns (Id, Created Time and the like) cannot be changed: 403 system_column.',
  ],
  examples: [
    {
      title: 'Rename',
      method: 'PATCH',
      path: '/tables/Orders/columns/Email',
      body: { title: 'Customer email' },
      status: 200,
      response: ok({ id: EMAIL_ID, name: 'Customer email', type: 'email', uidt: 'email', dt: 'VARCHAR(255)' }),
    },
    {
      title: 'Preview a type change',
      method: 'PATCH',
      path: '/tables/Orders/columns/Notes?dry_run=true',
      body: { uidt: 'number' },
      status: 200,
      response: ok({ from: 'text', to: 'number', filled_values: 120, values_lost: 7, exact: true }),
    },
    {
      title: 'A type change that is not allowed',
      method: 'PATCH',
      path: '/tables/Orders/columns/Paid',
      body: { uidt: 'date' },
      status: 409,
      response: fail('conversion_not_allowed', 'A boolean column can\'t be changed to date.', [
        { field: 'uidt', issue: 'allowed: longText' },
        { field: 'uidt', issue: 'allowed: number' },
      ]),
    },
    {
      title: 'A system column',
      method: 'PATCH',
      path: '/tables/Orders/columns/Created%20Time',
      body: { title: 'Made at' },
      status: 403,
      response: fail('system_column', '"Created Time" is a system column and can\'t be changed or deleted.'),
    },
  ],
};

const DELETE_COLUMN: DocEndpoint = {
  id: 'delete-column',
  title: 'Delete a column',
  method: 'DELETE',
  path: '/tables/{table}/columns/{column}',
  summary: 'Deletes a column and its values. If constraints or lookups use it, the answer is 409 in_use and lists them; remove those first. A column that holds data needs ?force=true.',
  params: [TABLE, COLUMN, { name: 'force', in: 'query', description: 'true: delete the column although it holds data.' }],
  examples: [
    {
      title: 'Delete an empty column',
      method: 'DELETE',
      path: '/tables/Orders/columns/Notes',
      status: 200,
      response: ok({ id: NOTES_ID, deleted: true }),
    },
    {
      title: 'The column holds data',
      method: 'DELETE',
      path: '/tables/Orders/columns/Price',
      status: 409,
      response: fail('conflict', 'This column holds data. Send ?force=true to delete the column and its values.'),
    },
    {
      title: 'A constraint uses the column',
      method: 'DELETE',
      path: '/tables/Orders/columns/Email?force=true',
      status: 409,
      response: fail('in_use', '1 things use this column. Remove them first.', [
        { id: CONSTRAINT_ID, field: 'Orders.Email is unique', issue: 'constraint' },
      ]),
    },
  ],
};

const REORDER_COLUMN: DocEndpoint = {
  id: 'reorder-column',
  title: 'Move a column',
  method: 'POST',
  path: '/tables/{table}/columns/reorder',
  summary: 'Moves a column before or after another column. System columns cannot be moved.',
  params: [
    TABLE,
    { name: 'column', in: 'body', description: 'The column to move (name or fld_ ID).' },
    { name: 'before / after', in: 'body', description: 'Exactly one of them: the column to move next to.' },
  ],
  examples: [
    {
      title: 'Move Email before Name',
      method: 'POST',
      path: '/tables/Orders/columns/reorder',
      body: { column: 'Email', before: 'Name' },
      status: 200,
      response: ok([
        { id: EMAIL_ID, name: 'Email', type: 'email', uidt: 'email' },
        { id: 'fld_1a2b3c4d5e6f47a8b9c0d1e2f3a4b5c6', name: 'Name', type: 'text', uidt: 'text' },
      ]),
    },
  ],
};

const LIST_CONSTRAINTS: DocEndpoint = {
  id: 'list-constraints',
  title: 'List constraints',
  method: 'GET',
  path: '/tables/{table}/constraints',
  summary: 'Lists the unique and check constraints made through the app or the API, with their columns, status and check condition.',
  params: [TABLE, { name: 'type', in: 'query', description: 'unique or check. Default: both.' }],
  notes: ['status is ok, or missing when Postgres no longer has the constraint. For check constraints, condition is the SQL Postgres enforces.'],
  examples: [
    {
      title: 'Constraints of a table',
      method: 'GET',
      path: '/tables/Orders/constraints',
      status: 200,
      response: ok([
        {
          id: CONSTRAINT_ID,
          name: 'Email is unique',
          type: 'unique',
          constraint_name: 'uq_orders_email',
          status: 'ok',
          columns: [{ id: EMAIL_ID, name: 'Email' }],
        },
        {
          id: 'con_6d7e8f9a0b1c42d3e4f5a6b7c8d9e0f1',
          name: 'Email check',
          type: 'check',
          constraint_name: 'ck_orders_email',
          status: 'ok',
          category: 'text',
          condition: "(email_1 LIKE '%@%')",
          columns: [{ id: EMAIL_ID, name: 'Email' }],
        },
      ]),
    },
  ],
};

const CREATE_CONSTRAINT: DocEndpoint = {
  id: 'create-constraint',
  title: 'Add a constraint',
  method: 'POST',
  path: '/tables/{table}/constraints',
  summary: 'Adds a unique constraint over one or more columns, or a check constraint with a structured condition. If existing data already breaks it, nothing is added and the answer is 422.',
  params: [TABLE, IDEMPOTENCY],
  notes: [
    'unique needs columns. check needs check.where, a condition tree like the where filter of Find records, with {"column", "op", "value"} conditions. The columns the condition uses become the constraint\'s columns when you do not name any.',
    'Conditions are compiled on the server: column names must exist in the table, values become escaped literals, and SQL text is never accepted. At most 50 conditions, nested 5 deep.',
    'When a record write later breaks a constraint, the records endpoints answer 422 with the constraint\'s title.',
  ],
  examples: [
    {
      title: 'Unique over two columns',
      method: 'POST',
      path: '/tables/Products/constraints',
      body: { title: 'One SKU per region', type: 'unique', columns: ['SKU', 'Region'] },
      status: 201,
      response: ok({
        id: CONSTRAINT_ID,
        name: 'One SKU per region',
        type: 'unique',
        constraint_name: 'uq_products_sku_region',
        status: 'ok',
        columns: [{ id: 'fld_a0b1c2d3e4f541a2b3c4d5e6f7a8b9c0', name: 'SKU' }, { id: 'fld_b1c2d3e4f5a642b3c4d5e6f7a8b9c0d1', name: 'Region' }],
      }),
    },
    {
      title: 'A check: price is not negative',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: { title: 'Price is not negative', type: 'check', check: { category: 'number_date', where: { all: [{ column: 'Price', op: 'gte', value: 0 }] } } },
      status: 201,
      response: ok({
        id: 'con_7e8f9a0b1c2d43e4f5a6b7c8d9e0f1a2',
        name: 'Price is not negative',
        type: 'check',
        constraint_name: 'ck_orders_price',
        status: 'ok',
        category: 'number_date',
        condition: '(price_3 >= 0)',
        columns: [{ id: 'fld_3c4d5e6f7081492081b2c3d4e5f6a7b8', name: 'Price' }],
      }),
    },
    {
      title: 'A column that does not exist',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: { title: 'Bad', type: 'check', check: { where: { all: [{ column: 'Prise', op: 'gte', value: 0 }] } } },
      status: 422,
      response: fail('validation_failed', 'The check condition is not valid.', [{ field: 'where.all[0].column', issue: 'No column named "Prise".' }]),
    },
  ],
};

const CHECK_CONSTRAINT: DocEndpoint = {
  id: 'check-constraint',
  title: 'Dry run a constraint',
  method: 'POST',
  path: '/tables/{table}/constraints/check',
  summary: 'Reports whether a unique or check constraint could be added, without changing anything: the duplicates of a unique key, or how many records break a condition.',
  params: [TABLE],
  examples: [
    {
      title: 'Would this key be unique?',
      method: 'POST',
      path: '/tables/Orders/constraints/check',
      body: { type: 'unique', columns: ['Name'] },
      status: 200,
      response: ok({ valid: false, message: 'Duplicate data in column "Name". Remove the duplicates and try again.' }),
    },
    {
      title: 'How many records break the condition?',
      method: 'POST',
      path: '/tables/Orders/constraints/check',
      body: { type: 'check', check: { where: { all: [{ column: 'Price', op: 'gte', value: 0 }] } } },
      status: 200,
      response: ok({ valid: false, violations: 3 }),
    },
  ],
};

const UPDATE_CONSTRAINT: DocEndpoint = {
  id: 'update-constraint',
  title: 'Change a constraint',
  method: 'PUT',
  path: '/tables/{table}/constraints/{constraint}',
  summary: 'Changes the title, the columns or the condition. The type cannot change: delete the constraint and add a new one.',
  params: [TABLE, { name: 'constraint', in: 'path', description: 'Constraint title or ID (con_…).' }],
  examples: [
    {
      title: 'Change the condition',
      method: 'PUT',
      path: '/tables/Orders/constraints/Price%20is%20not%20negative',
      body: { title: 'Price is positive', check: { where: { all: [{ column: 'Price', op: 'gt', value: 0 }] } } },
      status: 200,
      response: ok({
        id: 'con_7e8f9a0b1c2d43e4f5a6b7c8d9e0f1a2',
        name: 'Price is positive',
        type: 'check',
        constraint_name: 'ck_orders_price',
        status: 'ok',
        category: 'custom',
        condition: '(price_3 > 0)',
        columns: [{ id: 'fld_3c4d5e6f7081492081b2c3d4e5f6a7b8', name: 'Price' }],
      }),
    },
    {
      title: 'Changing the type',
      method: 'PUT',
      path: '/tables/Orders/constraints/Price%20is%20positive',
      body: { type: 'unique', columns: ['Price'] },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [{ field: 'type', issue: 'can\'t be changed; delete the constraint and add a new one' }]),
    },
  ],
};

const DELETE_CONSTRAINT: DocEndpoint = {
  id: 'delete-constraint',
  title: 'Drop a constraint',
  method: 'DELETE',
  path: '/tables/{table}/constraints/{constraint}',
  summary: 'Drops the constraint in Postgres and removes it.',
  params: [TABLE, { name: 'constraint', in: 'path', description: 'Constraint title or ID (con_…).' }],
  examples: [
    {
      title: 'Drop a constraint',
      method: 'DELETE',
      path: '/tables/Orders/constraints/Email%20is%20unique',
      status: 200,
      response: ok({ id: CONSTRAINT_ID, deleted: true }),
    },
  ],
};

const GET_PRIMARY_KEY: DocEndpoint = {
  id: 'get-primary-key',
  title: 'Get the primary key',
  method: 'GET',
  path: '/tables/{table}/primary-key',
  summary: 'Shows the key columns in key order, and which columns could be key columns. Needed to address records by key.',
  params: [TABLE],
  examples: [
    {
      title: 'The key of Products',
      method: 'GET',
      path: '/tables/Products/primary-key',
      status: 200,
      response: ok({
        columns: [
          { id: 'fld_a0b1c2d3e4f541a2b3c4d5e6f7a8b9c0', name: 'sku_1762170011', column_name: 'sku_1762170011' },
        ],
        candidates: [
          { id: 'fld_a0b1c2d3e4f541a2b3c4d5e6f7a8b9c0', name: 'SKU', in_key: true, eligible: true },
          { id: 'fld_c2d3e4f5a6b743c4d5e6f7a8b9c0d1e2', name: 'Attachments', in_key: false, eligible: false, reason: 'attachment fields can\'t be part of a key' },
        ],
      }),
    },
  ],
};

const SET_PRIMARY_KEY: DocEndpoint = {
  id: 'set-primary-key',
  title: 'Set the primary key',
  method: 'PUT',
  path: '/tables/{table}/primary-key',
  summary: 'Sets the key to one or more columns, after checking that the existing records are unique on them.',
  params: [TABLE, { name: 'columns', in: 'body', description: 'The key columns, by name or fld_ ID, in key order.' }],
  examples: [
    {
      title: 'A key of two columns',
      method: 'PUT',
      path: '/tables/Products/primary-key',
      body: { columns: ['SKU', 'Region'] },
      status: 200,
      response: ok({
        columns: [
          { id: 'fld_a0b1c2d3e4f541a2b3c4d5e6f7a8b9c0', name: 'sku_1762170011', column_name: 'sku_1762170011' },
          { id: 'fld_b1c2d3e4f5a642b3c4d5e6f7a8b9c0d1', name: 'region_1762170019', column_name: 'region_1762170019' },
        ],
        candidates: [],
      }),
    },
    {
      title: 'A column that does not exist',
      method: 'PUT',
      path: '/tables/Products/primary-key',
      body: { columns: ['Sku'] },
      status: 422,
      response: fail('validation_failed', 'Some columns don\'t exist.', [{ field: 'columns[0]', issue: 'No column named "Sku".' }]),
    },
  ],
};

export const MANAGEMENT_GROUPS: DocGroup[] = [
  { id: 'manage-tables', title: 'Manage tables', endpoints: [CREATE_TABLE, UPDATE_TABLE, DELETE_TABLE] },
  { id: 'manage-columns', title: 'Manage columns', endpoints: [CREATE_COLUMN, UPDATE_COLUMN, DELETE_COLUMN, REORDER_COLUMN] },
  {
    id: 'manage-constraints',
    title: 'Manage constraints',
    endpoints: [LIST_CONSTRAINTS, CREATE_CONSTRAINT, CHECK_CONSTRAINT, UPDATE_CONSTRAINT, DELETE_CONSTRAINT],
  },
  { id: 'manage-primary-key', title: 'Primary key', endpoints: [GET_PRIMARY_KEY, SET_PRIMARY_KEY] },
];

export const MANAGEMENT_SUMMARY: { method: DocEndpoint['method']; path: string; does: string }[] = [
  { method: 'POST', path: '/tables', does: 'Create a table, optionally with columns' },
  { method: 'PATCH', path: '/tables/{table}', does: 'Rename a table or change its description' },
  { method: 'DELETE', path: '/tables/{table}', does: 'Delete a table (?force=true when other tables link to it)' },
  { method: 'POST', path: '/tables/{table}/columns', does: 'Add a column, with optional constraints' },
  { method: 'PATCH', path: '/tables/{table}/columns/{column}', does: 'Rename a column, change its options or type (?dry_run=true previews)' },
  { method: 'DELETE', path: '/tables/{table}/columns/{column}', does: 'Delete a column (?force=true when it holds data)' },
  { method: 'POST', path: '/tables/{table}/columns/reorder', does: 'Move a column before or after another' },
  { method: 'GET', path: '/tables/{table}/constraints', does: 'List unique and check constraints' },
  { method: 'POST', path: '/tables/{table}/constraints', does: 'Add a unique or check constraint' },
  { method: 'POST', path: '/tables/{table}/constraints/check', does: 'Dry run a constraint' },
  { method: 'PUT', path: '/tables/{table}/constraints/{constraint}', does: 'Change a constraint' },
  { method: 'DELETE', path: '/tables/{table}/constraints/{constraint}', does: 'Drop a constraint' },
  { method: 'GET', path: '/tables/{table}/primary-key', does: 'Show the primary key' },
  { method: 'PUT', path: '/tables/{table}/primary-key', does: 'Set the primary key' },
];

export const MANAGEMENT_ERROR_CODES: { code: string; status: number; when: string }[] = [
  { code: 'feature_disabled', status: 403, when: 'Base management is off for this base; an owner or co-owner turns it on in Developer settings' },
  { code: 'system_column', status: 403, when: 'System columns cannot be changed, moved or deleted' },
  { code: 'in_use', status: 409, when: 'Other tables, constraints or lookups depend on what you are deleting; details lists them' },
  { code: 'conversion_not_allowed', status: 409, when: 'The type change is not allowed for this column; details lists the allowed types' },
  { code: 'type_not_supported', status: 422, when: 'formula, attachment and user columns cannot be created through the API yet' },
  { code: 'unavailable', status: 503, when: 'Another schema change on this base is still running; try again after Retry-After' },
];
