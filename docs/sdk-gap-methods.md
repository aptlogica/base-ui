# SDK methods for the former gap endpoints

This page lists the SDK methods that replace the 16 calls `base-ui` made through the private HTTP client
(`(client as any).http.*`). For each method it gives the call to use, its arguments, the response, and the
errors. A mapping table for the UI migration is at the end.

All methods are called on a `SereniBaseClient` instance:

```ts
import SereniBaseClient from 'serenibase-sdk';
import type { PrimaryKeyViolation /* , ...other types */ } from 'serenibase-sdk';

const client = new SereniBaseClient({ baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1` });
```

## Common behaviour

- **Return value:** every method returns `Promise<StandardResponse<T>>`, so the payload is in `res.data`.
- **Headers:** `Authorization`, `workspace` and `base` are sent by the client as before. You don't pass them per call.
- **Errors:** a failed call throws an `Error` with `message`, `code` (e.g. `PKY_1004`), `status` (HTTP status)
  and `details` (from `error.details` in the response body, when the server sends it).

```ts
try {
  await client.tableService.updatePrimaryKey(tableId, columnIds);
} catch (err: any) {
  if (err.code === 'PKY_1004') {
    const v = err.details as PrimaryKeyViolation;
    // v.null_records, v.duplicates, ...
  }
}
```

## Where each method lives

| Area | Accessor | Source file |
|---|---|---|
| Base `meta` | `client.baseService` | [src/services/base-service.ts](../src/services/base-service.ts) |
| Row upsert | `client.rowService` (also `client.tableService.insertRowData`) | [src/services/row-service.ts](../src/services/row-service.ts) |
| Automations | `client.automationService` | [src/services/automation-service.ts](../src/services/automation-service.ts) |
| Primary key | `client.tableService` | [src/services/table-service.ts](../src/services/table-service.ts) |
| Table constraints | `client.constraintService` | [src/services/table-constraint-service.ts](../src/services/table-constraint-service.ts) |
| Token refresh hook | `client.on` / `client.off` | [src/index.ts](../src/index.ts) |

Types: [src/types/base.ts](../src/types/base.ts), [src/types/table.ts](../src/types/table.ts),
[src/types/automation.ts](../src/types/automation.ts), [src/types/table-constraint.ts](../src/types/table-constraint.ts).
They are all exported from the package root.

---

## 1. Base create / update with `meta`

### `client.baseService.create(params: CreateBase)`

`POST /base/create` (multipart)

| Arg | Type | Required | Notes |
|---|---|---|---|
| `title` | `string` | yes | |
| `description` | `string` | yes (type) | Sent only if non-empty |
| `workspace_id` | `string` | yes | |
| `image` | `File \| Blob` | no | |
| `meta` | `Record<string, unknown>` | no | **New.** Sent as `JSON.stringify(meta)` |

```ts
await client.baseService.create({
  title: 'Sales',
  description: '',
  workspace_id: wsId,
  meta: { date_format: 'DD/MM/YYYY' },
});
```

### `client.baseService.update(id: string, params: UpdateBase)`

`PUT /base/:id` (multipart)

| Arg | Type | Notes |
|---|---|---|
| `id` | `string` | Base ID |
| `params.title` / `description` / `icon` / `status` / `visibility` | `string` | Optional |
| `params.image` | `File \| Blob` | Uploaded after the update |
| `params.removeImage` | `boolean` | Deletes the image when no `image` is given |
| `params.meta` | `Record<string, unknown>` | **New.** Sent as a JSON string. **Replaces** the stored meta, so send the full object |

```ts
// Pinned tables: merge with the existing meta yourself, because the server replaces it
await client.baseService.update(baseId, {
  meta: { ...base.meta, pinnedTables: ['tbl_1', 'tbl_2'] },
});
```

This fixes the bug where pinned tables were not saved. Before this change `update()` never sent `meta`.

---

## 2. Row upsert: `POST /row/data/insert`

### `client.rowService.upsert(params: UpsertRow)` (new, recommended)

| Arg | Type | Required | Notes |
|---|---|---|---|
| `model_id` | `string` | yes | Table ID |
| `row_id` | `number` | no | Omit to **create**; set to **update** that record |
| `values` | `Record<columnId, any>` | yes | On create in a table with a custom primary key, every key field is required |

### `client.rowService.insertData(params: InsertRowData)` (existing, now looser)

Same route. Use it if you need the single-cell form:

| Arg | Type | Required |
|---|---|---|
| `model_id` | `string` | yes |
| `row_id` | `number` | no (was required) |
| `column_id` | `string` | no (was required) |
| `value` | `any` | no (was required) |
| `values` | `Record<columnId, any>` | no (new) |

`client.tableService.insertRowData(params)` delegates to the same call.

**Response `data`:** `UpsertRowResult`, which is `{ record: Record<string, any>; related_record?: Record<string, any> }`

```ts
// create
const { data } = await client.rowService.upsert({ model_id: tableId, values: { [colId]: 'Alice' } });
// update
await client.rowService.upsert({ model_id: tableId, row_id: 42, values: { [colId]: 'Bob' } });
// single cell (old shape)
await client.rowService.insertData({ model_id: tableId, row_id: 42, column_id: colId, value: 'Bob' });
```

**Errors:** `PKY_1007` key field empty · `PKY_1008` key value already used · `TCN_1012` unique key violation.

---

## 3–8. Automations: `client.automationService`

| Method | HTTP | Args | Response `data` | Permission |
|---|---|---|---|---|
| `list(modelId)` | `GET /automation?model_id=` | `modelId: string` | `Automation[]` | Automations · Read |
| `create(params)` | `POST /automation/create` | `CreateAutomation` | `Automation` | Automations · Create |
| `update(id, params)` | `PUT /automation/:id` | `id: string`, `UpdateAutomation` | `Automation` | Automations · Update |
| `run(id)` | `POST /automation/:id/run` | `id: string` | `Automation` | Automations · Update |
| `validate(params)` | `POST /automation/validate` | `ValidateAutomation` | `AutomationValidationResult` | Automations · Update |
| `delete(id)` | `DELETE /automation/:id` | `id: string` | none | Automations · Delete |

### Argument types

```ts
type AutomationType = 'trigger' | 'webhook' | 'function';

