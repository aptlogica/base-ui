import { test, expect } from '@playwright/test';
import { requireAuthEnv, login } from './helpers';

test('login flow lands on dashboard', async ({ page }) => {
  requireAuthEnv();
  await login(page);
  await expect(page.getByRole('heading', { name: /all bases/i })).toBeVisible();
});
