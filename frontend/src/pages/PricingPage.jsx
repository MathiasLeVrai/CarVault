import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Check, X, ArrowRight, ArrowLeft, Shield, Zap, Car, FileText, Bell, TrendingUp, Wrench, MapPin, Share2, Fuel } from 'lucide-react';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
});

const PLANS = [
  {
    name: 'Gratuit',
    price: '0€',
    period: 'pour toujours',
    cta: 'Commencer gratuitement',
    to: '/register',
    accent: false,
    features: [
      '1 véhicule',
      'Documents illimités',
      'Alertes d\'expiration',
      'Suivi des entretiens',
      'Carnet de carburant',
    ],
    missing: [
      'Score de santé /100',
      'Rapport PDF de revente',
      'Statistiques avancées',
      'Véhicules illimités',
    ],
  },
  {
    name: 'Premium',
    price: '3€',
    period: '/mois',
    cta: 'Essayer Premium',
    to: '/register',
    accent: true,
    badge: 'Le plus populaire',
    features: [
      'Véhicules illimités',
      'Documents illimités',
      'Alertes d\'expiration',
      'Suivi des entretiens',
      'Carnet de carburant',
      'Score de santé /100',
      'Rapport PDF de revente',
      'Statistiques avancées',
    ],
    missing: [],
  },
];

const FEATURES_DETAIL = [
  { icon: FileText, color: '#ff2a3f', title: 'Coffre-fort documentaire', desc: 'Carte grise, assurance, CT, factures — tout au même endroit.', free: true },
  { icon: Bell, color: '#f59e0b', title: 'Alertes intelligentes', desc: 'Rappels J-30, J-14, J-7, J-1 avant chaque expiration.', free: true },
  { icon: Wrench, color: '#7c5cfc', title: 'Suivi d\'entretien', desc: 'Vidanges, pneus, révisions — historique complet.', free: true },
  { icon: Fuel, color: '#38bdf8', title: 'Carnet de carburant', desc: 'Chaque plein enregistré, consommation calculée automatiquement.', free: true },
  { icon: Car, color: '#22c55e', title: 'Véhicules illimités', desc: 'Gérez toute la famille — moto, voiture, utilitaire.', free: false },
  { icon: TrendingUp, color: '#22c55e', title: 'Score de santé /100', desc: 'Un grade A-D qui résume l\'état réel de votre véhicule.', free: false },
  { icon: Share2, color: '#ff6b00', title: 'Rapport PDF de revente', desc: 'Un dossier complet pour rassurer les acheteurs.', free: false },
  { icon: MapPin, color: '#38bdf8', title: 'Carte interactive', desc: 'Garages, centres CT, prix du carburant en temps réel.', free: true },
];

