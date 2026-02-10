const colorMap = {
  accent: {
    card: 'cv-card-accent',
    icon: 'bg-white/20 border border-white/20',
    iconColor: 'text-white',
    textLabel: 'text-white/60',
    textValue: 'text-white',
    textTrend: 'text-white/50',
  },
  dark: {
    card: 'cv-card-dark',
    icon: 'bg-accent/15 border border-accent/25',
    iconColor: 'text-accent',
    textLabel: 'text-white/60',
    textValue: 'text-white',
    textTrend: 'text-white/50',
  },
  lime: {
    card: 'cv-card',
    icon: 'bg-lime/15 border border-lime/25',
    iconColor: 'text-lime',
    textLabel: 'text-ink-light',
    textValue: 'text-ink',
    textTrend: 'text-ink-muted',
  },
  orange: {
    card: 'cv-card',
    icon: 'bg-orange/15 border border-orange/25',
    iconColor: 'text-orange',
    textLabel: 'text-ink-light',
    textValue: 'text-ink',
    textTrend: 'text-ink-muted',
  },
  violet: {
    card: 'cv-card',
    icon: 'bg-violet/15 border border-violet/25',
    iconColor: 'text-violet',
    textLabel: 'text-ink-light',
    textValue: 'text-ink',
    textTrend: 'text-ink-muted',
  },
  default: {
    card: 'cv-card',
    icon: 'bg-bg-alt border border-ink/10',
    iconColor: 'text-ink-light',
    textLabel: 'text-ink-light',
    textValue: 'text-ink',
    textTrend: 'text-ink-muted',
  },
};

export default function StatCard({ icon, label, value, trend, color = 'default' }) {
  const c = colorMap[color] || colorMap.default;
  const IconComp = icon;

  return (
    <div className={`${c.card} p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center shrink-0`}>
        {IconComp && <IconComp className={`w-5 h-5 ${c.iconColor}`} strokeWidth={2} />}
      </div>
      <div className="min-w-0">
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${c.textLabel}`}>{label}</p>
        <p className={`text-xl font-bold mt-0.5 truncate font-display ${c.textValue}`}>{value}</p>
        {trend && <p className={`text-[11px] mt-0.5 ${c.textTrend}`}>{trend}</p>}
      </div>
    </div>
  );
}
