import { Route, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { motion as Motion } from 'framer-motion';

export default function MileageHistory({ entries, onAdd, onDelete, variants }) {
  return (
    <Motion.div variants={variants} className="bento-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <Route className="w-5 h-5 text-accent" strokeWidth={2.5} />Historique kilométrage
        </h3>
        <Button size="sm" variant="accent" onClick={onAdd}><Plus className="w-4 h-4" strokeWidth={2.5} />Ajouter</Button>
      </div>
      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.slice(0, 8).map((entry, i) => {
            const prev = entries[i + 1];
            const diff = prev ? entry.mileage - prev.mileage : null;
            return (
              <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] hover:border-white/10 transition-[background-color,border-color]">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_12px_rgba(255,42,63,0.5)] shrink-0" />
                  <div>
                    <p className="text-base font-black text-white font-display">{entry.mileage.toLocaleString('fr-FR')} km</p>
                    {entry.notes && <p className="text-[11px] font-semibold text-white/50 mt-0.5">{entry.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">{new Date(entry.date).toLocaleDateString('fr-FR')}</p>
                    {diff !== null && <p className="text-[10px] text-lime font-black mt-0.5">+{diff.toLocaleString('fr-FR')} km</p>}
                  </div>
                  <button onClick={() => onDelete(entry.id)} className="w-11 h-11 flex items-center justify-center rounded-xl md:opacity-0 md:group-hover:opacity-100 hover:bg-accent/20 text-white/40 hover:text-accent transition-[background-color,color,opacity]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : <p className="text-sm text-ink-muted text-center py-6">Aucune entrée</p>}
    </Motion.div>
  );
}
