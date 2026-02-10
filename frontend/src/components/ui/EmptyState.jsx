export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-bg-alt border-2 border-ink flex items-center justify-center mb-5">
          <Icon className="w-7 h-7 text-ink-muted" strokeWidth={2} />
        </div>
      )}
      <h3 className="text-lg font-black text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-light max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}
