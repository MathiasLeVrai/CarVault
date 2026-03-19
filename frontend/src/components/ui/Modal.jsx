import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const onKey = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKey);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full md:max-w-xl max-h-[92vh] md:max-h-[90vh] flex flex-col p-0 overflow-hidden animate-pop rounded-t-3xl md:rounded-3xl border border-white/10" style={{ background: 'var(--color-bg-alt)', boxShadow: '0 -8px 32px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white font-display tracking-tight">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white text-white/50 transition-colors">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-6 md:px-8 py-6 overflow-y-auto overscroll-contain bg-transparent safe-bottom" style={{ WebkitOverflowScrolling: 'touch' }}>{children}</div>
      </div>
    </div>
  );
}
