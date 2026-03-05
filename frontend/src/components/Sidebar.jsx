import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Car, Wallet, Bell, LogOut, Settings, Plus, MapPin, Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { alertApi } from '../services/api';

// Bottom nav: 4 main items + 1 central FAB
const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Accueil' },
  { to: '/vehicles', icon: Car, label: 'Véhicules' },
  // [FAB placeholder]
  { to: '/map', icon: MapPin, label: 'Carte' },
  { to: '/settings', icon: Settings, label: 'Compte' },
];

// Desktop sidebar keeps all items
const sidebarItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vehicles', icon: Car, label: 'Véhicules' },
  { to: '/expenses', icon: Wallet, label: 'Dépenses' },
  { to: '/map', icon: MapPin, label: 'Carte' },
  { to: '/bank', icon: Building2, label: 'Banque' },
  { to: '/alerts', icon: Bell, label: 'Alertes', showBadge: true },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

export default function Sidebar({ onFabPress }) {
  const { logout } = useAuth();
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);

  const loadAlertCount = async () => {
    try {
      const { count } = await alertApi.countUnread();
      setAlertCount(count);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAlertCount();
    const interval = setInterval(loadAlertCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith('/alerts')) return;
    return () => { loadAlertCount(); };
  }, [location.pathname]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-6 top-24 bottom-6 w-[260px] glass-panel rounded-2xl flex-col z-40 px-4 py-6">
        <div className="flex items-center gap-3 px-4 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_20px_rgba(255,42,63,0.3)]">
            <span className="text-sm font-black text-white font-display">CV</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-display">
            CarVault
          </span>
        </div>

        <nav className="flex-1 space-y-1.5 mt-4">
          {sidebarItems.map(({ to, icon, label, showBadge }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/');
            const IconComponent = icon;
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 relative ${
                  active
                    ? 'bg-white/8 text-white'
                    : 'text-white/45 hover:text-white hover:bg-white/4'
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-accent" />
                )}
                <IconComponent
                  className={`w-[18px] h-[18px] transition-colors ${active ? 'text-accent' : 'text-current'}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="flex-1">{label}</span>
                {showBadge && alertCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-white text-[10px] font-bold shadow-[0_0_10px_rgba(255,42,63,0.35)]">
                    {alertCount > 99 ? '99+' : alertCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="cv-divider mx-4 my-4" />

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold text-white/35 hover:text-accent hover:bg-white/4 transition-all w-full"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
          Déconnexion
        </button>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 safe-bottom">
        <div className="cv-bottom-bar rounded-2xl shadow-2xl">
          <div className="flex items-center">
            {/* Left 2 items */}
            {navItems.slice(0, 2).map(({ to, icon, label, showBadge }) => {
              const active = location.pathname === to || location.pathname.startsWith(to + '/');
              const IconComponent = icon;
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`flex flex-col items-center justify-center flex-1 py-3 rounded-xl transition-all relative ${
                    active ? 'text-white' : 'text-ink-muted hover:text-white'
                  }`}
                >
                  <div className="relative">
                    <IconComponent className="w-5 h-5" strokeWidth={active ? 2.5 : 2} color={active ? '#ff2a3f' : 'currentColor'} />
                    {showBadge && alertCount > 0 && (
                      <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(255,42,63,0.4)]">
                        {alertCount > 9 ? '9+' : alertCount}
                      </span>
                    )}
                  </div>
                  {active && <span className="text-[10px] font-semibold mt-1 animate-pop">{label}</span>}
                </NavLink>
              );
            })}

            {/* FAB — quick action */}
            <div className="flex-1 flex items-center justify-center py-2">
              <button
                onClick={onFabPress}
                className="w-12 h-12 rounded-2xl bg-accent shadow-[0_0_24px_rgba(255,42,63,0.45)] flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Saisie rapide"
              >
                <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
              </button>
            </div>

            {/* Right 2 items */}
            {navItems.slice(2).map(({ to, icon, label, showBadge }) => {
              const active = location.pathname === to || location.pathname.startsWith(to + '/');
              const IconComponent = icon;
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`flex flex-col items-center justify-center flex-1 py-3 rounded-xl transition-all relative ${
                    active ? 'text-white' : 'text-ink-muted hover:text-white'
                  }`}
                >
                  <div className="relative">
                    <IconComponent className="w-5 h-5" strokeWidth={active ? 2.5 : 2} color={active ? '#ff2a3f' : 'currentColor'} />
                    {showBadge && alertCount > 0 && (
                      <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(255,42,63,0.4)]">
                        {alertCount > 9 ? '9+' : alertCount}
                      </span>
                    )}
                  </div>
                  {active && <span className="text-[10px] font-semibold mt-1 animate-pop">{label}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
