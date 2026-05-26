import { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Link2, Copy, Check, ExternalLink, FileDown, Lock, Eye, Calendar,
  EyeOff, Trash2, ArrowLeft, ShieldCheck,
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { downloadPdfFromUrl, getApiUrl, getPublicAppUrl, shareApi } from '../../services/api';

const DURATION_OPTS = [
  { value: '7', label: '7 jours' },
  { value: '30', label: '30 jours' },
  { value: '90', label: '90 jours' },
  { value: '0', label: 'Sans expiration' },
];

const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');
const formatDateTime = (d) => `${new Date(d).toLocaleDateString('fr-FR')} ${new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

export default function ShareModal({ isOpen, onClose, vehicleId, vehicleName }) {
  const [step, setStep] = useState('settings');
  const [creating, setCreating] = useState(false);
  const [currentLink, setCurrentLink] = useState(null);
  const [allLinks, setAllLinks] = useState([]);
  const [copied, setCopied] = useState(false);

  const [settings, setSettings] = useState({
    expiresInDays: '30',
    label: '',
    password: '',
    hidePurchasePrice: false,
  });

  const refreshLinks = useCallback(async () => {
    try {
      const links = await shareApi.getLinks(vehicleId);
      setAllLinks(links);
    } catch { /* ignore */ }
  }, [vehicleId]);

  useEffect(() => {
    if (!isOpen) return;
    setStep('settings');
    setCurrentLink(null);
    setCopied(false);
    refreshLinks();
  }, [isOpen, refreshLinks]);

  const handleCreate = async (e) => {
    e?.preventDefault();
    setCreating(true);
    try {
      const link = await shareApi.create(vehicleId, {
        expiresInDays: Number(settings.expiresInDays) || 0,
        label: settings.label.trim() || undefined,
        password: settings.password || undefined,
        hidePurchasePrice: settings.hidePurchasePrice,
      });
      setCurrentLink(link);
      setStep('created');
      refreshLinks();
    } catch (e) {
      console.error('Share create error:', e);
    } finally {
      setCreating(false);
    }
  };

  const buildUrl = (token) => getPublicAppUrl(`/share/${token}`);

  const copyUrl = (token) => {
    navigator.clipboard.writeText(buildUrl(token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPdf = async (token, e) => {
    e.preventDefault();
    await downloadPdfFromUrl(getApiUrl(`/share/${token}/pdf`), 'Carvio_Dossier.pdf');
  };

  const revokeLink = async (id) => {
    if (!confirm('Révoquer ce lien définitivement ?')) return;
    try {
      await shareApi.revoke(id);
      if (currentLink?.id === id) {
        setCurrentLink(null);
        setStep('settings');
      }
      refreshLinks();
    } catch (e) {
      console.error('Revoke error:', e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={step === 'settings' ? 'Partager le dossier' : 'Lien créé'}>
      {step === 'settings' && (
        <form onSubmit={handleCreate} className="space-y-5">
          <p className="text-sm text-ink-muted">
            Créez un lien en lecture seule pour partager le dossier de votre {vehicleName} avec un acheteur ou un garage.
          </p>

          <Select
            label="Durée de validité"
            value={settings.expiresInDays}
            onChange={(e) => setSettings(s => ({ ...s, expiresInDays: e.target.value }))}
            options={DURATION_OPTS}
          />

          <Input
            label="Libellé (optionnel)"
            placeholder="ex: Concessionnaire Renault"
            value={settings.label}
            onChange={(e) => setSettings(s => ({ ...s, label: e.target.value }))}
          />

          <Input
            label="Mot de passe (optionnel)"
            type="text"
            placeholder="Le destinataire devra le saisir"
            value={settings.password}
            onChange={(e) => setSettings(s => ({ ...s, password: e.target.value }))}
          />

          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input
              type="checkbox"
              checked={settings.hidePurchasePrice}
              onChange={(e) => setSettings(s => ({ ...s, hidePurchasePrice: e.target.checked }))}
              className="w-4 h-4 accent-accent"
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <EyeOff className="w-3.5 h-3.5 text-accent" />
                Masquer le prix d'achat
              </p>
              <p className="text-[11px] text-ink-muted">Utile en négociation</p>
            </div>
          </label>

          {allLinks.length > 0 && (
            <div className="pt-3 border-t border-white/5">
              <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2">
                Liens actifs ({allLinks.length})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allLinks.map(link => (
                  <ShareLinkRow
                    key={link.id}
                    link={link}
                    onCopy={() => copyUrl(link.token)}
                    onRevoke={() => revokeLink(link.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button variant="ghost" type="button" onClick={onClose}>Fermer</Button>
            <Button type="submit" loading={creating} variant="accent">
              <Link2 className="w-4 h-4" /> Créer le lien
            </Button>
          </div>
        </form>
      )}

      {step === 'created' && currentLink && (
        <div className="space-y-5">
          <button
            onClick={() => setStep('settings')}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour aux paramètres
          </button>

          {currentLink.hasPassword && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-lime/10 border border-lime/20">
              <ShieldCheck className="w-4 h-4 text-lime mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Protégé par mot de passe</p>
                <p className="text-[11px] text-ink-muted">Pensez à le transmettre séparément.</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="bg-white p-3 rounded-xl shrink-0">
              <QRCodeSVG value={buildUrl(currentLink.token)} size={128} level="M" />
            </div>
            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <Link2 className="w-4 h-4 text-accent shrink-0" />
                <span className="text-xs font-mono text-white/70 truncate flex-1">
                  {buildUrl(currentLink.token)}
                </span>
                <button
                  type="button"
                  onClick={() => copyUrl(currentLink.token)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-accent/20 text-white/60 hover:text-accent transition-colors shrink-0"
                  aria-label="Copier"
                >
                  {copied ? <Check className="w-4 h-4 text-lime" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {currentLink.expiresAt && (
                <p className="text-[11px] text-ink-muted flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Expire le {formatDate(currentLink.expiresAt)}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <a href={buildUrl(currentLink.token)} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" className="w-full border-white/20 text-white">
                <ExternalLink className="w-4 h-4" /> Aperçu
              </Button>
            </a>
            <a href={getApiUrl(`/share/${currentLink.token}/pdf`)} onClick={(e) => downloadPdf(currentLink.token, e)} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" className="w-full border-white/20 text-white">
                <FileDown className="w-4 h-4" /> PDF
              </Button>
            </a>
          </div>

          <button
            type="button"
            onClick={() => revokeLink(currentLink.id)}
            className="text-xs font-bold text-accent/70 hover:text-accent transition-colors"
          >
            Révoquer ce lien
          </button>
        </div>
      )}
    </Modal>
  );
}

function ShareLinkRow({ link, onCopy, onRevoke }) {
  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs font-bold text-white truncate">
            {link.label || `Lien #${link.token.slice(0, 6)}`}
          </p>
          {link.hasPassword && <Lock className="w-3 h-3 text-accent shrink-0" />}
          {isExpired && <span className="text-[9px] font-bold text-red-400 uppercase">Expiré</span>}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-ink-muted">
          <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> {link.viewCount} vues</span>
          {link.lastViewedAt && <span>· vu {formatDateTime(link.lastViewedAt)}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="p-1.5 rounded-md text-ink-muted hover:text-accent transition-colors"
        aria-label="Copier"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onRevoke}
        className="p-1.5 rounded-md text-ink-muted hover:text-red-400 transition-colors"
        aria-label="Révoquer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
