import { Bell, Sun, Moon, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { alertApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    alertApi.countUnread().then(d => setAlertCount(d.count)).catch(() => {});
  }, []);

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '??';

  return (
    <header className="fixed top-0 left-0 right-0 h-14 md:h-16 cv-header-glass flex items-center justify-between px-4 md:px-6 z-50">
      {/* Left — Brand */}
      <div className="flex items-center gap-2">
        <span className="text-base md:text-lg font-bold tracking-tight text-ink font-display">
          Car<span className="text-accent">Vault</span>
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <button onClick={toggleTheme}
          className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center hover:bg-bg-alt transition-colors text-ink-light hover:text-accent"
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
          {theme === 'dark'
            ? <Sun className="w-4 h-4 md:w-[18px] md:h-[18px]" strokeWidth={2} />
            : <Moon className="w-4 h-4 md:w-[18px] md:h-[18px]" strokeWidth={2} />
          }
        </button>

        {/* Alerts — visible on desktop only (mobile uses bottom nav) */}
        <button onClick={() => navigate('/alerts')}
          className="hidden md:flex relative w-10 h-10 rounded-xl items-center justify-center hover:bg-bg-alt transition-colors text-ink-light hover:text-accent">
          <Bell className="w-[18px] h-[18px]" strokeWidth={2} />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-accent rounded-full text-[9px] font-bold flex items-center justify-center text-white shadow-[0_0_8px_rgba(230,57,70,0.35)]">
              {alertCount > 9 ? '9' : alertCount}
            </span>
          )}
        </button>

        <div className="hidden md:block w-px h-8 bg-ink/10 mx-1" />

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-accent flex items-center justify-center glow-ring">
            <span className="text-[10px] md:text-xs font-bold text-white">{initials}</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-ink leading-tight">{user?.firstName}</p>
            <p className="text-[11px] text-ink-muted">{user?.email}</p>
          </div>
        </div>

        {/* Mobile logout */}
        <button onClick={logout}
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-ink-muted hover:text-accent hover:bg-bg-alt transition-colors">
          <LogOut className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
