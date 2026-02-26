import { useEffect, useState } from 'react';
import { documentApi, vehicleApi } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import { FileText, Plus, Trash2, Upload, ExternalLink } from 'lucide-react';
import { formatDateShort, daysUntil, documentTypeLabels, documentTypeBadge } from '../utils/helpers';

const typeFilters = [{value:'',label:'Tous'},{value:'INSURANCE',label:'Assurance'},{value:'TECHNICAL_INSPECTION',label:'Contrôle tech.'},{value:'INVOICE',label:'Facture'},{value:'WARRANTY',label:'Garantie'},{value:'REGISTRATION',label:'Carte grise'},{value:'OTHER',label:'Autre'}];
const typeForm = typeFilters.filter(o => o.value);

export default function DocumentsPage() {
  const [docs, setDocs] = useState([]); const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true); const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false); const [sub, setSub] = useState(false);
  const [form, setForm] = useState({ name:'', type:'INSURANCE', vehicleId:'', expirationDate:'', notes:'' });
  const [file, setFile] = useState(null);

  useEffect(() => { load(); }, [filter]);
  const load = async () => { try { const [d,v] = await Promise.all([documentApi.getAll(filter||undefined), vehicleApi.getAll()]); setDocs(d); setVehicles(v); } catch{} finally { setLoading(false); } };
  const submit = async (e) => { e.preventDefault(); setSub(true); try { const fd=new FormData(); fd.append('name',form.name); fd.append('type',form.type); fd.append('vehicleId',form.vehicleId); if(form.expirationDate) fd.append('expirationDate',form.expirationDate); if(form.notes) fd.append('notes',form.notes); if(file) fd.append('file',file); await documentApi.create(fd); setShowModal(false); setForm({name:'',type:'INSURANCE',vehicleId:'',expirationDate:'',notes:''}); setFile(null); load(); } catch(err) { console.error('Erreur document:', err); } finally { setSub(false); } };
  const del = async (id) => { if(!confirm('Supprimer ?')) return; await documentApi.delete(id); load(); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink font-display">Documents</h1>
          <p className="text-xs md:text-sm text-ink-light mt-0.5 md:mt-1">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { if(vehicles.length) { setForm(p => ({...p, vehicleId: vehicles[0].id})); setShowModal(true); } }}><Plus className="w-4 h-4" strokeWidth={2.5} />Ajouter</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap animate-slide-up" style={{ animationDelay: '50ms' }}>
        {typeFilters.map(opt => (
          <button key={opt.value} onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filter === opt.value ? 'cv-filter-active' : 'border-ink/10 text-ink-light hover:border-ink/25'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {docs.length > 0 ? (
        <div className="space-y-3 stagger">
          {docs.map(doc => {
            const days = doc.expirationDate ? daysUntil(doc.expirationDate) : null;
            return (
              <div key={doc.id} className="cv-card-flat p-4 flex items-center justify-between group hover:bg-bg-alt/50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-bg-alt border border-ink/8 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-ink-light" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={documentTypeBadge[doc.type]}>{documentTypeLabels[doc.type]}</Badge>
                      {doc.vehicle && <span className="text-[10px] font-medium text-ink-muted">{doc.vehicle.brand} {doc.vehicle.model}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {days !== null && <Badge variant={days < 0 ? 'danger' : days <= 30 ? 'warning' : 'success'}>{days < 0 ? 'Expiré' : `${days}j`}</Badge>}
                  {doc.expirationDate && <span className="text-[10px] font-medium text-ink-muted hidden sm:block">{formatDateShort(doc.expirationDate)}</span>}
                  <a href={doc.filePath} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    className="p-1.5 rounded-lg hover:bg-accent/10 text-ink-muted hover:text-accent transition-all">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => del(doc.id)} className="p-1.5 rounded-lg md:opacity-0 md:group-hover:opacity-100 hover:bg-accent/10 text-ink-muted hover:text-accent transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={FileText} title="Aucun document" description="Centralisez assurances, contrôles techniques, factures."
          action={vehicles.length > 0 ? <Button onClick={() => { setForm(p=>({...p,vehicleId:vehicles[0].id})); setShowModal(true); }}><Plus className="w-4 h-4" />Ajouter</Button> : <p className="text-sm text-ink-muted">Ajoutez d'abord un véhicule</p>} />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouveau document">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Nom *" placeholder="Assurance 2026" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required />
          <Select label="Véhicule *" options={vehicles.map(v=>({value:v.id,label:`${v.brand} ${v.model} (${v.year})`}))} value={form.vehicleId} onChange={e => setForm(p=>({...p,vehicleId:e.target.value}))} />
          <Select label="Type *" options={typeForm} value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))} />
          <Input label="Date d'expiration" type="date" value={form.expirationDate} onChange={e => setForm(p=>({...p,expirationDate:e.target.value}))} />
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-ink">Fichier *</label>
            <label className="flex flex-col items-center gap-2 p-6 cv-input cursor-pointer hover:bg-bg-alt transition-colors text-center">
              <Upload className="w-6 h-6 text-ink-muted" /><input type="file" onChange={e => setFile(e.target.files[0])} className="hidden" required />
              <span className="text-sm text-ink-muted">{file ? file.name : 'Sélectionner...'}</span>
            </label>
          </div>
          <Input label="Notes" placeholder="Notes..." value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} />
          <div className="flex justify-end gap-3 pt-2"><Button variant="outline" type="button" onClick={() => setShowModal(false)}>Annuler</Button><Button type="submit" loading={sub}>Ajouter</Button></div>
        </form>
      </Modal>
    </div>
  );
}
