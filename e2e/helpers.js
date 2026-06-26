const { expect } = require('@playwright/test');

const TEST_PASSWORD = 'TestE2E123!';

function uniqueEmail(prefix = 'e2e') {
  return `${prefix}+${Date.now()}-${Math.random().toString(36).slice(2, 7)}@carvio.test`;
}

async function skipOnboarding(page) {
  const skip = page.getByRole('button', { name: /passer/i });
  if (await skip.isVisible({ timeout: 5000 }).catch(() => false)) {
    await skip.click();
  }
}

async function registerUser(page, { firstName = 'E2E', lastName = 'Test', email, password = TEST_PASSWORD } = {}) {
  const userEmail = email || uniqueEmail('register');
  await page.goto('/register');
  await page.getByPlaceholder('Jean').fill(firstName);
  await page.getByPlaceholder('Dupont').fill(lastName);
  await page.getByPlaceholder('nom@exemple.com').fill(userEmail);
  await page.getByPlaceholder('Min. 8 caractères').fill(password);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /créer mon compte/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await skipOnboarding(page);
  return { email: userEmail, password, firstName, lastName };
}

async function loginUser(page, email, password = TEST_PASSWORD) {
  await page.goto('/login');
  await page.getByPlaceholder('nom@exemple.com').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await skipOnboarding(page);
}

async function fillAutocomplete(page, label, value) {
  const field = page.locator('label').filter({ hasText: label }).locator('..');
  await field.getByRole('button').click();
  const search = field.locator('input[type="text"]').last();
  await search.fill(value);
  await search.press('Enter');
}

async function selectField(page, label, value) {
  await page.locator('label').filter({ hasText: label }).locator('..').locator('select').selectOption(value);
}

async function addVehicleManual(page, { brand = 'Renault', model = 'Clio', year = '2020' } = {}) {
  await page.goto('/vehicles');
  await page.getByRole('button', { name: /^ajouter$/i }).first().click();
  await page.getByRole('button', { name: /saisir manuellement/i }).click();
  await selectField(page, 'Année', year);
  await fillAutocomplete(page, 'Marque', brand);
  await fillAutocomplete(page, 'Modèle', model);
  await page.getByRole('button', { name: /ajouter au garage/i }).click();
  await expect(page.getByRole('heading', { name: `${brand} ${model}`, level: 3 })).toBeVisible({ timeout: 15_000 });
}

module.exports = {
  TEST_PASSWORD,
  uniqueEmail,
  skipOnboarding,
  registerUser,
  loginUser,
  addVehicleManual,
};
