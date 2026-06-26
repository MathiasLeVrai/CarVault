import {
  getPrivacyUrl,
  getTermsUrl,
  IOS_SUBSCRIPTION_DISCLOSURE,
} from '../constants/legal';
import { mustUseAppleIap } from '../services/purchases';

export default function SubscriptionLegalLinks({
  showAppleDisclosure = mustUseAppleIap(),
  className = 'text-center text-[11px] text-white/40 mt-4 leading-relaxed',
  linkClassName = 'text-white/70 hover:text-white underline underline-offset-2',
}) {
  return (
    <div className={className}>
      {showAppleDisclosure && (
        <p className="mb-3 text-white/50">{IOS_SUBSCRIPTION_DISCLOSURE}</p>
      )}
      <p>
        <a href={getPrivacyUrl()} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          Politique de confidentialité
        </a>
        {' · '}
        <a href={getTermsUrl()} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          Conditions d&apos;utilisation (EULA)
        </a>
      </p>
    </div>
  );
}
