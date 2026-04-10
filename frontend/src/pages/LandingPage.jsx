import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion as Motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  FileText, Bell, Wrench, TrendingUp, MapPin, Shield,
  ArrowRight, Check, X, Fuel, BarChart3, Share2, Car,
  AlertTriangle, Star, ChevronRight, ChevronDown,
} from 'lucide-react';

/* ─── Data ──────────────────────────────────────────────────── */

const FAQ_ITEMS = [
  {
    q: 'Quand faire son contrôle technique ?',
    a: 'Le premier contrôle technique doit être réalisé dans les 6 mois précédant le 4e anniversaire de la première mise en circulation du véhicule, puis tous les 2 ans. CarVault vous envoie des rappels automatiques à J-30, J-14 et J-7 pour ne jamais oublier.',
  },
  {
    q: 'Comment lire une carte grise ?',
    a: 'La carte grise (certificat d\'immatriculation) contient toutes les informations essentielles : champ A (numéro d\'immatriculation), B (date de 1ère immatriculation), D.1 (marque), D.2 (type/variante), P.6 (puissance fiscale). Avec CarVault, scannez votre plaque et toutes ces infos sont automatiquement importées.',
  },
  {
    q: 'Combien coûte l\'entretien d\'une voiture par an ?',
    a: 'En moyenne, l\'entretien d\'une voiture coûte entre 1 500 € et 2 500 € par an (assurance, carburant, révisions, réparations). CarVault vous aide à suivre chaque dépense et à calculer votre coût de possession réel au mois et au jour.',
  },
  {
    q: 'Comment calculer la puissance fiscale ?',
    a: 'La puissance fiscale (CV) est calculée selon la formule officielle française prenant en compte la puissance du moteur et les émissions de CO₂. CarVault récupère automatiquement la puissance fiscale lors du scan de plaque d\'immatriculation.',
  },
  {
    q: 'Qu\'est-ce que la vignette Crit\'Air ?',
    a: 'La vignette Crit\'Air classe les véhicules selon leur niveau d\'émissions polluantes (de 0 pour les électriques à 5 pour les plus polluants). Elle est obligatoire dans les Zones à Faibles Émissions (ZFE) comme Paris, Lyon ou Marseille. CarVault calcule automatiquement votre niveau Crit\'Air et vous alerte si votre véhicule est concerné par des restrictions.',
  },
];

const MARQUEE_ITEMS = [
  { icon: '🗂', label: 'Coffre-fort documentaire' },
  { icon: '🔔', label: 'Alertes J-30 · J-14 · J-7' },
  { icon: '🔧', label: 'Suivi des entretiens' },
  { icon: '⛽', label: 'Carnet de carburant' },
  { icon: '📊', label: 'Score de santé /100' },
  { icon: '🗺', label: 'Carte des garages' },
  { icon: '📄', label: 'Rapport PDF de revente' },
  { icon: '🚗', label: 'Scan de plaque' },
  { icon: '💰', label: 'Suivi des dépenses' },
  { icon: '📱', label: 'PWA installable' },
];

const BENTO = [
  {
    id: 'vault',
    icon: FileText,
    color: '#ff2a3f',
    span: 'lg:col-span-2',
    title: 'Coffre-fort documentaire',
    desc: 'Carte grise, assurance, contrôle technique, factures — tout en un seul endroit, accessible en 2 secondes depuis votre téléphone.',
    preview: 'docs',
  },
  {
    id: 'alerts',
    icon: Bell,
    color: '#f59e0b',
    span: '',
    title: 'Alertes intelligentes',
    desc: 'Rappels automatiques avant chaque expiration. Fini les 135€ d\'amende pour CT oublié.',
    preview: 'alert',
  },
  {
    id: 'score',
    icon: TrendingUp,
    color: '#22c55e',
    span: '',
    title: 'Score de santé',
    desc: 'Une note /100 qui résume l\'état réel de votre véhicule en un coup d\'œil.',
    preview: 'score',
  },
  {
    id: 'maintenance',
    icon: Wrench,
    color: '#7c5cfc',
    span: 'lg:col-span-2',
    title: 'Historique d\'entretien complet',
    desc: 'Révisions, pneus, vidanges, courroie de distribution — conservez tout pour rassurer lors de la revente.',
    preview: 'maintenance',
  },
  {
    id: 'map',
    icon: MapPin,
    color: '#38bdf8',
    span: '',
    title: 'Carte interactive',
    desc: 'Garages, centres CT et stations de lavage autour de vous, avec les prix du carburant en temps réel.',
    preview: 'map',
  },
  {
    id: 'export',
    icon: Share2,
    color: '#ff6b00',
    span: '',
    title: 'Rapport de revente PDF',
    desc: 'Exportez un PDF professionnel avec tout l\'historique pour rassurer les acheteurs potentiels.',
    preview: 'pdf',
  },
];

