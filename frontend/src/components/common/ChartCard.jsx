import React from 'react';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import { AlertCircle, BarChart4 } from 'lucide-react';

const ChartCard = ({
  title,
  subtitle,
  loading = false,
  error = null,
  isEmpty = false,
  emptyTitle = 'No Sighting Data Found',
  emptyDescription = 'Select another filter or check back later once survey analysis finishes.',
  children,
  height = 'h-64',
  className = ''
}) => {
  return (
    <div className={`glass-card p-6 flex flex-col justify-between border-slate-202 dark:border-slate-805 shadow-sm min-h-[320px] ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white whitespace-normal break-words leading-snug">
            {title}
          </h3>
          {subtitle && (
            <p className="text-3xs text-slate-550 dark:text-slate-400 mt-0.5 font-semibold whitespace-normal break-words leading-snug">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className={`flex-1 w-full relative ${height} flex items-center justify-center`}>
        {loading ? (
          <LoadingState message="Fetching analytics telemetry..." />
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-rose-600 dark:text-rose-450">
            <AlertCircle className="h-8 w-8 mb-2" />
            <h4 className="text-xs font-bold">Failed to Load Chart</h4>
            <p className="text-3xs text-slate-500 dark:text-slate-500 mt-1">{error}</p>
          </div>
        ) : isEmpty ? (
          <EmptyState 
            title={emptyTitle} 
            description={emptyDescription} 
            icon={BarChart4} 
            className="w-full h-full border-none bg-transparent"
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartCard;
