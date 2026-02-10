import { clsx } from 'clsx';

export default function Select({ label, options, error, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-bold text-ink">{label}</label>}
      <select
        className={clsx('nb-input w-full px-4 py-2.5 text-sm text-ink appearance-none cursor-pointer', className)}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}
