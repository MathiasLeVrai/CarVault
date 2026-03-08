import { Heart, Wrench, FileCheck } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

const getScoreColor = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ff2a3f';
};

const getGradeLabel = (grade) => {
  const labels = { A: 'Excellent', B: 'Bon', C: 'Moyen', D: 'À améliorer' };
  return labels[grade] || '';
};

function ScoreGauge({ score, grade, size = 140 }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          strokeLinecap="round" className="transition-all duration-1000 ease-out drop-shadow-[0_0_12px_currentColor]" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-white font-display tracking-tighter">{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color }}>{getGradeLabel(grade)}</span>
      </div>
    </div>
  );
}

function SubScoreBar({ icon, label, score, max, color }) {
  const IconComponent = icon;
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0">
        <IconComponent className="w-4 h-4 text-white/60" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-white uppercase tracking-wider">{label}</span>
          <span className="text-xs font-bold text-white/50 font-mono">{score}/{max}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%`, backgroundColor: color || getScoreColor((score/max)*100),
              boxShadow: `0 0 12px ${(color || getScoreColor((score/max)*100))}80` }} />
        </div>
      </div>
    </div>
  );
}

export default function VehicleHealthCard({ health, variants }) {
  if (!health) return null;

  return (
    <Motion.div variants={variants} className="lg:col-span-1 cv-card-dark p-6 md:p-8 flex flex-col items-center justify-center text-center">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display mb-8">
        <Heart className="w-5 h-5 text-accent" strokeWidth={2.5} />Score Santé
      </h3>
      <ScoreGauge score={health.score} grade={health.grade} size={160} />
      <div className="w-full space-y-5 mt-10">
        <SubScoreBar icon={Wrench} label="Entretien" score={health.breakdown.maintenance.score} max={health.breakdown.maintenance.max} />
        <SubScoreBar icon={FileCheck} label="Documents" score={health.breakdown.documents.score} max={health.breakdown.documents.max} />
      </div>
    </Motion.div>
  );
}
