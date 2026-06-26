const { test, expect } = require('@playwright/test');

test('pages publiques accessibles', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Carvio/i);

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();

  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Créer un compte' })).toBeVisible();
});
