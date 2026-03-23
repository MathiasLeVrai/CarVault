import { useEffect, useState } from 'react';
import { Fuel } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

const FUEL_TYPE_MAP = {
  GASOLINE: 'E10',
  DIESEL: 'DIESEL',
  HYBRID: 'E10',
  ELECTRIC: null,
  LPG: 'GPL',
  OTHER: 'SP95',
};

const FUEL_DISPLAY = {
  DIESEL: { label: 'Gazole', color: '#facc15' },
  SP95: { label: 'SP95', color: '#22c55e' },
  SP98: { label: 'SP98', color: '#38bdf8' },
  E10: { label: 'SP95-E10', color: '#22c55e' },
  E85: { label: 'E85', color: '#a78bfa' },
  GPL: { label: 'GPLc', color: '#f97316' },
};

export default function FuelPriceWidget({ userFuelType, variants }) {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('carvault_token');
    fetch('/api/dashboard/fuel-prices', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(setPrices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !prices || userFuelType === 'ELECTRIC') return null;

  const primaryKey = FUEL_TYPE_MAP[userFuelType] || 'E10';
  const primary = prices[primaryKey];
  if (!primary) return null;

  // Afficher aussi les 2-3 autres types principaux
  const otherKeys = Object.keys(prices).filter(k => k !== primaryKey).slice(0, 3);

  return (
    <Motion.div variants={variants} className="bento-card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber/10 flex items-center justify-center">
          <Fuel className="w-3.5 h-3.5 text-amber" strokeWidth={2.5} />
        </div>
        <h3 className="text-sm font-bold text-white font-display">Prix carburant</h3>
        <span className="text-[9px] text-ink-muted font-bold uppercase tracking-wider ml-auto">moy. nationale</span>
      </div>

      {/* Primary fuel type */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-3xl font-black text-white font-display">{primary.avgPrice.toFixed(3)}</span>
        <span className="text-sm text-ink-muted font-bold">/L</span>
        <span
          className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
          style={{
            color: FUEL_DISPLAY[primaryKey]?.color || '#fff',
            backgroundColor: `${FUEL_DISPLAY[primaryKey]?.color || '#fff'}15`,
          }}
        >
          {FUEL_DISPLAY[primaryKey]?.label || primaryKey}
        </span>
      </div>

      {/* Other fuel types */}
      {otherKeys.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {otherKeys.map(key => {
            const p = prices[key];
            const display = FUEL_DISPLAY[key];
            if (!p || !display) return null;
            return (
              <div key={key} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <p className="text-xs font-black text-white font-display">{p.avgPrice.toFixed(3)}</p>
                <p className="text-[9px] text-ink-muted font-bold uppercase tracking-wider mt-0.5">{display.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </Motion.div>
  );
}
