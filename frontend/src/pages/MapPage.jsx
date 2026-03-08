import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion as Motion } from 'framer-motion';
import { MapPin, Navigation, Wrench, ShieldCheck, Droplets, Fuel, Search, ExternalLink, Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths broken by Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const FILTERS = [
  { id: 'garage',  label: 'Garages',       icon: Wrench,      color: '#7c5cfc', tags: [['amenity','car_repair'],['shop','car_repair']] },
  { id: 'ct',      label: 'Contrôle tech.', icon: ShieldCheck, color: '#22c55e', tags: [['amenity','vehicle_inspection']] },
  { id: 'carwash', label: 'Lavage',         icon: Droplets,    color: '#38bdf8', tags: [['amenity','car_wash'],['shop','car_wash'],['self_service','car_wash']] },
  { id: 'fuel',    label: 'Carburant',      icon: Fuel,        color: '#f59e0b', tags: [] },
];

const DEFAULT_CENTER = [48.8566, 2.3522];
const RADIUS = 5000;

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });
}

function makeFuelIcon(gazolePrice) {
  const label = gazolePrice ? `${parseFloat(gazolePrice).toFixed(3)}€` : '⛽';
  return L.divIcon({
    className: '',
    html: `<div style="background:#f59e0b;border:2px solid rgba(255,255,255,0.9);border-radius:8px;padding:3px 7px;font-size:10px;font-weight:800;color:white;letter-spacing:-0.3px;box-shadow:0 2px 10px rgba(245,158,11,0.5);white-space:nowrap;">${label}</div>`,
    iconSize: [58, 24],
    iconAnchor: [29, 24],
    popupAnchor: [0, -28],
  });
}

const ICONS = Object.fromEntries(
  FILTERS.filter(f => f.id !== 'fuel').map(f => [f.id, makeIcon(f.color)])
);

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#ff2a3f;border:3px solid white;box-shadow:0 0 0 6px rgba(255,42,63,0.2), 0 2px 8px rgba(0,0,0,0.4);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14, { animate: true });
  }, [center, map]);
  return null;
}

async function fetchPOIs(lat, lon, activeFilters) {
  const overpassFilters = activeFilters.filter(id => id !== 'fuel');
  if (overpassFilters.length === 0) return [];

  const conditions = overpassFilters.flatMap(id => {
    const f = FILTERS.find(f => f.id === id);
    return f.tags.map(([k, v]) => `node["${k}"="${v}"](around:${RADIUS},${lat},${lon});way["${k}"="${v}"](around:${RADIUS},${lat},${lon});`);
  });

  const query = `[out:json][timeout:15];(${conditions.join('')});out center;`;
  const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Overpass API error');
  const data = await res.json();

  return data.elements.map(el => {
    const lat2 = el.lat ?? el.center?.lat;
    const lon2 = el.lon ?? el.center?.lon;
    if (!lat2 || !lon2) return null;

    let type = 'garage';
    if (el.tags?.amenity === 'vehicle_inspection' || el.tags?.shop === 'vehicle_inspection') type = 'ct';
    else if (el.tags?.amenity === 'car_wash' || el.tags?.shop === 'car_wash' || el.tags?.self_service === 'car_wash') type = 'carwash';

    const name = el.tags?.name || el.tags?.operator || FILTERS.find(f => f.id === type)?.label || 'Lieu';
    const address = [el.tags?.['addr:housenumber'], el.tags?.['addr:street'], el.tags?.['addr:city']]
      .filter(Boolean).join(' ') || '';

    return { id: el.id, lat: lat2, lon: lon2, name, address, type };
  }).filter(Boolean);
}

