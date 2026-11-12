// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

// Content of the workspace API docs page. Every example uses the same sample data: a base "CRM" with a
// table "Orders" whose "Customer" field links to "Customers", with a lookup of the customer's "Email"
// (returned inside the link's objects). Customers in turn link to "Companies" (Company), for the expand
// examples. Responses and messages are what the server returns (internal/platform in the backend).

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'QUERY';

export interface DocExample {
  title: string;
  description?: string;
  method: HttpMethod;
  // Relative to the base URL, with the query string
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  status: number;
  responseHeaders?: Record<string, string>;
  response: unknown;
}

export interface DocParam {
  name: string;
  in: 'path' | 'query' | 'body' | 'header';
  description: string;
}

export interface DocEndpoint {
  id: string;
  title: string;
  method: HttpMethod;
  path: string;
  summary: string;
  params?: DocParam[];
  notes?: string[];
  examples: DocExample[];
}

export interface DocGroup {
  id: string;
  title: string;
  endpoints: DocEndpoint[];
}

export const apiDocsPath = (workspaceId: string) => `/workspace/${workspaceId}/developer/api-docs`;

// Used in the examples until the workspace's API is turned on
export const SAMPLE_BASE_PATH = '/api/v1/ws_8f3k2m9qx7';

// ---- Sample data ----

const REQUEST_ID = 'req_6f1c2a9e4b7d4c3a8e5f1b2d9c7a4e6f';

const IDS = {
  crm: 'bse_4f2a9c1e7b3d4a5f8e6c2b1d9a7f3e5c',
  crm2: 'bse_6a1d3f5b8c2e4b7aa9d03e5f7b9c1d2e',
  marketing: 'bse_9b8e7d6c5a4f4e3d9c1b0a9f8e7d6c5b',
  orders: 'tbl_7c1e0a4f9b2d4e6f8a3c5d7e9f1b2c4d',
  customers: 'tbl_2d4f6a8c0e1b4d3f9a7c9e0b2d4f6a8c',
  name: 'fld_1a2b3c4d5e6f47a8b9c0d1e2f3a4b5c6',
  status: 'fld_2b3c4d5e6f704819a0b1c2d3e4f5a6b7',
  price: 'fld_3c4d5e6f7081492081b2c3d4e5f6a7b8',
  paid: 'fld_4d5e6f7081924a3192c3d4e5f6a7b8c9',
  orderDate: 'fld_5e6f708192a34b42a3d4e5f6a7b8c9d0',
  customer: 'fld_6f708192a3b44c53b4e5f6a7b8c9d0e1',
  // "Email" of the Customers table, looked up through Customer
  customersEmail: 'fld_708192a3b4c54d6485f6a7b8c9d0e1f2',
};

const CURSOR_PAGE_2 = 'eyJ2IjoxLCJvIjoyLCJoIjoiOWM0MWUwN2IifQ';
const CURSOR_KEYS = 'eyJ2IjoxLCJvIjoxLCJoIjoiNTJhZDhmMTAifQ';
const CURSOR_QUERY = 'eyJ2IjoxLCJvIjoxLCJoIjoiNWUwYjdkMmM0MWE5ZjM4NiJ9';

const ok = (data: unknown) => ({ data, error: null, meta: { request_id: REQUEST_ID } });

const page = (data: unknown[], nextCursor: string | null, limit = 50) => ({
  data,
  error: null,
  meta: { request_id: REQUEST_ID, next_cursor: nextCursor, has_more: nextCursor !== null, limit },
});

const fail = (code: string, message: string, details?: Record<string, unknown>[]) => ({
  data: null,
  error: details ? { code, message, details } : { code, message },
  meta: { request_id: REQUEST_ID },
});

interface OrderFields {
  Name: string;
  Status: string | null;
  Price: number | null;
  Paid: boolean;
  'Order date': string | null;
  Customer: { id: string; Email: string | null }[];
}

const record = (id: string, fields: Partial<OrderFields>, createdAt: string, updatedAt = createdAt) => ({
  id,
  fields: {
    Name: null,
    Status: null,
    Price: null,
    Paid: false,
    'Order date': null,
    Customer: [],
    ...fields,
  },
  created_at: createdAt,
  updated_at: updatedAt,
});

const ORDER_1042 = record('rec_1042', {
  Name: 'Order 1042', Status: 'Active', Price: 499, Paid: true, 'Order date': '2026-11-03',
  Customer: [{ id: 'rec_12', Email: 'asha@example.com' }],
}, '2026-11-03T10:15:00Z');

const ORDER_1043 = record('rec_1043', {
  Name: 'Order 1043', Status: 'Paused', Price: 120, Paid: false, 'Order date': '2026-11-04',
  Customer: [{ id: 'rec_15', Email: 'ravi@example.com' }],
}, '2026-11-04T08:40:00Z');

const ORDER_1044 = record('rec_1044', { Name: 'Order 1044', Price: 75 }, '2026-11-04T09:05:00Z');

const ORDERS_TABLE = {
  id: IDS.orders,
  name: 'Orders',
  base_id: IDS.crm,
  fields: [
    { id: IDS.name, name: 'Name', type: 'text', read_only: false },
    { id: IDS.status, name: 'Status', type: 'single_select', read_only: false, options: ['Active', 'Paused', 'Closed'] },
    { id: IDS.price, name: 'Price', type: 'currency', read_only: false },
    { id: IDS.paid, name: 'Paid', type: 'checkbox', read_only: false },
    { id: IDS.orderDate, name: 'Order date', type: 'date', read_only: false },
    {
      id: IDS.customer,
      name: 'Customer',
      type: 'links',
      read_only: false,
      linked_table_id: IDS.customers,
      multiple: false,
      lookups: [{ key: 'Email', id: IDS.customersEmail, name: 'Email', type: 'email' }],
    },
  ],
};

const RECORDS = '/bases/CRM/tables/Orders/records';

// ---- Expanded links (expand=Customer, expand=Customer.Company) ----

const ASHA = { Name: 'Asha', Email: 'asha@example.com', Company: [{ id: 'rec_3' }] };
const RAVI = { Name: 'Ravi', Email: 'ravi@example.com', Company: [] };
const ACME = { Name: 'Acme Group', City: 'Pune' };

// An order whose Customer objects also hold the customer's fields; withCompany expands the customer's Company too
const expandedOrder = (order: typeof ORDER_1042, withCompany = false) => ({
  ...order,
  fields: {
    ...order.fields,
    Customer: order.fields.Customer.map((c) => {
      const customer = c.id === 'rec_12' ? ASHA : RAVI;
      return {
        ...c,
        fields: withCompany
          ? { ...customer, Company: customer.Company.map((co) => ({ ...co, fields: ACME })) }
          : customer,
      };
    }),
  },
});

const TIMEOUT_MESSAGE =
  'The request took longer than 10s and was stopped. Narrow the filter or search, expand fewer fields, or ask for a smaller page.';