const FAQ = [
  { q: 'Puis-je annuler mon abonnement à tout moment ?', a: 'Oui, sans engagement. Vous repassez sur le plan gratuit à la fin du mois payé.' },
  { q: 'Que se passe-t-il si je dépasse 1 véhicule en gratuit ?', a: 'Vous gardez l\'accès à votre véhicule existant. Pour en ajouter un deuxième, il suffit de passer Premium.' },
  { q: 'Mes documents sont-ils en sécurité ?', a: 'Vos fichiers sont stockés de manière sécurisée. L\'accès nécessite votre authentification. Aucun partage sans votre accord.' },
  { q: 'Y a-t-il un engagement annuel ?', a: 'Non. Le paiement est mensuel, sans engagement. Vous pouvez arrêter quand vous voulez.' },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-bg text-ink overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full aurora-1"
          style={{ background: 'radial-gradient(circle at center, rgba(255,42,63,0.1) 0%, transparent 65%)', filter: 'blur(90px)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full aurora-2"
          style={{ background: 'radial-gradient(circle at center, rgba(124,92,252,0.08) 0%, transparent 65%)', filter: 'blur(100px)' }} />
        <div className="absolute cv-grid-bg inset-0 opacity-30" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/[0.05]">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_20px_rgba(255,42,63,0.35)]">
            <span className="text-xs font-black text-white font-display">CV</span>
          </div>
          <span className="text-lg font-bold font-display tracking-tight">CarVault</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/" className="px-4 py-2 text-sm font-semibold text-ink-muted hover:text-ink transition-colors hidden sm:flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Accueil
          </Link>
          <Link to="/register" className="cv-btn-accent px-5 py-2.5 text-sm rounded-xl inline-flex items-center gap-1.5">
            Commencer <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-6 md:px-12 pt-20 pb-8 md:pt-28 md:pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <Motion.div {...fade()}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md mb-8 text-sm font-semibold text-ink-muted">
              <Zap className="w-3.5 h-3.5 text-accent" />
              Simple, transparent, sans engagement
            </div>
          </Motion.div>

          <Motion.h1 {...fade(0.08)} className="text-5xl md:text-6xl font-black font-display leading-[1.08] tracking-tight mb-5">
            Un prix juste.
            <br />
            <span className="text-accent">Pas de surprise.</span>
          </Motion.h1>

          <Motion.p {...fade(0.16)} className="text-lg text-ink-muted font-medium max-w-lg mx-auto leading-relaxed">
            Gratuit pour un véhicule. Premium pour toute la famille.
            Annulation en un clic, sans engagement.
          </Motion.p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {PLANS.map((plan, i) => (
            <Motion.div key={plan.name} {...fade(i * 0.08)}
              className={`relative ${plan.accent ? 'cv-card-accent' : 'cv-card'} p-8`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-accent text-white shadow-[0_0_16px_rgba(255,42,63,0.4)]">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-bold text-ink-muted mb-2">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black font-display">{plan.price}</span>
                  <span className="text-sm text-ink-muted font-medium">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-lime flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-sm text-ink-light font-medium">{f}</span>
                  </div>
                ))}
                {plan.missing.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <X className="w-4 h-4 text-ink-faint flex-shrink-0" strokeWidth={2} />
                    <span className="text-sm text-ink-faint font-medium">{f}</span>
                  </div>
                ))}
              </div>

              <Link to={plan.to}
                className={`w-full py-3.5 text-sm rounded-xl inline-flex items-center gap-2 justify-center font-bold transition-all ${plan.accent ? 'cv-btn-accent' : 'cv-btn-dark'}`}>
                {plan.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </Motion.div>
          ))}
        </div>
      </section>

      {/* Feature detail grid */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-4xl mx-auto">
          <Motion.div {...fade()} className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-4">Tout inclus</p>
            <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight">
              Ce que vous obtenez.
            </h2>
          </Motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES_DETAIL.map((f, i) => {
              const Icon = f.icon;
              return (
                <Motion.div key={f.title} {...fade(i * 0.04)}
                  className="cv-card p-5 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}>
                    <Icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold">{f.title}</h3>
                      {!f.free && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent/10 text-accent border border-accent/20">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted font-medium leading-relaxed">{f.desc}</p>
                  </div>
                </Motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-2xl mx-auto">
          <Motion.div {...fade()} className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-4">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight">
              Questions fréquentes
            </h2>
          </Motion.div>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <Motion.div key={i} {...fade(i * 0.05)} className="cv-card p-5">
                <h3 className="text-sm font-bold mb-2">{item.q}</h3>
                <p className="text-xs text-ink-muted font-medium leading-relaxed">{item.a}</p>
              </Motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <Motion.div {...fade()}>
            <div className="cv-card-accent p-12 md:p-16 relative overflow-hidden">
              <div className="absolute inset-0 mesh-accent opacity-50" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-7 h-7 text-accent" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight mb-4">
                  Prenez le contrôle.
                </h2>
                <p className="text-white/45 font-medium mb-8 text-lg">
                  Gratuit pour 1 véhicule. Aucune carte bancaire.<br />
                  Prêt en 3 minutes.
                </p>
                <Link to="/register" className="cv-btn-accent px-10 py-4 text-base rounded-xl inline-flex items-center gap-2">
                  Créer mon compte gratuit <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.05] px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/90 flex items-center justify-center shadow-[0_0_14px_rgba(255,42,63,0.3)]">
              <span className="text-[10px] font-black text-white font-display">CV</span>
            </div>
            <div>
              <span className="text-sm font-bold font-display">CarVault</span>
              <p className="text-[10px] text-ink-muted font-medium">Le coffre-fort de votre automobile</p>
            </div>
          </div>
          <p className="text-xs text-ink-faint font-medium order-last md:order-none">
            © {new Date().getFullYear()} CarVault
          </p>
          <div className="flex gap-6">
            <Link to="/login" className="text-xs text-ink-muted hover:text-ink transition-colors font-medium">Connexion</Link>
            <Link to="/register" className="text-xs text-ink-muted hover:text-ink transition-colors font-medium">Inscription</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
