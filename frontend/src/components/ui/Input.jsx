import { clsx } from 'clsx';

export default function Input({ label, error, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-bold text-ink">{label}</label>}
      <input
        className={clsx('nb-input w-full px-4 py-2.5 text-sm text-ink', error && 'shadow-[3px_3px_0_#ef4444]', className)}
        {...props}
      />
      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}
