export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bento-card border-dashed border-white/10 bg-white/[0.01]">
      {Icon && (
        <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
          <Icon className="w-8 h-8 text-white/40" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-xl font-bold text-white mb-2 font-display tracking-tight">{title}</h3>
      <p className="text-sm text-ink-muted max-w-sm mb-8 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
