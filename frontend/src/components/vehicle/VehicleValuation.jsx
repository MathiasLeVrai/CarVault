import { useEffect, useState } from 'react';
import { TrendingUp, Check, Pencil } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { coteApi } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

export default function VehicleValuation({ vehicleId, variants }) {
  const [value, setValue] = useState(null);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    if (!vehicleId) return;
    coteApi.get(vehicleId).then((res) => {
      setValue(res.estimatedValue);
      setUpdatedAt(res.updatedAt);
    }).catch(() => {});
  }, [vehicleId]);

  const handleSave = async () => {
    const num = parseFloat(input.replace(/\s/g, '').replace(',', '.'));
    if (isNaN(num) || num < 0) return;
    setSaving(true);
    try {
      const res = await coteApi.update(vehicleId, Math.round(num));
      setValue(res.estimatedValue);
      setUpdatedAt(res.updatedAt);
      setEditing(false);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const startEdit = () => {
    setInput(value ? String(value) : '');
    setEditing(true);
  };

  if (!vehicleId) return null;

  return (
    <Motion.div variants={variants} className="bento-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-lime/10 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-lime" strokeWidth={2.5} />
          </div>
          <h3 className="text-sm font-bold text-white font-display">Valeur estimée</h3>
        </div>
        {updatedAt && !editing && (
          <span className="text-[9px] text-ink-muted font-bold uppercase tracking-wider">
            Màj {new Date(updatedAt).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>

      {!editing && value != null && (
        <div className="text-center py-4">
          <p className="text-4xl font-black text-white font-display">
            {formatCurrency(value)}
          </p>
          <button
            onClick={startEdit}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-white transition-colors"
          >
            <Pencil className="w-3 h-3" /> Modifier
          </button>
        </div>
      )}

      {!editing && value == null && (
        <div className="text-center py-6">
          <p className="text-sm text-ink-muted mb-4">
            Combien vaut votre véhicule ?
          </p>
          <button
            onClick={startEdit}
            className="cv-btn-accent px-5 py-2.5 text-xs rounded-xl font-bold"
          >
            Estimer mon véhicule
          </button>
        </div>
      )}

      {editing && (
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">
            Consultez La Centrale ou un autre site de cote, puis renseignez la valeur ici.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                inputMode="numeric"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Ex : 12000"
                className="cv-input w-full text-sm pr-8"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 font-bold">€</span>
            </div>
            <button
              onClick={handleSave}
              disabled={!input || saving}
              className="cv-btn-accent px-4 py-2 text-xs rounded-lg flex items-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? '...' : 'OK'}
            </button>
          </div>
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Annuler
          </button>
        </div>
      )}
    </Motion.div>
  );
}
