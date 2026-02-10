const express = require('express');
const router = express.Router();
const { vehicleBrands } = require('../data/vehicles');

/**
 * GET /api/brands — Toutes les marques
 */
router.get('/', (req, res) => {
  const brands = vehicleBrands.map(b => b.name).sort();
  res.json(brands);
});

/**
 * GET /api/brands/:brand/models — Modèles d'une marque
 */
router.get('/:brand/models', (req, res) => {
  const brandName = decodeURIComponent(req.params.brand);
  const brand = vehicleBrands.find(
    b => b.name.toLowerCase() === brandName.toLowerCase()
  );

  if (!brand) {
    return res.status(404).json({ error: 'Marque non trouvée' });
  }

  res.json(brand.models.sort());
});

/**
 * GET /api/brands/search?q=xxx — Recherche de marques
 */
router.get('/search', (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  if (!query) return res.json([]);

  const results = vehicleBrands
    .filter(b => b.name.toLowerCase().includes(query))
    .map(b => b.name)
    .sort();

  res.json(results);
});

module.exports = router;