async function fetchFuelStations(lat, lon) {
  // ODS geo filter: POINT(longitude latitude) — lon first, URL-encoded
  const where = encodeURIComponent(`distance(geom,geom'POINT(${lon} ${lat})',5000m)`);
  const url = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?where=${where}&limit=20&select=id,adresse,ville,geom,gazole_prix,sp95_prix,e10_prix,sp98_prix`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fuel API error');
  const data = await res.json();

  return (data.results || [])
    .map(s => {
      // geom field contains proper WGS84 coords {lat, lon}
      if (!s.geom?.lat || !s.geom?.lon) return null;
      return {
        id: `fuel_${s.id}`,
        lat: s.geom.lat,
        lon: s.geom.lon,
        name: [s.adresse, s.ville].filter(Boolean).join(' — ') || 'Station service',
        address: s.ville || '',
        type: 'fuel',
        prices: {
          Gazole: s.gazole_prix ?? null,
          SP95:   s.sp95_prix   ?? null,
          E10:    s.e10_prix    ?? null,
          SP98:   s.sp98_prix   ?? null,
        },
      };
    })
    .filter(Boolean);
}

function distance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function FuelPopup({ poi, onDirections }) {
  const priceEntries = Object.entries(poi.prices).filter(([, v]) => v !== null);
  return (
    <div className="min-w-[180px]">
      <div className="font-bold text-sm mb-1">{poi.name}</div>
      {poi.address && <div className="text-xs text-gray-500 mb-2">{poi.address}</div>}
      {priceEntries.length > 0 ? (
        <div className="grid grid-cols-2 gap-1 mb-2">
          {priceEntries.map(([fuel, price]) => (
            <div key={fuel} className="flex items-center justify-between bg-orange-50 rounded px-2 py-1">
              <span className="text-[11px] font-bold text-gray-600">{fuel}</span>
              <span className="text-[11px] font-black text-gray-900">{price.toFixed(3)}€</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-2">Prix non disponibles</p>
      )}
      <button
        onClick={onDirections}
        className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
      >
        Itinéraire <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function MapPage() {
  const [userPos, setUserPos] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [activeFilters, setActiveFilters] = useState(['garage', 'ct', 'carwash', 'fuel']);
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [selected, setSelected] = useState(null);
  const markersRef = useRef({});
  const userPosRef = useRef(null);

  const loadPOIs = useCallback(async (lat, lon, filters) => {
    setLoading(true);
    try {
      const [overpassResults, fuelResults] = await Promise.all([
        fetchPOIs(lat, lon, filters),
        filters.includes('fuel') ? fetchFuelStations(lat, lon) : Promise.resolve([]),
      ]);
      setPois([...overpassResults, ...fuelResults]);
    } catch {
      // silently fail — map remains usable
    } finally {
      setLoading(false);
    }
  }, []);

  const locateUser = useCallback(() => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = [coords.latitude, coords.longitude];
        setUserPos(pos);
        userPosRef.current = pos;
        setMapCenter(pos);
        loadPOIs(coords.latitude, coords.longitude, activeFilters);
      },
      () => {
        setGeoError("Accès à la localisation refusé.");
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, [activeFilters, loadPOIs]);

  useEffect(() => { locateUser(); }, []);

  const toggleFilter = (id) => {
    setActiveFilters(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      const pos = userPosRef.current;
      if (pos) loadPOIs(pos[0], pos[1], next);
      return next;
    });
  };

  const openDirections = (poi) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lon}`, '_blank');
  };

  const sortedPois = userPos
    ? [...pois].sort((a, b) => distance(userPos[0], userPos[1], a.lat, a.lon) - distance(userPos[0], userPos[1], b.lat, b.lon))
    : pois;

  const fuelStations = pois.filter(p => p.type === 'fuel');
  const gazolePrices = fuelStations.map(s => s.prices?.Gazole).filter(Boolean);
  const avgGazole = gazolePrices.length > 0
    ? (gazolePrices.reduce((a, b) => a + b, 0) / gazolePrices.length).toFixed(3)
    : null;

  return (
    <div className="h-[calc(100vh-80px)] md:h-screen flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 md:px-6 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black font-display text-white tracking-tight">
              Carte des services
            </h1>
            <p className="text-xs text-white/40 font-medium mt-0.5">
              Garages, contrôles, lavages & carburant à proximité
            </p>
          </div>
          <button
            onClick={locateUser}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl cv-btn-dark text-sm font-semibold"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin text-accent" />
              : <Navigation className="w-4 h-4 text-accent" />
            }
            <span className="hidden sm:inline">Ma position</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {FILTERS.map(f => {
            const active = activeFilters.includes(f.id);
            const count = pois.filter(p => p.type === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => toggleFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  active
                    ? 'text-white border-white/20 bg-white/10'
                    : 'text-white/40 border-white/8 hover:border-white/15 hover:text-white/70'
                }`}
                style={active ? { borderColor: `${f.color}40`, color: f.color, background: `${f.color}15` } : {}}
              >
                <f.icon className="w-3.5 h-3.5" />
                {f.label}
                {active && count > 0 && (
                  <span className="ml-0.5 opacity-70">
                    {f.id === 'fuel' && avgGazole ? `· moy. ${avgGazole}€` : `(${count})`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {geoError && (
          <p className="text-xs text-accent font-medium mt-2">{geoError}</p>
        )}
      </div>

      {/* ── Map + List ── */}
      <div className="flex-1 flex gap-4 px-4 md:px-6 pb-4 md:pb-6 min-h-0">
        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-white/8 relative">
          <MapContainer
            center={mapCenter}
            zoom={14}
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>'
            />
            <MapController center={mapCenter} />

            {userPos && (
              <Marker position={userPos} icon={userIcon}>
                <Popup>
                  <div className="text-center text-sm font-semibold">Vous êtes ici</div>
                </Popup>
              </Marker>
            )}

            {sortedPois.map(poi => {
              if (poi.type === 'fuel') {
                return (
                  <Marker
                    key={poi.id}
                    position={[poi.lat, poi.lon]}
                    icon={makeFuelIcon(poi.prices?.Gazole)}
                    ref={ref => { if (ref) markersRef.current[poi.id] = ref; }}
                    eventHandlers={{ click: () => setSelected(poi) }}
                  >
                    <Popup>
                      <FuelPopup poi={poi} onDirections={() => openDirections(poi)} />
                    </Popup>
                  </Marker>
                );
              }
              const filterDef = FILTERS.find(f => f.id === poi.type);
              return (
                <Marker
                  key={poi.id}
                  position={[poi.lat, poi.lon]}
                  icon={ICONS[poi.type] || ICONS.garage}
                  ref={ref => { if (ref) markersRef.current[poi.id] = ref; }}
                  eventHandlers={{ click: () => setSelected(poi) }}
                >
                  <Popup>
                    <div className="min-w-[160px]">
                      <div className="font-bold text-sm mb-1">{poi.name}</div>
                      {poi.address && <div className="text-xs text-gray-500 mb-2">{poi.address}</div>}
                      <div className="text-xs font-semibold mb-2" style={{ color: filterDef?.color }}>
                        {filterDef?.label}
                      </div>
                      <button
                        onClick={() => openDirections(poi)}
                        className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                      >
                        Itinéraire <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg/60 backdrop-blur-sm z-[1000]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <span className="text-sm font-semibold text-white/70">Recherche en cours…</span>
              </div>
            </div>
          )}
        </div>

        {/* Results list — desktop only */}
        <div className="hidden lg:flex flex-col w-72 xl:w-80 gap-2 overflow-y-auto">
          {sortedPois.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center text-white/30 gap-3">
              <Search className="w-8 h-8" />
              <p className="text-sm font-medium">
                {userPos ? 'Aucun résultat dans ce rayon' : 'Activez la géolocalisation\npour voir les lieux à proximité'}
              </p>
            </div>
          )}
          {sortedPois.map((poi) => {
            const filterDef = FILTERS.find(f => f.id === poi.type);
            const dist = userPos ? distance(userPos[0], userPos[1], poi.lat, poi.lon) : null;
            const isSelected = selected?.id === poi.id;
            return (
              <Motion.button
                key={poi.id}
                layout
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => {
                  setSelected(poi);
                  setMapCenter([poi.lat, poi.lon]);
                  markersRef.current[poi.id]?.openPopup();
                }}
                className={`cv-card p-4 text-left transition-all ${isSelected ? 'border-white/20' : ''}`}
                style={isSelected ? { borderColor: `${filterDef?.color}40`, background: `${filterDef?.color}10` } : {}}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${filterDef?.color}20` }}
                  >
                    {filterDef && <filterDef.icon className="w-4 h-4" style={{ color: filterDef.color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{poi.name}</p>
                    {poi.address && <p className="text-xs text-white/35 truncate mt-0.5">{poi.address}</p>}

                    {/* Fuel prices inline */}
                    {poi.type === 'fuel' && poi.prices && (
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        {Object.entries(poi.prices)
                          .filter(([, v]) => v !== null)
                          .map(([fuel, price]) => (
                            <span key={fuel} className="text-[10px] font-black" style={{ color: '#f59e0b' }}>
                              {fuel} {price.toFixed(3)}€
                            </span>
                          ))
                        }
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: filterDef?.color }}>
                        {filterDef?.label}
                      </span>
                      {dist !== null && (
                        <span className="text-[11px] font-semibold text-white/35 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {dist < 1000 ? `${dist}m` : `${(dist/1000).toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); openDirections(poi); }}
                  className="mt-3 w-full text-xs font-semibold text-white/40 hover:text-white/70 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Navigation className="w-3 h-3" /> Itinéraire Google Maps
                </button>
              </Motion.button>
            );
          })}
        </div>
      </div>

      {/* Mobile: horizontal scroll cards */}
      {sortedPois.length > 0 && (
        <div className="lg:hidden flex-shrink-0 px-4 pb-4">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {sortedPois.slice(0, 8).map(poi => {
              const filterDef = FILTERS.find(f => f.id === poi.type);
              const dist = userPos ? distance(userPos[0], userPos[1], poi.lat, poi.lon) : null;
              return (
                <button
                  key={poi.id}
                  onClick={() => {
                    setSelected(poi);
                    setMapCenter([poi.lat, poi.lon]);
                    markersRef.current[poi.id]?.openPopup();
                  }}
                  className="cv-card p-3 text-left flex-shrink-0 w-48"
                >
                  <p className="text-xs font-bold text-white truncate">{poi.name}</p>
                  {poi.type === 'fuel' && poi.prices?.Gazole && (
                    <p className="text-[11px] font-black mt-0.5" style={{ color: '#f59e0b' }}>
                      Gazole {poi.prices.Gazole.toFixed(3)}€
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-bold uppercase" style={{ color: filterDef?.color }}>
                      {filterDef?.label}
                    </span>
                    {dist !== null && (
                      <span className="text-[10px] text-white/35 font-semibold">
                        {dist < 1000 ? `${dist}m` : `${(dist/1000).toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
