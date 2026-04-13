import { NavLink, useLocation } from 'react-router-dom';
import {
  Gauge, Car, Receipt, FileText, LogOut, SlidersHorizontal, Plus, MapPinned, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Bottom nav: 4 main items + 1 central FAB
const navItems = [
  { to: '/dashboard', icon: Gauge, label: 'Accueil' },
  { to: '/vehicles', icon: Car, label: 'Véhicules' },
  // [FAB placeholder]
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/map', icon: MapPinned, label: 'Carte' },
];

// Desktop sidebar keeps all items
const sidebarItems = [
  { to: '/dashboard', icon: Gauge, label: 'Dashboard' },
  { to: '/vehicles', icon: Car, label: 'Véhicules' },
  { to: '/expenses', icon: Receipt, label: 'Dépenses' },
  { to: '/map', icon: MapPinned, label: 'Carte' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/settings', icon: SlidersHorizontal, label: 'Paramètres' },
];

export default function Sidebar({ onFabPress }) {
  const { logout, user } = useAuth();
  const location = useLocation();

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
          {sidebarItems.map(({ to, icon, label }) => {
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
              </NavLink>
            );
          })}
        </nav>

        {!user?.isPremium && (
          <>
            <div className="cv-divider mx-4 my-4" />
            <NavLink
              to="/settings"
              className="mx-2 p-3 flex items-center gap-3 relative overflow-hidden group transition-all premium-gradient"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-accent" strokeWidth={2.5} fill="currentColor" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-black text-white font-display">Passer à Premium</p>
                <p className="text-[10px] text-white/40 font-medium">14 jours gratuits</p>
              </div>
              <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </NavLink>
          </>
        )}

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
      <nav className="md:hidden fixed left-0 right-0 bottom-0 z-50 cv-bottom-bar shadow-2xl">
        <div>
          <div className="flex items-center">
            {/* Left 2 items */}
            {navItems.slice(0, 2).map(({ to, icon, label }) => {
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
                  <IconComponent className="w-5 h-5" strokeWidth={active ? 2.5 : 2} color={active ? '#ff2a3f' : 'currentColor'} />
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
            {navItems.slice(2).map(({ to, icon, label }) => {
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
                  <IconComponent className="w-5 h-5" strokeWidth={active ? 2.5 : 2} color={active ? '#ff2a3f' : 'currentColor'} />
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
