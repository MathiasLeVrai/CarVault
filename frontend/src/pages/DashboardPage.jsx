import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { dashboardApi, vehicleApi } from '../services/api';
import { PRICING } from '../constants/pricing';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import {
  Car, Wallet, CalendarClock, Bell, ChevronRight, TrendingDown,
  ArrowRight, FileText, Activity, Plus, Shield, Wrench, AlertTriangle,
  Clock, TrendingUp, Fuel, Receipt, Zap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  formatCurrency, daysUntil, expenseCategoryLabels, expenseCategoryColors,
  documentTypeLabels,
} from '../utils/helpers';
import { motion as Motion } from 'framer-motion';
import FuelPriceWidget from '../components/dashboard/FuelPriceWidget';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-alt border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs font-semibold text-ink-muted">{label}</p>
      <p className="text-sm font-bold text-white font-display">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
          </div>
        )}
        <h2 className="text-sm font-bold text-white font-display tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

const actionCardConfig = {
  INSPECTION: { icon: Shield, gradient: 'from-orange/20 to-orange/5', iconColor: 'text-orange', borderColor: 'border-orange/30' },
  INSURANCE: { icon: FileText, gradient: 'from-violet/20 to-violet/5', iconColor: 'text-violet', borderColor: 'border-violet/30' },
  MAINTENANCE: { icon: Wrench, gradient: 'from-sky/20 to-sky/5', iconColor: 'text-sky', borderColor: 'border-sky/30' },
  EXPIRED: { icon: AlertTriangle, gradient: 'from-accent/20 to-accent/5', iconColor: 'text-accent', borderColor: 'border-accent/30' },
};

const urgencyBadge = {
  critical: 'danger',
  warning: 'warning',
  info: 'success',
};

