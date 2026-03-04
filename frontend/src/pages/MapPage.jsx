import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Wrench, ShieldCheck, Droplets, Search, ExternalLink, Loader2 } from 'lucide-react';
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
  { id: 'garage',    label: 'Garages',          icon: Wrench,      color: '#7c5cfc', tags: [['amenity','car_repair'],['shop','car_repair']] },
  { id: 'ct',        label: 'Contrôle tech.',    icon: ShieldCheck, color: '#22c55e', tags: [['amenity','vehicle_inspection']] },
  { id: 'carwash',   label: 'Lavage',            icon: Droplets,    color: '#38bdf8', tags: [['amenity','car_wash'],['shop','car_wash']] },
];

const DEFAULT_CENTER = [48.8566, 2.3522]; // Paris fallback
const RADIUS = 5000; // 5km

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      transform:rotate(-45deg);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });
}

const ICONS = Object.fromEntries(FILTERS.map(f => [f.id, makeIcon(f.color)]));

const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#ff2a3f;border:3px solid white;
    box-shadow:0 0 0 6px rgba(255,42,63,0.2), 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Helper: recenter map when center changes
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14, { animate: true });
  }, [center, map]);
  return null;
}

async function fetchPOIs(lat, lon, activeFilters) {
  if (activeFilters.length === 0) return [];

  const conditions = activeFilters.flatMap(id => {
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

    // Determine type
    let type = 'garage';
    if (el.tags?.amenity === 'vehicle_inspection' || el.tags?.shop === 'vehicle_inspection') type = 'ct';
    else if (el.tags?.amenity === 'car_wash' || el.tags?.shop === 'car_wash') type = 'carwash';

    const name = el.tags?.name || el.tags?.operator || FILTERS.find(f => f.id === type)?.label || 'Lieu';
    const address = [el.tags?.['addr:housenumber'], el.tags?.['addr:street'], el.tags?.['addr:city']]
      .filter(Boolean).join(' ') || '';

    return { id: el.id, lat: lat2, lon: lon2, name, address, type };
  }).filter(Boolean);
}

function distance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export default function MapPage() {
  const [userPos, setUserPos] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [activeFilters, setActiveFilters] = useState(['garage', 'ct']);
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [selected, setSelected] = useState(null);
  const markersRef = useRef({});

  const loadPOIs = useCallback(async (lat, lon, filters) => {
    setLoading(true);
    try {
      const results = await fetchPOIs(lat, lon, filters);
      setPois(results);
    } catch {
      // silently fail — map is still usable
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

  // Auto-locate on mount
  useEffect(() => { locateUser(); }, []);

  const toggleFilter = (id) => {
    setActiveFilters(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (userPos) loadPOIs(userPos[0], userPos[1], next);
      return next;
    });
  };

  const openDirections = (poi) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lon}`, '_blank');
  };

  const sortedPois = userPos
    ? [...pois].sort((a, b) => distance(userPos[0], userPos[1], a.lat, a.lon) - distance(userPos[0], userPos[1], b.lat, b.lon))
    : pois;

  return (
    <div className="h-[calc(100vh-80px)] md:h-screen flex flex-col overflow-hidden">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 md:px-6 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black font-display text-white tracking-tight">
              Carte des services
            </h1>
            <p className="text-xs text-white/40 font-medium mt-0.5">
              Garages, contrôles techniques et lavages à proximité
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
                {active && pois.filter(p => p.type === f.id).length > 0 && (
                  <span className="ml-0.5 opacity-70">
                    ({pois.filter(p => p.type === f.id).length})
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

      {/* ── Map + List ─────────────────────────────────── */}
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

            {/* User marker */}
            {userPos && (
              <Marker position={userPos} icon={userIcon}>
                <Popup>
                  <div className="text-center text-sm font-semibold">Vous êtes ici</div>
                </Popup>
              </Marker>
            )}

            {/* POI markers */}
            {sortedPois.map(poi => {
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

          {/* Loading overlay */}
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
              <motion.button
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
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Mobile: bottom sheet mini list */}
      {sortedPois.length > 0 && (
        <div className="lg:hidden flex-shrink-0 px-4 pb-4">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {sortedPois.slice(0, 6).map(poi => {
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
