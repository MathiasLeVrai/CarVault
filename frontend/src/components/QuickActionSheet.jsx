import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Fuel, Wallet, Gauge, CheckCircle2, ChevronDown } from 'lucide-react';
import { vehicleApi, fuelApi, expenseApi, mileageApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const TABS = [
  { id: 'fuel',     label: 'Plein',    icon: Fuel,   color: '#38bdf8' },
  { id: 'expense',  label: 'Dépense',  icon: Wallet, color: '#f59e0b' },
  { id: 'mileage',  label: 'Km',       icon: Gauge,  color: '#22c55e' },
];

const EXPENSE_CATS = [
  { value: 'FUEL',        label: 'Carburant' },
  { value: 'MAINTENANCE', label: 'Entretien' },
  { value: 'TIRES',       label: 'Pneus' },
  { value: 'REPAIR',      label: 'Réparation' },
  { value: 'INSURANCE',   label: 'Assurance' },
  { value: 'PARKING',     label: 'Stationnement' },
  { value: 'TOLL',        label: 'Péage' },
  { value: 'OTHER',       label: 'Autre' },
];

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function CvInput({ type = 'text', ...props }) {
  return (
    <input
      type={type}
      className="cv-input w-full px-4 py-3 text-sm text-white"
      {...props}
    />
  );
}

function VehicleSelect({ vehicles, value, onChange }) {
  if (vehicles.length <= 1) return null;
  return (
    <Field label="Véhicule">
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="cv-input w-full px-4 py-3 text-sm text-white appearance-none"
        >
          <option value="">Sélectionner…</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {v.brand} {v.model} {v.licensePlate ? `· ${v.licensePlate}` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      </div>
    </Field>
  );
}

export default function QuickActionSheet({ onClose }) {
  const [tab, setTab] = useState('fuel');
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();

  // Fuel form
  const [fuel, setFuel] = useState({ mileage: '', liters: '', pricePerLiter: '', isFull: true });
  // Expense form
  const [exp, setExp] = useState({ amount: '', category: 'FUEL', description: '' });
  // Mileage form
  const [km, setKm] = useState({ mileage: '', notes: '' });

  useEffect(() => {
    vehicleApi.getAll()
      .then(list => {
        setVehicles(list);
        if (list.length === 1) setVehicleId(String(list[0].id));
      })
      .catch(() => {});
  }, []);

  const fuelTotal = fuel.liters && fuel.pricePerLiter
    ? (parseFloat(fuel.liters) * parseFloat(fuel.pricePerLiter)).toFixed(2)
    : null;

  const canSubmit = () => {
    const vid = vehicleId || (vehicles.length === 1 ? String(vehicles[0].id) : '');
    if (!vid) return false;
    if (tab === 'fuel') return fuel.mileage && fuel.liters && fuel.pricePerLiter;
    if (tab === 'expense') return exp.amount && exp.category;
    if (tab === 'mileage') return km.mileage;
    return false;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    const vid = vehicleId || String(vehicles[0].id);
    setLoading(true);
    try {
      if (tab === 'fuel') {
        await fuelApi.create(vid, {
          mileage: parseInt(fuel.mileage),
          liters: parseFloat(fuel.liters),
          pricePerLiter: parseFloat(fuel.pricePerLiter),
          totalCost: fuelTotal ? parseFloat(fuelTotal) : parseFloat(fuel.liters) * parseFloat(fuel.pricePerLiter),
          isFull: fuel.isFull,
          date: new Date().toISOString(),
        });
      } else if (tab === 'expense') {
        await expenseApi.create({
          vehicleId: parseInt(vid),
          amount: parseFloat(exp.amount),
          category: exp.category,
          description: exp.description || undefined,
          date: new Date().toISOString(),
        });
      } else if (tab === 'mileage') {
        await mileageApi.create(vid, {
          mileage: parseInt(km.mileage),
          notes: km.notes || undefined,
          date: new Date().toISOString(),
        });
      }
      setDone(true);
      const labels = { fuel: 'Plein enregistré', expense: 'Dépense enregistrée', mileage: 'Kilométrage mis à jour' };
      toast.success(labels[tab] || 'Enregistré !');
      setTimeout(onClose, 1200);
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[160] rounded-t-3xl glass-panel px-5 pb-safe"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <h2 className="text-base font-black text-white font-display">Saisie rapide</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/8 mb-5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === t.id ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white/60'
              }`}
              style={tab === t.id ? { color: t.color } : {}}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Success state */}
        {done ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <CheckCircle2 className="w-12 h-12 text-lime" />
            </motion.div>
            <p className="text-base font-bold text-white">Enregistré !</p>
          </div>
        ) : (
          <div className="space-y-4">
            <VehicleSelect vehicles={vehicles} value={vehicleId} onChange={setVehicleId} />

            {/* ── Fuel form ── */}
            {tab === 'fuel' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Km actuel">
                    <CvInput type="number" placeholder="45 000" value={fuel.mileage}
                      onChange={e => setFuel(p => ({ ...p, mileage: e.target.value }))} />
                  </Field>
                  <Field label="Litres">
                    <CvInput type="number" step="0.01" placeholder="42.5" value={fuel.liters}
                      onChange={e => setFuel(p => ({ ...p, liters: e.target.value }))} />
                  </Field>
                </div>
                <Field label="Prix / litre (€)">
                  <CvInput type="number" step="0.001" placeholder="1.849" value={fuel.pricePerLiter}
                    onChange={e => setFuel(p => ({ ...p, pricePerLiter: e.target.value }))} />
                </Field>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setFuel(p => ({ ...p, isFull: !p.isFull }))}
                      className={`w-11 h-6 rounded-full transition-colors relative ${fuel.isFull ? 'bg-sky' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${fuel.isFull ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm font-semibold text-white/70">Plein complet</span>
                  </label>
                  {fuelTotal && (
                    <span className="text-sm font-black text-white font-display">{fuelTotal} €</span>
                  )}
                </div>
              </>
            )}

            {/* ── Expense form ── */}
            {tab === 'expense' && (
              <>
                <Field label="Catégorie">
                  <div className="relative">
                    <select
                      value={exp.category}
                      onChange={e => setExp(p => ({ ...p, category: e.target.value }))}
                      className="cv-input w-full px-4 py-3 text-sm text-white appearance-none"
                    >
                      {EXPENSE_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </Field>
                <Field label="Montant (€)">
                  <CvInput type="number" step="0.01" placeholder="89.90" value={exp.amount}
                    onChange={e => setExp(p => ({ ...p, amount: e.target.value }))} />
                </Field>
                <Field label="Description (optionnel)">
                  <CvInput placeholder="Vidange + filtre huile…" value={exp.description}
                    onChange={e => setExp(p => ({ ...p, description: e.target.value }))} />
                </Field>
              </>
            )}

            {/* ── Mileage form ── */}
            {tab === 'mileage' && (
              <>
                <Field label="Kilométrage actuel">
                  <CvInput type="number" placeholder="45 230" value={km.mileage}
                    onChange={e => setKm(p => ({ ...p, mileage: e.target.value }))} />
                </Field>
                <Field label="Notes (optionnel)">
                  <CvInput placeholder="Retour de vacances…" value={km.notes}
                    onChange={e => setKm(p => ({ ...p, notes: e.target.value }))} />
                </Field>
              </>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || loading}
              className="w-full py-4 rounded-2xl cv-btn-accent text-sm font-bold disabled:opacity-30 mt-2"
            >
              {loading ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