const COMPARISON = [
  { feature: 'Documents centralisés', cv: true, drive: true, calendar: false },
  { feature: 'Alertes d\'expiration auto', cv: true, drive: false, calendar: true },
  { feature: 'Score de santé véhicule', cv: true, drive: false, calendar: false },
  { feature: 'Scan de plaque d\'immatriculation', cv: true, drive: false, calendar: false },
  { feature: 'Rapport PDF de revente', cv: true, drive: false, calendar: false },
  { feature: 'Carte des garages / CT', cv: true, drive: false, calendar: false },
  { feature: 'Suivi des dépenses auto', cv: true, drive: false, calendar: false },
  { feature: 'Carnet de carburant', cv: true, drive: false, calendar: false },
];

const TESTIMONIALS = [
  {
    quote: "J'avais pris 135€ d'amende l'année dernière pour mon CT. Depuis CarVault, j'ai eu le rappel 30 jours avant. Irréprochable.",
    author: 'Thomas M.',
    detail: 'Renault Clio, Paris 11e',
    stars: 5,
  },
  {
    quote: "La revente de ma Golf a été nickel — j'ai envoyé le PDF CarVault à l'acheteur, il a signé le même jour. Vraiment utile.",
    author: 'Laura D.',
    detail: 'Volkswagen Golf, Lyon',
    stars: 5,
  },
  {
    quote: "On a 3 voitures à la maison. Avant c'était le chaos. Maintenant tout est au même endroit, ma femme et moi avons chacun accès.",
    author: 'Karim B.',
    detail: 'Famille 3 véhicules, Marseille',
    stars: 5,
  },
];


/* ─── Mini previews ─────────────────────────────────────────── */

function PreviewDocs() {
  const docs = [
    { name: 'Carte grise', exp: '—', color: '#22c55e' },
    { name: 'Assurance', exp: 'expire dans 42j', color: '#f59e0b' },
    { name: 'Contrôle technique', exp: 'expire dans 8j', color: '#ff2a3f' },
  ];
  return (
    <div className="mt-4 space-y-2">
      {docs.map((d) => (
        <div key={d.name} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-xs text-white/70 font-medium">{d.name}</span>
          </div>
          <span className="text-[10px] font-semibold" style={{ color: d.color }}>{d.exp}</span>
        </div>
      ))}
    </div>
  );
}

function PreviewAlert() {
  return (
    <div className="mt-4 flex items-start gap-3 px-3 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-bold text-amber-300">Contrôle technique</p>
        <p className="text-[10px] text-white/50 mt-0.5">Expire dans 8 jours · J-7</p>
      </div>
    </div>
  );
}

function PreviewScore() {
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="32" fill="none" stroke="var(--color-ink-faint)" opacity="0.4" strokeWidth="8" />
          <circle cx="40" cy="40" r="32" fill="none" stroke="#22c55e" strokeWidth="8"
            strokeDasharray="201" strokeDashoffset="50" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-lime leading-none">87</span>
          <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">/ 100</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime/10 border border-lime/20">
        <span className="text-xs font-black text-lime">A</span>
        <span className="text-[10px] text-white/50 font-medium">Très bon état</span>
      </div>
    </div>
  );
}

function PreviewMaintenance() {
  const items = [
    { label: 'Vidange huile', date: 'Jan 2025', km: '87 400 km' },
    { label: 'Pneus avant', date: 'Oct 2024', km: '84 200 km' },
    { label: 'Révision 90 000', date: 'Juil 2024', km: '90 000 km' },
  ];
  return (
    <div className="mt-4 space-y-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div>
            <p className="text-xs font-semibold text-white/80">{it.label}</p>
            <p className="text-[10px] text-white/35">{it.date}</p>
          </div>
          <span className="text-[10px] text-violet-400 font-semibold">{it.km}</span>
        </div>
      ))}
    </div>
  );
}

