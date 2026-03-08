import { useEffect, useState } from 'react';
import { notificationApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import usePush from '../hooks/usePush';
import Button from '../components/ui/Button';
import {
  Bell, Mail, Smartphone, Calendar, Check, Settings, Sun, Moon, LogOut, Globe,
} from 'lucide-react';
import useI18n from '../i18n/useI18n';
import { motion as Motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 20 } },
};

function Toggle({ checked, onChange, label, description, icon, color = 'accent' }) {
  const IconComponent = icon;
  return (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl bg-${color}/10 border border-${color}/20 flex items-center justify-center shrink-0`}>
          <IconComponent className={`w-5 h-5 text-${color}`} strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-bold text-ink font-display">{label}</p>
          <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ml-4 ${
          checked ? 'bg-lime' : 'bg-white/10'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user: _user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const push = usePush();
  const { lang, setLang } = useI18n();
  const [prefs, setPrefs] = useState({ notifEmail: true, notifPush: false, notifWeekly: true });
  const [loading, setLoading] = useState(true);
  const [_saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    notificationApi.getPreferences()
      .then(setPrefs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updatePref = async (key, value) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    try {
      await notificationApi.updatePreferences({ [key]: value });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-white/10 border-t-accent animate-spin" />
      </div>
    </div>
  );

  return (
    <Motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 md:space-y-10 max-w-2xl"
    >
      <Motion.div variants={itemVariants}>
        <p className="text-[11px] font-bold text-accent uppercase tracking-[0.15em] mb-2">Paramètres</p>
        <h1 className="text-3xl md:text-4xl font-black text-ink font-display tracking-tight">
          Compte
        </h1>
      </Motion.div>

      {/* Apparence */}
      <Motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-violet/10 flex items-center justify-center">
            {theme === 'dark'
              ? <Moon className="w-3.5 h-3.5 text-violet" strokeWidth={2.5} />
              : <Sun className="w-3.5 h-3.5 text-violet" strokeWidth={2.5} />
            }
          </div>
          <h2 className="text-sm font-bold text-ink font-display tracking-tight">Apparence</h2>
        </div>

        <div className="flex items-center justify-between p-5 rounded-2xl cv-card">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet/10 border border-violet/20 flex items-center justify-center shrink-0">
              {theme === 'dark'
                ? <Moon className="w-5 h-5 text-violet" strokeWidth={2} />
                : <Sun className="w-5 h-5 text-violet" strokeWidth={2} />
              }
            </div>
            <div>
              <p className="text-sm font-bold text-ink font-display">
                {theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                {theme === 'dark' ? 'Interface sombre — recommandé la nuit.' : 'Interface claire — recommandé le jour.'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ml-4 ${
              theme === 'light' ? 'bg-violet' : 'bg-white/10'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${
                theme === 'light' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Motion.div>

      {/* Langue */}
      <Motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-sky/10 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-sky" strokeWidth={2.5} />
          </div>
          <h2 className="text-sm font-bold text-ink font-display tracking-tight">Langue</h2>
        </div>
        <div className="flex gap-3">
          {[{ code: 'fr', label: 'Français', flag: '🇫🇷' }, { code: 'en', label: 'English', flag: '🇬🇧' }].map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                lang === l.code
                  ? 'bg-accent/10 border-accent/30 text-white'
                  : 'bg-white/[0.02] border-white/5 text-ink-muted hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-xl">{l.flag}</span>
              <span className="text-sm font-bold">{l.label}</span>
              {lang === l.code && <Check className="w-4 h-4 text-accent ml-auto" />}
            </button>
          ))}
        </div>
      </Motion.div>

      {/* Notifications title */}
      <Motion.div variants={itemVariants}>
        <p className="text-ink-muted text-sm font-medium">
          Choisissez comment et quand recevoir vos rappels.
        </p>
      </Motion.div>

      {/* Notification channels */}
      <Motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
          </div>
          <h2 className="text-sm font-bold text-white font-display tracking-tight">Canaux</h2>
        </div>

        <Toggle
          icon={Mail}
          color="sky"
          label="Alertes par email"
          description="Recevez un email lors de chaque alerte importante (expiration, entretien)."
          checked={prefs.notifEmail}
          onChange={v => updatePref('notifEmail', v)}
        />
        {push.supported && (
          <Toggle
            icon={Smartphone}
            color="violet"
            label="Notifications push"
            description={push.subscribed ? 'Activées — vous recevrez les alertes sur cet appareil.' : 'Recevez les alertes directement sur votre écran.'}
            checked={push.subscribed}
            onChange={async (v) => {
              if (v) {
                const ok = await push.subscribe();
                if (ok) updatePref('notifPush', true);
              } else {
                await push.unsubscribe();
                updatePref('notifPush', false);
              }
            }}
          />
        )}
      </Motion.div>

      {/* Frequency */}
      <Motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-lime/10 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-lime" strokeWidth={2.5} />
          </div>
          <h2 className="text-sm font-bold text-white font-display tracking-tight">Fréquence</h2>
        </div>

        <Toggle
          icon={Calendar}
          color="lime"
          label="Résumé hebdomadaire"
          description="Un email récapitulatif chaque lundi avec vos prochaines échéances."
          checked={prefs.notifWeekly}
          onChange={v => updatePref('notifWeekly', v)}
        />
      </Motion.div>

      {/* Anti-spam note */}
      <Motion.div variants={itemVariants} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-ink-muted shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-ink font-display">Politique anti-spam</p>
            <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
              CarVault limite les notifications à 1 alerte par document par palier (J-30, J-7, J-1).
              Vous pouvez aussi reporter (snooze) chaque alerte individuellement depuis la page Alertes.
              Pas de spam, promis.
            </p>
          </div>
        </div>
      </Motion.div>

      {/* Déconnexion */}
      <Motion.div variants={itemVariants}>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full p-5 rounded-2xl cv-btn-danger text-sm font-bold transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Se déconnecter
        </button>
      </Motion.div>

      {/* Save feedback */}
      {saved && (
        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-lime text-sm font-bold"
        >
          <Check className="w-4 h-4" /> Préférences sauvegardées
        </Motion.div>
      )}
    </Motion.div>
  );
}
