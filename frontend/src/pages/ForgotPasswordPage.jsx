import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion as Motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import { authApi } from '../services/api';
import Button from '../components/ui/Button';
import { CarvioBrand } from '../components/CarvioLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-screen-auth bg-bg flex items-center justify-center p-8">
      <Helmet>
        <title>Mot de passe oublié — Carvio</title>
      </Helmet>

      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="mb-10">
          <CarvioBrand
            to="/"
            variant="on-dark"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/10"
            logoClassName="h-8 w-8"
            textClassName="text-sm font-bold text-white"
          />
        </div>

        {sent ? (
          <Motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 mb-6">
              <Mail className="w-7 h-7 text-green-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 font-display tracking-tight">Email envoyé</h2>
            <p className="text-ink-muted mb-8 font-medium leading-relaxed">
              Si un compte existe avec l'adresse <span className="text-white font-semibold">{email}</span>, vous recevrez un lien de réinitialisation dans quelques minutes.
            </p>
            <p className="text-ink-muted text-sm mb-6">Pensez à vérifier vos spams.</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Retour à la connexion
            </Link>
          </Motion.div>
        ) : (
          <>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2 font-display tracking-tight">Mot de passe oublié</h2>
            <p className="text-ink-muted mb-8 font-medium">Entrez votre email pour recevoir un lien de réinitialisation</p>

            {error && (
              <div className="bg-accent/10 border border-accent/20 p-4 mb-6 rounded-lg">
                <p className="text-sm font-semibold text-accent">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/80">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="cv-input w-full px-4 py-3.5 text-base text-ink"
                  required
                />
              </div>
              <Button type="submit" loading={loading} className="w-full" size="lg" variant="accent">
                Envoyer le lien
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-ink-muted font-medium">
              <Link to="/login" className="inline-flex items-center gap-1.5 font-bold text-white hover:text-accent transition-colors underline decoration-white/20 underline-offset-4">
                <ArrowLeft className="w-3.5 h-3.5" /> Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
