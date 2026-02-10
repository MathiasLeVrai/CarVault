import { Bell, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { alertApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    alertApi.countUnread().then(d => setAlertCount(d.count)).catch(() => {});
  }, []);

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '??';

  return (
    <header className="fixed top-0 left-0 right-0 h-[64px] bg-bg-card border-b-2 border-ink flex items-center justify-between px-6 z-50">
      {/* Left — Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-lime border-2 border-ink flex items-center justify-center shadow-[2px_2px_0_#1a1a1a]">
          <span className="text-sm font-black text-ink">CV</span>
        </div>
        <span className="text-lg font-black tracking-tight text-ink">
          CarVault
        </span>
      </div>

      {/* Center — Search */}
      <div className="hidden md:flex items-center gap-2 w-[340px] px-4 py-2 nb-input">
        <Search className="w-4 h-4 text-ink-muted" strokeWidth={2.5} />
        <input
          type="text"
          placeholder="Rechercher..."
          className="flex-1 bg-transparent border-none text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/alerts')}
          className="relative w-10 h-10 rounded-xl border-2 border-ink flex items-center justify-center hover:bg-bg-alt transition-colors"
        >
          <Bell className="w-[18px] h-[18px] text-ink" strokeWidth={2.2} />
          {alertCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange border-2 border-ink rounded-full text-[9px] font-black flex items-center justify-center text-white">
              {alertCount > 9 ? '9' : alertCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l-2 border-ink/20">
          <div className="w-9 h-9 rounded-xl bg-violet border-2 border-ink flex items-center justify-center shadow-[2px_2px_0_#1a1a1a]">
            <span className="text-xs font-black text-white">{initials}</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-bold text-ink leading-tight">{user?.firstName}</p>
            <p className="text-[11px] text-ink-muted">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
