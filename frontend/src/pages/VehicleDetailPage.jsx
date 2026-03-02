import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleApi, documentApi, expenseApi, mileageApi, shareApi } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import StatCard from '../components/ui/StatCard';
import { ArrowLeft, FileText, Wallet, Plus, Trash2, Gauge, Upload, FileDown, Heart, TrendingDown, ShieldCheck, Wrench, FileCheck, PiggyBank, CheckCircle2, Route, Settings, Share2, Link2, Copy, Check, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDateShort, documentTypeLabels, documentTypeBadge, expenseCategoryLabels } from '../utils/helpers';
import { motion } from 'framer-motion';

const docTypeOpts = [{ value: 'INSURANCE', label: 'Assurance' },{ value: 'TECHNICAL_INSPECTION', label: 'Contrôle technique' },{ value: 'INVOICE', label: 'Facture' },{ value: 'WARRANTY', label: 'Garantie' },{ value: 'REGISTRATION', label: 'Carte grise' },{ value: 'OTHER', label: 'Autre' }];
const expCatOpts = [{ value: 'MAINTENANCE', label: 'Entretien' },{ value: 'TIRES', label: 'Pneus' },{ value: 'FUEL', label: 'Carburant' },{ value: 'INSURANCE', label: 'Assurance' },{ value: 'REPAIR', label: 'Réparation' },{ value: 'PARKING', label: 'Stationnement' },{ value: 'TOLL', label: 'Péage' },{ value: 'OTHER', label: 'Autre' }];
const monthNames = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#121214] border border-white/10 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-xl">
      <p className="text-xs font-semibold text-ink-light">{label}</p>
      <p className="text-sm font-bold text-white font-display">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

const getScoreColor = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ff2a3f';
};

const getGradeLabel = (grade) => {
  const labels = { A: 'Excellent', B: 'Bon', C: 'Moyen', D: 'À améliorer' };
  return labels[grade] || '';
};

function ScoreGauge({ score, grade, size = 140 }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          strokeLinecap="round" className="transition-all duration-1000 ease-out drop-shadow-[0_0_12px_currentColor]" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-white font-display tracking-tighter">{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color }}>{getGradeLabel(grade)}</span>
      </div>
    </div>
  );
}

