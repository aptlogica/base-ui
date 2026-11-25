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

const ok = (data: unknown) => ({
  data,
  error: null,
  meta: { request_id: REQUEST_ID },
});
const fail = (code: string, message: string, details?: Record<string, unknown>[]) => ({
  data: null,
  error: { code, message, ...(details ? { details } : {}) },
  meta: { request_id: REQUEST_ID },
});

const TABLE = {
  name: 'table',
  in: 'path',
  description: 'Table name or ID (tbl_…).',
} as const;
const COLUMN = {
  name: 'column',
  in: 'path',
  description: 'Column name or ID (fld_…).',
} as const;
const IDEMPOTENCY = {
  name: 'Idempotency-Key',
  in: 'header',
  description: 'Optional. A retry with the same key and body replays the first response.',
} as const;

const ORDERS_ID = 'tbl_7c1e0a4f9b2d4e6f8a3c5d7e9f1b2c4d';
const EMAIL_ID = 'fld_9a0b1c2d3e4f45a6b7c8d9e0f1a2b3c4';
const NOTES_ID = 'fld_0b1c2d3e4f5a46b7c8d9e0f1a2b3c4d5';
const CONSTRAINT_ID = 'con_5c6d7e8f9a0b41c2d3e4f5a6b7c8d9e0';

// Sample column ID, for the long responses
const fieldId = (n: number) => `fld_${n.toString(16).padStart(32, '0')}`;

const FEATURE_OFF = fail('feature_disabled', 'Base management is off for this base. Turn it on in the Developer settings.');

const CREATE_TABLE: DocEndpoint = {
  id: 'create-table',
  title: 'Create a table',
  method: 'POST',
  path: '/tables',
  summary: 'Creates a table, optionally with its first columns. The table never gets a default Title column: it has only the columns you send. If a step fails, the half-built table is removed again.',
  params: [
    {
      name: 'name',
      in: 'body',
      description: 'Required. The table name. It must not be used by another table of the base. Use it in URLs as /tables/{name}.',
    },
    {
      name: 'title',
      in: 'body',
      description: 'Alias of name. Send one of the two.',
    },
    {
      name: 'description',
      in: 'body',
      description: 'Optional text that says what the table is for. Shown in the app and in GET /tables.',
    },
    {
      name: 'columns',
      in: 'body',
      description: "Optional array of the table's first columns, added in the order sent. Leave it out (or send []) for a table with no columns. Each item takes the keys below.",
    },
    {
      name: 'columns[].title',
      in: 'body',
      description: 'Required. The column name; unique within the table. columns[].name is an alias.',
    },
    {
      name: 'columns[].uidt',
      in: 'body',
      description: 'Required. The column type (text, number, select, links, ...), in any letter case. Decides what values the column holds.',
    },
    {
      name: 'columns[].description',
      in: 'body',
      description: 'Optional text that says what the column holds.',
    },
    {
      name: 'columns[].meta',
      in: 'body',
      description: 'Optional settings of the type, such as options of a select, precision of a decimal, relation of a link.',
    },
    {
      name: 'columns[].constraints',
      in: 'body',
      description: 'Optional rules for the column: unique, check. See Add a column. default and id_generation go in meta.',
    },
    IDEMPOTENCY,
  ],
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
          {
            id: 'fld_b2c3d4e5f6a74b8c9d0e1f2a3b4c5d6e',
            name: 'Number',
            type: 'text',
            uidt: 'text',
            dt: 'TEXT',
          },
          {
            id: 'fld_c3d4e5f6a7b84c9d0e1f2a3b4c5d6e7f',
            name: 'Amount',
            type: 'decimal',
            uidt: 'decimal',
            dt: 'NUMERIC',
          },
        ],
      }),
    },
    {
      title: 'Only a name: a table with no columns',
      description: 'No Title column is added. Add columns afterwards with Add a column.',
      method: 'POST',
      path: '/tables',
      body: { name: 'Suppliers' },
      status: 201,
      response: ok({
        id: 'tbl_d4e5f6a7b8c94d0e1f2a3b4c5d6e7f80',
        name: 'Suppliers',
        base_id: BASE_ID,
      }),
    },
    {
      title: 'A name and a description',
      method: 'POST',
      path: '/tables',
      body: { name: 'Shipments', description: 'One row per parcel sent out' },
      status: 201,
      response: ok({
        id: 'tbl_e5f6a7b8c9d04e1f2a3b4c5d6e7f8091',
        name: 'Shipments',
        description: 'One row per parcel sent out',
        base_id: BASE_ID,
      }),
    },
    {
      title: 'title instead of name, and an empty columns list',
      description: 'title is an alias of name. columns: [] is the same as leaving columns out.',
      method: 'POST',
      path: '/tables',
      body: { title: 'Warehouses', columns: [] },
      status: 201,
      response: ok({
        id: 'tbl_f6a7b8c9d0e14f2a3b4c5d6e7f809102',
        name: 'Warehouses',
        base_id: BASE_ID,
      }),
    },
    {
      title: 'Text, number and date columns with descriptions',
      method: 'POST',
      path: '/tables',
      body: {
        name: 'Employees',
        columns: [
          {
            title: 'Full name',
            uidt: 'text',
            description: 'First and last name',
          },
          { title: 'Bio', uidt: 'longText' },
          { title: 'Age', uidt: 'number' },
          { title: 'Salary', uidt: 'currency' },
          { title: 'Hired on', uidt: 'date' },
          { title: 'Active', uidt: 'boolean' },
        ],
      },
      status: 201,
      response: ok({
        id: 'tbl_a7b8c9d0e1f24a3b4c5d6e7f80910213',
        name: 'Employees',
        base_id: BASE_ID,
        columns: [
          {
            id: 'fld_b8c9d0e1f2a34b4c5d6e7f8091021324',
            name: 'Full name',
            description: 'First and last name',
            type: 'text',
            uidt: 'text',
          },
          {
            id: 'fld_c9d0e1f2a3b44c5d6e7f809102132435',
            name: 'Bio',
            type: 'long_text',
            uidt: 'longText',
          },
          {
            id: 'fld_d0e1f2a3b4c54d6e7f80910213243546',
            name: 'Age',
            type: 'number',
            uidt: 'number',
          },
          {
            id: 'fld_e1f2a3b4c5d64e7f8091021324354657',
            name: 'Salary',
            type: 'currency',
            uidt: 'currency',
          },
          {
            id: 'fld_f2a3b4c5d6e74f80910213243546576a',
            name: 'Hired on',
            type: 'date',
            uidt: 'date',
          },
          {
            id: 'fld_a3b4c5d6e7f8409102132435465768ab',
            name: 'Active',
            type: 'checkbox',
            uidt: 'boolean',
          },
        ],
      }),
    },
    {
      title: 'Every simple column type in one request',
      description: 'uidt is not case sensitive: longtext, longText and LONGTEXT are the same type.',
      method: 'POST',
      path: '/tables',
      body: {
        name: 'Type tour',
        columns: [
          { title: 'A text', uidt: 'text' },
          { title: 'A long text', uidt: 'longtext' },
          { title: 'An email', uidt: 'email' },
          { title: 'A phone', uidt: 'phoneNumber' },
          { title: 'A url', uidt: 'url' },
          { title: 'A number', uidt: 'number' },
          { title: 'A decimal', uidt: 'decimal' },
          { title: 'A currency', uidt: 'currency' },
          { title: 'A percent', uidt: 'percent' },
          { title: 'A rating', uidt: 'rating' },
          { title: 'A year', uidt: 'year' },
          { title: 'A date', uidt: 'date' },
          { title: 'A datetime', uidt: 'datetime' },
          { title: 'A time', uidt: 'time' },
          { title: 'A duration', uidt: 'duration' },
          { title: 'A checkbox', uidt: 'boolean' },
          { title: 'A json', uidt: 'json' },
          { title: 'An id', uidt: 'uuid' },
        ],
      },
      status: 201,
      response: ok({
        id: 'tbl_b4c5d6e7f8a9410213243546576879ab',
        name: 'Type tour',
        base_id: BASE_ID,
        columns: [
          { id: fieldId(1), name: 'A text', type: 'text', uidt: 'text' },
          {
            id: fieldId(2),
            name: 'A long text',
            type: 'long_text',
            uidt: 'longText',
          },
          { id: fieldId(3), name: 'An email', type: 'email', uidt: 'email' },
          {
            id: fieldId(4),
            name: 'A phone',
            type: 'phone_number',
            uidt: 'phoneNumber',
          },
          { id: fieldId(5), name: 'A url', type: 'url', uidt: 'url' },
          { id: fieldId(6), name: 'A number', type: 'number', uidt: 'number' },
          {
            id: fieldId(7),
            name: 'A decimal',
            type: 'decimal',
            uidt: 'decimal',
          },
          {
            id: fieldId(8),
            name: 'A currency',
            type: 'currency',
            uidt: 'currency',
          },
          {
            id: fieldId(9),
            name: 'A percent',
            type: 'percent',
            uidt: 'percent',
          },
          { id: fieldId(10), name: 'A rating', type: 'rating', uidt: 'rating' },
          { id: fieldId(11), name: 'A year', type: 'year', uidt: 'year' },
          { id: fieldId(12), name: 'A date', type: 'date', uidt: 'date' },
          {
            id: fieldId(13),
            name: 'A datetime',
            type: 'date_time',
            uidt: 'datetime',
          },
          { id: fieldId(14), name: 'A time', type: 'time', uidt: 'time' },
          {
            id: fieldId(15),
            name: 'A duration',
            type: 'duration',
            uidt: 'duration',
          },
          {
            id: fieldId(16),
            name: 'A checkbox',
            type: 'checkbox',
            uidt: 'boolean',
          },
          { id: fieldId(17), name: 'A json', type: 'json', uidt: 'json' },
          { id: fieldId(18), name: 'An id', type: 'uuid', uidt: 'uuid' },
        ],
      }),
    },
    {
      title: 'Select columns with choices',
      method: 'POST',
      path: '/tables',
      body: {
        name: 'Tickets',
        columns: [
          { title: 'Subject', uidt: 'text' },
          {
            title: 'Status',
            uidt: 'select',
            meta: {
              options: [
                { option: 'Open', color: '#2563eb' },
                { option: 'Closed', color: '#16a34a' },
              ],
            },
          },
          {
            title: 'Labels',
            uidt: 'multiSelect',
            meta: {
              options: [{ option: 'Bug' }, { option: 'Question' }, { option: 'Idea' }],
            },
          },
        ],
      },
      status: 201,
      response: ok({
        id: 'tbl_c6d7e8f9a0b14213243546576879809a',
        name: 'Tickets',
        base_id: BASE_ID,
        columns: [
          {
            id: 'fld_d7e8f9a0b1c24324354657687980910b',
            name: 'Subject',
            type: 'text',
            uidt: 'text',
          },
          {
            id: 'fld_e8f9a0b1c2d34435465768798091021c',
            name: 'Status',
            type: 'single_select',
            uidt: 'select',
          },
          {
            id: 'fld_f9a0b1c2d3e44546576879809102132d',
            name: 'Labels',
            type: 'multi_select',
            uidt: 'multiSelect',
          },
        ],
      }),
    },
    {
      title: 'Columns with constraints: unique, default, id generation, check',
      description: 'Each column takes the settings of Add a column: default and id_generation in meta, unique and check in constraints. The columns are added one after the other, in the order sent.',
      method: 'POST',
      path: '/tables',
      body: {
        name: 'Products',
        columns: [
          {
            title: 'Product ID',
            uidt: 'uuid',
            meta: { id_generation: { mode: 'auto' } },
          },
          { title: 'SKU', uidt: 'text', constraints: { unique: true } },
          { title: 'Status', uidt: 'text', meta: { default: 'draft' } },
          {
            title: 'Price',
            uidt: 'decimal',
            constraints: {
              check: {
                category: 'number_date',
                where: { all: [{ column: 'Price', op: 'gte', value: 0 }] },
              },
            },
          },
        ],
      },
      status: 201,
      response: ok({
        id: 'tbl_d8e9f0a1b2c34324354657687980910c',
        name: 'Products',
        base_id: BASE_ID,
        columns: [
          {
            id: 'fld_e9f0a1b2c3d44435465768798091021d',
            name: 'Product ID',
            type: 'uuid',
            uidt: 'uuid',
          },
          {
            id: 'fld_f0a1b2c3d4e54546576879809102132e',
            name: 'SKU',
            type: 'text',
            uidt: 'text',
          },
          {
            id: 'fld_a1b2c3d4e5f64657687980910213243f',
            name: 'Status',
            type: 'text',
            uidt: 'text',
          },
          {
            id: 'fld_b2c3d4e5f6a74768798091021324354a',
            name: 'Price',
            type: 'decimal',
            uidt: 'decimal',
          },
        ],
      }),
    },
    {
      title: 'A link to an existing table, and a lookup through it',
      description: 'A lookup can use a links column that comes earlier in the same request. Link targets are named by table name or tbl_ ID.',
      method: 'POST',
      path: '/tables',
      body: {
        name: 'Deliveries',
        columns: [
          { title: 'Reference', uidt: 'text' },
          {
            title: 'Customer',
            uidt: 'links',
            meta: { relation: { with: 'Customers', type: 'has-many' } },
          },
          {
            title: 'Customer email',
            uidt: 'lookup',
            meta: { link_column_id: 'Customer', lookup_column_id: 'Email' },
          },
        ],
      },
      status: 201,
      response: ok({
        id: 'tbl_c3d4e5f6a7b84879809102132435465b',
        name: 'Deliveries',
        base_id: BASE_ID,
        columns: [
          {
            id: 'fld_d4e5f6a7b8c94980910213243546576c',
            name: 'Reference',
            type: 'text',
            uidt: 'text',
          },
          {
            id: 'fld_e5f6a7b8c9d04091021324354657687d',
            name: 'Customer',
            type: 'links',
            uidt: 'links',
          },
          {
            id: 'fld_f6a7b8c9d0e14102132435465768798e',
            name: 'Customer email',
            type: 'lookup',
            uidt: 'lookup',
          },
        ],
      }),
    },
    {
      title: 'With an Idempotency-Key, so a retry does not create it twice',
      description: 'The first request creates the table. A retry with the same key and body gets the same response again, with the header Idempotent-Replayed: true.',
      method: 'POST',
      path: '/tables',
      headers: { 'Idempotency-Key': 'create-invoices-2026-11-23' },
      body: {
        name: 'Receipts',
        columns: [{ title: 'Number', uidt: 'text', constraints: { unique: true } }],
      },
      status: 201,
      response: ok({
        id: 'tbl_a8b9c0d1e2f34213243546576879809b',
        name: 'Receipts',
        base_id: BASE_ID,
        columns: [
          {
            id: 'fld_b9c0d1e2f3a44324354657687980910c',
            name: 'Number',
            type: 'text',
            uidt: 'text',
          },
        ],
      }),
    },
    {
      title: 'The same Idempotency-Key with a different body',
      method: 'POST',
      path: '/tables',
      headers: { 'Idempotency-Key': 'create-invoices-2026-11-23' },
      body: { name: 'Receipts 2' },
      status: 409,
      response: fail('conflict', 'This Idempotency-Key was already used with a different request. Use a new key for a new request.'),
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
      title: 'The name is missing',
      method: 'POST',
      path: '/tables',
      body: { description: 'No name given' },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [{ field: 'name', issue: 'is required' }]),
    },
    {
      title: 'An unknown key in the body',
      method: 'POST',
      path: '/tables',
      body: { name: 'Invoices', icon: 'receipt' },
      status: 400,
      response: fail('bad_request', 'body: unknown key "icon". Allowed: name, title, description, columns.'),
    },
    {
      title: 'columns is not an array',
      method: 'POST',
      path: '/tables',
      body: { name: 'Invoices', columns: { title: 'Number', uidt: 'text' } },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [{ field: 'columns', issue: 'must be an array' }]),
    },
    {
      title: 'Several column problems, answered together',
      description: 'Every problem found while reading the request is returned in details; nothing is created.',
      method: 'POST',
      path: '/tables',
      body: {
        name: 'Invoices',
        columns: [{ uidt: 'text' }, { title: 'Amount', uidt: 'money' }, { title: 'Amount', uidt: 'decimal' }, 'Number'],
      },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [
        { field: 'columns[0].title', issue: 'is required' },
        { field: 'columns[1].uidt', issue: 'unknown type "money"' },
        { field: 'columns[2].title', issue: 'two columns have this title' },
        { field: 'columns[3]', issue: 'must be an object' },
      ]),
    },
    {
      title: 'A system-set type',
      method: 'POST',
      path: '/tables',
      body: {
        name: 'Audit',
        columns: [{ title: 'Made at', uidt: 'createdTime' }],
      },
      status: 422,
      response: fail('type_not_supported', 'The type "createdTime" is set by the system and can\'t be created or chosen.'),
    },
    {
      title: 'A later column fails: the table is not kept',
      description: 'columns[1] links to a table that does not exist. The table made for this request is removed again, so a failed request leaves nothing behind.',
      method: 'POST',
      path: '/tables',
      body: {
        name: 'Invoices',
        columns: [
          { title: 'Number', uidt: 'text' },
          {
            title: 'Customer',
            uidt: 'links',
            meta: { relation: { with: 'Clients', type: 'has-many' } },
          },
        ],
      },
      status: 422,
      response: fail('validation_failed', "The linked table doesn't exist in this base.", [
        {
          field: 'columns[1].meta.relation.with',
          issue: 'No table named "Clients".',
        },
      ]),
    },
    {
      title: 'A constraint on a later column fails',
      method: 'POST',
      path: '/tables',
      body: {
        name: 'Invoices',
        columns: [
          { title: 'Code', uidt: 'text' },
          {
            title: 'Region',
            uidt: 'text',
            meta: { default: 'EU' },
            constraints: { unique: true },
          },
        ],
      },
      status: 422,
      response: fail(
        'validation_failed',
        'This column has a UNIQUE constraint. Its default value may be duplicated when inserting multiple rows. Remove the default value or the UNIQUE constraint to avoid duplicate-value errors.',
        [
          {
            field: 'columns[1].meta.default',
            issue: "can't be combined with unique",
          },
        ]
      ),
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
  params: [
    TABLE,
    {
      name: 'name',
      in: 'body',
      description: 'Renames the table. It must not be used by another table; the table keeps its ID, so apps that use the ID are not affected.',
    },
    { name: 'title', in: 'body', description: 'Alias of name.' },
    {
      name: 'description',
      in: 'body',
      description: 'Replaces the description. An empty string clears it. Leave it out to keep the current one.',
    },
  ],
  notes: ['Send at least one of name, title or description. Any other key answers 400.'],
  examples: [
    {
      title: 'Change only the description',
      method: 'PATCH',
      path: '/tables/Orders',
      body: { description: 'Orders placed in the web shop' },
      status: 200,
      response: ok({
        id: ORDERS_ID,
        name: 'Orders',
        description: 'Orders placed in the web shop',
        base_id: BASE_ID,
      }),
    },
    {
      title: 'Rename and change the description together',
      method: 'PATCH',
      path: '/tables/Orders',
      body: {
        name: 'Web orders',
        description: 'Orders placed in the web shop',
      },
      status: 200,
      response: ok({
        id: ORDERS_ID,
        name: 'Web orders',
        description: 'Orders placed in the web shop',
        base_id: BASE_ID,
      }),
    },
    {
      title: 'Address the table by ID, and use title',
      description: 'The table in the path can be its name or its tbl_ ID. title is an alias of name.',
      method: 'PATCH',
      path: '/tables/' + ORDERS_ID,
      body: { title: 'Sales orders' },
      status: 200,
      response: ok({ id: ORDERS_ID, name: 'Sales orders', base_id: BASE_ID }),
    },
    {
      title: 'Clear the description',
      method: 'PATCH',
      path: '/tables/Orders',
      body: { description: '' },
      status: 200,
      response: ok({ id: ORDERS_ID, name: 'Orders', base_id: BASE_ID }),
    },
    {
      title: 'Nothing to change',
      method: 'PATCH',
      path: '/tables/Orders',
      body: {},
      status: 400,
      response: fail('bad_request', 'Send name or description.'),
    },
    {
      title: 'An empty name',
      method: 'PATCH',
      path: '/tables/Orders',
      body: { name: '  ' },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [{ field: 'name', issue: 'must be a non-empty string' }]),
    },
    {
      title: 'The description is not text',
      method: 'PATCH',
      path: '/tables/Orders',
      body: { description: 42 },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [{ field: 'description', issue: 'must be a string' }]),
    },
    {
      title: 'An unknown key',
      method: 'PATCH',
      path: '/tables/Orders',
      body: { name: 'Sales orders', icon: 'cart' },
      status: 400,
      response: fail('bad_request', 'body: unknown key "icon". Allowed: name, title, description.'),
    },
    {
      title: 'The table does not exist',
      method: 'PATCH',
      path: '/tables/Ghost',
      body: { name: 'Anything' },
      status: 404,
      response: fail('not_found', 'No table named "Ghost".'),
    },
    {
      title: 'Base management is off',
      method: 'PATCH',
      path: '/tables/Orders',
      body: { name: 'Sales orders' },
      status: 403,
      response: FEATURE_OFF,
    },
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
  params: [
    TABLE,
    {
      name: 'force',
      in: 'query',
      description: 'Optional. true deletes the table although link columns of other tables point at it. Without it the answer is 409 in_use and nothing is deleted. This call has no body.',
    },
  ],
  examples: [
    {
      title: 'Delete by ID',
      method: 'DELETE',
      path: '/tables/' + ORDERS_ID,
      status: 200,
      response: ok({ id: ORDERS_ID, deleted: true }),
    },
    {
      title: 'Delete although other tables link to it (force)',
      description: 'The link columns in other tables are not deleted by this call; they are left pointing at a table that is gone, so remove them first when you can.',
      method: 'DELETE',
      path: '/tables/Customers?force=true',
      status: 200,
      response: ok({
        id: 'tbl_8d2f1b5a0c3e4f7a9b6d4e2c1a0f9e8d',
        deleted: true,
      }),
    },
    {
      title: 'force=false is the same as no force',
      method: 'DELETE',
      path: '/tables/Customers?force=false',
      status: 409,
      response: fail('in_use', '2 link columns in other tables point at this table. Delete them first, or send ?force=true to delete the table anyway.', [
        {
          id: 'fld_6f708192a3b44c53b4e5f6a7b8c9d0e1',
          field: 'Orders.Customer',
          issue: 'link_column',
        },
        {
          id: fieldId(901),
          field: 'Invoices.Customer',
          issue: 'link_column',
        },
      ]),
    },
    {
      title: 'The table does not exist',
      method: 'DELETE',
      path: '/tables/Ghost',
      status: 404,
      response: fail('not_found', 'No table named "Ghost".'),
    },
    {
      title: 'Delete a table',
      method: 'DELETE',
      path: '/tables/Invoices',
      status: 200,
      response: ok({
        id: 'tbl_a1b2c3d4e5f64a7b8c9d0e1f2a3b4c5d',
        deleted: true,
      }),
    },
    {
      title: 'Other tables link to it',
      method: 'DELETE',
      path: '/tables/Customers',
      status: 409,
      response: fail('in_use', '1 link columns in other tables point at this table. Delete them first, or send ?force=true to delete the table anyway.', [
        {
          id: 'fld_6f708192a3b44c53b4e5f6a7b8c9d0e1',
          field: 'Orders.Customer',
          issue: 'link_column',
        },
      ]),
    },
  ],
};

