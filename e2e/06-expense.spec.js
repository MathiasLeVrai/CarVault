const { test, expect } = require('@playwright/test');
const { registerUser, addVehicleManual } = require('./helpers');

test('ajout d\'une dépense', async ({ page }) => {
  await registerUser(page);
  await addVehicleManual(page);

  const today = new Date().toISOString().slice(0, 10);

  await page.goto('/expenses');
  await page.getByRole('button', { name: /^ajouter$/i }).first().click();
  await page.getByPlaceholder('85.50').fill('85.50');
  await page.locator('label').filter({ hasText: 'Date' }).locator('..').locator('input[type="date"]').fill(today);
  await page.getByPlaceholder('Description...').fill('Vidange E2E');
  await page.getByRole('button', { name: /^ajouter$/i }).last().click();

  await expect(page.getByText(/85,50/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Vidange E2E')).toBeVisible();
});