// ---- Endpoints ----

const LIST_BASES: DocEndpoint = {
  id: 'list-bases',
  title: 'List bases',
  method: 'GET',
  path: '/bases',
  summary: 'Returns every base in the workspace with its ID and name.',
  examples: [
    {
      title: 'All bases in the workspace',
      method: 'GET',
      path: '/bases',
      status: 200,
      response: ok([
        { id: IDS.crm, name: 'CRM' },
        { id: IDS.marketing, name: 'Marketing' },
      ]),
    },
    {
      title: 'Wrong workspace ID, or the API is turned off',
      description: 'Every endpoint answers this way when the ws_ part of the URL is wrong or the workspace API is off.',
      method: 'GET',
      path: '/bases',
      status: 404,
      response: fail('not_found', 'No workspace with ID "ws_8f3k2m9qx7", or its API is turned off.'),
    },
  ],
};

const LIST_TABLES: DocEndpoint = {
  id: 'list-tables',
  title: 'List tables',
  method: 'GET',
  path: '/bases/{base}/tables',
  summary: 'Returns the tables of one base.',
  params: [{ name: 'base', in: 'path', description: 'The base name (for example CRM) or its ID (bse_…).' }],
  examples: [
    {
      title: 'Tables of a base, by name',
      method: 'GET',
      path: '/bases/CRM/tables',
      status: 200,
      response: ok([
        { id: IDS.orders, name: 'Orders' },
        { id: IDS.customers, name: 'Customers' },
      ]),
    },
    {
      title: 'Tables of a base, by ID',
      description: 'IDs keep working after a rename, so apps that must not break should store them.',
      method: 'GET',
      path: `/bases/${IDS.crm}/tables`,
      status: 200,
      response: ok([
        { id: IDS.orders, name: 'Orders' },
        { id: IDS.customers, name: 'Customers' },
      ]),
    },
    {
      title: 'The base does not exist',
      method: 'GET',
      path: '/bases/Sales/tables',
      status: 404,
      response: fail('not_found', 'No base named "Sales".'),
    },
    {
      title: 'Two bases have the same name',
      description: 'Use one of the IDs listed in details instead of the name.',
      method: 'GET',
      path: '/bases/CRM/tables',
      status: 409,
      response: fail('ambiguous_name', '2 bases are named "CRM". Use one of their IDs instead.', [
        { id: IDS.crm },
        { id: IDS.crm2 },
      ]),
    },
  ],
};

const GET_TABLE: DocEndpoint = {
  id: 'get-table',
  title: 'Get a table and its fields',
  method: 'GET',
  path: '/bases/{base}/tables/{table}',
  summary:
    'Returns the table with its fields: each field\'s ID, name, type and whether it is read-only. Select fields also list their options. Link fields list the table they link to, whether they hold several records, and in lookups the keys their objects carry; lookup fields are listed there, not as fields of their own.',
  params: [
    { name: 'base', in: 'path', description: 'Base name or ID (bse_…).' },
    { name: 'table', in: 'path', description: 'Table name or ID (tbl_…).' },
  ],
  examples: [
    {
      title: 'A table with its fields',
      method: 'GET',
      path: '/bases/CRM/tables/Orders',
      status: 200,
      response: ok(ORDERS_TABLE),
    },
    {
      title: 'A name with spaces or special characters',
      description: 'Encode names in the URL: a space is %20 and a slash is %2F.',
      method: 'GET',
      path: '/bases/CRM/tables/Sales%20Team',
      status: 200,
      response: ok({ id: 'tbl_8e2c4a6f1b3d4f5a9c7e0b2d4f6a8c1e', name: 'Sales Team', base_id: IDS.crm, fields: [] }),
    },
    {
      title: 'The table does not exist',
      method: 'GET',
      path: '/bases/CRM/tables/Order',
      status: 404,
      response: fail('not_found', 'No table named "Order".'),
    },
  ],
};

