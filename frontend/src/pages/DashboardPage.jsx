import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import { Car, Wallet, CalendarClock, Bell, ChevronRight, Heart } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  formatCurrency, daysUntil, expenseCategoryLabels, expenseCategoryColors,
  documentTypeLabels, documentTypeBadge,
} from '../utils/helpers';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-ink/10 rounded-xl px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
      <p className="text-xs font-semibold text-ink-light">{label}</p>
      <p className="text-sm font-bold text-ink font-display">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getData().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  }

  const nextDeadline = data?.upcomingDeadlines?.[0];
  const nextDays = nextDeadline ? daysUntil(nextDeadline.expirationDate) : null;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="cv-card-dark p-8 animate-slide-up relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-white/40 text-sm font-medium mb-1">Bienvenue</p>
            <h1 className="text-3xl font-bold text-white font-display">
              {user?.firstName} {user?.lastName} <span className="text-accent">.</span>
            </h1>
            <p className="text-white/35 mt-2">Vue d'ensemble de vos véhicules et dépenses</p>
          </div>
          <div className="hidden md:flex w-16 h-16 rounded-2xl bg-accent/15 border border-accent/25 items-center justify-center">
            <Car className="w-7 h-7 text-accent" strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 stagger">
        <StatCard icon={Car} label="Véhicules" value={data?.vehicleCount || 0} color="accent" />
        <StatCard icon={Heart} label="Score santé"
          value={data?.avgHealthScore !== null ? `${data.avgHealthScore}/100` : '—'}
          color={data?.avgHealthScore >= 80 ? 'lime' : data?.avgHealthScore >= 60 ? 'default' : 'orange'} />
        <StatCard icon={Wallet} label={`Total ${new Date().getFullYear()}`} value={formatCurrency(data?.totalExpensesYear || 0)} color="dark" />
        <StatCard icon={CalendarClock} label="Prochaine échéance"
          value={nextDays !== null ? `${nextDays}j` : '—'} trend={nextDeadline?.name} color="orange" />
        <StatCard icon={Bell} label="Alertes" value={data?.alertCount || 0}
          color={data?.alertCount > 0 ? 'orange' : 'default'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-ink font-display">Dépenses mensuelles</h3>
            <Badge variant="accent">{new Date().getFullYear()}</Badge>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data?.monthlyExpenses || []}>
              <CartesianGrid stroke="rgba(0,0,0,0.06)" strokeDasharray="4 4" />
              <XAxis dataKey="month" stroke="#999" fontSize={12} fontWeight={500} tickLine={false} axisLine={false} />
              <YAxis stroke="#999" fontSize={12} fontWeight={500} tickLine={false} axisLine={false} tickFormatter={v => `${v}€`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="total" fill="#e63946" radius={[8, 8, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-base font-bold text-ink mb-5 font-display">Répartition</h3>
          {data?.expensesByCategory?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={data.expensesByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={2} dataKey="total" stroke="none">
                    {data.expensesByCategory.map((entry, i) => (
                      <Cell key={i} fill={expenseCategoryColors[entry.category] || '#6b7280'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 mt-2">
                {data.expensesByCategory.slice(0, 5).map(cat => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: expenseCategoryColors[cat.category] }} />
                      <span className="text-xs font-medium text-ink-light">{expenseCategoryLabels[cat.category]}</span>
                    </div>
                    <span className="text-xs font-bold text-ink font-display">{formatCurrency(cat.total)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-ink-muted text-center py-16">Aucune donnée</p>}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadlines */}
        <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-ink font-display">Prochaines échéances</h3>
            <button onClick={() => navigate('/documents')}
              className="text-xs font-semibold text-ink-light hover:text-accent flex items-center gap-0.5 transition-colors">
              Tout voir <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {data?.upcomingDeadlines?.length > 0 ? (
            <div className="space-y-2">
              {data.upcomingDeadlines.map(d => {
                const days = daysUntil(d.expirationDate);
                return (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border border-ink/8 hover:border-ink/15 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-ink">{d.name}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{d.vehicle}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant={documentTypeBadge[d.type] || 'default'}>{documentTypeLabels[d.type]}</Badge>
                      <Badge variant={days <= 7 ? 'danger' : days <= 30 ? 'warning' : 'success'}>{days}j</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-ink-muted text-center py-10">Aucune échéance</p>}
        </Card>

        {/* Alerts */}
        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-ink font-display">Alertes</h3>
            <button onClick={() => navigate('/alerts')}
              className="text-xs font-semibold text-ink-light hover:text-accent flex items-center gap-0.5 transition-colors">
              Tout voir <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {data?.unreadAlerts?.length > 0 ? (
            <div className="space-y-2">
              {data.unreadAlerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl border border-ink/8">
                  <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-accent" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{alert.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-ink-muted text-center py-10">Aucune alerte</p>}
        </Card>
      </div>
    </div>
  );
}
