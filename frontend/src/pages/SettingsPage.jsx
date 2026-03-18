import { useEffect, useRef, useState } from 'react';
import { notificationApi, pushApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import usePush from '../hooks/usePush';
import BadgesWidget from '../components/BadgesWidget';
import {
  Bell, Mail, Smartphone, Calendar, Check, Settings, Sun, Moon, LogOut, Globe,
  Camera, Pencil, Crown, User as UserIcon, Send,
} from 'lucide-react';
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
    <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-[background,border-color]">
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

function Avatar({ user, size = 80 }) {
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt="avatar"
        className="rounded-full object-cover border-2 border-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const isPremium = user?.isPremium;
  return (
    <div
      className="rounded-full flex items-center justify-center border-2 border-white/10 shrink-0"
      style={{
        width: size,
        height: size,
        background: isPremium
          ? 'linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(124,92,252,0.25) 100%)'
          : 'linear-gradient(135deg, rgba(255,42,63,0.18) 0%, rgba(124,92,252,0.18) 100%)',
        border: isPremium ? '2px solid rgba(245,158,11,0.4)' : '2px solid var(--color-ink-faint)',
      }}
    >
      {isPremium
        ? <Crown size={size * 0.38} style={{ color: '#f59e0b' }} strokeWidth={1.8} />
        : <span className="font-black text-white font-display" style={{ fontSize: size * 0.32 }}>{initials}</span>
      }
    </div>
  );
}

function ProfileCard({ user, updateProfile, onSaved }) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await updateProfile(fd);
      onSaved();
    } catch { /* ignore */ }
    finally { setUploading(false); }
  };

  const handleSaveName = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      if (form.firstName.trim()) fd.append('firstName', form.firstName.trim());
      if (form.lastName.trim()) fd.append('lastName', form.lastName.trim());
      await updateProfile(fd);
      setEditing(false);
      onSaved();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="cv-card p-6">
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar user={user} size={80} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30 transition-transform active:scale-[0.96]"
          >
            <Camera className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  placeholder="Prénom"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-accent/50"
                />
                <input
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  placeholder="Nom"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-accent/50"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-accent text-white text-xs font-bold transition-opacity disabled:opacity-60"
                >
                  {saving ? 'Sauvegarde…' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => { setEditing(false); setForm({ firstName: user?.firstName || '', lastName: user?.lastName || '' }); }}
                  className="flex-1 py-2 rounded-xl bg-white/5 text-white/60 text-xs font-bold"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="min-w-0">
                <h2 className="text-base font-black text-white font-display truncate">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="shrink-0 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors ml-auto"
              >
                <Pencil className="w-3.5 h-3.5 text-white/50" />
              </button>
            </div>
          )}

          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {user?.isPremium ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
                <Crown className="w-3 h-3" /> Premium
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black bg-white/5 text-white/40 border border-white/8">
                <UserIcon className="w-3 h-3" /> Free
              </span>
            )}
            {user?._count?.vehicles != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/5 text-white/50 border border-white/8">
                {user._count.vehicles} véhicule{user._count.vehicles !== 1 ? 's' : ''}
              </span>
            )}
            {memberSince && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/5 text-white/40 border border-white/8">
                Membre depuis {memberSince}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const push = usePush();
  const [prefs, setPrefs] = useState({ notifEmail: true, notifPush: false, notifWeekly: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testPush, setTestPush] = useState({ loading: false, result: null });

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

  const handleProfileSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
          Mon profil
        </h1>
      </Motion.div>

      {/* Profile card */}
      <Motion.div variants={itemVariants}>
        <ProfileCard user={user} updateProfile={updateProfile} onSaved={handleProfileSaved} />
      </Motion.div>

      {/* Badges */}
      <Motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-amber-400/10 flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 text-amber-400" strokeWidth={2.5} />
          </div>
          <h2 className="text-sm font-bold text-ink font-display tracking-tight">Mes badges</h2>
        </div>
        <BadgesWidget />
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

      {/* Langue (désactivée pour l'instant, app en français uniquement) */}

      {/* Notifications */}
      <Motion.div variants={itemVariants}>
        <p className="text-ink-muted text-sm font-medium">
          Choisissez comment et quand recevoir vos rappels.
        </p>
      </Motion.div>

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
          <>
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
            {push.subscribed && (
              <button
                onClick={async () => {
                  setTestPush({ loading: true, result: null });
                  try {
                    await pushApi.test();
                    setTestPush({ loading: false, result: 'success' });
                  } catch (err) {
                    setTestPush({ loading: false, result: err.message });
                  }
                  setTimeout(() => setTestPush({ loading: false, result: null }), 4000);
                }}
                disabled={testPush.loading}
                className="flex items-center justify-center gap-2.5 w-full p-4 rounded-2xl bg-violet/10 border border-violet/20 text-violet text-sm font-bold transition-all hover:bg-violet/15 active:scale-[0.98] disabled:opacity-60"
              >
                {testPush.loading ? (
                  <><div className="w-4 h-4 border-2 border-violet/30 border-t-violet rounded-full animate-spin" /> Envoi en cours…</>
                ) : testPush.result === 'success' ? (
                  <><Check className="w-4 h-4" /> Notification envoyée !</>
                ) : testPush.result ? (
                  <span className="text-accent">{testPush.result}</span>
                ) : (
                  <><Send className="w-4 h-4" /> Tester les notifications push</>
                )}
              </button>
            )}
          </>
        )}
      </Motion.div>

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
      {(saved || saving) && (
        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-lime text-sm font-bold"
        >
          {saving
            ? <><div className="w-4 h-4 border-2 border-lime/30 border-t-lime rounded-full animate-spin" /> Sauvegarde…</>
            : <><Check className="w-4 h-4" /> Profil mis à jour</>
          }
        </Motion.div>
      )}
    </Motion.div>
  );
}