function PreviewMap() {
  return (
    <div className="mt-4 relative h-20 rounded-xl overflow-hidden bg-sky/5 border border-sky/15">
      {/* Fake map grid */}
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
      {[
        { x: '30%', y: '40%', c: '#22c55e' },
        { x: '60%', y: '30%', c: '#38bdf8' },
        { x: '50%', y: '65%', c: '#ff2a3f' },
      ].map((pin, i) => (
        <div key={i} className="absolute w-4 h-4 rounded-full border-2 border-bg -translate-x-1/2 -translate-y-1/2" style={{ left: pin.x, top: pin.y, background: pin.c }} />
      ))}
    </div>
  );
}

function PreviewPdf() {
  return (
    <div className="mt-4 flex items-center gap-3 px-3 py-3 rounded-xl bg-orange/10 border border-orange/20">
      <FileText className="w-8 h-8 text-orange flex-shrink-0" />
      <div>
        <p className="text-xs font-bold text-orange">Rapport de revente</p>
        <p className="text-[10px] text-white/50 mt-0.5">12 pages · Historique complet</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-white/30 ml-auto flex-shrink-0" />
    </div>
  );
}

const PREVIEW_MAP = {
  docs: PreviewDocs,
  alert: PreviewAlert,
  score: PreviewScore,
  maintenance: PreviewMaintenance,
  map: PreviewMap,
  pdf: PreviewPdf,
};

/* ─── Animations ────────────────────────────────────────────── */

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
});

/* ─── App mockup (hero) ─────────────────────────────────────── */

