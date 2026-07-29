const { test, expect } = require('@playwright/test');
const { registerUser, addVehicleManual } = require('./helpers');

test('ouverture de la fiche véhicule', async ({ page }) => {
  await registerUser(page);
  await addVehicleManual(page, { brand: 'Renault', model: 'Clio', year: '2020' });

  await page.getByRole('heading', { name: 'Renault Clio', level: 3 }).click();
  await expect(page).toHaveURL(/\/vehicles\/.+/);
  await expect(page.getByRole('heading', { name: /Renault/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Historique kilométrage')).toBeVisible();
});
