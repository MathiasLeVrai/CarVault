import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, FileText, Bell, ArrowRight, X } from 'lucide-react';
import Button from './ui/Button';

const STORAGE_KEY = 'carvault_onboarding_done';

const steps = [
  {
    icon: Car,
    color: 'bg-accent/15 text-accent',
    label: '01',
    title: 'Ajoutez votre véhicule',
    description: 'Renseignez votre voiture en quelques secondes, ou utilisez votre plaque d\'immatriculation pour remplir automatiquement les informations.',
  },
  {
    icon: FileText,
    color: 'bg-violet/15 text-violet',
    label: '02',
    title: 'Uploadez vos documents',
    description: 'Assurance, carte grise, contrôle technique... Ajoutez une date d\'expiration pour chaque document important.',
  },
  {
    icon: Bell,
    color: 'bg-lime/15 text-lime',
    label: '03',
    title: 'Recevez vos rappels',
    description: 'CarVault vous prévient automatiquement 30, 7 et 1 jour avant l\'expiration de chaque document. Fini les oublis.',
  },
];

export default function Onboarding() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const start = () => {
    close();
    navigate('/vehicles');
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-bg-card rounded-2xl shadow-2xl w-full max-w-lg p-5 md:p-8 relative animate-pop">

        {/* Close */}
        <button onClick={close} className="absolute top-5 right-5 p-1.5 rounded-xl text-ink-muted hover:text-ink hover:bg-bg-alt transition-colors">
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mb-3 mx-auto">
            <span className="text-lg font-black text-white font-display">CV</span>
          </div>
          <h2 className="text-xl font-bold text-ink font-display">Bienvenue sur CarVault</h2>
          <p className="text-sm text-ink-muted mt-1">3 étapes pour protéger vos véhicules</p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-bg-alt/60 border border-ink/6">
                <div className={`w-10 h-10 rounded-xl ${step.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-0.5">{step.label}</p>
                  <p className="text-sm font-semibold text-ink">{step.title}</p>
                  <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={close}>Plus tard</Button>
          <Button className="flex-1" onClick={start}>
            Ajouter mon véhicule <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}