interface CreateAutomation {
  model_id: string;      // required
  title: string;         // required
  type: AutomationType;  // required
  context: string;       // required: SQL / webhook body
  event?: string;        // triggers only, e.g. "BEFORE INSERT, BEFORE UPDATE"
}

interface UpdateAutomation {   // table and type cannot change
  title: string;
  context: string;
  event?: string;
}

interface ValidateAutomation {
  model_id: string;
  id?: string;           // set when editing an existing automation
  type: 'trigger' | 'function';
  context: string;
  event?: string;
}
```

### Response types

```ts
interface Automation {
  id: string; model_id: string; title?: string; type: AutomationType;
  context: string; event?: string;
  created_by?: string; last_modified_by?: string;
  created_time?: string; last_modified_time?: string;
}

interface AutomationValidationResult { valid: boolean; message?: string }
```

### Behaviour

- `create` and `update` only save the definition. Call `run(id)` to apply it in Postgres.
- `validate` runs the query in a rolled-back transaction and changes nothing.
- `delete` also drops the trigger from the table.

```ts
const check = await client.automationService.validate({ model_id: tableId, type: 'trigger', context: sql, event: 'BEFORE INSERT' });
if (check.data?.valid) {
  const { data: a } = await client.automationService.create({ model_id: tableId, title: 'Audit', type: 'trigger', context: sql, event: 'BEFORE INSERT' });
  await client.automationService.run(a!.id);
}
```

**Errors:** `AUT_1001` not found · `AUT_1002` invalid trigger query · `AUT_1003` trigger failed ·
`AUT_1005` title required · `AUT_1006` title too long · `AUT_1007` invalid function query ·
`AUT_1009` trigger still uses the function · `AUT_1010` invalid trigger event.

---

## 9–10. Primary key: `client.tableService`

| Method | HTTP | Args | Response `data` | Permission |
|---|---|---|---|---|
| `getPrimaryKey(tableId)` | `GET /table/:id/primary-key` | `tableId: string` | `PrimaryKey` | Table · Read |
| `updatePrimaryKey(tableId, columnIds)` | `PUT /table/:id/primary-key` | `tableId: string`, `columnIds: string[]` (key order) | `PrimaryKey` | Table · Update |

`updatePrimaryKey` sends `{ column_ids: columnIds }`. You pass the array, not the object.

```ts
interface PrimaryKey {
  model_id: string;
  column_ids: string[];       // key order
  column_names: string[];
  locked: boolean;            // true while link fields store this table's key values
  link_columns: string[];
  columns: PrimaryKeyColumn[];
}

interface PrimaryKeyColumn {
  id: string; title: string; column_name: string; uidt: string;
  system: boolean; in_key: boolean; eligible: boolean;
  reason?: string;            // why it can't be a key field
}
```

```ts
const { data: pk } = await client.tableService.getPrimaryKey(tableId);
const eligible = pk!.columns.filter(c => c.eligible);
await client.tableService.updatePrimaryKey(tableId, ['col_a', 'col_b']);
```

**`PKY_1004` details:** when existing data breaks the new key, `err.details` is a `PrimaryKeyViolation`:

```ts
interface PrimaryKeyViolation {
  message: string;
  columns: string[];
  column_titles: string[];
  null_count: number;
  empty_fields: { column: string; title: string; count: number }[];
  null_records: { id: number; title: string; missing?: string[] }[];
  duplicate_groups: number;
  duplicates: { values: Record<string, unknown>; count: number; record_ids: number[] }[];
}
```

**Errors:** `PKY_1001` required · `PKY_1002` column invalid · `PKY_1003` locked (table has link fields) ·
`PKY_1004` existing data invalid · `PKY_1005` update failed · `PKY_1006` column is in the key ·
`PKY_1007` empty key value · `PKY_1008` duplicate key value.

---

## 11–15. Table constraints: `client.constraintService`

| Method | HTTP | Args | Response `data` | Permission |
|---|---|---|---|---|
| `list(modelId, type)` | `GET /table-constraint?model_id=&type=` | `modelId: string`, `type: TableConstraintType` | `TableConstraint[]` | Table · Read |
| `check(params)` | `POST /table-constraint/check` | `CheckTableConstraint` | `ConstraintCheckResult` | Table · Read |
| `create(params)` | `POST /table-constraint/create` | `CreateTableConstraint` | `TableConstraint` | Table · Update |
| `update(id, params)` | `PUT /table-constraint/:id` | `id: string`, `UpdateTableConstraint` | `TableConstraint` | Table · Update |
| `delete(id)` | `DELETE /table-constraint/:id` | `id: string` | none | Table · Update |

### Argument types

```ts
type TableConstraintType = 'unique' | 'primary' | 'check';  // backend accepts only 'unique' today

