/**
 * Service de cote véhicule via La Centrale (reverse-engineered API)
 *
 * Endpoints utilisés :
 * 1. proxy-matching.carboatservices.fr/v1/match-immat → identification véhicule par plaque
 * 2. proxy-cote.carboatservices.fr/v1/quotation/future-quote → cote actuelle + projections
 *
 * Le endpoint future-quote nécessite un `versionId` La Centrale.
 * On le résout via match-immat + recherche de versions.
 * Cache DB (7 jours) + cache mémoire (1h).
 */

const prisma = require('../lib/prisma');

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
const memCache = new Map();
const MEM_CACHE_TTL = 60 * 60 * 1000; // 1h

const COMMON_HEADERS = {
  'accept': 'application/json',
  'content-type': 'application/json',
  'origin': 'https://www.lacentrale.fr',
  'referer': 'https://www.lacentrale.fr/',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'x-client-source': 'proxy-matching:front',
};

class LaCentraleService {
  /**
   * Récupère la cote pour un véhicule
   * @param {string} plate - Plaque FR
   * @param {number} mileage - Kilométrage actuel
   * @param {string|Date} firstCirculationDate - Date 1ère mise en circulation
   * @param {number|null} versionId - versionId La Centrale (optionnel, stocké en DB)
   * @returns {{ low: number, mid: number, high: number, currentQuote: number, projections: Array, fetchedAt: Date } | null}
   */
  async getCote(plate, mileage, firstCirculationDate, versionId = null) {
    const normalized = this._normalizePlate(plate);
    if (!normalized) return null;

    const cacheKey = `${normalized}_${mileage}`;

    // 1. Check cache mémoire
    const memEntry = memCache.get(cacheKey);
    if (memEntry && Date.now() - memEntry.ts < MEM_CACHE_TTL) {
      return memEntry.data;
    }

    // 2. Check cache DB
    const dbEntry = await prisma.vehicleCote.findUnique({
      where: { plate: normalized },
    });

    if (dbEntry && Date.now() - new Date(dbEntry.fetchedAt).getTime() < CACHE_TTL_MS) {
      const result = this._formatResult(dbEntry);
      memCache.set(cacheKey, { data: result, ts: Date.now() });
      return result;
    }

    // 3. Fetch from La Centrale
    try {
      const freshData = await this._fetchCote(normalized, mileage, firstCirculationDate, versionId);
      if (!freshData) {
        if (dbEntry) return this._formatResult(dbEntry);
        return null;
      }

      // 4. Upsert en DB
      const saved = await prisma.vehicleCote.upsert({
        where: { plate: normalized },
        create: {
          plate: normalized,
          low: freshData.low,
          mid: freshData.mid,
          high: freshData.high,
          raw: freshData.raw,
          fetchedAt: new Date(),
        },
        update: {
          low: freshData.low,
          mid: freshData.mid,
          high: freshData.high,
          raw: freshData.raw,
          fetchedAt: new Date(),
        },
      });

      const result = this._formatResult(saved);
      memCache.set(cacheKey, { data: result, ts: Date.now() });
      return result;
    } catch (err) {
      console.error('[LaCentrale] Erreur:', err.message);
      if (dbEntry) return this._formatResult(dbEntry);
      return null;
    }
  }

  /**
   * Étape 1 : Identifier le véhicule par plaque (match-immat)
   */
  async matchImmat(plate) {
    const res = await fetch('https://proxy-matching.carboatservices.fr/v1/match-immat', {
      method: 'POST',
      headers: COMMON_HEADERS,
      body: JSON.stringify({ immat: plate.toLowerCase().replace(/[-\s]/g, ''), dn: 'lacentrale' }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.message !== 'SUCCESS' || !data.vehicle) return null;
    return data.vehicle;
  }

  /**
   * Étape 2 : Récupérer la cote via future-quote
   * La 1ère valeur de valueQuotation = cote actuelle
   */
  async _fetchCote(plate, mileage, firstCirculationDate, versionId) {
    // Si pas de versionId, on ne peut pas appeler future-quote
    if (!versionId) {
      console.warn(`[LaCentrale] Pas de versionId pour ${plate}, cote indisponible`);
      return null;
    }

    const dateStr = firstCirculationDate instanceof Date
      ? firstCirculationDate.toISOString().split('T')[0]
      : String(firstCirculationDate || '').split('T')[0];

    const res = await fetch('https://proxy-cote.carboatservices.fr/v1/quotation/future-quote', {
      method: 'POST',
      headers: {
        ...COMMON_HEADERS,
        'x-client-source': 'proxy-cote:fragment',
      },
      body: JSON.stringify({
        type: 'future',
        params: {
          versionId: Number(versionId),
          vehicleFirstCirculationDate: dateStr,
          vehicleMileage: Number(mileage) || 0,
          monthlyQuotation: false,
          futureYearMileage: 100,
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (data.message !== 'SUCCESS' || !data.valueQuotation?.length) return null;

    const quotations = data.valueQuotation;
    const currentQuote = quotations[0].quotation;

    // Calculer low/mid/high : -10% / valeur / +10% (approximation standard marché)
    const low = Math.round(currentQuote * 0.85);
    const mid = currentQuote;
    const high = Math.round(currentQuote * 1.15);

    return {
      low,
      mid,
      high,
      raw: {
        quotations,
        versionId,
        mileage,
        firstCirculationDate: dateStr,
      },
    };
  }

  _formatResult(dbEntry) {
    const projections = dbEntry.raw?.quotations || [];
    return {
      low: dbEntry.low,
      mid: dbEntry.mid,
      high: dbEntry.high,
      currentQuote: dbEntry.mid,
      projections,
      fetchedAt: dbEntry.fetchedAt,
    };
  }

  _normalizePlate(plate) {
    if (!plate) return null;
    const cleaned = plate.toUpperCase().replace(/[\s.-]/g, '');
    const match = cleaned.match(/^([A-Z]{2})(\d{3})([A-Z]{2})$/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    if (cleaned.length >= 4) return cleaned;
    return null;
  }
}

module.exports = new LaCentraleService();
