const colorConfig = {
  accent: { border: '#ff2a3f', iconBg: 'bg-accent/10 border-accent/20', iconColor: 'text-accent' },
  orange: { border: '#ff6b00', iconBg: 'bg-orange/10 border-orange/20', iconColor: 'text-orange' },
  violet: { border: '#7c5cfc', iconBg: 'bg-violet/10 border-violet/20', iconColor: 'text-violet' },
  lime: { border: '#22c55e', iconBg: 'bg-lime/10 border-lime/20', iconColor: 'text-lime' },
  sky: { border: '#38bdf8', iconBg: 'bg-sky/10 border-sky/20', iconColor: 'text-sky' },
  dark: { border: '#52525b', iconBg: 'bg-white/5 border-white/10', iconColor: 'text-ink-light' },
  default: { border: '#52525b', iconBg: 'bg-white/5 border-white/10', iconColor: 'text-ink-light' },
};

export default function StatCard({ icon, label, value, trend, color = 'default' }) {
  const c = colorConfig[color] || colorConfig.default;
  const IconComp = icon;

  return (
    <div className="bento-card p-4 md:p-5 relative overflow-hidden">
      {/* Colored accent bar */}
      <div
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
        style={{ background: c.border }}
      />

      <div className="flex items-start gap-3.5 pl-2">
        <div className={`w-10 h-10 rounded-xl ${c.iconBg} border flex items-center justify-center shrink-0`}>
          {IconComp && <IconComp className={`w-[18px] h-[18px] ${c.iconColor}`} strokeWidth={2} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider leading-tight">{label}</p>
          <p className="text-xl md:text-2xl font-black text-ink font-display truncate mt-1">{value}</p>
          {trend && <p className="text-[11px] text-ink-muted mt-0.5 truncate">{trend}</p>}
        </div>
      </div>
    </div>
  );
}
