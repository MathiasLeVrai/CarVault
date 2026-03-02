import { useEffect, useState } from 'react';
import { expenseApi, vehicleApi } from '../services/api';
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
import { motion } from 'framer-motion';

const catFilters = [{value:'',label:'Toutes'},{value:'MAINTENANCE',label:'Entretien'},{value:'TIRES',label:'Pneus'},{value:'FUEL',label:'Carburant'},{value:'INSURANCE',label:'Assurance'},{value:'REPAIR',label:'Réparation'},{value:'PARKING',label:'Parking'},{value:'TOLL',label:'Péage'},{value:'OTHER',label:'Autre'}];
const catForm = catFilters.filter(o=>o.value);
const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

const ChartTip = ({ active, payload, label }) => {
  if(!active||!payload?.length) return null;
  return (
    <div className="bg-[#121214] border border-white/10 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-xl">
      <p className="text-xs font-semibold text-ink-light">{label}</p>
      <p className="text-sm font-bold text-white font-display">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="relative w-12 h-12"><div className="absolute inset-0 rounded-full border-2 border-white/10 border-t-accent animate-spin" /></div></div>;

  const monthly = months.map((n,i) => ({ month:n, total: stats?.monthlyData?.find(m=>m.month===i+1)?.total || 0 }));
  const avg = stats?.totalYear ? stats.totalYear / 12 : 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 md:space-y-8">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-white font-display tracking-tight">Dépenses</h1>
          <p className="text-sm text-ink-muted mt-1">Suivi financier complet</p>
        </div>
        <Button onClick={() => { if(vehicles.length) { setForm(p=>({...p,vehicleId:vehicles[0].id})); setShowModal(true); } }} variant="accent">
          <Plus className="w-4 h-4" strokeWidth={2.5} />Ajouter
        </Button>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <motion.div variants={itemVariants}><StatCard icon={TrendingUp} label={`Total ${new Date().getFullYear()}`} value={formatCurrency(stats?.totalYear||0)} color="dark" /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon={Calculator} label="Moyenne mensuelle" value={formatCurrency(avg)} color="accent" /></motion.div>
        <motion.div variants={itemVariants} className="col-span-2 md:col-span-1"><StatCard icon={Receipt} label="Transactions" value={stats?.expenseCount||0} color="orange" /></motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-3 bento-card p-6 md:p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white font-display">Évolution</h3>
            <Badge variant="dark">{new Date().getFullYear()}</Badge>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={v=>`${v}€`} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="total" fill="#ff2a3f" radius={[6,6,0,0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2 bento-card p-6 md:p-8 flex flex-col justify-between">
          <h3 className="text-lg font-bold text-white mb-6 font-display">Par catégorie</h3>
          {stats?.byCategory?.length > 0 ? (
            <div className="flex flex-col h-full justify-between">
              <div className="h-[160px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.byCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="total" nameKey="category" stroke="none">
                      {stats.byCategory.map((e,i) => <Cell key={i} fill={expenseCategoryColors[e.category]||'#71717a'} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {stats.byCategory.map(c => (
                  <div key={c.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{backgroundColor:expenseCategoryColors[c.category], color:expenseCategoryColors[c.category]}} />
                      <span className="text-xs font-bold uppercase tracking-widest text-white/60">{expenseCategoryLabels[c.category]}</span>
                    </div>
                    <span className="text-sm font-black text-white font-display">{formatCurrency(c.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-ink-muted text-center py-14">Aucune donnée</p>}
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="flex gap-2 flex-wrap">
        {catFilters.map(opt => (
          <button key={opt.value} onClick={() => setFilter(opt.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              filter === opt.value ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/[0.02] border border-white/10 text-white/50 hover:bg-white/[0.06] hover:text-white'
            }`}>
            {opt.label}
          </button>
        ))}
      </motion.div>

      {exps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {exps.map(exp => (
            <motion.div variants={itemVariants} key={exp.id} className="bento-card p-5 flex flex-col justify-between group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                    style={{backgroundColor: (expenseCategoryColors[exp.category]||'#71717a') + '20', border: `1px solid ${(expenseCategoryColors[exp.category]||'#71717a')}40`}}>
                    <Wallet className="w-5 h-5" style={{color: expenseCategoryColors[exp.category]||'#71717a'}} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white font-display tracking-tight">{formatCurrency(exp.amount)}</p>
                    <div className="mt-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/50" style={{color: expenseCategoryColors[exp.category]||'#71717a'}}>{expenseCategoryLabels[exp.category]}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex flex-col">
                  {exp.vehicle && <span className="text-[11px] font-semibold text-white/50">{exp.vehicle.brand} {exp.vehicle.model}</span>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-white/30">{formatDateShort(exp.date)}</span>
                    {exp.description && <span className="text-[10px] text-white/40 truncate max-w-[120px]">— {exp.description}</span>}
                  </div>
                </div>
                <button onClick={() => del(exp.id)} className="p-2 rounded-xl bg-white/5 hover:bg-accent/20 text-white/60 hover:text-accent transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div variants={itemVariants}>
          <EmptyState icon={Wallet} title="Aucune dépense" description="Suivez carburant, entretien, assurance."
            action={vehicles.length>0 ? <Button onClick={()=>{setForm(p=>({...p,vehicleId:vehicles[0].id})); setShowModal(true);}} variant="accent"><Plus className="w-4 h-4" />Ajouter</Button> : <p className="text-sm text-ink-muted">Ajoutez d'abord un véhicule</p>} />
        </motion.div>
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
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Annuler</Button><Button type="submit" loading={sub} variant="accent">Ajouter</Button></div>
        </form>
      </Modal>
    </motion.div>
  );
}
