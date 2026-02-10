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
import { Car, Plus, FileText, Wallet, ArrowUpRight, Gauge } from 'lucide-react';

const fuelOpts = [
  { value: 'GASOLINE', label: 'Essence' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'HYBRID', label: 'Hybride' },
  { value: 'ELECTRIC', label: 'Électrique' },
  { value: 'LPG', label: 'GPL' },
  { value: 'OTHER', label: 'Autre' },
];

export default function VehiclesPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ brand: '', model: '', year: '', mileage: '', licensePlate: '', color: '', fuelType: 'GASOLINE' });
  const [photo, setPhoto] = useState(null);

  // Marques et modèles depuis l'API
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => { loadVehicles(); loadBrands(); }, []);

  const loadVehicles = async () => {
    try { setVehicles(await vehicleApi.getAll()); } catch {} finally { setLoading(false); }
  };

  const loadBrands = async () => {
    try { setBrands(await brandApi.getAll()); } catch (e) { console.error('Erreur chargement marques:', e); }
  };

  // Charger les modèles quand la marque change
  const handleBrandChange = async (brand) => {
    setForm(p => ({ ...p, brand, model: '' }));
    setModels([]);
    if (!brand) return;
    setLoadingModels(true);
    try {
      const m = await brandApi.getModels(brand);
      setModels(m);
    } catch (e) {
      console.error('Erreur chargement modèles:', e);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleModelChange = (model) => {
    setForm(p => ({ ...p, model }));
  };

  const resetForm = () => {
    setForm({ brand: '', model: '', year: '', mileage: '', licensePlate: '', color: '', fuelType: 'GASOLINE' });
    setPhoto(null);
    setModels([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (photo) fd.append('photo', photo);
      await vehicleApi.create(fd);
      setShowModal(false);
      resetForm();
      loadVehicles();
    } catch {} finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-ink border-t-lime rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-black text-ink">Mes Véhicules</h1>
          <p className="text-sm text-ink-light mt-1">{vehicles.length} véhicule{vehicles.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" strokeWidth={2.5} />Ajouter</Button>
      </div>

      {vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger">
          {vehicles.map(v => (
            <div key={v.id} className="nb-card p-0 cursor-pointer group overflow-hidden"
              onClick={() => navigate(`/vehicles/${v.id}`)}>
              {/* Image */}
              <div className="aspect-[16/9] bg-bg-alt relative overflow-hidden border-b-2 border-ink">
                {v.photo ? (
                  <img src={v.photo} alt={`${v.brand} ${v.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-12 h-12 text-ink-faint" strokeWidth={1.5} />
                  </div>
                )}
                <div className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-lime border-2 border-ink text-xs font-black text-ink shadow-[2px_2px_0_#1a1a1a]">
                  {v.year}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-black text-ink group-hover:text-violet transition-colors">
                      {v.brand} {v.model}
                    </h3>
                    {v.licensePlate && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-bg-alt border border-ink/20 text-[11px] font-mono font-bold text-ink-light tracking-wider">
                        {v.licensePlate}
                      </span>
                    )}
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-ink-faint group-hover:text-violet transition-colors" />
                </div>

                <div className="flex items-center gap-5 pt-3 border-t-2 border-ink/10">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-ink-light">
                    <Gauge className="w-3.5 h-3.5" strokeWidth={2.2} />{v.mileage?.toLocaleString('fr-FR')} km
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-ink-light">
                    <FileText className="w-3.5 h-3.5" strokeWidth={2.2} />{v._count?.documents || 0}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-ink-light">
                    <Wallet className="w-3.5 h-3.5" strokeWidth={2.2} />{v._count?.expenses || 0}
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
          <div className="grid grid-cols-2 gap-3">
            <Autocomplete
              label="Marque *"
              value={form.brand}
              options={brands}
              onChange={handleBrandChange}
              placeholder="Sélectionner une marque"
              required
            />
            <Autocomplete
              label="Modèle *"
              value={form.model}
              options={models}
              onChange={handleModelChange}
              placeholder={loadingModels ? 'Chargement...' : 'Sélectionner un modèle'}
              disabled={!form.brand || loadingModels}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Année *" type="number" placeholder="2023" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} required />
            <Input label="Kilométrage" type="number" placeholder="45000" value={form.mileage} onChange={e => setForm(p => ({ ...p, mileage: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Plaque" placeholder="AB-123-CD" value={form.licensePlate} onChange={e => setForm(p => ({ ...p, licensePlate: e.target.value }))} />
            <Select label="Carburant" options={fuelOpts} value={form.fuelType} onChange={e => setForm(p => ({ ...p, fuelType: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Couleur" placeholder="Noir" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} />
            <div />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-ink">Photo</label>
            <label className="flex items-center justify-center gap-2 w-full py-3 nb-input cursor-pointer text-sm text-ink-muted hover:bg-bg-alt transition-colors">
              <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} className="hidden" />
              {photo ? photo.name : 'Sélectionner une photo...'}
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</Button>
            <Button type="submit" loading={submitting}>Ajouter</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
