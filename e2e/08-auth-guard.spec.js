const { test, expect } = require('@playwright/test');

test('page protégée redirige vers la connexion', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
});
