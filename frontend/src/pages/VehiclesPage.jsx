import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleApi, brandApi } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Autocomplete from '../components/ui/Autocomplete';
import EmptyState from '../components/ui/EmptyState';
import { Car, Plus, FileText, Wallet, ArrowUpRight, Gauge, Zap, Search, CheckCircle2 } from 'lucide-react';

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

  // ===== Plate lookup =====
  const handlePlateLookup = async () => {
    if (!plateInput.trim()) return;
    setPlateLoading(true);
    setPlateError('');
    setPlateFound(false);
    try {
      const data = await brandApi.lookupPlate(plateInput.trim());
      // Auto-fill the form
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
      setPlateError('Plaque non trouvée. Vous pouvez saisir manuellement.');
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

  // ===== Brand/model selection (manual mode) =====
  const handleBrandChange = async (brand) => {
    setForm(p => ({ ...p, brand, model: '', carapiTrimId: '', msrp: '', horsepower: '', engineSize: '', transmission: '', bodyType: '', doors: '' }));
    setModels([]); setTrims([]);
    if (!brand) return;
    setLoadingModels(true);
    try { setModels(await brandApi.getModels(brand)); } catch (e) { console.error('Erreur modèles:', e); } finally { setLoadingModels(false); }
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
    try { setTrims(await brandApi.getTrims(year, brand, model)); } catch (e) { console.error('Erreur trims:', e); } finally { setLoadingTrims(false); }
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
    } catch (e) { console.error('Erreur trim:', e); }
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
    } catch { console.error('Erreur lors de la création du véhicule'); } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-ink font-display">Mes Véhicules</h1>
          <p className="text-sm text-ink-light mt-1">{vehicles.length} véhicule{vehicles.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" strokeWidth={2.5} />Ajouter</Button>
      </div>

      {vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger">
          {vehicles.map(v => (
            <div key={v.id} className="cv-card p-0 cursor-pointer group overflow-hidden"
              onClick={() => navigate(`/vehicles/${v.id}`)}>
              <div className="aspect-video bg-bg-alt relative overflow-hidden border-b border-ink/6">
                {v.photo ? (
                  <img src={v.photo} alt={`${v.brand} ${v.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-12 h-12 text-ink-faint" strokeWidth={1.5} />
                  </div>
                )}
                <div className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-accent text-white text-xs font-bold font-display shadow-[0_2px_8px_rgba(230,57,70,0.3)]">
                  {v.year}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-ink group-hover:text-accent transition-colors font-display">
                      {v.brand} {v.model}
                    </h3>
                    {v.licensePlate && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-bg-alt border border-ink/8 text-[11px] font-mono font-semibold text-ink-light tracking-wider">
                        {v.licensePlate}
                      </span>
                    )}
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-ink-faint group-hover:text-accent transition-colors" />
                </div>
                <div className="flex items-center gap-5 pt-3 border-t border-ink/8">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-ink-light">
                    <Gauge className="w-3.5 h-3.5" strokeWidth={2} />{v.mileage?.toLocaleString('fr-FR')} km
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-ink-light">
                    <FileText className="w-3.5 h-3.5" strokeWidth={2} />{v._count?.documents || 0}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-ink-light">
                    <Wallet className="w-3.5 h-3.5" strokeWidth={2} />{v._count?.expenses || 0}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Car} title="Aucun véhicule"
          description="Ajoutez votre premier véhicule pour commencer."
          action={<Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Ajouter</Button>} />
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title="Nouveau véhicule">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ===== Plate lookup section ===== */}
          {!manualMode && !plateFound && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    label="Plaque d'immatriculation"
                    placeholder="AB-123-CD"
                    value={plateInput}
                    onChange={e => { setPlateInput(e.target.value); setPlateError(''); }}
                    onKeyDown={handlePlateKeyDown}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={handlePlateLookup} loading={plateLoading} size="md">
                    <Search className="w-4 h-4" />Rechercher
                  </Button>
                </div>
              </div>
              {plateError && (
                <p className="text-xs font-medium text-accent-warm">{plateError}</p>
              )}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-ink/8" />
                <span className="text-xs text-ink-muted font-medium">ou</span>
                <div className="flex-1 h-px bg-ink/8" />
              </div>
              <button type="button" onClick={() => setManualMode(true)}
                className="w-full text-center text-sm font-medium text-ink-light hover:text-accent transition-colors py-1">
                Saisir manuellement
              </button>
            </div>
          )}

          {/* ===== Plate found banner ===== */}
          {plateFound && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-lime/10 border border-lime/20">
              <CheckCircle2 className="w-5 h-5 text-lime shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">
                  {form.brand} {form.model} ({form.year})
                </p>
                <p className="text-xs text-ink-muted">Véhicule trouvé — vérifiez et complétez les infos</p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-bg-alt border border-ink/8 text-[11px] font-mono font-bold text-ink-light tracking-wider">
                {form.licensePlate}
              </span>
            </div>
          )}

          {/* ===== Vehicle details (shown after plate lookup or in manual mode) ===== */}
          {(plateFound || manualMode) && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Select label="Année *" options={yearOpts} value={form.year}
                  onChange={e => handleYearChange(e.target.value)} required />
                <Autocomplete label="Marque *" value={form.brand} options={brands}
                  onChange={handleBrandChange} placeholder="Marque" required allowCustom />
                <Autocomplete label="Modèle *" value={form.model} options={models}
                  onChange={handleModelChange} placeholder={loadingModels ? 'Chargement...' : 'Modèle'}
                  disabled={!form.brand || loadingModels} required allowCustom />
              </div>

              {trims.length > 0 && (
                <div>
                  <Select label="Finition (auto-remplir les specs)"
                    options={[
                      { value: '', label: loadingTrims ? 'Chargement...' : 'Sélectionner une finition...' },
                      ...trims.map(t => ({ value: String(t.id), label: `${t.name}${t.msrp ? ` — ${t.msrp.toLocaleString('fr-FR')} $` : ''}` })),
                    ]}
                    value={form.carapiTrimId}
                    onChange={e => handleTrimSelect(e.target.value)}
                  />
                </div>
              )}

              {/* Show detected specs */}
              {(form.horsepower || form.transmission || form.bodyType || form.doors) && (
                <div className="flex flex-wrap gap-2">
                  {form.horsepower && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 text-[11px] font-bold text-accent"><Zap className="w-3 h-3" />{form.horsepower} ch</span>}
                  {form.engineSize && <span className="px-2 py-0.5 rounded-md bg-bg-alt text-[11px] font-semibold text-ink-light">{form.engineSize}L</span>}
                  {form.transmission && <span className="px-2 py-0.5 rounded-md bg-bg-alt text-[11px] font-semibold text-ink-light">{form.transmission}</span>}
                  {form.bodyType && <span className="px-2 py-0.5 rounded-md bg-bg-alt text-[11px] font-semibold text-ink-light">{form.bodyType}</span>}
                  {form.doors && <span className="px-2 py-0.5 rounded-md bg-bg-alt text-[11px] font-semibold text-ink-light">{form.doors} portes</span>}
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
                <label className="flex items-center justify-center gap-2 w-full py-3 cv-input cursor-pointer text-sm text-ink-muted hover:bg-bg-alt transition-colors">
                  <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} className="hidden" />
                  {photo ? photo.name : 'Sélectionner une photo...'}
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</Button>
                <Button type="submit" loading={submitting}>Ajouter</Button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}
