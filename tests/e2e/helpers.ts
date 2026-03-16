import { expect, Page, test } from '@playwright/test';

export const requireAuthEnv = () => {
  test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, 'E2E_EMAIL/E2E_PASSWORD not set');
};

export const requireDataEnv = () => {
  test.skip(
    !process.env.E2E_WORKSPACE_ID || !process.env.E2E_BASE_ID || !process.env.E2E_TABLE_ID,
    'E2E_WORKSPACE_ID/E2E_BASE_ID/E2E_TABLE_ID not set'
  );
};

export const login = async (page: Page) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL || '');
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD || '');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/workspace/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: /all bases/i })).toBeVisible();
};
