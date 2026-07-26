import React from 'react';

const EcosystemHealthCard = ({ healthData }) => {
  if (!healthData) return null;

  const { overall_score, status, component_scores } = healthData;

  // Color mapping based on status
  const getColorClass = (statusName) => {
    switch (statusName) {
      case 'Excellent':
        return { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500', stroke: '#10b981' };
      case 'Healthy':
        return { text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500', stroke: '#3b82f6' };
      case 'Moderate Concern':
        return { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500', stroke: '#f59e0b' };
      case 'Vulnerable':
        return { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500', stroke: '#ef4444' };
      case 'Critical':
        return { text: 'text-rose-700', bg: 'bg-rose-700/10', border: 'border-rose-700', stroke: '#b91c1c' };
      default:
        return { text: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500', stroke: '#64748b' };
    }
  };

  const colors = getColorClass(status);

  // SVG parameters for circular progress
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overall_score / 100) * circumference;

  // Helper to map keys to readable labels
  const getLabel = (key) => {
    const labels = {
      species_diversity: 'Species Diversity',
      population_stability: 'Population Stability',
      habitat_quality: 'Habitat Quality',
      endangered_species: 'Endangered Species Status',
      environmental_conditions: 'Environmental Conditions'
    };
    return labels[key] || key;
  };

  return (
    <div className={`glass-card p-6 border-l-4 ${colors.border} shadow-lg relative flex flex-col justify-between h-full bg-slate-900/40 backdrop-blur-md`}>
      <div>
        <h3 className="text-md font-extrabold text-slate-100 mb-4 tracking-wide uppercase">Ecosystem Health</h3>
        
        <div className="flex items-center gap-6 mb-6">
          {/* Circular Progress Gauge */}
          <div className="relative flex items-center justify-center shrink-0 w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-slate-700 fill-none"
                strokeWidth="7"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="fill-none transition-all duration-500 ease-out"
                stroke={colors.stroke}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-black text-slate-100 tracking-tighter leading-none">{overall_score}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">/100</span>
            </div>
          </div>

          {/* Rating Info */}
          <div className="space-y-1">
            <span className="text-4xs uppercase tracking-widest text-slate-400 font-bold">Status Rating</span>
            <div className={`text-2xl font-black uppercase tracking-tight ${colors.text}`}>{status}</div>
            <p className="text-5xs text-slate-400 leading-relaxed font-medium">
              Ecosystem suitability index based on multi-sensor telemetry indices.
            </p>
          </div>
        </div>
      </div>

      {/* Component Breakdown */}
      {component_scores && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <span className="text-4xs uppercase tracking-widest text-slate-400 font-bold block mb-1">Index Breakdown</span>
          {Object.entries(component_scores).map(([key, value]) => {
            const compColor = value >= 90 ? 'bg-emerald-500' : (value >= 75 ? 'bg-blue-500' : (value >= 60 ? 'bg-amber-500' : 'bg-rose-600'));
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-5xs font-bold text-slate-300">
                  <span>{getLabel(key)}</span>
                  <span>{value}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full ${compColor} rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EcosystemHealthCard;