const CREATE_COLUMN: DocEndpoint = {
  id: 'create-column',
  title: 'Add a column',
  method: 'POST',
  path: '/tables/{table}/columns',
  summary:
    "Adds a column the way the app does: a title, the app's type (uidt) and meta for the type's options. Optional constraints are applied after the column exists; if one fails, the new column is removed again.",
  params: [
    TABLE,
    {
      name: 'title',
      in: 'body',
      description: 'Required. The column name; it must be new in this table. name is an alias.',
    },
    {
      name: 'uidt',
      in: 'body',
      description: 'Required. The column type, in any letter case (longtext = longText). It decides what values the column accepts and how the app shows them.',
    },
    {
      name: 'description',
      in: 'body',
      description: 'Optional text that says what the column holds.',
    },
    {
      name: 'meta',
      in: 'body',
      description:
        'Optional settings that belong to the type: options (select, multiSelect), ratingMax (rating), precision (decimal), emailValid / phoneValid / urlValid (turn the format check on or off), relation (links), link_column_id and lookup_column_id (lookup), and the two settings below: default and id_generation.',
    },
    {
      name: 'meta.default',
      in: 'body',
      description: 'The value a new record gets when none is sent. Not together with constraints.unique or constraints.check. Not for links and lookups. The column shows it as meta.defaultValue.',
    },
    {
      name: 'meta.id_generation',
      in: 'body',
      description: 'uuid columns only: {"mode": "auto" | "manual", "version": optional}. auto (the default): the system creates the value and nobody can write it. manual: people enter a valid UUID.',
    },
    {
      name: 'constraints.unique',
      in: 'body',
      description: 'true: no two records may have the same value. Creates a unique constraint named "<title> is unique".',
    },
    {
      name: 'constraints.check',
      in: 'body',
      description: '{"category": optional, "where": condition}. Every record must satisfy the condition. It can use this column only. category is for example text or number_date; default custom.',
    },
    {
      name: 'constraints.check.where',
      in: 'body',
      description:
        'The condition, as JSON. A group is an object with exactly one key, all (every item true), any (at least one true) or none (no item true), holding a non-empty array. Each item is a condition {"column", "op", "value"} or another group. Groups nest up to 5 deep, with at most 50 conditions. See the notes for the operators.',
    },
    IDEMPOTENCY,
  ],
  notes: [
    "uidt is the app's type: text, longText, number, decimal, currency, percent, rating, boolean, date, datetime, time, duration, year, email, phoneNumber, url, select, multiSelect, json, uuid, links, lookup.",
    'select and multiSelect take their choices in meta.options. links take meta.relation: {"with": <table name or ID>, "type": "has-many" | "many-to-many" | "one-to-one"}. lookup takes meta.link_column_id (a links column of this table) and meta.lookup_column_id (a column of the linked table).',
    'meta settings: default (not together with unique or check) and id_generation (uuid columns). constraints: unique (not for links, lookups, JSON, multi select, rating or system columns) and check (a structured condition on this column). Links and lookups take no default, id_generation or constraints. default and id_generation under constraints answer 422: they are column settings, so they go in meta.',
    'formula, attachment and user columns answer 422 type_not_supported.',
    'A check condition is JSON, never SQL: {"all" | "any" | "none": [{"column", "op", "value"}, ...]}. The server turns it into the SQL inside CHECK (...): all is AND, any is OR, none is NOT (a OR b). Existing data must already pass, otherwise nothing is added and the answer is 422.',
    'A condition has column (a name or fld_ ID), op and, for most operators, value. No other keys. The column can be this column only; for conditions over several columns use Add a constraint. Links and lookups can not be used.',
    'Operators that work on any column: eq, neq, gt, gte, lt, lte (value: a string, number or true/false), in (value: an array of 1 to 100 such values), is_null and is_not_null (no value).',
    'Operators for text columns only: contains, starts_with, ends_with (value: a string; %, _ and \\ match themselves) and not_empty (no value; true when the value is not null and not blank).',
    'is_null, is_not_null and not_empty refuse a value; every other operator requires one. A wrong part is named by its path in details, for example constraints.check.where.all[1].op.',
  ],
  examples: [
    {
      title: 'The smallest request: a title and a type',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Reference', uidt: 'text' },
      status: 201,
      response: ok({
        id: fieldId(201),
        name: 'Reference',
        type: 'text',
        uidt: 'text',
        dt: 'TEXT',
      }),
    },
    {
      title: 'name instead of title, a description, and the table by ID',
      method: 'POST',
      path: '/tables/' + ORDERS_ID + '/columns',
      body: {
        name: 'Internal note',
        uidt: 'longText',
        description: 'Only staff see this',
      },
      status: 201,
      response: ok({
        id: fieldId(202),
        name: 'Internal note',
        description: 'Only staff see this',
        type: 'long_text',
        uidt: 'longText',
      }),
    },
    {
      title: 'A decimal with precision',
      description: 'precision is a number of decimal places (2) or the app\'s pattern ("1.00" is two places).',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Weight (kg)', uidt: 'decimal', meta: { precision: 2 } },
      status: 201,
      response: ok({
        id: fieldId(203),
        name: 'Weight (kg)',
        type: 'decimal',
        uidt: 'decimal',
        meta: { precision: 2 },
      }),
    },
    {
      title: 'A rating with its own maximum',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Satisfaction', uidt: 'rating', meta: { ratingMax: 10 } },
      status: 201,
      response: ok({
        id: fieldId(204),
        name: 'Satisfaction',
        type: 'rating',
        uidt: 'rating',
        meta: { ratingMax: 10 },
      }),
    },
    {
      title: 'A date and time column',
      description: 'The type name is not case sensitive: datetime, dateTime and DATETIME are the same.',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Delivered at', uidt: 'DATETIME' },
      status: 201,
      response: ok({
        id: fieldId(205),
        name: 'Delivered at',
        type: 'date_time',
        uidt: 'datetime',
      }),
    },
    {
      title: 'A checkbox that starts unchecked',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Paid', uidt: 'boolean', meta: { default: false } },
      status: 201,
      response: ok({
        id: fieldId(206),
        name: 'Paid',
        type: 'checkbox',
        uidt: 'boolean',
        meta: { defaultValue: false },
      }),
    },
    {
      title: 'An email column with the format check turned off',
      description: 'email and phoneNumber check the format by default; url does not. emailValid, phoneValid and urlValid switch the checks.',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Contact', uidt: 'email', meta: { emailValid: false } },
      status: 201,
      response: ok({
        id: fieldId(207),
        name: 'Contact',
        type: 'email',
        uidt: 'email',
        meta: { emailValid: false },
      }),
    },
    {
      title: 'A url column that checks its format',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Tracking page', uidt: 'url', meta: { urlValid: true } },
      status: 201,
      response: ok({
        id: fieldId(208),
        name: 'Tracking page',
        type: 'url',
        uidt: 'url',
        meta: { urlValid: true },
      }),
    },
    {
      title: 'A multi select, choices as plain strings',
      description: 'meta.options takes objects with option and color, or just the names.',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Tags',
        uidt: 'multiSelect',
        meta: { options: ['Gift', 'Fragile', 'Express'] },
      },
      status: 201,
      response: ok({
        id: fieldId(209),
        name: 'Tags',
        type: 'multi_select',
        uidt: 'multiSelect',
        meta: { options: ['Gift', 'Fragile', 'Express'] },
      }),
    },
    {
      title: 'A single select with a default choice',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Stage',
        uidt: 'select',
        meta: {
          options: [{ option: 'New' }, { option: 'Packed' }, { option: 'Sent' }],
          default: 'New',
        },
      },
      status: 201,
      response: ok({
        id: fieldId(210),
        name: 'Stage',
        type: 'single_select',
        uidt: 'select',
        meta: {
          options: [{ option: 'New' }, { option: 'Packed' }, { option: 'Sent' }],
          defaultValue: 'New',
        },
      }),
    },
    {
      title: 'A uuid column the system fills',
      description: 'id_generation.mode "auto": the system creates the value of every new record and nobody can write it. version is optional.',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Public ID',
        uidt: 'uuid',
        meta: { id_generation: { mode: 'auto', version: 'v4' } },
      },
      status: 201,
      response: ok({
        id: fieldId(212),
        name: 'Public ID',
        type: 'uuid',
        uidt: 'uuid',
        meta: { id_generation: { mode: 'auto', version: 'v4' } },
      }),
    },
    {
      title: 'A uuid column people fill in, and unique',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Partner ID',
        uidt: 'uuid',
        meta: { id_generation: { mode: 'manual' } },
        constraints: { unique: true },
      },
      status: 201,
      response: ok({
        id: fieldId(213),
        name: 'Partner ID',
        type: 'uuid',
        uidt: 'uuid',
        meta: { id_generation: { mode: 'manual' } },
      }),
    },
    {
      title: 'A default value',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Currency code',
        uidt: 'text',
        meta: { default: 'EUR' },
      },
      status: 201,
      response: ok({
        id: fieldId(214),
        name: 'Currency code',
        type: 'text',
        uidt: 'text',
        meta: { defaultValue: 'EUR' },
      }),
    },
    {
      title: 'Unique on its own',
      description: 'A unique constraint named "<title> is unique" is made for the column. See List constraints.',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Invoice number',
        uidt: 'text',
        constraints: { unique: true },
      },
      status: 201,
      response: ok({
        id: fieldId(215),
        name: 'Invoice number',
        type: 'text',
        uidt: 'text',
      }),
    },
    {
      title: 'A check on its own column: not negative',
      description: 'A column check can only use the column itself and is named "<title> check". category is optional (for example text or number_date; default custom).',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Discount',
        uidt: 'decimal',
        constraints: {
          check: {
            category: 'number_date',
            where: { all: [{ column: 'Discount', op: 'gte', value: 0 }] },
          },
        },
      },
      status: 201,
      response: ok({
        id: fieldId(216),
        name: 'Discount',
        type: 'decimal',
        uidt: 'decimal',
      }),
    },
    {
      title: 'A check with nested groups and in',
      description: 'all = AND, any = OR, none = NOT (a OR b). Groups nest up to 5 deep; at most 50 conditions. in takes 1 to 100 values.',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Quantity',
        uidt: 'number',
        constraints: {
          check: {
            category: 'number_date',
            where: {
              all: [
                { column: 'Quantity', op: 'gte', value: 1 },
                {
                  any: [
                    { column: 'Quantity', op: 'lte', value: 100 },
                    { column: 'Quantity', op: 'in', value: [250, 500] },
                  ],
                },
              ],
            },
          },
        },
      },
      status: 201,
      response: ok({
        id: fieldId(217),
        name: 'Quantity',
        type: 'number',
        uidt: 'number',
      }),
    },
    {
      title: 'A text check with not_empty and starts_with',
      description: 'contains, starts_with, ends_with and not_empty work on text columns only. is_null, is_not_null and not_empty take no value.',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Order code',
        uidt: 'text',
        constraints: {
          check: {
            category: 'text',
            where: {
              all: [
                { column: 'Order code', op: 'not_empty' },
                { column: 'Order code', op: 'starts_with', value: 'ORD-' },
              ],
            },
          },
        },
      },
      status: 201,
      response: ok({
        id: fieldId(218),
        name: 'Order code',
        type: 'text',
        uidt: 'text',
      }),
    },
    {
      title: 'Description, unique and check together',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Contact email',
        uidt: 'email',
        description: 'Billing contact',
        constraints: {
          unique: true,
          check: {
            category: 'text',
            where: {
              all: [{ column: 'Contact email', op: 'contains', value: '@' }],
            },
          },
        },
      },
      status: 201,
      response: ok({
        id: fieldId(219),
        name: 'Contact email',
        description: 'Billing contact',
        type: 'email',
        uidt: 'email',
      }),
    },
    {
      title: 'A many-to-many link',
      description: 'relation.with is a table name or a tbl_ ID; type is has-many, many-to-many or one-to-one.',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Products',
        uidt: 'links',
        description: 'Items in the order',
        meta: { relation: { with: 'Products', type: 'many-to-many' } },
      },
      status: 201,
      response: ok({
        id: fieldId(220),
        name: 'Products',
        description: 'Items in the order',
        type: 'links',
        uidt: 'links',
      }),
    },
    {
      title: 'A lookup through a link',
      description: 'link_column_id is a links column of this table; lookup_column_id is a column of the linked table. Both take a name or an ID.',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Customer email',
        uidt: 'lookup',
        meta: { link_column_id: 'Customer', lookup_column_id: 'Email' },
      },
      status: 201,
      response: ok({
        id: fieldId(221),
        name: 'Customer email',
        type: 'lookup',
        uidt: 'lookup',
      }),
    },
    {
      title: 'With an Idempotency-Key',
      description: 'A retry with the same key and body gets the first response again instead of a "column already exists" conflict.',
      method: 'POST',
      path: '/tables/Orders/columns',
      headers: { 'Idempotency-Key': 'add-reference-1' },
      body: { title: 'Reference', uidt: 'text' },
      status: 201,
      response: ok({
        id: fieldId(201),
        name: 'Reference',
        type: 'text',
        uidt: 'text',
        dt: 'TEXT',
      }),
    },
    {
      title: 'Missing title and type',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { description: 'Nothing else' },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [
        { field: 'body.title', issue: 'is required' },
        { field: 'body.uidt', issue: 'is required' },
      ]),
    },
    {
      title: 'An unknown type',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Cost', uidt: 'money' },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [{ field: 'body.uidt', issue: 'unknown type "money"' }]),
    },
    {
      title: 'meta is not an object',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Stage', uidt: 'select', meta: ['New', 'Sent'] },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [{ field: 'body.meta', issue: 'must be a JSON object' }]),
    },
    {
      title: 'An unknown constraint',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Code', uidt: 'text', constraints: { required: true } },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [
        {
          field: 'body.constraints.required',
          issue: 'unknown constraint; allowed: unique, check',
        },
      ]),
    },
    {
      title: 'default or id_generation under constraints',
      description: 'They are column settings: give them in meta.',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Code', uidt: 'text', constraints: { default: 'n/a' } },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [
        {
          field: 'body.constraints.default',
          issue: 'is a column setting: give it in meta, not in constraints',
        },
      ]),
    },
    {
      title: 'An unknown key in the body',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Code', uidt: 'text', position: 3 },
      status: 400,
      response: fail('bad_request', 'body: unknown key "position". Allowed: title, name, description, uidt, meta, constraints, empty_first.'),
    },
    {
      title: 'id_generation on a column that is not uuid',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Code',
        uidt: 'text',
        meta: { id_generation: { mode: 'auto' } },
      },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [
        {
          field: 'meta.id_generation',
          issue: 'only uuid columns can generate IDs',
        },
      ]),
    },
    {
      title: 'A default together with a check',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Amount',
        uidt: 'number',
        meta: { default: 0 },
        constraints: {
          check: {
            where: { all: [{ column: 'Amount', op: 'gte', value: 0 }] },
          },
        },
      },
      status: 422,
      response: fail(
        'validation_failed',
        'This column has a CHECK constraint. Its default value may fail the check rule. Remove the default value or the CHECK constraint to avoid check-violation errors.',
        [
          {
            field: 'meta.default',
            issue: "can't be combined with check",
          },
        ]
      ),
    },
    {
      title: 'A check that uses another column',
      description: 'For conditions over several columns use Add a constraint.',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'End date',
        uidt: 'date',
        constraints: {
          check: {
            where: {
              all: [{ column: 'Start date', op: 'lte', value: '2026-12-31' }],
            },
          },
        },
      },
      status: 422,
      response: fail('validation_failed', "A column's check can only use that column. Use POST /tables/{table}/constraints for conditions over several columns.", [
        { field: 'constraints.check.where', issue: 'uses "Start date"' },
      ]),
    },
    {
      title: 'A check without a condition',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Amount',
        uidt: 'number',
        constraints: { check: { category: 'number_date' } },
      },
      status: 422,
      response: fail('validation_failed', 'The check needs a condition.', [{ field: 'constraints.check.where', issue: 'is required' }]),
    },
    {
      title: 'A text operator on a number column',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Amount',
        uidt: 'number',
        constraints: {
          check: {
            where: { all: [{ column: 'Amount', op: 'contains', value: '1' }] },
          },
        },
      },
      status: 422,
      response: fail('validation_failed', 'The check condition is not valid.', [
        {
          field: 'constraints.check.where.all[0].op',
          issue: '"contains" works on text columns only',
        },
      ]),
    },
    {
      title: 'A value given to an operator that takes none',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Amount',
        uidt: 'number',
        constraints: {
          check: {
            where: { all: [{ column: 'Amount', op: 'is_not_null', value: 1 }] },
          },
        },
      },
      status: 422,
      response: fail('validation_failed', 'The check condition is not valid.', [
        {
          field: 'constraints.check.where.all[0].value',
          issue: '"is_not_null" takes no value',
        },
      ]),
    },
    {
      title: 'A link without a relation',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Customer', uidt: 'links' },
      status: 422,
      response: fail('validation_failed', 'A links column needs meta.relation with the linked table and the relation type.', [
        {
          field: 'meta.relation',
          issue: 'required: {"with": <table name or ID>, "type": "has-many" | "many-to-many" | "one-to-one"}',
        },
      ]),
    },
    {
      title: 'A link to a table that does not exist',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Customer',
        uidt: 'links',
        meta: { relation: { with: 'Clients', type: 'has-many' } },
      },
      status: 422,
      response: fail('validation_failed', "The linked table doesn't exist in this base.", [{ field: 'meta.relation.with', issue: 'No table named "Clients".' }]),
    },
    {
      title: 'A lookup that does not name a links column',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Customer email',
        uidt: 'lookup',
        meta: { link_column_id: 'Name', lookup_column_id: 'Email' },
      },
      status: 422,
      response: fail('validation_failed', 'A lookup column needs meta.link_column_id: a links column of this table.', [
        {
          field: 'meta.link_column_id',
          issue: 'must name a links column of this table',
        },
      ]),
    },
    {
      title: 'A formula column',
      description:
        'formula, attachment and user answer type_not_supported until the data API can use them. createdTime, lastModifiedTime, createdBy, lastModifiedBy and button are set by the system and cannot be created.',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: { title: 'Total', uidt: 'formula' },
      status: 422,
      response: fail('type_not_supported', 'The type "formula" can\'t be used through the API yet. Formula values are calculated in the app, and the data API doesn\'t read or write them yet.'),
    },
    {
      title: 'The table does not exist',
      method: 'POST',
      path: '/tables/Ghost/columns',
      body: { title: 'Code', uidt: 'text' },
      status: 404,
      response: fail('not_found', 'No table named "Ghost".'),
    },
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
          check: {
            category: 'text',
            where: { all: [{ column: 'Email', op: 'contains', value: '@' }] },
          },
        },
      },
      status: 201,
      response: ok({
        id: EMAIL_ID,
        name: 'Email',
        description: 'Customer email',
        type: 'email',
        uidt: 'email',
        dt: 'TEXT',
      }),
    },
    {
      title: 'A single select with choices',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Priority',
        uidt: 'select',
        meta: {
          options: [
            { option: 'Low', color: '#16a34a' },
            { option: 'High', color: '#dc2626' },
          ],
        },
      },
      status: 201,
      response: ok({
        id: NOTES_ID,
        name: 'Priority',
        type: 'single_select',
        uidt: 'select',
        dt: 'TEXT',
      }),
    },
    {
      title: 'A link to another table',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Customer',
        uidt: 'links',
        meta: { relation: { with: 'Customers', type: 'has-many' } },
      },
      status: 201,
      response: ok({
        id: 'fld_6f708192a3b44c53b4e5f6a7b8c9d0e1',
        name: 'Customer',
        type: 'links',
        uidt: 'links',
      }),
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
      body: {
        title: 'Code',
        uidt: 'text',
        meta: { default: 'n/a' },
        constraints: { unique: true },
      },
      status: 422,
      response: fail(
        'validation_failed',
        'This column has a UNIQUE constraint. Its default value may be duplicated when inserting multiple rows. Remove the default value or the UNIQUE constraint to avoid duplicate-value errors.',
        [
          {
            field: 'meta.default',
            issue: "can't be combined with unique",
          },
        ]
      ),
    },
    {
      title: 'Constraints on a link',
      method: 'POST',
      path: '/tables/Orders/columns',
      body: {
        title: 'Customer',
        uidt: 'links',
        meta: { relation: { with: 'Customers', type: 'has-many' } },
        constraints: { unique: true },
      },
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
    {
      name: 'dry_run',
      in: 'query',
      description: 'true: report what a type change would do, without changing anything.',
    },
    {
      name: 'title',
      in: 'body',
      description: 'Renames the column (name is an alias). It must not be used by another column of the table. The ID stays.',
    },
    {
      name: 'description',
      in: 'body',
      description: 'Replaces the description. An empty string clears it.',
    },
    {
      name: 'uidt',
      in: 'body',
      description: 'Changes the column type. Only the types listed for the current type are allowed; values that cannot be converted become empty.',
    },
    {
      name: 'meta',
      in: 'body',
      description: 'Settings of the type. They are merged into the current ones: send only what changes (for example the full options list of a select).',
    },
    {
      name: 'meta.default',
      in: 'body',
      description: 'Sets the default value. null removes it. Not together with a unique or check constraint.',
    },
    {
      name: 'meta.id_generation',
      in: 'body',
      description: 'uuid columns: {"mode", "version", "backfill"}. backfill: true fills the empty cells of existing records; it is an action and is not stored.',
    },
    {
      name: 'constraints.unique',
      in: 'body',
      description: 'true adds a unique constraint over this column; false drops the unique constraint that covers only this column.',
    },
    {
      name: 'constraints.check',
      in: 'body',
      description: 'Adds a check constraint with a condition over this column: {"category": optional, "where": condition}. The condition works as in Add a column: all / any / none groups of {"column", "op", "value"}, this column only. Existing data must already pass.',
    },
    {
      name: 'empty_first',
      in: 'body',
      description: 'Only with a type change: true empties the column before the change, as the app does, so nothing has to be converted.',
    },
  ],
  notes: [
    "meta is merged into the column's current meta. default and id_generation are part of meta, as when adding a column (they are not merged raw: default is stored as meta.defaultValue). unique and check go under constraints. id_generation.backfill fills the empty cells of a uuid column that becomes auto-generated.",
    'A type change works as in the app: the new type must be allowed for the current one, otherwise the answer is 409 conversion_not_allowed and lists the allowed types. Values that cannot be cast become empty.',
    'dry_run reports filled_values and, for number targets, values_lost (exact: true). For other targets exact is false and filled_values is the most that can be lost.',
    'A type change is refused when a check constraint uses the column, or when the new type cannot be part of a unique key.',
    'System columns (Id, Created Time and the like) cannot be changed: 403 system_column.',
  ],
  examples: [
    {
      title: 'Change only the description',
      method: 'PATCH',
      path: '/tables/Orders/columns/Email',
      body: { description: 'Where we send the invoice' },
      status: 200,
      response: ok({
        id: EMAIL_ID,
        name: 'Email',
        description: 'Where we send the invoice',
        type: 'email',
        uidt: 'email',
      }),
    },
    {
      title: 'Rename and describe in one call, column by ID',
      description: 'The column in the path can be its name or its fld_ ID. name is an alias of title.',
      method: 'PATCH',
      path: '/tables/Orders/columns/' + EMAIL_ID,
      body: { name: 'Billing email', description: 'Where we send the invoice' },
      status: 200,
      response: ok({
        id: EMAIL_ID,
        name: 'Billing email',
        description: 'Where we send the invoice',
        type: 'email',
        uidt: 'email',
      }),
    },
    {
      title: 'Add a choice to a select (meta is merged)',
      description: 'Send the full options list you want; the other settings of the column stay as they are.',
      method: 'PATCH',
      path: '/tables/Orders/columns/Priority',
      body: {
        meta: {
          options: [
            { option: 'Low', color: '#16a34a' },
            { option: 'Medium', color: '#f59e0b' },
            { option: 'High', color: '#dc2626' },
          ],
        },
      },
      status: 200,
      response: ok({
        id: NOTES_ID,
        name: 'Priority',
        type: 'single_select',
        uidt: 'select',
        meta: {
          options: [
            { option: 'Low', color: '#16a34a' },
            { option: 'Medium', color: '#f59e0b' },
            { option: 'High', color: '#dc2626' },
          ],
        },
      }),
    },
    {
      title: 'Change the precision of a decimal',
      method: 'PATCH',
      path: '/tables/Orders/columns/Weight%20(kg)',
      body: { meta: { precision: 3 } },
      status: 200,
      response: ok({
        id: fieldId(203),
        name: 'Weight (kg)',
        type: 'decimal',
        uidt: 'decimal',
        meta: { precision: 3 },
      }),
    },
    {
      title: 'Set a default value',
      method: 'PATCH',
      path: '/tables/Orders/columns/Currency%20code',
      body: { meta: { default: 'USD' } },
      status: 200,
      response: ok({
        id: fieldId(214),
        name: 'Currency code',
        type: 'text',
        uidt: 'text',
        meta: { defaultValue: 'USD' },
      }),
    },
    {
      title: 'Remove the default value',
      method: 'PATCH',
      path: '/tables/Orders/columns/Currency%20code',
      body: { meta: { default: null } },
      status: 200,
      response: ok({
        id: fieldId(214),
        name: 'Currency code',
        type: 'text',
        uidt: 'text',
      }),
    },
    {
      title: 'Make a uuid column auto-generated and fill the empty cells',
      method: 'PATCH',
      path: '/tables/Orders/columns/Public%20ID',
      body: {
        meta: { id_generation: { mode: 'auto', backfill: true } },
      },
      status: 200,
      response: ok({
        id: fieldId(212),
        name: 'Public ID',
        type: 'uuid',
        uidt: 'uuid',
        meta: { id_generation: { mode: 'auto' } },
      }),
    },
    {
      title: 'Make a column unique',
      method: 'PATCH',
      path: '/tables/Orders/columns/Invoice%20number',
      body: { constraints: { unique: true } },
      status: 200,
      response: ok({
        id: fieldId(215),
        name: 'Invoice number',
        type: 'text',
        uidt: 'text',
      }),
    },
    {
      title: 'Stop a column being unique',
      description: 'Drops the unique constraint that covers only this column. A key over several columns is not touched.',
      method: 'PATCH',
      path: '/tables/Orders/columns/Invoice%20number',
      body: { constraints: { unique: false } },
      status: 200,
      response: ok({
        id: fieldId(215),
        name: 'Invoice number',
        type: 'text',
        uidt: 'text',
      }),
    },
    {
      title: 'Add a check',
      method: 'PATCH',
      path: '/tables/Orders/columns/Discount',
      body: {
        constraints: {
          check: {
            category: 'number_date',
            where: {
              all: [
                { column: 'Discount', op: 'gte', value: 0 },
                { column: 'Discount', op: 'lte', value: 100 },
              ],
            },
          },
        },
      },
      status: 200,
      response: ok({
        id: fieldId(216),
        name: 'Discount',
        type: 'decimal',
        uidt: 'decimal',
      }),
    },
    {
      title: 'Rename, describe, change settings and constraints together',
      method: 'PATCH',
      path: '/tables/Orders/columns/Contact',
      body: {
        title: 'Contact email',
        description: 'Billing contact',
        meta: { emailValid: true },
        constraints: {
          unique: true,
          check: {
            category: 'text',
            where: {
              all: [{ column: 'Contact email', op: 'contains', value: '@' }],
            },
          },
        },
      },
      status: 200,
      response: ok({
        id: fieldId(207),
        name: 'Contact email',
        description: 'Billing contact',
        type: 'email',
        uidt: 'email',
        meta: { emailValid: true },
      }),
    },
    {
      title: 'Change the type',
      method: 'PATCH',
      path: '/tables/Orders/columns/Quantity',
      body: { uidt: 'decimal' },
      status: 200,
      response: ok({
        id: fieldId(217),
        name: 'Quantity',
        type: 'decimal',
        uidt: 'decimal',
      }),
    },
    {
      title: 'Change the type and the settings together',
      method: 'PATCH',
      path: '/tables/Orders/columns/Stage',
      body: {
        uidt: 'multiSelect',
        meta: { options: ['New', 'Packed', 'Sent'] },
      },
      status: 200,
      response: ok({
        id: fieldId(210),
        name: 'Stage',
        type: 'multi_select',
        uidt: 'multiSelect',
        meta: { options: ['New', 'Packed', 'Sent'] },
      }),
    },
    {
      title: 'Change the type after emptying the column',
      description: 'empty_first removes the values first, so nothing is converted. Use it when the old values are not worth keeping.',
      method: 'PATCH',
      path: '/tables/Orders/columns/Notes',
      body: { uidt: 'number', empty_first: true },
      status: 200,
      response: ok({
        id: NOTES_ID,
        name: 'Notes',
        type: 'number',
        uidt: 'number',
      }),
    },
    {
      title: 'Preview a type change to a text type',
      description: 'For targets that are not numbers the server cannot tell what would be lost: exact is false and filled_values is the most that could be.',
      method: 'PATCH',
      path: '/tables/Orders/columns/Notes?dry_run=true',
      body: { uidt: 'longText' },
      status: 200,
      response: ok({
        from: 'text',
        to: 'longtext',
        filled_values: 120,
        exact: false,
      }),
    },
    {
      title: 'dry_run without a type change',
      method: 'PATCH',
      path: '/tables/Orders/columns/Notes?dry_run=true',
      body: { title: 'Remarks' },
      status: 400,
      response: fail('bad_request', 'dry_run is for type changes: send uidt with a different type.'),
    },
    {
      title: 'empty_first without a type change',
      method: 'PATCH',
      path: '/tables/Orders/columns/Notes',
      body: { empty_first: true },
      status: 400,
      response: fail('bad_request', 'empty_first goes with a type change.'),
    },
    {
      title: 'The new name is taken',
      method: 'PATCH',
      path: '/tables/Orders/columns/Email',
      body: { title: 'Name' },
      status: 409,
      response: fail('conflict', 'This table already has a column named "Name".'),
    },
    {
      title: 'A link cannot change type',
      method: 'PATCH',
      path: '/tables/Orders/columns/Customer',
      body: { uidt: 'text' },
      status: 409,
      response: fail('conversion_not_allowed', "Links and lookups can't change type; delete the column and add a new one."),
    },
    {
      title: 'Constraints on a link',
      method: 'PATCH',
      path: '/tables/Orders/columns/Customer',
      body: { constraints: { unique: true } },
      status: 422,
      response: fail('validation_failed', 'Links and lookups take no constraints.'),
    },
    {
      title: 'id_generation on a column that is not uuid',
      method: 'PATCH',
      path: '/tables/Orders/columns/Email',
      body: { meta: { id_generation: { mode: 'auto' } } },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [
        {
          field: 'meta.id_generation',
          issue: 'only uuid columns can generate IDs',
        },
      ]),
    },
    {
      title: 'An unknown key',
      method: 'PATCH',
      path: '/tables/Orders/columns/Email',
      body: { position: 1 },
      status: 400,
      response: fail('bad_request', 'body: unknown key "position". Allowed: title, name, description, uidt, meta, constraints, empty_first.'),
    },
    {
      title: 'The column does not exist',
      method: 'PATCH',
      path: '/tables/Orders/columns/Nope',
      body: { title: 'Anything' },
      status: 404,
      response: fail('not_found', 'No column named "Nope".'),
    },
    {
      title: 'Rename',
      method: 'PATCH',
      path: '/tables/Orders/columns/Email',
      body: { title: 'Customer email' },
      status: 200,
      response: ok({
        id: EMAIL_ID,
        name: 'Customer email',
        type: 'email',
        uidt: 'email',
        dt: 'TEXT',
      }),
    },
    {
      title: 'Preview a type change',
      method: 'PATCH',
      path: '/tables/Orders/columns/Notes?dry_run=true',
      body: { uidt: 'number' },
      status: 200,
      response: ok({
        from: 'text',
        to: 'number',
        filled_values: 120,
        values_lost: 7,
        exact: true,
      }),
    },
    {
      title: 'A type change that is not allowed',
      method: 'PATCH',
      path: '/tables/Orders/columns/Paid',
      body: { uidt: 'date' },
      status: 409,
      response: fail('conversion_not_allowed', "A boolean column can't be changed to date.", [
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
  params: [
    TABLE,
    COLUMN,
    {
      name: 'force',
      in: 'query',
      description:
        'Optional. true deletes a column that holds data, together with its values. It does not override in_use: constraints and lookups that use the column must be removed first. This call has no body.',
    },
  ],
  examples: [
    {
      title: 'Delete a column that holds data (force)',
      description: 'The column and all its values are removed.',
      method: 'DELETE',
      path: '/tables/Orders/columns/Price?force=true',
      status: 200,
      response: ok({ id: fieldId(301), deleted: true }),
    },
    {
      title: 'Delete by ID',
      method: 'DELETE',
      path: '/tables/Orders/columns/' + NOTES_ID,
      status: 200,
      response: ok({ id: NOTES_ID, deleted: true }),
    },
    {
      title: 'A lookup uses the column',
      description: 'force does not help here: remove the lookup first.',
      method: 'DELETE',
      path: '/tables/Customers/columns/Email?force=true',
      status: 409,
      response: fail('in_use', '1 things use this column. Remove them first.', [
        {
          id: fieldId(221),
          field: 'Orders.Customer email',
          issue: 'lookup_column',
        },
      ]),
    },
    {
      title: 'A system column',
      method: 'DELETE',
      path: '/tables/Orders/columns/Created%20Time',
      status: 403,
      response: fail('system_column', '"Created Time" is a system column and can\'t be changed or deleted.'),
    },
    {
      title: 'The column does not exist',
      method: 'DELETE',
      path: '/tables/Orders/columns/Nope',
      status: 404,
      response: fail('not_found', 'No column named "Nope".'),
    },
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
        {
          id: CONSTRAINT_ID,
          field: 'Orders.Email is unique',
          issue: 'constraint',
        },
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
    {
      name: 'column',
      in: 'body',
      description: 'Required. The column to move, by name or fld_ ID. It cannot be a system column.',
    },
    {
      name: 'before',
      in: 'body',
      description: 'The column to put it in front of (name or ID). Send before or after, never both.',
    },
    {
      name: 'after',
      in: 'body',
      description: 'The column to put it behind (name or ID).',
    },
  ],
  examples: [
    {
      title: 'Move Email after Name, by IDs',
      method: 'POST',
      path: '/tables/Orders/columns/reorder',
      body: { column: EMAIL_ID, after: 'fld_1a2b3c4d5e6f47a8b9c0d1e2f3a4b5c6' },
      status: 200,
      response: ok([
        {
          id: 'fld_1a2b3c4d5e6f47a8b9c0d1e2f3a4b5c6',
          name: 'Name',
          type: 'text',
          uidt: 'text',
        },
        { id: EMAIL_ID, name: 'Email', type: 'email', uidt: 'email' },
      ]),
    },
    {
      title: 'Move Notes after Email',
      description: 'To make a column first, put it before the first column; to make it last, put it after the last one.',
      method: 'POST',
      path: '/tables/Orders/columns/reorder',
      body: { column: 'Notes', after: 'Email' },
      status: 200,
      response: ok([
        {
          id: 'fld_1a2b3c4d5e6f47a8b9c0d1e2f3a4b5c6',
          name: 'Name',
          type: 'text',
          uidt: 'text',
        },
        { id: EMAIL_ID, name: 'Email', type: 'email', uidt: 'email' },
        { id: NOTES_ID, name: 'Notes', type: 'long_text', uidt: 'longText' },
      ]),
    },
    {
      title: 'Both before and after',
      method: 'POST',
      path: '/tables/Orders/columns/reorder',
      body: { column: 'Email', before: 'Name', after: 'Notes' },
      status: 400,
      response: fail('bad_request', 'Send column and exactly one of before or after.'),
    },
    {
      title: 'column missing',
      method: 'POST',
      path: '/tables/Orders/columns/reorder',
      body: { before: 'Name' },
      status: 400,
      response: fail('bad_request', 'Send column and exactly one of before or after.'),
    },
    {
      title: 'Next to itself',
      method: 'POST',
      path: '/tables/Orders/columns/reorder',
      body: { column: 'Email', before: 'Email' },
      status: 400,
      response: fail('bad_request', "A column can't be moved next to itself."),
    },
    {
      title: 'A system column',
      method: 'POST',
      path: '/tables/Orders/columns/reorder',
      body: { column: 'Created Time', before: 'Name' },
      status: 403,
      response: fail('system_column', '"Created Time" is a system column and can\'t be changed or deleted.'),
    },
    {
      title: 'The target column does not exist',
      method: 'POST',
      path: '/tables/Orders/columns/reorder',
      body: { column: 'Email', before: 'Nope' },
      status: 404,
      response: fail('not_found', 'No column named "Nope".'),
    },
    {
      title: 'An unknown key',
      method: 'POST',
      path: '/tables/Orders/columns/reorder',
      body: { column: 'Email', to: 1 },
      status: 400,
      response: fail('bad_request', 'body: unknown key "to". Allowed: column, before, after.'),
    },
    {
      title: 'Move Email before Name',
      method: 'POST',
      path: '/tables/Orders/columns/reorder',
      body: { column: 'Email', before: 'Name' },
      status: 200,
      response: ok([
        { id: EMAIL_ID, name: 'Email', type: 'email', uidt: 'email' },
        {
          id: 'fld_1a2b3c4d5e6f47a8b9c0d1e2f3a4b5c6',
          name: 'Name',
          type: 'text',
          uidt: 'text',
        },
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
  params: [
    TABLE,
    {
      name: 'type',
      in: 'query',
      description: 'unique or check. Default: both.',
    },
  ],
  notes: ['status is ok, or missing when Postgres no longer has the constraint. For check constraints, condition is the SQL Postgres enforces.'],
  examples: [
    {
      title: 'Only unique constraints',
      method: 'GET',
      path: '/tables/Orders/constraints?type=unique',
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
      ]),
    },
    {
      title: 'Only check constraints',
      method: 'GET',
      path: '/tables/Orders/constraints?type=check',
      status: 200,
      response: ok([
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
    {
      title: 'A table without constraints',
      method: 'GET',
      path: '/tables/Suppliers/constraints',
      status: 200,
      response: ok([]),
    },
    {
      title: 'A constraint Postgres no longer has',
      description: 'status is missing when the constraint was dropped outside the API.',
      method: 'GET',
      path: '/tables/Orders/constraints?type=unique',
      status: 200,
      response: ok([
        {
          id: CONSTRAINT_ID,
          name: 'Email is unique',
          type: 'unique',
          constraint_name: 'uq_orders_email',
          status: 'missing',
          columns: [{ id: EMAIL_ID, name: 'Email' }],
        },
      ]),
    },
    {
      title: 'An unknown type filter',
      method: 'GET',
      path: '/tables/Orders/constraints?type=primary',
      status: 400,
      response: fail('bad_request', 'type must be unique or check.'),
    },
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
  params: [
    TABLE,
    {
      name: 'title',
      in: 'body',
      description: 'Required. A name for the constraint, shown in the app and in the message when a record write breaks it. name is an alias.',
    },
    {
      name: 'type',
      in: 'body',
      description: 'Required. unique (no two records share the values of the columns) or check (every record satisfies a condition).',
    },
    {
      name: 'columns',
      in: 'body',
      description: 'Array of column names or fld_ IDs. Required for unique, in key order. For check it is optional: the columns the condition uses are taken.',
    },
    {
      name: 'check.where',
      in: 'body',
      description:
        'Required for check. The condition, as JSON: a group with exactly one key, all (every item true), any (at least one true) or none (no item true), holding a non-empty array of conditions {"column", "op", "value"} or nested groups. Unlike the check of a single column, it can use several columns.',
    },
    {
      name: 'check.category',
      in: 'body',
      description: 'Optional label of the kind of rule (for example text or number_date). Default custom. It only groups the rule in the app.',
    },
    IDEMPOTENCY,
  ],
  notes: [
    'unique needs columns. check needs check.where, a condition tree like the where filter of Find records, with {"column", "op", "value"} conditions. The columns the condition uses become the constraint\'s columns when you do not name any.',
    'Conditions are compiled on the server: column names must exist in the table, values become escaped literals, and SQL text is never accepted. At most 50 conditions, nested 5 deep. all is AND, any is OR, none is NOT (a OR b).',
    'A condition has column (a name or fld_ ID), op and, for most operators, value; no other keys. Links and lookups can not be used.',
    'Operators for any column: eq, neq, gt, gte, lt, lte (value: a string, number or true/false), in (value: an array of 1 to 100 such values), is_null and is_not_null (no value). For text columns only: contains, starts_with, ends_with (value: a string; %, _ and \\ match themselves) and not_empty (no value; not null and not blank).',
    'is_null, is_not_null and not_empty refuse a value; every other operator requires one. Existing records must already pass, otherwise nothing is added and the answer is 422. A wrong part is named by its path in details, for example check.where.all[1].op.',
    "When a record write later breaks a constraint, the records endpoints answer 422 with the constraint's title.",
  ],
  examples: [
    {
      title: 'Unique on one column, with name instead of title',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: {
        name: 'Invoice numbers are unique',
        type: 'unique',
        columns: ['Invoice number'],
      },
      status: 201,
      response: ok({
        id: CONSTRAINT_ID,
        name: 'Invoice numbers are unique',
        type: 'unique',
        constraint_name: 'uq_orders_invoice_number',
        status: 'ok',
        columns: [{ id: fieldId(215), name: 'Invoice number' }],
      }),
    },
    {
      title: 'Unique over columns given by ID',
      method: 'POST',
      path: '/tables/Products/constraints',
      body: {
        title: 'One SKU per region',
        type: 'unique',
        columns: ['fld_a0b1c2d3e4f541a2b3c4d5e6f7a8b9c0', 'fld_b1c2d3e4f5a642b3c4d5e6f7a8b9c0d1'],
      },
      status: 201,
      response: ok({
        id: CONSTRAINT_ID,
        name: 'One SKU per region',
        type: 'unique',
        constraint_name: 'uq_products_sku_region',
        status: 'ok',
        columns: [
          { id: 'fld_a0b1c2d3e4f541a2b3c4d5e6f7a8b9c0', name: 'SKU' },
          { id: 'fld_b1c2d3e4f5a642b3c4d5e6f7a8b9c0d1', name: 'Region' },
        ],
      }),
    },
    {
      title: 'A check over one column: the columns are taken from the condition',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: {
        title: 'Quantity between 1 and 100',
        type: 'check',
        check: {
          category: 'number_date',
          where: {
            all: [
              { column: 'Quantity', op: 'gte', value: 1 },
              { column: 'Quantity', op: 'lte', value: 100 },
            ],
          },
        },
      },
      status: 201,
      response: ok({
        id: 'con_8f9a0b1c2d3e44f5a6b7c8d9e0f1a2b3',
        name: 'Quantity between 1 and 100',
        type: 'check',
        constraint_name: 'ck_orders_quantity',
        status: 'ok',
        category: 'number_date',
        condition: '(quantity_5 >= 1 AND quantity_5 <= 100)',
        columns: [{ id: fieldId(217), name: 'Quantity' }],
      }),
    },
    {
      title: 'A check over several columns',
      description: 'A condition compares a column with a value, never two columns with each other. It can use several columns, and every column it uses becomes a column of the constraint.',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: {
        title: 'End date needs a start date',
        type: 'check',
        columns: ['Start date', 'End date'],
        check: {
          category: 'custom',
          where: {
            any: [
              { column: 'End date', op: 'is_null' },
              { column: 'Start date', op: 'is_not_null' },
            ],
          },
        },
      },
      status: 201,
      response: ok({
        id: 'con_9a0b1c2d3e4f45a6b7c8d9e0f1a2b3c4',
        name: 'End date needs a start date',
        type: 'check',
        constraint_name: 'ck_orders_dates',
        status: 'ok',
        category: 'custom',
        condition: '(end_date_6 IS NULL OR start_date_7 IS NOT NULL)',
        columns: [
          { id: fieldId(231), name: 'Start date' },
          { id: fieldId(232), name: 'End date' },
        ],
      }),
    },
    {
      title: 'A check with in, none and a text operator',
      description: 'none means NOT (a OR b): the status may be neither of the listed values.',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: {
        title: 'Open orders have a code',
        type: 'check',
        check: {
          category: 'text',
          where: {
            all: [
              { column: 'Status', op: 'in', value: ['open', 'paid'] },
              {
                none: [
                  { column: 'Order code', op: 'is_null' },
                  { column: 'Order code', op: 'ends_with', value: '-TEST' },
                ],
              },
            ],
          },
        },
      },
      status: 201,
      response: ok({
        id: 'con_0b1c2d3e4f5a46b7c8d9e0f1a2b3c4d5',
        name: 'Open orders have a code',
        type: 'check',
        constraint_name: 'ck_orders_open_code',
        status: 'ok',
        category: 'text',
        condition: "(status_4 IN ('open', 'paid') AND NOT (order_code_8 IS NULL OR order_code_8 LIKE '%-TEST'))",
        columns: [
          { id: fieldId(233), name: 'Status' },
          { id: fieldId(234), name: 'Order code' },
        ],
      }),
    },
    {
      title: 'With an Idempotency-Key',
      method: 'POST',
      path: '/tables/Orders/constraints',
      headers: { 'Idempotency-Key': 'unique-invoice-1' },
      body: {
        title: 'Invoice numbers are unique',
        type: 'unique',
        columns: ['Invoice number'],
      },
      status: 201,
      response: ok({
        id: CONSTRAINT_ID,
        name: 'Invoice numbers are unique',
        type: 'unique',
        constraint_name: 'uq_orders_invoice_number',
        status: 'ok',
        columns: [{ id: fieldId(215), name: 'Invoice number' }],
      }),
    },
    {
      title: 'Title and type missing',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: { columns: ['Email'] },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [
        { field: 'title', issue: 'is required' },
        { field: 'type', issue: 'must be unique or check' },
      ]),
    },
    {
      title: 'A unique constraint without columns',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: { title: 'Unique', type: 'unique' },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [
        {
          field: 'columns',
          issue: 'a unique constraint needs at least one column',
        },
      ]),
    },
    {
      title: 'A column that does not exist in columns',
      method: 'POST',
      path: '/tables/Products/constraints',
      body: {
        title: 'One SKU per region',
        type: 'unique',
        columns: ['SKU', 'Regon'],
      },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [{ field: 'columns[1]', issue: 'No column named "Regon".' }]),
    },
    {
      title: 'columns is not an array',
      method: 'POST',
      path: '/tables/Products/constraints',
      body: { title: 'One SKU', type: 'unique', columns: 'SKU' },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [{ field: 'columns', issue: 'must be an array of column names or IDs' }]),
    },
    {
      title: 'A check without a condition',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: { title: 'Rule', type: 'check' },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [{ field: 'check', issue: 'a check constraint needs a check condition' }]),
    },
    {
      title: 'check without where',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: { title: 'Rule', type: 'check', check: { category: 'text' } },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [
        {
          field: 'check.where',
          issue: 'is required: a condition like {"all": [{"column": "Age", "op": "gte", "value": 18}]}',
        },
      ]),
    },
    {
      title: 'An unknown operator',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: {
        title: 'Rule',
        type: 'check',
        check: {
          where: { all: [{ column: 'Price', op: 'between', value: [1, 5] }] },
        },
      },
      status: 422,
      response: fail('validation_failed', 'The check condition is not valid.', [
        {
          field: 'where.all[0].op',
          issue: 'unknown operator; allowed: eq, neq, gt, gte, lt, lte, in, contains, starts_with, ends_with, is_null, is_not_null, not_empty',
        },
      ]),
    },
    {
      title: 'A group with two keys',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: {
        title: 'Rule',
        type: 'check',
        check: {
          where: {
            all: [{ column: 'Price', op: 'gte', value: 0 }],
            any: [{ column: 'Price', op: 'lte', value: 9 }],
          },
        },
      },
      status: 422,
      response: fail('validation_failed', 'The check condition is not valid.', [{ field: 'where', issue: 'a group has one of all, any or none' }]),
    },
    {
      title: 'A condition without a value',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: {
        title: 'Rule',
        type: 'check',
        check: { where: { all: [{ column: 'Price', op: 'gte' }] } },
      },
      status: 422,
      response: fail('validation_failed', 'The check condition is not valid.', [{ field: 'where.all[0].value', issue: 'is required' }]),
    },
    {
      title: 'in with an empty list',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: {
        title: 'Rule',
        type: 'check',
        check: { where: { all: [{ column: 'Status', op: 'in', value: [] }] } },
      },
      status: 422,
      response: fail('validation_failed', 'The check condition is not valid.', [
        {
          field: 'where.all[0].value',
          issue: 'must be an array of 1 to 100 values',
        },
      ]),
    },
    {
      title: 'A condition on a link',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: {
        title: 'Rule',
        type: 'check',
        check: { where: { all: [{ column: 'Customer', op: 'is_not_null' }] } },
      },
      status: 422,
      response: fail('validation_failed', 'The check condition is not valid.', [
        {
          field: 'where.all[0].column',
          issue: 'links and lookups have no value of their own to check',
        },
      ]),
    },
    {
      title: 'An unknown key',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: {
        title: 'Unique',
        type: 'unique',
        columns: ['Email'],
        enforce: true,
      },
      status: 400,
      response: fail('bad_request', 'body: unknown key "enforce". Allowed: title, name, type, columns, check.'),
    },
    {
      title: 'Unique over two columns',
      method: 'POST',
      path: '/tables/Products/constraints',
      body: {
        title: 'One SKU per region',
        type: 'unique',
        columns: ['SKU', 'Region'],
      },
      status: 201,
      response: ok({
        id: CONSTRAINT_ID,
        name: 'One SKU per region',
        type: 'unique',
        constraint_name: 'uq_products_sku_region',
        status: 'ok',
        columns: [
          { id: 'fld_a0b1c2d3e4f541a2b3c4d5e6f7a8b9c0', name: 'SKU' },
          { id: 'fld_b1c2d3e4f5a642b3c4d5e6f7a8b9c0d1', name: 'Region' },
        ],
      }),
    },
    {
      title: 'A check: price is not negative',
      method: 'POST',
      path: '/tables/Orders/constraints',
      body: {
        title: 'Price is not negative',
        type: 'check',
        check: {
          category: 'number_date',
          where: { all: [{ column: 'Price', op: 'gte', value: 0 }] },
        },
      },
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
      body: {
        title: 'Bad',
        type: 'check',
        check: { where: { all: [{ column: 'Prise', op: 'gte', value: 0 }] } },
      },
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
  params: [
    TABLE,
    {
      name: 'type',
      in: 'body',
      description: 'unique or check. Default: unique.',
    },
    {
      name: 'columns',
      in: 'body',
      description: 'unique: the columns to test, by name or fld_ ID.',
    },
    {
      name: 'check.where',
      in: 'body',
      description: 'check: the condition to test, same shape as in Add a constraint.',
    },
    {
      name: 'check.category',
      in: 'body',
      description: 'Optional label; it does not change the result.',
    },
  ],
  notes: ['Nothing is changed. title is not needed here.'],
  examples: [
    {
      title: 'Without a type: unique is assumed',
      method: 'POST',
      path: '/tables/Orders/constraints/check',
      body: { columns: ['Invoice number'] },
      status: 200,
      response: ok({ valid: true }),
    },
    {
      title: 'Would a key of two columns be unique?',
      method: 'POST',
      path: '/tables/Products/constraints/check',
      body: { type: 'unique', columns: ['SKU', 'Region'] },
      status: 200,
      response: ok({ valid: true }),
    },
    {
      title: 'A check every record already satisfies',
      method: 'POST',
      path: '/tables/Orders/constraints/check',
      body: {
        type: 'check',
        check: {
          category: 'number_date',
          where: {
            all: [
              { column: 'Price', op: 'gte', value: 0 },
              { column: 'Price', op: 'lte', value: 100000 },
            ],
          },
        },
      },
      status: 200,
      response: ok({ valid: true }),
    },
    {
      title: 'A check with a text operator and columns named',
      method: 'POST',
      path: '/tables/Orders/constraints/check',
      body: {
        type: 'check',
        columns: ['Email'],
        check: {
          category: 'text',
          where: { all: [{ column: 'Email', op: 'contains', value: '@' }] },
        },
      },
      status: 200,
      response: ok({ valid: true }),
    },
    {
      title: 'A condition that is not valid',
      method: 'POST',
      path: '/tables/Orders/constraints/check',
      body: {
        type: 'check',
        check: { where: { all: [{ column: 'Prise', op: 'gte', value: 0 }] } },
      },
      status: 422,
      response: fail('validation_failed', 'The check condition is not valid.', [{ field: 'where.all[0].column', issue: 'No column named "Prise".' }]),
    },
    {
      title: 'A type that is neither unique nor check',
      method: 'POST',
      path: '/tables/Orders/constraints/check',
      body: { type: 'primary', columns: ['Name'] },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [{ field: 'type', issue: 'must be unique or check' }]),
    },
    {
      title: 'A column that does not exist',
      method: 'POST',
      path: '/tables/Orders/constraints/check',
      body: { type: 'unique', columns: ['Nmae'] },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [{ field: 'columns[0]', issue: 'No column named "Nmae".' }]),
    },
    {
      title: 'Would this key be unique?',
      method: 'POST',
      path: '/tables/Orders/constraints/check',
      body: { type: 'unique', columns: ['Name'] },
      status: 200,
      response: ok({
        valid: false,
        message: 'Duplicate data in column "Name". Remove the duplicates and try again.',
      }),
    },
    {
      title: 'How many records break the condition?',
      method: 'POST',
      path: '/tables/Orders/constraints/check',
      body: {
        type: 'check',
        check: { where: { all: [{ column: 'Price', op: 'gte', value: 0 }] } },
      },
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
  params: [
    TABLE,
    {
      name: 'constraint',
      in: 'path',
      description: 'Constraint title or ID (con_…).',
    },
    {
      name: 'title',
      in: 'body',
      description: 'Renames the constraint. Leave it out to keep the name.',
    },
    {
      name: 'columns',
      in: 'body',
      description: 'unique: the new key columns, by name or ID.',
    },
    {
      name: 'check.where',
      in: 'body',
      description: 'check: the new condition. Required when the constraint is a check.',
    },
    {
      name: 'check.category',
      in: 'body',
      description: 'check: the new label.',
    },
  ],
  notes: ['type cannot be sent: a unique constraint stays unique and a check stays a check.'],
  examples: [
    {
      title: 'Only rename a unique constraint',
      method: 'PUT',
      path: '/tables/Orders/constraints/Email%20is%20unique',
      body: { title: 'One order per email' },
      status: 200,
      response: ok({
        id: CONSTRAINT_ID,
        name: 'One order per email',
        type: 'unique',
        constraint_name: 'uq_orders_email',
        status: 'ok',
        columns: [{ id: EMAIL_ID, name: 'Email' }],
      }),
    },
    {
      title: 'Change the columns of a unique constraint, addressed by ID',
      method: 'PUT',
      path: '/tables/Orders/constraints/' + CONSTRAINT_ID,
      body: { columns: ['Email', 'Name'] },
      status: 200,
      response: ok({
        id: CONSTRAINT_ID,
        name: 'Email is unique',
        type: 'unique',
        constraint_name: 'uq_orders_email',
        status: 'ok',
        columns: [
          { id: EMAIL_ID, name: 'Email' },
          { id: 'fld_1a2b3c4d5e6f47a8b9c0d1e2f3a4b5c6', name: 'Name' },
        ],
      }),
    },
    {
      title: 'Rename and change the columns together',
      method: 'PUT',
      path: '/tables/Orders/constraints/Email%20is%20unique',
      body: {
        title: 'One order per customer and day',
        columns: ['Email', 'Order date'],
      },
      status: 200,
      response: ok({
        id: CONSTRAINT_ID,
        name: 'One order per customer and day',
        type: 'unique',
        constraint_name: 'uq_orders_email',
        status: 'ok',
        columns: [
          { id: EMAIL_ID, name: 'Email' },
          { id: fieldId(241), name: 'Order date' },
        ],
      }),
    },
    {
      title: 'Rename a check and change its category',
      description: 'A check always needs its condition in the request, also when only the name changes.',
      method: 'PUT',
      path: '/tables/Orders/constraints/Price%20is%20positive',
      body: {
        title: 'Price above zero',
        check: {
          category: 'number_date',
          where: { all: [{ column: 'Price', op: 'gt', value: 0 }] },
        },
      },
      status: 200,
      response: ok({
        id: 'con_7e8f9a0b1c2d43e4f5a6b7c8d9e0f1a2',
        name: 'Price above zero',
        type: 'check',
        constraint_name: 'ck_orders_price',
        status: 'ok',
        category: 'number_date',
        condition: '(price_3 > 0)',
        columns: [{ id: 'fld_3c4d5e6f7081492081b2c3d4e5f6a7b8', name: 'Price' }],
      }),
    },
    {
      title: 'A check without its condition',
      method: 'PUT',
      path: '/tables/Orders/constraints/Price%20is%20positive',
      body: { title: 'Price above zero' },
      status: 422,
      response: fail('validation_failed', 'A check constraint needs a check condition.', [{ field: 'check', issue: 'is required' }]),
    },
    {
      title: 'A condition that is not valid',
      method: 'PUT',
      path: '/tables/Orders/constraints/Price%20is%20positive',
      body: { check: { where: { all: [{ column: 'Price', op: 'gt' }] } } },
      status: 422,
      response: fail('validation_failed', 'The check condition is not valid.', [{ field: 'where.all[0].value', issue: 'is required' }]),
    },
    {
      title: 'Columns that do not exist',
      method: 'PUT',
      path: '/tables/Orders/constraints/Email%20is%20unique',
      body: { columns: ['Emial'] },
      status: 422,
      response: fail('validation_failed', 'Some fields are not valid.', [{ field: 'columns[0]', issue: 'No column named "Emial".' }]),
    },
    {
      title: 'Two constraints have the same title',
      description: 'Use the ID of the one you mean.',
      method: 'PUT',
      path: '/tables/Orders/constraints/Rule',
      body: { title: 'Rule 2' },
      status: 409,
      response: fail('ambiguous_name', '2 constraints are named "Rule". Use one of their IDs instead.', [
        { id: 'con_1c2d3e4f5a6b47c8d9e0f1a2b3c4d5e6' },
        { id: 'con_2d3e4f5a6b7c48d9e0f1a2b3c4d5e6f7' },
      ]),
    },
    {
      title: 'The constraint does not exist',
      method: 'PUT',
      path: '/tables/Orders/constraints/Nope',
      body: { title: 'Anything' },
      status: 404,
      response: fail('not_found', 'No constraint "Nope" on this table.'),
    },
    {
      title: 'An unknown key',
      method: 'PUT',
      path: '/tables/Orders/constraints/Email%20is%20unique',
      body: { title: 'One order per email', enforce: true },
      status: 400,
      response: fail('bad_request', 'body: unknown key "enforce". Allowed: title, name, type, columns, check.'),
    },
    {
      title: 'Change the condition',
      method: 'PUT',
      path: '/tables/Orders/constraints/Price%20is%20not%20negative',
      body: {
        title: 'Price is positive',
        check: { where: { all: [{ column: 'Price', op: 'gt', value: 0 }] } },
      },
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
      response: fail('validation_failed', 'Some fields are not valid.', [
        {
          field: 'type',
          issue: "can't be changed; delete the constraint and add a new one",
        },
      ]),
    },
  ],
};

const DELETE_CONSTRAINT: DocEndpoint = {
  id: 'delete-constraint',
  title: 'Drop a constraint',
  method: 'DELETE',
  path: '/tables/{table}/constraints/{constraint}',
  summary: 'Drops the constraint in Postgres and removes it.',
  params: [
    TABLE,
    {
      name: 'constraint',
      in: 'path',
      description: 'Constraint title or ID (con_…).',
    },
  ],
  examples: [
    {
      title: 'Drop by ID',
      method: 'DELETE',
      path: '/tables/Orders/constraints/' + CONSTRAINT_ID,
      status: 200,
      response: ok({ id: CONSTRAINT_ID, deleted: true }),
    },
    {
      title: 'Two constraints have the same title',
      method: 'DELETE',
      path: '/tables/Orders/constraints/Rule',
      status: 409,
      response: fail('ambiguous_name', '2 constraints are named "Rule". Use one of their IDs instead.', [
        { id: 'con_1c2d3e4f5a6b47c8d9e0f1a2b3c4d5e6' },
        { id: 'con_2d3e4f5a6b7c48d9e0f1a2b3c4d5e6f7' },
      ]),
    },
    {
      title: 'The constraint does not exist',
      method: 'DELETE',
      path: '/tables/Orders/constraints/Nope',
      status: 404,
      response: fail('not_found', 'No constraint "Nope" on this table.'),
    },
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
      title: 'A table by ID',
      method: 'GET',
      path: '/tables/' + ORDERS_ID + '/primary-key',
      status: 200,
      response: ok({
        columns: [{ id: fieldId(401), name: 'id', column_name: 'id' }],
        candidates: [
          { id: fieldId(401), name: 'Id', in_key: true, eligible: true },
          { id: EMAIL_ID, name: 'Email', in_key: false, eligible: true },
        ],
      }),
    },
    {
      title: 'The table does not exist',
      method: 'GET',
      path: '/tables/Ghost/primary-key',
      status: 404,
      response: fail('not_found', 'No table named "Ghost".'),
    },
    {
      title: 'The key of Products',
      method: 'GET',
      path: '/tables/Products/primary-key',
      status: 200,
      response: ok({
        columns: [
          {
            id: 'fld_a0b1c2d3e4f541a2b3c4d5e6f7a8b9c0',
            name: 'sku_1762170011',
            column_name: 'sku_1762170011',
          },
        ],
        candidates: [
          {
            id: 'fld_a0b1c2d3e4f541a2b3c4d5e6f7a8b9c0',
            name: 'SKU',
            in_key: true,
            eligible: true,
          },
          {
            id: 'fld_c2d3e4f5a6b743c4d5e6f7a8b9c0d1e2',
            name: 'Attachments',
            in_key: false,
            eligible: false,
            reason: "attachment fields can't be part of a key",
          },
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
  params: [
    TABLE,
    {
      name: 'columns',
      in: 'body',
      description: 'Required. Non-empty array of the key columns, by name or fld_ ID, in key order. Together they identify one record, so the existing records must already be unique on them.',
    },
  ],
  examples: [
    {
      title: 'A key of one column, by ID',
      method: 'PUT',
      path: '/tables/Products/primary-key',
      body: { columns: ['fld_a0b1c2d3e4f541a2b3c4d5e6f7a8b9c0'] },
      status: 200,
      response: ok({
        columns: [
          {
            id: 'fld_a0b1c2d3e4f541a2b3c4d5e6f7a8b9c0',
            name: 'sku_1762170011',
            column_name: 'sku_1762170011',
          },
        ],
        candidates: [],
      }),
    },
    {
      title: 'Names and IDs mixed, in key order',
      description: 'The order of columns is the order of the key.',
      method: 'PUT',
      path: '/tables/' + ORDERS_ID + '/primary-key',
      body: { columns: ['Region', 'fld_a0b1c2d3e4f541a2b3c4d5e6f7a8b9c0'] },
      status: 200,
      response: ok({
        columns: [
          {
            id: 'fld_b1c2d3e4f5a642b3c4d5e6f7a8b9c0d1',
            name: 'region_1762170019',
            column_name: 'region_1762170019',
          },
          {
            id: 'fld_a0b1c2d3e4f541a2b3c4d5e6f7a8b9c0',
            name: 'sku_1762170011',
            column_name: 'sku_1762170011',
          },
        ],
        candidates: [],
      }),
    },
    {
      title: 'An empty list',
      method: 'PUT',
      path: '/tables/Products/primary-key',
      body: { columns: [] },
      status: 400,
      response: fail('bad_request', 'columns must be a non-empty array of column names or IDs.'),
    },
    {
      title: 'columns is not an array',
      method: 'PUT',
      path: '/tables/Products/primary-key',
      body: { columns: 'SKU' },
      status: 400,
      response: fail('bad_request', 'columns must be a non-empty array of column names or IDs.'),
    },
    {
      title: 'Several columns that do not exist',
      method: 'PUT',
      path: '/tables/Products/primary-key',
      body: { columns: ['Sku', 'SKU', 'Regon'] },
      status: 422,
      response: fail('validation_failed', "Some columns don't exist.", [
        { field: 'columns[0]', issue: 'No column named "Sku".' },
        { field: 'columns[2]', issue: 'No column named "Regon".' },
      ]),
    },
    {
      title: 'An unknown key',
      method: 'PUT',
      path: '/tables/Products/primary-key',
      body: { columns: ['SKU'], unique: true },
      status: 400,
      response: fail('bad_request', 'body: unknown key "unique". Allowed: columns.'),
    },
    {
      title: 'A key of two columns',
      method: 'PUT',
      path: '/tables/Products/primary-key',
      body: { columns: ['SKU', 'Region'] },
      status: 200,
      response: ok({
        columns: [
          {
            id: 'fld_a0b1c2d3e4f541a2b3c4d5e6f7a8b9c0',
            name: 'sku_1762170011',
            column_name: 'sku_1762170011',
          },
          {
            id: 'fld_b1c2d3e4f5a642b3c4d5e6f7a8b9c0d1',
            name: 'region_1762170019',
            column_name: 'region_1762170019',
          },
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
      response: fail('validation_failed', "Some columns don't exist.", [{ field: 'columns[0]', issue: 'No column named "Sku".' }]),
    },
  ],
};

export const MANAGEMENT_GROUPS: DocGroup[] = [
  {
    id: 'manage-tables',
    title: 'Manage tables',
    endpoints: [CREATE_TABLE, UPDATE_TABLE, DELETE_TABLE],
  },
  {
    id: 'manage-columns',
    title: 'Manage columns',
    endpoints: [CREATE_COLUMN, UPDATE_COLUMN, DELETE_COLUMN, REORDER_COLUMN],
  },
  {
    id: 'manage-constraints',
    title: 'Manage constraints',
    endpoints: [LIST_CONSTRAINTS, CREATE_CONSTRAINT, CHECK_CONSTRAINT, UPDATE_CONSTRAINT, DELETE_CONSTRAINT],
  },
  {
    id: 'manage-primary-key',
    title: 'Primary key',
    endpoints: [GET_PRIMARY_KEY, SET_PRIMARY_KEY],
  },
];

export const MANAGEMENT_SUMMARY: {
  method: DocEndpoint['method'];
  path: string;
  does: string;
}[] = [
  {
    method: 'POST',
    path: '/tables',
    does: 'Create a table, optionally with columns',
  },
  {
    method: 'PATCH',
    path: '/tables/{table}',
    does: 'Rename a table or change its description',
  },
  {
    method: 'DELETE',
    path: '/tables/{table}',
    does: 'Delete a table (?force=true when other tables link to it)',
  },
  {
    method: 'POST',
    path: '/tables/{table}/columns',
    does: 'Add a column, with optional constraints',
  },
  {
    method: 'PATCH',
    path: '/tables/{table}/columns/{column}',
    does: 'Rename a column, change its options or type (?dry_run=true previews)',
  },
  {
    method: 'DELETE',
    path: '/tables/{table}/columns/{column}',
    does: 'Delete a column (?force=true when it holds data)',
  },
  {
    method: 'POST',
    path: '/tables/{table}/columns/reorder',
    does: 'Move a column before or after another',
  },
  {
    method: 'GET',
    path: '/tables/{table}/constraints',
    does: 'List unique and check constraints',
  },
  {
    method: 'POST',
    path: '/tables/{table}/constraints',
    does: 'Add a unique or check constraint',
  },
  {
    method: 'POST',
    path: '/tables/{table}/constraints/check',
    does: 'Dry run a constraint',
  },
  {
    method: 'PUT',
    path: '/tables/{table}/constraints/{constraint}',
    does: 'Change a constraint',
  },
  {
    method: 'DELETE',
    path: '/tables/{table}/constraints/{constraint}',
    does: 'Drop a constraint',
  },
  {
    method: 'GET',
    path: '/tables/{table}/primary-key',
    does: 'Show the primary key',
  },
  {
    method: 'PUT',
    path: '/tables/{table}/primary-key',
    does: 'Set the primary key',
  },
];

export const MANAGEMENT_ERROR_CODES: {
  code: string;
  status: number;
  when: string;
}[] = [
  {
    code: 'feature_disabled',
    status: 403,
    when: 'Base management is off for this base; an owner or co-owner turns it on in Developer settings',
  },
  {
    code: 'system_column',
    status: 403,
    when: 'System columns cannot be changed, moved or deleted',
  },
  {
    code: 'in_use',
    status: 409,
    when: 'Other tables, constraints or lookups depend on what you are deleting; details lists them',
  },
  {
    code: 'conversion_not_allowed',
    status: 409,
    when: 'The type change is not allowed for this column; details lists the allowed types',
  },
  {
    code: 'type_not_supported',
    status: 422,
    when: 'formula, attachment and user columns cannot be created through the API yet',
  },
  {
    code: 'unavailable',
    status: 503,
    when: 'Another schema change on this base is still running; try again after Retry-After',
  },
];

// ---- Column types: what each uidt is for, the meta it takes, and which ones the API refuses ----

export interface ColumnTypeDoc {
  uidt: string;
  // The name the API shows in column and field listings
  apiType: string;
  purpose: string;
  // What goes into meta when you add this type yourself; 'None' when nothing is needed
  meta: string;
  // The body of Add a column (or one item of columns when creating a table)
  example: Record<string, unknown>;
  // constraints that make sense for the type
  constraints: string;
  // Types an existing column of this type can be changed to (Change a column)
  changeTo: string;
}

const TEXT_TARGETS = 'longText, number, decimal, currency, percent, rating, year, date, datetime, time, email, phoneNumber, url, select, multiSelect, boolean, json, uuid, duration';
const STD_CONSTRAINTS = 'default, unique, check';

export const COLUMN_TYPES: ColumnTypeDoc[] = [
  {
    uidt: 'text',
    apiType: 'text',
    purpose: 'A short, one-line text: names, codes, references.',
    meta: 'None.',
    example: { title: 'Reference', uidt: 'text' },
    constraints: STD_CONSTRAINTS,
    changeTo: TEXT_TARGETS,
  },
  {
    uidt: 'longText',
    apiType: 'long_text',
    purpose: 'Text over several lines: notes, descriptions, comments.',
    meta: 'None.',
    example: { title: 'Notes', uidt: 'longText' },
    constraints: STD_CONSTRAINTS,
    changeTo: 'text, json (when the text is JSON), uuid',
  },
  {
    uidt: 'number',
    apiType: 'number',
    purpose: 'A whole number: quantities, counts, ages.',
    meta: 'None.',
    example: { title: 'Quantity', uidt: 'number' },
    constraints: STD_CONSTRAINTS,
    changeTo: 'text, longText, decimal, currency, percent, rating, year',
  },
  {
    uidt: 'decimal',
    apiType: 'decimal',
    purpose: 'A number with decimals: weights, measurements, rates.',
    meta: 'Optional precision: the number of decimal places (2) or the app\'s pattern ("1.00" is two places). Without it, values keep all their decimals.',
    example: { title: 'Weight (kg)', uidt: 'decimal', meta: { precision: 2 } },
    constraints: STD_CONSTRAINTS,
    changeTo: 'text, longText, number (when every value is a whole number), currency, percent',
  },
  {
    uidt: 'currency',
    apiType: 'currency',
    purpose: 'An amount of money. Stored like a decimal.',
    meta: 'None.',
    example: { title: 'Price', uidt: 'currency' },
    constraints: STD_CONSTRAINTS,
    changeTo: 'text, longText, decimal, number, percent',
  },
  {
    uidt: 'percent',
    apiType: 'percent',
    purpose: 'A percentage. Values are rounded to 1 decimal.',
    meta: 'None.',
    example: { title: 'Discount', uidt: 'percent' },
    constraints: STD_CONSTRAINTS,
    changeTo: 'text, longText, decimal, number, currency',
  },
  {
    uidt: 'rating',
    apiType: 'rating',
    purpose: 'A star rating: a whole number from 0 up to the maximum.',
    meta: 'Optional ratingMax: the highest rating. Default 5.',
    example: { title: 'Satisfaction', uidt: 'rating', meta: { ratingMax: 10 } },
    constraints: 'default, check (not unique)',
    changeTo: 'text, longText, number, decimal',
  },
  {
    uidt: 'boolean',
    apiType: 'checkbox',
    purpose: 'Yes or no: true or false.',
    meta: 'None.',
    example: {
      title: 'Paid',
      uidt: 'boolean',
      meta: { default: false },
    },
    constraints: 'default, check',
    changeTo: 'text, longText, number (0 or 1), select',
  },
  {
    uidt: 'date',
    apiType: 'date',
    purpose: 'A calendar date without a time.',
    meta: 'None.',
    example: { title: 'Hired on', uidt: 'date' },
    constraints: STD_CONSTRAINTS,
    changeTo: 'text, longText, datetime, year',
  },
  {
    uidt: 'datetime',
    apiType: 'date_time',
    purpose: 'A date with a time of day, stored and returned in UTC.',
    meta: 'None.',
    example: { title: 'Delivered at', uidt: 'datetime' },
    constraints: STD_CONSTRAINTS,
    changeTo: 'text, longText, date, time',
  },
  {
    uidt: 'time',
    apiType: 'time',
    purpose: 'A time of day without a date.',
    meta: 'None.',
    example: { title: 'Opens at', uidt: 'time' },
    constraints: STD_CONSTRAINTS,
    changeTo: 'text, longText, duration',
  },
  {
    uidt: 'duration',
    apiType: 'duration',
    purpose: 'A length of time, written as whole minutes.',
    meta: 'None.',
    example: { title: 'Call length', uidt: 'duration' },
    constraints: STD_CONSTRAINTS,
    changeTo: 'text, longText',
  },
  {
    uidt: 'year',
    apiType: 'year',
    purpose: 'A year from 1 to 9999.',
    meta: 'None.',
    example: { title: 'Founded', uidt: 'year' },
    constraints: STD_CONSTRAINTS,
    changeTo: 'text, longText, number, date, datetime',
  },
  {
    uidt: 'email',
    apiType: 'email',
    purpose: 'An email address.',
    meta: 'Optional emailValid: true (default) refuses values that are not an email address; false accepts any text.',
    example: { title: 'Contact', uidt: 'email', meta: { emailValid: true } },
    constraints: STD_CONSTRAINTS,
    changeTo: 'text, longText',
  },
  {
    uidt: 'phoneNumber',
    apiType: 'phone_number',
    purpose: 'A phone number.',
    meta: 'Optional phoneValid: true (default) refuses values that are not a phone number; false accepts any text.',
    example: {
      title: 'Phone',
      uidt: 'phoneNumber',
      meta: { phoneValid: true },
    },
    constraints: STD_CONSTRAINTS,
    changeTo: 'text, longText',
  },
  {
    uidt: 'url',
    apiType: 'url',
    purpose: 'A web address.',
    meta: 'Optional urlValid: false (default) accepts any text; true refuses values that are not a web address.',
    example: { title: 'Website', uidt: 'url', meta: { urlValid: true } },
    constraints: STD_CONSTRAINTS,
    changeTo: 'text, longText',
  },
  {
    uidt: 'select',
    apiType: 'single_select',
    purpose: 'One choice out of a fixed list.',
    meta: 'options: the list of choices, as {"option": "Open", "color": "#2563eb"} objects or plain strings. Needed in practice: a record can only hold one of the options, so without them nothing can be written.',
    example: {
      title: 'Status',
      uidt: 'select',
      meta: {
        options: [
          { option: 'Open', color: '#2563eb' },
          { option: 'Closed', color: '#16a34a' },
        ],
      },
    },
    constraints: 'default (one of the options), unique, check',
    changeTo: 'text, longText',
  },
  {
    uidt: 'multiSelect',
    apiType: 'multi_select',
    purpose: 'Several choices out of a fixed list. Values are a list of option names.',
    meta: 'options: same as select.',
    example: {
      title: 'Labels',
      uidt: 'multiSelect',
      meta: { options: ['Bug', 'Question', 'Idea'] },
    },
    constraints: 'default (not unique)',
    changeTo: 'text, longText, json',
  },
  {
    uidt: 'json',
    apiType: 'json',
    purpose: 'Any JSON value: objects, lists, settings. Cannot be filtered or sorted.',
    meta: 'None.',
    example: { title: 'Payload', uidt: 'json' },
    constraints: 'default (not unique)',
    changeTo: 'text, longText',
  },
  {
    uidt: 'uuid',
    apiType: 'uuid',
    purpose: 'A UUID: identifiers made by the system or supplied by people.',
    meta: 'None in meta. Choose who fills it with meta.id_generation: {"mode": "auto"} (the system creates every value; read-only) or {"mode": "manual"} (people enter a valid UUID).',
    example: {
      title: 'Public ID',
      uidt: 'uuid',
      meta: { id_generation: { mode: 'auto' } },
    },
    constraints: 'id_generation, default, unique, check',
    changeTo: 'text, longText',
  },
  {
    uidt: 'links',
    apiType: 'links',
    purpose: 'A link to records of another table of the base.',
    meta: 'Required relation: {"with": <table name or tbl_ ID>, "type": "has-many" | "many-to-many" | "one-to-one"}.',
    example: {
      title: 'Customer',
      uidt: 'links',
      meta: { relation: { with: 'Customers', type: 'has-many' } },
    },
    constraints: 'None: links take no constraints.',
    changeTo: 'Cannot change type. Delete the column and add a new one.',
  },
  {
    uidt: 'lookup',
    apiType: 'lookup',
    purpose: 'Shows a column of the linked table next to each record, through a links column. Read-only.',
    meta: 'Required link_column_id: a links column of this table (name or fld_ ID). Required lookup_column_id: a column of the linked table (name or fld_ ID).',
    example: {
      title: 'Customer email',
      uidt: 'lookup',
      meta: { link_column_id: 'Customer', lookup_column_id: 'Email' },
    },
    constraints: 'None: lookups take no constraints.',
    changeTo: 'Cannot change type. Delete the column and add a new one.',
  },
];

export interface UnsupportedColumnType {
  uidt: string;
  what: string;
  why: string;
}

// The API answers 422 type_not_supported for each of these, when adding a column and when changing a column's type
export const COLUMN_TYPES_NOT_ALLOWED: UnsupportedColumnType[] = [
  {
    uidt: 'formula',
    what: 'A value calculated from other columns.',
    why: 'Formulas are calculated in the SereniBase app, not on the server, so the data API cannot read or write them yet. Add them in the app. They are left out of the API: they do not appear in records or in the column list.',
  },
  {
    uidt: 'attachment',
    what: 'Files and images.',
    why: 'The data API cannot upload or serve files yet. Add the column in the app. Existing attachment columns can be read through the API (a list of {id, url, name, size, type}) but not written.',
  },
  {
    uidt: 'user',
    what: 'One or more users of the workspace.',
    why: 'User columns are not supported by the data API yet. Add the column in the app. Existing user columns can be read (a user ID or a list of them) but not written.',
  },
  {
    uidt: 'createdTime, lastModifiedTime',
    what: 'When a record was created or last changed.',
    why: 'Set by the system. Every table already has them as system columns; they cannot be created, chosen as a type, changed, moved or deleted.',
  },
  {
    uidt: 'createdBy, lastModifiedBy',
    what: 'Who created or last changed a record.',
    why: 'Set by the system, like the two time columns above.',
  },
  {
    uidt: 'button',
    what: 'A button that runs an action in the app.',
    why: 'Buttons only make sense in the app and are set up there; the API cannot create them.',
  },
];
