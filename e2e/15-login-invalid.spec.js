const { test, expect } = require('@playwright/test');
const { registerUser, uniqueEmail } = require('./helpers');

test('connexion refusée avec un mauvais mot de passe', async ({ page }) => {
  const email = uniqueEmail('badlogin');
  await registerUser(page, { email });
  await page.goto('/logout');

  await page.goto('/login');
  await page.getByPlaceholder('nom@exemple.com').fill(email);
  await page.locator('input[type="password"]').fill('WrongPass999!');
  await page.getByRole('button', { name: /se connecter/i }).click();

  await expect(page.getByText(/email ou mot de passe incorrect/i)).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/\/login/);
});
