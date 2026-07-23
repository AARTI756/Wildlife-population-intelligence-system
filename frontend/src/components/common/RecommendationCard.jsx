import React from 'react';
import { ArrowUpRight, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

const RecommendationCard = ({
  title,
  description,
  priority = 'medium', // critical, high, medium, low
  category = 'General',
  impact = 'Medium',
  cost = 'Medium',
  actionText = 'Implement Strategy',
  onAction,
  completion_time,
  department,
  expected_impact,
  estimated_cost,
  priority_score,
  className = ''
}) => {
  const getPriorityStyle = (p) => {
    switch (p.toLowerCase()) {
      case 'critical':
        return 'bg-rose-50 dark:bg-rose-955/30 text-rose-700 dark:text-rose-400 border-rose-250 dark:border-rose-900/30';
      case 'high':
        return 'bg-amber-50 dark:bg-amber-955/30 text-amber-700 dark:text-amber-400 border-amber-250 dark:border-amber-900/30';
      case 'medium':
        return 'bg-emerald-50 dark:bg-emerald-955/30 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/30';
      case 'low':
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const getPriorityIcon = (p) => {
    switch (p.toLowerCase()) {
      case 'critical':
        return <ShieldAlert className="h-3.5 w-3.5" />;
      case 'high':
      case 'medium':
        return <Sparkles className="h-3.5 w-3.5" />;
      case 'low':
      default:
        return <CheckCircle2 className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/45 hover:border-emerald-500/25 transition-all shadow-xs flex flex-col justify-between gap-4 ${className}`}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-4xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {category}
            </span>
            {department && (
              <span className="text-5xs text-slate-500 dark:text-slate-400 font-medium">
                {department}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {priority_score && (
              <span className="text-5xs font-mono font-bold text-slate-400 dark:text-slate-550">
                Score: {priority_score}
              </span>
            )}
            <span className={`text-4xs font-bold uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${getPriorityStyle(priority)}`}>
              {getPriorityIcon(priority)}
              {priority}
            </span>
          </div>
        </div>
        
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
          {title}
        </h4>
        <p className="text-3xs text-slate-655 dark:text-slate-400 leading-relaxed font-semibold">
          {description}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-slate-600 dark:text-slate-400">
          <div>
            <span className="text-5xs uppercase tracking-wider text-slate-400 font-bold block">Expected Impact</span>
            <span className="text-4xs font-extrabold text-slate-700 dark:text-slate-350">{expected_impact || impact}</span>
          </div>
          <div>
            <span className="text-5xs uppercase tracking-wider text-slate-400 font-bold block">Estimated Cost</span>
            <span className="text-4xs font-extrabold text-slate-700 dark:text-slate-350">{estimated_cost || cost}</span>
          </div>
          {completion_time && (
            <div className="col-span-2">
              <span className="text-5xs uppercase tracking-wider text-slate-400 font-bold block">Est. Completion Time</span>
              <span className="text-4xs font-extrabold text-slate-700 dark:text-slate-350">{completion_time}</span>
            </div>
          )}
        </div>

        {onAction && (
          <button
            onClick={onAction}
            className="flex items-center justify-center gap-1 w-full mt-2 py-1.5 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-3xs font-bold transition-all"
          >
            {actionText}
            <ArrowUpRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RecommendationCard;