const LIST_RECORDS: DocEndpoint = {
  id: 'list-records',
  title: 'List records',
  method: 'GET',
  path: '/bases/{base}/tables/{table}/records',
  summary:
    'Returns one page of records. Without sort, records come oldest first. Use filter, search, sort and select to choose which records and fields come back, and expand to get linked records\' fields too.',
  params: [
    { name: 'limit', in: 'query', description: 'Records per page, 1 to 200. Default 50.' },
    { name: 'cursor', in: 'query', description: 'meta.next_cursor from the previous page. Send the same filter, search and sort with it.' },
    { name: 'filter[Field]', in: 'query', description: 'Only records where the field equals the value.' },
    { name: 'filter[Field][op]', in: 'query', description: 'Compare with an operator: eq, neq, gt, gte, lt, lte, in, contains, is_null. See Field values for which work on each type.' },
    { name: 'where', in: 'query', description: 'For "or" and "not": a filter tree as URL-encoded JSON. Easier to send in a body; see Find records. Empty or {} means no filter.' },
    { name: 'search', in: 'query', description: 'Only records where any text field (text, long text, email, URL, phone, single select) contains this text, ignoring case. At most 200 characters; empty means no search.' },
    { name: 'expand', in: 'query', description: 'Comma-separated link fields whose linked records\' fields to return, e.g. Customer. Customer.Company goes one level further. At most 2 levels and 5 link fields.' },
    { name: 'sort', in: 'query', description: 'Comma-separated fields; a leading - sorts descending, e.g. -Price. Also created_at, updated_at and id.' },
    { name: 'select', in: 'query', description: 'Comma-separated fields to return; empty or left out returns all fields. id, created_at and updated_at always come back.' },
    { name: 'keys', in: 'query', description: 'name (default) keys fields by name; id keys them by field ID (fld_…).' },
  ],
  notes: [
    'Several filters are combined with AND: a record must match all of them. For "or" and "not" filters, use Find records.',
    'search is combined with filter and where using AND. It looks only in stored text fields: lookups, formulas, numbers and dates are not searched.',
    'Formula and lookup fields are calculated when a record is read, so they can\'t be used to filter or sort.',
    'Empty fields are null, or [] for lists (multi-select, links).',
    'A link field is a list of objects, one per linked record: its id and the lookups through the link, keyed by the looked-up field\'s name. select=<lookup field> returns its link field with only that lookup.',
    'With expand, each object of the link field also has fields: the linked record\'s fields. Only the first 100 linked records of each link are expanded; the rest keep only their id. An expanded field comes back even when select leaves it out.',
    'expand changes what each record shows, not which records come back. Filtering by a linked record\'s fields (Customer.Country) is not supported yet.',
    'In filter, sort and select, id, created_at and updated_at mean the record\'s own values. A field with one of these names, or with , [ or ] in its name, must be given by its ID.',
  ],
  examples: [
    {
      title: 'First page',
      description: 'has_more is true, so there are more records. Pass next_cursor to get them.',
      method: 'GET',
      path: `${RECORDS}?limit=2`,
      status: 200,
      response: page([ORDER_1042, ORDER_1043], CURSOR_PAGE_2, 2),
    },
    {
      title: 'Next page',
      description: 'On the last page next_cursor is null and has_more is false.',
      method: 'GET',
      path: `${RECORDS}?limit=2&cursor=${CURSOR_PAGE_2}`,
      status: 200,
      response: page([ORDER_1044], null, 2),
    },
    {
      title: 'Filter: a field equals a value',
      method: 'GET',
      path: `${RECORDS}?filter[Status]=Active`,
      status: 200,
      response: page([ORDER_1042], null),
    },
    {
      title: 'Filter: several conditions, sorted',
      description: 'Status is Active or Paused, and Price is 100 or more; the highest price first.',
      method: 'GET',
      path: `${RECORDS}?filter[Status][in]=Active,Paused&filter[Price][gte]=100&sort=-Price`,
      status: 200,
      response: page([ORDER_1042, ORDER_1043], null),
    },
    {
      title: 'Filter: text contains (case-insensitive)',
      method: 'GET',
      path: `${RECORDS}?filter[Name][contains]=1043`,
      status: 200,
      response: page([ORDER_1043], null),
    },
    {
      title: 'Filter: empty fields',
      description: 'is_null=true finds records where the field is empty; is_null=false finds the rest.',
      method: 'GET',
      path: `${RECORDS}?filter[Status][is_null]=true`,
      status: 200,
      response: page([ORDER_1044], null),
    },
    {
      title: 'Filter: a checkbox',
      method: 'GET',
      path: `${RECORDS}?filter[Paid]=true`,
      status: 200,
      response: page([ORDER_1042], null),
    },
    {
      title: 'Filter: a date range',
      description: 'A field name with a space is encoded as %20.',
      method: 'GET',
      path: `${RECORDS}?filter[Order%20date][gte]=2026-11-04&filter[Order%20date][lt]=2026-11-05`,
      status: 200,
      response: page([ORDER_1043], null),
    },
    {
      title: 'Filter: records linked to a record',
      description: 'Orders whose Customer is rec_12.',
      method: 'GET',
      path: `${RECORDS}?filter[Customer][contains]=rec_12`,
      status: 200,
      response: page([ORDER_1042], null),
    },
    {
      title: 'Search every text field',
      description: 'Finds "paused" in the Status field of order 1043, ignoring case. Name and the other text fields are searched too.',
      method: 'GET',
      path: `${RECORDS}?search=paused`,
      status: 200,
      response: page([ORDER_1043], null),
    },
    {
      title: 'Search together with a filter',
      description: 'Both must match: "order" is in every Name, and only order 1042 is paid.',
      method: 'GET',
      path: `${RECORDS}?search=order&filter[Paid]=true`,
      status: 200,
      response: page([ORDER_1042], null),
    },
    {
      title: 'Linked records inline (expand)',
      description: 'Each Customer object also has fields: the customer\'s own fields. Its Company link still holds only IDs.',
      method: 'GET',
      path: `${RECORDS}?expand=Customer&limit=2`,
      status: 200,
      response: page([expandedOrder(ORDER_1042), expandedOrder(ORDER_1043)], CURSOR_PAGE_2, 2),
    },
    {
      title: 'Two levels: the customer and its company',
      description: 'Customer.Company also expands the Company link inside each customer. Customer.Company on its own does the same.',
      method: 'GET',
      path: `${RECORDS}?expand=Customer,Customer.Company&filter[Customer][contains]=rec_12`,
      status: 200,
      response: page([expandedOrder(ORDER_1042, true)], null),
    },
    {
      title: 'Expand with select',
      description: 'An expanded field comes back even when select leaves it out.',
      method: 'GET',
      path: `${RECORDS}?select=Name&expand=Customer&filter[Customer][contains]=rec_12`,
      status: 200,
      response: page(
        [{ ...ORDER_1042, fields: { Name: ORDER_1042.fields.Name, Customer: expandedOrder(ORDER_1042).fields.Customer } }],
        null
      ),
    },
    {
      title: 'Only some fields',
      method: 'GET',
      path: `${RECORDS}?select=Name,Price`,
      status: 200,
      response: page(
        [ORDER_1042, ORDER_1043, ORDER_1044].map((r) => ({
          ...r,
          fields: { Name: r.fields.Name, Price: r.fields.Price },
        })),
        null
      ),
    },
    {
      title: 'Fields keyed by field ID',
      description: 'Useful when field names may change.',
      method: 'GET',
      path: `${RECORDS}?keys=id&limit=1`,
      status: 200,
      response: page(
        [{
          ...ORDER_1042,
          fields: {
            [IDS.name]: 'Order 1042',
            [IDS.status]: 'Active',
            [IDS.price]: 499,
            [IDS.paid]: true,
            [IDS.orderDate]: '2026-11-03',
            [IDS.customer]: [{ id: 'rec_12', [IDS.customersEmail]: 'asha@example.com' }],
          },
        }],
        CURSOR_KEYS,
        1
      ),
    },
    {
      title: 'An operator the field does not support',
      method: 'GET',
      path: `${RECORDS}?filter[Price][contains]=100`,
      status: 400,
      response: fail(
        'bad_request',
        'filter[Price][contains]: "Price" is a currency field. You can use: eq, neq, gt, gte, lt, lte, in, is_null.'
      ),
    },
    {
      title: 'A cursor sent with a different filter',
      description: 'A different search counts as a different filter too.',
      method: 'GET',
      path: `${RECORDS}?limit=2&cursor=${CURSOR_PAGE_2}&filter[Paid]=true`,
      status: 400,
      response: fail(
        'bad_request',
        'cursor was made for a different filter or sort. Send the same filter and sort as the first page, or start again without a cursor.'
      ),
    },
    {
      title: 'Expanding a field that is not a link',
      method: 'GET',
      path: `${RECORDS}?expand=Price`,
      status: 400,
      response: fail('bad_request', 'expand: "Price" is a currency field; only link fields can be expanded.'),
    },
    {
      title: 'A link field name with a typo',
      description: 'The closest field name is suggested, at each level: expand=Customer.Compny suggests "Company".',
      method: 'GET',
      path: `${RECORDS}?expand=Custmer`,
      status: 400,
      response: fail('bad_request', 'expand: No field named "Custmer". Did you mean "Customer"?'),
    },
    {
      title: 'Expanding more than 2 levels',
      method: 'GET',
      path: `${RECORDS}?expand=Customer.Company.Owner`,
      status: 400,
      response: fail(
        'bad_request',
        'expand: "Customer.Company.Owner" goes deeper than 2 levels. Read the linked records\' own links with another request.'
      ),
    },
    {
      title: 'A search that is too long',
      description: 'The text is shortened here; it had 201 characters.',
      method: 'GET',
      path: `${RECORDS}?search=aaaa…aaaa`,
      status: 400,
      response: fail('bad_request', 'search: at most 200 characters.'),
    },
    {
      title: 'A request that runs too long',
      description: 'Reads are stopped after 10 seconds. Narrow the filter or search, expand fewer fields, or ask for a smaller page.',
      method: 'GET',
      path: `${RECORDS}?search=a&expand=Customer.Company&limit=200`,
      status: 503,
      response: fail('query_timeout', TIMEOUT_MESSAGE),
    },
  ],
};

