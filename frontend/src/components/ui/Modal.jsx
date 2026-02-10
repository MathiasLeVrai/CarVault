import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col nb-card p-0 overflow-hidden animate-pop">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-ink bg-lime">
          <h2 className="text-base font-black text-ink">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg border-2 border-ink bg-white flex items-center justify-center hover:bg-bg-alt transition-colors">
            <X className="w-4 h-4 text-ink" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto bg-white">{children}</div>
      </div>
    </div>
  );
}
