import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-lg max-h-[92vh] md:max-h-[90vh] flex flex-col cv-card p-0 overflow-hidden animate-pop rounded-t-2xl md:rounded-2xl">
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-ink/10 bg-linear-to-r from-accent/10 to-transparent">
          <h2 className="text-base font-bold text-ink font-display">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-bg-alt flex items-center justify-center hover:bg-accent/10 hover:text-accent transition-colors">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-5 md:px-6 py-5 overflow-y-auto bg-bg-card safe-bottom">{children}</div>
      </div>
    </div>
  );
}
