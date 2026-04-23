/**
 * Service de recherche véhicule par plaque d'immatriculation française
 * Utilise l'API RapidAPI "API de plaque d'immatriculation France"
 */

const RAPIDAPI_HOST = 'api-de-plaque-d-immatriculation-france.p.rapidapi.com';

/** Durée de cache pour une réponse API réussie (données véhicule). */
const TTL_POSITIVE_MS = 24 * 60 * 60 * 1000;
/** Durée de cache pour « plaque introuvable » (évite de marteler l'API sur la même erreur). */
const TTL_NEGATIVE_MS = 60 * 60 * 1000;
/** Nombre max d'entrées en mémoire (LRU par ordre d'accès dans la Map). */
const MAX_CACHE_ENTRIES = 5000;

class PlateService {
  constructor() {
    this._cache = new Map();
    /** Requêtes en cours par plaque normalisée (dédoublonnage si plusieurs clients en parallèle). */
    this._inFlight = new Map();
  }

  _normalizePlate(plate) {
    const stripped = plate.replace(/[\s-]+/g, '').toUpperCase();
    const sivMatch = stripped.match(/^([A-Z]{2})(\d{3})([A-Z]{2})$/);
    return sivMatch
      ? `${sivMatch[1]}-${sivMatch[2]}-${sivMatch[3]}`
      : stripped;
  }

  _getCached(normalizedPlate) {
    const entry = this._cache.get(normalizedPlate);
    if (!entry) return null;
    if (Date.now() >= entry.expiry) {
      this._cache.delete(normalizedPlate);
      return null;
    }
    // LRU : remettre la clé en fin de Map
    this._cache.delete(normalizedPlate);
    this._cache.set(normalizedPlate, entry);
    return entry;
  }

  _setCached(normalizedPlate, data, ttlMs) {
    if (this._cache.size >= MAX_CACHE_ENTRIES && !this._cache.has(normalizedPlate)) {
      const oldest = this._cache.keys().next().value;
      if (oldest !== undefined) this._cache.delete(oldest);
    }
    if (this._cache.has(normalizedPlate)) this._cache.delete(normalizedPlate);
    this._cache.set(normalizedPlate, { data, expiry: Date.now() + ttlMs });
  }

  /**
   * Recherche un véhicule par sa plaque d'immatriculation
   * @param {string} plate - ex: "FH-034-DD" ou "FH034DD"
   * @returns {object|null} Informations du véhicule
   */
  async lookup(plate) {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      throw new Error('RAPIDAPI_KEY requis dans .env');
    }

    const normalizedPlate = this._normalizePlate(plate);

    const cached = this._getCached(normalizedPlate);
    if (cached) {
      return cached.data;
    }

    if (!this._inFlight.has(normalizedPlate)) {
      this._inFlight.set(
        normalizedPlate,
        this._fetchFromApi(normalizedPlate, apiKey).finally(() => {
          this._inFlight.delete(normalizedPlate);
        }),
      );
    }

    return this._inFlight.get(normalizedPlate);
  }

  async _fetchFromApi(normalizedPlate, apiKey) {
    const url = `https://${RAPIDAPI_HOST}/?plaque=${encodeURIComponent(normalizedPlate)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': apiKey,
      },
    });

    if (!res.ok) {
      throw new Error(`Plate API failed: ${res.status}`);
    }

    const body = await res.json();

    if (!body || body.error || !body.data) {
      this._setCached(normalizedPlate, null, TTL_NEGATIVE_MS);
      return null;
    }

    const data = this._mapResponse(body.data, normalizedPlate);
    this._setCached(normalizedPlate, data, TTL_POSITIVE_MS);
    return data;
  }

  /**
   * Mapper la réponse API vers notre format interne
   */
  _mapResponse(d, plate) {
    return {
      licensePlate: plate,
      brand: d.AWN_marque || '',
      model: d.AWN_modele || d.AWN_nom_commercial || '',
      year: d.AWN_date_mise_en_circulation_us
        ? new Date(d.AWN_date_mise_en_circulation_us).getFullYear()
        : null,
      firstRegistrationDate: d.AWN_date_mise_en_circulation_us
        ? new Date(d.AWN_date_mise_en_circulation_us)
        : null,
      color: d.AWN_couleur || '',
      fuelType: this._mapFuelType(d.AWN_energie || ''),
      // Specs
      horsepower: d.AWN_puissance_chevaux ? parseInt(d.AWN_puissance_chevaux) : null,
      engineSize: d.AWN_cylindree_liters ? parseFloat(d.AWN_cylindree_liters) : null,
      doors: d.AWN_nbr_portes ? parseInt(d.AWN_nbr_portes) : null,
      bodyType: d.AWN_carrosserie || '',
      transmission: d.AWN_type_boite_vites || '',
      // Extra
      version: d.AWN_version || '',
      label: d.AWN_label || '',
      vin: d.AWN_VIN || null,
      co2: d.AWN_emission_co_2 ? parseInt(d.AWN_emission_co_2) : null,
      fiscalPower: d.AWN_puissance_fiscale ? parseInt(d.AWN_puissance_fiscale) : null,
      seats: d.AWN_nbr_de_places ? parseInt(d.AWN_nbr_de_places) : null,
      maxSpeed: d.AWN_max_speed ? parseInt(d.AWN_max_speed) : null,
    };
  }

  /**
   * Mapper le type de carburant vers notre enum FuelType
   */
  _mapFuelType(fuel) {
    if (!fuel) return 'GASOLINE';
    const lower = fuel.toLowerCase();
    if (lower.includes('gazole') || lower.includes('diesel') || lower === 'go') return 'DIESEL';
    if (lower.includes('hybride') || lower.includes('hybrid')) return 'HYBRID';
    if (lower.includes('electri') || lower.includes('élec')) return 'ELECTRIC';
    if (lower.includes('gpl') || lower.includes('lpg')) return 'LPG';
    if (lower.includes('essence') || lower.includes('es')) return 'GASOLINE';
    return 'OTHER';
  }
}

module.exports = new PlateService();
