import { Bell, Sun, Moon, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { alertApi, getAssetUrl } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CarvioBrand } from './CarvioLogo';

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [alertCount, setAlertCount] = useState(0);

  const loadAlertCount = () => {
    alertApi.countUnread().then(d => setAlertCount(d.count)).catch(() => {});
  };

  useEffect(() => {
    loadAlertCount();
    const interval = setInterval(loadAlertCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith('/alerts')) return;
    return () => { loadAlertCount(); };
  }, [location.pathname]);

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '';

  return (
    <header className="fixed top-0 left-0 right-0 cv-header-glass z-50" style={{ paddingTop: 'var(--safe-top)' }}>
      <div className="h-16 md:h-20 flex items-center justify-between px-5 md:px-8">
        <CarvioBrand
          to="/dashboard"
          variant="auto"
          logoClassName="h-9 w-9 md:h-10 md:w-10"
          textClassName={`text-xl font-bold font-display tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}
        />

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
                src={getAssetUrl(user.avatar)}
                alt="avatar"
                className="w-9 h-9 md:w-10 md:h-10 rounded-xl object-cover shadow-lg border border-white/10 cv-img-outline"
              />
            ) : (
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-linear-to-br from-accent to-accent-warm flex items-center justify-center shadow-lg">
                {initials ? (
                  <span className="text-xs md:text-sm font-bold text-white">{initials}</span>
                ) : (
                  <User className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={2.5} />
                )}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <p className={`text-sm font-semibold leading-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{user?.firstName}</p>
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
