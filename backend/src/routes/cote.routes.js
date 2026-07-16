const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const prisma = require('../lib/prisma');

router.use(authenticate);

// GET /api/cote/:vehicleId — Récupère la valeur estimée du véhicule
router.get('/:vehicleId', async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicule.findFirst({
      where: { id: req.params.vehicleId, userId: req.userId },
      select: { estimatedValue: true, updatedAt: true },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    res.json({
      estimatedValue: vehicle.estimatedValue,
      updatedAt: vehicle.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/cote/:vehicleId — Met à jour la valeur estimée
router.put('/:vehicleId', async (req, res, next) => {
  try {
    const { estimatedValue } = req.body;

    if (estimatedValue !== null && (typeof estimatedValue !== 'number' || estimatedValue < 0)) {
      return res.status(400).json({ error: 'Valeur invalide' });
    }

    const vehicle = await prisma.vehicule.findFirst({
      where: { id: req.params.vehicleId, userId: req.userId },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    const updated = await prisma.vehicule.update({
      where: { id: vehicle.id },
      data: { estimatedValue },
      select: { estimatedValue: true, updatedAt: true },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
