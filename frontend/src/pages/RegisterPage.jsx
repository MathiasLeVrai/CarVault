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
      <div className="hidden lg:flex lg:w-1/2 bg-[#07070a] relative overflow-hidden items-center justify-center p-16 border-r border-white/5">
        {/* Grid */}
        <div className="absolute inset-0 cv-grid-bg opacity-100" />

        {/* Animated aurora orbs */}
        <div
          className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full aurora-1"
          style={{ background: 'radial-gradient(circle at center, rgba(255,107,0,0.16) 0%, transparent 65%)', filter: 'blur(70px)' }}
        />
        <div
          className="absolute bottom-[-15%] left-[-5%] w-[55%] h-[55%] rounded-full aurora-2"
          style={{ background: 'radial-gradient(circle at center, rgba(255,42,63,0.14) 0%, transparent 65%)', filter: 'blur(80px)' }}
        />
        <div
          className="absolute top-[35%] left-[25%] w-[30%] h-[30%] rounded-full aurora-3"
          style={{ background: 'radial-gradient(circle at center, rgba(124,92,252,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#07070a]/60" />

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 mb-8 backdrop-blur-md">
            <span className="text-sm font-black text-accent font-display">CV</span>
            <span className="text-sm font-bold text-white/80">CarVault</span>
          </div>

          <h2 className="text-5xl font-black text-white leading-[1.05] mb-6 font-display tracking-tight">
            Commencez<br />
            <span className="text-accent-warm">maintenant.</span>
          </h2>

          <div className="space-y-4 mt-10">
            {[
              { n: '01', t: 'Créez votre compte', color: 'bg-white/[0.03] border-white/10 text-white' },
              { n: '02', t: 'Ajoutez vos véhicules', color: 'bg-white/[0.03] border-white/10 text-white' },
              { n: '03', t: 'Importez tout', color: 'bg-white/[0.03] border-white/10 text-white' },
            ].map(s => (
              <div key={s.n} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${s.color} border flex items-center justify-center text-xs font-black font-display backdrop-blur-md`}>
                  {s.n}
                </div>
                <span className="text-base font-semibold text-white/80">{s.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 mesh-accent opacity-20 pointer-events-none" />
        <div className="w-full max-w-[420px] relative z-10">
          <div className="lg:hidden mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <span className="text-sm font-black text-accent font-display">CV</span>
              <span className="text-sm font-bold text-white">CarVault</span>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white mb-2 font-display tracking-tight">Créer un compte</h2>
          <p className="text-ink-muted mb-8 font-medium">Gratuit et sans engagement</p>

          {error && (
            <div className="bg-accent/10 border border-accent/20 p-4 mb-6 rounded-xl backdrop-blur-md">
              <p className="text-sm font-semibold text-accent">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/80">Prénom</label>
                <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
                  placeholder="Jean" className="cv-input w-full px-4 py-3 text-sm text-white bg-white/[0.02]" required />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/80">Nom</label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
                  placeholder="Dupont" className="cv-input w-full px-4 py-3 text-sm text-white bg-white/[0.02]" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/80">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="nom@exemple.com" className="cv-input w-full px-4 py-3 text-sm text-white bg-white/[0.02]" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/80">Mot de passe</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="Min. 6 caractères" className="cv-input w-full px-4 py-3 text-sm text-white bg-white/[0.02]" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/80">Confirmer</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                placeholder="••••••••" className="cv-input w-full px-4 py-3 text-sm text-white bg-white/[0.02]" required />
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
