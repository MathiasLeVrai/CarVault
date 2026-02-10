import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleApi, documentApi, expenseApi } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import StatCard from '../components/ui/StatCard';
import { ArrowLeft, FileText, Wallet, Plus, Trash2, Gauge, Upload, FileDown, Heart, TrendingDown, ShieldCheck, Wrench, FileCheck, PiggyBank, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDateShort, documentTypeLabels, documentTypeBadge, expenseCategoryLabels } from '../utils/helpers';

const docTypeOpts = [{ value: 'INSURANCE', label: 'Assurance' },{ value: 'TECHNICAL_INSPECTION', label: 'Contrôle technique' },{ value: 'INVOICE', label: 'Facture' },{ value: 'WARRANTY', label: 'Garantie' },{ value: 'REGISTRATION', label: 'Carte grise' },{ value: 'OTHER', label: 'Autre' }];
const expCatOpts = [{ value: 'MAINTENANCE', label: 'Entretien' },{ value: 'TIRES', label: 'Pneus' },{ value: 'FUEL', label: 'Carburant' },{ value: 'INSURANCE', label: 'Assurance' },{ value: 'REPAIR', label: 'Réparation' },{ value: 'PARKING', label: 'Stationnement' },{ value: 'TOLL', label: 'Péage' },{ value: 'OTHER', label: 'Autre' }];
const monthNames = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-ink/10 rounded-xl px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
      <p className="text-xs font-semibold text-ink-light">{label}</p>
      <p className="text-sm font-bold text-ink font-display">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

// Score gauge colors
const getScoreColor = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#e63946';
};

const getGradeLabel = (grade) => {
  const labels = { A: 'Excellent', B: 'Bon', C: 'Moyen', D: 'À améliorer' };
  return labels[grade] || '';
};

// SVG circular gauge component
function ScoreGauge({ score, grade, size = 140 }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          strokeLinecap="round" className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-ink font-display">{score}</span>
        <span className="text-xs font-semibold mt-0.5" style={{ color }}>{getGradeLabel(grade)}</span>
      </div>
    </div>
  );
}

