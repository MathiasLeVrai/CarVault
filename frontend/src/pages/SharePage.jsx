import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Badge from '../components/ui/Badge';
import {
  Car, FileText, Wallet, Gauge, Heart, Wrench, FileCheck,
  PiggyBank, CheckCircle2, FileDown, Shield, CalendarClock,
} from 'lucide-react';

const CRITAIR_COLORS = {
  0: '#4ade80', 1: '#a78bfa', 2: '#facc15', 3: '#f97316', 4: '#b45309', 5: '#6b7280',
};

function CritAirBadge({ level }) {
  if (level == null) return null;
  const color = CRITAIR_COLORS[level] || '#6b7280';
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-black border-2 shrink-0"
      style={{ borderColor: color, color: color, backgroundColor: `${color}15` }}
      title={`Crit'Air ${level === 0 ? 'E' : level}`}
    >
      {level === 0 ? 'E' : level}
    </span>
  );
}
import {
  formatCurrency, formatDateShort, documentTypeLabels,
  expenseCategoryLabels, fuelTypeLabels,
} from '../utils/helpers';

const getScoreColor = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ff2a3f';
};

const getGradeLabel = (grade) => {
  const labels = { A: 'Excellent', B: 'Bon', C: 'Moyen', D: 'À améliorer' };
  return labels[grade] || '';
};

