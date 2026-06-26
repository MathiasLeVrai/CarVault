const { test, expect } = require('@playwright/test');
const { registerUser } = require('./helpers');

test('consultation de la page alertes', async ({ page }) => {
  await registerUser(page);

  await page.goto('/alerts');
  await expect(page.getByRole('heading', { name: 'Alertes' })).toBeVisible();
  await expect(page.getByText('Tout est à jour')).toBeVisible();
});