// Sub-score bar
function SubScoreBar({ icon: Icon, label, score, max, color }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-bg-alt border border-ink/8 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-ink-light" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-ink">{label}</span>
          <span className="text-xs font-semibold text-ink-muted">{score}/{max}</span>
        </div>
        <div className="h-2 rounded-full bg-ink/6 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%`, backgroundColor: color || getScoreColor((score/max)*100),
              boxShadow: `0 0 8px ${(color || getScoreColor((score/max)*100))}30` }} />
        </div>
      </div>
    </div>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams(); const navigate = useNavigate();
  const [v, setV] = useState(null); const [loading, setLoading] = useState(true);
  const [showDoc, setShowDoc] = useState(false); const [showExp, setShowExp] = useState(false); const [sub, setSub] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [df, setDf] = useState({ name:'', type:'INSURANCE', expirationDate:'', notes:'' }); const [docFile, setDocFile] = useState(null);
  const [ef, setEf] = useState({ amount:'', category:'MAINTENANCE', date:'', description:'', mileage:'' });

  useEffect(() => { load(); }, [id]);
  const load = async () => { try { setV(await vehicleApi.getById(id)); } catch { navigate('/vehicles'); } finally { setLoading(false); } };
  const addDoc = async (e) => { e.preventDefault(); setSub(true); try { const fd=new FormData(); fd.append('vehicleId',id); fd.append('name',df.name); fd.append('type',df.type); if(df.expirationDate) fd.append('expirationDate',df.expirationDate); if(df.notes) fd.append('notes',df.notes); if(docFile) fd.append('file',docFile); await documentApi.create(fd); setShowDoc(false); setDf({name:'',type:'INSURANCE',expirationDate:'',notes:''}); setDocFile(null); load(); } catch{} finally{setSub(false);} };
  const addExp = async (e) => { e.preventDefault(); setSub(true); try { await expenseApi.create({...ef,amount:parseFloat(ef.amount),vehicleId:id}); setShowExp(false); setEf({amount:'',category:'MAINTENANCE',date:'',description:'',mileage:''}); load(); } catch{console.error('erreur lors de l/ajout de la depense')} finally{setSub(false);} };
  const delDoc = async (did) => { if(!confirm('Supprimer ?')) return; await documentApi.delete(did); load(); };
  const delExp = async (eid) => { if(!confirm('Supprimer ?')) return; await expenseApi.delete(eid); load(); };
  const delVehicle = async () => { if(!confirm('Supprimer ce véhicule ?')) return; await vehicleApi.delete(id); navigate('/vehicles'); };
  const downloadPdf = async () => { setGeneratingPdf(true); try { await vehicleApi.downloadPdf(id); } catch (e) { console.error('PDF error:', e); } finally { setGeneratingPdf(false); } };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!v) return null;

  const chartData = monthNames.map((name, i) => ({ month: name, total: v.stats?.monthlyExpenses?.find(m => m.month === i+1)?.total || 0 }));
  const health = v.health;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/vehicles')} className="w-10 h-10 rounded-xl border border-ink/10 flex items-center justify-center hover:bg-bg-alt hover:border-accent/30 transition-colors">
            <ArrowLeft className="w-5 h-5 text-ink" strokeWidth={2} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-ink font-display">{v.brand} {v.model}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-ink-light font-medium">{v.year}</span>
              {v.licensePlate && <span className="px-2 py-0.5 rounded-md bg-bg-alt border border-ink/8 text-[11px] font-mono font-semibold text-ink-light">{v.licensePlate}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadPdf} loading={generatingPdf}>
            <FileDown className="w-3.5 h-3.5" strokeWidth={2.5} />Dossier PDF
          </Button>
          <Button variant="danger" size="sm" onClick={delVehicle}><Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />Supprimer</Button>
        </div>
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-1 ${health?.estimatedValue ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-5 stagger`}>
        <StatCard icon={Gauge} label="Kilométrage" value={`${v.mileage?.toLocaleString('fr-FR')} km`} color="accent" />
        <StatCard icon={FileText} label="Documents" value={v._count?.documents || 0} color="violet" />
        <StatCard icon={Wallet} label={`Dépenses ${new Date().getFullYear()}`} value={formatCurrency(v.stats?.totalExpensesYear || 0)} color="dark" />
        {health?.estimatedValue && (
          <StatCard icon={TrendingDown} label="Valeur estimée" value={formatCurrency(health.estimatedValue)} color="orange" />
        )}
      </div>

      {/* Health Score */}
      {health && (
        <Card className="animate-slide-up" style={{ animationDelay: '80ms' }}>
          <div className="flex items-start gap-8">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <h3 className="text-base font-bold text-ink flex items-center gap-2 font-display">
                <Heart className="w-4 h-4 text-accent" strokeWidth={2.5} />Score Santé
              </h3>
              <ScoreGauge score={health.score} grade={health.grade} />
            </div>

            <div className="flex-1 space-y-4 pt-8">
              <SubScoreBar icon={Wrench} label="Entretien" score={health.breakdown.maintenance.score} max={health.breakdown.maintenance.max} />
              <SubScoreBar icon={FileCheck} label="Documents" score={health.breakdown.documents.score} max={health.breakdown.documents.max} />
              <SubScoreBar icon={PiggyBank} label="Coût maîtrisé" score={health.breakdown.cost.score} max={health.breakdown.cost.max} />
              <SubScoreBar icon={CheckCircle2} label="Complétude" score={health.breakdown.completeness.score} max={health.breakdown.completeness.max} />
            </div>
          </div>

          {health.breakdown.completeness.missing?.length > 0 && (
            <div className="mt-5 pt-4 border-t border-ink/8">
              <p className="text-xs font-semibold text-ink-muted mb-2">Pour améliorer votre score :</p>
              <div className="flex flex-wrap gap-2">
                {health.breakdown.completeness.missing.map((item, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-accent-warm/10 border border-accent-warm/20 text-xs font-semibold text-accent-warm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Chart */}
      <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-base font-bold text-ink mb-5 font-display">Dépenses mensuelles</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid stroke="rgba(0,0,0,0.06)" strokeDasharray="4 4" />
            <XAxis dataKey="month" stroke="#999" fontSize={12} fontWeight={500} tickLine={false} axisLine={false} />
            <YAxis stroke="#999" fontSize={12} fontWeight={500} tickLine={false} axisLine={false} tickFormatter={val => `${val}€`} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="total" fill="#e63946" radius={[8,8,0,0]} maxBarSize={34} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Docs & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-ink font-display">Documents</h3>
            <Button size="sm" onClick={() => setShowDoc(true)}><Plus className="w-3.5 h-3.5" strokeWidth={2.5} />Ajouter</Button>
          </div>
          {v.documents?.length > 0 ? (
            <div className="space-y-2">{v.documents.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border border-ink/8 hover:border-ink/15 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-bg-alt border border-ink/8 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-ink-light" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{d.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant={documentTypeBadge[d.type]}>{documentTypeLabels[d.type]}</Badge>
                      {d.expirationDate && <span className="text-[10px] font-medium text-ink-muted">Exp: {formatDateShort(d.expirationDate)}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); delDoc(d.id); }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent/10 text-ink-muted hover:text-accent transition-all">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}</div>
          ) : <p className="text-sm text-ink-muted text-center py-8">Aucun document</p>}
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-ink font-display">Dernières dépenses</h3>
            <Button size="sm" onClick={() => setShowExp(true)}><Plus className="w-3.5 h-3.5" strokeWidth={2.5} />Ajouter</Button>
          </div>
          {v.expenses?.length > 0 ? (
            <div className="space-y-2">{v.expenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl border border-ink/8 hover:border-ink/15 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 text-accent" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink font-display">{formatCurrency(exp.amount)}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[10px] font-medium text-ink-light">{expenseCategoryLabels[exp.category]}</span>
                      <span className="text-[10px] text-ink-muted">{formatDateShort(exp.date)}</span>
                    </div>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); delExp(exp.id); }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent/10 text-ink-muted hover:text-accent transition-all">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}</div>
          ) : <p className="text-sm text-ink-muted text-center py-8">Aucune dépense</p>}
        </Card>
      </div>

      {/* Doc Modal */}
      <Modal isOpen={showDoc} onClose={() => setShowDoc(false)} title="Ajouter un document">
        <form onSubmit={addDoc} className="space-y-4">
          <Input label="Nom *" placeholder="Assurance 2026" value={df.name} onChange={e => setDf(p => ({...p, name: e.target.value}))} required />
          <Select label="Type *" options={docTypeOpts} value={df.type} onChange={e => setDf(p => ({...p, type: e.target.value}))} />
          <Input label="Date d'expiration" type="date" value={df.expirationDate} onChange={e => setDf(p => ({...p, expirationDate: e.target.value}))} />
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-ink">Fichier *</label>
            <label className="flex flex-col items-center gap-2 p-6 cv-input cursor-pointer hover:bg-bg-alt transition-colors text-center">
              <Upload className="w-6 h-6 text-ink-muted" />
              <input type="file" onChange={e => setDocFile(e.target.files[0])} className="hidden" required />
              <span className="text-sm text-ink-muted">{docFile ? docFile.name : 'Sélectionner...'}</span>
            </label>
          </div>
          <Input label="Notes" placeholder="Notes..." value={df.notes} onChange={e => setDf(p => ({...p, notes: e.target.value}))} />
          <div className="flex justify-end gap-3 pt-2"><Button variant="outline" type="button" onClick={() => setShowDoc(false)}>Annuler</Button><Button type="submit" loading={sub}>Ajouter</Button></div>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal isOpen={showExp} onClose={() => setShowExp(false)} title="Ajouter une dépense">
        <form onSubmit={addExp} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Montant (EUR) *" type="number" step="0.01" placeholder="85.50" value={ef.amount} onChange={e => setEf(p => ({...p, amount: e.target.value}))} required />
            <Select label="Catégorie *" options={expCatOpts} value={ef.category} onChange={e => setEf(p => ({...p, category: e.target.value}))} />
          </div>
          <Input label="Date *" type="date" value={ef.date} onChange={e => setEf(p => ({...p, date: e.target.value}))} required />
          <Input label="Description" placeholder="Description..." value={ef.description} onChange={e => setEf(p => ({...p, description: e.target.value}))} />
          <Input label="Kilométrage" type="number" placeholder="48500" value={ef.mileage} onChange={e => setEf(p => ({...p, mileage: e.target.value}))} />
          <div className="flex justify-end gap-3 pt-2"><Button variant="outline" type="button" onClick={() => setShowExp(false)}>Annuler</Button><Button type="submit" loading={sub}>Ajouter</Button></div>
        </form>
      </Modal>
    </div>
  );
}
