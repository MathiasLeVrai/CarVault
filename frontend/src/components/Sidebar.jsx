import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Car, FileText, Wallet, Bell, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { alertApi } from '../services/api';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vehicles', icon: Car, label: 'Véhicules' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/expenses', icon: Wallet, label: 'Dépenses' },
  { to: '/alerts', icon: Bell, label: 'Alertes', showBadge: true },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    loadAlertCount();
    // Refresh alert count toutes les 60s
    const interval = setInterval(loadAlertCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Refresh quand on quitte la page alertes
  useEffect(() => {
    if (!location.pathname.startsWith('/alerts')) return;
    // Re-fetch quand on revient sur alertes (les alertes ont pu être marquées lues)
    return () => { loadAlertCount(); };
  }, [location.pathname]);

  const loadAlertCount = async () => {
    try {
      const { count } = await alertApi.countUnread();
      setAlertCount(count);
    } catch {}
  };

  return (
    <aside className="fixed left-0 top-[64px] bottom-0 w-[240px] bg-bg border-r-2 border-ink flex flex-col z-40 px-4 py-6">
      <nav className="flex-1 space-y-1.5">
        {navItems.map(({ to, icon: Icon, label, showBadge }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all ${
                active
                  ? 'nb-nav-active text-ink'
                  : 'text-ink-light hover:bg-bg-alt hover:text-ink'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={2.2} />
              <span className="flex-1">{label}</span>
              {showBadge && alertCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose text-white text-[10px] font-black border-2 border-ink shadow-[1px_1px_0_#1a1a1a]">
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold text-ink-light hover:text-rose hover:bg-rose/10 transition-all w-full"
      >
        <LogOut className="w-[18px] h-[18px]" strokeWidth={2.2} />
        Déconnexion
      </button>
    </aside>
  );
}
