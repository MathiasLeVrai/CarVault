const test = require('node:test');
const assert = require('node:assert');

// Isole Prisma pour ne pas garder le process ouvert (pas de DB).
const prismaPath = require.resolve('../src/lib/prisma');
require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: {},
};

const healthService = require('../src/services/health.service');

const futureDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
};

const pastDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
};

test('véhicule sans document → score de repli 21', () => {
  const result = healthService._scoreDocuments({ documents: [] });

  assert.strictEqual(result.score, 21);
  assert.strictEqual(result.max, 43);
  assert.strictEqual(result.details[0].label, 'Aucun document');
  assert.strictEqual(result.details[0].ok, null);
});

test('document expiré → ne compte pas comme valide', () => {
  const result = healthService._scoreDocuments({
    documents: [{ name: 'CT', type: 'controle_technique', expirationDate: pastDate() }],
  });

  assert.strictEqual(result.details[0].ok, false);
  assert.strictEqual(result.score, 0);
});

test('document valide → compte dans le score', () => {
  const result = healthService._scoreDocuments({
    documents: [{ name: 'Assurance', type: 'assurance', expirationDate: futureDate() }],
  });

  assert.strictEqual(result.details[0].ok, true);
  assert.strictEqual(result.score, 43);
});

test('grade selon le score : 85→A, 65→B, 45→C, 20→D', () => {
  assert.strictEqual(healthService._grade(85), 'A');
  assert.strictEqual(healthService._grade(65), 'B');
  assert.strictEqual(healthService._grade(45), 'C');
  assert.strictEqual(healthService._grade(20), 'D');
});
