const { test, expect } = require('@playwright/test');

test('pages tarifs et légales accessibles', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByText('14 jours gratuits').first()).toBeVisible();

  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Politique de confidentialité' })).toBeVisible();

  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: /conditions générales/i })).toBeVisible();

  await page.goto('/support');
  await expect(page.getByRole('heading', { name: 'Support', exact: true })).toBeVisible();
});
