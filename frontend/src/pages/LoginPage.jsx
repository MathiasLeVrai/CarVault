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
      <div className="hidden lg:flex lg:w-1/2 bg-[#09090b] relative overflow-hidden items-center justify-center p-16 border-r border-white/5">
        {/* Decorative shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-3xl bg-accent/20 blur-[80px]" />
        <div className="absolute bottom-16 right-16 w-40 h-40 rounded-full bg-violet/15 blur-[80px]" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-accent/10 blur-[60px]" />

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 mb-8 backdrop-blur-md">
            <span className="text-sm font-black text-accent font-display">CV</span>
            <span className="text-sm font-bold text-white/80">CarVault</span>
          </div>

          <h2 className="text-5xl font-black text-white leading-[1.05] mb-6 font-display tracking-tight">
            Votre garage,<br />
            <span className="text-accent">simplifié.</span>
          </h2>
          <p className="text-lg text-white/50 leading-relaxed">
            Documents, dépenses, alertes — tout dans un seul endroit.
          </p>

          {/* Feature cards */}
          <div className="flex gap-3 mt-10">
            {[
              { icon: Car, label: 'Véhicules', bg: 'bg-white/[0.03] border-white/10 text-white/80' },
              { icon: Wallet, label: 'Dépenses', bg: 'bg-white/[0.03] border-white/10 text-white/80' },
              { icon: Shield, label: 'Alertes', bg: 'bg-white/[0.03] border-white/10 text-white/80' },
            ].map(({ icon: Icon, label, bg }) => (
              <div key={label} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm ${bg} backdrop-blur-md`}>
                <Icon className="w-4 h-4 text-accent" strokeWidth={2} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 mesh-accent opacity-20 pointer-events-none" />
        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile brand */}
          <div className="lg:hidden mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <span className="text-sm font-black text-accent font-display">CV</span>
              <span className="text-sm font-bold text-white">CarVault</span>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white mb-2 font-display tracking-tight">Connexion</h2>
          <p className="text-ink-muted mb-8 font-medium">Accédez à votre espace</p>

          {error && (
            <div className="bg-accent/10 border border-accent/20 p-4 mb-6 rounded-xl backdrop-blur-md">
              <p className="text-sm font-semibold text-accent">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/80">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nom@exemple.com" className="cv-input w-full px-4 py-3.5 text-sm text-white bg-white/[0.02]" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/80">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className="cv-input w-full px-4 py-3.5 text-sm text-white bg-white/[0.02]" required />
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
