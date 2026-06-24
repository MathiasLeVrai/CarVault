import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion as Motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '../services/api';
import Button from '../components/ui/Button';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      return setError('Le mot de passe doit contenir au moins 8 caractères.');
    }
    if (password !== confirmPassword) {
      return setError('Les mots de passe ne correspondent pas.');
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="public-screen-auth bg-bg flex items-center justify-center p-8">
        <div className="w-full max-w-[400px] text-center">
          <h2 className="text-2xl font-black text-white mb-4 font-display">Lien invalide</h2>
          <p className="text-ink-muted mb-6">Ce lien de réinitialisation est invalide ou a expiré.</p>
          <Link to="/forgot-password" className="font-bold text-accent hover:underline">
            Faire une nouvelle demande
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="public-screen-auth bg-bg flex items-center justify-center p-8">
      <Helmet>
        <title>Nouveau mot de passe — Carvio</title>
      </Helmet>

      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/10">
            <span className="text-sm font-black text-accent font-display">CV</span>
            <span className="text-sm font-bold text-white">Carvio</span>
          </div>
        </div>

        {success ? (
          <Motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 mb-6">
              <CheckCircle className="w-7 h-7 text-green-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 font-display tracking-tight">Mot de passe modifié</h2>
            <p className="text-ink-muted mb-6 font-medium">
              Votre mot de passe a été réinitialisé. Vous allez être redirigé vers la connexion...
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Aller à la connexion
            </Link>
          </Motion.div>
        ) : (
          <>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2 font-display tracking-tight">Nouveau mot de passe</h2>
            <p className="text-ink-muted mb-8 font-medium">Choisissez votre nouveau mot de passe</p>

            {error && (
              <div className="bg-accent/10 border border-accent/20 p-4 mb-6 rounded-lg">
                <p className="text-sm font-semibold text-accent">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/80">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="cv-input w-full px-4 py-3.5 text-base text-ink"
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/80">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="cv-input w-full px-4 py-3.5 text-base text-ink"
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" loading={loading} className="w-full" size="lg" variant="accent">
                Réinitialiser le mot de passe
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
