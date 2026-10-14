# SDK gaps: API calls the UI makes outside the SDK

> **Status: resolved in the UI.** All 16 items below now go through SDK methods (see
> [sdk-gap-methods.md](sdk-gap-methods.md)); `clientService.ts` no longer uses `(client as any).http`.
> The SDK tgz must also include the data-cleaning methods (`columnService.trimWhitespace` etc.,
> SDK branch `data-cleaning-features`) before release.

The UI should talk to the backend only through `serenibase-sdk` (`client.<service>.<method>()`).
All calls go through [src/service/clientService.ts](../src/service/clientService.ts). Most of them use
SDK methods, but **16 endpoints are called through the SDK's private HTTP client**
(`(client as any).http.get/post/put/delete`), because the SDK has no method for them yet.

No component calls `fetch`/`axios` against the API directly. The only `fetch` is
[PluginConfigManager.ts](../src/utils/PluginConfigManager.ts), which loads a static plugin config file
and is not an API call.

Checked against: `base-ui` (current), `base-sdk` source (`src/`) and the installed bundle
`node_modules/serenibase-sdk` (1.0.0), backend `sereni-base` branch `feat/composite-primary-key`.

---

## Summary

| # | Endpoint | UI function | Why it bypasses the SDK | SDK change needed |
|---|----------|-------------|-------------------------|-------------------|
| 1 | `POST /base/create` (with `meta`) | `createBaseService` | SDK `baseService.create()` doesn't send `meta` | Add `meta` to `CreateBase` |
| 2 | `POST /row/data/insert` (upsert with `values`) | `upsertRowService` | SDK `InsertRowData` type only has `column_id`/`value` | Extend type or add `rowService.upsert()` |
| 3 | `GET /automation?model_id=` | `getAutomationsService` | No automation service | New `AutomationService` |
| 4 | `POST /automation/create` | `createAutomationService` | 〃 | 〃 |
| 5 | `PUT /automation/:id` | `updateAutomationService` | 〃 | 〃 |
| 6 | `POST /automation/:id/run` | `runAutomationService` | 〃 | 〃 |
| 7 | `POST /automation/validate` | `validateAutomationService` | 〃 | 〃 |
| 8 | `DELETE /automation/:id` | `deleteAutomationService` | 〃 | 〃 |
| 9 | `GET /table/:id/primary-key` | `getPrimaryKeyService` | No primary key methods | Add to `TableService` |
| 10 | `PUT /table/:id/primary-key` | `updatePrimaryKeyService` | 〃 | 〃 |
| 11 | `GET /table-constraint?model_id=&type=` | `getTableConstraintsService` | No constraint service | New `TableConstraintService` |
| 12 | `POST /table-constraint/check` | `checkTableConstraintService` | 〃 | 〃 |
| 13 | `POST /table-constraint/create` | `createTableConstraintService` | 〃 | 〃 |
| 14 | `PUT /table-constraint/:id` | `updateTableConstraintService` | 〃 | 〃 |
| 15 | `DELETE /table-constraint/:id` | `deleteTableConstraintService` | 〃 | 〃 |
| 16 | *(event hook)* `http.on('response-error')` | token refresh setup | Uses private `http` | **None.** The SDK already has a public `client.on()`. Fix this in the UI only |

### Bug found while checking: base `meta` is lost on update

`updateBaseService` → SDK `baseService.update()` only appends `title`, `description`, `icon`, `status`,
`visibility`, `image`. **It never sends `meta`**, but the UI relies on it:

- [Sidebar.tsx:126-155](../src/components/layout/sidebar/Sidebar.tsx#L126-L155) saves pinned tables as
  `updates.meta.pinnedTables`

The backend `PUT /base/:id` does accept `meta` as a multipart field (a JSON string that replaces the
existing meta), so the request succeeds but pinned tables are not saved. Fix: add `meta` to `UpdateBase`
(see item 1).

---

## Common to every endpoint below

- **Base URL:** `${VITE_API_BASE_URL}/api/v1`. Paths below are relative to that.
- **Headers:** `Authorization: Bearer <token>`, `workspace: <id>`, `base: <id>`. The SDK `HttpClient`
  already sends these, so the new methods need no extra header handling.
- **Response envelope:** `{ data: <payload>, meta: { code, message } }`. On error the body holds
  `error.code` and `error.message`, and `error.details` where noted. UI callers read `.data`.
- **Permissions:** enforced on the server. Listed per group so SDK docs can mention them.

---

## 1. Base create/update with `meta`

**UI today:** [clientService.ts `createBaseService`](../src/service/clientService.ts#L690-L710) builds the
multipart request itself when `params.meta` is set.

| | |
|---|---|
| Endpoints | `POST /base/create`, `PUT /base/:id` (both `multipart/form-data`) |
| New field | `meta`: a JSON object, sent as a **JSON string** form field (`JSON.stringify(meta)`) |
| Server behaviour | Must be a JSON object; on update it **replaces** the stored meta (not merged) |
| Used for | Base-level format defaults (create), `pinnedTables` (update) |

**SDK change** (`src/types/base.ts`, `src/services/base-service.ts`):

```ts
export interface CreateBase {
  title: string;
  description: string;
  workspace_id: string;
  image?: File | Blob;
  meta?: Record<string, unknown>;   // new
}

export interface UpdateBase {
  // ...existing fields
  meta?: Record<string, unknown>;   // new
}

// in create() and update():
if (params.meta !== undefined) {
  formData.append('meta', JSON.stringify(params.meta));
}
```

**UI follow-up:** `createBaseService` becomes `client.baseService.create(params)` in every case.

---

## 2. Row upsert: `POST /row/data/insert`

**UI today:** `upsertRowService` → `(client as any).http.post('/row/data/insert', params)`.

The SDK has `rowService.insertData()` / `tableService.insertRowData()` for this route, but their type
(`InsertRowData`) only allows the old single-cell shape. The backend now works as an upsert.

| | |
|---|---|
| Method / path | `POST /row/data/insert` (JSON) |
| Request | `model_id` (required) · `row_id?` · `column_id?` · `value?` · `values?: Record<columnId, any>` |
| Behaviour | No `row_id`: **creates** a record from `values`. On a table with a custom primary key, every key field is required. With `row_id`: **updates** that record from `values`, and/or a single cell via `column_id` + `value`. Everything is saved in one statement. |
| Response | `{ data: { record: Record<string, any>, related_record?: Record<string, any> } }` |
| Errors | `PKY_1007` (key field empty), `PKY_1008` (key value already used), `TCN_1012` (unique key violation) |

**SDK change** (`src/types/table.ts`):

```ts
export interface InsertRowData {
  model_id: string;
  row_id?: number;                    // was required
  column_id?: string;                 // was required
  value?: any;                        // was required
  values?: Record<string, any>;       // new: column ID -> value
}
```

Optionally add a clearer alias: `rowService.upsert(params: { model_id; row_id?; values })`.

---

## 3–8. Automations (`/automation`)

**UI today:** [clientService.ts:1155-1206](../src/service/clientService.ts#L1155-L1206).
Backend: [handlers/automation.go](../../sereni-base/internal/handlers/automation.go),
[dto/automation.go](../../sereni-base/internal/dto/automation.go).

**Suggested SDK shape:** new `src/services/automation-service.ts`, exposed as `client.automationService`.

| SDK method | HTTP | Request | Response `data` | Permission |
|---|---|---|---|---|
| `list(modelId)` | `GET /automation?model_id=` | query `model_id` | `Automation[]` | Automations · Read |
| `create(params)` | `POST /automation/create` | `CreateAutomation` | `Automation` | Automations · Create |
| `update(id, params)` | `PUT /automation/:id` | `UpdateAutomation` | `Automation` | Automations · Update |
| `run(id)` | `POST /automation/:id/run` | none | `Automation` | Automations · Update |
| `validate(params)` | `POST /automation/validate` | `ValidateAutomation` | `AutomationValidationResult` | Automations · Update |
| `delete(id)` | `DELETE /automation/:id` | none | none | Automations · Delete |

**Types** (`src/types/automation.ts`):

```ts
export type AutomationType = 'trigger' | 'webhook' | 'function';

export interface Automation {
  id: string;
  model_id: string;
  title?: string;
  type: AutomationType;
  context: string;            // SQL / webhook body
  event?: string;             // triggers only, e.g. "BEFORE INSERT, BEFORE UPDATE"
  created_by?: string;
  last_modified_by?: string;
  created_time?: string;
  last_modified_time?: string;
}

export interface CreateAutomation {
  model_id: string;           // required
  title: string;              // required
  type: AutomationType;       // required
  context: string;            // required
  event?: string;
}

export interface UpdateAutomation {   // table and type cannot change
  title: string;              // required
  context: string;            // required
  event?: string;
}

export interface ValidateAutomation {
  model_id: string;
  id?: string;                // set when editing; checked as a replacement of what it installed
  type: 'trigger' | 'function';
  context: string;
  event?: string;
}

export interface AutomationValidationResult {
  valid: boolean;
  message?: string;           // Postgres' reason when not valid
}
```

**Behaviour to document:**
- `create`/`update` save the definition. `run` applies it in Postgres.
- `validate` runs the query in a rolled-back transaction and changes nothing.
- `delete` also drops the trigger from the table.

**Errors:** `AUT_1001` not found · `AUT_1002` invalid trigger query · `AUT_1003` trigger failed ·
`AUT_1005` title required · `AUT_1006` title too long · `AUT_1007` invalid function query ·
`AUT_1009` trigger still uses the function · `AUT_1010` invalid trigger event.

---

## 9–10. Primary key (`/table/:id/primary-key`)

**UI today:** [clientService.ts:1208-1257](../src/service/clientService.ts#L1208-L1257).
Backend: [handlers/primary_key.go](../../sereni-base/internal/handlers/primary_key.go),
[dto/primary_key.go](../../sereni-base/internal/dto/primary_key.go).

**Suggested SDK shape:** add methods to the existing `TableService`, since the route lives under `/table`.

| SDK method | HTTP | Request | Response `data` | Permission |
|---|---|---|---|---|
| `getPrimaryKey(tableId)` | `GET /table/:id/primary-key` | none | `PrimaryKey` | Table · Read |
| `updatePrimaryKey(tableId, columnIds)` | `PUT /table/:id/primary-key` | `{ column_ids: string[] }` (key order) | `PrimaryKey` | Table · Update |

**Types** (`src/types/table.ts`):

```ts
export interface PrimaryKeyColumn {
  id: string;
  title: string;
  column_name: string;
  uidt: string;
  system: boolean;
  in_key: boolean;
  eligible: boolean;
  reason?: string;            // why it can't be a key field
}

export interface PrimaryKey {
  model_id: string;
  column_ids: string[];       // key order
  column_names: string[];
  locked: boolean;            // true while link fields store this table's key values
  link_columns: string[];
  columns: PrimaryKeyColumn[];
}

// error.details when code === 'PKY_1004'
export interface PrimaryKeyViolation {
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

**Important for the SDK:** the UI reads `error.details` for `PKY_1004` to list the offending records.
Make sure `HttpClient.formatError()` keeps `error.details` from the response body.

**Errors:** `PKY_1001` required · `PKY_1002` column invalid · `PKY_1003` locked (table has link fields) ·
`PKY_1004` existing data invalid (details above) · `PKY_1005` update failed · `PKY_1006` column is in the key ·
`PKY_1007` empty key value · `PKY_1008` duplicate key value.

---

## 11–15. Table constraints (`/table-constraint`)

**UI today:** [clientService.ts:1259-1311](../src/service/clientService.ts#L1259-L1311).
Backend: [handlers/table_constraint.go](../../sereni-base/internal/handlers/table_constraint.go),
[dto/table_constraint.go](../../sereni-base/internal/dto/table_constraint.go).

**Suggested SDK shape:** new `src/services/table-constraint-service.ts`, exposed as `client.constraintService`.

| SDK method | HTTP | Request | Response `data` | Permission |
|---|---|---|---|---|
| `list(modelId, type)` | `GET /table-constraint?model_id=&type=` | query | `TableConstraint[]` | Table · Read |
| `check(params)` | `POST /table-constraint/check` | `{ model_id, column_ids }` | `ConstraintCheckResult` | Table · Read |
| `create(params)` | `POST /table-constraint/create` | `CreateTableConstraint` | `TableConstraint` | Table · Update |
| `update(id, params)` | `PUT /table-constraint/:id` | `{ title, column_ids }` | `TableConstraint` | Table · Update |
| `delete(id)` | `DELETE /table-constraint/:id` | none | none | Table · Update |

**Types** (`src/types/table-constraint.ts`):

```ts
export type TableConstraintType = 'unique' | 'primary' | 'check';  // backend accepts only 'unique' today

export interface ConstraintColumn { id: string; title: string; }

export interface TableConstraint {
  id: string;
  title: string;
  constraint_name: string;    // Postgres name
  columns: ConstraintColumn[];  // key order
  status: 'ok' | 'missing';     // 'missing' = Postgres constraint no longer exists
}

export interface CreateTableConstraint {
  model_id: string;
  type: TableConstraintType;
  title: string;
  column_ids: string[];       // min 1
}

export interface UpdateTableConstraint {   // table and type cannot change
  title: string;
  column_ids: string[];       // min 1
}

export interface CheckTableConstraint {
  model_id: string;
  column_ids: string[];       // min 1
}

export interface ConstraintCheckResult {
  valid: boolean;
  message?: string;           // e.g. Duplicate data in column "EMAIL"...
}
```

**Errors:** `TCN_1001` not found · `TCN_1002` title required · `TCN_1003` title too long ·
`TCN_1004` column not found · `TCN_1005` column not allowed · `TCN_1007` repeated column ·
`TCN_1008` already exists · `TCN_1009` duplicate values · `TCN_1010` constraint failed ·
`TCN_1011` column used in a constraint · `TCN_1012` unique key violation (on row writes) ·
`TCN_1013` type required.

---

## 16. Token refresh hook (UI-only fix)

[clientService.ts:396-447](../src/service/clientService.ts#L396-L447) reaches into the private
`(client as any).http` to call `.on('response-error', …)`. `SereniBaseClient` already exposes the same
thing publicly:

```ts
client.on('response-error', handler);   // public; forwards to http.on()
```

No SDK change is needed. Swap the call in the UI and drop the `if ((client as any).http)` guard.

---

## Checklist for the SDK release

- [ ] `CreateBase` / `UpdateBase`: add `meta`, append it as a JSON string in `create()` and `update()`
- [ ] `InsertRowData`: make `column_id`/`row_id`/`value` optional, add `values` (optional `rowService.upsert`)
- [ ] New `AutomationService` + types, registered as `client.automationService`
- [ ] `TableService.getPrimaryKey` / `updatePrimaryKey` + types
- [ ] New `TableConstraintService` + types, registered as `client.constraintService`
- [ ] Confirm `formatError()` keeps `error.code` and `error.details` (needed for `PKY_1004`)
- [ ] Export all new types from `src/types/index.ts`
- [ ] Ship type declarations (the UI uses `// @ts-ignore` on the SDK import today)
- [ ] Unit tests per new method (path, method, body), following the existing service tests
- [ ] Bump the SDK version, rebuild the tgz, update `base-ui/package.json`

## UI follow-up after the SDK release

- [ ] Replace the 15 `(client as any).http.*` calls in `clientService.ts` with the new SDK methods
- [ ] Simplify `createBaseService` to always call `client.baseService.create()`
- [ ] Switch the token refresh hook to `client.on('response-error', …)`
- [ ] Remove the local `Automation` / `PrimaryKey` / `TableConstraint` interfaces and import them from the SDK
- [ ] Update `src/test/setup.ts` mocks (they currently mock `client.http`)