const ACTIVE_OR_PAUSED = {
  match: 'any',
  conditions: [
    { field: 'Status', value: 'Active' },
    { field: 'Status', value: 'Paused' },
  ],
};

const QUERY_RECORDS: DocEndpoint = {
  id: 'query-records',
  title: 'Find records (or / not filters)',
  method: 'POST',
  path: '/bases/{base}/tables/{table}/records/query',
  summary:
    'Like List records, with the options in a JSON body. Use it when a filter needs "or" or "not". A where filter is built from two shapes: a condition, {"field", "op", "value"}, checks one field; a group, {"match", "conditions"}, combines conditions with all (AND), any (OR) or none (NOT), and can hold other groups. match only ever goes on a group. Nothing is changed; it only reads. Send it with POST or with the HTTP QUERY method; both work the same.',
  params: [
    { name: 'where', in: 'body', description: 'A group, {"match": "all", "conditions": [...]}, or a single condition on its own. null, {} or a group with no conditions means no filter, and the whole body is optional.' },
    { name: 'match', in: 'body', description: 'On a group only: all (every condition true, AND), any (at least one, OR) or none (not one of them, NOT). all when left out. Never put match on a condition; to negate one condition, wrap it in a group with "match": "none".' },
    { name: 'conditions', in: 'body', description: 'The list inside a group. Each item is a condition or another group. A condition has only field, op and value: {"field": "Status", "op": "eq", "value": "Active"}; op is eq when left out. The operators each field takes are the same as for filter.' },
    { name: 'sort', in: 'body', description: 'A list of fields, e.g. ["-Price"], or one comma-separated text.' },
    { name: 'select', in: 'body', description: 'A list of fields to return, or one comma-separated text. An empty list returns all fields.' },
    { name: 'limit', in: 'body', description: 'Records per page, 1 to 200. Default 50.' },
    { name: 'cursor', in: 'body', description: 'meta.next_cursor from the previous page. Send the same where, search and sort with it.' },
    { name: 'search', in: 'body', description: 'Only records where any text field contains this text, ignoring case; combined with where using AND. See List records.' },
    { name: 'expand', in: 'body', description: 'Link fields whose linked records\' fields to return: a list, e.g. ["Customer", "Customer.Company"], or one comma-separated text. See List records.' },
    { name: 'keys', in: 'body', description: 'name (default) or id.' },
  ],
  notes: [
    'Two shapes only. Condition: {"field": "Name", "op": "contains", "value": "104"}. Group: {"match": "none", "conditions": [ ...conditions or groups... ]}. A condition with match, or a group with field, is an error.',
    'all: every condition must be true (AND). any: at least one (OR). none: not one of them (NOT).',
    'To say OR, put the conditions in a group with "match": "any". For one field with several values, "op": "in" is shorter.',
    'To say NOT, put the condition in a group with "match": "none". With several conditions inside, none means "neither ... nor ...".',
    'To say NOT (A AND B), put an "all" group inside a "none" group. To mix AND with OR, put an "any" group inside an "all" group, and so on.',
    'neq and none differ on empty fields: "op": "neq" leaves out records where the field is empty, a none group keeps them.',
    'none counts an empty field as not matching, so "none of Status is Active" also finds records with no Status.',
    'in takes a JSON list: {"field": "Status", "op": "in", "value": ["Active", "Paused"]}. {"field": "Status", "op": "is_null"} finds empty fields.',
    'Groups can be nested up to 5 deep, with at most 50 conditions in all.',
    'The same tree also works on GET /records as the URL-encoded where parameter, combined with any filter[...] using AND.',
    'POST and QUERY do exactly the same thing: same body, same answer. See Find records with QUERY.',
  ],
  examples: [
    {
      title: 'Any of: Status is Active or Paused',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: { where: ACTIVE_OR_PAUSED },
      status: 200,
      response: page([ORDER_1042, ORDER_1043], null),
    },
    // ---- How to say OR ----
    {
      title: 'OR across two fields',
      description: 'Status is Paused, or Price is under 100. A record needs only one of them.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: {
        where: {
          match: 'any',
          conditions: [
            { field: 'Status', value: 'Paused' },
            { field: 'Price', op: 'lt', value: 100 },
          ],
        },
      },
      status: 200,
      response: page([ORDER_1043, ORDER_1044], null),
    },
    {
      title: 'OR on one field: the in shortcut',
      description: 'The same as an any group of Status is Active and Status is Paused.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: { where: { field: 'Status', op: 'in', value: ['Active', 'Paused'] } },
      status: 200,
      response: page([ORDER_1042, ORDER_1043], null),
    },
    {
      title: '(A AND B) OR C',
      description: 'Active and paid, or Price under 100: an all group inside an any group.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: {
        where: {
          match: 'any',
          conditions: [
            { match: 'all', conditions: [{ field: 'Status', value: 'Active' }, { field: 'Paid', value: true }] },
            { field: 'Price', op: 'lt', value: 100 },
          ],
        },
      },
      status: 200,
      response: page([ORDER_1042, ORDER_1044], null),
    },
    {
      title: 'OR on GET, with the where parameter',
      description: 'The same tree as URL-encoded JSON on List records, for clients that can only send GET.',
      method: 'GET',
      path: `${RECORDS}?where=${encodeURIComponent(JSON.stringify({ match: 'any', conditions: [{ field: 'Status', value: 'Paused' }, { field: 'Price', op: 'lt', value: 100 }] }))}`,
      status: 200,
      response: page([ORDER_1043, ORDER_1044], null),
    },
    // ---- How to say NOT ----
    {
      title: 'NOT one condition: Status is not Active',
      description: 'A none group with one condition. Order 1044 has no Status, so it comes back too.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: { where: { match: 'none', conditions: [{ field: 'Status', value: 'Active' }] } },
      status: 200,
      response: page([ORDER_1043, ORDER_1044], null),
    },
    {
      title: 'neq instead: empty fields are left out',
      description: 'Status neq Active only returns records that have a Status. Compare with the none group above.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: { where: { field: 'Status', op: 'neq', value: 'Active' } },
      status: 200,
      response: page([ORDER_1043], null),
    },
    {
      title: 'Neither ... nor ...',
      description: 'Status is neither Active nor Paused: a none group with two conditions.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: {
        where: {
          match: 'none',
          conditions: [
            { field: 'Status', value: 'Active' },
            { field: 'Status', value: 'Paused' },
          ],
        },
      },
      status: 200,
      response: page([ORDER_1044], null),
    },
    {
      title: 'NOT (A AND B)',
      description: 'Every order except the paid ones of 100 or more: an all group inside a none group.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: {
        where: {
          match: 'none',
          conditions: [
            { match: 'all', conditions: [{ field: 'Paid', value: true }, { field: 'Price', op: 'gte', value: 100 }] },
          ],
        },
      },
      status: 200,
      response: page([ORDER_1043, ORDER_1044], null),
    },
    {
      title: 'All, any and none together',
      description: 'Price is 100 or more, Status is Active or Paused, and the order is not paid. The highest price first.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: {
        where: {
          match: 'all',
          conditions: [
            { field: 'Price', op: 'gte', value: 100 },
            ACTIVE_OR_PAUSED,
            { match: 'none', conditions: [{ field: 'Paid', value: true }] },
          ],
        },
        sort: ['-Price'],
      },
      status: 200,
      response: page([ORDER_1043], null),
    },
    {
      title: 'None of: empty fields are included',
      description: 'Order 1044 has no Status, so it is not Active and comes back too.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: { where: { match: 'none', conditions: [{ field: 'Status', value: 'Active' }] } },
      status: 200,
      response: page([ORDER_1043, ORDER_1044], null),
    },
    {
      title: 'A list of values, and empty fields',
      description: 'Status is Active or Paused, or Status is empty.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: {
        where: {
          match: 'any',
          conditions: [
            { field: 'Status', op: 'in', value: ['Active', 'Paused'] },
            { field: 'Status', op: 'is_null' },
          ],
        },
        select: ['Name', 'Status'],
      },
      status: 200,
      response: page(
        [ORDER_1042, ORDER_1043, ORDER_1044].map((r) => ({ ...r, fields: { Name: r.fields.Name, Status: r.fields.Status } })),
        null
      ),
    },
    {
      title: 'Page through the results',
      description: 'Send the next_cursor back with the same where and sort to get the next page.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: { where: ACTIVE_OR_PAUSED, limit: 1 },
      status: 200,
      response: page([ORDER_1042], CURSOR_QUERY, 1),
    },
    {
      title: 'Search, filter and expand in one request',
      description: 'Active or Paused orders that mention "1042" in a text field, with each customer and its company.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: { where: ACTIVE_OR_PAUSED, search: '1042', expand: ['Customer', 'Customer.Company'] },
      status: 200,
      response: page([expandedOrder(ORDER_1042, true)], null),
    },
    {
      title: 'A field name with a typo',
      description: 'Errors say where the problem is in the tree, and suggest the closest field name.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: { where: { match: 'any', conditions: [{ field: 'Staus', value: 'Active' }] } },
      status: 400,
      response: fail('bad_request', 'where.conditions[0]: No field named "Staus". Did you mean "Status"?'),
    },
    {
      title: 'A common mistake: match on a condition',
      description: 'match belongs on a group. To say "Status is not Active", wrap the condition in a none group instead: {"match": "none", "conditions": [{"field": "Status", "value": "Active"}]}.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: {
        where: {
          match: 'all',
          conditions: [
            { field: 'Status', value: 'Active', match: 'none' },
            { field: 'Name', op: 'contains', value: '104' },
          ],
        },
      },
      status: 400,
      response: fail('bad_request', 'where.conditions[0]: a condition has field, op and value; a group has match and conditions. Use one or the other.'),
    },
    {
      title: 'The same, written correctly',
      description: 'Status is not Active, and Name contains "104". The none group is one of the conditions of the all group; order 1044 has no Status, so it comes back too.',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: {
        where: {
          match: 'all',
          conditions: [
            { match: 'none', conditions: [{ field: 'Status', value: 'Active' }] },
            { field: 'Name', op: 'contains', value: '104' },
          ],
        },
      },
      status: 200,
      response: page([ORDER_1043, ORDER_1044], null),
    },
    {
      title: 'A lookup or formula field',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: { where: { field: 'Email', op: 'contains', value: 'asha' } },
      status: 400,
      response: fail(
        'bad_request',
        'where: "Email" is a lookup field. Formula and lookup fields are calculated when read, so they can\'t be used to filter or sort.'
      ),
    },
    {
      title: 'An unknown match',
      method: 'POST',
      path: `${RECORDS}/query`,
      body: { where: { match: 'either', conditions: [{ field: 'Status', value: 'Active' }] } },
      status: 400,
      response: fail('bad_request', 'where.match must be all, any or none.'),
    },
  ],
};

