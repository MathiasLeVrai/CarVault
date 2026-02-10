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
    const interval = setInterval(loadAlertCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith('/alerts')) return;
    return () => { loadAlertCount(); };
  }, [location.pathname]);

  const loadAlertCount = async () => {
    try {
      const { count } = await alertApi.countUnread();
      setAlertCount(count);
    } catch {}
  };

  return (
    <aside className="fixed left-0 top-[64px] bottom-0 w-[240px] carbon-texture flex flex-col z-40 px-4 py-6 border-r border-white/5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 mb-8">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_16px_rgba(230,57,70,0.3)]">
          <span className="text-sm font-black text-white font-display">CV</span>
        </div>
        <span className="text-base font-bold tracking-tight text-white font-display">
          CarVault
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon: Icon, label, showBadge }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all ${
                active
                  ? 'cv-nav-active text-accent'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
              <span className="flex-1">{label}</span>
              {showBadge && alertCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-white text-[10px] font-bold shadow-[0_0_8px_rgba(230,57,70,0.3)]">
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="h-px bg-white/8 mx-4 my-3" />

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium text-white/40 hover:text-accent hover:bg-accent/10 transition-all w-full"
      >
        <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
        Déconnexion
      </button>
    </aside>
  );
}
