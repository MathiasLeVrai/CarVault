const { test, expect } = require('@playwright/test');
const { registerUser, loginUser, uniqueEmail, TEST_PASSWORD } = require('./helpers');

test('connexion avec un compte existant', async ({ page }) => {
  const email = uniqueEmail('login');
  const { firstName } = await registerUser(page, { email, firstName: 'Paul' });

  await page.goto('/logout');
  await expect(page).toHaveURL(/\/login$/);

  await loginUser(page, email, TEST_PASSWORD);
  await expect(page.getByText(new RegExp(`Bonjour, ${firstName}`))).toBeVisible();
});
