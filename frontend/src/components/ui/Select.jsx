import { clsx } from 'clsx';

export default function Select({ label, options, error, className, ...props }) {
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-semibold text-ink-light">{label}</label>}
      <div className="relative">
        <select
          className={clsx(
            'cv-input w-full px-4 py-3 text-sm text-ink appearance-none cursor-pointer pr-10',
            error && 'border-accent focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,42,63,0.15)]',
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-[#121214] text-white py-2">{opt.label}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs font-semibold text-accent">{error}</p>}
    </div>
  );
}
