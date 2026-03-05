import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Check, Car, FileText, BarChart2, Shield, Loader2 } from 'lucide-react';
import { subscriptionApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const PERKS = [
  { icon: Car,       text: 'Véhicules illimités' },
  { icon: FileText,  text: 'Documents illimités' },
  { icon: BarChart2, text: 'Stats & analyses avancées' },
  { icon: Shield,    text: 'Export PDF dossier de revente' },
];

export default function PremiumModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { url } = await subscriptionApi.createCheckout();
      if (url) {
        window.location.href = url;
      } else {
        toast.info('Stripe non configuré — contactez le support.');
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
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

          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
            <X className="w-4 h-4 text-white/50" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(255,42,63,0.4)]">
              <Zap className="w-7 h-7 text-white" strokeWidth={2.5} fill="white" />
            </div>
            <h2 className="text-xl font-black font-display text-white tracking-tight">Passez à Premium</h2>
            <p className="text-sm text-white/50 mt-1">Déverrouillez tout CarVault</p>
          </div>

          {/* Price */}
          <div className="text-center mb-5 py-4 rounded-2xl bg-white/[0.04] border border-white/8">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-black font-display text-white">2,99</span>
              <span className="text-lg font-bold text-white/60">€</span>
              <span className="text-sm text-white/40 ml-1">/ mois</span>
            </div>
            <p className="text-[11px] text-white/30 mt-1">Annulable à tout moment</p>
          </div>

          {/* Perks */}
          <div className="space-y-2.5 mb-6">
            {PERKS.map(({ icon: Icon, text }) => (
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
            {loading ? 'Redirection…' : 'Passer à Premium →'}
          </button>

          <p className="text-center text-[10px] text-white/25 mt-3">
            Paiement sécurisé par Stripe · SSL 256-bit
          </p>
        </div>
      </motion.div>
    </>
  );
}
