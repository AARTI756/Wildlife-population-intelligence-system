import React from 'react';
import { HelpCircle } from 'lucide-react';

const EmptyState = ({ 
  title = 'No Data Available', 
  description = 'No telemetry datasets have been recorded for this module yet.', 
  icon: Icon = HelpCircle, 
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center rounded-xl bg-slate-50/40 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 min-h-[160px] ${className}`}>
      <Icon className="h-8 w-8 text-slate-400 dark:text-slate-600 mb-2.5" />
      <h4 className="text-xs font-bold text-slate-705 dark:text-slate-350">{title}</h4>
      <p className="text-3xs text-slate-550 dark:text-slate-500 max-w-xs mt-1.5 leading-relaxed font-semibold">
        {description}
      </p>
    </div>
  );
};

export default EmptyState;
