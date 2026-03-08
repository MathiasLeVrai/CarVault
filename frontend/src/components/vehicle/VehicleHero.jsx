import { ArrowLeft, Pencil, Share2, FileDown, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { motion as Motion } from 'framer-motion';

export default function VehicleHero({ vehicle, onBack, onEdit, onShare, onDownloadPdf, onDelete, generatingPdf, variants }) {
  return (
    <Motion.div variants={variants} className="relative rounded-3xl overflow-hidden bg-[#121214] border border-white/10 shadow-2xl group">
      <div className="absolute inset-0 mesh-accent opacity-30 mix-blend-screen pointer-events-none" />
      {vehicle.photo && (
        <div className="absolute inset-0">
          <img src={vehicle.photo} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000 ease-out" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent" />
        </div>
      )}
      <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all shrink-0 backdrop-blur-md">
            <ArrowLeft className="w-5 h-5 text-white" strokeWidth={2} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold text-white font-display tracking-widest">{vehicle.year}</span>
              {vehicle.licensePlate && <span className="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-mono font-bold text-white tracking-widest uppercase">{vehicle.licensePlate}</span>}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white font-display tracking-tight leading-none">
              {vehicle.brand} <span className="text-white/60">{vehicle.model}</span>
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
          <Button variant="outline" onClick={onEdit} className="flex-1 md:flex-none border-white/20 text-white hover:bg-white/10">
            <Pencil className="w-4 h-4" />Modifier
          </Button>
          <Button variant="outline" onClick={onShare} className="flex-1 md:flex-none border-white/20 text-white hover:bg-white/10">
            <Share2 className="w-4 h-4" />Partager
          </Button>
          <Button variant="outline" onClick={onDownloadPdf} loading={generatingPdf} className="flex-1 md:flex-none border-white/20 text-white hover:bg-white/10">
            <FileDown className="w-4 h-4" />PDF
          </Button>
          <Button variant="danger" onClick={onDelete} className="px-3">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Motion.div>
  );
}
