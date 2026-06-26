const { test, expect } = require('@playwright/test');
const { registerUser } = require('./helpers');

test('inscription redirige vers le dashboard', async ({ page }) => {
  const { firstName } = await registerUser(page, { firstName: 'Marie', lastName: 'Dupont' });
  await expect(page.getByText(new RegExp(`Bonjour, ${firstName}`))).toBeVisible();
});
