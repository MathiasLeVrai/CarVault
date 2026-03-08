/**
 * OCR Carte Grise française
 * Extrait les champs standardisés depuis une photo/scan de carte grise
 *
 * Champs visés :
 *   A   → Numéro d'immatriculation
 *   B   → Date de première immatriculation
 *   D.1 → Marque
 *   D.2 → Type / Variante / Version
 *   D.3 → Dénomination commerciale (= modèle)
 *   E   → Numéro d'identification (VIN)
 *   G   → Masse en service (kg)
 *   I   → Date du certificat
 *   P.1 → Cylindrée (cm³)
 *   P.3 → Carburant
 *   P.6 → Puissance administrative (CV)
 *   J.1 → Genre national (VP, CTTE, etc.)
 *   U.1 → Niveau sonore (dB)
 */

const FUEL_MAP = {
  'GO': 'DIESEL', 'GAZOLE': 'DIESEL', 'GASOIL': 'DIESEL', 'DIESEL': 'DIESEL',
  'ES': 'GASOLINE', 'ESSENCE': 'GASOLINE', 'SUPER': 'GASOLINE', 'SP95': 'GASOLINE', 'SP98': 'GASOLINE',
  'EL': 'ELECTRIC', 'ELECTRIQUE': 'ELECTRIC', 'ELECTRIC': 'ELECTRIC',
  'EH': 'HYBRID', 'HYBRIDE': 'HYBRID', 'HY': 'HYBRID',
  'GP': 'LPG', 'GPL': 'LPG', 'GNV': 'LPG',
};

function normalizeFuel(raw) {
  if (!raw) return null;
  const upper = raw.toUpperCase().trim();
  return FUEL_MAP[upper] || null;
}

/**
 * Parse OCR text from a French carte grise
 * Uses field labels (A, B, D.1, etc.) as anchors
 */
function parseCarteGriseText(text) {
  const result = {
    licensePlate: null,
    brand: null,
    model: null,
    year: null,
    fuelType: null,
    vin: null,
  };

  // Normalize text
  const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
  const full = lines.join(' ');

  // --- Plaque (champ A) ---
  // French plates: XX-NNN-XX or old format NNNN-XX-NN
  const platePatterns = [
    /\b([A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{2})\b/,
    /\b(\d{1,4}[-\s]?[A-Z]{2,3}[-\s]?\d{2})\b/,
  ];
  for (const pat of platePatterns) {
    const m = full.match(pat);
    if (m) {
      result.licensePlate = m[1].replace(/\s+/g, '-').toUpperCase();
      break;
    }
  }

  // --- Helper: find value after a field label ---
  function findField(label, source) {
    // Try "D.1 RENAULT" or "D.1 : RENAULT" or "D1 RENAULT"
    const escaped = label.replace('.', '\\.?');
    const re = new RegExp(`${escaped}\\s*[:\\-]?\\s*(.+?)(?=\\s+[A-Z]\\.|$)`, 'i');
    const m = source.match(re);
    return m ? m[1].trim() : null;
  }

  // --- Marque (D.1) ---
  const d1 = findField('D\\.1', full);
  if (d1) {
    // D.1 usually contains just the brand
    result.brand = d1.split(/\s+/)[0].toUpperCase();
  }

  // --- Modèle (D.3) ---
  const d3 = findField('D\\.3', full);
  if (d3) {
    result.model = d3.replace(/\s+/g, ' ').trim();
  }

  // --- Fallback: D.2 if D.3 is empty ---
  if (!result.model) {
    const d2 = findField('D\\.2', full);
    if (d2) result.model = d2.replace(/\s+/g, ' ').trim();
  }

  // --- Date première immatriculation (B) → year ---
  const datePatterns = [
    /\b[B]\s*[:-]?\s*(\d{2})[/.-](\d{2})[/.](\d{4})\b/,
    /\b(\d{2})[/.-](\d{2})[/.](\d{4})\b/,
  ];
  for (const pat of datePatterns) {
    const m = full.match(pat);
    if (m) {
      const yr = parseInt(m[3] || m[2]);
      if (yr >= 1950 && yr <= new Date().getFullYear() + 1) {
        result.year = String(yr);
        break;
      }
    }
  }

  // --- Carburant (P.3) ---
  const p3 = findField('P\\.3', full);
  if (p3) {
    result.fuelType = normalizeFuel(p3.split(/\s+/)[0]);
  }
  // Fallback: scan for fuel keywords
  if (!result.fuelType) {
    for (const [keyword, fuelType] of Object.entries(FUEL_MAP)) {
      if (full.toUpperCase().includes(keyword)) {
        result.fuelType = fuelType;
        break;
      }
    }
  }

  // --- VIN (E) ---
  const vinMatch = full.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  if (vinMatch) result.vin = vinMatch[1];

  return result;
}

/**
 * Main entry: takes a File (image), runs OCR, returns extracted fields
 */
export default async function parseCarteGrise(file) {
  const Tesseract = await import('tesseract.js');

  // Create image URL
  const imageUrl = URL.createObjectURL(file);

  try {
    const worker = await Tesseract.createWorker('fra', 1, {
      logger: () => {},
    });
    await worker.setParameters({
      tessedit_pageseg_mode: '6', // Assume uniform block of text
    });

    const { data } = await worker.recognize(imageUrl);
    await worker.terminate();

    const result = parseCarteGriseText(data.text);
    return result;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
