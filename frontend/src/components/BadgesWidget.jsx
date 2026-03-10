import { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Car, FileText, ShieldCheck, Fuel, Zap, Wallet, BarChart2, Gauge, Trophy, X } from 'lucide-react';
import { badgeApi } from '../services/api';

const ICON_MAP = {
  Car,
  FileText,
  ShieldCheck,
  Fuel,
  Zap,
  Wallet,
  BarChart2,
  Gauge,
  Trophy,
};

function BadgeIcon({ name, color, unlocked, size = 20 }) {
  const Icon = ICON_MAP[name] || Trophy;
  return (
    <Icon
      size={size}
      className={unlocked ? '' : 'text-ink-faint'}
      style={unlocked ? { color } : undefined}
      strokeWidth={1.8}
    />
  );
}

function BadgeDetail({ badge, onClose }) {
  return (
    <>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <Motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto glass-panel rounded-3xl p-6 w-full max-w-xs text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: badge.unlocked ? `${badge.color}20` : 'var(--color-bg-elevated)' }}
          >
            <BadgeIcon name={badge.icon} color={badge.color} unlocked={badge.unlocked} size={28} />
          </div>
          <h3 className="text-base font-black text-white font-display">{badge.title}</h3>
          <p className="text-sm text-white/50 mt-1 font-medium">{badge.description}</p>
          <div className="mt-4 py-2 px-4 rounded-xl text-xs font-bold"
            style={{ background: badge.unlocked ? `${badge.color}15` : 'var(--color-bg-elevated)', color: badge.unlocked ? badge.color : 'var(--color-ink-muted)' }}>
            {badge.unlocked ? '✓ Débloqué' : 'Non débloqué'}
          </div>
        </div>
      </Motion.div>
    </>
  );
}

export default function BadgesWidget() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    badgeApi.getAll().then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const { badges, unlockedCount, totalCount, fuelStreak } = data;

  return (
    <div className="cv-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-black text-white font-display tracking-tight">Badges</h3>
          <p className="text-[11px] text-white/40 mt-0.5">{unlockedCount}/{totalCount} débloqués</p>
        </div>
        {fuelStreak >= 1 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/20">
            <Zap className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
            <span className="text-xs font-black text-amber-400">{fuelStreak} mois</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/8 mb-4">
        <Motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ background: 'linear-gradient(90deg, #ff2a3f, #7c5cfc)' }}
        />
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-5 gap-2">
        {badges.map(badge => (
          <button
            key={badge.id}
            onClick={() => setSelected(badge)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <Motion.div
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: badge.unlocked ? `${badge.color}18` : 'var(--color-bg-card)',
                border: `1px solid ${badge.unlocked ? `${badge.color}30` : 'var(--color-ink-faint)'}`,
                boxShadow: badge.unlocked ? `0 0 12px ${badge.color}20` : 'none',
              }}
            >
              <BadgeIcon name={badge.icon} color={badge.color} unlocked={badge.unlocked} size={16} />
            </Motion.div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selected && <BadgeDetail badge={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
