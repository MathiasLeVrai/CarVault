import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Link2Off, RefreshCw, Fuel, ChevronDown, Loader2, CheckCircle2, AlertTriangle, Search, Building2 } from 'lucide-react';
import { bankApi, vehicleApi, fuelApi } from '../services/api';
import { useToast } from '../context/ToastContext';

// ── Helper: format date ──────────────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Bank card ────────────────────────────────────────────────────────────────
function BankCard({ bank, onSelect }) {
  return (
    <button
      onClick={() => onSelect(bank)}
      className="cv-card p-4 text-left hover:border-white/20 transition-all flex items-center gap-3"
    >
      {bank.logo
        ? <img src={bank.logo} alt={bank.name} className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5" />
        : <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Building2 className="w-4 h-4 text-white/40" /></div>
      }
      <span className="text-sm font-semibold text-white">{bank.name}</span>
    </button>
  );
}

// ── Transaction row ──────────────────────────────────────────────────────────
function TxRow({ tx, vehicles, onImport, imported }) {
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
  const [liters, setLiters] = useState('');
  const [mileage, setMileage] = useState('');
  const [open, setOpen] = useState(false);

  const currentVehicle = vehicles.find(v => v.id === vehicleId);

  return (
    <div className="cv-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{tx.description}</p>
          <p className="text-xs text-white/40 mt-0.5">{fmtDate(tx.date)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-black text-white">{tx.amount.toFixed(2)} €</p>
          {!imported ? (
            <button
              onClick={() => setOpen(v => !v)}
              className="text-[11px] font-bold text-accent hover:text-white transition-colors mt-1 flex items-center gap-1 ml-auto"
            >
              Importer <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <span className="text-[11px] font-bold text-lime flex items-center gap-1 mt-1 ml-auto">
              <CheckCircle2 className="w-3 h-3" /> Importé
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && !imported && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-white/8 space-y-3">
              {vehicles.length > 1 && (
                <div>
                  <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Véhicule</label>
                  <select
                    value={vehicleId}
                    onChange={e => setVehicleId(e.target.value)}
                    className="cv-input w-full px-3 py-2 text-sm text-white"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.brand} {v.model}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1.5">
                    Litres (optionnel)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="42.5"
                    value={liters}
                    onChange={e => setLiters(e.target.value)}
                    className="cv-input w-full px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1.5">
                    Km actuel
                  </label>
                  <input
                    type="number"
                    placeholder={currentVehicle?.mileage || '45000'}
                    value={mileage}
                    onChange={e => setMileage(e.target.value)}
                    className="cv-input w-full px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <button
                onClick={() => onImport(tx, vehicleId, liters ? parseFloat(liters) : null, mileage ? parseInt(mileage) : (currentVehicle?.mileage || 1))}
                disabled={!vehicleId}
                className="w-full py-2.5 rounded-xl cv-btn-accent text-sm font-bold disabled:opacity-40"
              >
                Créer l'entrée carburant
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function BankPage() {
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [banks, setBanks] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [fuelTxs, setFuelTxs] = useState([]);
  const [importedIds, setImportedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [connecting, setConnecting] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const [s, v] = await Promise.all([bankApi.getStatus(), vehicleApi.getAll()]);
      setStatus(s);
      setVehicles(v);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadBanks = useCallback(async () => {
    try {
      const { banks: list } = await bankApi.listInstitutions();
      setBanks(list || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Check if coming back from bank OAuth
  useEffect(() => {
    if (window.location.pathname.includes('/bank/callback')) {
      bankApi.callback()
        .then(() => { toast.success('Compte bancaire connecté !'); loadStatus(); })
        .catch(() => toast.error('Erreur lors de la connexion bancaire'));
    }
  }, []);

  const handleSelectBank = async (bank) => {
    setConnecting(true);
    try {
      const { link } = await bankApi.connect(bank.id, bank.name);
      window.location.href = link;
    } catch (err) {
      toast.error(err.message || 'Erreur de connexion');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await bankApi.disconnect();
      setStatus(s => ({ ...s, connection: null }));
      setFuelTxs([]);
      toast.success('Compte déconnecté');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const loadFuelTxs = async () => {
    setTxLoading(true);
    try {
      const { transactions } = await bankApi.detectFuel();
      setFuelTxs(transactions);
      if (transactions.length === 0) toast.info('Aucun paiement carburant détecté dans les 60 derniers jours.');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la récupération');
    } finally {
      setTxLoading(false);
    }
  };

  const handleImport = async (tx, vehicleId, liters, mileage) => {
    try {
      const pricePerLiter = liters ? parseFloat((tx.amount / liters).toFixed(4)) : tx.amount / 50;
      await fuelApi.create(vehicleId, {
        mileage: mileage || 1,
        liters: liters || 50,
        pricePerLiter,
        totalCost: tx.amount,
        isFull: !liters,
        date: new Date(tx.date).toISOString(),
        notes: `Importé depuis ${tx.description}`,
      });
      setImportedIds(prev => new Set([...prev, tx.id]));
      toast.success('Plein importé !');
    } catch {
      toast.error('Erreur lors de l\'import');
    }
  };

  const filteredBanks = banks.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
  const isConnected = status?.connection?.status === 'linked';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black font-display text-white tracking-tight">Compte bancaire</h1>
        <p className="text-sm text-white/40 mt-1">
          Connectez votre banque pour détecter automatiquement vos paiements à la pompe.
        </p>
      </div>

      {/* Not configured */}
      {!status?.configured && (
        <div className="cv-card p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Open Banking non configuré</p>
            <p className="text-xs text-white/50 mt-1 leading-relaxed">
              Pour activer cette fonctionnalité, ajoutez vos clés GoCardless (Nordigen) dans les variables d'environnement backend :
              <code className="ml-1 px-1 py-0.5 rounded bg-white/10 text-xs text-white/70">NORDIGEN_SECRET_ID</code>
              {' '}et{' '}
              <code className="px-1 py-0.5 rounded bg-white/10 text-xs text-white/70">NORDIGEN_SECRET_KEY</code>
            </p>
          </div>
        </div>
      )}

      {/* Connected state */}
      {status?.configured && isConnected && (
        <div className="space-y-4">
          <div className="cv-card p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lime/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-lime" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{status.connection.institutionName}</p>
                <p className="text-xs text-lime font-semibold">Connecté</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl cv-btn-dark text-xs font-bold text-white/60 hover:text-accent"
            >
              <Link2Off className="w-3.5 h-3.5" /> Déconnecter
            </button>
          </div>

          {/* Detect fuel transactions */}
          <div className="cv-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-white font-display">Paiements carburant détectés</h3>
                <p className="text-xs text-white/40 mt-0.5">60 derniers jours · Détection automatique</p>
              </div>
              <button
                onClick={loadFuelTxs}
                disabled={txLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl cv-btn-dark text-xs font-bold"
              >
                {txLoading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <RefreshCw className="w-3.5 h-3.5 text-accent" />
                }
                Analyser
              </button>
            </div>

            {fuelTxs.length > 0 ? (
              <div className="space-y-3">
                {fuelTxs.map(tx => (
                  <TxRow
                    key={tx.id}
                    tx={tx}
                    vehicles={vehicles}
                    imported={importedIds.has(tx.id)}
                    onImport={handleImport}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/25">
                <Fuel className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Cliquez sur "Analyser" pour détecter vos pleins</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bank selection */}
      {status?.configured && !isConnected && (
        <div className="cv-card p-5">
          <h3 className="text-sm font-black text-white font-display mb-1">Connecter ma banque</h3>
          <p className="text-xs text-white/40 mb-4">Accès sécurisé PSD2 · Lecture seule · 90 jours d'historique</p>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Rechercher votre banque…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => !banks.length && loadBanks()}
              className="cv-input w-full pl-9 pr-4 py-3 text-sm text-white"
            />
          </div>

          {!banks.length && !search && (
            <button
              onClick={loadBanks}
              className="w-full py-3 rounded-xl cv-btn-dark text-sm font-semibold text-white/60 flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" /> Charger les banques françaises
            </button>
          )}

          {connecting && (
            <div className="flex items-center justify-center py-6 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
              <span className="text-sm text-white/60">Redirection vers votre banque…</span>
            </div>
          )}

          {!connecting && filteredBanks.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredBanks.map(bank => (
                <BankCard key={bank.id} bank={bank} onSelect={handleSelectBank} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
