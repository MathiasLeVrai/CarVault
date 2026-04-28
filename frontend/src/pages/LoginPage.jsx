import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion as Motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';

const STATS = [
  { value: '2 400+', label: 'utilisateurs' },
  { value: '4.8★', label: 'satisfaction' },
  { value: '100%', label: 'sécurisé' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); }
    catch { setError('Email ou mot de passe incorrect.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-bg flex">
      <Helmet>
        <title>Connexion — Carvio</title>
        <meta name="description" content="Connectez-vous a votre compte Carvio pour gerer vos vehicules, documents et depenses." />
        <link rel="canonical" href="https://carvio.fr/login" />
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
            <span className="text-sm font-bold text-white/70">Carvio</span>
          </Motion.div>

          {/* Headline */}
          <Motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl font-black text-white leading-[1.15] mb-10 font-display tracking-tight"
          >
            Votre garage,<br />
            <span className="text-accent">simplifié.</span>
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
        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile brand */}
          <div className="lg:hidden mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/10">
              <span className="text-sm font-black text-accent font-display">CV</span>
              <span className="text-sm font-bold text-white">Carvio</span>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white mb-2 font-display tracking-tight">Connexion</h2>
          <p className="text-ink-muted mb-8 font-medium">Accédez à votre espace</p>

          {error && (
            <div className="bg-accent/10 border border-accent/20 p-4 mb-6 rounded-lg">
              <p className="text-sm font-semibold text-accent">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/80">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nom@exemple.com" className="cv-input w-full px-4 py-3.5 text-base text-ink" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-white/80">Mot de passe</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-ink-muted hover:text-accent transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className="cv-input w-full px-4 py-3.5 text-base text-ink" required />
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg" variant="accent">
              Se connecter <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-muted font-medium">
            Pas de compte ?{' '}
            <Link to="/register" className="font-bold text-white hover:text-accent transition-colors underline decoration-white/20 underline-offset-4">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
