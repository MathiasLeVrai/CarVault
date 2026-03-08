const prisma = require('../lib/prisma');
const { getMaintenanceIntervals } = require('../data/vehicles');

class HealthService {
  /**
   * Calculer le score sante complet d'un vehicule
   */
  async getHealthScore(vehicleId, userId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
      include: {
        documents: true,
        expenses: { orderBy: { date: 'desc' } },
      },
    });

    if (!vehicle) return null;

    const maintenance = this._scoreMaintenance(vehicle);
    const documents = this._scoreDocuments(vehicle);

    const score = maintenance.score + documents.score;
    const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';

    return {
      score,
      grade,
      breakdown: { maintenance, documents },
      estimatedValue: this._estimateValue(vehicle),
    };
  }

  // ============================================================
  // Entretien (40 pts max)
  // ============================================================

  _scoreMaintenance(vehicle) {
    const intervals = getMaintenanceIntervals(vehicle.brand, vehicle.fuelType || 'GASOLINE');
    const details = [];
    let earned = 0;
    let checks = 0;

    // Vidange
    if (intervals.oilChange) {
      checks++;
      const lastOil = vehicle.expenses.find(e =>
        e.category === 'MAINTENANCE' && e.description && /vidange|huile|oil/i.test(e.description)
      );
      const kmSince = vehicle.mileage - (lastOil?.mileage || 0);
      const ratio = kmSince / intervals.oilChange;
      const ok = ratio < 1;
      if (ok) earned++;
      details.push({ label: 'Vidange', ok, kmSince, interval: intervals.oilChange });
    }

    // Freins
    if (intervals.brakes) {
      checks++;
      const lastBrake = vehicle.expenses.find(e =>
        e.description && /frein|brake|plaquette/i.test(e.description)
      );
      const kmSince = vehicle.mileage - (lastBrake?.mileage || 0);
      const ok = kmSince < intervals.brakes;
      if (ok) earned++;
      details.push({ label: 'Freins', ok, kmSince, interval: intervals.brakes });
    }

    // Courroie de distribution
    if (intervals.timingBelt) {
      checks++;
      const lastBelt = vehicle.expenses.find(e =>
        e.description && /courroie|distribution|timing|belt/i.test(e.description)
      );
      const kmSince = vehicle.mileage - (lastBelt?.mileage || 0);
      const ok = kmSince < intervals.timingBelt;
      if (ok) earned++;
      details.push({ label: 'Courroie distribution', ok, kmSince, interval: intervals.timingBelt });
    }

    // Revision generale
    if (intervals.generalService) {
      checks++;
      const lastService = vehicle.expenses.find(e => e.category === 'MAINTENANCE');
      const kmSince = vehicle.mileage - (lastService?.mileage || 0);
      const ok = kmSince < intervals.generalService;
      if (ok) earned++;
      details.push({ label: 'Révision générale', ok, kmSince, interval: intervals.generalService });
    }

    const score = checks > 0 ? Math.round((earned / checks) * 57) : 28;
    return { score, max: 57, details };
  }

  // ============================================================
  // Documents (30 pts max)
  // ============================================================

  _scoreDocuments(vehicle) {
    const docs = vehicle.documents || [];
    const details = [];

    if (docs.length === 0) {
      return { score: 21, max: 43, details: [{ label: 'Aucun document', ok: null }] };
    }

    const withExpiry = docs.filter(d => d.expirationDate);
    const now = new Date();

    let valid = 0;
    for (const d of withExpiry) {
      const isValid = new Date(d.expirationDate) > now;
      if (isValid) valid++;
      details.push({ label: d.name, type: d.type, ok: isValid });
    }

    // Documents sans expiration comptent comme valides
    const withoutExpiry = docs.filter(d => !d.expirationDate);
    for (const d of withoutExpiry) {
      details.push({ label: d.name, type: d.type, ok: true });
    }

    const total = withExpiry.length;
    const ratio = total > 0 ? valid / total : 1;
    const score = Math.round(ratio * 43);

    return { score, max: 43, details };
  }

  // ============================================================
  // Valeur estimee (depreciation)
  // ============================================================

  _estimateValue(vehicle) {
    const basePrice = vehicle.msrp;
    if (!basePrice) return null;

    const currentYear = new Date().getFullYear();
    const age = Math.max(0, currentYear - vehicle.year);

    // Depreciation par annee : 20% an 1, 15% an 2, 10% ans 3-5, 7% ans 6+
    let value = basePrice;
    for (let y = 1; y <= age; y++) {
      if (y === 1) value *= 0.80;
      else if (y === 2) value *= 0.85;
      else if (y <= 5) value *= 0.90;
      else value *= 0.93;
    }

    // Ajustement kilometrage : +/- par rapport a 15000 km/an moyen
    const expectedKm = age * 15000;
    const actualKm = vehicle.mileage || 0;
    const kmDiff = actualKm - expectedKm;
    // Chaque 10000 km d'ecart = ~2% de valeur
    const kmAdjust = 1 - (kmDiff / 10000) * 0.02;
    value *= Math.max(0.5, Math.min(1.2, kmAdjust));

    return Math.round(Math.max(0, value));
  }
}

module.exports = new HealthService();
