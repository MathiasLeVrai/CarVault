/**
 * Dataset marques, modèles et intervalles de maintenance automobiles.
 * Les intervalles sont en kilomètres. Valeurs indicatives moyennes.
 * Structure prête pour migration vers une API externe (ex: NHTSA, Car API)
 */

// Intervalles de maintenance par défaut (si modèle non trouvé)
const DEFAULT_MAINTENANCE = {
  oilChange: 15000,         // Vidange tous les 15 000 km
  brakes: 30000,            // Plaquettes de frein tous les 30 000 km
  timingBelt: 120000,       // Courroie de distribution tous les 120 000 km
  tires: 40000,             // Pneus tous les 40 000 km
  generalService: 20000,    // Révision générale tous les 20 000 km
  airFilter: 25000,         // Filtre à air tous les 25 000 km
  cabinFilter: 20000,       // Filtre habitacle tous les 20 000 km
  coolant: 80000,           // Liquide de refroidissement tous les 80 000 km
  sparkPlugs: 45000,        // Bougies tous les 45 000 km (essence uniquement)
};

// Intervalles spécifiques par type de carburant
// null = entretien non applicable pour ce type de véhicule
const FUEL_MAINTENANCE = {
  GASOLINE: {
    oilChange: 15000,
    sparkPlugs: 45000,
  },
  DIESEL: {
    oilChange: 20000,
    sparkPlugs: null,
  },
  HYBRID: {
    oilChange: 20000,
    sparkPlugs: 60000,
  },
  ELECTRIC: {
    oilChange: null,
    sparkPlugs: null,
    timingBelt: null,
    airFilter: null,
    generalService: null,
  },
  LPG: {
    oilChange: 10000,
    sparkPlugs: 30000,
  },
  OTHER: {
    oilChange: 15000,
    sparkPlugs: 45000,
  },
};

// Labels humains pour les types de maintenance
const MAINTENANCE_LABELS = {
  oilChange: 'Vidange',
  brakes: 'Plaquettes de frein',
  timingBelt: 'Courroie de distribution',
  tires: 'Pneus',
  generalService: 'Révision générale',
  airFilter: 'Filtre à air',
  cabinFilter: 'Filtre habitacle',
  coolant: 'Liquide de refroidissement',
  sparkPlugs: 'Bougies',
};

