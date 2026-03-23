import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, FileText, CalendarClock, Bell, ArrowRight, X, Check } from 'lucide-react';
import Button from './ui/Button';
import { vehicleApi, documentApi, alertApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const steps = [
  {
    id: 'vehicle',
    icon: Car,
    color: 'bg-accent/20 text-accent border-accent/20',
    activeColor: 'bg-accent text-white border-accent',
    title: 'Ajouter un véhicule',
    description: 'Renseignez votre voiture ou utilisez la plaque d\'immatriculation.',
    cta: 'Ajouter mon véhicule',
    route: '/vehicles',
  },
  {
    id: 'document',
    icon: FileText,
    color: 'bg-violet/20 text-violet border-violet/20',
    activeColor: 'bg-violet text-white border-violet',
    title: 'Importer un document',
    description: 'Assurance, carte grise, CT... Prenez en photo ou uploadez.',
    cta: 'Ajouter un document',
    route: '/documents',
  },
  {
    id: 'expiration',
    icon: CalendarClock,
    color: 'bg-sky/20 text-sky border-sky/20',
    activeColor: 'bg-sky text-white border-sky',
    title: 'Ajouter une date d\'expiration',
    description: 'Renseignez la date d\'expiration pour être alerté automatiquement.',
    cta: 'Voir mes documents',
    route: '/documents',
  },
  {
    id: 'reminder',
    icon: Bell,
    color: 'bg-lime/20 text-lime border-lime/20',
    activeColor: 'bg-lime text-white border-lime',
    title: 'Rappel activé !',
    description: 'Vous serez prévenu J-30, J-7 et J-1 avant chaque expiration.',
    cta: 'Voir mes alertes',
    route: '/alerts',
  },
];

export default function Onboarding() {
  const { user } = useAuth();
  const storageKey = user ? `carvault_onboarding_done_${user.id}` : null;
  const progressKey = user ? `carvault_onboarding_progress_${user.id}` : null;

  const getStoredProgress = useCallback(() => {
    if (!progressKey) return {};
    try { return JSON.parse(localStorage.getItem(progressKey) || '{}'); } catch { return {}; }
  }, [progressKey]);

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState({});
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  const checkProgress = useCallback(async () => {
    if (!progressKey) return {};
    try {
      const stored = getStoredProgress();
      const newProgress = { ...stored };

      const [vehicles, docs, alertsData] = await Promise.all([
        vehicleApi.getAll().catch(() => []),
        documentApi.getAll().catch(() => []),
        alertApi.countUnread().catch(() => ({ count: 0 })),
      ]);

      if (vehicles.length > 0) newProgress.vehicle = true;
      if (docs.length > 0) newProgress.document = true;
      if (docs.some(d => d.expirationDate)) newProgress.expiration = true;
      if (docs.some(d => d.expirationDate) || alertsData.count > 0) newProgress.reminder = true;

      localStorage.setItem(progressKey, JSON.stringify(newProgress));
      setProgress(newProgress);
      return newProgress;
    } catch {
      return getStoredProgress();
    }
  }, [progressKey, getStoredProgress]);

  useEffect(() => {
    if (!storageKey) return;
    if (localStorage.getItem(storageKey)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecking(false);
      return;
    }
    checkProgress().then(p => {
      const allDone = steps.every(s => p[s.id]);
      if (allDone) {
        localStorage.setItem(storageKey, '1');
      } else {
        setVisible(true);
      }
      setChecking(false);
    });
  }, [storageKey, checkProgress]);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      checkProgress().then(p => {
        if (steps.every(s => p[s.id])) {
          if (storageKey) localStorage.setItem(storageKey, '1');
          setTimeout(() => setVisible(false), 1500);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [visible, checkProgress]);

  const close = () => {
    if (storageKey) localStorage.setItem(storageKey, '1');
    setVisible(false);
  };

  const completedCount = steps.filter(s => progress[s.id]).length;
  const progressPct = (completedCount / steps.length) * 100;

  const currentStep = steps.find(s => !progress[s.id]) || steps[steps.length - 1];

  const goToStep = () => {
    navigate(currentStep.route);
  };

  useBodyScrollLock(visible && !checking);

  if (checking || !visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bento-card w-full max-w-lg p-6 md:p-8 relative animate-pop border border-white/10">
        <button
          onClick={close}
          className="absolute top-6 right-6 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-accent mb-4 mx-auto shadow-[0_0_24px_rgba(255,42,63,0.4)]">
            <span className="text-xl font-black text-white font-display">CV</span>
          </div>
          <h2 className="text-2xl font-black text-white font-display tracking-tight">
            {completedCount === steps.length ? 'Bravo, tout est prêt !' : 'Configurez CarVault'}
          </h2>
          <p className="text-sm text-ink-muted mt-2 font-medium">
            {completedCount === steps.length
              ? 'Votre garage numérique est opérationnel.'
              : `Étape ${completedCount + 1} sur ${steps.length} — moins de 2 minutes`}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="cv-progress-track h-2 rounded-full">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPct}%`,
                background: progressPct === 100
                  ? 'linear-gradient(90deg, #22c55e, #38bdf8)'
                  : 'linear-gradient(90deg, #ff2a3f, #ff6b00)',
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-white/30 font-bold">{completedCount}/{steps.length}</span>
            <span className="text-[10px] text-white/30 font-bold">{Math.round(progressPct)}%</span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-8">
          {steps.map((step) => {
            const Icon = step.icon;
            const done = progress[step.id];
            const isCurrent = step.id === currentStep.id && !done;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                  done
                    ? 'bg-lime/5 border-lime/20'
                    : isCurrent
                      ? 'bg-white/[0.04] border-accent/30 shadow-[0_0_20px_rgba(255,42,63,0.1)]'
                      : 'bg-white/[0.01] border-white/5 opacity-40'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
                  done ? 'bg-lime/20 text-lime border-lime/30' : isCurrent ? step.activeColor : step.color
                }`}>
                  {done ? <Check className="w-5 h-5" strokeWidth={2.5} /> : <Icon className="w-5 h-5" strokeWidth={2} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold font-display ${done ? 'text-lime line-through' : 'text-white'}`}>
                    {step.title}
                  </p>
                  <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <Button variant="dark" className="flex-1" onClick={close}>Plus tard</Button>
          {completedCount < steps.length ? (
            <Button variant="accent" className="flex-1" onClick={goToStep}>
              {currentStep.cta} <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Button>
          ) : (
            <Button variant="accent" className="flex-1" onClick={close}>
              C'est parti ! <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
