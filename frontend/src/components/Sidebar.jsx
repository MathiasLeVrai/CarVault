import { NavLink, useLocation } from 'react-router-dom';
import {
  Gauge, Car, Receipt, FileText, LogOut, SlidersHorizontal, Plus, MapPinned, Zap,
} from 'lucide-react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { showPremiumUi } from '../utils/platform';
import CarvioLogo from './CarvioLogo';

const BUBBLE_SPRING = { type: 'spring', stiffness: 300, damping: 28 };

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
  const prefersReduced = useReducedMotion();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-6 top-24 bottom-6 w-[260px] glass-panel rounded-2xl flex-col z-40 px-4 py-6">
        <div className="flex items-center px-4 mb-8">
          <CarvioLogo className="h-9 w-9" />
        </div>

        <nav className="flex-1 space-y-1.5 mt-4">
          {sidebarItems.map(({ to, icon, label }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/');
            const IconComponent = icon;
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-200 relative ${
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

        {showPremiumUi() && !user?.isPremium && (
          <>
            <div className="cv-divider mx-4 my-4" />
            <NavLink
              to="/settings"
              className="mx-2 p-3 flex items-center gap-3 relative overflow-hidden group transition-colors premium-gradient"
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
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold text-white/35 hover:text-accent hover:bg-white/4 transition-colors w-full"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
          Déconnexion
        </button>
      </aside>

      {/* Mobile Bottom Tab Bar — Liquid Glass Pill */}
      <nav className="md:hidden fixed left-0 right-0 bottom-0 z-50 cv-bottom-bar" role="tablist">
        <div className="flex items-center justify-around relative">
          {[
            navItems[0],
            navItems[1],
            { to: null, isFab: true },
            navItems[2],
            navItems[3],
          ].map((item) => {
            if (item.isFab) {
              return (
                <button
                  key="fab"
                  onClick={onFabPress}
                  className="relative flex items-center justify-center w-11 h-11 rounded-full transition-transform active:scale-[0.96]"
                  aria-label="Saisie rapide"
                >
                  <span className="absolute inset-0 rounded-full bg-accent/15" />
                  <Plus className="w-5 h-5 text-accent relative z-10" strokeWidth={2.5} />
                </button>
              );
            }

            const active = item.to && (location.pathname === item.to || location.pathname.startsWith(item.to + '/'));
            const IconComponent = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                role="tab"
                aria-selected={active}
                className="relative flex items-center justify-center w-12 h-11 rounded-full transition-transform active:scale-[0.96]"
              >
                {active && (
                  <Motion.span
                    layoutId="bottomNavBubble"
                    className="absolute inset-0 rounded-full bg-white/10"
                    style={{ borderRadius: 999 }}
                    transition={prefersReduced ? { duration: 0.15 } : BUBBLE_SPRING}
                  />
                )}
                <IconComponent
                  className={`w-5 h-5 relative z-10 transition-colors ${active ? 'text-accent' : 'text-ink-muted'}`}
                  strokeWidth={active ? 2.5 : 2}
                />
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
