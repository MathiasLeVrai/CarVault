import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';

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
      {/* Left */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0c0c0e] relative overflow-hidden items-center justify-center p-16">
        <div className="absolute top-16 right-12 w-36 h-36 rounded-full bg-accent-warm/15 blur-3xl" />
        <div className="absolute bottom-20 left-16 w-40 h-40 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-20 h-20 rounded-full bg-violet/15 blur-2xl" />

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/15 border border-accent/25 mb-8">
            <span className="text-sm font-black text-accent font-display">CV</span>
            <span className="text-sm font-bold text-white/80">CarVault</span>
          </div>

          <h2 className="text-5xl font-black text-white leading-[1.05] mb-6 font-display">
            Commencez<br />
            <span className="text-accent-warm">maintenant.</span>
          </h2>

          <div className="space-y-4 mt-10">
            {[
              { n: '01', t: 'Créez votre compte', color: 'bg-accent/15 border-accent/25 text-accent' },
              { n: '02', t: 'Ajoutez vos véhicules', color: 'bg-accent-warm/15 border-accent-warm/25 text-accent-warm' },
              { n: '03', t: 'Importez tout', color: 'bg-violet/15 border-violet/25 text-violet-light' },
            ].map(s => (
              <div key={s.n} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${s.color} border flex items-center justify-center text-xs font-black font-display`}>
                  {s.n}
                </div>
                <span className="text-base font-medium text-white/80">{s.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-accent/20">
              <span className="text-sm font-black text-accent font-display">CV</span>
              <span className="text-sm font-bold text-ink">CarVault</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-ink mb-1 font-display">Créer un compte</h2>
          <p className="text-ink-light mb-8">Gratuit et sans engagement</p>

          {error && (
            <div className="cv-card-flat bg-accent/8 border-accent/20 p-4 mb-6 rounded-xl">
              <p className="text-sm font-semibold text-accent">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-ink">Prénom</label>
                <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
                  placeholder="Jean" className="cv-input w-full px-4 py-2.5 text-sm text-ink" required />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-ink">Nom</label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
                  placeholder="Dupont" className="cv-input w-full px-4 py-2.5 text-sm text-ink" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="nom@exemple.com" className="cv-input w-full px-4 py-2.5 text-sm text-ink" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink">Mot de passe</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="Min. 6 caractères" className="cv-input w-full px-4 py-2.5 text-sm text-ink" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink">Confirmer</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                placeholder="••••••••" className="cv-input w-full px-4 py-2.5 text-sm text-ink" required />
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Créer mon compte <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-light">
            Déjà un compte ?{' '}
            <Link to="/login" className="font-bold text-accent hover:text-accent-light transition-colors underline decoration-1 underline-offset-2">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
