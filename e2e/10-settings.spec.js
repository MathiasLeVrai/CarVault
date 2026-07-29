const { test, expect } = require('@playwright/test');
const { registerUser } = require('./helpers');

test('page paramètres affiche le profil', async ({ page }) => {
  const { firstName, lastName, email } = await registerUser(page, { firstName: 'Alice', lastName: 'Martin' });

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Mon profil' })).toBeVisible();
  await expect(page.getByRole('heading', { name: `${firstName} ${lastName}` })).toBeVisible();
  await expect(page.getByRole('main').getByText(email)).toBeVisible();
  await expect(page.getByRole('button', { name: /se déconnecter/i })).toBeVisible();
});
