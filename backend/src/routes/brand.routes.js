const express = require('express');
const router = express.Router();
const carapiService = require('../services/carapi.service');

/**
 * GET /api/brands — Toutes les marques (via CarAPI avec fallback local)
 */
router.get('/', async (req, res) => {
  try {
    const brands = await carapiService.getMakes();
    res.json(brands);
  } catch (err) {
    console.error('Erreur brands:', err.message);
    res.status(500).json({ error: 'Erreur récupération marques' });
  }
});

/**
 * GET /api/brands/search?q=xxx — Recherche de marques
 * IMPORTANT: doit être avant /:brand/models pour ne pas matcher "search" comme un brand
 */
router.get('/search', async (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase();
    if (!query) return res.json([]);
    const brands = await carapiService.getMakes();
    const results = brands.filter(b => b.toLowerCase().includes(query));
    res.json(results);
  } catch (err) {
    console.error('Erreur search:', err.message);
    res.status(500).json({ error: 'Erreur recherche marques' });
  }
});

/**
 * GET /api/brands/trims — Trims pour année/marque/modèle
 */
router.get('/trims', async (req, res) => {
  try {
    const { year, make, model } = req.query;
    if (!year || !make || !model) {
      return res.status(400).json({ error: 'year, make et model requis' });
    }
    const trims = await carapiService.getTrims(year, make, model);
    res.json(trims);
  } catch (err) {
    console.error('Erreur trims:', err.message);
    res.status(500).json({ error: 'Erreur récupération trims' });
  }
});

/**
 * GET /api/brands/trims/:id — Détails complets d'un trim
 */
router.get('/trims/:id', async (req, res) => {
  try {
    const trim = await carapiService.getTrimById(req.params.id);
    if (!trim) {
      return res.status(404).json({ error: 'Trim non trouvé' });
    }
    res.json(trim);
  } catch (err) {
    console.error('Erreur trim detail:', err.message);
    res.status(500).json({ error: 'Erreur récupération trim' });
  }
});

/**
 * GET /api/brands/:brand/models — Modèles d'une marque (via CarAPI avec fallback local)
 */
router.get('/:brand/models', async (req, res) => {
  try {
    const brandName = decodeURIComponent(req.params.brand);
    const models = await carapiService.getModels(brandName);
    res.json(models);
  } catch (err) {
    console.error('Erreur models:', err.message);
    res.status(500).json({ error: 'Erreur récupération modèles' });
  }
});

module.exports = router;
