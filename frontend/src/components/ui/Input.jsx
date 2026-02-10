import { clsx } from 'clsx';

export default function Input({ label, error, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-semibold text-ink">{label}</label>}
      <input
        className={clsx(
          'cv-input w-full px-4 py-2.5 text-sm text-ink',
          error && 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(230,57,70,0.15)]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}
