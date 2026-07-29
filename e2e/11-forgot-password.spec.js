const { test, expect } = require('@playwright/test');

test('mot de passe oublié envoie le formulaire', async ({ page }) => {
  await page.goto('/forgot-password');
  await expect(page.getByRole('heading', { name: 'Mot de passe oublié' })).toBeVisible();

  await page.getByPlaceholder('nom@exemple.com').fill('reset@carvio.test');
  await page.getByRole('button', { name: /envoyer le lien/i }).click();

  await expect(page.getByRole('heading', { name: 'Email envoyé' })).toBeVisible({ timeout: 15_000 });
});
