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
      <div className="hidden lg:flex lg:w-1/2 bg-bg-dark border-r-2 border-ink relative overflow-hidden items-center justify-center p-16">
        <div className="absolute top-16 right-12 w-28 h-28 rounded-3xl bg-orange border-2 border-ink shadow-[5px_5px_0_#ff6b35] -rotate-12" />
        <div className="absolute bottom-20 left-16 w-36 h-36 rounded-full bg-lime border-2 border-ink shadow-[5px_5px_0_#b9ff66] rotate-6" />
        <div className="absolute top-1/3 left-1/3 w-16 h-16 rounded-2xl bg-violet border-2 border-ink shadow-[3px_3px_0_#7c5cfc] rotate-12" />

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime border-2 border-ink shadow-[3px_3px_0_#1a1a1a] mb-8">
            <span className="text-sm font-black text-ink">CV</span>
            <span className="text-sm font-bold text-ink">CarVault</span>
          </div>

          <h2 className="text-5xl font-black text-white leading-[1.05] mb-6">
            Commencez<br />
            <span className="text-orange">maintenant.</span>
          </h2>

          <div className="space-y-4 mt-10">
            {[
              { n: '01', t: 'Créez votre compte', bg: 'bg-lime' },
              { n: '02', t: 'Ajoutez vos véhicules', bg: 'bg-orange' },
              { n: '03', t: 'Importez tout', bg: 'bg-violet' },
            ].map(s => (
              <div key={s.n} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${s.bg} border-2 border-ink shadow-[2px_2px_0_#1a1a1a] flex items-center justify-center text-xs font-black ${s.bg === 'bg-violet' || s.bg === 'bg-orange' ? 'text-white' : 'text-ink'}`}>
                  {s.n}
                </div>
                <span className="text-base font-semibold text-white">{s.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime border-2 border-ink shadow-[3px_3px_0_#1a1a1a]">
              <span className="text-sm font-black">CV</span>
              <span className="text-sm font-bold">CarVault</span>
            </div>
          </div>

          <h2 className="text-3xl font-black text-ink mb-1">Créer un compte</h2>
          <p className="text-ink-light mb-8">Gratuit et sans engagement</p>

          {error && (
            <div className="nb-card-flat bg-rose/10 border-rose p-4 mb-6">
              <p className="text-sm font-semibold text-rose">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-ink">Prénom</label>
                <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
                  placeholder="Jean" className="nb-input w-full px-4 py-2.5 text-sm text-ink" required />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-ink">Nom</label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
                  placeholder="Dupont" className="nb-input w-full px-4 py-2.5 text-sm text-ink" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-ink">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="nom@exemple.com" className="nb-input w-full px-4 py-2.5 text-sm text-ink" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-ink">Mot de passe</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="Min. 6 caractères" className="nb-input w-full px-4 py-2.5 text-sm text-ink" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-ink">Confirmer</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                placeholder="••••••••" className="nb-input w-full px-4 py-2.5 text-sm text-ink" required />
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Créer mon compte <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-light">
            Déjà un compte ?{' '}
            <Link to="/login" className="font-bold text-ink hover:text-violet transition-colors underline decoration-2 underline-offset-2">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
