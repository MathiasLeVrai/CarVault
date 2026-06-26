import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { CONTACT_EMAIL, LEGAL_LAST_UPDATED } from '../constants/legal';

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight text-ink mb-4">{title}</h2>
      <div className="space-y-3 text-sm md:text-[15px] leading-relaxed text-ink-muted">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="public-screen bg-bg text-ink overflow-x-hidden">
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
          <FileText className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-ink-muted">Conditions d&apos;utilisation</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-ink mb-3">
          Conditions générales d&apos;utilisation (EULA)
        </h1>
        <p className="text-sm text-ink-muted">
          Dernière mise à jour : {LEGAL_LAST_UPDATED}
        </p>
      </section>

      <main className="relative z-10 px-6 md:px-12 pb-24 max-w-3xl mx-auto space-y-10">
        <Section id="objet" title="1. Objet">
          <p>
            Les présentes conditions régissent l&apos;accès et l&apos;utilisation de l&apos;application
            Carvio (« l&apos;Application »), éditée par Carvio, accessible sur le web et sur iOS.
            En créant un compte ou en utilisant l&apos;Application, vous acceptez ces conditions.
          </p>
        </Section>

        <Section id="service" title="2. Description du service">
          <p>
            Carvio permet de centraliser les informations relatives à vos véhicules : documents,
            dépenses, entretiens, alertes et exports. Certaines fonctionnalités avancées sont
            réservées à l&apos;offre Premium.
          </p>
        </Section>

        <Section id="compte" title="3. Compte utilisateur">
          <p>
            Vous êtes responsable de la confidentialité de vos identifiants et de l&apos;activité
            réalisée depuis votre compte. Vous vous engagez à fournir des informations exactes
            et à ne pas utiliser le service à des fins illicites.
          </p>
        </Section>

        <Section id="premium" title="4. Abonnement Premium">
          <p>
            Carvio propose un abonnement auto-renouvelable « Premium » avec les formules mensuelle
            et annuelle. Les tarifs affichés dans l&apos;Application au moment de l&apos;achat
            s&apos;appliquent.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 marker:text-accent/70">
            <li><span className="text-ink font-medium">Essai gratuit :</span> lorsqu&apos;il est proposé, il démarre à la souscription et peut être annulé avant sa fin pour éviter tout prélèvement.</li>
            <li><span className="text-ink font-medium">Renouvellement :</span> l&apos;abonnement se renouvelle automatiquement à la fin de chaque période, sauf annulation au moins 24 heures avant l&apos;échéance.</li>
            <li><span className="text-ink font-medium">Paiement iOS :</span> sur l&apos;application iOS, l&apos;achat est traité par Apple via In-App Purchase. La facturation et la gestion de l&apos;abonnement s&apos;effectuent via votre compte Apple.</li>
            <li><span className="text-ink font-medium">Paiement web :</span> sur le site carvio.fr, le paiement peut être traité par notre prestataire Stripe selon les mêmes conditions d&apos;essai et de renouvellement affichées au moment de l&apos;achat.</li>
            <li><span className="text-ink font-medium">Annulation :</span> sur iOS, annulez depuis Réglages &gt; Apple ID &gt; Abonnements. Sur le web, utilisez votre espace de gestion d&apos;abonnement Stripe.</li>
          </ul>
        </Section>

        <Section id="contenu" title="5. Contenus et propriété">
          <p>
            Vous conservez la propriété des documents et données que vous importez. Vous nous accordez
            une licence limitée pour héberger et traiter ces données afin de fournir le service.
            L&apos;Application, sa marque, son design et son code restent la propriété de Carvio.
          </p>
        </Section>

        <Section id="disponibilite" title="6. Disponibilité">
          <p>
            Nous nous efforçons d&apos;assurer un service fiable, sans garantie d&apos;absence
            d&apos;interruption. Des opérations de maintenance ou des incidents techniques peuvent
            survenir.
          </p>
        </Section>

        <Section id="responsabilite" title="7. Responsabilité">
          <p>
            Carvio est un outil d&apos;organisation et de suivi. Il ne remplace pas les obligations
            légales du conducteur ni les conseils d&apos;un professionnel. Dans les limites prévues
            par la loi, notre responsabilité est limitée aux dommages directs prouvés.
          </p>
        </Section>

        <Section id="resiliation" title="8. Résiliation">
          <p>
            Vous pouvez supprimer votre compte à tout moment depuis les paramètres. Nous pouvons
            suspendre ou résilier un compte en cas de violation manifeste des présentes conditions.
          </p>
        </Section>

        <Section id="loi" title="9. Droit applicable">
          <p>
            Les présentes conditions sont soumises au droit français. En cas de litige, les tribunaux
            français seront compétents, sous réserve des règles impératives applicables aux
            consommateurs.
          </p>
        </Section>

        <Section id="contact" title="10. Contact">
          <p>
            Pour toute question :{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent font-semibold hover:underline">
              {CONTACT_EMAIL}
            </a>.
          </p>
          <p>
            Consultez aussi notre{' '}
            <Link to="/privacy" className="text-accent font-semibold hover:underline">
              politique de confidentialité
            </Link>.
          </p>
        </Section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.05] px-6 md:px-12 py-8">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-sm font-bold font-display text-white">Carvio</span>
          <p className="text-xs text-white/20 font-medium">© {new Date().getFullYear()} Carvio</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors font-medium">Confidentialité</Link>
            <Link to="/support" className="text-xs text-white/30 hover:text-white/60 transition-colors font-medium">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
