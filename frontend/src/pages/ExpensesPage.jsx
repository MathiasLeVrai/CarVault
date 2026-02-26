import { useEffect, useState } from 'react';
import { expenseApi, vehicleApi } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import StatCard from '../components/ui/StatCard';
import { Wallet, Plus, Trash2, TrendingUp, Calculator, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatDateShort, expenseCategoryLabels, expenseCategoryColors } from '../utils/helpers';

const catFilters = [{value:'',label:'Toutes'},{value:'MAINTENANCE',label:'Entretien'},{value:'TIRES',label:'Pneus'},{value:'FUEL',label:'Carburant'},{value:'INSURANCE',label:'Assurance'},{value:'REPAIR',label:'Réparation'},{value:'PARKING',label:'Parking'},{value:'TOLL',label:'Péage'},{value:'OTHER',label:'Autre'}];
const catForm = catFilters.filter(o=>o.value);
const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

const ChartTip = ({ active, payload, label }) => {
  if(!active||!payload?.length) return null;
  return (
    <div className="bg-bg-card border border-ink/10 rounded-xl px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
      <p className="text-xs font-semibold text-ink-light">{label}</p>
      <p className="text-sm font-bold text-ink font-display">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function ExpensesPage() {
  const [exps, setExps] = useState([]); const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState(null); const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(''); const [showModal, setShowModal] = useState(false); const [sub, setSub] = useState(false);
  const [form, setForm] = useState({ amount:'', category:'MAINTENANCE', date:'', description:'', mileage:'', vehicleId:'' });

  useEffect(() => { load(); }, [filter]);
  const load = async () => { try { const p={}; if(filter) p.category=filter; const [e,s,v] = await Promise.all([expenseApi.getAll(p), expenseApi.getStats(), vehicleApi.getAll()]); setExps(e); setStats(s); setVehicles(v); } catch{} finally { setLoading(false); } };
  const submit = async (e) => { e.preventDefault(); setSub(true); try { await expenseApi.create({...form, amount:parseFloat(form.amount)}); setShowModal(false); setForm({amount:'',category:'MAINTENANCE',date:'',description:'',mileage:'',vehicleId:''}); load(); } catch{} finally { setSub(false); } };
  const del = async (id) => { if(!confirm('Supprimer ?')) return; await expenseApi.delete(id); load(); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const monthly = months.map((n,i) => ({ month:n, total: stats?.monthlyData?.find(m=>m.month===i+1)?.total || 0 }));
  const avg = stats?.totalYear ? stats.totalYear / 12 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink font-display">Dépenses</h1>
          <p className="text-xs md:text-sm text-ink-light mt-0.5 md:mt-1">Suivi complet</p>
        </div>
        <Button onClick={() => { if(vehicles.length) { setForm(p=>({...p,vehicleId:vehicles[0].id})); setShowModal(true); } }}><Plus className="w-4 h-4" strokeWidth={2.5} />Ajouter</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 stagger">
        <StatCard icon={TrendingUp} label={`Total ${new Date().getFullYear()}`} value={formatCurrency(stats?.totalYear||0)} color="dark" />
        <StatCard icon={Calculator} label="Moyenne mensuelle" value={formatCurrency(avg)} color="accent" />
        <StatCard icon={Receipt} label="Transactions" value={stats?.expenseCount||0} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 animate-slide-up" style={{animationDelay:'80ms'}}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-ink font-display">Évolution</h3>
            <Badge variant="accent">{new Date().getFullYear()}</Badge>
          </div>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={monthly}>
              <CartesianGrid stroke="rgba(0,0,0,0.06)" strokeDasharray="4 4" />
              <XAxis dataKey="month" stroke="#999" fontSize={12} fontWeight={500} tickLine={false} axisLine={false} />
              <YAxis stroke="#999" fontSize={12} fontWeight={500} tickLine={false} axisLine={false} tickFormatter={v=>`${v}€`} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="total" fill="#e63946" radius={[8,8,0,0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2 animate-slide-up" style={{animationDelay:'160ms'}}>
          <h3 className="text-base font-bold text-ink mb-5 font-display">Par catégorie</h3>
          {stats?.byCategory?.length > 0 ? (<>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart><Pie data={stats.byCategory} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2} dataKey="total" nameKey="category" stroke="none">
                {stats.byCategory.map((e,i) => <Cell key={i} fill={expenseCategoryColors[e.category]||'#6b7280'} />)}
              </Pie></PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-3">{stats.byCategory.map(c => (
              <div key={c.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor:expenseCategoryColors[c.category]}} /><span className="text-xs font-medium text-ink-light">{expenseCategoryLabels[c.category]}</span></div>
                <span className="text-xs font-bold text-ink font-display">{formatCurrency(c.total)}</span>
              </div>
            ))}</div>
          </>) : <p className="text-sm text-ink-muted text-center py-14">Aucune donnée</p>}
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {catFilters.map(opt => (
          <button key={opt.value} onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filter===opt.value ? 'cv-filter-active' : 'border-ink/10 text-ink-light hover:border-ink/25'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {exps.length > 0 ? (
        <div className="space-y-3 stagger">{exps.map(exp => (
          <div key={exp.id} className="cv-card-flat p-4 flex items-center justify-between group hover:bg-bg-alt/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{backgroundColor: (expenseCategoryColors[exp.category]||'#6b7280') + '20'}}>
                <Wallet className="w-4 h-4" style={{color: expenseCategoryColors[exp.category]||'#6b7280'}} strokeWidth={2} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-ink font-display">{formatCurrency(exp.amount)}</p>
                  <Badge variant="accent">{expenseCategoryLabels[exp.category]}</Badge>
                </div>
                <div className="flex gap-2 mt-0.5">
                  {exp.vehicle && <span className="text-[10px] font-medium text-ink-light">{exp.vehicle.brand} {exp.vehicle.model}</span>}
                  {exp.description && <span className="text-[10px] text-ink-muted">— {exp.description}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className="text-[10px] font-medium text-ink-muted">{formatDateShort(exp.date)}</span>
              <button onClick={() => del(exp.id)} className="p-1.5 rounded-lg md:opacity-0 md:group-hover:opacity-100 hover:bg-accent/10 text-ink-muted hover:text-accent transition-all">
                <Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}</div>
      ) : (
        <EmptyState icon={Wallet} title="Aucune dépense" description="Suivez carburant, entretien, assurance."
          action={vehicles.length>0 ? <Button onClick={()=>{setForm(p=>({...p,vehicleId:vehicles[0].id})); setShowModal(true);}}><Plus className="w-4 h-4" />Ajouter</Button> : <p className="text-sm text-ink-muted">Ajoutez d'abord un véhicule</p>} />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle dépense">
        <form onSubmit={submit} className="space-y-4">
          <Select label="Véhicule *" options={vehicles.map(v=>({value:v.id,label:`${v.brand} ${v.model} (${v.year})`}))} value={form.vehicleId} onChange={e=>setForm(p=>({...p,vehicleId:e.target.value}))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Montant (EUR) *" type="number" step="0.01" placeholder="85.50" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} required />
            <Select label="Catégorie *" options={catForm} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} />
          </div>
          <Input label="Date *" type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} required />
          <Input label="Description" placeholder="Description..." value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} />
          <Input label="Kilométrage" type="number" placeholder="48500" value={form.mileage} onChange={e=>setForm(p=>({...p,mileage:e.target.value}))} />
          <div className="flex justify-end gap-3 pt-2"><Button variant="outline" type="button" onClick={() => setShowModal(false)}>Annuler</Button><Button type="submit" loading={sub}>Ajouter</Button></div>
        </form>
      </Modal>
    </div>
  );
}
