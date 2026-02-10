const { vehicleBrands } = require('../data/vehicles');

const CARAPI_BASE = 'https://carapi.app/api';

class CarApiService {
  constructor() {
    this._jwt = null;
    this._jwtExpiry = 0;
    this._cache = new Map();
  }

  // ============================================================
  // Auth — JWT avec cache automatique
  // ============================================================

  async _getJwt() {
    if (this._jwt && Date.now() < this._jwtExpiry) {
      return this._jwt;
    }

    const token = process.env.CARAPI_TOKEN;
    const secret = process.env.CARAPI_SECRET;

    if (!token || !secret) {
      throw new Error('CARAPI_TOKEN et CARAPI_SECRET requis dans .env');
    }

    const res = await fetch(`${CARAPI_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ api_token: token, api_secret: secret }),
    });

    if (!res.ok) {
      throw new Error(`CarAPI auth failed: ${res.status}`);
    }

    this._jwt = await res.text();
    // JWT expire dans 7 jours, on renouvelle a 6 jours
    this._jwtExpiry = Date.now() + 6 * 24 * 60 * 60 * 1000;
    return this._jwt;
  }

  // ============================================================
  // HTTP avec auth + cache
  // ============================================================

  async _fetch(path, ttlMs = 24 * 60 * 60 * 1000) {
    const cacheKey = path;
    const cached = this._cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    const jwt = await this._getJwt();
    const res = await fetch(`${CARAPI_BASE}${path}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!res.ok) {
      throw new Error(`CarAPI ${path} failed: ${res.status}`);
    }

    const data = await res.json();
    this._cache.set(cacheKey, { data, expiry: Date.now() + ttlMs });
    return data;
  }

  // ============================================================
  // Methodes publiques
  // ============================================================

  /**
   * Toutes les marques, triees par nom
   */
  async getMakes() {
    try {
      const result = await this._fetch('/makes/v2?limit=1000&sort=Makes.name&direction=asc');
      const makes = (result.data || []).map(m => m.name).sort();
      return makes;
    } catch (err) {
      console.error('[CarAPI] getMakes fallback:', err.message);
      return vehicleBrands.map(b => b.name).sort();
    }
  }

  /**
   * Modeles d'une marque
   */
  async getModels(make) {
    try {
      const result = await this._fetch(
        `/models/v2?make=${encodeURIComponent(make)}&limit=1000&sort=OemMakeModels.name&direction=asc`
      );
      const models = [...new Set((result.data || []).map(m => m.name))].sort();
      return models;
    } catch (err) {
      console.error('[CarAPI] getModels fallback:', err.message);
      const brand = vehicleBrands.find(b => b.name.toLowerCase() === make.toLowerCase());
      return brand ? brand.models.sort() : [];
    }
  }

  /**
   * Trims pour une annee/marque/modele
   */
  async getTrims(year, make, model) {
    try {
      const result = await this._fetch(
        `/trims/v2?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&limit=100`,
        12 * 60 * 60 * 1000 // cache 12h
      );
      return (result.data || []).map(t => ({
        id: t.id,
        name: t.trim || t.description || `${make} ${model}`,
        description: t.description || '',
        year: t.year,
        msrp: t.msrp ? parseFloat(t.msrp) : null,
      }));
    } catch (err) {
      console.error('[CarAPI] getTrims error:', err.message);
      return [];
    }
  }

  /**
   * Donnees completes d'un trim (moteur, carrosserie, MSRP)
   */
  async getTrimById(id) {
    try {
      const t = await this._fetch(`/trims/v2/${id}`, 24 * 60 * 60 * 1000);
      const engine = t.engines?.[0] || {};
      const body = t.bodies?.[0] || {};

      return {
        id: t.id,
        year: t.year,
        make: t.make,
        model: t.model,
        trim: t.trim,
        description: t.description,
        msrp: t.msrp ? parseFloat(t.msrp) : null,
        // Engine
        horsepower: engine.horsepower_hp || null,
        engineSize: engine.size || null,
        fuelType: this._mapFuelType(engine.fuel_type),
        transmission: engine.transmission || null,
        driveType: engine.drive_type || null,
        // Body
        bodyType: body.type || null,
        doors: body.doors || null,
      };
    } catch (err) {
      console.error('[CarAPI] getTrimById error:', err.message);
      return null;
    }
  }

  /**
   * Mapper le fuel_type de CarAPI vers notre enum FuelType
   */
  _mapFuelType(carapiFuel) {
    if (!carapiFuel) return null;
    const lower = carapiFuel.toLowerCase();
    if (lower.includes('gasoline') || lower.includes('gas')) return 'GASOLINE';
    if (lower.includes('diesel')) return 'DIESEL';
    if (lower.includes('hybrid') || lower.includes('plug-in')) return 'HYBRID';
    if (lower.includes('electric')) return 'ELECTRIC';
    if (lower.includes('lpg') || lower.includes('propane')) return 'LPG';
    return 'OTHER';
  }
}

module.exports = new CarApiService();