const QUERY_RECORDS_WITH_QUERY: DocEndpoint = {
  id: 'query-records-query-method',
  title: 'Find records with QUERY',
  method: 'QUERY',
  path: '/bases/{base}/tables/{table}/records/query',
  summary:
    'The same as Find records, sent with the HTTP QUERY method instead of POST: the same body, the same answer and the same errors. QUERY is the newer HTTP method for reads with a body; it says plainly that nothing is changed, so it can be retried safely. Use it if your HTTP client supports it, otherwise use POST.',
  params: QUERY_RECORDS.params,
  notes: [
    'Everything in Find records applies: all / any / none groups, search, expand, sort, select, limit, cursor and keys.',
    'A cursor from POST works with QUERY and the other way around, as long as where and sort stay the same.',
    'Browsers and most HTTP clients can send QUERY (fetch, curl -X QUERY); some older tools and proxies cannot. If yours cannot, use POST.',
    'The body is optional: with no body, or an empty where, every record is listed.',
  ],
  examples: [
    {
      title: 'Any of: Status is Active or Paused',
      method: 'QUERY',
      path: `${RECORDS}/query`,
      body: { where: ACTIVE_OR_PAUSED },
      status: 200,
      response: page([ORDER_1042, ORDER_1043], null),
    },
    {
      title: 'All, any and none together',
      description: 'Price is 100 or more, Status is Active or Paused, and the order is not paid. The highest price first.',
      method: 'QUERY',
      path: `${RECORDS}/query`,
      body: {
        where: {
          match: 'all',
          conditions: [
            { field: 'Price', op: 'gte', value: 100 },
            ACTIVE_OR_PAUSED,
            { match: 'none', conditions: [{ field: 'Paid', value: true }] },
          ],
        },
        sort: ['-Price'],
      },
      status: 200,
      response: page([ORDER_1043], null),
    },
    {
      title: 'Page through the results',
      description: 'Send the next_cursor back with the same where and sort to get the next page.',
      method: 'QUERY',
      path: `${RECORDS}/query`,
      body: { where: ACTIVE_OR_PAUSED, limit: 1 },
      status: 200,
      response: page([ORDER_1042], CURSOR_QUERY, 1),
    },
    {
      title: 'An error, as with POST',
      method: 'QUERY',
      path: `${RECORDS}/query`,
      body: { where: { match: 'either', conditions: [{ field: 'Status', value: 'Active' }] } },
      status: 400,
      response: fail('bad_request', 'where.match must be all, any or none.'),
    },
  ],
};

