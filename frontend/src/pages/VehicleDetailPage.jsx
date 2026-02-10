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
import { ArrowLeft, FileText, Wallet, Plus, Trash2, Gauge, Upload, FileDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDateShort, documentTypeLabels, documentTypeBadge, expenseCategoryLabels } from '../utils/helpers';

const docTypeOpts = [{ value: 'INSURANCE', label: 'Assurance' },{ value: 'TECHNICAL_INSPECTION', label: 'Contrôle technique' },{ value: 'INVOICE', label: 'Facture' },{ value: 'WARRANTY', label: 'Garantie' },{ value: 'OTHER', label: 'Autre' }];
const expCatOpts = [{ value: 'MAINTENANCE', label: 'Entretien' },{ value: 'TIRES', label: 'Pneus' },{ value: 'FUEL', label: 'Carburant' },{ value: 'INSURANCE', label: 'Assurance' },{ value: 'REPAIR', label: 'Réparation' },{ value: 'PARKING', label: 'Stationnement' },{ value: 'TOLL', label: 'Péage' },{ value: 'OTHER', label: 'Autre' }];
const monthNames = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return <div className="bg-white border-2 border-ink rounded-xl px-4 py-3 shadow-[3px_3px_0_#1a1a1a]"><p className="text-xs font-bold text-ink-light">{label}</p><p className="text-sm font-black text-ink">{formatCurrency(payload[0].value)}</p></div>;
};

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
  const addExp = async (e) => { e.preventDefault(); setSub(true); try { await expenseApi.create({...ef,amount:parseFloat(ef.amount),vehicleId:id}); setShowExp(false); setEf({amount:'',category:'MAINTENANCE',date:'',description:'',mileage:''}); load(); } catch{} finally{setSub(false);} };
  const delDoc = async (did) => { if(!confirm('Supprimer ?')) return; await documentApi.delete(did); load(); };
  const delExp = async (eid) => { if(!confirm('Supprimer ?')) return; await expenseApi.delete(eid); load(); };
  const delVehicle = async () => { if(!confirm('Supprimer ce véhicule ?')) return; await vehicleApi.delete(id); navigate('/vehicles'); };
  const downloadPdf = async () => { setGeneratingPdf(true); try { await vehicleApi.downloadPdf(id); } catch (e) { console.error('PDF error:', e); } finally { setGeneratingPdf(false); } };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-ink border-t-lime rounded-full animate-spin" /></div>;
  if (!v) return null;

  const chartData = monthNames.map((name, i) => ({ month: name, total: v.stats?.monthlyExpenses?.find(m => m.month === i+1)?.total || 0 }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/vehicles')} className="w-10 h-10 rounded-xl border-2 border-ink flex items-center justify-center hover:bg-bg-alt transition-colors">
            <ArrowLeft className="w-5 h-5 text-ink" strokeWidth={2.2} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-ink">{v.brand} {v.model}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-ink-light font-semibold">{v.year}</span>
              {v.licensePlate && <span className="px-2 py-0.5 rounded-md bg-bg-alt border border-ink/20 text-[11px] font-mono font-bold text-ink-light">{v.licensePlate}</span>}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
        <StatCard icon={Gauge} label="Kilométrage" value={`${v.mileage?.toLocaleString('fr-FR')} km`} color="lime" />
        <StatCard icon={FileText} label="Documents" value={v._count?.documents || 0} color="violet" />
        <StatCard icon={Wallet} label={`Dépenses ${new Date().getFullYear()}`} value={formatCurrency(v.stats?.totalExpensesYear || 0)} color="dark" />
      </div>

      {/* Chart */}
      <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-base font-black text-ink mb-5">Dépenses mensuelles</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid stroke="#e5e5e5" strokeDasharray="4 4" />
            <XAxis dataKey="month" stroke="#999" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} />
            <YAxis stroke="#999" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={val => `${val}€`} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="total" fill="#b9ff66" stroke="#1a1a1a" strokeWidth={2} radius={[8,8,0,0]} maxBarSize={34} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Docs & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-ink">Documents</h3>
            <Button size="sm" onClick={() => setShowDoc(true)}><Plus className="w-3.5 h-3.5" strokeWidth={2.5} />Ajouter</Button>
          </div>
          {v.documents?.length > 0 ? (
            <div className="space-y-2">{v.documents.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border-2 border-ink/10 hover:border-ink/20 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-bg-alt border-2 border-ink/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-ink-light" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{d.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant={documentTypeBadge[d.type]}>{documentTypeLabels[d.type]}</Badge>
                      {d.expirationDate && <span className="text-[10px] font-semibold text-ink-muted">Exp: {formatDateShort(d.expirationDate)}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); delDoc(d.id); }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose/10 text-ink-muted hover:text-rose transition-all">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                </button>
              </div>
            ))}</div>
          ) : <p className="text-sm text-ink-muted text-center py-8">Aucun document</p>}
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-ink">Dernières dépenses</h3>
            <Button size="sm" onClick={() => setShowExp(true)}><Plus className="w-3.5 h-3.5" strokeWidth={2.5} />Ajouter</Button>
          </div>
          {v.expenses?.length > 0 ? (
            <div className="space-y-2">{v.expenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl border-2 border-ink/10 hover:border-ink/20 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-lime border-2 border-ink/20 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-4 h-4 text-ink" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-ink">{formatCurrency(exp.amount)}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[10px] font-semibold text-ink-light">{expenseCategoryLabels[exp.category]}</span>
                      <span className="text-[10px] text-ink-muted">{formatDateShort(exp.date)}</span>
                    </div>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); delExp(exp.id); }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose/10 text-ink-muted hover:text-rose transition-all">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
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
            <label className="block text-sm font-bold text-ink">Fichier *</label>
            <label className="flex flex-col items-center gap-2 p-6 nb-input cursor-pointer hover:bg-bg-alt transition-colors text-center">
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
