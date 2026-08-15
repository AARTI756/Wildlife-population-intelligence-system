import React from 'react';

const MetricCard = ({
  title,
  value,
  icon: Icon,
  colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200',
  subtext,
  trend, // positive, negative, neutral
  trendValue,
  lastUpdated,
  onClick,
  className = ''
}) => {
  const isClickable = !!onClick;
  
  return (
    <div 
      onClick={onClick}
      className={`glass-card h-full min-h-[140px] p-4 flex flex-col justify-between relative border-slate-200 shadow-sm transition-all duration-300 ${
        isClickable ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-slate-50/20 hover:shadow-md hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {/* Header */}
      <div className="w-full pr-12">
        <span className="text-[10px] sm:text-2xs font-bold text-slate-500 uppercase tracking-wider block leading-tight whitespace-normal break-words line-clamp-2">
          {title}
        </span>
      </div>

      {/* Primary Metric & Badge */}
      <div className="mt-2 w-full flex flex-col items-start gap-1">
        <p className="text-xl font-extrabold text-slate-900 tracking-tight whitespace-normal break-words">
          {value}
        </p>
        {trendValue && !['+1 Zone', '+1 Alert', '+1.8%', '+12.4%', '+0.8%', '-1.4%'].includes(trendValue) && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none ${
            trend === 'positive' 
              ? 'bg-emerald-100 text-emerald-700' 
              : trend === 'negative' 
                ? 'bg-rose-100 text-rose-700' 
                : 'bg-slate-100 text-slate-600'
          }`}>
            {trendValue}
          </span>
        )}
      </div>

      {/* Secondary Description */}
      {subtext && (
        <div className="mt-1.5 w-full text-[10px] text-slate-500 font-semibold whitespace-normal break-words pr-12 leading-tight">
          {subtext}
        </div>
      )}

      {/* Footer (Timestamp) */}
      {lastUpdated && (
        <div className="mt-auto pt-2 w-full pr-12">
          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider leading-none">
            Updated: {lastUpdated}
          </span>
        </div>
      )}

      {/* Action Icon in bottom right */}
      {Icon && (
        <div className={`absolute bottom-4 right-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${colorClass}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      )}
    </div>
  );
};

export default MetricCard;
