import { test, expect } from '@playwright/test';
import { requireAuthEnv, requireDataEnv, login } from './helpers';

test('database view route renders', async ({ page }) => {
  requireAuthEnv();
  requireDataEnv();
  await login(page);

  const workspaceId = process.env.E2E_WORKSPACE_ID as string;
  const baseId = process.env.E2E_BASE_ID as string;
  const tableId = process.env.E2E_TABLE_ID as string;
  const viewId = process.env.E2E_VIEW_ID || 'grid';

  await page.goto(`/workspace/${workspaceId}/base/${baseId}/table/${tableId}/${viewId}`);
  await expect(page.locator('main')).toBeVisible();
});
