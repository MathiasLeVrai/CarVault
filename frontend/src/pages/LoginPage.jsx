import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';
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
      <div className="hidden lg:flex lg:w-1/2 bg-bg-dark border-r-2 border-ink relative overflow-hidden items-center justify-center p-16">
        {/* Decorative shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-3xl bg-lime border-2 border-ink shadow-[6px_6px_0_#b9ff66] rotate-12" />
        <div className="absolute bottom-16 right-16 w-24 h-24 rounded-full bg-orange border-2 border-ink shadow-[4px_4px_0_#ff6b35] -rotate-12" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-2xl bg-violet border-2 border-ink shadow-[4px_4px_0_#7c5cfc] rotate-6" />

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime border-2 border-ink shadow-[3px_3px_0_#1a1a1a] mb-8">
            <span className="text-sm font-black text-ink">CV</span>
            <span className="text-sm font-bold text-ink">CarVault</span>
          </div>

          <h2 className="text-5xl font-black text-white leading-[1.05] mb-6">
            Votre garage,<br />
            <span className="text-lime">simplifié.</span>
          </h2>
          <p className="text-lg text-white/60 leading-relaxed">
            Documents, dépenses, alertes — tout dans un seul endroit.
          </p>

          {/* Feature cards */}
          <div className="flex gap-3 mt-10">
            {['Documents', 'Dépenses', 'Alertes'].map((f, i) => (
              <div key={f} className={`px-4 py-2 rounded-xl border-2 border-ink font-bold text-sm shadow-[3px_3px_0_#1a1a1a] ${
                i === 0 ? 'bg-lime text-ink' : i === 1 ? 'bg-orange text-white' : 'bg-violet text-white'
              }`}>
                {f}
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime border-2 border-ink shadow-[3px_3px_0_#1a1a1a]">
              <span className="text-sm font-black">CV</span>
              <span className="text-sm font-bold">CarVault</span>
            </div>
          </div>

          <h2 className="text-3xl font-black text-ink mb-1">Connexion</h2>
          <p className="text-ink-light mb-8">Accédez à votre espace</p>

          {error && (
            <div className="nb-card-flat bg-rose/10 border-rose p-4 mb-6">
              <p className="text-sm font-semibold text-rose">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-ink">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nom@exemple.com" className="nb-input w-full px-4 py-3 text-sm text-ink" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-ink">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className="nb-input w-full px-4 py-3 text-sm text-ink" required />
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Se connecter <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-light">
            Pas de compte ?{' '}
            <Link to="/register" className="font-bold text-ink hover:text-violet transition-colors underline decoration-2 underline-offset-2">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
