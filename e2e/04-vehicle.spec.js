const { test } = require('@playwright/test');
const { registerUser, addVehicleManual } = require('./helpers');

test('ajout manuel d\'un véhicule', async ({ page }) => {
  await registerUser(page);
  await addVehicleManual(page);
});
