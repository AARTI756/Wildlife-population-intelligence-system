import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden animate-pulse">
      <div className="bg-slate-50 dark:bg-slate-950/60 h-12 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 gap-4">
        {Array.from({ length: cols }).map((_, idx) => (
          <div key={idx} className="h-4 bg-slate-200 dark:bg-slate-800 rounded flex-1"></div>
        ))}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="h-16 flex items-center px-6 gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div key={cIdx} className="h-3.5 bg-slate-100 dark:bg-slate-850 rounded flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="glass-card p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-6 w-12 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
            <div className="h-6 w-40 bg-slate-250 dark:bg-slate-750 rounded-lg"></div>
            <div className="space-y-2 mt-4">
              <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div>
              <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-5/6"></div>
              <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-2/3"></div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between">
            <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
            <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const FormSkeleton = () => {
  return (
    <div className="glass-card p-6 space-y-6 animate-pulse">
      <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      <div className="grid grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="space-y-2 col-span-2 sm:col-span-1">
            <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"></div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-slate-250 dark:bg-slate-750 rounded"></div>
        <div className="h-8 w-64 bg-slate-250 dark:bg-slate-750 rounded"></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="glass-card p-5 h-20 flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-6 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