interface CheckTableConstraint  { model_id: string; column_ids: string[] }                 // min 1 column
interface CreateTableConstraint { model_id: string; type: TableConstraintType; title: string; column_ids: string[] }
interface UpdateTableConstraint { title: string; column_ids: string[] }                    // table and type cannot change
```

### Response types

```ts
interface TableConstraint {
  id: string;
  title: string;
  constraint_name: string;               // Postgres name
  columns: { id: string; title: string }[];  // key order
  status: 'ok' | 'missing';              // 'missing' = Postgres constraint no longer exists
}

interface ConstraintCheckResult { valid: boolean; message?: string }
```

```ts
const { data: list } = await client.constraintService.list(tableId, 'unique');
const { data: check } = await client.constraintService.check({ model_id: tableId, column_ids: [emailCol] });
if (check?.valid) {
  await client.constraintService.create({ model_id: tableId, type: 'unique', title: 'Unique email', column_ids: [emailCol] });
}
```

**Errors:** `TCN_1001` not found · `TCN_1002` title required · `TCN_1003` title too long ·
`TCN_1004` column not found · `TCN_1005` column not allowed · `TCN_1007` repeated column ·
`TCN_1008` already exists · `TCN_1009` duplicate values · `TCN_1010` constraint failed ·
`TCN_1011` column used in a constraint · `TCN_1012` unique key violation (on row writes) ·
`TCN_1013` type required.

---

## 16. Token refresh hook

No new method is needed. Use the public event API instead of `(client as any).http.on`:

```ts
client.on('response-error', handler);   // handler receives the raw axios error
client.off('response-error', handler);
```

Other events: `request`, `request-error`, `response`.

---

## UI migration map (`base-ui/src/service/clientService.ts`)

| UI function | Before | After |
|---|---|---|
| `createBaseService` | manual multipart via `http.post` when `meta` set | `client.baseService.create(params)` |
| `updateBaseService` | `client.baseService.update(id, params)` (meta dropped) | same call, `meta` now sent |
| `upsertRowService` | `http.post('/row/data/insert', params)` | `client.rowService.upsert(params)` or `.insertData(params)` |
| `getAutomationsService` | `http.get('/automation?model_id=')` | `client.automationService.list(modelId)` |
| `createAutomationService` | `http.post('/automation/create')` | `client.automationService.create(params)` |
| `updateAutomationService` | `http.put('/automation/:id')` | `client.automationService.update(id, params)` |
| `runAutomationService` | `http.post('/automation/:id/run')` | `client.automationService.run(id)` |
| `validateAutomationService` | `http.post('/automation/validate')` | `client.automationService.validate(params)` |
| `deleteAutomationService` | `http.delete('/automation/:id')` | `client.automationService.delete(id)` |
| `getPrimaryKeyService` | `http.get('/table/:id/primary-key')` | `client.tableService.getPrimaryKey(tableId)` |
| `updatePrimaryKeyService` | `http.put('/table/:id/primary-key', { column_ids })` | `client.tableService.updatePrimaryKey(tableId, columnIds)` |
| `getTableConstraintsService` | `http.get('/table-constraint?...')` | `client.constraintService.list(modelId, type)` |
| `checkTableConstraintService` | `http.post('/table-constraint/check')` | `client.constraintService.check(params)` |
| `createTableConstraintService` | `http.post('/table-constraint/create')` | `client.constraintService.create(params)` |
| `updateTableConstraintService` | `http.put('/table-constraint/:id')` | `client.constraintService.update(id, params)` |
| `deleteTableConstraintService` | `http.delete('/table-constraint/:id')` | `client.constraintService.delete(id)` |
| token refresh setup | `(client as any).http.on('response-error', …)` | `client.on('response-error', …)` |

After switching:

- Remove the local `Automation`, `PrimaryKey` and `TableConstraint` interfaces and import them from `serenibase-sdk`.
- Drop the `// @ts-ignore` on the SDK import, because `dist/index.d.ts` now includes these types.
- Update `src/test/setup.ts` mocks to mock `client.automationService`, `client.constraintService`,
  `client.tableService.getPrimaryKey/updatePrimaryKey` and `client.rowService.upsert` instead of `client.http`.
- Bump the SDK version, rebuild the tgz and update `base-ui/package.json`.
