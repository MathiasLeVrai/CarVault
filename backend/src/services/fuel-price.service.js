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

  /**
   * Compare current week avg prices vs previous week.
   * Returns an array of { fuelName, key, currentPrice, previousPrice, dropPercent }
   * for fuels that dropped in price.
   */
  async getPriceDrops() {
    try {
      const [current, previous] = await Promise.all([
        this._avgForPeriod(0, 7),
        this._avgForPeriod(7, 14),
      ]);

      const drops = [];
      for (const [name, curPrice] of Object.entries(current)) {
        const prevPrice = previous[name];
        if (!prevPrice || curPrice >= prevPrice) continue;
        const dropPercent = ((prevPrice - curPrice) / prevPrice) * 100;
        if (dropPercent < 0.3) continue;
        drops.push({
          fuelName: name,
          key: FUEL_MAP[name] || name,
          currentPrice: Math.round(curPrice * 1000) / 1000,
          previousPrice: Math.round(prevPrice * 1000) / 1000,
          dropPercent: Math.round(dropPercent * 10) / 10,
        });
      }
      return drops;
    } catch (err) {
      console.error('[FuelPrice] Erreur getPriceDrops:', err.message);
      return [];
    }
  }

  async _avgForPeriod(daysAgoStart, daysAgoEnd) {
    const from = this._daysAgo(daysAgoEnd);
    const to = this._daysAgo(daysAgoStart);
    const params = new URLSearchParams({
      select: `prix_nom, AVG(prix_valeur) as avg_price`,
      where: `prix_maj >= date'${from}' AND prix_maj <= date'${to}'`,
      group_by: 'prix_nom',
      limit: '10',
    });

    const res = await fetch(`${API_URL}?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Fuel API: ${res.status}`);
    const data = await res.json();

    const result = {};
    for (const r of (data.results || [])) {
      if (r.prix_nom && r.avg_price) result[r.prix_nom] = r.avg_price;
    }
    return result;
  }

  _daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }

  _weekAgo() {
    return this._daysAgo(7);
  }
}

module.exports = new FuelPriceService();
