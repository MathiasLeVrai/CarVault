import { useEffect, useState, useRef, useCallback } from 'react';
import { documentApi, vehicleApi } from '../services/api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import { FileText, Plus, Trash2, Upload, ExternalLink, Camera, Sparkles, Bell } from 'lucide-react';
import { formatDateShort, daysUntil, documentTypeLabels, documentTypeBadge } from '../utils/helpers';
import { motion as Motion } from 'framer-motion';

const typeFilters = [
  { value: '', label: 'Tous' },
  { value: 'INSURANCE', label: 'Assurance' },
  { value: 'TECHNICAL_INSPECTION', label: 'Contrôle tech.' },
  { value: 'INVOICE', label: 'Facture' },
  { value: 'WARRANTY', label: 'Garantie' },
  { value: 'REGISTRATION', label: 'Carte grise' },
  { value: 'OTHER', label: 'Autre' },
];
const typeForm = typeFilters.filter(o => o.value);

const EXPIRATION_SUGGESTIONS = {
  INSURANCE: { days: 365, label: '+1 an' },
  TECHNICAL_INSPECTION: { days: 730, label: '+2 ans' },
  WARRANTY: { days: 730, label: '+2 ans' },
};

const REMINDER_OPTIONS = [
  { value: 30, label: 'J-30' },
  { value: 14, label: 'J-14' },
  { value: 7, label: 'J-7' },
  { value: 1, label: 'J-1' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

function formatFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [sub, setSub] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'INSURANCE', vehicleId: '', expirationDate: '', notes: '' });
  const [file, setFile] = useState(null);
  const [reminders, setReminders] = useState([30, 7]);
  const [autoDetected, setAutoDetected] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => { load(); }, [filter]);

  const load = async () => {
    try {
      const [d, v] = await Promise.all([
        documentApi.getAll(filter || undefined),
        vehicleApi.getAll(),
      ]);
      setDocs(d);
      setVehicles(v);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleFileChange = useCallback(async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setAutoDetected(false);

    try {
      const result = await documentApi.detectType(selectedFile.name);
      if (result.detectedType) {
        setForm(prev => ({
          ...prev,
          type: result.detectedType,
          name: prev.name || documentTypeLabels[result.detectedType] || '',
        }));
        if (result.suggestedExpirationDays && !form.expirationDate) {
          setForm(prev => ({
            ...prev,
            expirationDate: formatFutureDate(result.suggestedExpirationDays),
          }));
        }
        setAutoDetected(true);
      }
    } catch { /* ignore */ }
  }, [form.expirationDate]);

  const handleTypeChange = useCallback((type) => {
    setForm(prev => ({ ...prev, type }));
    const suggestion = EXPIRATION_SUGGESTIONS[type];
    if (suggestion && !form.expirationDate) {
      setForm(prev => ({ ...prev, expirationDate: formatFutureDate(suggestion.days) }));
    }
  }, [form.expirationDate]);

  const toggleReminder = (days) => {
    setReminders(prev =>
      prev.includes(days) ? prev.filter(d => d !== days) : [...prev, days].sort((a, b) => b - a)
    );
  };

  const openModal = () => {
    if (!vehicles.length) return;
    setForm({ name: '', type: 'INSURANCE', vehicleId: vehicles[0].id, expirationDate: '', notes: '' });
    setFile(null);
    setReminders([30, 7]);
    setAutoDetected(false);
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSub(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('type', form.type);
      fd.append('vehicleId', form.vehicleId);
      if (form.expirationDate) fd.append('expirationDate', form.expirationDate);
      if (form.notes) fd.append('notes', form.notes);
      if (file) fd.append('file', file);
      fd.append('reminderDays', JSON.stringify(reminders));
      await documentApi.create(fd);
      setShowModal(false);
      load();
    } catch (err) {
      console.error('Erreur document:', err);
    } finally {
      setSub(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Supprimer ?')) return;
    await documentApi.delete(id);
    load();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-white/10 border-t-accent animate-spin" />
      </div>
    </div>
  );

  return (
    <Motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 md:space-y-8">
      <Motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-white font-display tracking-tight">Documents</h1>
          <p className="text-sm text-ink-muted mt-1">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openModal} variant="accent" disabled={!vehicles.length}>
          <Plus className="w-4 h-4" strokeWidth={2.5} />Ajouter
        </Button>
      </Motion.div>

      {/* Filters */}
      <Motion.div variants={itemVariants} className="flex gap-2 flex-wrap">
        {typeFilters.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              filter === opt.value
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                : 'bg-white/[0.02] border border-white/10 text-white/50 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </Motion.div>

      {docs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {docs.map(doc => {
            const days = doc.expirationDate ? daysUntil(doc.expirationDate) : null;
            return (
              <Motion.div variants={itemVariants} key={doc.id} className="bento-card p-5 flex flex-col justify-between group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5 text-white/60" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-white truncate font-display">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant={documentTypeBadge[doc.type]}>{documentTypeLabels[doc.type]}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    {doc.vehicle && (
                      <span className="text-[11px] font-semibold text-white/50">
                        {doc.vehicle.brand} {doc.vehicle.model}
                      </span>
                    )}
                    {days !== null && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={days < 0 ? 'danger' : days <= 30 ? 'warning' : 'success'}>
                          {days < 0 ? 'Expiré' : `${days}j restants`}
                        </Badge>
                        <span className="text-[10px] font-bold text-white/30">{formatDateShort(doc.expirationDate)}</span>
                      </div>
                    )}
                    {doc.reminderDays?.length > 0 && days !== null && days > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Bell className="w-3 h-3 text-lime/60" />
                        <span className="text-[9px] font-bold text-lime/60 uppercase tracking-wider">
                          Rappels : {doc.reminderDays.map(d => `J-${d}`).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={doc.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => del(doc.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-accent/20 text-white/60 hover:text-accent transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Motion.div>
            );
          })}
        </div>
      ) : (
        <Motion.div variants={itemVariants}>
          <EmptyState
            icon={FileText}
            title="Aucun document"
            description="Centralisez assurances, contrôles techniques, factures."
            action={
              vehicles.length > 0
                ? <Button onClick={openModal} variant="accent"><Plus className="w-4 h-4" />Ajouter</Button>
                : <p className="text-sm text-ink-muted">Ajoutez d&apos;abord un véhicule</p>
            }
          />
        </Motion.div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouveau document">
        <form onSubmit={submit} className="space-y-4">
          {/* File upload area with camera option */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-white">Fichier *</label>
            <div className="flex gap-2">
              <label className="flex-1 flex flex-col items-center gap-2 p-5 bg-white/[0.02] border border-white/10 border-dashed rounded-xl cursor-pointer hover:bg-white/[0.04] hover:border-accent/50 transition-all text-center">
                <Upload className="w-6 h-6 text-white/40" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => handleFileChange(e.target.files[0])}
                  className="hidden"
                />
                <span className="text-xs font-semibold text-white/60">
                  {file ? <span className="text-accent">{file.name}</span> : 'Fichier ou photo'}
                </span>
              </label>
              <label className="flex flex-col items-center gap-2 p-5 bg-white/[0.02] border border-white/10 border-dashed rounded-xl cursor-pointer hover:bg-white/[0.04] hover:border-violet/50 transition-all">
                <Camera className="w-6 h-6 text-violet/60" />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={e => handleFileChange(e.target.files[0])}
                  className="hidden"
                />
                <span className="text-[10px] font-bold text-violet/60 uppercase tracking-wider">Scanner</span>
              </label>
            </div>
            {autoDetected && (
              <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-lime/10 border border-lime/20">
                <Sparkles className="w-4 h-4 text-lime shrink-0" />
                <span className="text-[11px] font-bold text-lime">
                  Type détecté automatiquement : {documentTypeLabels[form.type]}
                </span>
              </div>
            )}
          </div>

          <Input
            label="Nom *"
            placeholder="Assurance 2026"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            required
          />
          <Select
            label="Véhicule *"
            options={vehicles.map(v => ({ value: v.id, label: `${v.brand} ${v.model} (${v.year})` }))}
            value={form.vehicleId}
            onChange={e => setForm(p => ({ ...p, vehicleId: e.target.value }))}
          />
          <div>
            <Select
              label="Type *"
              options={typeForm}
              value={form.type}
              onChange={e => handleTypeChange(e.target.value)}
            />
            {EXPIRATION_SUGGESTIONS[form.type] && !form.expirationDate && (
              <button
                type="button"
                onClick={() => setForm(p => ({
                  ...p,
                  expirationDate: formatFutureDate(EXPIRATION_SUGGESTIONS[form.type].days),
                }))}
                className="mt-1.5 text-[11px] font-bold text-accent hover:text-white transition-colors"
              >
                Suggestion : {EXPIRATION_SUGGESTIONS[form.type].label} →
              </button>
            )}
          </div>

          <Input
            label="Date d'expiration"
            type="date"
            value={form.expirationDate}
            onChange={e => setForm(p => ({ ...p, expirationDate: e.target.value }))}
          />

          {/* Reminder config */}
          {form.expirationDate && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-lime" /> Rappels
              </label>
              <div className="flex flex-wrap gap-2">
                {REMINDER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleReminder(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      reminders.includes(opt.value)
                        ? 'bg-lime/20 text-lime border border-lime/30'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:text-white/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-ink-muted">
                Vous serez alerté {reminders.sort((a, b) => b - a).map(d => `${d}j`).join(', ')} avant expiration.
              </p>
            </div>
          )}

          <Input
            label="Notes"
            placeholder="Notes..."
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button type="submit" loading={sub} variant="accent">Ajouter</Button>
          </div>
        </form>
      </Modal>
    </Motion.div>
  );
}
