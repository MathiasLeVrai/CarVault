const { getMaintenanceIntervals, MAINTENANCE_LABELS } = require('../data/vehicles');

const EXPENSE_MATCHERS = {
  oilChange: (e) => e.category === 'OIL_CHANGE' || (e.category === 'MAINTENANCE' && e.description && /vidange|huile|oil/i.test(e.description)),
  brakes: (e) => e.category === 'BRAKES' || (e.category === 'REPAIR' && e.description && /frein|brake|plaquette/i.test(e.description)),
  timingBelt: (e) => e.description && /courroie|distribution|timing|belt/i.test(e.description),
  tires: (e) => e.category === 'TIRES',
  generalService: (e) => e.category === 'MAINTENANCE',
  airFilter: (e) => e.description && /filtre.*air|air.*filter/i.test(e.description),
  cabinFilter: (e) => e.description && /filtre.*habitacle|cabin.*filter|filtre.*pollen/i.test(e.description),
  coolant: (e) => e.description && /liquide.*refroid|coolant|antigel/i.test(e.description),
  sparkPlugs: (e) => e.description && /bougie|spark.*plug/i.test(e.description),
};

function findLastExpenseForType(expenses, maintenanceKey) {
  const matcher = EXPENSE_MATCHERS[maintenanceKey];
  if (!matcher) return null;
  return expenses.find(matcher) || null;
}

function getMergedIntervals(vehicle) {
  const defaults = getMaintenanceIntervals(vehicle.brand, vehicle.fuelType || 'GASOLINE');
  const custom = vehicle.maintenanceConfig || {};
  const intervals = {};

  for (const [key, defaultVal] of Object.entries(defaults)) {
    if (defaultVal == null) continue;
    const customVal = custom[key];
    intervals[key] = customVal !== undefined && customVal !== null ? customVal : defaultVal;
  }

  return { defaults, custom, intervals };
}

function getLastServiceKm(vehicle, key, lastExpense) {
  const baseline = vehicle.purchaseMileage ?? vehicle.mileage ?? 0;
  const manual = vehicle.maintenanceLastKm?.[key];
  const fromExpense = lastExpense?.mileage;

  if (fromExpense != null && manual != null) return Math.max(fromExpense, manual);
  if (fromExpense != null) return fromExpense;
  if (manual != null) return manual;
  return baseline;
}

function getLastServiceSource(vehicle, key, lastExpense) {
  const manual = vehicle.maintenanceLastKm?.[key];
  const fromExpense = lastExpense?.mileage;

  if (fromExpense != null && manual != null) {
    return fromExpense >= manual ? 'expense' : 'manual';
  }
  if (fromExpense != null) return 'expense';
  if (manual != null) return 'manual';
  return 'baseline';
}

function buildMaintenancePlan(vehicle) {
  const { defaults, custom, intervals } = getMergedIntervals(vehicle);
  const plan = [];

  for (const [key, intervalKm] of Object.entries(intervals)) {
    if (intervalKm === null || intervalKm === undefined) continue;

    const lastExpense = findLastExpenseForType(vehicle.expenses || [], key);
    const lastKm = getLastServiceKm(vehicle, key, lastExpense);
    const lastDate = lastExpense?.date || null;
    const kmSinceLast = vehicle.mileage - lastKm;
    const nextAtKm = lastKm + intervalKm;
    const remaining = nextAtKm - vehicle.mileage;
    const pct = Math.min(100, Math.round((kmSinceLast / intervalKm) * 100));

    plan.push({
      key,
      label: MAINTENANCE_LABELS[key] || key,
      intervalKm,
      isCustom: custom[key] !== undefined,
      lastKm,
      lastDate,
      lastKmSource: getLastServiceSource(vehicle, key, lastExpense),
      nextAtKm,
      remaining,
      pct,
      status: remaining <= 0 ? 'overdue' : pct >= 80 ? 'soon' : 'ok',
    });
  }

  const order = { overdue: 0, soon: 1, ok: 2 };
  plan.sort((a, b) => order[a.status] - order[b.status]);

  return { plan, defaults, custom, lastKm: vehicle.maintenanceLastKm || {} };
}

function parseLastKmPayload(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const validKeys = Object.keys(MAINTENANCE_LABELS);
  const clean = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!validKeys.includes(k)) continue;
    if (v === null || v === '') continue;
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 0) clean[k] = n;
  }
  return clean;
}

module.exports = {
  findLastExpenseForType,
  getMergedIntervals,
  getLastServiceKm,
  buildMaintenancePlan,
  parseLastKmPayload,
  MAINTENANCE_LABELS,
};
