import { useState } from 'react';
import { Settings, Pencil, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { vehicleApi } from '../../services/api';
import { motion as Motion } from 'framer-motion';

const statusColors = { ok: '#22c55e', soon: '#f59e0b', overdue: '#ff2a3f' };
const statusLabels = { ok: 'OK', soon: 'Bientôt', overdue: 'Dépassé' };

export default function MaintenancePlanCard({ vehicleId, brand, maintenancePlan, setMaintenancePlan, variants }) {
  const [editingInterval, setEditingInterval] = useState(null);
  const [editIntervalValue, setEditIntervalValue] = useState('');

  const saveInterval = async (key, value) => {
    try {
      const intervals = { ...(maintenancePlan?.custom || {}), [key]: value === '' ? null : parseInt(value) };
      await vehicleApi.updateMaintenancePlan(vehicleId, intervals);
      const updated = await vehicleApi.getMaintenancePlan(vehicleId);
      setMaintenancePlan(updated);
      setEditingInterval(null);
    } catch { /* ignore */ }
  };

  if (!maintenancePlan?.plan?.length) return null;

  return (
    <Motion.div variants={variants} className="bento-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-display">Entretien préconisé</h2>
            <p className="text-xs text-white/40">Basé sur {brand} — personnalisable</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {maintenancePlan.plan.map((item) => {
          const color = statusColors[item.status];
          const isEditing = editingInterval === item.key;

          return (
            <div key={item.key} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {item.status === 'overdue' ? (
                    <AlertTriangle className="w-4 h-4 text-[#ff2a3f]" />
                  ) : item.status === 'soon' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="text-sm font-bold text-white">{item.label}</span>
                  {item.isCustom && <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full font-bold">Perso</span>}
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>{statusLabels[item.status]}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, item.pct)}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}60` }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-white/40">
                <span>{item.remaining > 0 ? `${item.remaining.toLocaleString('fr-FR')} km restants` : `Dépassé de ${Math.abs(item.remaining).toLocaleString('fr-FR')} km`}</span>
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input type="number" className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white" value={editIntervalValue} onChange={(e) => setEditIntervalValue(e.target.value)} autoFocus />
                    <button onClick={() => saveInterval(item.key, editIntervalValue)} className="text-emerald-400 hover:text-emerald-300 p-1"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingInterval(null)} className="text-white/30 hover:text-white/50 p-1 text-xs">✕</button>
                  </div>
                ) : (
                  <button onClick={() => { setEditingInterval(item.key); setEditIntervalValue(String(item.intervalKm)); }} className="text-white/30 hover:text-white/50 flex items-center gap-1">
                    <Pencil className="w-3 h-3" />
                    <span>tous les {item.intervalKm.toLocaleString('fr-FR')} km</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Motion.div>
  );
}
