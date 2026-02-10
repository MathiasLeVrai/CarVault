import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import { Car, Wallet, CalendarClock, Bell, ChevronRight } from 'lucide-react';
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
    <div className="bg-white border-2 border-ink rounded-xl px-4 py-3 shadow-[3px_3px_0_#1a1a1a]">
      <p className="text-xs font-bold text-ink-light">{label}</p>
      <p className="text-sm font-black text-ink">{formatCurrency(payload[0].value)}</p>
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
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-ink border-t-lime rounded-full animate-spin" /></div>;
  }

  const nextDeadline = data?.upcomingDeadlines?.[0];
  const nextDays = nextDeadline ? daysUntil(nextDeadline.expirationDate) : null;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <Card variant="dark" className="!p-8 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-sm font-semibold mb-1">Bienvenue</p>
            <h1 className="text-3xl font-black text-white">
              {user?.firstName} {user?.lastName} <span className="text-lime">.</span>
            </h1>
            <p className="text-white/40 mt-2">Vue d'ensemble de vos véhicules et dépenses</p>
          </div>
          <div className="hidden md:block w-20 h-20 rounded-2xl bg-lime border-2 border-ink shadow-[4px_4px_0_rgba(255,255,255,0.2)] flex items-center justify-center">
            <Car className="w-8 h-8 text-ink mx-auto mt-5" strokeWidth={2.2} />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
        <StatCard icon={Car} label="Véhicules" value={data?.vehicleCount || 0} color="lime" />
        <StatCard icon={Wallet} label={`Total ${new Date().getFullYear()}`} value={formatCurrency(data?.totalExpensesYear || 0)} color="dark" />
        <StatCard icon={CalendarClock} label="Prochaine échéance"
          value={nextDays !== null ? `${nextDays}j` : '—'} trend={nextDeadline?.name} color="orange" />
        <StatCard icon={Bell} label="Alertes" value={data?.alertCount || 0}
          color={data?.alertCount > 0 ? 'orange' : 'default'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar chart */}
        <Card className="lg:col-span-3 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-black text-ink">Dépenses mensuelles</h3>
            <Badge variant="lime">{new Date().getFullYear()}</Badge>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data?.monthlyExpenses || []}>
              <CartesianGrid stroke="#e5e5e5" strokeDasharray="4 4" />
              <XAxis dataKey="month" stroke="#999" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} />
              <YAxis stroke="#999" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={v => `${v}€`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="total" fill="#1a1a1a" radius={[8, 8, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie */}
        <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-base font-black text-ink mb-5">Répartition</h3>
          {data?.expensesByCategory?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={data.expensesByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={2} dataKey="total" stroke="#1a1a1a" strokeWidth={2}>
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
                      <div className="w-3 h-3 rounded-full border-2 border-ink"
                        style={{ backgroundColor: expenseCategoryColors[cat.category] }} />
                      <span className="text-xs font-semibold text-ink-light">{expenseCategoryLabels[cat.category]}</span>
                    </div>
                    <span className="text-xs font-black text-ink">{formatCurrency(cat.total)}</span>
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
            <h3 className="text-base font-black text-ink">Prochaines échéances</h3>
            <button onClick={() => navigate('/documents')}
              className="text-xs font-bold text-ink-light hover:text-ink flex items-center gap-0.5 transition-colors">
              Tout voir <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {data?.upcomingDeadlines?.length > 0 ? (
            <div className="space-y-2">
              {data.upcomingDeadlines.map(d => {
                const days = daysUntil(d.expirationDate);
                return (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border-2 border-ink/10 hover:border-ink/20 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-ink">{d.name}</p>
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
            <h3 className="text-base font-black text-ink">Alertes</h3>
            <button onClick={() => navigate('/alerts')}
              className="text-xs font-bold text-ink-light hover:text-ink flex items-center gap-0.5 transition-colors">
              Tout voir <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {data?.unreadAlerts?.length > 0 ? (
            <div className="space-y-2">
              {data.unreadAlerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl border-2 border-ink/10">
                  <div className="w-9 h-9 rounded-xl bg-orange border-2 border-ink shadow-[2px_2px_0_#1a1a1a] flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-white" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink">{alert.title}</p>
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
