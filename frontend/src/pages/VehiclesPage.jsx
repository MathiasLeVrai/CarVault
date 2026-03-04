import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleApi, brandApi } from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Autocomplete from '../components/ui/Autocomplete';
import EmptyState from '../components/ui/EmptyState';
import PlateScanModal from '../components/PlateScanModal';
import { Car, Plus, FileText, ArrowUpRight, Gauge, Zap, Search, CheckCircle2, ScanLine } from 'lucide-react';
import { motion } from 'framer-motion';

const fuelOpts = [
  { value: 'GASOLINE', label: 'Essence' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'HYBRID', label: 'Hybride' },
  { value: 'ELECTRIC', label: 'Électrique' },
  { value: 'LPG', label: 'GPL' },
  { value: 'OTHER', label: 'Autre' },
];

const currentYear = new Date().getFullYear();
const yearOpts = [
  { value: '', label: 'Année...' },
  ...Array.from({ length: currentYear + 1 - 1990 + 1 }, (_, i) => {
    const y = currentYear + 1 - i;
    return { value: String(y), label: String(y) };
  }),
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export default function VehiclesPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Plate lookup
  const [plateInput, setPlateInput] = useState('');
  const [plateLoading, setPlateLoading] = useState(false);
  const [plateFound, setPlateFound] = useState(false);
  const [plateError, setPlateError] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [form, setForm] = useState({
    brand: '', model: '', year: '', mileage: '', licensePlate: '', color: '',
    fuelType: 'GASOLINE', purchasePrice: '', carapiTrimId: '', msrp: '',
    horsepower: '', engineSize: '', transmission: '', bodyType: '', doors: '',
  });
  const [photo, setPhoto] = useState(null);

  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [trims, setTrims] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingTrims, setLoadingTrims] = useState(false);

  useEffect(() => { loadVehicles(); loadBrands(); }, []);

  const loadVehicles = async () => {
    try { setVehicles(await vehicleApi.getAll()); } catch (e) { console.error('Erreur chargement véhicules:', e); } finally { setLoading(false); }
  };

  const loadBrands = async () => {
    try { setBrands(await brandApi.getAll()); } catch (e) { console.error('Erreur chargement marques:', e); }
  };

  const handlePlateLookup = async () => {
    if (!plateInput.trim()) return;
    setPlateLoading(true);
    setPlateError('');
    setPlateFound(false);
    try {
      const data = await brandApi.lookupPlate(plateInput.trim());
      setForm(p => ({
        ...p,
        brand: data.brand || '',
        model: data.model || '',
        year: data.year ? String(data.year) : '',
        licensePlate: data.licensePlate || plateInput.trim().toUpperCase(),
        color: data.color || '',
        fuelType: data.fuelType || 'GASOLINE',
        horsepower: data.horsepower ? String(data.horsepower) : '',
        engineSize: data.engineSize ? String(data.engineSize) : '',
        transmission: data.transmission || '',
        bodyType: data.bodyType || '',
        doors: data.doors ? String(data.doors) : '',
      }));
      setPlateFound(true);
    } catch (err) {
      setPlateError(err.message || 'Plaque non trouvée. Vous pouvez saisir manuellement.');
    } finally {
      setPlateLoading(false);
    }
  };

  const handlePlateKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePlateLookup();
    }
  };

  const handleBrandChange = async (brand) => {
    setForm(p => ({ ...p, brand, model: '', carapiTrimId: '', msrp: '', horsepower: '', engineSize: '', transmission: '', bodyType: '', doors: '' }));
    setModels([]); setTrims([]);
    if (!brand) return;
    setLoadingModels(true);
    try { setModels(await brandApi.getModels(brand)); } catch (e) {} finally { setLoadingModels(false); }
  };

  const handleModelChange = async (model) => {
    setForm(p => ({ ...p, model, carapiTrimId: '', msrp: '', horsepower: '', engineSize: '', transmission: '', bodyType: '', doors: '' }));
    setTrims([]);
    if (!model || !form.brand || !form.year) return;
    await loadTrims(form.year, form.brand, model);
  };

  const handleYearChange = async (year) => {
    setForm(p => ({ ...p, year, carapiTrimId: '', msrp: '', horsepower: '', engineSize: '', transmission: '', bodyType: '', doors: '' }));
    setTrims([]);
    if (!year || !form.brand || !form.model) return;
    await loadTrims(year, form.brand, form.model);
  };

  const loadTrims = async (year, brand, model) => {
    setLoadingTrims(true);
    try { setTrims(await brandApi.getTrims(year, brand, model)); } catch (e) {} finally { setLoadingTrims(false); }
  };

  const handleTrimSelect = async (trimId) => {
    if (!trimId) {
      setForm(p => ({ ...p, carapiTrimId: '', msrp: '', horsepower: '', engineSize: '', transmission: '', bodyType: '', doors: '' }));
      return;
    }
    try {
      const data = await brandApi.getTrimById(trimId);
      if (data) {
        setForm(p => ({
          ...p,
          carapiTrimId: String(data.id),
          fuelType: data.fuelType || p.fuelType,
          msrp: data.msrp ? String(data.msrp) : '',
          horsepower: data.horsepower ? String(data.horsepower) : '',
          engineSize: data.engineSize ? String(data.engineSize) : '',
          transmission: data.transmission || '',
          bodyType: data.bodyType || '',
          doors: data.doors ? String(data.doors) : '',
        }));
      }
    } catch (e) {}
  };

  const resetForm = () => {
    setForm({ brand: '', model: '', year: '', mileage: '', licensePlate: '', color: '', fuelType: 'GASOLINE', purchasePrice: '', carapiTrimId: '', msrp: '', horsepower: '', engineSize: '', transmission: '', bodyType: '', doors: '' });
    setPhoto(null); setModels([]); setTrims([]);
    setPlateInput(''); setPlateFound(false); setPlateError(''); setManualMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (photo) fd.append('photo', photo);
      await vehicleApi.create(fd);
      setShowModal(false); resetForm(); loadVehicles();
    } catch {} finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-white/10 border-t-accent animate-spin" />
      </div>
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 md:space-y-8">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-white font-display tracking-tight">Le Garage</h1>
          <p className="text-sm text-ink-muted mt-1">{vehicles.length} véhicule{vehicles.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowModal(true)} variant="accent" className="shadow-lg shadow-accent/20">
          <Plus className="w-4 h-4" strokeWidth={2.5} />Ajouter
        </Button>
      </motion.div>

      {vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {vehicles.map(v => (
            <motion.div variants={itemVariants} key={v.id}
              className="bento-card p-0 cursor-pointer group flex flex-col"
              onClick={() => navigate(`/vehicles/${v.id}`)}>
              <div className="aspect-[16/10] bg-[#121214] relative overflow-hidden">
                {v.photo ? (
                  <img src={v.photo} alt={`${v.brand} ${v.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center mesh-accent opacity-30 group-hover:opacity-50 transition-opacity duration-500">
                    <Car className="w-16 h-16 text-white/20 drop-shadow-2xl" strokeWidth={1} />
                  </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                <div className="absolute top-4 right-4 px-3 py-1 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs font-bold font-display">
                  {v.year}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors font-display tracking-tight">
                      {v.brand} {v.model}
                    </h3>
                    {v.licensePlate && (
                      <span className="inline-block mt-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-[11px] font-mono font-bold text-ink-light tracking-widest uppercase">
                        {v.licensePlate}
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:bg-accent/20 group-hover:border-accent/30 group-hover:text-accent transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-light">
                    <Gauge className="w-3.5 h-3.5 text-white/40" strokeWidth={2} />{v.mileage?.toLocaleString('fr-FR')} km
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-light">
                    <FileText className="w-3.5 h-3.5 text-white/40" strokeWidth={2} />{v._count?.documents || 0} doc
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div variants={itemVariants}>
          <EmptyState icon={Car} title="Aucun véhicule"
            description="Ajoutez votre premier véhicule pour commencer."
            action={<Button onClick={() => setShowModal(true)} variant="accent"><Plus className="w-4 h-4" />Ajouter</Button>} />
        </motion.div>
      )}

      {/* Plate scanner */}
      {showScanner && (
        <PlateScanModal
          onPlateFound={(plate) => {
            setPlateInput(plate);
            setShowScanner(false);
            // Auto-trigger lookup
            setTimeout(() => {
              setPlateLoading(true);
              setPlateError('');
              setPlateFound(false);
              brandApi.lookupPlate(plate)
                .then(data => {
                  setForm(p => ({
                    ...p,
                    brand: data.brand || '',
                    model: data.model || '',
                    year: data.year ? String(data.year) : '',
                    licensePlate: data.licensePlate || plate,
                    color: data.color || '',
                    fuelType: data.fuelType || 'GASOLINE',
                    horsepower: data.horsepower ? String(data.horsepower) : '',
                    engineSize: data.engineSize ? String(data.engineSize) : '',
                    transmission: data.transmission || '',
                    bodyType: data.bodyType || '',
                    doors: data.doors ? String(data.doors) : '',
                  }));
                  setPlateFound(true);
                })
                .catch(err => setPlateError(err.message || 'Plaque non trouvée.'))
                .finally(() => setPlateLoading(false));
            }, 0);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title="Nouveau véhicule">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!manualMode && !plateFound && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input label="Plaque d'immatriculation" placeholder="AB-123-CD" value={plateInput}
                    onChange={e => { setPlateInput(e.target.value); setPlateError(''); }}
                    onKeyDown={handlePlateKeyDown} />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="button" onClick={() => setShowScanner(true)} variant="dark" title="Scanner avec la caméra">
                    <ScanLine className="w-4 h-4 text-accent" />
                  </Button>
                  <Button type="button" onClick={handlePlateLookup} loading={plateLoading} variant="accent">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {plateError && <p className="text-xs font-semibold text-accent">{plateError}</p>}
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-ink-muted font-bold uppercase tracking-widest">ou</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <button type="button" onClick={() => setManualMode(true)}
                className="w-full text-center text-sm font-semibold text-ink-light hover:text-white transition-colors">
                Saisir manuellement
              </button>
            </div>
          )}

          {plateFound && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-lime/10 border border-lime/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
              <CheckCircle2 className="w-6 h-6 text-lime shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{form.brand} {form.model} ({form.year})</p>
                <p className="text-xs text-lime/70 mt-0.5">Véhicule trouvé — vérifiez les infos</p>
              </div>
              <span className="px-2 py-1 rounded-md bg-black/40 border border-white/10 text-[11px] font-mono font-bold text-white tracking-widest uppercase">
                {form.licensePlate}
              </span>
            </div>
          )}

          {(plateFound || manualMode) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select label="Année *" options={yearOpts} value={form.year} onChange={e => handleYearChange(e.target.value)} required />
                <Autocomplete label="Marque *" value={form.brand} options={brands} onChange={handleBrandChange} placeholder="Marque" required allowCustom />
                <Autocomplete label="Modèle *" value={form.model} options={models} onChange={handleModelChange} placeholder={loadingModels ? '...' : 'Modèle'} disabled={!form.brand || loadingModels} required allowCustom />
              </div>

              {trims.length > 0 && (
                <Select label="Finition" options={[{ value: '', label: loadingTrims ? '...' : 'Sélectionner...' }, ...trims.map(t => ({ value: String(t.id), label: `${t.name}${t.msrp ? ` — ${t.msrp.toLocaleString('fr-FR')} $` : ''}` }))]} value={form.carapiTrimId} onChange={e => handleTrimSelect(e.target.value)} />
              )}

              {(form.horsepower || form.transmission || form.bodyType || form.doors) && (
                <div className="flex flex-wrap gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  {form.horsepower && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent/20 text-[11px] font-bold text-accent"><Zap className="w-3 h-3" />{form.horsepower} ch</span>}
                  {form.engineSize && <span className="px-2.5 py-1 rounded-md bg-white/5 text-[11px] font-semibold text-ink-light">{form.engineSize}L</span>}
                  {form.transmission && <span className="px-2.5 py-1 rounded-md bg-white/5 text-[11px] font-semibold text-ink-light">{form.transmission}</span>}
                  {form.bodyType && <span className="px-2.5 py-1 rounded-md bg-white/5 text-[11px] font-semibold text-ink-light">{form.bodyType}</span>}
                  {form.doors && <span className="px-2.5 py-1 rounded-md bg-white/5 text-[11px] font-semibold text-ink-light">{form.doors} p</span>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input label="Kilométrage" type="number" placeholder="45000" value={form.mileage} onChange={e => setForm(p => ({ ...p, mileage: e.target.value }))} />
                <Select label="Carburant" options={fuelOpts} value={form.fuelType} onChange={e => setForm(p => ({ ...p, fuelType: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Plaque" placeholder="AB-123-CD" value={form.licensePlate} onChange={e => setForm(p => ({ ...p, licensePlate: e.target.value }))} />
                <Input label="Couleur" placeholder="Noir" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prix d'achat (€)" type="number" step="0.01" placeholder="25000" value={form.purchasePrice} onChange={e => setForm(p => ({ ...p, purchasePrice: e.target.value }))} />
                <div />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-ink">Photo</label>
                <label className="flex items-center justify-center gap-2 w-full py-4 bg-white/[0.02] border border-white/10 border-dashed rounded-xl cursor-pointer text-sm text-ink-muted hover:bg-white/[0.04] hover:border-accent/50 transition-all">
                  <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} className="hidden" />
                  {photo ? <span className="text-accent font-semibold">{photo.name}</span> : 'Uploader une image'}
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <Button variant="ghost" type="button" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</Button>
                <Button type="submit" loading={submitting} variant="accent">Ajouter au garage</Button>
              </div>
            </motion.div>
          )}
        </form>
      </Modal>
    </motion.div>
  );
}
