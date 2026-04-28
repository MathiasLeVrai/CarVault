import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { X, Zap, Check, Clock, Loader2 } from 'lucide-react';
import { subscriptionApi } from '../services/api';
import { PRICING } from '../constants/pricing';
import { useToast } from '../context/ToastContext';

export default function PremiumModal({ onClose }) {
  const [plan, setPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  useBodyScrollLock(true);

  const isYearly = plan === 'yearly';

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { url } = await subscriptionApi.createCheckout(plan);
      if (url) {
        window.location.href = url;
      } else {
        toast.info('Contactez hello@carvio.fr pour activer Premium.');
        onClose();
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <Motion.div
        initial={{ opacity: 0, pointerEvents: 'none' }}
        animate={{ opacity: 1, pointerEvents: 'auto' }}
        exit={{ opacity: 0, pointerEvents: 'none' }}
        className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="fixed inset-0 z-[260] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-sm glass-panel rounded-3xl p-6 relative overflow-hidden">
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,42,63,0.15) 0%, transparent 70%)', filter: 'blur(40px)', top: '-30%' }} />

          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center">
            <X className="w-4 h-4 text-white/50" />
          </button>

          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(255,42,63,0.4)]">
              <Zap className="w-7 h-7 text-white" strokeWidth={2.5} fill="white" />
            </div>
            <h2 className="text-xl font-black font-display text-white tracking-tight">Passez à Premium</h2>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
              <Clock className="w-3 h-3 text-accent" />
              <span className="text-[11px] font-bold text-accent">14 jours d'essai gratuit</span>
            </div>
          </div>

          {/* Plan toggle */}
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex rounded-xl bg-white/[0.06] border border-white/10 p-1">
              <button
                onClick={() => setPlan('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-[background-color,color] ${!isYearly ? 'bg-white/10 text-white' : 'text-white/40'}`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setPlan('yearly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-[background-color,color] flex items-center gap-1.5 ${isYearly ? 'bg-white/10 text-white' : 'text-white/40'}`}
              >
                Annuel
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-lime/20 text-lime">{PRICING.discount}</span>
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="text-center mb-5 py-3 rounded-2xl bg-white/[0.04] border border-white/8">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-black font-display text-white">{isYearly ? PRICING.yearly : PRICING.monthly}</span>
              <span className="text-lg font-bold text-white/60">€</span>
              <span className="text-sm text-white/40 ml-1">/ {isYearly ? 'an' : 'mois'}</span>
            </div>
            {isYearly && (
              <p className="text-[11px] text-lime/70 mt-1 font-medium">soit {PRICING.yearlyPerMonth}€/mois — économisez {PRICING.yearlySavings}€/an</p>
            )}
            <p className="text-[11px] text-white/30 mt-1">Après 14 jours d'essai gratuit</p>
          </div>

          {/* Perks */}
          <div className="space-y-2 mb-5">
            {['Véhicules illimités', 'Documents illimités', 'Stats & analyses avancées', 'Export PDF dossier de revente'].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-semibold text-white/80">{text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-4 rounded-2xl cv-btn-accent text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" fill="white" strokeWidth={0} />}
            {loading ? 'Redirection…' : 'Démarrer l\'essai gratuit →'}
          </button>

          <p className="text-center text-[10px] text-white/25 mt-3">
            Paiement sécurisé par Stripe · Aucun prélèvement pendant 14 jours
          </p>
        </div>
      </Motion.div>
    </>
  );
}
