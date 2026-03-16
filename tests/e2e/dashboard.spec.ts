import { test, expect } from '@playwright/test';
import { requireAuthEnv, login } from './helpers';

test('dashboard loads after login', async ({ page }) => {
  requireAuthEnv();
  await login(page);
  await expect(page.getByRole('heading', { name: /all bases/i })).toBeVisible();
  await expect(page.getByPlaceholder('Search bases')).toBeVisible();
});
