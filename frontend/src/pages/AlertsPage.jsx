import { useEffect, useState } from 'react';
import { alertApi } from '../services/api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Bell, BellOff, Check, CheckCheck, Trash2, Clock, AlertTriangle, Shield, FileText, Wrench, Droplets, CircleDot, Gauge } from 'lucide-react';
import { formatDate, alertTypeLabels, daysUntil } from '../utils/helpers';

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
  DOCUMENT_EXPIRY: 'bg-accent-warm/15 text-accent-warm',
  MAINTENANCE_DUE: 'bg-sky/15 text-sky',
  INSPECTION_DUE: 'bg-accent/15 text-accent',
  INSURANCE_RENEWAL: 'bg-violet/15 text-violet',
  OIL_CHANGE: 'bg-accent-warm/15 text-accent-warm',
  TIRE_SEASON: 'bg-lime/15 text-lime',
  MILEAGE_SERVICE: 'bg-info/15 text-info',
  OTHER: 'bg-bg-alt text-ink-light',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]); const [loading, setLoading] = useState(true); const [showAll, setShowAll] = useState(false);

  useEffect(() => { load(); }, [showAll]);
  const load = async () => { try { setAlerts(await alertApi.getAll(!showAll)); } catch{} finally { setLoading(false); } };
  const markRead = async (id) => { await alertApi.markAsRead(id); load(); };
  const markAll = async () => { await alertApi.markAllAsRead(); load(); };
  const del = async (id) => { await alertApi.delete(id); load(); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  const unread = alerts.filter(a => !a.isRead).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-ink font-display">Alertes</h1>
          <p className="text-sm text-ink-light mt-1">{unread > 0 ? `${unread} non lue${unread>1?'s':''}` : 'Tout est à jour'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
            {showAll ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            {showAll ? 'Non lues' : 'Toutes'}
          </Button>
          {unread > 0 && <Button size="sm" onClick={markAll}><CheckCheck className="w-3.5 h-3.5" />Tout lire</Button>}
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="space-y-3 stagger">
          {alerts.map(alert => {
            const Icon = icons[alert.type] || Bell;
            const iconStyle = colors[alert.type] || colors.OTHER;
            const days = alert.dueDate ? daysUntil(alert.dueDate) : null;
            return (
              <div key={alert.id} className={`cv-card-flat p-4 group ${alert.isRead ? 'opacity-50' : ''} hover:bg-bg-alt/50 transition-colors`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${iconStyle} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{alert.title}</p>
                        <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{alert.message}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {days !== null && <Badge variant={days<0?'danger':days<=7?'warning':'success'}>{days<0?'Expiré':`${days}j`}</Badge>}
                        {!alert.isRead && (
                          <button onClick={() => markRead(alert.id)} className="p-1.5 rounded-lg hover:bg-accent/10 text-ink-muted hover:text-accent transition-all" title="Lu">
                            <Check className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        )}
                        <button onClick={() => del(alert.id)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent/10 text-ink-muted hover:text-accent transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="dark">{alertTypeLabels[alert.type]}</Badge>
                      <span className="text-[10px] font-medium text-ink-muted flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(alert.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Bell} title={showAll ? 'Aucune alerte' : 'Tout est en ordre'}
          description={showAll ? 'Les alertes apparaîtront quand vos documents expireront.' : 'Aucune alerte en attente.'} />
      )}
    </div>
  );
}
