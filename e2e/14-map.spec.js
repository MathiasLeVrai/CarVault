const { test, expect } = require('@playwright/test');
const { registerUser } = require('./helpers');

test('page carte des services accessible', async ({ page }) => {
  await registerUser(page);
  await page.goto('/map');
  await expect(page.getByRole('heading', { name: 'Carte des services' })).toBeVisible();
  await expect(page.getByRole('button', { name: /ma position/i })).toBeVisible();
});
