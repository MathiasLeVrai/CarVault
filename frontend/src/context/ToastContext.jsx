/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: { Icon: CheckCircle2, color: 'text-lime',    bg: 'bg-lime/10 border-lime/20' },
  error:   { Icon: XCircle,      color: 'text-accent',  bg: 'bg-accent/10 border-accent/20' },
  warning: { Icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  info:    { Icon: Info,          color: 'text-sky',     bg: 'bg-sky/10 border-sky/20' },
};

function ToastItem({ toast, onDismiss }) {
  const { Icon, color, bg } = ICONS[toast.type] || ICONS.info;
  return (
    <Motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.94 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-2xl max-w-sm w-full ${bg} glass-panel`}
    >
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} strokeWidth={2.5} />
      <p className="text-sm font-semibold text-white flex-1 leading-snug">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="shrink-0 text-white/30 hover:text-white/60 transition-colors mt-0.5">
        <X className="w-3.5 h-3.5" />
      </button>
    </Motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, d) => addToast(msg, 'success', d),
    error:   (msg, d) => addToast(msg, 'error', d),
    warning: (msg, d) => addToast(msg, 'warning', d),
    info:    (msg, d) => addToast(msg, 'info', d),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[500] flex flex-col gap-2 items-center px-4 w-full pointer-events-none">
        <AnimatePresence mode="sync">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto w-full max-w-sm">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
