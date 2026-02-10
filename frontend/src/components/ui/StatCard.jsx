const colorMap = {
  lime: { card: 'nb-card-lime', icon: 'bg-white border-2 border-ink' },
  dark: { card: 'nb-card-dark', icon: 'bg-lime border-2 border-ink' },
  orange: { card: 'nb-card', icon: 'bg-orange border-2 border-ink' },
  violet: { card: 'nb-card', icon: 'bg-violet border-2 border-ink' },
  default: { card: 'nb-card', icon: 'bg-bg-alt border-2 border-ink' },
};

export default function StatCard({ icon, label, value, trend, color = 'default' }) {
  const c = colorMap[color] || colorMap.default;
  const IconComp = icon;

  return (
    <div className={`${c.card} p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center shadow-[2px_2px_0_#1a1a1a] shrink-0`}>
        {IconComp && <IconComp className={`w-5 h-5 ${color === 'dark' ? 'text-ink' : color === 'lime' ? 'text-ink' : 'text-white'}`} strokeWidth={2.2} />}
      </div>
      <div className="min-w-0">
        <p className={`text-[11px] font-bold uppercase tracking-wider ${color === 'dark' ? 'text-white/60' : 'text-ink-light'}`}>{label}</p>
        <p className={`text-xl font-black mt-0.5 truncate ${color === 'dark' ? 'text-white' : 'text-ink'}`}>{value}</p>
        {trend && <p className={`text-[11px] mt-0.5 ${color === 'dark' ? 'text-white/50' : 'text-ink-muted'}`}>{trend}</p>}
      </div>
    </div>
  );
}
