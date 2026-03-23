import { useEffect, useState } from 'react';
import { alertApi } from '../services/api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Bell, BellOff, Check, CheckCheck, Trash2, Clock, AlertTriangle, Shield, FileText, Wrench, Droplets, CircleDot, Gauge, Timer } from 'lucide-react';
import { formatDate, alertTypeLabels, daysUntil } from '../utils/helpers';
import { motion as Motion } from 'framer-motion';

const icons = {
  DOCUMENT_EXPIRY: FileText,
  MAINTENANCE_DUE: Wrench,
  INSPECTION_DUE: Shield,
  INSURANCE_RENEWAL: AlertTriangle,
  OIL_CHANGE: Droplets,
  TIRE_SEASON: CircleDot,
  MILEAGE_SERVICE: Gauge,
  OTHER: Bell,
};

const colors = {
  DOCUMENT_EXPIRY: 'bg-orange/20 text-orange border-orange/20',
  MAINTENANCE_DUE: 'bg-sky/20 text-sky border-sky/20',
  INSPECTION_DUE: 'bg-accent/20 text-accent border-accent/20',
  INSURANCE_RENEWAL: 'bg-violet/20 text-violet border-violet/20',
  OIL_CHANGE: 'bg-orange/20 text-orange border-orange/20',
  TIRE_SEASON: 'bg-lime/20 text-lime border-lime/20',
  MILEAGE_SERVICE: 'bg-info/20 text-info border-info/20',
  OTHER: 'bg-white/10 text-white border-white/20',
};

const SNOOZE_OPTIONS = [
  { label: '1 jour', days: 1 },
  { label: '7 jours', days: 7 },
  { label: '30 jours', days: 30 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } }
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(null);

  useEffect(() => { load(); }, [showAll]);
  const load = async () => { try { setAlerts(await alertApi.getAll(!showAll)); } catch { /* ignore */ } finally { setLoading(false); } };
  const markRead = async (id) => { await alertApi.markAsRead(id); load(); };
  const markAll = async () => { await alertApi.markAllAsRead(); load(); };
  const del = async (id) => { await alertApi.delete(id); load(); };
  const snooze = async (id, days) => {
    setSnoozeOpen(null);
    await alertApi.snooze(id, days);
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="relative w-12 h-12"><div className="absolute inset-0 rounded-full border-2 border-white/10 border-t-accent animate-spin" /></div></div>;
  const unread = alerts.filter(a => !a.isRead).length;

  return (
    <Motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 md:space-y-8">
      <Motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-white font-display tracking-tight">Alertes</h1>
          <p className="text-sm text-ink-muted mt-1">{unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est à jour'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="dark" size="sm" onClick={() => setShowAll(!showAll)}>
            {showAll ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {showAll ? 'Non lues' : 'Toutes'}
          </Button>
          {unread > 0 && <Button variant="accent" size="sm" onClick={markAll}><CheckCheck className="w-4 h-4" />Tout lire</Button>}
        </div>
      </Motion.div>

      {alerts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map(alert => {
            const Icon = icons[alert.type] || Bell;
            const iconStyle = colors[alert.type] || colors.OTHER;
            const days = alert.dueDate ? daysUntil(alert.dueDate) : null;
            const isSnoozed = alert.snoozedUntil && new Date(alert.snoozedUntil) > new Date();
            return (
              <Motion.div variants={itemVariants} key={alert.id} className={`bento-card p-5 flex flex-col justify-between group ${alert.isRead ? 'opacity-50 grayscale-[50%]' : ''}`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl border ${iconStyle} flex items-center justify-center shrink-0 shadow-lg`}>
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white font-display leading-tight">{alert.title}</p>
                    <p className="text-xs text-white/60 mt-1 line-clamp-2 leading-relaxed">{alert.message}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="dark">{alertTypeLabels[alert.type]}</Badge>
                      {days !== null && <Badge variant={days < 0 ? 'danger' : days <= 7 ? 'warning' : 'success'}>{days < 0 ? 'Expiré' : `${days}j`}</Badge>}
                    </div>
                    {isSnoozed && <span className="text-[9px] font-bold text-warning uppercase tracking-widest">Reporté au {new Date(alert.snoozedUntil).toLocaleDateString('fr-FR')}</span>}
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" />{formatDate(alert.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Snooze */}
                    <div className="relative">
                      <button
                        onClick={() => setSnoozeOpen(snoozeOpen === alert.id ? null : alert.id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                        title="Reporter"
                      >
                        <Timer className="w-4 h-4" strokeWidth={2} />
                      </button>
                      {snoozeOpen === alert.id && (
                        <div className="absolute right-0 bottom-full mb-2 z-50 bg-[#121214] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[120px] animate-pop">
                          {SNOOZE_OPTIONS.map(opt => (
                            <button key={opt.days} onClick={() => snooze(alert.id, opt.days)}
                              className="block w-full text-left px-4 py-2 text-xs font-bold text-white/80 hover:bg-white/5 hover:text-white transition-colors">
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {!alert.isRead && (
                      <button onClick={() => markRead(alert.id)} className="p-2 rounded-xl bg-white/5 hover:bg-lime/20 text-white/60 hover:text-lime transition-all" title="Lu">
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    )}
                    <button onClick={() => del(alert.id)} className="p-2 rounded-xl bg-white/5 hover:bg-accent/20 text-white/60 hover:text-accent transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Motion.div>
            );
          })}
        </div>
      ) : (
        <Motion.div variants={itemVariants}>
          <EmptyState icon={Bell} title={showAll ? 'Aucune alerte' : 'Tout est en ordre'}
            description={showAll ? 'Les alertes apparaîtront quand vos documents expireront.' : 'Aucune alerte en attente.'} />
        </Motion.div>
      )}
    </Motion.div>
  );
}
