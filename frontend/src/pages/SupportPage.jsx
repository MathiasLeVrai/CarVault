import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, LifeBuoy, Mail, Clock } from 'lucide-react';

const CONTACT_EMAIL = 'contact@carvio.fr';
const RESPONSE_TIME = '48 heures ouvrées';

const FAQ_ITEMS = [
  {
    q: 'Comment contacter le support ?',
    a: `Écrivez-nous à ${CONTACT_EMAIL} en décrivant votre problème et, si possible, l’adresse e-mail de votre compte. Nous répondons sous ${RESPONSE_TIME}.`,
  },
  {
    q: 'J’ai oublié mon mot de passe',
    a: 'Utilisez la page « Mot de passe oublié » depuis l’écran de connexion. Vous recevrez un lien de réinitialisation par e-mail.',
  },
  {
    q: 'Comment annuler mon abonnement Premium ?',
    a: 'Depuis l’application, ouvrez Réglages → Abonnement pour accéder au portail de gestion Stripe. Vous pouvez annuler à tout moment ; l’accès Premium reste actif jusqu’à la fin de la période en cours.',
  },
  {
    q: 'Comment supprimer mon compte ?',
    a: 'Dans Réglages → Compte, vous pouvez supprimer définitivement votre compte et toutes vos données. Vous pouvez aussi en faire la demande par e-mail à contact@carvio.fr.',
  },
  {
    q: 'Un bug ou une suggestion ?',
    a: 'Les utilisateurs connectés peuvent envoyer un retour depuis Réglages. Sinon, contactez-nous directement par e-mail — nous lisons chaque message.',
  },
];

function Section({ title, children }) {
  return (
    <section className="scroll-mt-24">
      <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight text-ink mb-4">{title}</h2>
      <div className="space-y-3 text-sm md:text-[15px] leading-relaxed text-ink-muted">
        {children}
      </div>
    </section>
  );
}

export default function SupportPage() {
  return (
    <div className="public-screen bg-bg text-ink overflow-x-hidden">
      <Helmet>
        <title>Support — Carvio</title>
        <meta name="description" content="Besoin d'aide avec Carvio ? Contactez notre support, consultez la FAQ et retrouvez les reponses aux questions frequentes." />
        <link rel="canonical" href="https://carvio.fr/support" />
      </Helmet>

      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/[0.05]">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_20px_rgba(255,42,63,0.35)]">
            <span className="text-xs font-black text-white font-display">CV</span>
          </div>
          <span className="text-lg font-bold font-display tracking-tight">Carvio</span>
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

      <section className="relative z-10 px-6 md:px-12 pt-16 pb-8 md:pt-20 md:pb-10 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] mb-5">
          <LifeBuoy className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-ink-muted">Centre d'aide</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-ink mb-3">
          Support
        </h1>
        <p className="text-sm text-ink-muted">
          Une question, un problème technique ou une demande liée à votre compte ? Nous sommes là pour vous aider.
        </p>
      </section>

      <main className="relative z-10 px-6 md:px-12 pb-24 max-w-3xl mx-auto space-y-10">

        <Section title="Nous contacter">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-ink font-semibold mb-1">E-mail</p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent font-semibold hover:underline">{CONTACT_EMAIL}</a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-ink font-semibold mb-1">Délai de réponse</p>
                <p>Sous {RESPONSE_TIME} en moyenne.</p>
              </div>
            </div>
          </div>
          <p>
            Pour aller plus vite, précisez votre adresse e-mail Carvio, le modèle de votre appareil
            et une capture d'écran si le problème est visuel.
          </p>
        </Section>

        <Section title="Questions fréquentes">
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-sm font-bold text-ink font-display mb-2">{item.q}</h3>
                <p>{item.a}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Autres ressources">
          <ul className="list-disc pl-5 space-y-1.5 marker:text-accent/70">
            <li>
              <Link to="/#faq" className="text-accent font-semibold hover:underline">FAQ produit</Link>
              {' '}— contrôle technique, carte grise, entretien…
            </li>
            <li>
              <Link to="/privacy" className="text-accent font-semibold hover:underline">Politique de confidentialité</Link>
            </li>
            <li>
              <Link to="/forgot-password" className="text-accent font-semibold hover:underline">Mot de passe oublié</Link>
            </li>
            <li>
              <Link to="/pricing" className="text-accent font-semibold hover:underline">Tarifs et abonnement Premium</Link>
            </li>
          </ul>
        </Section>

      </main>

      <footer className="relative z-10 border-t border-white/[0.05] px-6 md:px-12 py-8">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/90 flex items-center justify-center shadow-[0_0_14px_rgba(255,42,63,0.3)]">
              <span className="text-[10px] font-black text-white font-display">CV</span>
            </div>
            <span className="text-sm font-bold font-display text-white">Carvio</span>
          </div>
          <p className="text-xs text-white/20 font-medium">
            © {new Date().getFullYear()} Carvio
          </p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors font-medium">Confidentialité</Link>
            <Link to="/" className="text-xs text-white/30 hover:text-white/60 transition-colors font-medium">Accueil</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