const GET_RECORD: DocEndpoint = {
  id: 'get-record',
  title: 'Get a record',
  method: 'GET',
  path: '/bases/{base}/tables/{table}/records/{record}',
  summary: 'Returns one record by its ID.',
  params: [
    { name: 'record', in: 'path', description: 'The record ID (rec_1042) with the default primary key. When the key was changed to other fields, a record ID is refused: use the value of a one-field key (records/A1), or by-key with each key field named, e.g. records/by-key?key[SKU]=A1&key[Region]=EU.' },
    { name: 'expand', in: 'query', description: 'Comma-separated link fields whose linked records\' fields to return, as for List records.' },
    { name: 'keys', in: 'query', description: 'name (default) or id.' },
  ],
  examples: [
    {
      title: 'One record',
      method: 'GET',
      path: `${RECORDS}/rec_1042`,
      status: 200,
      response: ok(ORDER_1042),
    },
    {
      title: 'One record with its customer',
      method: 'GET',
      path: `${RECORDS}/rec_1042?expand=Customer`,
      status: 200,
      response: ok(expandedOrder(ORDER_1042)),
    },
    {
      title: 'The record does not exist',
      method: 'GET',
      path: `${RECORDS}/rec_9999`,
      status: 404,
      response: fail('not_found', 'No record with ID "rec_9999".'),
    },
  ],
};

const CREATE_RECORDS: DocEndpoint = {
  id: 'create-records',
  title: 'Create records',
  method: 'POST',
  path: '/bases/{base}/tables/{table}/records',
  summary:
    'Send {"fields": {...}} to create one record, or {"records": [{"fields": {...}}, ...]} to create up to 100 at once. Returns the created records with 201.',
  params: [
    { name: 'fields', in: 'body', description: 'Field values by name or ID. Fields you leave out stay empty.' },
    { name: 'records', in: 'body', description: 'For many records: an array of {"fields": {...}}, at most 100.' },
    { name: 'Idempotency-Key', in: 'header', description: 'Optional. Makes a retry safe; see Safe retries.' },
  ],
  notes: [
    'All or nothing: if any record has a problem, nothing is saved and error.details lists every problem, with the record\'s index for bulk requests.',
    'Unknown fields and read-only fields are rejected, not ignored, so typos show up.',
    'Link fields take an array of record IDs and can be set only when creating one record.',
  ],
  examples: [
    {
      title: 'Create one record',
      method: 'POST',
      path: RECORDS,
      body: {
        fields: { Name: 'Order 1045', Status: 'Active', Price: 250, Paid: false, 'Order date': '2026-11-04', Customer: ['rec_12'] },
      },
      status: 201,
      response: ok(record('rec_1045', {
        Name: 'Order 1045', Status: 'Active', Price: 250, Paid: false, 'Order date': '2026-11-04',
        Customer: [{ id: 'rec_12', Email: 'asha@example.com' }],
      }, '2026-11-04T09:30:00Z')),
    },
    {
      title: 'Create many records',
      method: 'POST',
      path: RECORDS,
      body: {
        records: [
          { fields: { Name: 'Order 1046', Price: 90, Paid: false } },
          { fields: { Name: 'Order 1047', Status: 'Paused', Price: 140, Paid: true } },
        ],
      },
      status: 201,
      response: ok([
        record('rec_1046', { Name: 'Order 1046', Price: 90, Paid: false }, '2026-11-04T09:31:00Z'),
        record('rec_1047', { Name: 'Order 1047', Status: 'Paused', Price: 140, Paid: true }, '2026-11-04T09:31:00Z'),
      ]),
    },
    {
      title: 'Invalid values',
      description: 'Each problem is listed; nothing is saved.',
      method: 'POST',
      path: RECORDS,
      body: { fields: { Status: 'Done', Price: 'cheap', Colour: 'Red' } },
      status: 422,
      response: fail('validation_failed', 'Some fields have invalid values. Nothing was saved.', [
        { field: 'Colour', issue: 'unknown field' },
        { field: 'Price', issue: 'must be a number' },
        { field: 'Status', issue: '"Done" is not one of the field\'s options' },
      ]),
    },
    {
      title: 'A problem in one record of many',
      description: 'index is the record\'s position in the records array, starting at 0.',
      method: 'POST',
      path: RECORDS,
      body: {
        records: [
          { fields: { Name: 'Order 1048' } },
          { fields: { Name: 'Order 1049', Paid: 'yes', Customer: ['rec_12'] } },
        ],
      },
      status: 422,
      response: fail('validation_failed', 'Some fields have invalid values. Nothing was saved.', [
        { index: 1, field: 'Customer', issue: 'link fields can only be set when writing one record' },
        { index: 1, field: 'Paid', issue: 'must be true or false' },
      ]),
    },
    {
      title: 'A link to a record that does not exist',
      method: 'POST',
      path: RECORDS,
      body: { fields: { Name: 'Order 1050', Customer: ['rec_999'] } },
      status: 422,
      response: fail('validation_failed', 'Some fields have invalid values. Nothing was saved.', [
        { field: 'Customer', id: 'rec_999', issue: 'no record with this ID in the linked table' },
      ]),
    },
    {
      title: 'Too many records in one request',
      description: 'The request body is shortened here; it had 101 records.',
      method: 'POST',
      path: RECORDS,
      body: { records: ['… 101 records …'] },
      status: 413,
      response: fail('payload_too_large', 'At most 100 records per request; this one has 101.'),
    },
  ],
};

