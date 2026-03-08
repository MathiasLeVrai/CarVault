import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import usePush from '../hooks/usePush';
import { motion as Motion, AnimatePresence } from 'framer-motion';

/**
 * Smart push notification prompt
 * Shows once after the user has at least 1 vehicle and hasn't been asked before
 */
export default function PushPrompt() {
  const { supported, subscribed, subscribe } = usePush();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supported || subscribed) return;
    if (localStorage.getItem('carvault_push_dismissed')) return;
    // Show after 3 seconds
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, [supported, subscribed]);

  const handleEnable = async () => {
    setLoading(true);
    const ok = await subscribe();
    if (ok) {
      setVisible(false);
    }
    setLoading(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('carvault_push_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {visible && (
        <Motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-50"
        >
          <div className="bg-[#1a1a1e] border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <button onClick={handleDismiss} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white font-display">Ne ratez aucune échéance</p>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  Activez les notifications pour être alerté avant l'expiration de vos documents (CT, assurance) et vos entretiens.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleEnable}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Activation...' : 'Activer'}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 rounded-xl text-white/30 text-xs font-bold hover:text-white/50 transition-colors"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
