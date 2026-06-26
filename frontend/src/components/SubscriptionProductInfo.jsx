import { useSubscriptionPricing } from '../hooks/useSubscriptionPricing';

export default function SubscriptionProductInfo({ plan = 'yearly', className = 'text-center text-[11px] text-white/45 mb-3 leading-relaxed' }) {
  const pricing = useSubscriptionPricing();
  const active = pricing.forPlan(plan);
  const periodLabel = plan === 'yearly' ? 'annuel' : 'mensuel';

  return (
    <p className={className}>
      <span className="font-semibold text-white/65">{active.title || pricing.title}</span>
      {' · '}
      Abonnement {periodLabel}
      {active.label ? (
        <>
          {' · '}
          <span className="text-white/55">{active.label}</span>
        </>
      ) : null}
    </p>
  );
}
