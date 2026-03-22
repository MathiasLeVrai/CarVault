import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion as Motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';

const STATS = [
  { value: '100%', label: 'gratuit' },
  { value: '< 2 min', label: 'pour démarrer' },
  { value: '0 oubli', label: "d'échéance" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) return setError('Les mots de passe ne correspondent pas');
    if (form.password.length < 6) return setError('Min. 6 caractères');
    setLoading(true);
    try { await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-bg flex">
      <Helmet>
        <title>Inscription — CarVault</title>
        <meta name="description" content="Creez votre compte CarVault gratuitement et commencez a gerer votre vehicule en quelques secondes." />
        <link rel="canonical" href="https://carvault.fly.dev/register" />
      </Helmet>
      {/* Left — Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-bg-alt relative overflow-hidden items-center justify-center p-16 border-r border-white/5">
        <div className="relative z-10 max-w-md w-full">
          {/* Brand */}
          <Motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/10 mb-10"
          >
            <span className="text-sm font-black text-accent font-display">CV</span>
            <span className="text-sm font-bold text-white/70">CarVault</span>
          </Motion.div>

          {/* Headline */}
          <Motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl font-black text-white leading-[1.15] mb-10 font-display tracking-tight"
          >
            Votre garage,<br />
            <span className="text-accent-warm">digitalisé.</span>
          </Motion.h2>

          {/* Divider */}
          <Motion.div
            className="cv-divider mb-10"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Stats */}
          <div className="flex gap-10">
            {STATS.map((s, i) => (
              <Motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-2xl font-black text-white font-display tabular-nums">{s.value}</p>
                <p className="text-xs text-white/40 font-medium mt-1">{s.label}</p>
              </Motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-[420px] relative z-10">
          {/* Mobile brand */}
          <div className="lg:hidden mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/10">
              <span className="text-sm font-black text-accent font-display">CV</span>
              <span className="text-sm font-bold text-white">CarVault</span>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white mb-2 font-display tracking-tight">Créer un compte</h2>
          <p className="text-ink-muted mb-8 font-medium">Gratuit et sans engagement</p>

          {error && (
            <div className="bg-accent/10 border border-accent/20 p-4 mb-6 rounded-lg">
              <p className="text-sm font-semibold text-accent">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/80">Prénom</label>
                <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
                  placeholder="Jean" className="cv-input w-full px-4 py-3 text-base text-ink" required />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/80">Nom</label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
                  placeholder="Dupont" className="cv-input w-full px-4 py-3 text-base text-ink" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/80">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="nom@exemple.com" className="cv-input w-full px-4 py-3 text-base text-ink" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/80">Mot de passe</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="Min. 6 caractères" className="cv-input w-full px-4 py-3 text-base text-ink" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/80">Confirmer</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                placeholder="••••••••" className="cv-input w-full px-4 py-3 text-base text-ink" required />
            </div>
            <Button type="submit" loading={loading} className="w-full mt-2" size="lg" variant="accent">
              Créer mon compte <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-muted font-medium">
            Déjà un compte ?{' '}
            <Link to="/login" className="font-bold text-white hover:text-accent transition-colors underline decoration-white/20 underline-offset-4">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
