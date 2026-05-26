import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export default function Modal({ isOpen, onClose, title, children }) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full md:max-w-xl max-h-[86dvh] md:max-h-[90vh] flex flex-col p-0 overflow-hidden animate-pop rounded-t-3xl md:rounded-3xl border border-white/10" style={{ background: 'var(--color-bg-alt)', boxShadow: '0 -8px 32px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center justify-between px-6 md:px-8 pb-4 md:py-5 border-b border-white/5" style={{ paddingTop: 'max(1rem, var(--safe-top))' }}>
          <h2 className="text-lg font-bold text-white font-display tracking-tight">{title}</h2>
          <button onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white text-white/50 transition-colors">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-6 md:px-8 py-6 overflow-y-auto overscroll-contain bg-transparent safe-bottom" style={{ WebkitOverflowScrolling: 'touch' }}>{children}</div>
      </div>
    </div>
  );
}
