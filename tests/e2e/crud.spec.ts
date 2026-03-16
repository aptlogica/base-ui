import { test, expect } from '@playwright/test';
import { requireAuthEnv, requireDataEnv } from './helpers';

test('basic CRUD via API', async ({ request }) => {
  requireAuthEnv();
  requireDataEnv();

  test.skip(!process.env.E2E_API_TOKEN, 'E2E_API_TOKEN not set');
  test.skip(!process.env.E2E_COLUMN_ID, 'E2E_COLUMN_ID not set');

  const apiBase = process.env.E2E_API_URL
    ? process.env.E2E_API_URL
    : `${process.env.E2E_BASE_URL || 'http://127.0.0.1:4173'}/api/v1`;

  const workspaceId = process.env.E2E_WORKSPACE_ID as string;
  const baseId = process.env.E2E_BASE_ID as string;
  const tableId = process.env.E2E_TABLE_ID as string;
  const columnId = process.env.E2E_COLUMN_ID as string;

  const headers = {
    Authorization: `Bearer ${process.env.E2E_API_TOKEN}`,
    workspace: workspaceId,
    base: baseId,
    'Content-Type': 'application/json',
  };

  const createResp = await request.post(`${apiBase}/row/create`, {
    headers,
    data: { model_id: tableId },
  expect(createResp.ok()).toBeTruthy();
  const createBody = await createResp.json();
  const rowId = createBody?.data?.record?.id || createBody?.data?.record?.row_id;
  expect(rowId).toBeTruthy();

  const updateResp = await request.post(`${apiBase}/row/data/insert`, {
    headers,
    data: { model_id: tableId, column_id: columnId, row_id: rowId, value: 'e2e-test' },
  });
  expect(updateResp.ok()).toBeTruthy();

  const deleteResp = await request.post(`${apiBase}/row/remove`, {
    headers,
    data: { model_id: tableId, row_id: rowId },
  });
  expect(deleteResp.ok()).toBeTruthy();
});
