import { Bell, Search, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { alertApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const { user } = useAuth();
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
    <header className="fixed top-0 left-0 right-0 h-[64px] bg-bg-card border-b border-ink/8 flex items-center justify-between px-6 z-50">
      {/* Left — Brand (hidden on desktop, visible in mobile) */}
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold tracking-tight text-ink font-display">
          Car<span className="text-accent">Vault</span>
        </span>
      </div>

      {/* Center — Search */}
      <div className="hidden md:flex items-center gap-2 w-[340px] px-4 py-2 cv-input">
        <Search className="w-4 h-4 text-ink-muted" strokeWidth={2} />
        <input
          type="text"
          placeholder="Rechercher..."
          className="flex-1 bg-transparent border-none text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-bg-alt transition-colors text-ink-light hover:text-accent"
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark'
            ? <Sun className="w-[18px] h-[18px]" strokeWidth={2} />
            : <Moon className="w-[18px] h-[18px]" strokeWidth={2} />
          }
        </button>

        {/* Alerts */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-bg-alt transition-colors text-ink-light hover:text-accent"
        >
          <Bell className="w-[18px] h-[18px]" strokeWidth={2} />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-accent rounded-full text-[9px] font-bold flex items-center justify-center text-white shadow-[0_0_8px_rgba(230,57,70,0.35)]">
              {alertCount > 9 ? '9' : alertCount}
            </span>
          )}
        </button>

        <div className="w-px h-8 bg-ink/10 mx-1" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center glow-ring">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-ink leading-tight">{user?.firstName}</p>
            <p className="text-[11px] text-ink-muted">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
