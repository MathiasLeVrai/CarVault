import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Bell, Wrench, TrendingUp, MapPin, Shield,
  ArrowRight, CheckCircle, ChevronRight,
} from 'lucide-react';
import { CyclingWord } from '../components/ui/AnimatedHero';

const CYCLING_WORDS = ['simplifié.', 'sécurisé.', 'sous contrôle.', 'en ordre.'];

const FEATURES = [
  {
    icon: FileText,
    color: '#ff2a3f',
    title: 'Coffre-fort documentaire',
    desc: 'Carte grise, assurance, contrôle technique, factures — tout au même endroit, accessible en 2 secondes.',
  },
  {
    icon: Bell,
    color: '#f59e0b',
    title: 'Alertes intelligentes',
    desc: 'Rappels automatiques J-30, J-14, J-7 avant chaque expiration. Fini les amendes de 135€ pour CT oublié.',
  },
  {
    icon: Wrench,
    color: '#7c5cfc',
    title: 'Suivi des entretiens',
    desc: 'Historique complet des révisions, pneus, vidanges. Connaissez le passé de votre véhicule à tout moment.',
  },
  {
    icon: TrendingUp,
    color: '#22c55e',
    title: 'Score de santé',
    desc: 'Une note sur 100 qui résume l\'état de votre véhicule — documents, entretiens, dépenses.',
  },
  {
    icon: MapPin,
    color: '#38bdf8',
    title: 'Carte des garages',
    desc: 'Trouvez les garages, centres de CT et stations de lavage à proximité sur une carte interactive.',
  },
  {
    icon: Shield,
    color: '#ff6b00',
    title: 'Rapport de revente',
    desc: 'Exportez un PDF professionnel avec tout l\'historique du véhicule pour rassurer les acheteurs.',
  },
];

const STEPS = [
  { n: '01', title: 'Ajoutez votre véhicule', desc: 'En 30 secondes via la plaque d\'immatriculation ou manuellement.' },
  { n: '02', title: 'Centralisez vos documents', desc: 'Uploadez vos documents — CarVault détecte les dates d\'expiration.' },
  { n: '03', title: 'Dormez tranquille', desc: 'Les alertes automatiques vous préviennent avant chaque échéance importante.' },
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
});

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-white overflow-x-hidden">
      {/* ── Background glows ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full aurora-1"
          style={{ background: 'radial-gradient(circle at center, rgba(255,42,63,0.12) 0%, transparent 65%)', filter: 'blur(90px)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full aurora-2"
          style={{ background: 'radial-gradient(circle at center, rgba(124,92,252,0.1) 0%, transparent 65%)', filter: 'blur(100px)' }} />
        <div className="absolute cv-grid-bg inset-0 opacity-40" />
      </div>

      {/* ── Navbar ───────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_20px_rgba(255,42,63,0.35)]">
            <span className="text-xs font-black text-white font-display">CV</span>
          </div>
          <span className="text-lg font-bold font-display tracking-tight text-white">CarVault</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            Se connecter
          </Link>
          <Link
            to="/register"
            className="cv-btn-accent px-5 py-2.5 text-sm rounded-xl inline-flex items-center gap-1.5"
          >
            Commencer <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md mb-8 text-sm font-semibold text-white/60"
        >
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Le coffre-fort numérique de votre voiture
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl font-black font-display leading-[1.1] tracking-tight mb-4 max-w-4xl"
        >
          Votre garage,{' '}
          <CyclingWord words={CYCLING_WORDS} className="text-accent" />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg md:text-xl text-white/50 font-medium max-w-xl mb-10 leading-relaxed"
        >
          Documents, entretiens, dépenses, alertes — tout ce qui concerne votre
          véhicule, centralisé en un seul endroit. Fini le chaos.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link to="/register" className="cv-btn-accent px-8 py-4 text-base rounded-xl inline-flex items-center gap-2 justify-center">
            Créer mon espace gratuit <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="cv-btn-dark px-8 py-4 text-base rounded-xl inline-flex items-center gap-2 justify-center">
            J'ai déjà un compte <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="flex items-center gap-6 mt-12 text-sm text-white/30 font-medium"
        >
          {[['2 400+', 'utilisateurs'], ['4.8★', 'satisfaction'], ['Gratuit', 'pour commencer']].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="text-white/80 font-bold text-base">{v}</div>
              <div className="text-[11px] uppercase tracking-widest mt-0.5">{l}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Problem ──────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-3xl mx-auto cv-card p-8 md:p-12">
          <motion.p {...fade()} className="text-2xl md:text-3xl font-bold text-white/80 leading-snug text-center">
            "J'ai oublié mon contrôle technique et j'ai pris{' '}
            <span className="text-accent">135€ d'amende.</span>"
          </motion.p>
          <motion.p {...fade(0.1)} className="text-center text-white/35 mt-4 font-medium">
            Ça arrive à des milliers de conducteurs chaque année. CarVault vous prévient bien avant.
          </motion.p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fade()} className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-white/40 text-lg font-medium max-w-lg mx-auto">
              Un seul outil pour remplacer les dossiers papier, les rappels oubliés, et les tableurs DIY.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} {...fade(i * 0.06)} className="cv-card p-6 group">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/45 font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fade()} className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight mb-4">
              En place en 3 minutes
            </h2>
          </motion.div>

          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} {...fade(i * 0.08)} className="flex items-start gap-6 cv-card p-6 md:p-8">
                <span className="text-5xl font-black font-display text-white/[0.06] leading-none flex-shrink-0 select-none">
                  {s.n}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-white/45 font-medium">{s.desc}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-accent/60 flex-shrink-0 ml-auto mt-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fade()}>
            <div className="cv-card-accent p-12 md:p-16 relative overflow-hidden">
              <div className="absolute inset-0 mesh-accent opacity-40" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight mb-4">
                  Prenez le contrôle <br />de votre véhicule
                </h2>
                <p className="text-white/55 font-medium mb-8 text-lg">
                  Gratuit pour 1 véhicule. Aucune carte bancaire requise.
                </p>
                <Link to="/register" className="cv-btn-accent px-10 py-4 text-base rounded-xl inline-flex items-center gap-2">
                  Créer mon compte gratuit <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.05] px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/90 flex items-center justify-center">
            <span className="text-[10px] font-black text-white font-display">CV</span>
          </div>
          <span className="text-sm font-bold text-white/50 font-display">CarVault</span>
        </div>
        <p className="text-xs text-white/25 font-medium">
          © {new Date().getFullYear()} CarVault — Le coffre-fort de votre automobile
        </p>
        <div className="flex gap-4">
          <Link to="/login" className="text-xs text-white/30 hover:text-white/60 transition-colors font-medium">Connexion</Link>
          <Link to="/register" className="text-xs text-white/30 hover:text-white/60 transition-colors font-medium">Inscription</Link>
        </div>
      </footer>
    </div>
  );
}
