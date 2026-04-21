import { Bell, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { alertApi } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [alertCount, setAlertCount] = useState(0);

  const loadAlertCount = () => {
    alertApi.countUnread().then(d => setAlertCount(d.count)).catch(() => {});
  };

  // Poll every 60s
  useEffect(() => {
    loadAlertCount();
    const interval = setInterval(loadAlertCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Refresh count when leaving /alerts page
  useEffect(() => {
    if (!location.pathname.startsWith('/alerts')) return;
    return () => { loadAlertCount(); };
  }, [location.pathname]);

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'CV';

  return (
    <header className="fixed top-0 left-0 right-0 cv-header-glass z-50" style={{ paddingTop: 'var(--safe-top)' }}>
      <div className="h-16 md:h-20 flex items-center justify-between px-5 md:px-8">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-[0_0_16px_rgba(255,42,63,0.3)]">
          <span className="text-[11px] font-black text-white font-display">CV</span>
        </div>
        <span className="text-lg font-bold tracking-tight text-white font-display">
          Car<span className="text-accent">Vault</span>
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/alerts')}
          className="flex relative w-10 h-10 rounded-xl items-center justify-center bg-white/3 border border-white/8 hover:bg-white/6 transition-colors text-ink-light hover:text-accent"
        >
          <Bell className="w-[18px] h-[18px]" strokeWidth={2} />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full text-[9px] font-bold flex items-center justify-center text-white shadow-[0_0_10px_rgba(255,42,63,0.4)]">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        <div className="hidden md:block w-px h-8 bg-white/8 mx-1" />

        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3 rounded-xl transition-[opacity,transform] hover:opacity-80 active:scale-[0.96]"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="avatar"
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl object-cover shadow-lg border border-white/10 cv-img-outline"
            />
          ) : (
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-linear-to-br from-accent to-accent-warm flex items-center justify-center shadow-lg">
              <span className="text-xs md:text-sm font-bold text-white">{initials}</span>
            </div>
          )}
          <div className="hidden lg:block text-left">
            <p className="text-sm font-semibold text-white leading-tight">{user?.firstName}</p>
            <p className="text-[11px] text-ink-muted">{user?.email}</p>
          </div>
        </button>

        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-muted hover:text-accent transition-colors"
          aria-label="Changer le thème"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" strokeWidth={2} />
            : <Moon className="w-4 h-4" strokeWidth={2} />
          }
        </button>
      </div>
      </div>
    </header>
  );
}
