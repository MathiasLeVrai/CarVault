import { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Fuel, Plus, Trash2, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { fuelApi } from '../services/api';
import Button from './ui/Button';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 20 } },
};

function StatBox({ label, value, unit, trend, sub }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-end gap-1.5">
        <span className="text-xl font-black text-white font-display leading-none">{value ?? '—'}</span>
        {unit && <span className="text-xs text-ink-muted font-semibold mb-0.5">{unit}</span>}
        {trend && (
          <span className={`text-[10px] font-bold mb-0.5 ${trend > 0 ? 'text-accent' : 'text-lime'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
          </span>
        )}
      </div>
      {sub && <p className="text-[10px] text-ink-faint mt-0.5">{sub}</p>}
    </div>
  );
}

function AddFuelForm({ vehicleId, onAdded, onCancel }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    date: today,
    mileage: '',
    liters: '',
    pricePerLiter: '',
    isFull: true,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalCost = form.liters && form.pricePerLiter
    ? (parseFloat(form.liters) * parseFloat(form.pricePerLiter)).toFixed(2)
    : null;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await fuelApi.create(vehicleId, {
        ...form,
        mileage: parseInt(form.mileage),
        liters: parseFloat(form.liters),
        pricePerLiter: parseFloat(form.pricePerLiter),
      });
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onSubmit={handleSubmit}
      className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4"
    >
      <p className="text-sm font-bold text-white font-display">Nouveau plein</p>

      {error && (
        <p className="text-xs text-accent font-semibold bg-accent/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted">Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className="cv-input w-full px-3 py-2.5 text-sm text-white" required />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted">Kilométrage</label>
          <input type="number" value={form.mileage} onChange={e => set('mileage', e.target.value)}
            placeholder="85 000" className="cv-input w-full px-3 py-2.5 text-sm text-white" required min="0" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted">Litres</label>
          <input type="number" step="0.01" value={form.liters} onChange={e => set('liters', e.target.value)}
            placeholder="45.5" className="cv-input w-full px-3 py-2.5 text-sm text-white" required min="0" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted">Prix/litre (€)</label>
          <input type="number" step="0.001" value={form.pricePerLiter} onChange={e => set('pricePerLiter', e.target.value)}
            placeholder="1.85" className="cv-input w-full px-3 py-2.5 text-sm text-white" required min="0" />
        </div>
      </div>

      {/* Full tank toggle */}
      <button
        type="button"
        onClick={() => set('isFull', !form.isFull)}
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all w-full ${
          form.isFull
            ? 'bg-lime/10 border-lime/30 text-lime'
            : 'bg-white/[0.03] border-white/10 text-ink-muted'
        }`}
      >
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
          form.isFull ? 'bg-lime border-lime' : 'border-white/30'
        }`}>
          {form.isFull && <div className="w-2 h-2 bg-bg rounded-sm" />}
        </div>
        Plein complet (pour calculer la conso)
      </button>

      {/* Live total */}
      {totalCost && (
        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] rounded-xl">
          <span className="text-xs font-semibold text-ink-muted">Total estimé</span>
          <span className="text-base font-black text-white font-display">{totalCost} €</span>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" variant="accent" size="sm" loading={loading} className="flex-1">
          <Fuel className="w-3.5 h-3.5" /> Enregistrer
        </Button>
      </div>
    </Motion.form>
  );
}

export default function FuelTracker({ vehicleId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const load = async () => {
    try {
      const result = await fuelApi.getAll(vehicleId);
      setData(result);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [vehicleId]);

  const handleAdded = () => {
    setShowForm(false);
    setLoading(true);
    load();
  };

  const handleDelete = async (id) => {
    try {
      await fuelApi.delete(vehicleId, id);
      load();
    } catch { /* ignore */ }
  };

  const { entries = [], stats } = data || {};
  const displayed = showAll ? entries : entries.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange/10 flex items-center justify-center">
            <Fuel className="w-3.5 h-3.5 text-orange" strokeWidth={2.5} />
          </div>
          <h3 className="text-sm font-bold text-white font-display tracking-tight">Carburant</h3>
        </div>
        <Button
          variant="dark"
          size="sm"
          onClick={() => setShowForm(s => !s)}
        >
          <Plus className="w-3.5 h-3.5" /> Plein
        </Button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <AddFuelForm
            vehicleId={vehicleId}
            onAdded={handleAdded}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
            <StatBox
              label="Conso moyenne"
              value={stats.avgConsumption}
              unit="L/100km"
              sub={stats.lastConsumption ? `Dernier : ${stats.lastConsumption} L/100` : null}
            />
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
            <StatBox
              label="Coût/km"
              value={stats.costPerKm}
              unit="€/km"
            />
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
            <StatBox
              label="Prix moyen"
              value={stats.avgPricePerLiter}
              unit="€/L"
            />
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
            <StatBox
              label="Total dépensé"
              value={stats.totalSpent ? `${stats.totalSpent}` : null}
              unit="€"
              sub={`${stats.totalLiters} L au total`}
            />
          </div>
        </div>
      )}

      {/* Entries list */}
      {loading ? (
        <div className="flex items-center justify-center h-16">
          <div className="w-5 h-5 border-2 border-white/10 border-t-orange rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-ink-muted">
          <Fuel className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">Aucun plein enregistré</p>
          <p className="text-xs mt-1 opacity-60">Ajoutez votre premier plein pour suivre votre consommation</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {displayed.map((entry) => {
            const date = new Date(entry.date);
            return (
              <Motion.div
                key={entry.id}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0 group"
              >
                {/* Date */}
                <div className="w-10 h-10 rounded-xl bg-orange/10 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-orange/70 uppercase leading-none">
                    {date.toLocaleDateString('fr-FR', { month: 'short' })}
                  </span>
                  <span className="text-sm font-black text-orange font-display leading-none">
                    {date.getDate()}
                  </span>
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{entry.liters} L</span>
                    {entry.isFull && (
                      <span className="text-[9px] font-bold text-lime/70 bg-lime/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                        Plein
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {entry.mileage.toLocaleString('fr-FR')} km · {entry.pricePerLiter.toFixed(3)} €/L
                  </p>
                </div>

                {/* Cost */}
                <div className="text-right">
                  <p className="text-sm font-bold text-white font-display">{entry.totalCost.toFixed(2)} €</p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-accent/10 text-ink-faint hover:text-accent transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </Motion.div>
            );
          })}
        </div>
      )}

      {/* Show more */}
      {entries.length > 5 && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="w-full text-xs font-semibold text-ink-muted hover:text-white transition-colors flex items-center justify-center gap-1 py-2"
        >
          {showAll ? <><ChevronUp className="w-3.5 h-3.5" /> Voir moins</> : <><ChevronDown className="w-3.5 h-3.5" /> Voir les {entries.length - 5} autres</>}
        </button>
      )}
    </div>
  );
}
