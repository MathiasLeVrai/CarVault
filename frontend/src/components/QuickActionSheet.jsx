import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, Fuel, Receipt, Camera, Car, CheckCircle2, ChevronDown, ArrowLeft } from 'lucide-react';
import { vehicleApi, fuelApi, expenseApi, documentApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const ACTIONS = [
  { id: 'fuel',     label: 'Plein',     icon: Fuel,    color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.15)' },
  { id: 'expense',  label: 'Dépenses',   icon: Receipt, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
  { id: 'document', label: 'Document',  icon: Camera,  color: '#7c5cfc', bg: 'rgba(124,92,252,0.08)', border: 'rgba(124,92,252,0.15)' },
  { id: 'vehicle',  label: 'Véhicule',  icon: Car,     color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.15)' },
];

const EXPENSE_CATS = [
  { value: 'MAINTENANCE', label: 'Entretien / Révision' },
  { value: 'OIL_CHANGE',  label: 'Vidange' },
  { value: 'BRAKES',      label: 'Freins / Plaquettes' },
  { value: 'TIRES',       label: 'Pneus' },
  { value: 'BODYWORK',    label: 'Carrosserie' },
  { value: 'WINDSHIELD',  label: 'Pare-brise' },
  { value: 'TECHNICAL_INSPECTION', label: 'Contrôle technique' },
  { value: 'PARKING',     label: 'Stationnement' },
  { value: 'TOLL',        label: 'Péage' },
  { value: 'CLEANING',   label: 'Lavage' },
  { value: 'FINE',       label: 'Amende' },
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
      className="cv-input w-full px-4 py-3 text-base text-ink"
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
          className="cv-input w-full px-4 py-3 text-base text-ink appearance-none"
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
  const navigate = useNavigate();
  const [view, setView] = useState('grid'); // 'grid' | 'fuel' | 'expense' | 'document'
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();
  const fileInputRef = useRef(null);

  useBodyScrollLock(true);

  // Fuel form
  const [fuel, setFuel] = useState({ mileage: '', liters: '', pricePerLiter: '', isFull: true });
  // Expense form
  const [exp, setExp] = useState({ amount: '', category: 'MAINTENANCE', description: '', date: new Date().toISOString().split('T')[0] });
  // Document form
  const [docForm, setDocForm] = useState({ name: '', type: 'INSURANCE', vehicleId: '', expirationDate: '' });
  const [docFile, setDocFile] = useState(null);
  const [docHasExpiration, setDocHasExpiration] = useState(false);

  useEffect(() => {
    vehicleApi.getAll()
      .then(list => {
        setVehicles(list);
        if (list.length === 1) {
          setVehicleId(String(list[0].id));
          setDocForm(p => ({ ...p, vehicleId: String(list[0].id) }));
        }
      })
      .catch(() => {});
  }, []);

  const fuelTotal = fuel.liters && fuel.pricePerLiter
    ? (parseFloat(fuel.liters) * parseFloat(fuel.pricePerLiter)).toFixed(2)
    : null;

  const handleAction = (id) => {
    if (id === 'vehicle') {
      onClose();
      navigate('/vehicles?add=true');
      return;
    }
    if (id === 'document') {
      setView('document');
      return;
    }
    setView(id);
  };

  const canSubmit = () => {
    const vid = vehicleId || (vehicles.length === 1 ? String(vehicles[0].id) : '');
    if (!vid) return false;
    if (view === 'fuel') return fuel.mileage && fuel.liters && fuel.pricePerLiter;
    if (view === 'expense') return exp.amount !== '' && exp.category;
    if (view === 'document') return docFile && docForm.name;
    return false;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    const vid = vehicleId || String(vehicles[0].id);
    setLoading(true);
    try {
      if (view === 'fuel') {
        await fuelApi.create(vid, {
          mileage: parseInt(fuel.mileage),
          liters: parseFloat(fuel.liters),
          pricePerLiter: parseFloat(fuel.pricePerLiter),
          totalCost: fuelTotal ? parseFloat(fuelTotal) : parseFloat(fuel.liters) * parseFloat(fuel.pricePerLiter),
          isFull: fuel.isFull,
          date: new Date().toISOString(),
        });
        toast.success('Plein enregistré');
      } else if (view === 'expense') {
        await expenseApi.create({
          vehicleId: vid,
          amount: parseFloat(exp.amount),
          category: exp.category,
          description: exp.description || undefined,
          date: exp.date ? new Date(exp.date).toISOString() : new Date().toISOString(),
        });
        toast.success('Dépense enregistrée');
      } else if (view === 'document') {
        const fd = new FormData();
        fd.append('name', docForm.name);
        fd.append('type', docForm.type);
        fd.append('vehicleId', docForm.vehicleId || vid);
        if (docForm.expirationDate) fd.append('expirationDate', docForm.expirationDate);
        fd.append('file', docFile);
        await documentApi.create(fd);
        toast.success('Document ajouté');
      }
      setDone(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const formTitle = { fuel: 'Nouveau plein', expense: 'Nouvelle dépense', document: 'Nouveau document' }[view];

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <Motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-150 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <Motion.div
        key="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-160 rounded-t-3xl px-5 max-h-[85dvh] overflow-y-auto overscroll-contain"
        style={{ background: 'var(--color-bg-alt)', borderTop: '1px solid var(--color-ink-faint)', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            {view !== 'grid' && (
              <button onClick={() => { setView('grid'); setDone(false); }} className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 text-white/60" />
              </button>
            )}
            <h2 className="text-base font-black text-white font-display">
              {view === 'grid' ? 'Actions rapides' : formTitle}
            </h2>
          </div>
          <button onClick={onClose} className="w-11 h-11 rounded-xl bg-white/8 flex items-center justify-center">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Success state */}
        {done ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <CheckCircle2 className="w-12 h-12 text-lime" />
            </Motion.div>
            <p className="text-base font-bold text-white">Enregistré !</p>
          </div>

        /* Grid view */
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 pb-4">
            {ACTIONS.map((action, i) => (
              <Motion.button
                key={action.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 28 }}
                onClick={() => handleAction(action.id)}
                className="flex flex-col items-center gap-3 py-6 rounded-2xl border transition-all active:scale-95"
                style={{ background: action.bg, borderColor: action.border }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${action.color}15` }}>
                  <action.icon className="w-6 h-6" style={{ color: action.color }} />
                </div>
                <span className="text-sm font-bold text-white">{action.label}</span>
              </Motion.button>
            ))}
          </div>

        /* Form views */
        ) : (
          <Motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="space-y-4 pb-2"
          >
            {view !== 'document' && (
              <VehicleSelect vehicles={vehicles} value={vehicleId} onChange={setVehicleId} />
            )}

            {/* Fuel form */}
            {view === 'fuel' && (
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
                    <span className="text-sm font-black text-white font-display tabular-nums">{fuelTotal} €</span>
                  )}
                </div>
              </>
            )}

            {/* Expense form */}
            {view === 'expense' && (
              <>
                <Field label="Catégorie">
                  <div className="relative">
                    <select
                      value={exp.category}
                      onChange={e => setExp(p => ({ ...p, category: e.target.value }))}
                      className="cv-input w-full px-4 py-3 text-base text-ink appearance-none"
                    >
                      {EXPENSE_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Montant (€)">
                    <CvInput type="number" step="0.01" placeholder="89.90" value={exp.amount}
                      onChange={e => setExp(p => ({ ...p, amount: e.target.value }))} />
                  </Field>
                  <Field label="Date">
                    <CvInput type="date" value={exp.date}
                      onChange={e => setExp(p => ({ ...p, date: e.target.value }))} />
                  </Field>
                </div>
                <Field label="Description (optionnel)">
                  <CvInput placeholder="Vidange + filtre huile…" value={exp.description}
                    onChange={e => setExp(p => ({ ...p, description: e.target.value }))} />
                </Field>
              </>
            )}

            {/* Document form */}
            {view === 'document' && (
              <>
                <Field label="Fichier">
                  <label
                    className={`flex items-center gap-3 p-4 rounded-xl border border-dashed cursor-pointer transition-all hover:bg-white/4 active:scale-[0.98] ${
                      docFile ? 'border-violet/30 bg-violet/6' : 'border-white/10 bg-white/2'
                    }`}
                  >
                    <Camera className="w-5 h-5 text-violet-400 shrink-0" />
                    <span className={`text-sm font-semibold truncate ${docFile ? 'text-violet-300' : 'text-white/40'}`}>
                      {docFile ? docFile.name : 'Photo ou fichier…'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files[0];
                        if (f) {
                          setDocFile(f);
                          setDocForm(p => ({ ...p, name: p.name || f.name.replace(/\.[^.]+$/, '') }));
                        }
                      }}
                    />
                  </label>
                </Field>
                <Field label="Type">
                  <div className="relative">
                    <select
                      value={docForm.type}
                      onChange={e => {
                        const t = e.target.value;
                        setDocForm(p => ({ ...p, type: t, expirationDate: '' }));
                        setDocHasExpiration(false);
                      }}
                      className="cv-input w-full px-4 py-3 text-base text-ink appearance-none"
                    >
                      <option value="TECHNICAL_INSPECTION">Contrôle technique</option>
                      <option value="INSURANCE">Assurance</option>
                      <option value="REGISTRATION">Carte grise</option>
                      <option value="INVOICE">Facture</option>
                      <option value="ACCIDENT_REPORT">Constat amiable</option>
                      <option value="OTHER">Autre</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </Field>
                <Field label={docForm.type === 'OTHER' ? 'Nom du document' : 'Nom'}>
                  <CvInput placeholder={docForm.type === 'OTHER' ? 'Ex: Garantie Norauto' : 'Assurance 2026…'} value={docForm.name}
                    onChange={e => setDocForm(p => ({ ...p, name: e.target.value }))} />
                </Field>
                {(docForm.type === 'TECHNICAL_INSPECTION' || docForm.type === 'INSURANCE') && (
                  <Field label="Date d'expiration">
                    <CvInput type="date" value={docForm.expirationDate}
                      onChange={e => setDocForm(p => ({ ...p, expirationDate: e.target.value }))} />
                  </Field>
                )}
                {docForm.type === 'OTHER' && (
                  <>
                    <label className="flex items-center gap-3 cursor-pointer select-none px-1">
                      <input
                        type="checkbox"
                        checked={docHasExpiration}
                        onChange={e => {
                          setDocHasExpiration(e.target.checked);
                          if (!e.target.checked) setDocForm(p => ({ ...p, expirationDate: '' }));
                        }}
                        className="w-4 h-4 rounded border-2 border-white/20 bg-transparent accent-lime"
                      />
                      <span className="text-sm font-semibold text-white">Ce document a une date d&apos;expiration</span>
                    </label>
                    {docHasExpiration && (
                      <Field label="Date d'expiration">
                        <CvInput type="date" value={docForm.expirationDate}
                          onChange={e => setDocForm(p => ({ ...p, expirationDate: e.target.value }))} />
                      </Field>
                    )}
                  </>
                )}
                <Field label="Véhicule">
                  <div className="relative">
                    <select
                      value={docForm.vehicleId}
                      onChange={e => setDocForm(p => ({ ...p, vehicleId: e.target.value }))}
                      className="cv-input w-full px-4 py-3 text-base text-ink appearance-none"
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.brand} {v.model}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    </div>
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
          </Motion.div>
        )}
      </Motion.div>
    </AnimatePresence>
  );
}
