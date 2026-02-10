import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Car, Shield, Wallet } from 'lucide-react';
import Button from '../components/ui/Button';

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
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left — Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0c0c0e] relative overflow-hidden items-center justify-center p-16">
        {/* Decorative shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-3xl bg-accent/20 blur-3xl" />
        <div className="absolute bottom-16 right-16 w-40 h-40 rounded-full bg-accent-warm/15 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-accent/10 blur-2xl" />

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/15 border border-accent/25 mb-8">
            <span className="text-sm font-black text-accent font-display">CV</span>
            <span className="text-sm font-bold text-white/80">CarVault</span>
          </div>

          <h2 className="text-5xl font-black text-white leading-[1.05] mb-6 font-display">
            Votre garage,<br />
            <span className="text-accent">simplifié.</span>
          </h2>
          <p className="text-lg text-white/50 leading-relaxed">
            Documents, dépenses, alertes — tout dans un seul endroit.
          </p>

          {/* Feature cards */}
          <div className="flex gap-3 mt-10">
            {[
              { icon: Car, label: 'Véhicules', bg: 'bg-accent/15 border-accent/25 text-accent' },
              { icon: Wallet, label: 'Dépenses', bg: 'bg-accent-warm/15 border-accent-warm/25 text-accent-warm' },
              { icon: Shield, label: 'Alertes', bg: 'bg-violet/15 border-violet/25 text-violet-light' },
            ].map(({ icon: Icon, label, bg }) => (
              <div key={label} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm ${bg}`}>
                <Icon className="w-4 h-4" strokeWidth={2} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="lg:hidden mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-accent/20">
              <span className="text-sm font-black text-accent font-display">CV</span>
              <span className="text-sm font-bold text-ink">CarVault</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-ink mb-1 font-display">Connexion</h2>
          <p className="text-ink-light mb-8">Accédez à votre espace</p>

          {error && (
            <div className="cv-card-flat bg-accent/8 border-accent/20 p-4 mb-6 rounded-xl">
              <p className="text-sm font-semibold text-accent">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nom@exemple.com" className="cv-input w-full px-4 py-3 text-sm text-ink" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className="cv-input w-full px-4 py-3 text-sm text-ink" required />
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Se connecter <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-light">
            Pas de compte ?{' '}
            <Link to="/register" className="font-bold text-accent hover:text-accent-light transition-colors underline decoration-1 underline-offset-2">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