const UPDATE_RECORDS: DocEndpoint = {
  id: 'update-records',
  title: 'Update records',
  method: 'PATCH',
  path: '/bases/{base}/tables/{table}/records/{record}',
  summary:
    'Changes only the fields you send; the others keep their values. PATCH one record at /records/{record}, or up to 100 at /records with {"records": [{"id": ..., "fields": {...}}]}. Returns the updated records.',
  params: [
    { name: 'record', in: 'path', description: 'The record, as for Get a record (rec_1042, records/A1, or records/by-key?key[SKU]=A1&key[Region]=EU), for a single update. In a bulk update, each record has an id, or a key object such as {"SKU": "A1", "Region": "EU"} when the primary key is other fields.' },
    { name: 'fields', in: 'body', description: 'The values to change. null empties a field.' },
    { name: 'records', in: 'body', description: 'For many records: an array of {"id", "fields"}, at most 100, each ID once.' },
  ],
  notes: [
    'A link field takes record IDs (["rec_15"]) or the objects it returns ([{"id": "rec_15", ...}]). The new value replaces its links, and [] or null removes all links.',
    'All or nothing: if any record is missing or invalid, no record is changed.',
  ],
  examples: [
    {
      title: 'Update one record',
      method: 'PATCH',
      path: `${RECORDS}/rec_1043`,
      body: { fields: { Status: 'Active', Paid: true } },
      status: 200,
      response: ok({
        ...ORDER_1043,
        fields: { ...ORDER_1043.fields, Status: 'Active', Paid: true },
        updated_at: '2026-11-04T10:02:00Z',
      }),
    },
    {
      title: 'Empty a field and change a link',
      method: 'PATCH',
      path: `${RECORDS}/rec_1042`,
      body: { fields: { 'Order date': null, Customer: ['rec_15'] } },
      status: 200,
      response: ok({
        ...ORDER_1042,
        fields: { ...ORDER_1042.fields, 'Order date': null, Customer: [{ id: 'rec_15', Email: 'ravi@example.com' }] },
        updated_at: '2026-11-04T10:05:00Z',
      }),
    },
    {
      title: 'Send a link value back as it was read',
      description: 'Link objects are accepted as they come back; only their id is read.',
      method: 'PATCH',
      path: `${RECORDS}/rec_1043`,
      body: { fields: { Customer: [{ id: 'rec_12', Email: 'asha@example.com' }] } },
      status: 200,
      response: ok({
        ...ORDER_1043,
        fields: { ...ORDER_1043.fields, Customer: [{ id: 'rec_12', Email: 'asha@example.com' }] },
        updated_at: '2026-11-04T10:07:00Z',
      }),
    },
    {
      title: 'Update many records',
      method: 'PATCH',
      path: RECORDS,
      body: {
        records: [
          { id: 'rec_1042', fields: { Price: 450 } },
          { id: 'rec_1043', fields: { Price: 130 } },
        ],
      },
      status: 200,
      response: ok([
        { ...ORDER_1042, fields: { ...ORDER_1042.fields, Price: 450 }, updated_at: '2026-11-04T10:10:00Z' },
        { ...ORDER_1043, fields: { ...ORDER_1043.fields, Price: 130 }, updated_at: '2026-11-04T10:10:00Z' },
      ]),
    },
    {
      title: 'One of the records does not exist',
      method: 'PATCH',
      path: RECORDS,
      body: {
        records: [
          { id: 'rec_1042', fields: { Price: 450 } },
          { id: 'rec_9999', fields: { Price: 10 } },
        ],
      },
      status: 404,
      response: fail('not_found', 'Some records don\'t exist. Nothing was changed.', [
        { index: 1, id: 'rec_9999', issue: 'no record with this ID' },
      ]),
    },
  ],
};

const DELETE_RECORDS: DocEndpoint = {
  id: 'delete-records',
  title: 'Delete records',
  method: 'DELETE',
  path: '/bases/{base}/tables/{table}/records/{record}',
  summary:
    'Deletes one record with DELETE, or up to 100 with POST /records/delete and {"ids": [...]}. Deleting is permanent.',
  params: [
    { name: 'record', in: 'path', description: 'The record, as for Get a record (rec_1042, records/A1, or records/by-key?key[SKU]=A1&key[Region]=EU), for a single delete.' },
    { name: 'ids', in: 'body', description: 'For many records (POST /records/delete): record IDs, at most 100. When the primary key is other fields, send keys instead: [{"SKU": "A1", "Region": "EU"}].' },
    { name: 'Idempotency-Key', in: 'header', description: 'Optional, on POST /records/delete.' },
  ],
  notes: ['All or nothing: if any ID does not exist, nothing is deleted.'],
  examples: [
    {
      title: 'Delete one record',
      method: 'DELETE',
      path: `${RECORDS}/rec_1044`,
      status: 200,
      response: ok({ id: 'rec_1044', deleted: true }),
    },
    {
      title: 'Delete many records',
      method: 'POST',
      path: `${RECORDS}/delete`,
      body: { ids: ['rec_1046', 'rec_1047'] },
      status: 200,
      response: ok([
        { id: 'rec_1046', deleted: true },
        { id: 'rec_1047', deleted: true },
      ]),
    },
    {
      title: 'One of the records does not exist',
      method: 'POST',
      path: `${RECORDS}/delete`,
      body: { ids: ['rec_1046', 'rec_9999'] },
      status: 404,
      response: fail('not_found', 'Some records don\'t exist. Nothing was deleted.', [
        { id: 'rec_9999', issue: 'no record with this ID' },
      ]),
    },
  ],
};

export const ENDPOINT_GROUPS: DocGroup[] = [
  { id: 'bases-and-tables', title: 'Bases and tables', endpoints: [LIST_BASES, LIST_TABLES, GET_TABLE] },
  { id: 'records', title: 'Records', endpoints: [LIST_RECORDS, QUERY_RECORDS, QUERY_RECORDS_WITH_QUERY, GET_RECORD, CREATE_RECORDS, UPDATE_RECORDS, DELETE_RECORDS] },
];

// ---- Reference ----

export const ENDPOINT_SUMMARY: { method: HttpMethod; path: string; does: string }[] = [
  { method: 'GET', path: '/bases', does: 'List bases' },
  { method: 'GET', path: '/bases/{base}/tables', does: 'List tables' },
  { method: 'GET', path: '/bases/{base}/tables/{table}', does: 'Get a table and its fields' },
  { method: 'GET', path: '/bases/{base}/tables/{table}/records', does: 'List records' },
  { method: 'POST', path: '/bases/{base}/tables/{table}/records/query', does: 'Find records with or / not filters' },
  { method: 'QUERY', path: '/bases/{base}/tables/{table}/records/query', does: 'The same as POST, with the HTTP QUERY method' },
  { method: 'GET', path: '/bases/{base}/tables/{table}/records/{record}', does: 'Get a record' },
  { method: 'POST', path: '/bases/{base}/tables/{table}/records', does: 'Create one or many records' },
  { method: 'PATCH', path: '/bases/{base}/tables/{table}/records/{record}', does: 'Update a record' },
  { method: 'PATCH', path: '/bases/{base}/tables/{table}/records', does: 'Update many records' },
  { method: 'DELETE', path: '/bases/{base}/tables/{table}/records/{record}', does: 'Delete a record' },
  { method: 'POST', path: '/bases/{base}/tables/{table}/records/delete', does: 'Delete many records' },
];

export const ID_PREFIXES: { prefix: string; what: string; example: string }[] = [
  { prefix: 'ws_', what: 'Workspace (part of the base URL)', example: 'ws_8f3k2m9qx7' },
  { prefix: 'bse_', what: 'Base', example: IDS.crm },
  { prefix: 'tbl_', what: 'Table', example: IDS.orders },
  { prefix: 'fld_', what: 'Field', example: IDS.name },
  { prefix: 'rec_', what: 'Record', example: 'rec_1042' },
];

const TEXT_FILTERS = 'eq, neq, gt, gte, lt, lte, in, contains, is_null';
const VALUE_FILTERS = 'eq, neq, gt, gte, lt, lte, in, is_null';

