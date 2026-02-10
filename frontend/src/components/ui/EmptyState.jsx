export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
          <Icon className="w-7 h-7 text-accent" strokeWidth={1.8} />
        </div>
      )}
      <h3 className="text-lg font-bold text-ink mb-1 font-display">{title}</h3>
      <p className="text-sm text-ink-light max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}