const vehicleBrands = [
  {
    name: 'Audi',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: 120000, generalService: 30000 },
    models: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'TT', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'S3', 'S4', 'S5'],
  },
  {
    name: 'BMW',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: null, generalService: 30000 },
    models: ['Série 1', 'Série 2', 'Série 3', 'Série 4', 'Série 5', 'Série 7', 'Série 8', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'i7', 'iX', 'iX3', 'M3', 'M4', 'M5'],
  },
  {
    name: 'Citroën',
    maintenance: { oilChange: 20000, brakes: 30000, timingBelt: 100000, generalService: 20000 },
    models: ['C1', 'C3', 'C3 Aircross', 'C4', 'C4 X', 'C5 Aircross', 'C5 X', 'Berlingo', 'SpaceTourer', 'ë-C4', 'Ami'],
  },
  {
    name: 'Dacia',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: 90000, generalService: 15000 },
    models: ['Sandero', 'Sandero Stepway', 'Duster', 'Jogger', 'Spring', 'Logan'],
  },
  {
    name: 'DS',
    maintenance: { oilChange: 20000, brakes: 30000, timingBelt: 120000, generalService: 20000 },
    models: ['DS 3', 'DS 3 Crossback', 'DS 4', 'DS 7', 'DS 9'],
  },
  {
    name: 'Fiat',
    maintenance: { oilChange: 15000, brakes: 25000, timingBelt: 100000, generalService: 15000 },
    models: ['500', '500X', '500e', '500L', 'Panda', 'Tipo', 'Punto', 'Doblo'],
  },
  {
    name: 'Ford',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: 120000, generalService: 20000 },
    models: ['Fiesta', 'Focus', 'Puma', 'Kuga', 'Mustang', 'Mustang Mach-E', 'Explorer', 'Ranger', 'Transit', 'Galaxy', 'S-Max', 'Mondeo'],
  },
  {
    name: 'Honda',
    maintenance: { oilChange: 12000, brakes: 30000, timingBelt: 120000, generalService: 20000 },
    models: ['Civic', 'Jazz', 'HR-V', 'CR-V', 'ZR-V', 'e:Ny1', 'Honda e'],
  },
  {
    name: 'Hyundai',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: 100000, generalService: 15000 },
    models: ['i10', 'i20', 'i30', 'Kona', 'Tucson', 'Santa Fe', 'IONIQ 5', 'IONIQ 6', 'Bayon'],
  },
  {
    name: 'Jeep',
    maintenance: { oilChange: 12000, brakes: 30000, timingBelt: 120000, generalService: 20000 },
    models: ['Renegade', 'Compass', 'Wrangler', 'Gladiator', 'Grand Cherokee', 'Avenger'],
  },
  {
    name: 'Kia',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: 100000, generalService: 15000 },
    models: ['Picanto', 'Rio', 'Ceed', 'XCeed', 'Sportage', 'Sorento', 'EV6', 'EV9', 'Niro', 'Stonic'],
  },
  {
    name: 'Land Rover',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: null, generalService: 25000 },
    models: ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport', 'Range Rover Evoque', 'Range Rover Velar'],
  },
  {
    name: 'Mazda',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: null, generalService: 20000 },
    models: ['Mazda2', 'Mazda3', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'MX-5', 'MX-30'],
  },
  {
    name: 'Mercedes-Benz',
    maintenance: { oilChange: 15000, brakes: 35000, timingBelt: null, generalService: 25000 },
    models: ['Classe A', 'Classe B', 'Classe C', 'Classe E', 'Classe S', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'AMG GT'],
  },
  {
    name: 'Mini',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: null, generalService: 20000 },
    models: ['Mini 3 portes', 'Mini 5 portes', 'Mini Cabrio', 'Mini Clubman', 'Mini Countryman', 'Mini Electric'],
  },
  {
    name: 'Nissan',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: 100000, generalService: 20000 },
    models: ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Ariya', 'Navara', 'Townstar'],
  },
  {
    name: 'Opel',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: 120000, generalService: 20000 },
    models: ['Corsa', 'Astra', 'Mokka', 'Crossland', 'Grandland', 'Combo', 'Zafira', 'Vivaro'],
  },
  {
    name: 'Peugeot',
    maintenance: { oilChange: 20000, brakes: 30000, timingBelt: 120000, generalService: 20000 },
    models: ['108', '208', '308', '408', '508', '2008', '3008', '5008', 'Partner', 'Rifter', 'e-208', 'e-308', 'e-2008', 'e-3008'],
  },
  {
    name: 'Porsche',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: null, generalService: 30000 },
    models: ['911', '718 Cayman', '718 Boxster', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  },
  {
    name: 'Renault',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: 120000, generalService: 20000 },
    models: ['Clio', 'Captur', 'Mégane', 'Mégane E-Tech', 'Arkana', 'Austral', 'Espace', 'Scénic', 'Kangoo', 'Twingo', 'Zoe', 'R5 E-Tech'],
  },
  {
    name: 'Seat',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: 120000, generalService: 20000 },
    models: ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco'],
  },
  {
    name: 'Škoda',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: 120000, generalService: 20000 },
    models: ['Fabia', 'Scala', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq'],
  },
  {
    name: 'Tesla',
    maintenance: { oilChange: null, brakes: 50000, timingBelt: null, generalService: 20000 },
    models: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  },
  {
    name: 'Toyota',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: 100000, generalService: 15000 },
    models: ['Aygo', 'Yaris', 'Yaris Cross', 'Corolla', 'C-HR', 'RAV4', 'Highlander', 'Land Cruiser', 'Supra', 'bZ4X', 'Camry'],
  },
  {
    name: 'Volkswagen',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: 120000, generalService: 20000 },
    models: ['Polo', 'Golf', 'T-Roc', 'T-Cross', 'Tiguan', 'Touareg', 'Passat', 'Arteon', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'ID. Buzz', 'Taigo', 'Up!'],
  },
  {
    name: 'Volvo',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: null, generalService: 30000 },
    models: ['XC40', 'XC60', 'XC90', 'C40', 'S60', 'S90', 'V60', 'V90', 'EX30', 'EX90'],
  },
  {
    name: 'Alpine',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: null, generalService: 20000 },
    models: ['A110', 'A110 R', 'A290'],
  },
  {
    name: 'Cupra',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: 120000, generalService: 20000 },
    models: ['Born', 'Formentor', 'Leon', 'Ateca', 'Tavascan'],
  },
  {
    name: 'MG',
    maintenance: { oilChange: 15000, brakes: 30000, timingBelt: 100000, generalService: 15000 },
    models: ['MG4', 'ZS', 'ZS EV', 'HS', 'MG5', 'Marvel R'],
  },
  {
    name: 'BYD',
    maintenance: { oilChange: null, brakes: 50000, timingBelt: null, generalService: 20000 },
    models: ['Atto 3', 'Han', 'Tang', 'Dolphin', 'Seal', 'Seal U'],
  },
];

/**
 * Récupérer les intervalles de maintenance pour une marque et un type de carburant
 */
function getMaintenanceIntervals(brandName, fuelType = 'GASOLINE') {
  const brand = vehicleBrands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
  const brandMaint = brand?.maintenance || {};

  const intervals = { ...DEFAULT_MAINTENANCE, ...brandMaint };

  const fuelOverride = FUEL_MAINTENANCE[fuelType] || FUEL_MAINTENANCE.OTHER;
  for (const [key, value] of Object.entries(fuelOverride)) {
    intervals[key] = value;
  }

  return intervals;
}

/**
 * Entretiens applicables pour un véhicule (clés non nulles uniquement)
 */
function getApplicableMaintenanceItems(brandName, fuelType = 'GASOLINE') {
  const intervals = getMaintenanceIntervals(brandName, fuelType);
  return Object.entries(intervals)
    .filter(([, intervalKm]) => intervalKm != null)
    .map(([key, intervalKm]) => ({
      key,
      label: MAINTENANCE_LABELS[key] || key,
      intervalKm,
    }));
}

module.exports = {
  vehicleBrands,
  getMaintenanceIntervals,
  getApplicableMaintenanceItems,
  MAINTENANCE_LABELS,
};
