const { z } = require('zod');

const emptyToUndef = (v) => (v === '' || v === null || v === undefined ? undefined : v);

const email = z.string().trim().email('Email invalide').max(255);
const password = z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').max(128);
const uuid = z.string().uuid('Identifiant invalide');

const fuelType = z.enum(['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'LPG', 'OTHER']);
const documentType = z.enum([
  'TECHNICAL_INSPECTION', 'INSURANCE', 'REGISTRATION', 'INVOICE',
  'ACCIDENT_REPORT', 'WARRANTY', 'OTHER',
]);

const optStr = (max) => z.preprocess(emptyToUndef, z.string().trim().max(max).optional());
const optInt = (min, max) => z.preprocess(emptyToUndef, z.coerce.number().int().min(min).max(max).optional());
const optFloat = (min, max) => z.preprocess(emptyToUndef, z.coerce.number().min(min).max(max).optional());

const registerBody = z.object({
  email,
  password,
  firstName: z.string().trim().min(1, 'Prénom requis').max(80),
  lastName: z.string().trim().min(1, 'Nom requis').max(80),
});

const loginBody = z.object({
  email,
  password: z.string().min(1, 'Mot de passe requis').max(128),
});

const forgotPasswordBody = z.object({ email });

const resetPasswordBody = z.object({
  token: z.string().min(1, 'Token requis').max(200),
  password,
});

const deleteAccountBody = z.object({
  password: z.string().min(1, 'Mot de passe requis').max(128),
});

const updateProfileBody = z.object({
  firstName: z.preprocess(emptyToUndef, z.string().trim().min(1).max(80).optional()),
  lastName: z.preprocess(emptyToUndef, z.string().trim().min(1).max(80).optional()),
});

const vehicleCreateBody = z.object({
  brand: z.string().trim().min(1, 'Marque requise').max(80),
  model: z.string().trim().min(1, 'Modèle requis').max(80),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  mileage: optInt(0, 10_000_000),
  licensePlate: optStr(20),
  color: optStr(40),
  fuelType: z.preprocess(emptyToUndef, fuelType.optional().default('GASOLINE')),
  purchasePrice: optFloat(0, 10_000_000),
  annualKmGoal: optInt(0, 500_000),
  carapiTrimId: optStr(64),
  msrp: optFloat(0, 10_000_000),
  horsepower: optInt(0, 5000),
  engineSize: optFloat(0, 20),
  transmission: optStr(40),
  bodyType: optStr(40),
  doors: optInt(0, 10),
  fiscalPower: optInt(0, 100),
  co2: optInt(0, 1000),
  firstRegistrationDate: optStr(40),
  maintenanceUpToDate: z.enum(['true', 'false']).optional(),
  maintenanceLastKm: optStr(5000),
});

const vehicleUpdateBody = z.object({
  brand: z.preprocess(emptyToUndef, z.string().trim().min(1).max(80).optional()),
  model: z.preprocess(emptyToUndef, z.string().trim().min(1).max(80).optional()),
  year: optInt(1900, new Date().getFullYear() + 1),
  mileage: optInt(0, 10_000_000),
  licensePlate: optStr(20),
  color: optStr(40),
  fuelType: z.preprocess(emptyToUndef, fuelType.optional()),
  purchasePrice: optFloat(0, 10_000_000),
  monthlyFuelBudget: optFloat(0, 100_000),
  annualKmGoal: optInt(0, 500_000),
  horsepower: optInt(0, 5000),
  engineSize: optFloat(0, 20),
  transmission: optStr(40),
  bodyType: optStr(40),
  doors: optInt(0, 10),
}).passthrough();

const documentCreateBody = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(200),
  type: documentType,
  vehicleId: uuid,
  expirationDate: optStr(40),
  notes: optStr(2000),
  reminderDays: optStr(200),
});

const shareCreateBody = z.object({
  vehicleId: uuid,
  expiresInDays: z.preprocess(emptyToUndef, z.coerce.number().int().min(1).max(365).optional()),
  password: optStr(128),
  hidePurchasePrice: z.preprocess(
    (v) => (v === 'true' ? true : v === 'false' ? false : v),
    z.boolean().optional(),
  ),
  label: optStr(100),
});

const idParams = z.object({ id: uuid }).passthrough();
const vehicleIdParams = z.object({ vehicleId: uuid }).passthrough();

module.exports = {
  registerBody,
  loginBody,
  forgotPasswordBody,
  resetPasswordBody,
  deleteAccountBody,
  updateProfileBody,
  vehicleCreateBody,
  vehicleUpdateBody,
  documentCreateBody,
  shareCreateBody,
  idParams,
  vehicleIdParams,
};
