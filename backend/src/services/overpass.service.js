const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

/** Overpass server-side budget (seconds). Keep below CLIENT_TIMEOUT_MS. */
const QUERY_TIMEOUT_S = 15;
/** Abort hung fetches before they stall the request forever. */
const CLIENT_TIMEOUT_MS = 18000;

const FILTER_DEFS = {
  garage: {
    label: 'Garages',
    tags: [['amenity', 'car_repair'], ['shop', 'car_repair']],
  },
  ct: {
    label: 'Contrôle tech.',
    tags: [['amenity', 'vehicle_inspection']],
  },
  carwash: {
    label: 'Lavage',
    tags: [['amenity', 'car_wash'], ['shop', 'car_wash'], ['self_service', 'car_wash']],
  },
};

const USER_AGENT = 'Carvio/1.0 (+https://carvio.fr; contact@carvio.fr)';

function isTimeoutError(err) {
  return err?.name === 'TimeoutError' || err?.name === 'AbortError';
}

function overpassTimeoutError() {
  const err = new Error('Overpass timeout');
  err.status = 504;
  return err;
}

async function fetchOverpass(query, attempt = 0) {
  const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length];
  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    });
  } catch (err) {
    if (isTimeoutError(err)) throw overpassTimeoutError();
    throw err;
  }

  if (!res.ok) {
    const err = new Error(`Overpass ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

function parseElements(elements) {
  return elements.map((el) => {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) return null;

    let type = 'garage';
    if (el.tags?.amenity === 'vehicle_inspection' || el.tags?.shop === 'vehicle_inspection') type = 'ct';
    else if (el.tags?.amenity === 'car_wash' || el.tags?.shop === 'car_wash' || el.tags?.self_service === 'car_wash') type = 'carwash';

    const name = el.tags?.name || el.tags?.operator || FILTER_DEFS[type]?.label || 'Lieu';
    const address = [el.tags?.['addr:housenumber'], el.tags?.['addr:street'], el.tags?.['addr:city']]
      .filter(Boolean)
      .join(' ') || '';

    return { id: el.id, lat, lon, name, address, type };
  }).filter(Boolean);
}

function buildQuery(lat, lon, radius, types) {
  // `nwr` covers node/way/relation in one clause — fewer Overpass selectors, faster.
  const conditions = types.flatMap((type) => {
    const def = FILTER_DEFS[type];
    if (!def) return [];
    return def.tags.map(([k, v]) =>
      `nwr["${k}"="${v}"](around:${radius},${lat},${lon});`,
    );
  });

  return `[out:json][timeout:${QUERY_TIMEOUT_S}];(${conditions.join('')});out center;`;
}

class OverpassService {
  async getPois(lat, lon, radius, types) {
    const validTypes = types.filter((t) => FILTER_DEFS[t]);
    if (validTypes.length === 0) return [];

    const query = buildQuery(lat, lon, radius, validTypes);
    let lastError;

    for (let attempt = 0; attempt < OVERPASS_ENDPOINTS.length; attempt++) {
      try {
        const data = await fetchOverpass(query, attempt);
        return parseElements(data.elements || []);
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || overpassTimeoutError();
  }
}

module.exports = new OverpassService();
module.exports.FILTER_DEFS = FILTER_DEFS;
