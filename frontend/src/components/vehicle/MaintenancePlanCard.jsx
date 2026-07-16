import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Settings, Pencil, Check, AlertTriangle, CheckCircle2, ChevronDown, RotateCcw } from 'lucide-react';
import { vehicleApi } from '../../services/api';
import { queryKeys } from '../../lib/query';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const statusColors = { ok: '#22c55e', soon: '#f59e0b', overdue: '#ff2a3f' };
const statusLabels = { ok: 'OK', soon: 'Bientôt', overdue: 'Dépassé' };

export default function MaintenancePlanCard({ vehicleId, brand, fuelTypeLabel, maintenancePlan, variants }) {
  const queryClient = useQueryClient();
  const [editingInterval, setEditingInterval] = useState(null);
  const [editIntervalValue, setEditIntervalValue] = useState('');
  const [editingLastKm, setEditingLastKm] = useState(null);
  const [editLastKmValue, setEditLastKmValue] = useState('');
  const [markingDone, setMarkingDone] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const refreshPlan = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.vehicleMaintenance(vehicleId) });
  };

  const saveInterval = async (key, value) => {
    try {
      const intervals = { ...(maintenancePlan?.custom || {}), [key]: value === '' ? null : parseInt(value) };
      await vehicleApi.updateMaintenancePlan(vehicleId, { intervals });
      await refreshPlan();
      setEditingInterval(null);
    } catch { /* ignore */ }
  };

  const saveLastKm = async (key, value) => {
    try {
      const n = parseInt(value, 10);
      if (isNaN(n) || n < 0) return;
      await vehicleApi.updateMaintenancePlan(vehicleId, { lastKm: { [key]: n } });
      await refreshPlan();
      setEditingLastKm(null);
    } catch { /* ignore */ }
  };

  const markAsDone = async (key) => {
    try {
      setMarkingDone(key);
      await vehicleApi.markMaintenanceDone(vehicleId, key);
      await refreshPlan();
    } catch { /* ignore */ }
    finally { setMarkingDone(null); }
  };

  if (!maintenancePlan?.plan?.length) return null;

  const actionNeeded = maintenancePlan.plan.filter(i => i.status === 'soon' || i.status === 'overdue');
  const okItems = maintenancePlan.plan.filter(i => i.status === 'ok');
  const displayItems = showAll ? maintenancePlan.plan : actionNeeded;
  const allOk = actionNeeded.length === 0;

  const renderItem = (item) => {
    const color = statusColors[item.status];
    const isEditingInterval = editingInterval === item.key;
    const isEditingLastKm = editingLastKm === item.key;

    return (
      <Motion.div
        key={item.key}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="overflow-hidden"
      >
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
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
            <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.min(100, item.pct)}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}60` }} />
          </div>
          <div className="flex flex-col gap-2 text-[11px] text-white/40">
            <div className="flex items-center justify-between">
              <span>{item.remaining > 0 ? `${item.remaining.toLocaleString('fr-FR')} km restants` : `Dépassé de ${Math.abs(item.remaining).toLocaleString('fr-FR')} km`}</span>
              {isEditingInterval ? (
                <div className="flex items-center gap-1">
                  <input type="number" className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-base text-white" value={editIntervalValue} onChange={(e) => setEditIntervalValue(e.target.value)} autoFocus />
                  <button onClick={() => saveInterval(item.key, editIntervalValue)} className="text-emerald-400 hover:text-emerald-300 p-2.5 -mr-1 rounded-lg"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingInterval(null)} className="text-white/30 hover:text-white/50 p-2.5 -mr-1 rounded-lg text-sm">✕</button>
                </div>
              ) : (
                <button onClick={() => { setEditingInterval(item.key); setEditIntervalValue(String(item.intervalKm)); }} className="text-white/30 hover:text-white/50 flex items-center gap-1.5 py-1 px-2 -mr-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                  <span>tous les {item.intervalKm.toLocaleString('fr-FR')} km</span>
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              {isEditingLastKm ? (
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-white/30 shrink-0">Dernier à</span>
                  <input type="number" className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-base text-white" value={editLastKmValue} onChange={(e) => setEditLastKmValue(e.target.value)} autoFocus />
                  <span className="text-white/30">km</span>
                  <button onClick={() => saveLastKm(item.key, editLastKmValue)} className="text-emerald-400 hover:text-emerald-300 p-2 rounded-lg"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingLastKm(null)} className="text-white/30 hover:text-white/50 p-2 rounded-lg text-sm">✕</button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => { setEditingLastKm(item.key); setEditLastKmValue(String(item.lastKm)); }}
                    className="text-white/30 hover:text-white/50 flex items-center gap-1.5 py-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Dernier entretien à {item.lastKm.toLocaleString('fr-FR')} km</span>
                  </button>
                  {(item.status === 'overdue' || item.status === 'soon') && (
                    <button
                      onClick={() => markAsDone(item.key)}
                      disabled={markingDone === item.key}
                      className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold py-1 px-2 rounded-lg hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {markingDone === item.key ? '...' : 'Marquer fait'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Motion.div>
    );
  };

  return (
    <Motion.div variants={variants} className="bento-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-display">Entretien préconisé</h2>
            <p className="text-xs text-white/40">
              Basé sur {brand}{fuelTypeLabel ? ` (${fuelTypeLabel})` : ''} — personnalisable
            </p>
          </div>
        </div>
      </div>

      {allOk && !showAll && (
        <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 mb-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-400">Tout est à jour</p>
            <p className="text-xs text-white/40 mt-0.5">Aucun entretien à prévoir pour le moment</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {displayItems.map(renderItem)}
        </AnimatePresence>
      </div>

      {okItems.length > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-bold text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} />
          {showAll ? 'Masquer les entretiens OK' : `Voir tout (${okItems.length} OK)`}
        </button>
      )}
    </Motion.div>
  );
}
