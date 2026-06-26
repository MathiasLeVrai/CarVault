const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { registerUser, addVehicleManual } = require('./helpers');

test('upload d\'un document', async ({ page }) => {
  await registerUser(page);
  await addVehicleManual(page);

  await page.goto('/documents');
  await page.getByRole('button', { name: /^ajouter$/i }).first().click();

  const filePath = path.join(__dirname, 'fixtures', 'sample.pdf');
  await page.locator('input[type="file"]').first().setInputFiles(filePath);

  await page.locator('label').filter({ hasText: 'Type' }).locator('..').locator('select').selectOption('INVOICE');
  await page.getByPlaceholder('Assurance 2026').fill('Facture E2E');
  await page.getByRole('button', { name: /^ajouter$/i }).last().click();

  await expect(page.getByText('Facture E2E')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/1 document/)).toBeVisible();
});
