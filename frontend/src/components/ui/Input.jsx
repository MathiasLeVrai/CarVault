import { clsx } from 'clsx';

export default function Input({ label, error, className, ...props }) {
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-semibold text-white/80">{label}</label>}
      <input
        className={clsx(
          'cv-input w-full px-4 py-3 text-sm text-white bg-white/[0.02]',
          error && 'border-accent focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,42,63,0.15)]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-semibold text-accent">{error}</p>}
    </div>
  );
}