export default function SharePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Lien invalide ou expiré');
        }
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-accent animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 p-6">
      <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
        <Shield className="w-7 h-7 text-accent" />
      </div>
      <h1 className="text-2xl font-black text-white font-display">{error}</h1>
      <p className="text-sm text-ink-muted">Ce lien de partage n&apos;est plus valide.</p>
    </div>
  );

  const { vehicle, documents, expenses, stats, health, expiresAt } = data;

  return (
    <div className="min-h-screen bg-bg selection:bg-accent/30">
      <Helmet>
        <title>{`${vehicle.brand} ${vehicle.model} ${vehicle.year} — Dossier CarVault`}</title>
        <meta name="description" content={`Consultez le dossier complet de cette ${vehicle.brand} ${vehicle.model} ${vehicle.year} : historique, documents, score de sante.`} />
        <meta property="og:title" content={`${vehicle.brand} ${vehicle.model} — Dossier vehicule CarVault`} />
        <meta property="og:description" content={`${vehicle.mileage?.toLocaleString('fr-FR')} km — Score sante ${health?.score || '?'}/100`} />
      </Helmet>
      <div className="fixed top-[-15%] left-[-15%] w-[45%] h-[45%] bg-accent/3 rounded-full blur-[140px] pointer-events-none" />
      <div className="max-w-4xl mx-auto px-5 py-8 md:py-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_20px_rgba(255,42,63,0.3)]">
              <span className="text-sm font-black text-white font-display">CV</span>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white font-display">
                Car<span className="text-accent">Vault</span>
              </span>
              <p className="text-[10px] text-ink-muted font-semibold uppercase tracking-widest">Dossier partagé</p>
            </div>
          </div>
          <a
            href={`/api/share/${token}/pdf`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/80 transition-colors shadow-[0_0_20px_rgba(255,42,63,0.3)]"
          >
            <FileDown className="w-4 h-4" /> Télécharger le PDF
          </a>
        </div>

        {/* Vehicle Hero */}
        <div className="bento-card p-6 md:p-8 relative overflow-hidden">

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-xs font-bold text-white font-display">{vehicle.year}</span>
              {vehicle.licensePlate && (
                <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono font-bold text-white uppercase">{vehicle.licensePlate}</span>
              )}
              <CritAirBadge level={vehicle.critAir} />
              {vehicle.fiscalPower && <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 uppercase tracking-wider">{vehicle.fiscalPower} CV fiscal</span>}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white font-display tracking-tight">
              {vehicle.brand} <span className="text-white/60">{vehicle.model}</span>
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <Gauge className="w-4 h-4 text-accent mb-2" />
                <p className="text-lg font-black text-white font-display">{vehicle.mileage?.toLocaleString('fr-FR')} km</p>
                <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Kilométrage</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <Car className="w-4 h-4 text-violet mb-2" />
                <p className="text-lg font-black text-white font-display">{fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}</p>
                <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Carburant</p>
              </div>
              {vehicle.horsepower && (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <Wrench className="w-4 h-4 text-sky mb-2" />
                  <p className="text-lg font-black text-white font-display">{vehicle.horsepower} ch</p>
                  <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Puissance</p>
                </div>
              )}
              {health && (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <Heart className="w-4 h-4 text-lime mb-2" />
                  <p className="text-lg font-black text-white font-display" style={{ color: getScoreColor(health.score) }}>
                    {health.score}/100
                  </p>
                  <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">
                    Score santé — {getGradeLabel(health.grade)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bento-card p-6 md:p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-7 h-7 rounded-lg bg-violet/10 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-violet" strokeWidth={2.5} />
            </div>
            <h2 className="text-sm font-bold text-white font-display">Documents ({documents.length})</h2>
          </div>
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc, i) => {
                const expired = doc.expirationDate && new Date(doc.expirationDate) < new Date();
                return (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div>
                      <p className="text-sm font-bold text-white">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{doc.type === 'OTHER' ? doc.name : documentTypeLabels[doc.type]}</span>
                        {doc.expirationDate && (
                          <Badge variant={expired ? 'danger' : 'success'}>
                            {expired ? 'Expiré' : `Exp: ${formatDateShort(doc.expirationDate)}`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-ink-muted text-center py-6">Aucun document</p>
          )}
        </div>

        {/* Expenses */}
        <div className="bento-card p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange/10 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 text-orange" strokeWidth={2.5} />
              </div>
              <h2 className="text-sm font-bold text-white font-display">Historique dépenses ({expenses.length})</h2>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-white font-display">{formatCurrency(stats.totalExpenses)}</p>
              <p className="text-[10px] text-ink-muted font-bold uppercase">Total</p>
            </div>
          </div>
          {expenses.length > 0 ? (
            <div className="space-y-2">
              {expenses.slice(0, 20).map((exp, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-bold text-white">{formatCurrency(exp.amount)}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-white/50 uppercase">{expenseCategoryLabels[exp.category]}</span>
                      {exp.description && <span className="text-[10px] text-white/30">{exp.description}</span>}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-white/30">{formatDateShort(exp.date)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted text-center py-6">Aucune dépense enregistrée</p>
          )}
        </div>

        {/* Health Score Details */}
        {health?.breakdown && (
          <div className="bento-card p-6 md:p-8">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-7 h-7 rounded-lg bg-lime/10 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-lime" strokeWidth={2.5} />
              </div>
              <h2 className="text-sm font-bold text-white font-display">Score Santé Détaillé</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Entretien', icon: Wrench, ...health.breakdown.maintenance },
                { label: 'Documents', icon: FileCheck, ...health.breakdown.documents },
                { label: 'Coût', icon: PiggyBank, ...health.breakdown.cost },
                { label: 'Complétude', icon: CheckCircle2, ...health.breakdown.completeness },
              ].map((item) => {
                const pct = item.max > 0 ? (item.score / item.max) * 100 : 0;
                return (
                  <div key={item.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <item.icon className="w-5 h-5 text-white/40 mx-auto mb-2" />
                    <p className="text-xl font-black text-white font-display tabular-nums">{item.score}/{item.max}</p>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">{item.label}</p>
                    <div className="h-1 rounded-full bg-white/5 mt-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width]"
                        style={{ width: `${pct}%`, backgroundColor: getScoreColor(pct) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {health.estimatedValue && (
              <div className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Valeur estimée</span>
                <span className="text-xl font-black text-accent font-display">{formatCurrency(health.estimatedValue)}</span>
              </div>
            )}
          </div>
        )}

        {/* CTA Banner */}
        <div className="bento-card p-6 md:p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(255,42,63,0.3)]">
              <span className="text-lg font-black text-white font-display">CV</span>
            </div>
            <h3 className="text-xl font-black text-white font-display mb-2">
              Gérez votre véhicule gratuitement
            </h3>
            <p className="text-sm text-ink-muted max-w-md mx-auto mb-5">
              Suivi des dépenses, documents, rappels CT, score de santé… Tout pour votre voiture, en une seule app.
            </p>
            <a
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/80 transition-colors shadow-[0_0_20px_rgba(255,42,63,0.3)]"
            >
              Créer mon compte — c&apos;est gratuit
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-[10px] text-ink-muted font-bold uppercase tracking-widest">
            Dossier généré par CarVault
          </p>
          {expiresAt && (
            <p className="text-[10px] text-white/20 mt-1">
              Ce lien expire le {new Date(expiresAt).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
