import React from 'react';

const MetricCard = ({
  title,
  value,
  icon: Icon,
  colorClass = 'text-emerald-650 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/30 border-emerald-200 dark:border-emerald-900/30',
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
      className={`glass-card p-5 flex items-center justify-between border-slate-202 dark:border-slate-805 shadow-sm transition-all duration-300 ${
        isClickable ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 hover:shadow-md hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className="space-y-1 overflow-hidden pr-2">
        <span className="text-2xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block truncate">
          {title}
        </span>
        <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
          {value}
        </p>
        {(subtext || trendValue) && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {trendValue && (
              <span className={`text-4xs font-bold px-1 py-0.2 rounded ${
                trend === 'positive' 
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                  : trend === 'negative' 
                    ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-450' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {trendValue}
              </span>
            )}
            {subtext && (
              <span className="text-4xs text-slate-500 dark:text-slate-500 font-semibold truncate">
                {subtext}
              </span>
            )}
          </div>
        )}
        {lastUpdated && (
          <span className="text-5xs text-slate-400 dark:text-slate-500 font-bold block pt-1 uppercase tracking-wider">
            Updated: {lastUpdated}
          </span>
        )}
      </div>
      {Icon && (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
};

export default MetricCard;
