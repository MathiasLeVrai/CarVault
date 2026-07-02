import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { showPremiumUi } from '../utils/platform';

const CONTACT_EMAIL = 'contact@carvio.fr';
const LAST_UPDATED = '25 juin 2026';

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

export default function PrivacyPage() {
  const premiumUi = showPremiumUi();

  return (
    <div className="public-screen bg-bg text-ink overflow-x-hidden">
      {/* Navbar */}
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

      {/* Hero */}
      <section className="relative z-10 px-6 md:px-12 pt-16 pb-8 md:pt-20 md:pb-10 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] mb-5">
          <Shield className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-ink-muted">Vos données vous appartiennent</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-ink mb-3">
          Politique de confidentialité
        </h1>
        <p className="text-sm text-ink-muted">
          Dernière mise à jour : {LAST_UPDATED}
        </p>
      </section>

      {/* Content */}
      <main className="relative z-10 px-6 md:px-12 pb-24 max-w-3xl mx-auto space-y-10">

        <Section id="intro" title="1. Qui sommes-nous ?">
          <p>
            Carvio (« nous », « l'application ») est un service de gestion de l'historique
            automobile permettant de centraliser les véhicules, documents, dépenses, entretiens
            et alertes de leurs propriétaires. La présente politique explique quelles données
            personnelles nous collectons, pourquoi, et quels sont vos droits, conformément au
            Règlement Général sur la Protection des Données (RGPD).
          </p>
          <p>
            Le responsable du traitement peut être contacté à l'adresse{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent font-semibold hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section id="data" title="2. Données que nous collectons">
          <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
          <ul className="list-disc pl-5 space-y-1.5 marker:text-accent/70">
            <li><span className="text-ink font-medium">Compte&nbsp;:</span> adresse e-mail et mot de passe (chiffré, jamais stocké en clair).</li>
            <li><span className="text-ink font-medium">Véhicules&nbsp;:</span> marque, modèle, immatriculation, kilométrage et caractéristiques que vous saisissez.</li>
            <li><span className="text-ink font-medium">Documents&nbsp;:</span> fichiers que vous téléversez (carte grise, assurance, contrôle technique, factures, photos).</li>
            <li><span className="text-ink font-medium">Suivi&nbsp;:</span> dépenses, pleins de carburant, entretiens et alertes que vous enregistrez.</li>
            {premiumUi && (
              <li><span className="text-ink font-medium">Paiement&nbsp;:</span> en cas d'abonnement Premium, les données de paiement sont traitées directement par notre prestataire de paiement sécurisé — nous ne stockons jamais votre numéro de carte.</li>
            )}
            <li><span className="text-ink font-medium">Localisation&nbsp;:</span> si vous utilisez la carte, votre position est utilisée localement pour afficher les points d'intérêt proches. Elle n'est ni stockée ni transmise à nos serveurs.</li>
            <li><span className="text-ink font-medium">Données techniques&nbsp;:</span> informations strictement nécessaires à la sécurité et au bon fonctionnement (journaux d'erreurs, type d'appareil).</li>
          </ul>
        </Section>

        <Section id="usage" title="3. Comment nous utilisons vos données">
          <ul className="list-disc pl-5 space-y-1.5 marker:text-accent/70">
            <li>Fournir et maintenir le service (afficher vos véhicules, documents et historiques).</li>
            <li>Vous envoyer des alertes et rappels d'échéance (contrôle technique, assurance…).</li>
            {premiumUi && <li>Gérer votre abonnement et les paiements.</li>}
            <li>Sécuriser votre compte et prévenir la fraude.</li>
            <li>Répondre à vos demandes de support.</li>
          </ul>
          <p>
            Nous ne vendons ni ne louons vos données personnelles à des tiers, et nous ne les
            utilisons pas à des fins publicitaires.
          </p>
        </Section>

        <Section id="legal" title="4. Bases légales">
          <p>Nos traitements reposent sur :</p>
          <ul className="list-disc pl-5 space-y-1.5 marker:text-accent/70">
            <li><span className="text-ink font-medium">L'exécution du contrat</span> — fournir le service que vous avez demandé.</li>
            <li><span className="text-ink font-medium">Votre consentement</span> — pour l'accès à la localisation.</li>
            <li><span className="text-ink font-medium">Notre intérêt légitime</span> — sécurité et amélioration du service.</li>
            <li><span className="text-ink font-medium">Une obligation légale</span> — conservation des données de facturation.</li>
          </ul>
        </Section>

        <Section id="sharing" title="5. Partage avec des tiers">
          <p>
            Vos données peuvent être traitées par des sous-traitants techniques, uniquement pour
            faire fonctionner le service :
          </p>
          <ul className="list-disc pl-5 space-y-1.5 marker:text-accent/70">
            {premiumUi && (
              <li><span className="text-ink font-medium">Notre prestataire de paiement</span> — traitement sécurisé des transactions et abonnements.</li>
            )}
            <li><span className="text-ink font-medium">Notre hébergeur</span> — hébergement de l'application, de la base de données et stockage des fichiers que vous téléversez.</li>
            <li><span className="text-ink font-medium">Services cartographiques tiers</span> — affichage des points d'intérêt et des prix des carburants sur la carte (aucune donnée personnelle ne leur est transmise).</li>
          </ul>
          <p>
            Ces prestataires sont tenus de garantir un niveau de protection conforme au RGPD.
          </p>
        </Section>

        <Section id="retention" title="6. Conservation des données">
          <p>
            Vos données sont conservées tant que votre compte est actif. Si vous supprimez votre
            compte, l'ensemble de vos données personnelles et de vos fichiers sont définitivement
            effacés, à l'exception des données que la loi nous oblige à conserver (par exemple les
            factures, conservées pour la durée légale).
          </p>
        </Section>

        <Section id="rights" title="7. Vos droits">
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-5 space-y-1.5 marker:text-accent/70">
            <li>Droit d'accès à vos données.</li>
            <li>Droit de rectification.</li>
            <li>Droit à l'effacement (« droit à l'oubli »).</li>
            <li>Droit à la portabilité de vos données.</li>
            <li>Droit d'opposition et de limitation du traitement.</li>
          </ul>
          <p>
            Pour exercer ces droits, écrivez-nous à{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent font-semibold hover:underline">{CONTACT_EMAIL}</a>.
            Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).
          </p>
        </Section>

        <Section id="deletion" title="8. Suppression du compte">
          <p>
            Vous pouvez supprimer votre compte à tout moment depuis l'application, dans
            <span className="text-ink font-medium"> Réglages → Compte</span>. La suppression entraîne
            l'effacement définitif de vos véhicules, documents et historiques. Vous pouvez aussi en
            faire la demande par e-mail à{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent font-semibold hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section id="security" title="9. Sécurité">
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
            protéger vos données : chiffrement des mots de passe, transmission via HTTPS,
            authentification requise pour tout accès à vos documents, et accès restreint aux
            serveurs.
          </p>
        </Section>

        <Section id="children" title="10. Mineurs">
          <p>
            Carvio n'est pas destiné aux personnes de moins de 16 ans. Nous ne collectons pas
            sciemment de données concernant des mineurs.
          </p>
        </Section>

        <Section id="changes" title="11. Modifications">
          <p>
            Nous pouvons mettre à jour la présente politique. En cas de modification importante,
            nous vous en informerons via l'application ou par e-mail. La date de dernière mise à
            jour figure en haut de cette page.
          </p>
        </Section>

        <Section id="contact" title="12. Contact">
          <p>
            Pour toute question relative à vos données personnelles, contactez-nous à{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent font-semibold hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

      </main>

      {/* Footer */}
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
          <Link to="/" className="text-xs text-white/30 hover:text-white/60 transition-colors font-medium">
            Retour à l'accueil
          </Link>
        </div>
      </footer>
    </div>
  );
}
