const overpassService = require('../services/overpass.service');

const ALLOWED_TYPES = new Set(['garage', 'ct', 'carwash']);
const MIN_RADIUS = 500;
const MAX_RADIUS = 15000;

class MapController {
  async getPois(req, res, next) {
    try {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      const radius = Math.min(
        MAX_RADIUS,
        Math.max(MIN_RADIUS, Math.round(Number(req.query.radius) || 5000)),
      );

      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({ error: 'Latitude invalide' });
      }
      if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
        return res.status(400).json({ error: 'Longitude invalide' });
      }

      const types = String(req.query.types || 'garage,ct,carwash')
        .split(',')
        .map((t) => t.trim())
        .filter((t) => ALLOWED_TYPES.has(t));

      if (types.length === 0) {
        return res.json({ pois: [] });
      }

      const pois = await overpassService.getPois(lat, lon, radius, types);
      res.json({ pois });
    } catch (error) {
      // Overpass public mirrors are often slow/overloaded — degrade, don't 500.
      const overpassUnavailable =
        error.status === 429
        || error.status === 504
        || error.name === 'TimeoutError'
        || error.name === 'AbortError';
      if (overpassUnavailable) {
        return res.json({ pois: [] });
      }
      next(error);
    }
  }
}

module.exports = new MapController();
