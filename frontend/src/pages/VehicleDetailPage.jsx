import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleApi, documentApi, expenseApi, mileageApi, shareApi } from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import StatCard from '../components/ui/StatCard';
import { FileText, Wallet, Plus, Trash2, Gauge, Upload, Link2, Copy, Check, ExternalLink, FileDown } from 'lucide-react';
import FuelTracker from '../components/FuelTracker';
import VehicleHero from '../components/vehicle/VehicleHero';
import VehicleHealthCard from '../components/vehicle/VehicleHealthCard';
import MaintenancePlanCard from '../components/vehicle/MaintenancePlanCard';
import MileageHistory from '../components/vehicle/MileageHistory';
import VehicleValuation from '../components/vehicle/VehicleValuation';
import compressImage from '../utils/compressImage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDateShort, documentTypeLabels, expenseCategoryLabels } from '../utils/helpers';
import { motion as Motion } from 'framer-motion';

const fuelOpts = [{ value: 'GASOLINE', label: 'Essence' },{ value: 'DIESEL', label: 'Diesel' },{ value: 'HYBRID', label: 'Hybride' },{ value: 'ELECTRIC', label: 'Électrique' },{ value: 'LPG', label: 'GPL' },{ value: 'OTHER', label: 'Autre' }];
const currentYear = new Date().getFullYear();
const yearOpts = Array.from({ length: currentYear + 1 - 1990 + 1 }, (_, i) => { const y = currentYear + 1 - i; return { value: String(y), label: String(y) }; });
const docTypeOpts = [{ value: 'TECHNICAL_INSPECTION', label: 'Contrôle technique' },{ value: 'INSURANCE', label: 'Assurance' },{ value: 'REGISTRATION', label: 'Carte grise' },{ value: 'INVOICE', label: 'Facture' },{ value: 'ACCIDENT_REPORT', label: 'Constat amiable' },{ value: 'OTHER', label: 'Autre' }];
const expCatOpts = [{ value: 'MAINTENANCE', label: 'Entretien / Révision' },{ value: 'OIL_CHANGE', label: 'Vidange' },{ value: 'BRAKES', label: 'Freins / Plaquettes' },{ value: 'TIRES', label: 'Pneus' },{ value: 'BODYWORK', label: 'Carrosserie' },{ value: 'TECHNICAL_INSPECTION', label: 'Contrôle technique' },{ value: 'PARKING', label: 'Stationnement' },{ value: 'TOLL', label: 'Péage' },{ value: 'CLEANING', label: 'Lavage' },{ value: 'OTHER', label: 'Autre' }];
const monthNames = ['J','F','M','A','M','J','J','A','S','O','N','D'];

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#121214] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs font-semibold text-ink-light">{label}</p>
      <p className="text-sm font-bold text-white font-display">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

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
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ brand: '', model: '', year: '', mileage: '', licensePlate: '', color: '', fuelType: 'GASOLINE', purchasePrice: '' });
  const [editPhoto, setEditPhoto] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
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
  const [maintenancePlan, setMaintenancePlan] = useState(null);

  const openEdit = () => {
    setEditForm({ brand: v.brand || '', model: v.model || '', year: String(v.year || ''), mileage: String(v.mileage || ''), licensePlate: v.licensePlate || '', color: v.color || '', fuelType: v.fuelType || 'GASOLINE', purchasePrice: v.purchasePrice ? String(v.purchasePrice) : '' });
    setEditPhoto(null);
    setShowEdit(true);
  };
  const submitEdit = async (e) => { e.preventDefault(); setEditSubmitting(true); try { const fd = new FormData(); Object.entries(editForm).forEach(([k, val]) => { if (val) fd.append(k, val); }); if (editPhoto) fd.append('photo', await compressImage(editPhoto)); await vehicleApi.update(id, fd); setShowEdit(false); load(); } catch { /* ignore */ } finally { setEditSubmitting(false); } };

  useEffect(() => { load(); }, [id]);
  const load = async () => {
    try {
      const [vehicle, entries] = await Promise.all([vehicleApi.getById(id), mileageApi.getAll(id)]);
      setV(vehicle);
      setMileageEntries(entries);
      vehicleApi.getMaintenancePlan(id).then(setMaintenancePlan).catch(() => {});
    } catch { navigate('/vehicles'); } finally { setLoading(false); }
  };
  const addDoc = async (e) => { e.preventDefault(); setSub(true); try { const fd=new FormData(); fd.append('vehicleId',id); fd.append('name',df.name); fd.append('type',df.type); if(df.expirationDate) fd.append('expirationDate',df.expirationDate); if(df.notes) fd.append('notes',df.notes); if(docFile) fd.append('file',docFile); await documentApi.create(fd); setShowDoc(false); setDf({name:'',type:'INSURANCE',expirationDate:'',notes:''}); setDocFile(null); load(); } catch { /* ignore */ } finally{setSub(false);} };
  const addExp = async (e) => { e.preventDefault(); setSub(true); try { await expenseApi.create({...ef,amount:parseFloat(ef.amount),vehicleId:id}); setShowExp(false); setEf({amount:'',category:'MAINTENANCE',date:'',description:'',mileage:''}); load(); } catch{console.error('erreur lors de l/ajout de la depense')} finally{setSub(false);} };
  const delDoc = async (did) => { if(!confirm('Supprimer ?')) return; await documentApi.delete(did); load(); };
  const delExp = async (eid) => { if(!confirm('Supprimer ?')) return; await expenseApi.delete(eid); load(); };
  const delVehicle = async () => { if(!confirm('Supprimer ce véhicule ?')) return; await vehicleApi.delete(id); navigate('/vehicles'); };
  const downloadPdf = async () => { setGeneratingPdf(true); try { await vehicleApi.downloadPdf(id); } catch (e) { console.error('PDF error:', e); } finally { setGeneratingPdf(false); } };
  const addMileage = async (e) => { e.preventDefault(); setSub(true); try { await mileageApi.create(id, { mileage: parseInt(mf.mileage), date: mf.date, notes: mf.notes }); setShowMileage(false); setMf({ mileage:'', date: new Date().toISOString().split('T')[0], notes:'' }); load(); } catch { /* ignore */ } finally { setSub(false); } };
  const delMileage = async (mid) => { if(!confirm('Supprimer ?')) return; await mileageApi.delete(id, mid); load(); };
  const createShareLink = async () => {
    setShareLoading(true);
    try { const link = await shareApi.create(id, 30); setShareLink(link); }
    catch (e) { console.error('Share error:', e); }
    finally { setShareLoading(false); }
  };
  const copyShareUrl = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(`${window.location.origin}/share/${shareLink.token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const revokeShare = async () => { if (!shareLink) return; await shareApi.revoke(shareLink.id); setShareLink(null); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="relative w-12 h-12"><div className="absolute inset-0 rounded-full border-2 border-white/10 border-t-accent animate-spin" /></div></div>;
  if (!v) return null;

  const chartData = monthNames.map((name, i) => ({ month: name, total: v.stats?.monthlyExpenses?.find(m => m.month === i+1)?.total || 0 }));
  const health = v.health;

  return (
    <Motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 md:space-y-8">
      {/* Hero */}
      <VehicleHero
        vehicle={v}
        onBack={() => navigate('/vehicles')}
        onEdit={openEdit}
        onShare={() => { setShowShare(true); createShareLink(); }}
        onDownloadPdf={downloadPdf}
        onDelete={delVehicle}
        generatingPdf={generatingPdf}
        variants={itemVariants}
      />

      {/* Stats Bento */}
      <div className={`grid grid-cols-2 ${health?.estimatedValue ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 md:gap-6`}>
        <Motion.div variants={itemVariants}><StatCard icon={Gauge} label="Kilométrage" value={`${v.mileage?.toLocaleString('fr-FR')} km`} color="accent" /></Motion.div>
        <Motion.div variants={itemVariants}><StatCard icon={FileText} label="Documents" value={v._count?.documents || 0} color="violet" /></Motion.div>
        <Motion.div variants={itemVariants}><StatCard icon={Wallet} label={`Dépenses ${new Date().getFullYear()}`} value={formatCurrency(v.stats?.totalExpensesYear || 0)} color="default" /></Motion.div>
        {health?.estimatedValue && (
          <Motion.div variants={itemVariants}><StatCard icon={Wallet} label="Valeur estimée" value={formatCurrency(health.estimatedValue)} color="orange" /></Motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score */}
        <VehicleHealthCard health={health} variants={itemVariants} />

        {/* Valeur estimée */}
        <VehicleValuation vehicleId={v.id} variants={itemVariants} />

        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <Motion.div variants={itemVariants} className="bento-card p-6 md:p-8">
            <h3 className="text-lg font-bold text-white mb-6 font-display">Dépenses mensuelles</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} interval={0} />
                <YAxis stroke="#71717a" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={val => `${val}€`} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="total" fill="#ff2a3f" radius={[6,6,0,0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </Motion.div>

          {/* Documents & Expenses Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Motion.div variants={itemVariants} className="bento-card p-6">
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
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">{d.type === 'OTHER' ? d.name : documentTypeLabels[d.type]}</span>
                          {d.expirationDate && <span className="text-[9px] font-bold text-accent">EXP: {formatDateShort(d.expirationDate)}</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); delDoc(d.id); }}
                      className="w-11 h-11 flex items-center justify-center rounded-xl md:opacity-0 md:group-hover:opacity-100 hover:bg-accent/20 text-white/40 hover:text-accent transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}</div>
              ) : <p className="text-sm text-ink-muted text-center py-8">Aucun document</p>}
            </Motion.div>

            <Motion.div variants={itemVariants} className="bento-card p-6">
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
                      className="w-11 h-11 flex items-center justify-center rounded-xl md:opacity-0 md:group-hover:opacity-100 hover:bg-accent/20 text-white/40 hover:text-accent transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}</div>
              ) : <p className="text-sm text-ink-muted text-center py-8">Aucune dépense</p>}
            </Motion.div>
          </div>
        </div>
      </div>

      {/* Mileage History */}
      <MileageHistory
        entries={mileageEntries}
        onAdd={() => setShowMileage(true)}
        onDelete={delMileage}
        variants={itemVariants}
      />

      {/* Maintenance Plan */}
      <MaintenancePlanCard
        vehicleId={id}
        brand={v.brand}
        maintenancePlan={maintenancePlan}
        setMaintenancePlan={setMaintenancePlan}
        variants={itemVariants}
      />

      {/* Fuel Tracker */}
      <Motion.div variants={itemVariants} className="bento-card p-6 md:p-8">
        <FuelTracker vehicleId={id} />
      </Motion.div>

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
                <button onClick={copyShareUrl} className="p-2 rounded-lg bg-white/5 hover:bg-accent/20 text-white/60 hover:text-accent transition-all shrink-0">
                  {copied ? <Check className="w-4 h-4 text-lime" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {shareLink.expiresAt && (
                <p className="text-[11px] text-ink-muted">Ce lien expire le {new Date(shareLink.expiresAt).toLocaleDateString('fr-FR')}.</p>
              )}
              <div className="flex gap-3">
                <a href={`/share/${shareLink.token}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full border-white/20 text-white"><ExternalLink className="w-4 h-4" /> Aperçu</Button>
                </a>
                <a href={`/api/share/${shareLink.token}/pdf`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full border-white/20 text-white"><FileDown className="w-4 h-4" /> PDF public</Button>
                </a>
              </div>
              <button onClick={revokeShare} className="text-xs font-bold text-accent/70 hover:text-accent transition-colors">Révoquer ce lien</button>
            </div>
          ) : (
            <Button variant="accent" onClick={createShareLink} className="w-full"><Link2 className="w-4 h-4" /> Créer un lien de partage</Button>
          )}
        </div>
      </Modal>

      {/* Modal modification véhicule */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier le véhicule">
        <form onSubmit={submitEdit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Select label="Année *" options={yearOpts} value={editForm.year} onChange={e => setEditForm(p => ({ ...p, year: e.target.value }))} required />
            <Input label="Marque *" placeholder="Renault" value={editForm.brand} onChange={e => setEditForm(p => ({ ...p, brand: e.target.value }))} required />
            <Input label="Modèle *" placeholder="Clio" value={editForm.model} onChange={e => setEditForm(p => ({ ...p, model: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Kilométrage" type="number" placeholder="45000" value={editForm.mileage} onChange={e => setEditForm(p => ({ ...p, mileage: e.target.value }))} />
            <Select label="Carburant" options={fuelOpts} value={editForm.fuelType} onChange={e => setEditForm(p => ({ ...p, fuelType: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Plaque" placeholder="AB-123-CD" value={editForm.licensePlate} onChange={e => setEditForm(p => ({ ...p, licensePlate: e.target.value }))} />
            <Input label="Couleur" placeholder="Noir" value={editForm.color} onChange={e => setEditForm(p => ({ ...p, color: e.target.value }))} />
          </div>
          <Input label="Prix d'achat (€)" type="number" step="0.01" placeholder="25000" value={editForm.purchasePrice} onChange={e => setEditForm(p => ({ ...p, purchasePrice: e.target.value }))} />
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-ink">Photo</label>
            <label className="flex items-center justify-center gap-2 w-full py-4 bg-white/[0.02] border border-white/10 border-dashed rounded-xl cursor-pointer text-sm text-ink-muted hover:bg-white/[0.04] hover:border-accent/50 transition-all">
              <input type="file" accept="image/*" onChange={e => setEditPhoto(e.target.files[0])} className="hidden" />
              {editPhoto ? <span className="text-accent font-semibold">{editPhoto.name}</span> : 'Changer la photo'}
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button variant="ghost" type="button" onClick={() => setShowEdit(false)}>Annuler</Button>
            <Button type="submit" loading={editSubmitting} variant="accent">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </Motion.div>
  );
}
