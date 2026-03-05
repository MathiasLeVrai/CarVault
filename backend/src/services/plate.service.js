/**
 * Service de recherche véhicule par plaque d'immatriculation française
 * Utilise l'API RapidAPI "API de plaque d'immatriculation France"
 */

const RAPIDAPI_HOST = 'api-de-plaque-d-immatriculation-france.p.rapidapi.com';

class PlateService {
  constructor() {
    this._cache = new Map();
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

    // Normaliser la plaque : supprimer espaces/tirets, majuscules, puis reformater XX-NNN-XX
    let stripped = plate.replace(/[\s-]+/g, '').toUpperCase();
    const sivMatch = stripped.match(/^([A-Z]{2})(\d{3})([A-Z]{2})$/);
    const normalizedPlate = sivMatch
      ? `${sivMatch[1]}-${sivMatch[2]}-${sivMatch[3]}`
      : stripped;

    // Cache 24h
    const cached = this._cache.get(normalizedPlate);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

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
      return null;
    }

    const data = this._mapResponse(body.data, normalizedPlate);

    // Cache 24h
    this._cache.set(normalizedPlate, { data, expiry: Date.now() + 24 * 60 * 60 * 1000 });

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