export const FIELD_VALUES: { type: string; write: string; example: string; filters: string }[] = [
  { type: 'text, long_text', write: 'Text', example: '"Order 1042"', filters: TEXT_FILTERS },
  { type: 'email', write: 'A valid email address when the email check of the field is on; any text when it is off', example: '"asha@example.com"', filters: TEXT_FILTERS },
  { type: 'url', write: 'A web address like example.com/page when the URL check of the field is on (off by default); any text when it is off', example: '"https://example.com"', filters: TEXT_FILTERS },
  { type: 'phone_number', write: 'When the phone check of the field is on: an optional + and up to 16 digits, not starting with 0, with spaces, dashes or brackets allowed; any text when it is off', example: '"+91 98765 43210"', filters: TEXT_FILTERS },
  { type: 'number', write: 'A whole number', example: '12', filters: VALUE_FILTERS },
  { type: 'decimal, currency, percent', write: 'A number. Decimal values are rounded to the decimal places set on the field, percent values to 1 decimal', example: '499.5', filters: VALUE_FILTERS },
  { type: 'rating', write: 'A whole number from 0 to the field\'s maximum', example: '4', filters: VALUE_FILTERS },
  { type: 'year', write: 'A whole number from 1 to 9999', example: '2026', filters: VALUE_FILTERS },
  { type: 'duration', write: 'Whole minutes, 0 or more', example: '90', filters: VALUE_FILTERS },
  { type: 'date', write: 'YYYY-MM-DD', example: '"2026-11-03"', filters: VALUE_FILTERS },
  { type: 'date_time', write: 'RFC 3339 with a time zone; returned in UTC', example: '"2026-11-03T10:15:00Z"', filters: VALUE_FILTERS },
  { type: 'time', write: 'HH:mm (24-hour) or 12-hour like 2:15 PM; returned as HH:mm', example: '"14:15"', filters: TEXT_FILTERS },
  { type: 'checkbox', write: 'true or false', example: 'true', filters: 'eq, neq, is_null' },
  { type: 'single_select', write: 'The name of one of the field\'s options', example: '"Active"', filters: TEXT_FILTERS },
  { type: 'multi_select', write: 'A list of option names', example: '["Urgent", "Gift"]', filters: 'contains (one option), is_null' },
  { type: 'json', write: 'Any JSON value', example: '{"size": "M"}', filters: 'Can\'t be filtered' },
  { type: 'uuid', write: 'A UUID (auto-generated UUID fields are read-only)', example: '"0b6f3c1e-…"', filters: TEXT_FILTERS },
  { type: 'links', write: 'Record IDs, or the objects it returns (one-record writes only). Read back as objects: id plus the lookups through the link, and with expand the linked record\'s fields', example: '["rec_12"]', filters: 'contains (a record ID), is_null' },
];

export const READ_ONLY_VALUES: { type: string; read: string }[] = [
  { type: 'lookup', read: 'Not a key of its own: its value is in each object of its link field, under the looked-up field\'s name. Can\'t be used to filter or sort' },
  { type: 'formula', read: 'The computed value. Calculated when read, so it can\'t be used to filter or sort' },
  { type: 'attachment', read: 'A list of {id, url, name, size, type}' },
  { type: 'user', read: 'A user ID, or a list of user IDs' },
  { type: 'created_time, last_modified_time', read: 'Date and time in UTC' },
  { type: 'created_by, last_modified_by', read: 'A user ID' },
];

export const ERROR_CODES: { code: string; status: number; when: string }[] = [
  { code: 'bad_request', status: 400, when: 'Malformed JSON, a bad query parameter or where tree, a cursor reused with another filter or sort, or the same ID twice in a bulk request' },
  { code: 'not_found', status: 404, when: 'The workspace, base, table, field or record doesn\'t exist, or the workspace API is off' },
  { code: 'ambiguous_name', status: 409, when: 'A name matches more than one base, table or field; details lists their IDs' },
  { code: 'conflict', status: 409, when: 'An Idempotency-Key reused with a different body, or still running; or the table was busy with other changes, so nothing was saved: try again' },
  { code: 'payload_too_large', status: 413, when: 'More than 100 records in one request' },
  { code: 'validation_failed', status: 422, when: 'A wrong value type, unknown or read-only field, unknown option, link field in a bulk write, duplicate key, failed check, or a table automation that rejected the change (its own message is shown)' },
  { code: 'rate_limited', status: 429, when: 'Too many requests for the workspace; wait for Retry-After seconds' },
  { code: 'internal_error', status: 500, when: 'A server error; quote meta.request_id when you report it. If an automation on the table failed, the message says so: check the automations of the table' },
  { code: 'query_timeout', status: 503, when: 'A read ran longer than 10 seconds and was stopped; narrow the filter or search, expand fewer fields, or ask for a smaller page' },
];

export const RESPONSE_EXAMPLES = {
  one: ok({ id: 'rec_1042', fields: { Name: 'Order 1042' }, created_at: '2026-11-03T10:15:00Z', updated_at: '2026-11-03T10:15:00Z' }),
  list: page([{ id: 'rec_1042', fields: { Name: 'Order 1042' }, created_at: '2026-11-03T10:15:00Z', updated_at: '2026-11-03T10:15:00Z' }], CURSOR_PAGE_2, 1),
  error: fail('validation_failed', 'Some fields have invalid values. Nothing was saved.', [{ field: 'Price', issue: 'must be a number' }]),
};

const IDEMPOTENT_BODY = { fields: { Name: 'Order 1051', Price: 60, Paid: false } };
const IDEMPOTENT_RECORD = ok(record('rec_1051', { Name: 'Order 1051', Price: 60, Paid: false }, '2026-11-04T11:00:00Z'));

export const IDEMPOTENCY_EXAMPLES: DocExample[] = [
  {
    title: 'First request',
    method: 'POST',
    path: RECORDS,
    headers: { 'Idempotency-Key': 'order-1051' },
    body: IDEMPOTENT_BODY,
    status: 201,
    response: IDEMPOTENT_RECORD,
  },
  {
    title: 'The same request sent again',
    description: 'The first response comes back, with Idempotent-Replayed: true. No second record is created.',
    method: 'POST',
    path: RECORDS,
    headers: { 'Idempotency-Key': 'order-1051' },
    body: IDEMPOTENT_BODY,
    status: 201,
    responseHeaders: { 'Idempotent-Replayed': 'true' },
    response: IDEMPOTENT_RECORD,
  },
  {
    title: 'The same key with a different body',
    method: 'POST',
    path: RECORDS,
    headers: { 'Idempotency-Key': 'order-1051' },
    body: { fields: { Name: 'Order 1052' } },
    status: 409,
    response: fail('conflict', 'This Idempotency-Key was already used with a different request. Use a new key for a new request.'),
  },
];

export const RATE_LIMIT_EXAMPLE: DocExample = {
  title: 'Too many requests',
  method: 'GET',
  path: RECORDS,
  status: 429,
  responseHeaders: { 'Retry-After': '12' },
  response: fail('rate_limited', 'Too many requests: this workspace allows 600 per minute. Try again after the time in Retry-After.'),
};