function AppMockup() {
  return (
    <Motion.div
      initial={{ opacity: 0, x: 40, rotateY: -8 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: '1000px' }}
      className="relative hidden lg:block w-[340px] flex-shrink-0"
    >
      {/* Glow behind */}
      <div className="absolute -inset-8 rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(255,42,63,0.25) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative cv-card p-5 rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider">Mon véhicule</p>
            <p className="text-sm font-black font-display text-white">Peugeot 308 · AB-456-CD</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center">
            <Car className="w-5 h-5 text-accent" />
          </div>
        </div>

        {/* Score row */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-lime/[0.06] border border-lime/15 mb-3">
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
              <circle cx="24" cy="24" r="18" fill="none" stroke="var(--color-ink-faint)" opacity="0.4" strokeWidth="5" />
              <circle cx="24" cy="24" r="18" fill="none" stroke="#22c55e" strokeWidth="5"
                strokeDasharray="113" strokeDashoffset="28" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-black text-lime leading-none">87</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-white">Score de santé</p>
            <p className="text-[10px] text-lime font-semibold mt-0.5">Grade A · Très bon état</p>
          </div>
        </div>

        {/* Alert */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-[10px] text-amber-300 font-semibold">CT expire dans <span className="text-amber-400">8 jours</span></p>
        </div>

        {/* Docs list */}
        <div className="space-y-1.5">
          <p className="text-[9px] text-white/25 font-bold uppercase tracking-widest mb-2">Documents récents</p>
          {[
            { name: 'Assurance AXA', exp: 'oct. 2025', ok: true },
            { name: 'Contrôle technique', exp: 'dans 8j', ok: false },
            { name: 'Carte grise', exp: '—', ok: true },
          ].map((doc) => (
            <div key={doc.name} className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: doc.ok ? '#22c55e' : '#ff2a3f' }} />
                <span className="text-[11px] text-white/70 font-medium">{doc.name}</span>
              </div>
              <span className="text-[10px] font-semibold" style={{ color: doc.ok ? '#71717a' : '#ff2a3f' }}>{doc.exp}</span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-around mt-4 pt-4 border-t border-white/[0.05]">
          {[
            { icon: BarChart3, label: 'Dépenses', color: '#7c5cfc' },
            { icon: Fuel, label: 'Carburant', color: '#38bdf8' },
            { icon: Wrench, label: 'Entretien', color: '#f59e0b' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-[9px] text-white/30 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Motion.div>
  );
}

/* ─── Main component ────────────────────────────────────────── */

function FaqSection() {
  const [open, setOpen] = useState(null);
  return (
    <section className="relative z-10 px-6 md:px-12 py-24">
      <div className="max-w-3xl mx-auto">
        <Motion.div {...fade()} className="text-center mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight mt-2">Questions fréquentes</h2>
        </Motion.div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <Motion.div key={i} {...fade(i * 0.05)}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left bento-card p-5 group"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-white font-display">{item.q}</h3>
                  <ChevronDown
                    className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}
                  />
                </div>
                <AnimatePresence>
                  {open === i && (
                    <Motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-white/50 leading-relaxed mt-3 pt-3 border-t border-white/5">
                        {item.a}
                      </p>
                    </Motion.div>
                  )}
                </AnimatePresence>
              </button>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const prefersReduced = useReducedMotion();

  return (
    <div className="min-h-screen bg-bg text-white overflow-x-hidden">
      <Helmet>
        <title>CarVault — Carnet d'entretien numerique pour votre vehicule</title>
        <meta name="description" content="Gerez votre vehicule simplement : carnet d'entretien, alertes CT, suivi carburant et depenses, score de sante, carte des garages. Essayez gratuitement." />
        <link rel="canonical" href="https://carvault.fly.dev/" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "CarVault",
          "applicationCategory": "UtilitiesApplication",
          "operatingSystem": "Web",
          "url": "https://carvault.fly.dev",
          "description": "Carnet d'entretien numerique pour votre vehicule. Suivi entretien, alertes CT, depenses carburant, score de sante et carte des garages.",
          "offers": [
            {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR",
              "name": "Gratuit",
              "description": "1 vehicule, fonctionnalites de base"
            },
            {
              "@type": "Offer",
              "price": "3.99",
              "priceCurrency": "EUR",
              "name": "Premium mensuel",
              "description": "Vehicules illimites, toutes les fonctionnalites, 14 jours d'essai gratuit",
              "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "price": "3.99",
                "priceCurrency": "EUR",
                "billingDuration": "P1M"
              }
            },
            {
              "@type": "Offer",
              "price": "39.99",
              "priceCurrency": "EUR",
              "name": "Premium annuel",
              "description": "Vehicules illimites, toutes les fonctionnalites, 14 jours d'essai gratuit",
              "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "price": "39.99",
                "priceCurrency": "EUR",
                "billingDuration": "P1Y"
              }
            }
          ],
          "screenshot": "https://carvault.fly.dev/og-image.png"
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQ_ITEMS.map(item => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.a,
            },
          })),
        })}</script>
      </Helmet>

      {/* ── Navbar ───────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_20px_rgba(255,42,63,0.35)]">
            <span className="text-xs font-black text-white font-display">CV</span>
          </div>
          <span className="text-lg font-bold font-display tracking-tight">CarVault</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/pricing" className="px-4 py-2 text-sm font-semibold text-white/50 hover:text-white transition-colors hidden sm:block">
            Tarifs
          </Link>
          <Link to="/login" className="px-4 py-2 text-sm font-semibold text-white/50 hover:text-white transition-colors hidden sm:block">
            Se connecter
          </Link>
          <Link to="/register" className="cv-btn-accent px-5 py-2.5 text-sm rounded-xl inline-flex items-center gap-1.5">
            Commencer <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="max-w-6xl mx-auto flex items-center gap-16">

          {/* Left */}
          <div className="flex-1 min-w-0">
            <Motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 mb-8 text-sm font-semibold text-white/50"
            >
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Le coffre-fort numérique de votre voiture
            </Motion.div>

            <Motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl md:text-6xl lg:text-7xl font-black font-display leading-[1.08] tracking-tight mb-5"
            >
              Tout ce qui concerne
              <br />
              <span className="text-accent">votre voiture.</span>
              <br />
              Au même endroit.
            </Motion.h1>

            <Motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg text-white/45 font-medium max-w-lg mb-8 leading-relaxed"
            >
              Documents, entretiens, dépenses, alertes d'expiration — centralisés en 3 minutes.
              Fini le chaos des dossiers papier et les amendes oubliées.
            </Motion.p>

            <Motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link to="/register" className="cv-btn-accent px-8 py-4 text-base rounded-xl inline-flex items-center gap-2 justify-center">
                Créer mon espace gratuit <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="cv-btn-dark px-8 py-4 text-base rounded-xl inline-flex items-center gap-2 justify-center">
                J'ai déjà un compte <ChevronRight className="w-4 h-4 text-white/40" />
              </Link>
            </Motion.div>

            <Motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="text-xs text-white/25 font-medium mt-5"
            >
              Gratuit pour 1 véhicule · Aucune carte bancaire requise · PWA installable
            </Motion.p>
          </div>

          {/* Right — app mockup */}
          <AppMockup />
        </div>
      </section>

      {/* ── Marquee ──────────────────────────────────────────── */}
      <div className="relative z-10 border-y border-white/[0.05] py-4 overflow-hidden bg-white/[0.015]">
        <div className="flex gap-0" style={{ animation: prefersReduced ? 'none' : 'marquee 28s linear infinite' }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-6 text-sm font-semibold text-white/35 flex-shrink-0 whitespace-nowrap">
              <span className="text-base">{item.icon}</span>
              {item.label}
              <span className="ml-6 text-white/10">·</span>
            </div>
          ))}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </div>

      {/* ── Pain ─────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <Motion.div {...fade()}>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent/70 mb-6">Le problème</p>
            <h2 className="text-4xl md:text-5xl font-black font-display leading-[1.1] mb-6">
              Vous avez une voiture.
              <br />
              <span className="text-white/30">Où sont vos documents ?</span>
            </h2>
          </Motion.div>
          <Motion.div {...fade(0.1)} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 text-left">
            {[
              { emoji: '📁', title: 'Dossier papier', desc: 'Quelque part dans la boîte à gants. Ou chez les parents. Introuvable quand on en a besoin.' },
              { emoji: '📧', title: 'Email perdu', desc: 'L\'assurance vous a envoyé un PDF. Il est dans vos spams. Ou archivé. Impossible à retrouver.' },
              { emoji: '💸', title: '135€ d\'amende', desc: 'Pour contrôle technique expiré. Ça arrive à des milliers de conducteurs chaque année en France.' },
            ].map((p) => (
              <div key={p.title} className="cv-card p-5">
                <span className="text-2xl mb-3 block">{p.emoji}</span>
                <h3 className="text-sm font-bold text-white mb-2">{p.title}</h3>
                <p className="text-xs text-white/40 font-medium leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </Motion.div>
        </div>
      </section>

      {/* ── Features bento ───────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <Motion.div {...fade()} className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Fonctionnalités</p>
            <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight">
              Tout ce dont vous avez besoin.
              <br />
              <span className="text-white/30">Rien de superflu.</span>
            </h2>
          </Motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENTO.map((f, i) => {
              const Icon = f.icon;
              const Preview = PREVIEW_MAP[f.preview];
              return (
                <Motion.div
                  key={f.id}
                  {...fade(i * 0.05)}
                  className={`cv-card p-6 ${f.span}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-xs text-white/40 font-medium leading-relaxed">{f.desc}</p>
                  {Preview && <Preview />}
                </Motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-4xl mx-auto">
          <Motion.div {...fade()} className="text-center mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Mise en place</p>
            <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight">
              Opérationnel en 3 minutes.
            </h2>
          </Motion.div>

          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-accent/30 via-violet/20 to-transparent hidden md:block" />

            <div className="space-y-4">
              {[
                {
                  n: '01', color: '#ff2a3f',
                  title: 'Ajoutez votre véhicule',
                  desc: 'Scannez votre plaque d\'immatriculation ou saisissez les infos manuellement. CarVault récupère automatiquement les données du véhicule.',
                  tag: '30 secondes',
                },
                {
                  n: '02', color: '#7c5cfc',
                  title: 'Uploadez vos documents',
                  desc: 'Carte grise, assurance, CT, factures — ajoutez vos fichiers en quelques taps. CarVault détecte les dates d\'expiration automatiquement.',
                  tag: '2 minutes',
                },
                {
                  n: '03', color: '#22c55e',
                  title: 'Dormez tranquille',
                  desc: 'Les alertes automatiques vous préviennent 30, 14, 7 et 1 jour avant chaque expiration. Votre score de santé est mis à jour en temps réel.',
                  tag: 'Pour toujours',
                },
              ].map((s, i) => (
                <Motion.div key={s.n} {...fade(i * 0.08)}
                  className="flex items-start gap-6 md:gap-8 cv-card p-6 md:p-7 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 0% 50%, ${s.color}08 0%, transparent 60%)` }} />
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-black font-display text-sm relative z-10"
                    style={{ background: `${s.color}15`, border: `1px solid ${s.color}25`, color: s.color }}>
                    {s.n}
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-base font-bold text-white">{s.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}25` }}>
                        {s.tag}
                      </span>
                    </div>
                    <p className="text-sm text-white/40 font-medium leading-relaxed">{s.desc}</p>
                  </div>
                </Motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-3xl mx-auto">
          <Motion.div {...fade()} className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Pourquoi CarVault ?</p>
            <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight mb-4">
              Pas juste Google Drive<br />
              <span className="text-accent">+ un rappel calendrier.</span>
            </h2>
            <p className="text-white/35 font-medium text-lg">
              CarVault est construit spécifiquement pour la possession automobile.
            </p>
          </Motion.div>

          <Motion.div {...fade(0.1)} className="cv-card overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 gap-0 px-6 py-4 border-b border-white/[0.06]">
              <div className="col-span-1" />
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20">
                  <div className="w-4 h-4 rounded bg-accent flex items-center justify-center">
                    <span className="text-[8px] font-black text-white">CV</span>
                  </div>
                  <span className="text-xs font-bold text-white">CarVault</span>
                </div>
              </div>
              <div className="text-center">
                <span className="text-xs font-semibold text-white/30">Google Drive</span>
              </div>
              <div className="text-center">
                <span className="text-xs font-semibold text-white/30">Calendrier</span>
              </div>
            </div>

            {COMPARISON.map((row, i) => (
              <div key={row.feature}
                className={`grid grid-cols-4 gap-0 px-6 py-3.5 ${i % 2 === 0 ? 'bg-white/[0.015]' : ''} ${i < COMPARISON.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                <div className="text-xs text-white/55 font-medium pr-4">{row.feature}</div>
                {[row.cv, row.drive, row.calendar].map((v, j) => (
                  <div key={j} className="flex justify-center items-center">
                    {v
                      ? <Check className="w-4 h-4 text-lime" strokeWidth={2.5} />
                      : <X className="w-4 h-4 text-white/15" strokeWidth={2} />
                    }
                  </div>
                ))}
              </div>
            ))}
          </Motion.div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <Motion.div {...fade()} className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Témoignages</p>
            <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight">
              Ils ont arrêté le chaos.
            </h2>
          </Motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <Motion.div key={t.author} {...fade(i * 0.07)} className="cv-card p-6 flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-white/65 font-medium leading-relaxed flex-1">"{t.quote}"</p>
                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  <p className="text-sm font-bold text-white">{t.author}</p>
                  <p className="text-xs text-white/30 font-medium mt-0.5">{t.detail}</p>
                </div>
              </Motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ──────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <Motion.div {...fade()}>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Tarifs</p>
            <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight mb-4">
              Gratuit pour commencer.
            </h2>
            <p className="text-white/40 font-medium text-lg mb-8 max-w-md mx-auto">
              14 jours d'essai gratuit. Puis 3,99€/mois ou 39,99€/an.
            </p>
            <Link to="/pricing" className="cv-btn-dark px-8 py-4 text-base rounded-xl inline-flex items-center gap-2 justify-center">
              Voir les tarifs <ArrowRight className="w-4 h-4" />
            </Link>
          </Motion.div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <FaqSection />

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <Motion.div {...fade()}>
            <div className="cv-card-accent p-12 md:p-16 relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-7 h-7 text-accent" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight mb-4">
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

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.05] px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/90 flex items-center justify-center shadow-[0_0_14px_rgba(255,42,63,0.3)]">
              <span className="text-[10px] font-black text-white font-display">CV</span>
            </div>
            <div>
              <span className="text-sm font-bold font-display text-white">CarVault</span>
              <p className="text-[10px] text-white/25 font-medium">Le coffre-fort de votre automobile</p>
            </div>
          </div>

          <p className="text-xs text-white/20 font-medium order-last md:order-none">
            © {new Date().getFullYear()} CarVault
          </p>

          <div className="flex gap-6">
            <Link to="/login" className="text-xs text-white/30 hover:text-white/60 transition-colors font-medium">Connexion</Link>
            <Link to="/register" className="text-xs text-white/30 hover:text-white/60 transition-colors font-medium">Inscription</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
