const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class FuelService {
  async getAll(vehicleId, userId) {
    // Verify ownership
    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
    if (!vehicle) throw Object.assign(new Error('Véhicule introuvable'), { status: 404 });

    const entries = await prisma.fuelEntry.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' },
    });

    // Compute consumption stats
    const stats = this._computeStats(entries, vehicle);
    return { entries, stats };
  }

  async create(vehicleId, userId, data) {
    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
    if (!vehicle) throw Object.assign(new Error('Véhicule introuvable'), { status: 404 });

    const { date, mileage, liters, pricePerLiter, isFull = true, notes } = data;
    if (!date || !mileage || !liters || !pricePerLiter) {
      throw Object.assign(new Error('date, mileage, liters et pricePerLiter sont requis'), { status: 400 });
    }

    const totalCost = parseFloat((liters * pricePerLiter).toFixed(2));

    const entry = await prisma.fuelEntry.create({
      data: {
        vehicleId,
        date: new Date(date),
        mileage: parseInt(mileage),
        liters: parseFloat(liters),
        pricePerLiter: parseFloat(pricePerLiter),
        totalCost,
        isFull: Boolean(isFull),
        notes: notes || null,
      },
    });

    // Update vehicle mileage if this entry has higher mileage
    if (parseInt(mileage) > vehicle.mileage) {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { mileage: parseInt(mileage) },
      });
    }

    return entry;
  }

  async delete(id, userId) {
    const entry = await prisma.fuelEntry.findFirst({
      where: { id },
      include: { vehicle: true },
    });
    if (!entry || entry.vehicle.userId !== userId) {
      throw Object.assign(new Error('Entrée introuvable'), { status: 404 });
    }
    await prisma.fuelEntry.delete({ where: { id } });
  }

  /**
   * Compute fuel statistics from a list of entries (ordered desc by date).
   * Consumption is calculated between consecutive full fill-ups.
   */
  _computeStats(entries, vehicle) {
    if (entries.length === 0) return null;

    // Only full fill-ups are valid for consumption calculation
    const fullEntries = [...entries].reverse().filter(e => e.isFull);

    const consumptions = [];
    for (let i = 1; i < fullEntries.length; i++) {
      const distance = fullEntries[i].mileage - fullEntries[i - 1].mileage;
      if (distance > 0 && distance < 5000) { // sanity check
        consumptions.push((fullEntries[i].liters / distance) * 100);
      }
    }

    const avgConsumption = consumptions.length > 0
      ? parseFloat((consumptions.reduce((a, b) => a + b, 0) / consumptions.length).toFixed(2))
      : null;

    const lastEntry = entries[0];
    const lastConsumption = consumptions.length > 0
      ? parseFloat(consumptions[consumptions.length - 1].toFixed(2))
      : null;

    const totalSpent = entries.reduce((s, e) => s + e.totalCost, 0);
    const totalLiters = entries.reduce((s, e) => s + e.liters, 0);
    const avgPricePerLiter = totalLiters > 0
      ? parseFloat((totalSpent / totalLiters).toFixed(3))
      : null;

    // Cost per km (using total spent and distance covered by all entries)
    const firstEntry = [...entries].sort((a, b) => a.mileage - b.mileage)[0];
    const totalDistance = lastEntry && firstEntry
      ? lastEntry.mileage - firstEntry.mileage
      : 0;
    const costPerKm = totalDistance > 0
      ? parseFloat((totalSpent / totalDistance).toFixed(3))
      : null;

    return {
      totalEntries: entries.length,
      totalLiters: parseFloat(totalLiters.toFixed(1)),
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      avgConsumption,
      lastConsumption,
      avgPricePerLiter,
      costPerKm,
      lastMileage: lastEntry.mileage,
    };
  }
}

module.exports = new FuelService();
