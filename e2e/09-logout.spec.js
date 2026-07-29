const { test, expect } = require('@playwright/test');
const { registerUser } = require('./helpers');

test('déconnexion renvoie vers la page de connexion', async ({ page }) => {
  await registerUser(page);
  await page.goto('/logout');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
});
