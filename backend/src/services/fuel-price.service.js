/**
 * Service de prix carburant national (API gouvernementale FR)
 * Source : data.economie.gouv.fr — prix instantanes
 * Cache en memoire pour 1h
 */

const API_URL = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records';

// Mapping nom carburant → clé interne
const FUEL_MAP = {
  'Gazole': 'DIESEL',
  'SP95': 'SP95',
  'SP98': 'SP98',
  'E10': 'E10',
  'E85': 'E85',
  'GPLc': 'GPL',
};

class FuelPriceService {
  constructor() {
    this._cache = null;
    this._cacheExpiry = 0;
  }

  async getPrices() {
    if (this._cache && Date.now() < this._cacheExpiry) {
      return this._cache;
    }

    try {
      // Requete : prix moyens par type de carburant (derniere semaine)
      const params = new URLSearchParams({
        select: 'prix_valeur,prix_nom',
        where: `prix_maj > date'${this._weekAgo()}'`,
        group_by: 'prix_nom',
        limit: '10',
      });
      // On utilise l'aggregation AVG
      params.set('select', 'prix_nom, AVG(prix_valeur) as avg_price, COUNT(*) as station_count');

      const res = await fetch(`${API_URL}?${params.toString()}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) throw new Error(`Fuel API: ${res.status}`);

      const data = await res.json();
      const results = {};

      for (const record of (data.results || [])) {
        const name = record.prix_nom;
        const avgPrice = record.avg_price;
        const count = record.station_count;
        if (!name || !avgPrice) continue;

        const key = FUEL_MAP[name] || name;
        results[key] = {
          name,
          avgPrice: Math.round(avgPrice * 1000) / 1000,
          stationCount: Number(count) || 0,
        };
      }

      this._cache = results;
      this._cacheExpiry = Date.now() + 60 * 60 * 1000; // 1h
      return results;
    } catch (err) {
      console.error('[FuelPrice] Erreur:', err.message);
      // Retourner le cache expire si dispo
      if (this._cache) return this._cache;
      return {};
    }
  }

  _weekAgo() {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }
}

module.exports = new FuelPriceService();