function SubScoreBar({ icon: Icon, label, score, max, color }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-white/60" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-white uppercase tracking-wider">{label}</span>
          <span className="text-xs font-bold text-white/50 font-mono">{score}/{max}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%`, backgroundColor: color || getScoreColor((score/max)*100),
              boxShadow: `0 0 12px ${(color || getScoreColor((score/max)*100))}80` }} />
        </div>
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export default function VehicleDetailPage() {
  const { id } = useParams(); const navigate = useNavigate();
  const [v, setV] = useState(null); const [loading, setLoading] = useState(true);
  const [showDoc, setShowDoc] = useState(false); const [showExp, setShowExp] = useState(false); const [sub, setSub] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [df, setDf] = useState({ name:'', type:'INSURANCE', expirationDate:'', notes:'' }); const [docFile, setDocFile] = useState(null);
  const [ef, setEf] = useState({ amount:'', category:'MAINTENANCE', date:'', description:'', mileage:'' });
  const [mileageEntries, setMileageEntries] = useState([]);
  const [showMileage, setShowMileage] = useState(false);
  const [mf, setMf] = useState({ mileage:'', date: new Date().toISOString().split('T')[0], notes:'' });
  const [showShare, setShowShare] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { load(); }, [id]);
  const load = async () => {
    try {
      const [vehicle, entries] = await Promise.all([vehicleApi.getById(id), mileageApi.getAll(id)]);
      setV(vehicle);
      setMileageEntries(entries);
    } catch { navigate('/vehicles'); } finally { setLoading(false); }
  };
  const addDoc = async (e) => { e.preventDefault(); setSub(true); try { const fd=new FormData(); fd.append('vehicleId',id); fd.append('name',df.name); fd.append('type',df.type); if(df.expirationDate) fd.append('expirationDate',df.expirationDate); if(df.notes) fd.append('notes',df.notes); if(docFile) fd.append('file',docFile); await documentApi.create(fd); setShowDoc(false); setDf({name:'',type:'INSURANCE',expirationDate:'',notes:''}); setDocFile(null); load(); } catch{} finally{setSub(false);} };
  const addExp = async (e) => { e.preventDefault(); setSub(true); try { await expenseApi.create({...ef,amount:parseFloat(ef.amount),vehicleId:id}); setShowExp(false); setEf({amount:'',category:'MAINTENANCE',date:'',description:'',mileage:''}); load(); } catch{console.error('erreur lors de l/ajout de la depense')} finally{setSub(false);} };
  const delDoc = async (did) => { if(!confirm('Supprimer ?')) return; await documentApi.delete(did); load(); };
  const delExp = async (eid) => { if(!confirm('Supprimer ?')) return; await expenseApi.delete(eid); load(); };
  const delVehicle = async () => { if(!confirm('Supprimer ce véhicule ?')) return; await vehicleApi.delete(id); navigate('/vehicles'); };
  const downloadPdf = async () => { setGeneratingPdf(true); try { await vehicleApi.downloadPdf(id); } catch (e) { console.error('PDF error:', e); } finally { setGeneratingPdf(false); } };
  const addMileage = async (e) => { e.preventDefault(); setSub(true); try { await mileageApi.create(id, { mileage: parseInt(mf.mileage), date: mf.date, notes: mf.notes }); setShowMileage(false); setMf({ mileage:'', date: new Date().toISOString().split('T')[0], notes:'' }); load(); } catch {} finally { setSub(false); } };
  const delMileage = async (mid) => { if(!confirm('Supprimer ?')) return; await mileageApi.delete(id, mid); load(); };
  const createShareLink = async () => {
    setShareLoading(true);
    try {
      const link = await shareApi.create(id, 30);
      setShareLink(link);
    } catch (e) { console.error('Share error:', e); }
    finally { setShareLoading(false); }
  };
  const copyShareUrl = () => {
    if (!shareLink) return;
    const url = `${window.location.origin}/share/${shareLink.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const revokeShare = async () => {
    if (!shareLink) return;
    await shareApi.revoke(shareLink.id);
    setShareLink(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="relative w-12 h-12"><div className="absolute inset-0 rounded-full border-2 border-white/10 border-t-accent animate-spin" /></div></div>;
  if (!v) return null;

  const chartData = monthNames.map((name, i) => ({ month: name, total: v.stats?.monthlyExpenses?.find(m => m.month === i+1)?.total || 0 }));
  const health = v.health;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 md:space-y-8">
      {/* Hero Header */}
      <motion.div variants={itemVariants} className="relative rounded-3xl overflow-hidden bg-[#121214] border border-white/10 shadow-2xl group">
        <div className="absolute inset-0 mesh-accent opacity-30 mix-blend-screen pointer-events-none" />
        {v.photo && (
          <div className="absolute inset-0">
            <img src={v.photo} alt={`${v.brand} ${v.model}`} className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent" />
          </div>
        )}
        <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-start gap-4">
            <button onClick={() => navigate('/vehicles')} className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all shrink-0 backdrop-blur-md">
              <ArrowLeft className="w-5 h-5 text-white" strokeWidth={2} />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold text-white font-display tracking-widest">{v.year}</span>
                {v.licensePlate && <span className="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-mono font-bold text-white tracking-widest uppercase">{v.licensePlate}</span>}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white font-display tracking-tight leading-none">
                {v.brand} <span className="text-white/60">{v.model}</span>
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
            <Button variant="outline" onClick={() => { setShowShare(true); createShareLink(); }} className="flex-1 md:flex-none border-white/20 text-white hover:bg-white/10">
              <Share2 className="w-4 h-4" />Partager
            </Button>
            <Button variant="outline" onClick={downloadPdf} loading={generatingPdf} className="flex-1 md:flex-none border-white/20 text-white hover:bg-white/10">
              <FileDown className="w-4 h-4" />Dossier PDF
            </Button>
            <Button variant="danger" onClick={delVehicle} className="px-3">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Bento */}
      <div className={`grid grid-cols-2 ${health?.estimatedValue ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 md:gap-6`}>
        <motion.div variants={itemVariants}><StatCard icon={Gauge} label="Kilométrage" value={`${v.mileage?.toLocaleString('fr-FR')} km`} color="accent" /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon={FileText} label="Documents" value={v._count?.documents || 0} color="violet" /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon={Wallet} label={`Dépenses ${new Date().getFullYear()}`} value={formatCurrency(v.stats?.totalExpensesYear || 0)} color="default" /></motion.div>
        {health?.estimatedValue && (
          <motion.div variants={itemVariants}><StatCard icon={TrendingDown} label="Valeur estimée" value={formatCurrency(health.estimatedValue)} color="orange" /></motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score */}
        {health && (
          <motion.div variants={itemVariants} className="lg:col-span-1 cv-card-dark p-6 md:p-8 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display mb-8">
              <Heart className="w-5 h-5 text-accent" strokeWidth={2.5} />Score Santé
            </h3>
            <ScoreGauge score={health.score} grade={health.grade} size={160} />
            <div className="w-full space-y-5 mt-10">
              <SubScoreBar icon={Wrench} label="Entretien" score={health.breakdown.maintenance.score} max={health.breakdown.maintenance.max} />
              <SubScoreBar icon={FileCheck} label="Documents" score={health.breakdown.documents.score} max={health.breakdown.documents.max} />
              <SubScoreBar icon={PiggyBank} label="Coût" score={health.breakdown.cost.score} max={health.breakdown.cost.max} />
              <SubScoreBar icon={CheckCircle2} label="Complétude" score={health.breakdown.completeness.score} max={health.breakdown.completeness.max} />
            </div>
            {health.breakdown.completeness.missing?.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10 w-full text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3">À compléter :</p>
                <div className="flex flex-wrap gap-2">
                  {health.breakdown.completeness.missing.map((item, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/80">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <motion.div variants={itemVariants} className="bento-card p-6 md:p-8">
            <h3 className="text-lg font-bold text-white mb-6 font-display">Dépenses mensuelles</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={val => `${val}€`} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="total" fill="#ff2a3f" radius={[6,6,0,0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={itemVariants} className="bento-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-white font-display">Documents</h3>
                <Button size="sm" variant="ghost" onClick={() => setShowDoc(true)} className="w-8 h-8 p-0 rounded-full bg-white/5 hover:bg-white/10"><Plus className="w-4 h-4" /></Button>
              </div>
              {v.documents?.length > 0 ? (
                <div className="space-y-3">{v.documents.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-white/60" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{d.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">{documentTypeLabels[d.type]}</span>
                          {d.expirationDate && <span className="text-[9px] font-bold text-accent">EXP: {formatDateShort(d.expirationDate)}</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); delDoc(d.id); }}
                      className="p-2 rounded-xl md:opacity-0 md:group-hover:opacity-100 hover:bg-accent/20 text-white/40 hover:text-accent transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}</div>
              ) : <p className="text-sm text-ink-muted text-center py-8">Aucun document</p>}
            </motion.div>

            <motion.div variants={itemVariants} className="bento-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-white font-display">Dépenses</h3>
                <Button size="sm" variant="ghost" onClick={() => setShowExp(true)} className="w-8 h-8 p-0 rounded-full bg-white/5 hover:bg-white/10"><Plus className="w-4 h-4" /></Button>
              </div>
              {v.expenses?.length > 0 ? (
                <div className="space-y-3">{v.expenses.map(exp => (
                  <div key={exp.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                        <Wallet className="w-4 h-4 text-accent" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white font-display">{formatCurrency(exp.amount)}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">{expenseCategoryLabels[exp.category]}</span>
                          <span className="text-[9px] font-bold text-white/30">{formatDateShort(exp.date)}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); delExp(exp.id); }}
                      className="p-2 rounded-xl md:opacity-0 md:group-hover:opacity-100 hover:bg-accent/20 text-white/40 hover:text-accent transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}</div>
              ) : <p className="text-sm text-ink-muted text-center py-8">Aucune dépense</p>}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mileage History */}
      <motion.div variants={itemVariants} className="bento-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Route className="w-5 h-5 text-accent" strokeWidth={2.5} />Historique kilométrage
          </h3>
          <Button size="sm" variant="accent" onClick={() => setShowMileage(true)}><Plus className="w-4 h-4" strokeWidth={2.5} />Ajouter</Button>
        </div>
        {mileageEntries.length > 0 ? (
          <div className="space-y-3">
            {mileageEntries.slice(0, 8).map((entry, i) => {
              const prev = mileageEntries[i + 1];
              const diff = prev ? entry.mileage - prev.mileage : null;
              return (
                <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_12px_rgba(255,42,63,0.5)] shrink-0" />
                    <div>
                      <p className="text-base font-black text-white font-display">{entry.mileage.toLocaleString('fr-FR')} km</p>
                      {entry.notes && <p className="text-[11px] font-semibold text-white/50 mt-0.5">{entry.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">{new Date(entry.date).toLocaleDateString('fr-FR')}</p>
                      {diff !== null && <p className="text-[10px] text-lime font-black mt-0.5">+{diff.toLocaleString('fr-FR')} km</p>}
                    </div>
                    <button onClick={() => delMileage(entry.id)} className="p-2 rounded-xl md:opacity-0 md:group-hover:opacity-100 hover:bg-accent/20 text-white/40 hover:text-accent transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-ink-muted text-center py-6">Aucune entrée</p>}
      </motion.div>

      {/* Modals */}
      <Modal isOpen={showDoc} onClose={() => setShowDoc(false)} title="Ajouter un document">
        <form onSubmit={addDoc} className="space-y-4">
          <Input label="Nom *" placeholder="Assurance 2026" value={df.name} onChange={e => setDf(p => ({...p, name: e.target.value}))} required />
          <Select label="Type *" options={docTypeOpts} value={df.type} onChange={e => setDf(p => ({...p, type: e.target.value}))} />
          <Input label="Date d'expiration" type="date" value={df.expirationDate} onChange={e => setDf(p => ({...p, expirationDate: e.target.value}))} />
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-white">Fichier *</label>
            <label className="flex flex-col items-center gap-2 p-6 bg-white/[0.02] border border-white/10 border-dashed rounded-xl cursor-pointer hover:bg-white/[0.04] hover:border-accent/50 transition-all text-center">
              <Upload className="w-6 h-6 text-white/40" />
              <input type="file" onChange={e => setDocFile(e.target.files[0])} className="hidden" required />
              <span className="text-sm font-semibold text-white/60">{docFile ? <span className="text-accent">{docFile.name}</span> : 'Sélectionner un fichier...'}</span>
            </label>
          </div>
          <Input label="Notes" placeholder="Notes..." value={df.notes} onChange={e => setDf(p => ({...p, notes: e.target.value}))} />
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button variant="ghost" type="button" onClick={() => setShowDoc(false)}>Annuler</Button><Button type="submit" loading={sub} variant="accent">Ajouter</Button></div>
        </form>
      </Modal>

      <Modal isOpen={showExp} onClose={() => setShowExp(false)} title="Ajouter une dépense">
        <form onSubmit={addExp} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Montant (EUR) *" type="number" step="0.01" placeholder="85.50" value={ef.amount} onChange={e => setEf(p => ({...p, amount: e.target.value}))} required />
            <Select label="Catégorie *" options={expCatOpts} value={ef.category} onChange={e => setEf(p => ({...p, category: e.target.value}))} />
          </div>
          <Input label="Date *" type="date" value={ef.date} onChange={e => setEf(p => ({...p, date: e.target.value}))} required />
          <Input label="Description" placeholder="Description..." value={ef.description} onChange={e => setEf(p => ({...p, description: e.target.value}))} />
          <Input label="Kilométrage" type="number" placeholder="48500" value={ef.mileage} onChange={e => setEf(p => ({...p, mileage: e.target.value}))} />
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5"><Button variant="ghost" type="button" onClick={() => setShowExp(false)}>Annuler</Button><Button type="submit" loading={sub} variant="accent">Ajouter</Button></div>
        </form>
      </Modal>

      <Modal isOpen={showMileage} onClose={() => setShowMileage(false)} title="Ajouter un kilométrage">
        <form onSubmit={addMileage} className="space-y-4">
          <Input label="Kilométrage *" type="number" placeholder="48500" value={mf.mileage} onChange={e => setMf(p => ({...p, mileage: e.target.value}))} required />
          <Input label="Date *" type="date" value={mf.date} onChange={e => setMf(p => ({...p, date: e.target.value}))} required />
          <Input label="Notes" placeholder="Révision, voyage..." value={mf.notes} onChange={e => setMf(p => ({...p, notes: e.target.value}))} />
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button variant="ghost" type="button" onClick={() => setShowMileage(false)}>Annuler</Button>
            <Button type="submit" loading={sub} variant="accent">Ajouter</Button>
          </div>
        </form>
      </Modal>

      {/* Share Modal */}
      <Modal isOpen={showShare} onClose={() => setShowShare(false)} title="Partager le dossier">
        <div className="space-y-5">
          <p className="text-sm text-ink-muted">
            Créez un lien en lecture seule pour partager le dossier de votre {v.brand} {v.model} avec un acheteur ou un garage.
          </p>

          {shareLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-accent animate-spin" />
            </div>
          ) : shareLink ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <Link2 className="w-4 h-4 text-accent shrink-0" />
                <span className="text-xs font-mono text-white/70 truncate flex-1">
                  {window.location.origin}/share/{shareLink.token}
                </span>
                <button
                  onClick={copyShareUrl}
                  className="p-2 rounded-lg bg-white/5 hover:bg-accent/20 text-white/60 hover:text-accent transition-all shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-lime" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {shareLink.expiresAt && (
                <p className="text-[11px] text-ink-muted">
                  Ce lien expire le {new Date(shareLink.expiresAt).toLocaleDateString('fr-FR')}.
                </p>
              )}

              <div className="flex gap-3">
                <a
                  href={`/share/${shareLink.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full border-white/20 text-white">
                    <ExternalLink className="w-4 h-4" /> Aperçu
                  </Button>
                </a>
                <a
                  href={`/api/share/${shareLink.token}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full border-white/20 text-white">
                    <FileDown className="w-4 h-4" /> PDF public
                  </Button>
                </a>
              </div>

              <button
                onClick={revokeShare}
                className="text-xs font-bold text-accent/70 hover:text-accent transition-colors"
              >
                Révoquer ce lien
              </button>
            </div>
          ) : (
            <Button variant="accent" onClick={createShareLink} className="w-full">
              <Link2 className="w-4 h-4" /> Créer un lien de partage
            </Button>
          )}
        </div>
      </Modal>
    </motion.div>
  );
}