function ActionCard({ card, onClick }) {
  const config = actionCardConfig[card.type] || actionCardConfig.MAINTENANCE;
  const Icon = config.icon;
  const daysText = card.daysLeft === null
    ? 'À planifier'
    : card.daysLeft < 0
      ? `Expiré depuis ${Math.abs(card.daysLeft)}j`
      : `Dans ${card.daysLeft}j`;

  return (
    <Motion.button
      variants={itemVariants}
      onClick={onClick}
      className={`bento-card p-5 text-left w-full border ${config.borderColor} bg-gradient-to-br ${config.gradient} hover:scale-[1.02] active:scale-[0.96] transition-[transform,background,border-color] group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} strokeWidth={2} />
        </div>
        <Badge variant={urgencyBadge[card.urgency] || 'default'}>{daysText}</Badge>
      </div>
      <p className="text-sm font-bold text-white font-display leading-tight">{card.title}</p>
      <p className="text-[11px] text-ink-muted mt-1">{card.subtitle}</p>
      <div className="flex items-center gap-1 mt-3 text-xs font-bold text-accent group-hover:text-white transition-colors">
        {card.cta} <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </Motion.button>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getData().then(setData).catch(() => {}).finally(() => setLoading(false));
    // Backfill Crit'Air/CO2/puissance fiscale pour les véhicules existants (une fois par session)
    if (!sessionStorage.getItem('cv_backfill_done')) {
      vehicleApi.backfill().catch(() => {}).finally(() => sessionStorage.setItem('cv_backfill_done', '1'));
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-white/10 border-t-accent animate-spin" />
        </div>
      </div>
    );
  }

  const nextDeadline = data?.upcomingDeadlines?.[0];
  const nextDays = nextDeadline ? daysUntil(nextDeadline.expirationDate) : null;
  const healthScore = data?.avgHealthScore ?? null;
  const actionCards = data?.actionCards || [];

  return (
    <Motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 md:space-y-10"
    >
      {/* ─── Welcome ─── */}
      <Motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-accent uppercase tracking-[0.15em] mb-2">Dashboard</p>
          <h1 className="text-3xl md:text-4xl font-black text-white font-display tracking-tight">
            Bonjour, {user?.firstName}<span className="text-accent">.</span>
          </h1>
          <p className="text-ink-muted mt-1.5 text-sm font-medium">
            Voici un aperçu de votre garage numérique.
          </p>
        </div>
        <Button variant="accent" size="md" onClick={() => navigate('/vehicles')}>
          <Plus className="w-4 h-4" /> Ajouter un véhicule
        </Button>
      </Motion.div>

      {/* ─── Premium banner ─── */}
      {!user?.isPremium && (
        <Motion.div variants={itemVariants}>
          <Link
            to="/settings"
            className="relative overflow-hidden rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 group premium-gradient"
          >
            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(255,42,63,0.2)]">
                <Zap className="w-5 h-5 text-accent" strokeWidth={2.5} fill="currentColor" />
              </div>
              <div>
                <p className="text-sm font-black text-white font-display">
                  Offre de lancement — <span className="text-accent">14 jours gratuits</span>
                </p>
                <p className="text-[11px] text-white/45 font-medium mt-0.5">
                  Débloquez tout CarVault : véhicules illimités, stats avancées, export PDF. À partir de {PRICING.yearlyPerMonth}€/mois.
                </p>
              </div>
            </div>
            <div className="shrink-0 relative z-10">
              <div className="cv-btn-accent px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5">
                Essayer <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        </Motion.div>
      )}

      {/* ─── Ce mois-ci ─── */}
      {(() => {
        const now = new Date();
        const monthKey = now.toLocaleString('fr-FR', { month: 'short' }).replace('.', '');
        const monthly = data?.monthlyExpenses || [];
        const current = monthly.find(m => m.month?.toLowerCase().startsWith(monthKey.toLowerCase()));
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevKey = prevMonth.toLocaleString('fr-FR', { month: 'short' }).replace('.', '');
        const prev = monthly.find(m => m.month?.toLowerCase().startsWith(prevKey.toLowerCase()));
        if (!current || !current.total) return null;
        const diff = prev?.total ? Math.round(((current.total - prev.total) / prev.total) * 100) : null;
        const up = diff !== null && diff > 0;
        return (
          <Motion.div variants={itemVariants}>
            <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-orange" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Ce mois-ci</p>
                  <p className="text-base font-black text-white font-display leading-tight">{formatCurrency(current.total)}</p>
                </div>
              </div>
              {diff !== null && (
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${up ? 'bg-accent/10 text-accent' : 'bg-lime/10 text-lime'}`}>
                  {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="hidden sm:inline">{up ? '+' : ''}{diff}% vs mois dernier</span>
                  <span className="sm:hidden">{up ? '+' : ''}{diff}%</span>
                </div>
              )}
            </div>
          </Motion.div>
        );
      })()}

      {/* ─── Action Cards ("À faire bientôt") ─── */}
      {actionCards.length > 0 && (
        <Motion.div variants={itemVariants}>
          <SectionHeader
            icon={Clock}
            title="À faire bientôt"
            action={
              <button
                onClick={() => navigate('/alerts')}
                className="text-xs font-semibold text-ink-muted hover:text-accent transition-colors flex items-center gap-1"
              >
                Toutes les alertes <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <div className={`grid gap-3 md:gap-4 ${
            actionCards.length === 1 ? 'grid-cols-1 max-w-md' :
            actionCards.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {actionCards.map(card => (
              <ActionCard
                key={card.id}
                card={card}
                onClick={() => navigate(`/vehicles/${card.vehicleId}`)}
              />
            ))}
          </div>
        </Motion.div>
      )}

      {/* ─── Stats Row ─── */}
      <Motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={Car} label="Véhicules" value={data?.vehicleCount || 0} color="sky" />
        <StatCard
          icon={Wallet}
          label={`Dépenses ${new Date().getFullYear()}`}
          value={formatCurrency(data?.totalExpensesYear || 0)}
          color="orange"
        />
        <StatCard
          icon={CalendarClock}
          label="Prochaine échéance"
          value={nextDays !== null ? `${nextDays}j` : '—'}
          trend={nextDeadline?.name}
          color="violet"
        />
        <StatCard
          icon={Bell}
          label="Alertes actives"
          value={data?.alertCount || 0}
          color={data?.alertCount > 0 ? 'accent' : 'lime'}
        />
      </Motion.div>

      {/* ─── Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Bar Chart */}
        <Motion.div variants={itemVariants} className="lg:col-span-3 bento-card p-5 md:p-6">
          <SectionHeader
            icon={TrendingDown}
            title={`Dépenses ${new Date().getFullYear()}`}
            action={
              <button
                onClick={() => navigate('/expenses')}
                className="text-xs font-semibold text-ink-muted hover:text-accent transition-colors flex items-center gap-1"
              >
                Voir tout <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <div className="h-[220px] md:h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={data?.monthlyExpenses || []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} interval={0} />
                <YAxis stroke="#71717a" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={v => `${v}€`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="total" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff2a3f" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ff2a3f" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Motion.div>

        {/* Pie Chart + Legend */}
        <Motion.div variants={itemVariants} className="lg:col-span-2 bento-card p-5 md:p-6 flex flex-col">
          <SectionHeader icon={null} title="Répartition par catégorie" />

          {data?.expensesByCategory?.length > 0 ? (
            <>
              <div className="flex-1 flex items-center justify-center my-2">
                <div className="w-[160px] h-[160px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <PieChart>
                      <Pie
                        data={data.expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="total"
                        stroke="none"
                      >
                        {data.expensesByCategory.map((entry, i) => (
                          <Cell key={i} fill={expenseCategoryColors[entry.category] || '#71717a'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2.5 mt-auto pt-4 border-t border-white/5">
                {data.expensesByCategory.slice(0, 5).map(cat => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: expenseCategoryColors[cat.category] }}
                      />
                      <span className="text-xs font-medium text-ink-light">
                        {expenseCategoryLabels[cat.category]}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white font-display">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-ink-muted">Aucune donnée</p>
            </div>
          )}
        </Motion.div>
      </div>

      {/* ─── Bottom Row: Deadlines + Health Score ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Upcoming Deadlines */}
        <Motion.div variants={itemVariants} className="bento-card p-5 md:p-6">
          <SectionHeader
            icon={FileText}
            title="Prochaines échéances"
            action={
              <button
                onClick={() => navigate('/documents')}
                className="text-xs font-semibold text-ink-muted hover:text-accent transition-colors flex items-center gap-1"
              >
                Voir tout <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          />

          {data?.upcomingDeadlines?.length > 0 ? (
            <div className="divide-y divide-white/5">
              {data.upcomingDeadlines.slice(0, 5).map((d, i) => {
                const days = daysUntil(d.expirationDate);
                const urgent = days <= 7;
                const warning = days <= 30;
                return (
                  <div key={d.id || i} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="text-sm font-semibold text-white truncate">
                        {d.name || documentTypeLabels[d.type] || 'Document'}
                      </p>
                      {d.vehicle && (
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          {d.vehicle.brand} {d.vehicle.model}
                        </p>
                      )}
                    </div>
                    <Badge variant={urgent ? 'danger' : warning ? 'warning' : 'default'}>
                      {days <= 0 ? 'Expiré' : `${days}j`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-ink-muted py-8 text-center">Aucune échéance à venir</p>
          )}
        </Motion.div>

        {/* Health Score */}
        <Motion.div variants={itemVariants} className="cv-card-dark p-5 md:p-6 relative overflow-hidden">

          <div className="relative z-10">
            <SectionHeader icon={Activity} title="Score Santé Global" />

            <div className="mt-6 space-y-5">
              <div>
                <div className="text-5xl md:text-6xl font-black font-display tracking-tighter text-white tabular-nums">
                  {healthScore !== null ? healthScore : '—'}
                  <span className="text-xl text-white/25 ml-1 font-bold">/100</span>
                </div>
                <p className="text-xs text-white/40 mt-1.5 font-medium">Moyenne de tous vos véhicules</p>
              </div>

              {healthScore !== null && (
                <div>
                  <div className="cv-progress-track">
                    <div
                      className="cv-progress-fill"
                      style={{
                        width: `${healthScore}%`,
                        background:
                          healthScore >= 70
                            ? 'linear-gradient(90deg, #22c55e, #38bdf8)'
                            : healthScore >= 40
                              ? 'linear-gradient(90deg, #f59e0b, #ff6b00)'
                              : 'linear-gradient(90deg, #ff2a3f, #ff6b00)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-white/30 font-semibold">0</span>
                    <span className="text-[10px] text-white/30 font-semibold">100</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('/vehicles')}
                className="text-xs font-bold text-accent hover:text-white transition-colors flex items-center gap-1.5 pt-2"
              >
                Voir mes véhicules <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Motion.div>
      </div>

      {/* ─── Prix carburant ─── */}
      <FuelPriceWidget
        userFuelType={data?.ownershipCosts?.[0]?.fuelType || 'GASOLINE'}
        variants={itemVariants}
      />

      {/* ─── Coût de possession ─── */}
      {data?.ownershipCosts?.length > 0 && (
        <Motion.div variants={itemVariants}>
          <SectionHeader
            icon={Receipt}
            title="Coût de possession"
            action={
              <button onClick={() => navigate('/expenses')} className="text-xs font-semibold text-ink-muted hover:text-accent transition-colors flex items-center gap-1">
                Détails <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <div className={`grid gap-3 md:gap-4 ${data.ownershipCosts.length === 1 ? 'grid-cols-1 max-w-lg' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {data.ownershipCosts.map(oc => (
              <button
                key={oc.vehicleId}
                onClick={() => navigate(`/vehicles/${oc.vehicleId}`)}
                className="bento-card p-5 text-left hover:scale-[1.01] active:scale-[0.96] transition-[transform,background,border-color]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange/10 flex items-center justify-center">
                      <Car className="w-4 h-4 text-orange" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white font-display">{oc.brand} {oc.model}</p>
                      <p className="text-[10px] text-white/30 font-medium">{oc.monthsOwned} mois de possession</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-black text-white font-display leading-none tabular-nums">{formatCurrency(oc.monthlyAvg)}</p>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">/ mois</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Wrench className="w-3 h-3 text-white/25" />
                      <span className="text-[11px] text-white/40 font-medium">{formatCurrency(oc.totalExpenses)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Fuel className="w-3 h-3 text-white/25" />
                      <span className="text-[11px] text-white/40 font-medium">{formatCurrency(oc.totalFuel)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/30">Total</span>
                    <span className="text-white/60 font-bold">{formatCurrency(oc.grandTotal)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Motion.div>
      )}

    </Motion.div>
  );
}
