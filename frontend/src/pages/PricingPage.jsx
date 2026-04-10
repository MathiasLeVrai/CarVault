import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft, Shield, Zap, Car, FileText, Bell, TrendingUp, Wrench, MapPin, Share2, Fuel, Loader2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscriptionApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
});

const FEATURES = [
  { icon: Car, color: '#22c55e', title: 'Véhicules illimités', desc: 'Gérez toute la famille — moto, voiture, utilitaire.' },
  { icon: FileText, color: '#ff2a3f', title: 'Coffre-fort documentaire', desc: 'Carte grise, assurance, CT, factures — tout au même endroit.' },
  { icon: Bell, color: '#f59e0b', title: 'Alertes intelligentes', desc: 'Rappels J-30, J-14, J-7, J-1 avant chaque expiration.' },
  { icon: Wrench, color: '#7c5cfc', title: 'Suivi d\'entretien', desc: 'Vidanges, pneus, révisions — historique complet.' },
  { icon: Fuel, color: '#38bdf8', title: 'Carnet de carburant', desc: 'Chaque plein enregistré, consommation calculée automatiquement.' },
  { icon: TrendingUp, color: '#22c55e', title: 'Score de santé /100', desc: 'Un grade A-D qui résume l\'état réel de votre véhicule.' },
  { icon: Share2, color: '#ff6b00', title: 'Rapport PDF de revente', desc: 'Un dossier complet pour rassurer les acheteurs.' },
  { icon: MapPin, color: '#38bdf8', title: 'Carte interactive', desc: 'Garages, centres CT, prix du carburant en temps réel.' },
];

const FAQ = [
  { q: 'L\'essai est-il vraiment gratuit ?', a: 'Oui, pendant 14 jours vous accédez à toutes les fonctionnalités sans être débité. Vous pouvez annuler à tout moment avant la fin de l\'essai.' },
  { q: 'Puis-je changer de formule ?', a: 'Oui, passez du mensuel à l\'annuel (ou inversement) à tout moment depuis votre espace de gestion Stripe.' },
  { q: 'Que se passe-t-il après l\'essai ?', a: 'Votre abonnement démarre automatiquement. Si vous annulez avant, vous repassez sur le plan gratuit (1 véhicule).' },
  { q: 'Mes documents sont-ils en sécurité ?', a: 'Vos fichiers sont stockés de manière sécurisée. L\'accès nécessite votre authentification. Aucun partage sans votre accord.' },
];

export default function PricingPage() {
  const [plan, setPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/register');
      return;
    }
    setLoading(true);
    try {
      const { url } = await subscriptionApi.createCheckout(plan);
      if (url) {
        window.location.href = url;
      } else {
        toast.info('Contactez hello@carvault.fr pour activer Premium.');
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const isYearly = plan === 'yearly';

  return (
    <div className="min-h-screen bg-bg text-ink overflow-x-hidden">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 mb-8 text-sm font-semibold text-ink-muted">
              <Clock className="w-3.5 h-3.5 text-accent" />
              14 jours d'essai gratuit
            </div>
          </Motion.div>

          <Motion.h1 {...fade(0.08)} className="text-5xl md:text-6xl font-black font-display leading-[1.08] tracking-tight mb-5">
            Testez tout.
            <br />
            <span className="text-accent">Payez après.</span>
          </Motion.h1>

          <Motion.p {...fade(0.16)} className="text-lg text-ink-muted font-medium max-w-lg mx-auto leading-relaxed">
            Accédez à toutes les fonctionnalités pendant 14 jours.
            Sans engagement, annulable en un clic.
          </Motion.p>
        </div>
      </section>

      {/* Pricing card */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-md mx-auto">
          <Motion.div {...fade()} className="cv-card-accent p-8 relative">
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-accent text-white shadow-[0_0_16px_rgba(255,42,63,0.4)]">
                14 jours gratuits
              </span>
            </div>

            {/* Plan toggle */}
            <div className="flex items-center justify-center mb-8 mt-2">
              <div className="inline-flex rounded-xl bg-white/[0.06] border border-white/10 p-1">
                <button
                  onClick={() => setPlan('monthly')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${!isYearly ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                >
                  Mensuel
                </button>
                <button
                  onClick={() => setPlan('yearly')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isYearly ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                >
                  Annuel
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime/20 text-lime border border-lime/30">
                    -17%
                  </span>
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-black font-display text-white">
                  {isYearly ? '39,99' : '3,99'}
                </span>
                <span className="text-lg font-bold text-white/60">€</span>
                <span className="text-sm text-white/40 ml-1">
                  / {isYearly ? 'an' : 'mois'}
                </span>
              </div>
              {isYearly && (
                <p className="text-sm text-white/40 mt-2">
                  soit 3,33€/mois — <span className="text-lime font-semibold">économisez 8€/an</span>
                </p>
              )}
              <p className="text-xs text-white/30 mt-2">
                Après 14 jours d'essai gratuit · Annulable à tout moment
              </p>
            </div>

            {/* Features */}
            <div className="space-y-2.5 mb-8">
              {['Véhicules illimités', 'Documents illimités', 'Alertes intelligentes', 'Score de santé /100', 'Rapport PDF de revente', 'Statistiques avancées', 'Carte interactive'].map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-lime flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-sm text-white/80 font-medium">{f}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 rounded-2xl cv-btn-accent text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" fill="white" strokeWidth={0} />}
              {loading ? 'Redirection…' : 'Démarrer mon essai gratuit'}
            </button>

            <p className="text-center text-[10px] text-white/25 mt-3">
              Paiement sécurisé par Stripe · Aucun prélèvement pendant 14 jours
            </p>
          </Motion.div>
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
            {FEATURES.map((f, i) => {
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
                    <h3 className="text-sm font-bold mb-1">{f.title}</h3>
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
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-7 h-7 text-accent" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight mb-4">
                  14 jours pour tout tester.
                </h2>
                <p className="text-white/45 font-medium mb-8 text-lg">
                  Aucun prélèvement pendant l'essai.<br />
                  Annulable en un clic, sans engagement.
                </p>
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="cv-btn-accent px-10 py-4 text-base rounded-xl inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Démarrer l'essai gratuit <ArrowRight className="w-4 h-4" />
                </button>
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
